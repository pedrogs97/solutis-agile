from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from src.database import get_db_session
from src.models.acl import UserRoleMapping, FlowRole
from src.schemas.acl import RoleMappingCreate, RoleMappingResponse
from src.security import AuthenticatedUser, require_flow_roles

acl_router = APIRouter(prefix="/acl", tags=["acl"])


@acl_router.post("/roles", response_model=RoleMappingResponse, status_code=status.HTTP_201_CREATED)
def assign_user_role(
    mapping_in: RoleMappingCreate,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(require_flow_roles([FlowRole.ADMIN])),
):
    """Assign local Flow ACL role to a user ID (Admin only)."""
    mapping = UserRoleMapping(
        user_id=mapping_in.user_id,
        role=mapping_in.role,
        area_id=mapping_in.area_id,
    )
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping


@acl_router.get("/roles/user/{user_id}", response_model=List[RoleMappingResponse])
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(require_flow_roles([FlowRole.ADMIN, FlowRole.GESTOR])),
):
    """Get local Flow ACL roles assigned to a specific user ID."""
    mappings = db.exec(
        select(UserRoleMapping).where(UserRoleMapping.user_id == user_id)
    ).all()
    return mappings


@acl_router.delete("/roles/{mapping_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_user_role(
    mapping_id: int,
    db: Session = Depends(get_db_session),
    current_user: AuthenticatedUser = Depends(require_flow_roles([FlowRole.ADMIN])),
):
    """Revoke local Flow ACL role assignment (Admin only)."""
    mapping = db.get(UserRoleMapping, mapping_id)
    if not mapping:
        raise HTTPException(status_code=404, detail="Mapeamento de papel não encontrado")
    db.delete(mapping)
    db.commit()
