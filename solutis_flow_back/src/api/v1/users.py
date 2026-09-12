from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select

from src.database import get_db_session
from src.models.acl import UserRoleMapping, FlowRole
from src.models.area import Area
from src.security import AuthenticatedUser, get_current_user

users_router = APIRouter(prefix="/users", tags=["users"])


class FlowUserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    avatar: str = ""
    areaId: str = "1"


# Default known team profiles mapped to User IDs
DEFAULT_USERS = [
    {
        "id": "1",
        "name": "Administrador do Sistema",
        "email": "admin@solutis.com.br",
        "default_role": FlowRole.ADMIN,
        "area_id": "1",
    },
    {
        "id": "2",
        "name": "Beatriz Mello (Gestor)",
        "email": "beatriz.mello@solutis.com.br",
        "default_role": FlowRole.GESTOR,
        "area_id": "3",
    },
    {
        "id": "3",
        "name": "Rafael Santos (Analista)",
        "email": "rafael.santos@solutis.com.br",
        "default_role": FlowRole.ANALISTA,
        "area_id": "2",
    },
    {
        "id": "4",
        "name": "Ana Paula (Solicitante)",
        "email": "ana.paula@solutis.com.br",
        "default_role": FlowRole.SOLICITANTE,
        "area_id": "4",
    },
    {
        "id": "5",
        "name": "Pedro Gustavo (Diretoria)",
        "email": "pedro.gustavo@solutis.com.br",
        "default_role": FlowRole.APROVADOR,
        "area_id": "7",
    },
]


@users_router.get("", response_model=List[FlowUserResponse])
def list_flow_users(
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    """List operational team members configured with their roles."""
    roles = db.exec(select(UserRoleMapping)).all()
    roles_by_user_id = {r.user_id: r for r in roles}

    results: List[FlowUserResponse] = []
    for u in DEFAULT_USERS:
        u_id = int(u["id"])
        assigned_mapping = roles_by_user_id.get(u_id)
        if assigned_mapping:
            role_val = assigned_mapping.role.value if hasattr(assigned_mapping.role, "value") else str(assigned_mapping.role)
        else:
            default_role = u["default_role"]
            role_val = default_role.value if hasattr(default_role, "value") else str(default_role)
        area_id = str(assigned_mapping.area_id) if assigned_mapping and assigned_mapping.area_id else u["area_id"]

        results.append(
            FlowUserResponse(
                id=u["id"],
                name=u["name"],
                email=u["email"],
                role=role_val,
                avatar="",
                areaId=area_id,
            )
        )

    # If the current authenticated user isn't in default list, add dynamically
    if not any(r.id == str(current_user.id) for r in results):
        first_role = current_user.flow_roles[0] if current_user.flow_roles else "SOLICITANTE"
        current_role = first_role.value if hasattr(first_role, "value") else str(first_role)
        results.append(
            FlowUserResponse(
                id=str(current_user.id),
                name=current_user.full_name,
                email=current_user.email,
                role=current_role,
                avatar="",
                areaId="1",
            )
        )

    return results
