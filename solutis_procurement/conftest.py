"""Root pytest conftest for solutis_procurement."""

import os

# Forçar ambiente de teste e SQLite para evitar conexões com banco externo/MySQL em testes
os.environ["TESTING"] = "true"
os.environ["USE_SQLITE"] = "true"
