"""Unit tests for document signing (Clicksign integration and defensive validations)."""

from datetime import date
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from src.asset.models import AssetModel, AssetStatusModel, AssetTypeModel
from src.datasync.models import CostCenterTOTVSModel
from src.document.enums import DocumentTypeEnum
from src.document.models import DocumentModel, DocumentTypeModel
from src.document.service import DocumentService
from src.lending.models import LendingModel, LendingStatusModel, WitnessModel
from src.people.models import EmployeeModel
from src.tests.base import TestBase


class TestDocumentSign(TestBase):
    """Tests for DocumentService.sign_document error handling and flow."""

    @pytest.fixture
    def setup_data(self, setup, create_initial_data):
        db = self.testing_session_local()

        # Document types
        doc_type_contract = DocumentTypeModel(id=1, name="Contrato de Comodato")
        doc_type_term = DocumentTypeModel(id=2, name="Termo de Responsabilidade")
        doc_type_revoke_contract = DocumentTypeModel(id=3, name="Distrato de Comodato")
        doc_type_revoke_term = DocumentTypeModel(
            id=4, name="Distrato de Termo de Responsabilidade"
        )
        db.add_all(
            [
                doc_type_contract,
                doc_type_term,
                doc_type_revoke_contract,
                doc_type_revoke_term,
            ]
        )
        db.commit()

        # Base employee from create_base_employee
        base_emp = db.query(EmployeeModel).first()

        witness1_emp = EmployeeModel(
            role=base_emp.role,
            nationality=base_emp.nationality,
            marital_status=base_emp.marital_status,
            gender=base_emp.gender,
            full_name="Testemunha Um",
            registration="REG124",
            taxpayer_identification="12345678902",
            national_identification="12345678902",
            address="Rua Teste 1, 100",
            cell_phone="71999990001",
            birthday=date(1991, 2, 2),
            email="testemunha1@solutis.com.br",
        )
        witness2_emp = EmployeeModel(
            role=base_emp.role,
            nationality=base_emp.nationality,
            marital_status=base_emp.marital_status,
            gender=base_emp.gender,
            full_name="Testemunha Dois",
            registration="REG125",
            taxpayer_identification="12345678903",
            national_identification="12345678903",
            address="Rua Teste 2, 200",
            cell_phone="71999990002",
            birthday=date(1992, 3, 3),
            email="testemunha2@solutis.com.br",
        )
        db.add_all([witness1_emp, witness2_emp])
        db.commit()

        # Asset & Cost center
        cost_center = CostCenterTOTVSModel(
            code="CC01", name="Centro de Custo TI", classification="TI"
        )
        db.add(cost_center)
        status_active = LendingStatusModel(name="Ativo")
        db.add(status_active)
        asset_status = AssetStatusModel(name="Em Comodato")
        db.add(asset_status)
        asset_type = AssetTypeModel(name="Notebook", code="NOTE")
        db.add(asset_type)
        db.commit()

        asset = AssetModel(
            type_id=asset_type.id,
            description="Notebook Teste",
            register_number="NTK-1234",
            status_id=asset_status.id,
            serial_number="SN1234",
            code="NTK-1234",
        )
        db.add(asset)
        db.commit()

        return {
            "employee_id": base_emp.id,
            "witness1_emp_id": witness1_emp.id,
            "witness2_emp_id": witness2_emp.id,
            "asset_id": asset.id,
            "cost_center_id": cost_center.id,
            "status_active_id": status_active.id,
        }

    def test_sign_document_raises_404_when_document_not_found(self, setup):
        """Should raise 404 when document does not exist."""
        db = self.testing_session_local()
        service = DocumentService()

        with pytest.raises(HTTPException) as exc_info:
            service.sign_document(99999, db)

        assert exc_info.value.status_code == 404
        assert "não encontrado" in str(exc_info.value.detail).lower()

    def test_sign_document_raises_404_when_document_is_deleted(self, setup_data):
        """Should raise 404 when document is marked as deleted."""
        db = self.testing_session_local()
        service = DocumentService()

        deleted_doc = DocumentModel(
            path="/storage/deleted.pdf",
            file_name="deleted.pdf",
            doc_type_id=DocumentTypeEnum.LENDING,
            deleted=True,
        )
        db.add(deleted_doc)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.sign_document(deleted_doc.id, db)

        assert exc_info.value.status_code == 404
        assert "não encontrado" in str(exc_info.value.detail).lower()

    def test_sign_document_raises_404_when_lending_not_found(self, setup_data):
        """Should raise 404 instead of 500 when lending linked to document is None."""
        db = self.testing_session_local()
        service = DocumentService()

        orphan_doc = DocumentModel(
            path="/storage/orphan.pdf",
            file_name="orphan.pdf",
            doc_type_id=DocumentTypeEnum.LENDING,
            deleted=False,
        )
        db.add(orphan_doc)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.sign_document(orphan_doc.id, db)

        assert exc_info.value.status_code == 404
        assert "comodato" in str(exc_info.value.detail).lower()

    def test_sign_document_raises_404_when_term_not_found(self, setup_data):
        """Should raise 404 instead of 500 when term linked to document is None."""
        db = self.testing_session_local()
        service = DocumentService()

        orphan_term_doc = DocumentModel(
            path="/storage/orphan_term.pdf",
            file_name="orphan_term.pdf",
            doc_type_id=DocumentTypeEnum.TERM,
            deleted=False,
        )
        db.add(orphan_term_doc)
        db.commit()

        with pytest.raises(HTTPException) as exc_info:
            service.sign_document(orphan_term_doc.id, db)

        assert exc_info.value.status_code == 404
        assert "termo" in str(exc_info.value.detail).lower()

    def test_sign_document_success_when_lending_valid(self, setup_data):
        """Should successfully sign document and update envelope_id and sign_doc_id."""
        db = self.testing_session_local()
        service = DocumentService()

        mock_clicksign = MagicMock()
        mock_clicksign.send_document_to_sign.return_value = ("env-12345", "sign-67890")
        service.clicksign_service = mock_clicksign

        contract_doc = DocumentModel(
            path="/storage/valid_contract.pdf",
            file_name="valid_contract.pdf",
            doc_type_id=DocumentTypeEnum.LENDING,
            deleted=False,
        )
        db.add(contract_doc)
        db.commit()

        lending = LendingModel(
            employee_id=setup_data["employee_id"],
            asset_id=setup_data["asset_id"],
            cost_center_id=setup_data["cost_center_id"],
            document_id=contract_doc.id,
            status_id=setup_data["status_active_id"],
            signed_date=date.today(),
            manager="Gestor",
            number="COM-1234",
            signer_email="colaborador@solutis.com.br",
            principal_email_signer="gestor@solutis.com.br",
        )
        db.add(lending)
        db.commit()

        witness1 = WitnessModel(
            employee_id=setup_data["witness1_emp_id"],
            lending_id=lending.id,
        )
        witness2 = WitnessModel(
            employee_id=setup_data["witness2_emp_id"],
            lending_id=lending.id,
        )
        db.add_all([witness1, witness2])
        db.commit()

        # Call service
        service.sign_document(contract_doc.id, db)

        # Verify document updated
        db.refresh(contract_doc)
        assert contract_doc.sign_envelope_id == "env-12345"
        assert contract_doc.sign_doc_id == "sign-67890"
        mock_clicksign.send_document_to_sign.assert_called_once()
