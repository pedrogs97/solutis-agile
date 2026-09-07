"""Asset Technical Evaluation Router (FO-PAT-02)"""

from datetime import datetime
from typing import Annotated, Optional, Union

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from src.asset_evaluation.schemas import (
    AssetEvaluationApproveSchema,
    AssetEvaluationCreateSchema,
    AssetEvaluationUpdateSchema,
    CatalogComponentCreateSchema,
)
from src.asset_evaluation.service import AssetEvaluationService
from src.auth.models import UserModel
from src.backends import PermissionChecker, get_db_session
from src.config import NOT_ALLOWED

asset_evaluation_router = APIRouter(
    prefix="/asset-evaluations", tags=["Asset Evaluation (FO-PAT-02)"]
)
evaluation_service = AssetEvaluationService()


@asset_evaluation_router.get("/metrics/")
def get_evaluation_metrics_route(
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "view"})
    ),
):
    """Retorna os indicadores executivos do Painel Executivo de Avaliações Técnicas e ESG."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    metrics = evaluation_service.get_metrics(db_session)
    db_session.close()
    return JSONResponse(
        content=metrics.model_dump(),
        status_code=status.HTTP_200_OK,
    )


@asset_evaluation_router.get("/components/catalog/")
def get_components_catalog_route(
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "view"})
    ),
):
    """Retorna a lista compartilhada de componentes para sugestão e autocompletar na matriz."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    components = evaluation_service.get_catalog_components(db_session)
    db_session.close()
    # Converte datas se houver
    formatted = [
        {
            "id": c["id"],
            "name": c["name"],
            "createdAt": c["created_at"].isoformat() if c.get("created_at") else None,
        }
        for c in components
    ]
    return JSONResponse(content=formatted, status_code=status.HTTP_200_OK)


@asset_evaluation_router.post("/components/catalog/")
def post_create_catalog_component_route(
    data: CatalogComponentCreateSchema,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "add"})
    ),
):
    """Adiciona um novo componente ao catálogo compartilhado."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    result = evaluation_service.add_catalog_component(db_session, data.name)
    db_session.close()
    result["createdAt"] = (
        result["created_at"].isoformat() if result.get("created_at") else None
    )
    result.pop("created_at", None)
    return JSONResponse(content=result, status_code=status.HTTP_201_CREATED)


@asset_evaluation_router.get("/")
def get_list_evaluations_route(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    date_start: Optional[datetime] = Query(None),
    date_end: Optional[datetime] = Query(None),
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "view"})
    ),
):
    """Lista as avaliações técnicas cadastradas com paginação e filtros."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    results = evaluation_service.list_evaluations(
        db_session=db_session,
        page=page,
        size=size,
        status_filter=status_filter,
        search=search,
        date_start=date_start,
        date_end=date_end,
    )
    db_session.close()
    serialized_items = [item.model_dump(mode="json") for item in results["items"]]
    results["items"] = serialized_items
    return JSONResponse(content=results, status_code=status.HTTP_200_OK)


@asset_evaluation_router.post("/")
def post_create_evaluation_route(
    data: AssetEvaluationCreateSchema,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "add"})
    ),
):
    """Cria uma nova avaliação técnica (FO-PAT-02)."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    created = evaluation_service.create_evaluation(
        db_session=db_session,
        data=data,
        authenticated_user=authenticated_user,
    )
    db_session.close()
    return JSONResponse(
        content=created.model_dump(mode="json"),
        status_code=status.HTTP_201_CREATED,
    )


@asset_evaluation_router.get("/{evaluation_id}/")
def get_evaluation_detail_route(
    evaluation_id: int,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "view"})
    ),
):
    """Retorna detalhes de uma avaliação técnica incluindo componentes e anexos."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    evaluation = evaluation_service.get_evaluation(db_session, evaluation_id)
    db_session.close()
    return JSONResponse(
        content=evaluation.model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )


@asset_evaluation_router.patch("/{evaluation_id}/")
def patch_update_evaluation_route(
    evaluation_id: int,
    data: AssetEvaluationUpdateSchema,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "edit"})
    ),
):
    """Atualiza uma avaliação técnica existente."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    updated = evaluation_service.update_evaluation(
        db_session=db_session,
        evaluation_id=evaluation_id,
        data=data,
        authenticated_user=authenticated_user,
    )
    db_session.close()
    return JSONResponse(
        content=updated.model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )


@asset_evaluation_router.post("/{evaluation_id}/attachments/")
async def post_upload_attachment_route(
    evaluation_id: int,
    file: Annotated[UploadFile, File(description="Arquivo comprobatório/evidência")],
    checklist_key: Annotated[Optional[str], Form()] = None,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "edit"})
    ),
):
    """Faz upload de arquivo comprobatório e vincula à avaliação."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    result = await evaluation_service.upload_attachment(
        db_session=db_session,
        evaluation_id=evaluation_id,
        file=file,
        checklist_key=checklist_key,
    )
    db_session.close()
    if result.get("created_at"):
        result["createdAt"] = result["created_at"].isoformat()
        result.pop("created_at", None)
    return JSONResponse(
        content=result,
        status_code=status.HTTP_201_CREATED,
    )


@asset_evaluation_router.post("/{evaluation_id}/approve/")
def post_approve_evaluation_route(
    evaluation_id: int,
    data: AssetEvaluationApproveSchema,
    db_session: Session = Depends(get_db_session),
    authenticated_user: Union[UserModel, None] = Depends(
        PermissionChecker({"module": "asset", "model": "asset", "action": "edit"})
    ),
):
    """Aprova a avaliação técnica e opcionalmente efetiva a baixa do ativo para DESCARTE."""
    if not authenticated_user:
        db_session.close()
        return JSONResponse(
            content=NOT_ALLOWED, status_code=status.HTTP_401_UNAUTHORIZED
        )
    approved = evaluation_service.approve_evaluation(
        db_session=db_session,
        evaluation_id=evaluation_id,
        data=data,
        authenticated_user=authenticated_user,
    )
    db_session.close()
    return JSONResponse(
        content=approved.model_dump(mode="json"),
        status_code=status.HTTP_200_OK,
    )
