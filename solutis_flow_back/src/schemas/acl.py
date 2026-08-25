from typing import Optional
from pydantic import BaseModel, ConfigDict
from src.models.acl import FlowRole


class RoleMappingCreate(BaseModel):
    user_id: int
    role: FlowRole
    area_id: Optional[int] = None


class RoleMappingResponse(BaseModel):
    id: int
    user_id: int
    role: FlowRole
    area_id: Optional[int]

    model_config = ConfigDict(from_attributes=True)
