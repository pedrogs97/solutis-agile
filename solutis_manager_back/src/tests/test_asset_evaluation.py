"""Tests for Asset Technical Evaluation Module (FO-PAT-02)"""

from datetime import datetime

import pytest
from src.asset.enums import AssetStatusEnum
from src.asset.models import AssetModel, AssetStatusModel, AssetTypeModel
from src.asset_evaluation.models import AssetCatalogComponentModel
from src.asset_evaluation.schemas import (
    AssetEvaluationApproveSchema,
    AssetEvaluationCreateSchema,
    AssetEvaluationUpdateSchema,
    ComponentItemSchema,
)
from src.asset_evaluation.service import AssetEvaluationService
from src.config import BASE_API, PASSWORD_SUPER_USER
from src.tests.base import TestBase


class TestAssetEvaluationModule(TestBase):
    """Suíte de testes para o módulo de avaliação técnica de patrimônio (FO-PAT-02)."""

    @pytest.fixture
    def auth_headers(self, setup, create_initial_data):
        """Retorna os cabeçalhos de autenticação para as requisições de API."""
        response = self.client.post(
            f"{BASE_API}/auth/login/",
            data={"username": "agile_admin", "password": PASSWORD_SUPER_USER},
        )
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}

    @pytest.fixture
    def sample_asset(self, setup, create_initial_data):
        """Cria um ativo de teste no banco de dados."""
        db = self.testing_session_local()
        asset_type = db.query(AssetTypeModel).filter_by(
            code="NB01"
        ).first() or db.merge(
            AssetTypeModel(code="NB01", name="NOTEBOOK", acronym="NB")
        )
        status_disp = db.query(AssetStatusModel).filter_by(id=1).first() or db.merge(
            AssetStatusModel(id=1, name="Disponível")
        )
        _ = db.query(AssetStatusModel).filter_by(
            id=AssetStatusEnum.DESCARTE.value
        ).first() or db.merge(
            AssetStatusModel(id=AssetStatusEnum.DESCARTE.value, name="Descarte")
        )
        db.commit()

        asset = AssetModel(
            code="AST-0001",
            register_number="PAT-123456",
            description="Notebook Dell Latitude 5420",
            brand="Dell",
            model="Latitude 5420",
            serial_number="BR12345678",
            value=4500.0,
            active=True,
            type=asset_type,
            status=status_disp,
        )
        db.add(asset)
        db.commit()
        db.refresh(asset)
        asset_id = asset.id
        db.close()
        return asset_id

    # -------------------------------------------------------------
    # Testes Unitários de Serviço
    # -------------------------------------------------------------

    def test_generate_protocol_format(self, setup, create_initial_data):
        """Gera protocolo no formato FO-PAT-02-YYYYMMDD-XXXX."""
        service = AssetEvaluationService()
        db = self.testing_session_local()
        protocol = service.generate_protocol(db)

        now_ymd = datetime.now().strftime("%Y%m%d")
        assert protocol.startswith(f"FO-PAT-02-{now_ymd}-")
        assert len(protocol.split("-")) == 5
        db.close()

    def test_create_evaluation_and_automatic_calculations(
        self, setup, create_initial_data
    ):
        """Valida criação e cálculos automáticos ESG e financeiro."""
        service = AssetEvaluationService()
        db = self.testing_session_local()

        payload = AssetEvaluationCreateSchema(
            patrimonio="PAT-9999",
            brand_model="Lenovo ThinkPad",
            gross_weight=10.0,
            reused_weight=6.0,
            discarded_weight=4.0,
            net_book_value=2000.0,
            destination=["Reaproveitamento interno", "Descarte"],
            components=[
                ComponentItemSchema(
                    name="Memória RAM 16GB",
                    quantity=2,
                    condition="Boa",
                    destination="Reaproveitamento interno",
                )
            ],
            new_components_for_catalog=["Bateria Extra Especial"],
        )

        evaluation = service.create_evaluation(db, payload)
        assert evaluation.protocol.startswith("FO-PAT-02-")
        assert evaluation.reuse_percentage == 60.0  # (6 / 10) * 100
        assert evaluation.estimated_economy == 1200.0  # 2000 * 0.60
        assert len(evaluation.components) == 1
        assert evaluation.components[0].name == "Memória RAM 16GB"

        # Verifica se o componente inédito foi salvo no catálogo
        cat = (
            db.query(AssetCatalogComponentModel)
            .filter(AssetCatalogComponentModel.name == "Bateria Extra Especial")
            .first()
        )
        assert cat is not None
        db.close()

    def test_create_evaluation_autofill_from_asset(
        self, setup, create_initial_data, sample_asset
    ):
        """Valida autopreenchimento de dados a partir do AssetModel."""
        service = AssetEvaluationService()
        db = self.testing_session_local()

        payload = AssetEvaluationCreateSchema(
            asset_id=sample_asset,
            gross_weight=2.5,
            reused_weight=1.25,
            net_book_value=1000.0,
        )

        evaluation = service.create_evaluation(db, payload)
        assert evaluation.patrimonio == "PAT-123456"
        assert evaluation.brand_model == "Dell Latitude 5420"
        assert evaluation.serial_number == "BR12345678"
        assert evaluation.acquisition_value == 4500.0
        assert evaluation.reuse_percentage == 50.0
        assert evaluation.estimated_economy == 500.0
        db.close()

    def test_update_evaluation_recalculates_metrics(self, setup, create_initial_data):
        """Valida recálculo dinâmico ao atualizar pesos e valor contábil."""
        service = AssetEvaluationService()
        db = self.testing_session_local()

        payload = AssetEvaluationCreateSchema(
            patrimonio="PAT-RECALC",
            gross_weight=10.0,
            reused_weight=2.0,
            net_book_value=1000.0,
        )
        evaluation = service.create_evaluation(db, payload)
        assert evaluation.reuse_percentage == 20.0
        assert evaluation.estimated_economy == 200.0

        update_payload = AssetEvaluationUpdateSchema(
            reused_weight=8.0,
            net_book_value=3000.0,
        )
        updated = service.update_evaluation(db, evaluation.id, update_payload)
        assert updated.reuse_percentage == 80.0
        assert updated.estimated_economy == 2400.0
        db.close()

    def test_approve_evaluation_writes_off_asset(
        self, setup, create_initial_data, sample_asset
    ):
        """Valida aprovação com baixa real do ativo (active=False e status=DESCARTE)."""
        service = AssetEvaluationService()
        db = self.testing_session_local()

        payload = AssetEvaluationCreateSchema(
            asset_id=sample_asset,
            gross_weight=3.0,
            reused_weight=0.0,
            discarded_weight=3.0,
        )
        evaluation = service.create_evaluation(db, payload)
        assert evaluation.status == "Rascunho"

        approve_payload = AssetEvaluationApproveSchema(
            comments="Equipamento obsoleto, baixa autorizada",
            write_off_asset=True,
        )
        approved = service.approve_evaluation(db, evaluation.id, approve_payload)
        assert approved.status == "Baixado"
        assert approved.approval_comments == "Equipamento obsoleto, baixa autorizada"

        # Verifica o ativo no banco
        asset = db.query(AssetModel).filter(AssetModel.id == sample_asset).first()
        assert asset.active is False
        assert asset.status_id == AssetStatusEnum.DESCARTE.value
        db.close()

    def test_get_metrics_dashboard(self, setup, create_initial_data):
        """Valida as métricas consolidadas do Painel Executivo."""
        service = AssetEvaluationService()
        db = self.testing_session_local()

        # Criar duas avaliações
        p1 = AssetEvaluationCreateSchema(
            patrimonio="P1",
            gross_weight=10.0,
            reused_weight=8.0,
            discarded_weight=2.0,
            recycle_weight=1.0,
            net_book_value=1000.0,
            status="Aprovado",
            destination=["Reaproveitamento interno"],
        )
        p2 = AssetEvaluationCreateSchema(
            patrimonio="P2",
            gross_weight=5.0,
            reused_weight=1.0,
            discarded_weight=4.0,
            recycle_weight=2.0,
            net_book_value=500.0,
            status="Baixado",
            destination=["Descarte"],
        )
        service.create_evaluation(db, p1)
        service.create_evaluation(db, p2)

        metrics = service.get_metrics(db)
        assert metrics.total_evaluations >= 2
        assert metrics.total_reused_weight >= 9.0
        assert metrics.total_discarded_weight >= 6.0
        assert metrics.total_recycle_weight >= 3.0
        assert metrics.total_estimated_economy >= 900.0
        db.close()

    def test_get_metrics_empty_table(self, setup, create_initial_data):
        """Valida que get_metrics lida perfeitamente com tabela vazia sem lançar exceções."""
        service = AssetEvaluationService()
        db = self.testing_session_local()
        # Sem criar nenhuma avaliação, as agregações retornam None no SQL
        metrics = service.get_metrics(db)
        assert metrics.total_evaluations >= 0
        assert metrics.total_reused_weight >= 0.0
        assert metrics.total_discarded_weight >= 0.0
        assert metrics.total_recycle_weight >= 0.0
        assert metrics.average_reuse_percentage >= 0.0
        assert metrics.total_estimated_economy >= 0.0
        db.close()

    # -------------------------------------------------------------
    # Testes de Endpoints HTTP (Router Integration)
    # -------------------------------------------------------------

    def test_api_get_catalog_components(self, auth_headers):
        """Testa endpoint GET /v1/asset-evaluations/components/catalog/."""
        response = self.client.get(
            f"{BASE_API}/asset-evaluations/components/catalog/",
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        names = [item["name"] for item in data]
        assert "RAM" in names
        assert "SSD" in names

    def test_api_post_catalog_component(self, auth_headers):
        """Testa endpoint POST /v1/asset-evaluations/components/catalog/."""
        response = self.client.post(
            f"{BASE_API}/asset-evaluations/components/catalog/",
            headers=auth_headers,
            json={"name": "Display LCD IPS 15.6"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Display LCD IPS 15.6"
        assert "id" in data

    def test_api_crud_flow_evaluation(self, auth_headers, sample_asset):
        """Testa o fluxo completo de CRUD via API REST."""
        # 1. Criação (POST /)
        create_payload = {
            "asset_id": sample_asset,
            "gross_weight": 8.0,
            "reused_weight": 4.0,
            "discarded_weight": 4.0,
            "net_book_value": 1500.0,
            "destination": ["Reaproveitamento interno"],
            "components": [
                {
                    "name": "SSD 512GB",
                    "quantity": 1,
                    "condition": "Boa",
                    "destination": "Reaproveitamento interno",
                }
            ],
        }
        create_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert create_resp.status_code == 201
        created_data = create_resp.json()
        eval_id = created_data["id"]
        assert created_data["reuse_percentage"] == 50.0
        assert created_data["estimated_economy"] == 750.0

        # 2. Obtenção por ID (GET /{id}/)
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == eval_id

        # 3. Listagem com paginação e busca (GET /)
        list_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/?search=PAT-123456",
            headers=auth_headers,
        )
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert list_data["total"] >= 1
        assert any(item["id"] == eval_id for item in list_data["items"])

        # 4. Atualização parcial (PATCH /{id}/)
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json={"justification": "Avaliação revisada pela auditoria"},
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["justification"] == "Avaliação revisada pela auditoria"

        # 5. Métricas do Painel Executivo (GET /metrics/)
        metrics_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/metrics/",
            headers=auth_headers,
        )
        assert metrics_resp.status_code == 200
        metrics_data = metrics_resp.json()
        assert "total_evaluations" in metrics_data

        # 6. Aprovação (POST /{id}/approve/)
        approve_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/{eval_id}/approve/",
            headers=auth_headers,
            json={"comments": "Aprovado em colegiado", "write_off_asset": True},
        )
        assert approve_resp.status_code == 200
        assert approve_resp.json()["status"] == "Baixado"

    def test_document_control_metadata_persistence(
        self, setup, create_initial_data, auth_headers
    ):
        """Valida que todos os campos de Controle do Documento são persistidos e atualizados via API."""
        create_payload = {
            "patrimonio": "PAT-DOC-01",
            "asset_type_name": "Servidor",
            "document_start_date": "2026-01-01T00:00:00",
            "document_end_date": "2026-12-31T23:59:59",
            "document_classification": "USO INTERNO",
            "elaborated_by_date": "2026-01-05T10:00:00",
            "reviewed_by_date": "2026-01-10T14:30:00",
            "approved_by_date": "2026-01-15T16:00:00",
        }

        # 1. Criação via POST
        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]
        assert created["document_classification"] == "USO INTERNO"
        assert "2026-01-01" in created["document_start_date"]
        assert "2026-12-31" in created["document_end_date"]
        assert "2026-01-05" in created["elaborated_by_date"]
        assert "2026-01-10" in created["reviewed_by_date"]
        assert "2026-01-15" in created["approved_by_date"]

        # 2. Obtenção via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["document_classification"] == "USO INTERNO"
        assert "2026-01-01" in data["document_start_date"]

        # 3. Atualização via PATCH (alterando classificação e datas)
        patch_payload = {
            "document_classification": "CONFIDENCIAL",
            "document_end_date": "2027-06-30T00:00:00",
            "approved_by_date": "2026-02-01T11:00:00",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["document_classification"] == "CONFIDENCIAL"
        assert "2027-06-30" in patched["document_end_date"]
        assert "2026-02-01" in patched["approved_by_date"]

        # 4. Envio de string vazia em datas opcionais (deve converter para None)
        patch_empty_dates = {
            "document_end_date": "",
            "approved_by_date": None,
        }
        patch_resp2 = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_empty_dates,
        )
        assert patch_resp2.status_code == 200
        patched2 = patch_resp2.json()
        assert patched2["document_end_date"] is None
        assert patched2["approved_by_date"] is None

    def test_asset_identification_fields_persistence(self, auth_headers):
        """Valida a persistência, recuperação e atualização de todos os campos de Identificação do Ativo."""
        create_payload = {
            "patrimonio": "PAT-IDE-1234",
            "asset_type_name": "Notebook",
            "manufacturer": "Dell",
            "model": "Latitude 5420",
            "serial_number": "SN987654321",
            "cost_center": "TI - Infraestrutura",
            "unity": "Matriz Salvador",
            "current_location": "Depósito TI — Sala 3",
            "evaluation_date": "2026-09-09T14:30:00",
            "evaluator_name": "Carlos Engenheiro",
            "is_under_warranty": True,
            "warranty_expiry_date": "2027-12-31T00:00:00",
            "asset_description": "Notebook com tela trincada, acompanha carregador original.",
            "gross_weight": 2.5,
            "net_book_value": 3500.0,
        }

        # 1. Criação via POST
        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]

        assert created["patrimonio"] == "PAT-IDE-1234"
        assert created["asset_type_name"] == "Notebook"
        assert created["manufacturer"] == "Dell"
        assert created["model"] == "Latitude 5420"
        assert created["brand_model"] == "Dell Latitude 5420"
        assert created["serial_number"] == "SN987654321"
        assert created["cost_center"] == "TI - Infraestrutura"
        assert created["unity"] == "Matriz Salvador"
        assert created["current_location"] == "Depósito TI — Sala 3"
        assert "2026-09-09" in created["evaluation_date"]
        assert created["evaluator_name"] == "Carlos Engenheiro"
        assert created["is_under_warranty"] is True
        assert "2027-12-31" in created["warranty_expiry_date"]
        assert (
            created["asset_description"]
            == "Notebook com tela trincada, acompanha carregador original."
        )

        # 2. Obtenção via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["manufacturer"] == "Dell"
        assert fetched["model"] == "Latitude 5420"
        assert fetched["current_location"] == "Depósito TI — Sala 3"
        assert fetched["is_under_warranty"] is True

        # 3. Atualização via PATCH
        patch_payload = {
            "model": "Latitude 5430",
            "current_location": "Bancada Manutenção - Sala 5",
            "is_under_warranty": False,
            "warranty_expiry_date": None,
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["model"] == "Latitude 5430"
        assert patched["brand_model"] == "Dell Latitude 5430"
        assert patched["current_location"] == "Bancada Manutenção - Sala 5"
        assert patched["is_under_warranty"] is False
        assert patched["warranty_expiry_date"] is None

        # 4. String vazia em warranty_expiry_date é convertida para None
        patch_resp2 = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json={"warranty_expiry_date": ""},
        )
        assert patch_resp2.status_code == 200
        assert patch_resp2.json()["warranty_expiry_date"] is None

    def test_technical_evaluation_section_persistence(self, auth_headers):
        """Valida a persistência, recuperação e atualização de todos os campos da Seção 2 (Avaliação Técnica & Diagnóstico)."""
        create_payload = {
            "patrimonio": "PAT-TEC-2026",
            "asset_type_name": "Notebook",
            "classification": "Bom",
            "feasibility": "Alta",
            "destination": ["Reaproveitamento interno", "Aproveitamento parcial"],
            "technical_opinion": "Placa-mãe testada com sucesso. Memória RAM reaproveitável.",
            "gross_weight": 2.0,
            "net_book_value": 1200.0,
        }

        # 1. Criação via POST
        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]

        assert created["classification"] == "Bom"
        assert created["feasibility"] == "Alta"
        assert set(created["destination"]) == {
            "Reaproveitamento interno",
            "Aproveitamento parcial",
        }
        assert (
            created["technical_opinion"]
            == "Placa-mãe testada com sucesso. Memória RAM reaproveitável."
        )
        # Sincronização automática com justification
        assert (
            created["justification"]
            == "Placa-mãe testada com sucesso. Memória RAM reaproveitável."
        )

        # 2. Obtenção via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["classification"] == "Bom"
        assert fetched["feasibility"] == "Alta"
        assert set(fetched["destination"]) == {
            "Reaproveitamento interno",
            "Aproveitamento parcial",
        }
        assert (
            fetched["technical_opinion"]
            == "Placa-mãe testada com sucesso. Memória RAM reaproveitável."
        )

        # 3. Atualização via PATCH (alterando classificação, viabilidade, destinos e parecer)
        patch_payload = {
            "classification": "Irrecuperável",
            "feasibility": "Inviável",
            "destination": ["Descarte", "Reciclagem"],
            "technical_opinion": "Curto circuito irreversível no circuito de alimentação e chipset danificado.",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["classification"] == "Irrecuperável"
        assert patched["feasibility"] == "Inviável"
        assert set(patched["destination"]) == {"Descarte", "Reciclagem"}
        assert (
            patched["technical_opinion"]
            == "Curto circuito irreversível no circuito de alimentação e chipset danificado."
        )
        assert (
            patched["justification"]
            == "Curto circuito irreversível no circuito de alimentação e chipset danificado."
        )

    def test_esg_weight_section_persistence(
        self, setup, create_initial_data, auth_headers
    ):
        """Valida persistência e dinamismo completo da Seção 4 (ESG & controle de peso)."""
        # 1. Criação via POST com os 9 campos da seção de ESG
        create_payload = {
            "patrimonio": "PAT-ESG-001",
            "asset_type_name": "Notebook",
            "gross_weight": 12.5,
            "reused_weight": 7.5,
            "discarded_weight": 3.0,
            "recycle_weight": 2.0,
            "destination_company": "ReciclaTI Soluções Ambientais Ltda",
            "destination_cnpj": "12.345.678/0001-90",
            "destination_certificate": "CERT-DEST-2026-0891",
            "waste_manifest": "MTR-BA-2026-9923",
        }

        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]

        assert created["gross_weight"] == 12.5
        assert created["reused_weight"] == 7.5
        assert created["discarded_weight"] == 3.0
        assert created["recycle_weight"] == 2.0
        assert created["reuse_percentage"] == 60.0
        assert created["destination_company"] == "ReciclaTI Soluções Ambientais Ltda"
        assert created["destination_cnpj"] == "12.345.678/0001-90"
        assert created["destination_certificate"] == "CERT-DEST-2026-0891"
        assert created["waste_manifest"] == "MTR-BA-2026-9923"

        # 2. Leitura via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["gross_weight"] == 12.5
        assert fetched["reused_weight"] == 7.5
        assert fetched["discarded_weight"] == 3.0
        assert fetched["recycle_weight"] == 2.0
        assert fetched["reuse_percentage"] == 60.0
        assert fetched["destination_company"] == "ReciclaTI Soluções Ambientais Ltda"
        assert fetched["destination_cnpj"] == "12.345.678/0001-90"
        assert fetched["destination_certificate"] == "CERT-DEST-2026-0891"
        assert fetched["waste_manifest"] == "MTR-BA-2026-9923"

        # 3. Atualização via PATCH
        patch_payload = {
            "reused_weight": 10.0,
            "discarded_weight": 1.5,
            "recycle_weight": 1.0,
            "destination_company": "EcoDescarte & Logística Reversa SA",
            "destination_cnpj": "98.765.432/0001-11",
            "destination_certificate": "CERT-DEST-2026-9999",
            "waste_manifest": "MTR-SP-2026-1111",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["gross_weight"] == 12.5
        assert patched["reused_weight"] == 10.0
        assert patched["discarded_weight"] == 1.5
        assert patched["recycle_weight"] == 1.0
        assert patched["reuse_percentage"] == 80.0
        assert patched["destination_company"] == "EcoDescarte & Logística Reversa SA"
        assert patched["destination_cnpj"] == "98.765.432/0001-11"
        assert patched["destination_certificate"] == "CERT-DEST-2026-9999"
        assert patched["waste_manifest"] == "MTR-SP-2026-1111"

    def test_financial_evaluation_section_persistence(
        self, setup, create_initial_data, auth_headers
    ):
        """Valida persistência e dinamismo completo da Seção 5 (Avaliação financeira)."""
        # 1. Criação via POST com todos os campos da avaliação financeira
        create_payload = {
            "patrimonio": "PAT-FIN-001",
            "asset_type_name": "Notebook",
            "acquisition_value": 5000.0,
            "net_book_value": 2000.0,
            "usage_time": "3 anos e 4 meses",
            "expected_lifespan": "5 anos",
            "gross_weight": 10.0,
            "reused_weight": 5.0,
            "discarded_weight": 5.0,
            "justification": "Substituição por obsolescência técnica. Custo de reparo excede valor residual.",
            "technical_opinion": "Placa-mãe danificada e bateria inchada.",
        }

        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]

        assert created["acquisition_value"] == 5000.0
        assert created["net_book_value"] == 2000.0
        assert created["usage_time"] == "3 anos e 4 meses"
        assert created["expected_lifespan"] == "5 anos"
        assert created["reuse_percentage"] == 50.0
        assert created["estimated_economy"] == 1000.0  # 2000 * 50%
        assert (
            created["justification"]
            == "Substituição por obsolescência técnica. Custo de reparo excede valor residual."
        )
        assert created["technical_opinion"] == "Placa-mãe danificada e bateria inchada."

        # 2. Leitura via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["acquisition_value"] == 5000.0
        assert fetched["net_book_value"] == 2000.0
        assert fetched["usage_time"] == "3 anos e 4 meses"
        assert fetched["expected_lifespan"] == "5 anos"
        assert fetched["reuse_percentage"] == 50.0
        assert fetched["estimated_economy"] == 1000.0
        assert (
            fetched["justification"]
            == "Substituição por obsolescência técnica. Custo de reparo excede valor residual."
        )
        assert fetched["technical_opinion"] == "Placa-mãe danificada e bateria inchada."

        # 3. Atualização via PATCH
        patch_payload = {
            "acquisition_value": 6000.0,
            "net_book_value": 3000.0,
            "usage_time": "4 anos",
            "expected_lifespan": "6 anos",
            "reused_weight": 8.0,
            "justification": "Decisão aprovada pelo comitê técnico.",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["acquisition_value"] == 6000.0
        assert patched["net_book_value"] == 3000.0
        assert patched["usage_time"] == "4 anos"
        assert patched["expected_lifespan"] == "6 anos"
        assert patched["reuse_percentage"] == 80.0
        assert patched["estimated_economy"] == 2400.0  # 3000 * 80%
        assert patched["justification"] == "Decisão aprovada pelo comitê técnico."
        assert patched["technical_opinion"] == "Placa-mãe danificada e bateria inchada."

    def test_asset_management_section_persistence(
        self, setup, create_initial_data, auth_headers
    ):
        """Valida persistência e dinamismo completo da Seção 7 (Gestão patrimonial - baixa em sistema)."""
        # 1. Criação via POST com os campos da gestão patrimonial
        create_payload = {
            "patrimonio": "PAT-MGT-001",
            "asset_type_name": "Desktop",
            "write_off_date": "2026-09-10T14:30:00",
            "write_off_reason": "Inviabilidade econômica de recuperação e obsolescência",
            "reused_parts_location": "Laboratório de Manutenção - Armário 04 / Gaveta 2",
            "waste_final_destination": "Descarte certificado via EcoRecicla",
            "write_off_notes": "Baixa patrimonial aprovada pelo gestor da área administrativa.",
        }

        post_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert post_resp.status_code == 201
        created = post_resp.json()
        eval_id = created["id"]

        assert created["write_off_date"] is not None
        assert "2026-09-10" in created["write_off_date"]
        assert (
            created["write_off_reason"]
            == "Inviabilidade econômica de recuperação e obsolescência"
        )
        assert (
            created["reused_parts_location"]
            == "Laboratório de Manutenção - Armário 04 / Gaveta 2"
        )
        assert (
            created["waste_final_destination"] == "Descarte certificado via EcoRecicla"
        )
        assert (
            created["write_off_notes"]
            == "Baixa patrimonial aprovada pelo gestor da área administrativa."
        )

        # 2. Leitura via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert "2026-09-10" in fetched["write_off_date"]
        assert (
            fetched["write_off_reason"]
            == "Inviabilidade econômica de recuperação e obsolescência"
        )
        assert (
            fetched["reused_parts_location"]
            == "Laboratório de Manutenção - Armário 04 / Gaveta 2"
        )
        assert (
            fetched["waste_final_destination"] == "Descarte certificado via EcoRecicla"
        )
        assert (
            fetched["write_off_notes"]
            == "Baixa patrimonial aprovada pelo gestor da área administrativa."
        )

        # 3. Atualização via PATCH
        patch_payload = {
            "write_off_reason": "Equipamento danificado irreparável pós-sinistro",
            "reused_parts_location": "Bancada Central de TI - Estoque B",
            "waste_final_destination": "Logística Reversa Fabricante",
            "write_off_notes": "Atualização de destinação conforme laudo complementar.",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert (
            patched["write_off_reason"]
            == "Equipamento danificado irreparável pós-sinistro"
        )
        assert patched["reused_parts_location"] == "Bancada Central de TI - Estoque B"
        assert patched["waste_final_destination"] == "Logística Reversa Fabricante"
        assert (
            patched["write_off_notes"]
            == "Atualização de destinação conforme laudo complementar."
        )

    def test_approvals_section_persistence(
        self, setup, create_initial_data, auth_headers
    ):
        """Valida persistência e dinamismo completo da Seção 8 (Validação & Aprovação Formal)."""
        # 1. Criação via POST com todos os campos da seção de aprovação
        create_payload = {
            "patrimonio": "PAT-APPR-001",
            "asset_type_name": "Notebook",
            "evaluator_name": "Carlos Técnico",
            "evaluation_date": "2026-09-09T14:30:00",
            "reviewer_name": "Mariana Gestora Patrimonial",
            "reviewed_by_date": "2026-09-09T15:00:00",
            "approver_name": "Roberto Diretor",
            "approval_date": "2026-09-09T16:00:00",
            "status": "Em Análise",
            "approval_comments": "Avaliação inicial aprovada para triagem patrimonial.",
        }
        create_resp = self.client.post(
            f"{BASE_API}/asset-evaluations/",
            headers=auth_headers,
            json=create_payload,
        )
        assert create_resp.status_code == 201
        created = create_resp.json()
        eval_id = created["id"]
        assert created["evaluator_name"] == "Carlos Técnico"
        assert created["reviewer_name"] == "Mariana Gestora Patrimonial"
        assert created["approver_name"] == "Roberto Diretor"
        assert "2026-09-09" in created["approval_date"]
        assert created["status"] == "Em Análise"
        assert (
            created["approval_comments"]
            == "Avaliação inicial aprovada para triagem patrimonial."
        )

        # 2. Leitura via GET
        get_resp = self.client.get(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
        )
        assert get_resp.status_code == 200
        fetched = get_resp.json()
        assert fetched["evaluator_name"] == "Carlos Técnico"
        assert fetched["reviewer_name"] == "Mariana Gestora Patrimonial"
        assert fetched["approver_name"] == "Roberto Diretor"
        assert "2026-09-09" in fetched["approval_date"]
        assert fetched["status"] == "Em Análise"
        assert (
            fetched["approval_comments"]
            == "Avaliação inicial aprovada para triagem patrimonial."
        )

        # 3. Atualização via PATCH
        patch_payload = {
            "reviewer_name": "Fernanda Revalidadora",
            "approver_name": "Dr. Arnaldo Superintendente",
            "status": "Aprovado",
            "approval_comments": "Homologação definitiva após revisão de inventário.",
        }
        patch_resp = self.client.patch(
            f"{BASE_API}/asset-evaluations/{eval_id}/",
            headers=auth_headers,
            json=patch_payload,
        )
        assert patch_resp.status_code == 200
        patched = patch_resp.json()
        assert patched["reviewer_name"] == "Fernanda Revalidadora"
        assert patched["approver_name"] == "Dr. Arnaldo Superintendente"
        assert patched["status"] == "Aprovado"
        assert (
            patched["approval_comments"]
            == "Homologação definitiva após revisão de inventário."
        )
