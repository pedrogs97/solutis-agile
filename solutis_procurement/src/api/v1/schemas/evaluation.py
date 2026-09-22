"""Evaluation schemas and serializers for Ninja v1."""

# pylint: disable=duplicate-code

from datetime import date
from decimal import Decimal

from django.db.models import Avg, Max, Min
from src.api.v1.schemas.common import CamelSchema
from src.api.v1.schemas.suppliers import serialize_supplier
from src.supplier.models.evaluation import (
    CriterionScore,
    EvaluationCriterion,
    EvaluationPeriodType,
    SupplierEvaluation,
)


def _decimal_to_str(value: Decimal | None) -> str | None:
    if value is None:
        return None
    return f"{value:.2f}"


def _period_label(period_type: str, period_number: int) -> str:
    if period_type == EvaluationPeriodType.QUADRIMESTER:
        return f"{period_number}º Quadrimestre"
    if period_type == EvaluationPeriodType.SEMESTER:
        return f"{period_number}º Semestre"
    return ""


class EvaluationCriterionIn(CamelSchema):
    """Payload for evaluation criterion create/update."""

    name: str
    description: str
    weight: Decimal
    order: int = 0


class EvaluationCriterionPatchIn(CamelSchema):
    """Payload for partial evaluation criterion updates."""

    name: str | None = None
    description: str | None = None
    weight: Decimal | None = None
    order: int | None = None


class EvaluationCriterionOut(CamelSchema):
    """Serialized evaluation criterion."""

    id: int
    name: str
    description: str
    weight: str
    order: int


class CriterionScoreIn(CamelSchema):
    """Payload for criterion scores."""

    criterion: int
    score: Decimal
    comments: str = ""


class SupplierEvaluationIn(CamelSchema):
    """Payload for supplier evaluation create/update."""

    supplier: int
    evaluation_year: int
    period_type: str
    period_number: int
    evaluator_name: str
    evaluation_date: date | None = None
    comments: str = ""
    criterion_scores: list[CriterionScoreIn] | None = None


class SupplierEvaluationPatchIn(CamelSchema):
    """Payload for partial supplier evaluation updates."""

    supplier: int | None = None
    evaluation_year: int | None = None
    period_type: str | None = None
    period_number: int | None = None
    evaluator_name: str | None = None
    evaluation_date: date | None = None
    comments: str | None = None
    criterion_scores: list[CriterionScoreIn] | None = None


def serialize_evaluation_criterion(item: EvaluationCriterion) -> dict:
    """Serialize evaluation criterion."""
    return EvaluationCriterionOut(
        id=item.id,
        name=item.name,
        description=item.description,
        weight=_decimal_to_str(item.weight) or "0.00",
        order=item.order,
    ).model_dump(by_alias=True)


def serialize_criterion_score(score: CriterionScore) -> dict:
    """Serialize criterion score."""
    return {
        "id": score.id,
        "criterion": serialize_evaluation_criterion(score.criterion),
        "score": _decimal_to_str(score.score),
        "comments": score.comments,
    }


def serialize_supplier_evaluation(item: SupplierEvaluation) -> dict:
    """Serialize supplier evaluation list output."""
    return {
        "id": item.id,
        "supplier": serialize_supplier(item.supplier),
        "evaluationYear": item.evaluation_year,
        "periodType": item.period_type,
        "periodNumber": item.period_number,
        "periodLabel": _period_label(item.period_type, item.period_number),
        "evaluatorName": item.evaluator_name,
        "evaluationDate": (
            item.evaluation_date.isoformat() if item.evaluation_date else None
        ),
        "comments": item.comments,
        "finalScore": _decimal_to_str(item.final_score),
        "finalClassification": item.final_classification,
    }


def _average_score_payload(item: SupplierEvaluation) -> dict:
    supplier_evals = (
        SupplierEvaluation.objects.filter(supplier=item.supplier)
        .exclude(id=item.id)
        .exclude(final_score=None)
    )

    if not supplier_evals.exists():
        return {
            "previousEvaluationsCount": 0,
            "average": None,
            "min": None,
            "max": None,
        }

    stats = supplier_evals.aggregate(
        avg=Avg("final_score"), min=Min("final_score"), max=Max("final_score")
    )
    return {
        "previousEvaluationsCount": supplier_evals.count(),
        "average": _decimal_to_str(stats["avg"]),
        "min": _decimal_to_str(stats["min"]),
        "max": _decimal_to_str(stats["max"]),
    }


def _criteria_breakdown_payload(item: SupplierEvaluation) -> dict:
    groups = {
        "quality": [
            "Qualidade do Produto/Serviço",
            "Atendimento aos Requisitos Técnicos",
        ],
        "delivery": ["Cumprimento de Prazos", "Logística e Entrega"],
        "service": ["Atendimento e Suporte", "Suporte Técnico / Pós-venda"],
        "commercial": ["Preço e Custo-benefício", "Condições de Pagamento"],
        "management": [
            "Conformidade Documental",
            "Comprometimento do Fornecedor",
            "Flexibilidade e Adaptação",
        ],
    }
    scores = item.criterion_scores.select_related("criterion").all()
    if not scores:
        return {}

    result = {}
    for group_key, criteria_names in groups.items():
        group_scores = [
            score for score in scores if score.criterion.name in criteria_names
        ]
        if not group_scores:
            result[group_key] = None
            continue
        weighted_sum = sum(
            score.score * score.criterion.weight for score in group_scores
        )
        total_weight = sum(score.criterion.weight for score in group_scores)
        result[group_key] = (
            _decimal_to_str(weighted_sum / total_weight) if total_weight > 0 else None
        )
    return result


def serialize_supplier_evaluation_detail(item: SupplierEvaluation) -> dict:
    """Serialize detailed supplier evaluation output."""
    return {
        "id": item.id,
        "supplier": serialize_supplier(item.supplier),
        "evaluationYear": item.evaluation_year,
        "periodType": item.period_type,
        "periodNumber": item.period_number,
        "periodLabel": _period_label(item.period_type, item.period_number),
        "evaluatorName": item.evaluator_name,
        "evaluationDate": (
            item.evaluation_date.isoformat() if item.evaluation_date else None
        ),
        "comments": item.comments,
        "finalScore": _decimal_to_str(item.final_score),
        "finalClassification": item.final_classification,
        "criterionScores": [
            serialize_criterion_score(score)
            for score in item.criterion_scores.select_related("criterion").all()
        ],
        "averageScore": _average_score_payload(item),
        "criteriaBreakdown": _criteria_breakdown_payload(item),
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None,
    }


def serialize_evaluation_summary(item: SupplierEvaluation) -> dict:
    """Serialize evaluation summary item."""
    return {
        "id": item.id,
        "supplier": item.supplier_id,
        "supplierName": item.supplier.legal_name,
        "supplierTradeName": item.supplier.trade_name,
        "evaluationYear": item.evaluation_year,
        "periodType": item.period_type,
        "periodNumber": item.period_number,
        "periodLabel": _period_label(item.period_type, item.period_number),
        "finalScore": _decimal_to_str(item.final_score),
        "evaluationDate": (
            item.evaluation_date.isoformat() if item.evaluation_date else None
        ),
        "finalClassification": item.final_classification,
    }


def serialize_evaluation_history(item: SupplierEvaluation) -> dict:
    """Serialize supplier evaluation history item."""
    return {
        "id": item.id,
        "evaluationYear": item.evaluation_year,
        "periodType": item.period_type,
        "periodNumber": item.period_number,
        "periodLabel": _period_label(item.period_type, item.period_number),
        "evaluationDate": (
            item.evaluation_date.isoformat() if item.evaluation_date else None
        ),
        "evaluatorName": item.evaluator_name,
        "finalScore": _decimal_to_str(item.final_score),
        "comments": item.comments,
    }
