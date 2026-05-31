"""Error messages module"""

from enum import Enum


class ErrorMessages(str, Enum):
    """Error messages"""

    INTERNAL_ERROR = "Erro interno ao {message}."
    INVALID_REQUEST = "Requisição inválida."
    NOT_FOUND = "Não encontrado. {message}"
