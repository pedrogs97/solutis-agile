"""Proxy routes configuration with permission mappings"""

from typing import Any, Dict, List

from src.auth.schemas import PermissionSchema

PROXY_ROUTES: List[Dict[str, Any]] = [
    # --- MICROSSERVIÇO: PROCUREMENT (Fornecedores) ---
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/supplier/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/supplier/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="add")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["PUT", "PATCH"],
        "path_pattern": r"^/v1/supplier/\d+/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="edit")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["DELETE"],
        "path_pattern": r"^/v1/supplier/\d+/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="delete")
        ],
    },
    # Rota pública de aprovação de fornecedor (downstream faz validação do token do fluxo de aprovação)
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/approval/step/approve/?$",
        "is_public": True,
    },
    # --- MICROSSERVIÇO: REPORT (Relatórios) ---
    {
        "service_name": "report",
        "methods": ["GET", "POST"],
        "path_pattern": r"^/v1/reports/.*$",
        "required_permissions": [
            PermissionSchema(module="report", model="report", action="view")
        ],
    },
    # --- ROTAS DE HEALTH CHECK (Qualquer usuário autenticado) ---
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/health/?$",
        "required_permissions": [],  # Lista vazia = apenas autenticação exigida
    },
    {
        "service_name": "report",
        "methods": ["GET"],
        "path_pattern": r"^/health/?$",
        "required_permissions": [],
    },
]
