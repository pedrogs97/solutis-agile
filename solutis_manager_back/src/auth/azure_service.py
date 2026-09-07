"""Azure Entra ID (Microsoft Azure AD) Authentication Service"""

import secrets
import string
import urllib.parse
import uuid
from typing import Dict, Optional, Tuple

import requests
from fastapi import HTTPException, status
from loguru import logger
from sqlalchemy import func
from sqlalchemy.orm import Session
from src.auth.models import GroupModel, UserModel
from src.backends import bcrypt_context
from src.config import (
    AZURE_AUTO_PROVISION,
    AZURE_CLIENT_ID,
    AZURE_CLIENT_SECRET,
    AZURE_DEFAULT_GROUP_NAME,
    AZURE_REDIRECT_URI,
    AZURE_TENANT_ID,
)
from src.people.models import EmployeeModel


class AzureAuthService:
    """Service handling Microsoft Entra ID OAuth2 / OIDC authentication and auto-provisioning."""

    @staticmethod
    def get_authorization_url(
        state: Optional[str] = None, redirect_uri: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Builds the Microsoft Entra ID authorization URL.
        Returns a tuple of (authorization_url, state).
        """
        if not AZURE_CLIENT_ID or not AZURE_TENANT_ID:
            logger.error(
                "Azure SSO configuration missing: AZURE_CLIENT_ID or AZURE_TENANT_ID is empty."
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Autenticação com Microsoft Azure não está configurada no servidor.",
            )

        state_token = state or uuid.uuid4().hex
        effective_redirect_uri = redirect_uri or AZURE_REDIRECT_URI

        params = {
            "client_id": AZURE_CLIENT_ID,
            "response_type": "code",
            "redirect_uri": effective_redirect_uri,
            "response_mode": "query",
            "scope": "openid profile email User.Read",
            "state": state_token,
        }

        # Filter out empty parameters
        query_string = urllib.parse.urlencode({k: v for k, v in params.items() if v})
        auth_url = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/authorize?{query_string}"

        return auth_url, state_token

    @staticmethod
    def exchange_code_for_token(
        code: str, redirect_uri: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Exchanges an authorization code for Microsoft access and ID tokens.
        """
        if not AZURE_CLIENT_ID or not AZURE_TENANT_ID or not AZURE_CLIENT_SECRET:
            logger.error("Azure SSO configuration missing credentials.")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Credenciais do Microsoft Azure não estão configuradas no servidor.",
            )

        token_url = (
            f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token"
        )
        effective_redirect_uri = redirect_uri or AZURE_REDIRECT_URI

        data = {
            "client_id": AZURE_CLIENT_ID,
            "client_secret": AZURE_CLIENT_SECRET,
            "code": code,
            "redirect_uri": effective_redirect_uri,
            "grant_type": "authorization_code",
            "scope": "openid profile email User.Read",
        }

        try:
            response = requests.post(token_url, data=data, timeout=15)
            if response.status_code != 200:
                logger.error(
                    f"Microsoft token exchange error [{response.status_code}]: {response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Falha ao trocar código de autorização com a Microsoft. O código pode ter expirado ou ser inválido.",
                )
            return response.json()
        except requests.RequestException as exc:
            logger.error(f"Network error communicating with Microsoft: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erro de comunicação com os servidores da Microsoft. Tente novamente em instantes.",
            )

    @staticmethod
    def get_user_profile(access_token: str) -> Dict:
        """
        Retrieves the authenticated user's profile from Microsoft Graph API.
        """
        graph_url = "https://graph.microsoft.com/v1.0/me"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        }

        try:
            response = requests.get(graph_url, headers=headers, timeout=15)
            if response.status_code != 200:
                logger.error(
                    f"Microsoft Graph /me error [{response.status_code}]: {response.text}"
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Não foi possível obter os dados do perfil do usuário na Microsoft.",
                )
            return response.json()
        except requests.RequestException as exc:
            logger.error(f"Network error querying Microsoft Graph: {exc}")
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Erro de comunicação com o Microsoft Graph. Tente novamente em instantes.",
            )

    @staticmethod
    def authenticate_or_provision_user(profile: Dict, db_session: Session) -> UserModel:
        """
        Resolves or auto-provisions a UserModel based on Microsoft profile data.
        """
        azure_oid = profile.get("id")
        email = (
            (profile.get("mail") or profile.get("userPrincipalName") or "")
            .strip()
            .lower()
        )

        if not email:
            logger.error("Microsoft profile missing email or userPrincipalName.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A conta Microsoft não possui um e-mail corporativo válido associado.",
            )

        # 1. Search by azure_oid first
        user = None
        if azure_oid:
            user = (
                db_session.query(UserModel)
                .filter(UserModel.azure_oid == azure_oid)
                .first()
            )

        # 2. Search by email if not found by azure_oid
        if not user:
            user = (
                db_session.query(UserModel)
                .filter(func.lower(UserModel.email) == email)
                .first()
            )
            if user:
                # Link existing user with azure_oid
                if azure_oid and user.azure_oid != azure_oid:
                    user.azure_oid = azure_oid
                    db_session.commit()
                    db_session.refresh(user)

        # 3. If user found, check active status and return
        if user:
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sua conta de usuário está desativada. Entre em contato com o suporte.",
                )
            return user

        # 4. If user not found, check auto-provisioning setting
        if not AZURE_AUTO_PROVISION:
            logger.warning(f"Auto-provisioning disabled. User {email} rejected.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Seu usuário corporativo não possui cadastro prévio no sistema. Solicite acesso ao administrador.",
            )

        # 5. Auto-provisioning new user
        # Try to find matching employee
        employee = (
            db_session.query(EmployeeModel)
            .filter(func.lower(EmployeeModel.email) == email)
            .first()
        )

        # Determine default group
        default_group = (
            db_session.query(GroupModel)
            .filter(func.lower(GroupModel.name) == AZURE_DEFAULT_GROUP_NAME.lower())
            .first()
        )
        if not default_group:
            # Fallback to first available non-master group or any group
            default_group = (
                db_session.query(GroupModel)
                .filter(~GroupModel.name.ilike("%master%"))
                .first()
            )
            if not default_group:
                default_group = db_session.query(GroupModel).first()

        # Create unique username
        base_username = email.split("@")[0].lower()
        # Ensure username uniqueness
        existing_username = (
            db_session.query(UserModel)
            .filter(func.lower(UserModel.username) == base_username)
            .first()
        )
        username = base_username
        if existing_username:
            username = f"{base_username}_{uuid.uuid4().hex[:6]}"

        # Generate secure random dummy password
        alphabet = string.ascii_letters + string.digits
        raw_password = "".join(secrets.choice(alphabet) for _ in range(24))
        hashed_password = bcrypt_context.hash(raw_password)

        department = (
            profile.get("department") or (employee.department if employee else "") or ""
        )
        manager = employee.manager if employee and hasattr(employee, "manager") else ""

        new_user = UserModel(
            username=username,
            email=email,
            password=hashed_password,
            azure_oid=azure_oid,
            employee_id=employee.id if employee else None,
            group_id=default_group.id if default_group else None,
            department=department,
            manager=manager or "",
            products="agile,flow",
            is_active=True,
            is_staff=False,
        )

        db_session.add(new_user)
        db_session.commit()
        db_session.refresh(new_user)

        logger.info(
            f"Auto-provisioned new user via Microsoft SSO: {email} (ID: {new_user.id})"
        )
        return new_user
