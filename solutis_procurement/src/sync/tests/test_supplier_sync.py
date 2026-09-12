"""
Tests for SupplierSyncService and CSV loading.
"""

from unittest.mock import MagicMock

import pytest
from src.supplier.enums import DomPendecyTypeEnum
from src.supplier.models.domain import (
    DomCategory,
    DomClassification,
    DomPendencyType,
    DomRiskLevel,
    DomSupplierSituation,
    DomTypeSupplier,
)
from src.sync.dto import SupplierTotvsDTO
from src.sync.services.supplier_sync import SupplierSyncService


@pytest.fixture
def mock_db_service():
    """Mock database connection service."""
    service = MagicMock()
    cursor = MagicMock()
    service.get_cursor.return_value = cursor
    return service


@pytest.fixture(autouse=True)
def setup_supplier_domains(db):
    """Setup domain entities required by Supplier signals and foreign keys."""
    DomCategory.objects.get_or_create(id=1, defaults={"name": "PESSOA JURÍDICA"})
    DomCategory.objects.get_or_create(id=2, defaults={"name": "PESSOA FÍSICA"})
    DomClassification.objects.get_or_create(id=1, defaults={"name": "PADRÃO"})

    for pendency_id, name in [
        (DomPendecyTypeEnum.PENDENCIA_CADASTRO.value, "PENDÊNCIA DE CADASTRO"),
        (DomPendecyTypeEnum.PENDENCIA_DOCUMENTACAO.value, "PENDÊNCIA DE DOCUMENTAÇÃO"),
        (
            DomPendecyTypeEnum.PENDENCIA_MATRIZ_RESPONSABILIDADE.value,
            "PENDÊNCIA MATRIZ DE RESPONSABILIDADE",
        ),
        (DomPendecyTypeEnum.PENDENCIA_AVALIACAO.value, "PENDÊNCIA DE AVALIAÇÃO"),
    ]:
        DomPendencyType.objects.get_or_create(id=pendency_id, defaults={"name": name})

    DomSupplierSituation.objects.get_or_create(name="ATIVO", pendency_type=None)
    for pendency_id in [
        DomPendecyTypeEnum.PENDENCIA_CADASTRO.value,
        DomPendecyTypeEnum.PENDENCIA_DOCUMENTACAO.value,
        DomPendecyTypeEnum.PENDENCIA_MATRIZ_RESPONSABILIDADE.value,
        DomPendecyTypeEnum.PENDENCIA_AVALIACAO.value,
    ]:
        DomSupplierSituation.objects.get_or_create(
            name="PENDENTE", pendency_type_id=pendency_id
        )


@pytest.mark.django_db
class TestSupplierSyncCSV:
    """Test suite for CSV loading in SupplierSyncService."""

    def test_load_suppliers_from_default_csv(self, mock_db_service):
        """Test that default CSV file is successfully loaded."""
        sync_service = SupplierSyncService(mock_db_service)

        # 41 suppliers with valid CNPJ loaded
        assert len(sync_service._risk_mapping) == 41
        assert len(sync_service._name_mapping) == 41

        # Check known suppliers from user list
        assert sync_service._risk_mapping["30.491.362/0001-93"] == "BAIXO"
        assert (
            sync_service._name_mapping["30.491.362/0001-93"]
            == "30.491.362 ANTONIO JORGE CARDOSO PALMA"
        )

        assert sync_service._risk_mapping["18.033.552/0001-61"] == "BAIXO"
        assert sync_service._name_mapping["18.033.552/0001-61"] == "99 TECNOLOGIA LTDA"

        assert sync_service._risk_mapping["12.499.520/0001-70"] == "BAIXO"
        assert (
            sync_service._name_mapping["12.499.520/0001-70"]
            == "CLICKSIGN GESTAO DE DOCUMENTOS S/A"
        )

        assert sync_service._risk_mapping["59.531.496/0001-72"] == "BAIXO"
        assert sync_service._name_mapping["59.531.496/0001-72"] == "OLIVA"

        assert sync_service._risk_mapping["71.208.516/0001-74"] == "MÉDIO"
        assert sync_service._name_mapping["71.208.516/0001-74"] == "ALGAR"

        assert sync_service._risk_mapping["02.558.157/0001-62"] == "MÉDIO"
        assert (
            sync_service._name_mapping["02.558.157/0001-62"] == "Telefônica Brasil S.A"
        )

    def test_load_suppliers_from_custom_csv_comma(self, tmp_path, mock_db_service):
        """Test loading from a custom CSV with comma delimiter and custom column names."""
        custom_csv = tmp_path / "custom_suppliers.csv"
        custom_csv.write_text(
            "nome,cnpj,grau_de_risco\n"
            "EMPRESA ALFA,11.222.333/0001-44,ALTO\n"
            "EMPRESA BETA,55.666.777/0001-88,MEDIO\n",
            encoding="utf-8",
        )

        sync_service = SupplierSyncService(mock_db_service, csv_path=custom_csv)

        assert len(sync_service._risk_mapping) == 2
        assert sync_service._risk_mapping["11.222.333/0001-44"] == "ALTO"
        assert sync_service._name_mapping["11.222.333/0001-44"] == "EMPRESA ALFA"

        assert sync_service._risk_mapping["55.666.777/0001-88"] == "MÉDIO"
        assert sync_service._name_mapping["55.666.777/0001-88"] == "EMPRESA BETA"

    def test_load_suppliers_from_custom_csv_semicolon(self, tmp_path, mock_db_service):
        """Test loading from a custom CSV with semicolon delimiter."""
        custom_csv = tmp_path / "custom_suppliers_semi.csv"
        custom_csv.write_text(
            "razao_social;tax_id;grau_risco\n"
            "FORNECEDOR TESTE;99.888.777/0001-66;BAIXO\n",
            encoding="utf-8",
        )

        sync_service = SupplierSyncService(mock_db_service, csv_path=custom_csv)

        assert "99.888.777/0001-66" in sync_service._risk_mapping
        assert sync_service._risk_mapping["99.888.777/0001-66"] == "BAIXO"
        assert sync_service._name_mapping["99.888.777/0001-66"] == "FORNECEDOR TESTE"

    def test_fetch_suppliers_queries_using_csv_cnpjs(self, tmp_path, mock_db_service):
        """Test that query sent to TOTVS contains CNPJs from CSV."""
        custom_csv = tmp_path / "suppliers.csv"
        custom_csv.write_text(
            "nome,cnpj,grau_de_risco\nTESTE A,12.345.678/0001-90,BAIXO\n",
            encoding="utf-8",
        )

        sync_service = SupplierSyncService(mock_db_service, csv_path=custom_csv)
        cursor = mock_db_service.get_cursor.return_value
        cursor.fetchall.return_value = []

        dtos = sync_service._fetch_suppliers_from_totvs()
        assert dtos == []

        # Verify query was executed with the tax id
        cursor.execute.assert_called_once()
        query_executed = cursor.execute.call_args[0][0]
        assert "'12.345.678/0001-90'" in query_executed

    def test_create_and_update_supplier_applies_csv_data(
        self, tmp_path, mock_db_service
    ):
        """Test that creating and updating suppliers uses the CSV risk level and names."""
        DomRiskLevel.objects.get_or_create(name="ALTO")
        DomRiskLevel.objects.get_or_create(name="BAIXO")
        DomTypeSupplier.objects.get_or_create(name="COMERCIO")

        custom_csv = tmp_path / "suppliers.csv"
        custom_csv.write_text(
            "nome,cnpj,grau_de_risco\nFORNECEDOR CSV NOME,04.699.639/0001-68,ALTO\n",
            encoding="utf-8",
        )

        sync_service = SupplierSyncService(mock_db_service, csv_path=custom_csv)
        sync_service._fetch_supplier_type = MagicMock(
            return_value=MagicMock(description="COMERCIO")
        )
        sync_service._create_supplier_payment_data = MagicMock(return_value=None)
        sync_service._update_supplier_payment_data = MagicMock(return_value=None)

        supplier_dto = SupplierTotvsDTO(
            code="123",
            trade_name="",
            legal_name="",
            tax_id="04.699.639/0001-68",
            email="fornecedor@teste.com",
            phone="71999999999",
            street="Rua Teste",
            city="Salvador",
            state="BA",
            neighborhood="Centro",
            number=100,
            postal_code="40000000",
            complement="",
            type_supplier_code="001",
            category="J",
            municipal_registration="123",
            state_registration="456",
            active=1,
            contact_name="Contato",
        )

        # Create
        created = sync_service._create_supplier(supplier_dto)
        assert created.legal_name == "FORNECEDOR CSV NOME"
        assert created.trade_name == "FORNECEDOR CSV NOME"
        assert created.risk_level.name == "ALTO"

        # Update
        supplier_dto.trade_name = "Nome Atualizado TOTVS"
        sync_service._update_supplier(created, supplier_dto)
        created.refresh_from_db()
        assert created.trade_name == "Nome Atualizado TOTVS"
        assert created.risk_level.name == "ALTO"
