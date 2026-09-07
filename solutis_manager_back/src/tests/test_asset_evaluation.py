"""Tests for Asset Technical Evaluation Module (FO-PAT-02)"""

from datetime import datetime
from io import BytesIO

import pytest
from src.asset.enums import AssetStatusEnum
from src.asset.models import AssetModel, AssetStatusModel, AssetTypeModel
from src.asset_evaluation.models import (
    AssetCatalogComponentModel,
    AssetTechnicalEvaluationModel,
)
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
        asset_type = AssetTypeModel(code="NB01", name="NOTEBOOK", acronym="NB")
        status_disp = AssetStatusModel(id=1, name="Disponível")
        status_descarte = AssetStatusModel(
            id=AssetStatusEnum.DESCARTE.value, name="Descarte"
        )

        db.merge(asset_type)
        db.merge(status_disp)
        db.merge(status_descarte)
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
