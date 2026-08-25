"""Proxy routes configuration with permission mappings"""

from typing import Any, Dict, List

from src.auth.schemas import PermissionSchema

PROXY_ROUTES: List[Dict[str, Any]] = [
    # --- MICROSSERVIÇO: PROCUREMENT (Fornecedores) ---
    # Rota pública de aprovação de fornecedor (downstream faz validação do token do fluxo de aprovação)
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/approval/step/approve/?$",
        "is_public": True,
    },
    # Rotas de listagem, consulta e metadados (GET)
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/suppliers-list/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/suppliers/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/suppliers/\d+/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
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
        "methods": ["GET"],
        "path_pattern": r"^/v1/supplier/\d+/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/domain/.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/approval/.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/attachments.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/attachment-types.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/responsibility-matrix.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["GET"],
        "path_pattern": r"^/v1/evaluation/.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="view")
        ],
    },
    # Rotas de cadastro / criação (POST)
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/suppliers/?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="add")
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
        "methods": ["POST"],
        "path_pattern": r"^/v1/attachment-types.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="add")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/evaluation/.*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="add")
        ],
    },
    {
        "service_name": "procurement",
        "methods": ["POST"],
        "path_pattern": r"^/v1/(approval|attachments|responsibility-matrix).*$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="edit")
        ],
    },
    # Rotas de alteração (PUT, PATCH)
    {
        "service_name": "procurement",
        "methods": ["PUT", "PATCH"],
        "path_pattern": r"^/v1/(suppliers|supplier|approval|attachments|attachment-types|responsibility-matrix|evaluation)(/.*)?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="edit")
        ],
    },
    # Rotas de exclusão (DELETE)
    {
        "service_name": "procurement",
        "methods": ["DELETE"],
        "path_pattern": r"^/v1/(suppliers|supplier|approval|attachments|attachment-types|evaluation)(/.*)?$",
        "required_permissions": [
            PermissionSchema(module="procurement", model="supplier", action="delete")
        ],
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
    # --- MICROSSERVIÇO: FLOW (Governança e Demandas) ---
    {
        "service_name": "flow",
        "methods": ["GET", "POST", "PUT", "PATCH", "DELETE"],
        "path_pattern": r"^/v1/(demands|events|areas|cost-centers|projects|dashboard|acl)(/.*)?$",
        "required_permissions": [],  # Autenticação garantida via gateway; permissões refinadas internas no flow_back
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
    {
        "service_name": "flow",
        "methods": ["GET"],
        "path_pattern": r"^/health/?$",
        "required_permissions": [],
    },
]
