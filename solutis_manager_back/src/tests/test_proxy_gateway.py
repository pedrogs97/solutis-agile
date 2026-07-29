"""Functional tests for Proxy API Gateway routing and authorization"""

import re
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import status
from fastapi.responses import Response
from src.auth.models import GroupModel, PermissionModel, UserModel
from src.auth.service import UserSerivce
from src.backends import get_db_session
from src.config import BASE_API
from src.proxy.router import authorize_proxy_access, match_route_rule
from src.proxy.routes import PROXY_ROUTES
from src.tests.base import TestBase


class TestProxyGateway(TestBase):
    """
    Proxy Gateway tests
    """

    def create_limited_user(self, db_session, group_name, permissions_list):
        """Helper to create a user with specific group and permissions."""
        group = GroupModel(name=group_name)
        db_session.add(group)
        db_session.commit()

        for perm_info in permissions_list:
            perm = (
                db_session.query(PermissionModel)
                .filter(
                    PermissionModel.module == perm_info["module"],
                    PermissionModel.model == perm_info["model"],
                    PermissionModel.action == perm_info["action"],
                )
                .first()
            )
            if not perm:
                perm = PermissionModel(
                    module=perm_info["module"],
                    model=perm_info["model"],
                    action=perm_info["action"],
                    description=f"Test permission {perm_info['module']}.{perm_info['model']}.{perm_info['action']}",
                )
                db_session.add(perm)
                db_session.commit()
            group.permissions.append(perm)

        db_session.commit()

        user = UserModel(
            username=f"user_{group_name.lower()}",
            group_id=group.id,
            password=UserSerivce().get_password_hash("testpass"),
            email=f"{group_name.lower()}@email.com",
            is_staff=False,
        )
        db_session.add(user)
        db_session.commit()
        return user

    def test_match_route_rule(self):
        """Test match_route_rule logic."""
        # 1. Matching GET supplier rule
        rule = match_route_rule("procurement", "v1/supplier/", "GET")
        assert rule["service_name"] == "procurement"
        assert "GET" in rule["methods"]
        assert rule["path_pattern"] == r"^/v1/supplier/?$"
        assert not rule.get("is_public", False)

        # 2. Matching POST supplier rule
        rule = match_route_rule("procurement", "v1/supplier", "POST")
        assert rule["service_name"] == "procurement"
        assert "POST" in rule["methods"]

        # 3. Matching PUT supplier with ID rule
        rule = match_route_rule("procurement", "v1/supplier/45/", "PUT")
        assert rule["service_name"] == "procurement"

        # 3b. Matching suppliers-list GET rule
        rule = match_route_rule("procurement", "v1/suppliers-list/", "GET")
        assert rule["service_name"] == "procurement"
        assert rule["path_pattern"] == r"^/v1/suppliers-list/?$"

        # 3c. Matching domain metadata GET rule
        rule = match_route_rule("procurement", "v1/domain/categories/", "GET")
        assert rule["service_name"] == "procurement"
        assert rule["path_pattern"] == r"^/v1/domain/.*$"

        # 4. Matching public step approval route
        rule = match_route_rule("procurement", "v1/approval/step/approve", "POST")
        assert rule["is_public"] is True

        # 5. Matching report route
        rule = match_route_rule("report", "v1/reports/generate", "POST")
        assert rule["service_name"] == "report"

        # 6. Unmatched route raises HTTPException with 403 status
        with pytest.raises(Exception) as excinfo:
            match_route_rule("procurement", "v1/invalid-route", "GET")
        assert "403" in str(excinfo.value)

    def test_authorize_proxy_access_public(self):
        """Test authorize_proxy_access bypasses authentication for public routes."""
        user = authorize_proxy_access(
            "procurement", "v1/approval/step/approve", "POST", None
        )
        assert user.id == 0
        assert user.email == "system@solutis.com.br"
        assert user.group.name == "system"

    def test_authorize_proxy_access_unauthenticated(self):
        """Test authorize_proxy_access raises 401 for unauthenticated private routes."""
        with pytest.raises(Exception) as excinfo:
            authorize_proxy_access("procurement", "v1/supplier", "GET", None)
        assert "401" in str(excinfo.value)

    def test_authorize_proxy_access_authorized(self, setup, create_initial_data):
        """Test authorize_proxy_access allows access when user has correct permissions."""
        db_session = self.testing_session_local()

        # Create a user with ONLY report view permission
        permissions = [{"module": "report", "model": "report", "action": "view"}]
        user = self.create_limited_user(db_session, "Reporter", permissions)

        # Accessing report generate should pass
        authorized_user = authorize_proxy_access(
            "report", "v1/reports/list", "POST", user
        )
        assert authorized_user.id == user.id

        # Accessing supplier view should raise 403
        with pytest.raises(Exception) as excinfo:
            authorize_proxy_access("procurement", "v1/supplier", "GET", user)
        assert "403" in str(excinfo.value)

        db_session.close()

    @patch("src.proxy.router.proxy_service")
    def test_gateway_endpoints_integration(
        self, mock_proxy_service, setup, create_initial_data
    ):
        """Test proxy router endpoints handling matching and permissions via TestClient."""
        db_session = self.testing_session_local()

        # Mock the proxy service methods to return a dummy response
        mock_proxy_service.proxy_get_request = AsyncMock(
            return_value=Response(content=b"procurement get ok", status_code=200)
        )
        mock_proxy_service.proxy_post_request = AsyncMock(
            return_value=Response(content=b"approval ok", status_code=200)
        )

        # Create two users: one with supplier view permission, one with report permission
        supplier_user = self.create_limited_user(
            db_session,
            "SupplierGroup",
            [{"module": "procurement", "model": "supplier", "action": "view"}],
        )
        report_user = self.create_limited_user(
            db_session,
            "ReportGroup",
            [{"module": "report", "model": "report", "action": "view"}],
        )

        # Login both users to get tokens
        resp1 = self.client.post(
            f"{BASE_API}/auth/login/",
            data={"username": "user_suppliergroup", "password": "testpass"},
        )
        token_supplier = resp1.json()["access_token"]

        resp2 = self.client.post(
            f"{BASE_API}/auth/login/",
            data={"username": "user_reportgroup", "password": "testpass"},
        )
        token_report = resp2.json()["access_token"]

        # 1. Test public route - should work without token
        response = self.client.post(
            f"{BASE_API}/proxy/procurement/v1/approval/step/approve/",
            json={"step_id": 1},
        )
        assert response.status_code == 200
        assert response.content == b"approval ok"
        mock_proxy_service.proxy_post_request.assert_called_once()

        # 2. Test supplier user accessing procurement supplier - should succeed
        response = self.client.get(
            f"{BASE_API}/proxy/procurement/v1/supplier/",
            headers={"Authorization": f"Bearer {token_supplier}"},
        )
        assert response.status_code == 200
        assert response.content == b"procurement get ok"

        # 3. Test report user accessing procurement supplier - should fail with 403
        response = self.client.get(
            f"{BASE_API}/proxy/procurement/v1/supplier/",
            headers={"Authorization": f"Bearer {token_report}"},
        )
        assert response.status_code == 403

        # 4. Test accessing non-configured route - should fail with 403
        response = self.client.get(
            f"{BASE_API}/proxy/procurement/v1/unmapped-route/",
            headers={"Authorization": f"Bearer {token_supplier}"},
        )
        assert response.status_code == 403

        # 5. Test missing token on private route - should fail with 401
        response = self.client.get(f"{BASE_API}/proxy/procurement/v1/supplier/")
        assert response.status_code == 401

        db_session.close()
