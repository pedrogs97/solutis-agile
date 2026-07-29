"""Proxy router with permission validation"""

import re
from typing import Any, Dict, Generator, Optional, Union

from fastapi import APIRouter, Depends, HTTPException, Request, status
from loguru import logger
from sqlalchemy.orm import Session, selectinload
from src.auth.models import GroupModel, TokenModel, UserModel
from src.backends import PermissionChecker, get_db_session, token_is_valid
from src.config import NOT_ALLOWED
from src.proxy.routes import PROXY_ROUTES
from src.proxy.service import INSUFFICIENT_PERMISSIONS_MSG, proxy_service

proxy_router = APIRouter(prefix="/proxy", tags=["proxy"])


def get_proxy_authenticated_user(
    request: Request,
    db_session: Session = Depends(get_db_session),
) -> Generator[Union[UserModel, None], None, None]:
    """Authenticate proxy requests using opaque access token from headers."""
    try:
        authorization = request.headers.get("Authorization")
        if not authorization:
            logger.warning("No Authorization header provided")
            yield None
            return

        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            logger.warning("Invalid Authorization header format")
            yield None
            return

        token = parts[1]
        token_db = (
            db_session.query(TokenModel).filter(TokenModel.token == token).first()
        )
        if not token_is_valid(token_db):
            logger.warning("Invalid token")
            yield None
            return

        user = (
            db_session.query(UserModel)
            .options(
                selectinload(UserModel.group).selectinload(GroupModel.permissions),
                selectinload(UserModel.employee),
            )
            .filter(UserModel.id == token_db.user_id)
            .first()
        )
        yield user
    finally:
        db_session.close()


def match_route_rule(service_name: str, path: str, method: str) -> Dict[str, Any]:
    """Match request to a configured route rule in PROXY_ROUTES."""
    normalized_path = "/" + path.lstrip("/")

    for rule in PROXY_ROUTES:
        if rule["service_name"] == service_name:
            if method in rule["methods"]:
                if re.match(rule["path_pattern"], normalized_path):
                    return rule

    logger.warning(
        "No proxy route rule matched for service '{}', path '{}', method '{}'",
        service_name,
        normalized_path,
        method,
    )
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Acesso não configurado ou rota inválida para este microsserviço.",
    )


def authorize_proxy_access(
    service_name: str,
    path: str,
    method: str,
    current_user: Union[UserModel, None],
) -> UserModel:
    """Authorize proxy request and distinguish auth vs permission failures dynamically."""
    rule = match_route_rule(service_name, path, method)

    if rule.get("is_public", False):

        class SystemUser:
            id = 0
            email = "system@solutis.com.br"
            group = type("Group", (), {"name": "system"})()
            employee = type("Employee", (), {"full_name": "System"})()

        return SystemUser()

    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=NOT_ALLOWED,
        )

    required_permissions = rule.get("required_permissions", [])
    if required_permissions:
        permission_checker = PermissionChecker(required_permissions)
        if not permission_checker.has_permissions(current_user):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=INSUFFICIENT_PERMISSIONS_MSG,
            )

    return current_user


@proxy_router.api_route(
    "/{service_name}/{path:path}",
    methods=["GET"],
    summary="Proxy GET requests to external service",
)
async def proxy_get(
    service_name: str,
    path: str,
    request: Request,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Proxy GET requests to external service with dynamic permission validation.
    """
    authorized_user = authorize_proxy_access(service_name, path, "GET", current_user)
    return await proxy_service.proxy_get_request(
        service_name, path, request, authorized_user
    )


@proxy_router.api_route(
    "/{service_name}/{path:path}",
    methods=["POST"],
    summary="Proxy POST requests to external service",
)
async def proxy_post(
    service_name: str,
    path: str,
    request: Request,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Proxy POST requests to external service with dynamic permission validation.
    """
    authorized_user = authorize_proxy_access(service_name, path, "POST", current_user)
    return await proxy_service.proxy_post_request(
        service_name, path, request, authorized_user
    )


@proxy_router.api_route(
    "/{service_name}/{path:path}",
    methods=["PUT"],
    summary="Proxy PUT requests to external service",
)
async def proxy_put(
    service_name: str,
    path: str,
    request: Request,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Proxy PUT requests to external service with dynamic permission validation.
    """
    authorized_user = authorize_proxy_access(service_name, path, "PUT", current_user)
    return await proxy_service.proxy_put_request(
        service_name, path, request, authorized_user
    )


@proxy_router.api_route(
    "/{service_name}/{path:path}",
    methods=["PATCH"],
    summary="Proxy PATCH requests to external service",
)
async def proxy_patch(
    service_name: str,
    path: str,
    request: Request,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Proxy PATCH requests to external service with dynamic permission validation.
    """
    authorized_user = authorize_proxy_access(service_name, path, "PATCH", current_user)
    return await proxy_service.proxy_patch_request(
        service_name, path, request, authorized_user
    )


@proxy_router.api_route(
    "/{service_name}/{path:path}",
    methods=["DELETE"],
    summary="Proxy DELETE requests to external service",
)
async def proxy_delete(
    service_name: str,
    path: str,
    request: Request,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Proxy DELETE requests to external service with dynamic permission validation.
    """
    authorized_user = authorize_proxy_access(service_name, path, "DELETE", current_user)
    return await proxy_service.proxy_delete_request(
        service_name, path, request, authorized_user
    )


@proxy_router.get(
    "/{service_name}/health",
    summary="Check proxy and external service health",
)
async def proxy_health(
    service_name: str,
    current_user: Union[UserModel, None] = Depends(get_proxy_authenticated_user),
):
    """
    Check the health of the proxy service and external service connection.
    """
    authorized_user = authorize_proxy_access(
        service_name, "health", "GET", current_user
    )
    return await proxy_service.proxy_health_check(service_name, authorized_user)
