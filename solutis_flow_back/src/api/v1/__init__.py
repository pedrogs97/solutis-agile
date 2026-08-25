from fastapi import APIRouter
from src.api.v1.demands import demands_router
from src.api.v1.events import events_router
from src.api.v1.areas import areas_router
from src.api.v1.projects import projects_router
from src.api.v1.dashboard import dashboard_router
from src.api.v1.acl import acl_router

api_v1_router = APIRouter()
api_v1_router.include_router(demands_router)
api_v1_router.include_router(events_router)
api_v1_router.include_router(areas_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(dashboard_router)
api_v1_router.include_router(acl_router)
