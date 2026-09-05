"""Unit tests for MASTER group permissions on lending contracts and revokes"""

from datetime import date
from io import BytesIO
import pytest
from fastapi import HTTPException
from fastapi.datastructures import UploadFile
from src.asset.enums import AssetStatusEnum
from src.asset.models import AssetModel, AssetStatusModel, AssetTypeModel
from src.auth.models import GroupModel, UserModel
from src.datasync.models import CostCenterTOTVSModel
from src.document.models import DocumentModel, DocumentTypeModel
from src.document.service import DocumentService
from src.lending.models import LendingModel, LendingStatusModel
from src.tests.base import TestBase


class TestDocumentMasterPermissions(TestBase):
    """Tests that only MASTER users can alter or delete uploaded contract and revoke documents."""

    @pytest.fixture
    def setup_data(self, setup, create_initial_data):
        db = self.testing_session_local()

        # Groups
        master_group = GroupModel(name="MASTER")
        regular_group = GroupModel(name="OPERADOR")
        db.add(master_group)
        db.add(regular_group)
        db.commit()

        # Users
        master_user = UserModel(
            username="user_master",
            email="master@solutis.com.br",
            password="hash",
            group=master_group,
            group_id=master_group.id,
            department="TI",
            manager="Gestor",
        )
        regular_user = UserModel(
            username="user_regular",
            email="regular@solutis.com.br",
            password="hash",
            group=regular_group,
            group_id=regular_group.id,
            department="TI",
            manager="Gestor",
        )
        db.add(master_user)
        db.add(regular_user)

        # Document types
        doc_type_contract = DocumentTypeModel(name="Contrato de Comodato")
        doc_type_revoke = DocumentTypeModel(name="Distrato de Comodato")
        db.add(doc_type_contract)
        db.add(doc_type_revoke)

        # Lending Statuses
        status_pending = LendingStatusModel(id=1, name="Arquivo pendente")
        status_active = LendingStatusModel(id=2, name="Ativo")
        status_revoke_pending = LendingStatusModel(
            id=3, name="Arquivo de distrato pendente"
        )
        status_revoke_done = LendingStatusModel(id=4, name="Distrato realizado")
        db.add(status_pending)
        db.add(status_active)
        db.add(status_revoke_pending)
        db.add(status_revoke_done)

        # Asset Statuses
        asset_status_available = AssetStatusModel(
            id=AssetStatusEnum.DISPONIVEL.value, name="Disponível"
        )
        asset_status_lending = AssetStatusModel(
            id=AssetStatusEnum.EM_COMODATO.value, name="Em Comodato"
        )
        db.add(asset_status_available)
        db.add(asset_status_lending)

        # Cost center and Asset
        cost_center = CostCenterTOTVSModel(
            code="CC01",
            name="Centro de Custo Teste",
            classification="TI",
        )
        db.add(cost_center)

        asset_type = AssetTypeModel(name="Notebook", code="NOTE")
        db.add(asset_type)
        db.commit()

        asset = AssetModel(
            type_id=asset_type.id,
            description="Dell Latitude Teste",
            register_number="NOT-9999",
            status_id=asset_status_lending.id,
            serial_number="SN9999",
            code="NOT-9999",
        )
        db.add(asset)
        db.commit()

        # Documents
        contract_doc = DocumentModel(
            path="/storage/test_contract.pdf",
            file_name="test_contract.pdf",
            doc_type=doc_type_contract,
            deleted=False,
        )
        revoke_doc = DocumentModel(
            path="/storage/test_revoke.pdf",
            file_name="test_revoke.pdf",
            doc_type=doc_type_revoke,
            deleted=False,
        )
        db.add(contract_doc)
        db.add(revoke_doc)
        db.commit()

        # Lending
        lending = LendingModel(
            employee_id=1,
            asset_id=asset.id,
            cost_center_id=cost_center.id,
            document_id=contract_doc.id,
            document_revoke_id=revoke_doc.id,
            status_id=status_active.id,
            signed_date=date.today(),
            revoke_signed_date=date.today(),
            manager="Gestor Teste",
            number="COM-9999",
        )
        db.add(lending)
        db.commit()
        master_id = master_user.id
        regular_id = regular_user.id
        lending_id = lending.id
        contract_id = contract_doc.id
        revoke_id = revoke_doc.id
        db.close()

        return {
            "master_user_id": master_id,
            "regular_user_id": regular_id,
            "lending_id": lending_id,
            "contract_doc_id": contract_id,
            "revoke_doc_id": revoke_id,
        }

    def test_regular_user_cannot_delete_contract_document(self, setup_data):
        db = self.testing_session_local()
        service = DocumentService()
        regular_user = db.query(UserModel).get(setup_data["regular_user_id"])

        with pytest.raises(HTTPException) as exc_info:
            service.delete_contract_document(setup_data["lending_id"], db, regular_user)

        assert exc_info.value.status_code == 403
        assert "Apenas usuários do grupo MASTER" in exc_info.value.detail
        db.close()

    def test_regular_user_cannot_delete_revoke_document(self, setup_data):
        db = self.testing_session_local()
        service = DocumentService()
        regular_user = db.query(UserModel).get(setup_data["regular_user_id"])

        with pytest.raises(HTTPException) as exc_info:
            service.delete_revoke_contract_document(
                setup_data["lending_id"], db, regular_user
            )

        assert exc_info.value.status_code == 403
        assert "Apenas usuários do grupo MASTER" in exc_info.value.detail
        db.close()

    def test_master_user_can_delete_contract_document_with_soft_delete(
        self, setup_data
    ):
        db = self.testing_session_local()
        service = DocumentService()
        master_user = db.query(UserModel).get(setup_data["master_user_id"])

        result = service.delete_contract_document(
            setup_data["lending_id"], db, master_user
        )
        assert result["message"] == "Documento de comodato removido com sucesso."

        # Verify SoftDelete
        old_doc = db.query(DocumentModel).get(setup_data["contract_doc_id"])
        assert old_doc.deleted is True

        # Verify lending updated
        lending = db.query(LendingModel).get(setup_data["lending_id"])
        assert lending.document is None
        assert lending.document_id is None
        assert lending.signed_date is None
        assert lending.status.name == "Arquivo pendente"
        db.close()

    def test_master_user_can_delete_revoke_document_with_soft_delete(self, setup_data):
        db = self.testing_session_local()
        service = DocumentService()
        master_user = db.query(UserModel).get(setup_data["master_user_id"])

        result = service.delete_revoke_contract_document(
            setup_data["lending_id"], db, master_user
        )
        assert result["message"] == "Documento de distrato removido com sucesso."

        # Verify SoftDelete
        old_doc = db.query(DocumentModel).get(setup_data["revoke_doc_id"])
        assert old_doc.deleted is True

        # Verify lending updated
        lending = db.query(LendingModel).get(setup_data["lending_id"])
        assert lending.document_revoke is None
        assert lending.document_revoke_id is None
        assert lending.revoke_signed_date is None
        assert lending.status.name == "Arquivo de distrato pendente"

        # Verify asset reverted to EM_COMODATO
        assert lending.asset.status_id == AssetStatusEnum.EM_COMODATO.value
        db.close()

    @pytest.mark.asyncio
    async def test_regular_user_cannot_overwrite_contract_document(self, setup_data):
        db = self.testing_session_local()
        service = DocumentService()
        regular_user = db.query(UserModel).get(setup_data["regular_user_id"])

        fake_file = UploadFile(
            filename="novo_contrato.pdf", file=BytesIO(b"%PDF-1.4 test content")
        )

        with pytest.raises(HTTPException) as exc_info:
            await service.upload_contract(
                fake_file,
                "Contrato de Comodato",
                setup_data["lending_id"],
                db,
                regular_user,
            )

        assert exc_info.value.status_code == 403
        assert "Apenas usuários do grupo MASTER" in exc_info.value.detail
        db.close()

    @pytest.mark.asyncio
    async def test_regular_user_cannot_overwrite_revoke_document(self, setup_data):
        db = self.testing_session_local()
        service = DocumentService()
        regular_user = db.query(UserModel).get(setup_data["regular_user_id"])

        fake_file = UploadFile(
            filename="novo_distrato.pdf", file=BytesIO(b"%PDF-1.4 test content")
        )

        with pytest.raises(HTTPException) as exc_info:
            await service.upload_revoke_contract(
                fake_file,
                "Distrato de Comodato",
                setup_data["lending_id"],
                db,
                regular_user,
            )

        assert exc_info.value.status_code == 403
        assert "Apenas usuários do grupo MASTER" in exc_info.value.detail
        db.close()
