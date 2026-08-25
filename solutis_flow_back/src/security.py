from urllib.parse import unquote
from typing import List, Optional
from fastapi import Header, HTTPException, Depends, status
from pydantic import BaseModel
from sqlmodel import Session, select
from src.database import get_db_session
from src.models.acl import UserRoleMapping, FlowRole


class AuthenticatedUser(BaseModel):
    id: int
    email: str
    full_name: str
    group_name: str
    flow_roles: List[FlowRole] = [FlowRole.SOLICITANTE]


def get_current_user(
    x_authenticated_user_id: Optional[str] = Header(None, alias="x-authenticated-user-id"),
    x_authenticated_user_email: Optional[str] = Header(None, alias="x-authenticated-user-email"),
    x_authenticated_user_full_name: Optional[str] = Header(None, alias="x-authenticated-user-full-name"),
    x_authenticated_user_group: Optional[str] = Header(None, alias="x-authenticated-user-group"),
    db: Session = Depends(get_db_session),
) -> AuthenticatedUser:
    """Extract authenticated user context passed from Gateway and load local Flow ACL roles."""
    if not x_authenticated_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header de autenticação do Gateway ausente ou inválido",
        )

    try:
        user_id = int(x_authenticated_user_id)
        email = unquote(x_authenticated_user_email or "")
        full_name = unquote(x_authenticated_user_full_name or "Usuario")
        group_name = unquote(x_authenticated_user_group or "")

        # Fetch local ACL roles assigned in solutis_flow_back database
        roles_mappings = db.exec(
            select(UserRoleMapping.role).where(UserRoleMapping.user_id == user_id)
        ).all()

        flow_roles = list(roles_mappings) if roles_mappings else [FlowRole.SOLICITANTE]

        # If gateway group is admin, automatically grant FlowRole.ADMIN
        if group_name.lower() == "admin" and FlowRole.ADMIN not in flow_roles:
            flow_roles.append(FlowRole.ADMIN)

        return AuthenticatedUser(
            id=user_id,
            email=email,
            full_name=full_name,
            group_name=group_name,
            flow_roles=flow_roles,
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authenticated user context headers",
        )


def require_flow_roles(allowed_roles: List[FlowRole]):
    """FastAPI Dependency for ACL permission checks based on local Flow Roles."""

    def role_checker(current_user: AuthenticatedUser = Depends(get_current_user)):
        if FlowRole.ADMIN in current_user.flow_roles:
            return current_user

        has_role = any(r in current_user.flow_roles for r in allowed_roles)
        if not has_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Requer papel local no Flow: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker
