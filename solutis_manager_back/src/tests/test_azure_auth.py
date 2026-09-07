"""Tests for Azure Entra ID (SSO) authentication module"""

from datetime import datetime
from unittest.mock import patch

from src.auth.models import UserModel
from src.config import BASE_API
from src.people.models import EmployeeModel
from src.tests.base import TestBase


class TestAzureAuthModule(TestBase):
    """
    Azure SSO tests
    """

    def test_azure_login_url_disabled_by_feature_flag(self, setup, create_initial_data):
        """Test getting Azure authorization URL when ENABLE_SSO is False (default)"""
        with patch("src.auth.router.ENABLE_SSO", False):
            response = self.client.get(f"{BASE_API}/auth/azure/url/")
            assert response.status_code == 403
            data = response.json()
            assert "Autenticação SSO desabilitada" in data.get("detail", "")

    def test_azure_callback_disabled_by_feature_flag(self, setup, create_initial_data):
        """Test calling Azure callback when ENABLE_SSO is False (default)"""
        with patch("src.auth.router.ENABLE_SSO", False):
            response = self.client.post(
                f"{BASE_API}/auth/azure/callback/",
                json={"code": "auth-code-test"},
            )
            assert response.status_code == 403
            data = response.json()
            assert "Autenticação SSO desabilitada" in data.get("detail", "")

    def test_get_azure_login_url_success(self, setup, create_initial_data):
        """Test getting Azure authorization URL when configured and ENABLE_SSO is True"""
        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", "mock-client-id"
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", "mock-tenant-id"), patch(
            "src.auth.azure_service.AZURE_REDIRECT_URI",
            "http://localhost:3000/auth/callback/azure",
        ):
            response = self.client.get(f"{BASE_API}/auth/azure/url/")
            assert response.status_code == 200
            data = response.json()
            assert "url" in data
            assert "state" in data
            assert (
                "https://login.microsoftonline.com/mock-tenant-id/oauth2/v2.0/authorize"
                in data["url"]
            )
            assert "client_id=mock-client-id" in data["url"]
            assert "response_type=code" in data["url"]
            assert "scope=" in data["url"]

    def test_get_azure_login_url_not_configured(self, setup, create_initial_data):
        """Test error when Azure credentials are not set"""
        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", ""
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", ""):
            response = self.client.get(f"{BASE_API}/auth/azure/url/")
            assert response.status_code == 500
            data = response.json()
            assert "não está configurad" in data.get("detail", "")

    @patch("src.auth.azure_service.AzureAuthService.get_user_profile")
    @patch("src.auth.azure_service.AzureAuthService.exchange_code_for_token")
    def test_azure_callback_existing_user_by_oid(
        self, mock_exchange, mock_profile, setup, create_initial_data
    ):
        """Test login with an existing user who already has an azure_oid"""
        session = self.testing_session_local()
        user = (
            session.query(UserModel).filter(UserModel.username == "agile_admin").first()
        )
        user.azure_oid = "oid-admin-123"
        session.commit()
        session.close()

        mock_exchange.return_value = {"access_token": "mock-access-token"}
        mock_profile.return_value = {
            "id": "oid-admin-123",
            "mail": "admin@email.com",
            "userPrincipalName": "admin@email.com",
            "displayName": "Administrador",
        }

        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", "mock-client-id"
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", "mock-tenant-id"), patch(
            "src.auth.azure_service.AZURE_CLIENT_SECRET", "mock-secret"
        ):
            response = self.client.post(
                f"{BASE_API}/auth/azure/callback/",
                json={
                    "code": "auth-code-test",
                    "redirectUri": "http://localhost:3000/auth/callback/azure",
                },
            )
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == "admin@email.com"
            assert "access_token" in data
            assert "refresh_token" in data
            assert data["products"] == ["agile", "flow"]

    @patch("src.auth.azure_service.AzureAuthService.get_user_profile")
    @patch("src.auth.azure_service.AzureAuthService.exchange_code_for_token")
    def test_azure_callback_existing_user_by_email_updates_oid(
        self, mock_exchange, mock_profile, setup, create_initial_data
    ):
        """Test login for existing user by email, linking azure_oid"""
        mock_exchange.return_value = {"access_token": "mock-access-token"}
        mock_profile.return_value = {
            "id": "oid-new-linked-456",
            "mail": "admin@email.com",
            "userPrincipalName": "admin@email.com",
            "displayName": "Administrador",
        }

        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", "mock-client-id"
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", "mock-tenant-id"), patch(
            "src.auth.azure_service.AZURE_CLIENT_SECRET", "mock-secret"
        ):
            response = self.client.post(
                f"{BASE_API}/auth/azure/callback/",
                json={"code": "auth-code-test"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == "admin@email.com"

            session = self.testing_session_local()
            user = (
                session.query(UserModel)
                .filter(UserModel.email == "admin@email.com")
                .first()
            )
            assert user.azure_oid == "oid-new-linked-456"
            session.close()

    @patch("src.auth.azure_service.AzureAuthService.get_user_profile")
    @patch("src.auth.azure_service.AzureAuthService.exchange_code_for_token")
    def test_azure_callback_auto_provision_linked_to_employee(
        self, mock_exchange, mock_profile, setup, create_initial_data
    ):
        """Test auto-provisioning new user matching employee email"""
        session = self.testing_session_local()
        # Create an employee
        emp = EmployeeModel(
            full_name="Carlos Santana",
            email="carlos.santana@solutis.com.br",
            taxpayer_identification="12345678909",
            national_identification="123456789",
            address="Rua Teste",
            cell_phone="11999999999",
            birthday=datetime.now().date(),
            gender_id=1,
            code="EMP001",
        )
        session.add(emp)
        session.commit()
        session.close()

        mock_exchange.return_value = {"access_token": "mock-access-token"}
        mock_profile.return_value = {
            "id": "oid-carlos-789",
            "mail": "carlos.santana@solutis.com.br",
            "userPrincipalName": "carlos.santana@solutis.com.br",
            "displayName": "Carlos Santana",
            "jobTitle": "Engenheiro de Software",
            "department": "Tecnologia",
        }

        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", "mock-client-id"
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", "mock-tenant-id"), patch(
            "src.auth.azure_service.AZURE_CLIENT_SECRET", "mock-secret"
        ), patch(
            "src.auth.azure_service.AZURE_AUTO_PROVISION", True
        ):
            response = self.client.post(
                f"{BASE_API}/auth/azure/callback/",
                json={"code": "auth-code-test"},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == "carlos.santana@solutis.com.br"
            assert data["products"] == ["agile", "flow"]

            session = self.testing_session_local()
            new_user = (
                session.query(UserModel)
                .filter(UserModel.email == "carlos.santana@solutis.com.br")
                .first()
            )
            assert new_user is not None
            assert new_user.azure_oid == "oid-carlos-789"
            assert new_user.employee_id is not None
            assert new_user.employee.full_name == "Carlos Santana"
            session.close()

    @patch("src.auth.azure_service.AzureAuthService.get_user_profile")
    @patch("src.auth.azure_service.AzureAuthService.exchange_code_for_token")
    def test_azure_callback_auto_provision_disabled(
        self, mock_exchange, mock_profile, setup, create_initial_data
    ):
        """Test auto-provisioning disabled returns 403 when user not in DB"""
        mock_exchange.return_value = {"access_token": "mock-access-token"}
        mock_profile.return_value = {
            "id": "oid-desconhecido",
            "mail": "desconhecido@solutis.com.br",
            "userPrincipalName": "desconhecido@solutis.com.br",
            "displayName": "Usuário Desconhecido",
        }

        with patch("src.auth.router.ENABLE_SSO", True), patch(
            "src.auth.azure_service.AZURE_CLIENT_ID", "mock-client-id"
        ), patch("src.auth.azure_service.AZURE_TENANT_ID", "mock-tenant-id"), patch(
            "src.auth.azure_service.AZURE_CLIENT_SECRET", "mock-secret"
        ), patch(
            "src.auth.azure_service.AZURE_AUTO_PROVISION", False
        ):
            response = self.client.post(
                f"{BASE_API}/auth/azure/callback/",
                json={"code": "auth-code-test"},
            )
            assert response.status_code == 403
            data = response.json()
            assert "não possui cadastro prévio" in data.get("detail", "")
