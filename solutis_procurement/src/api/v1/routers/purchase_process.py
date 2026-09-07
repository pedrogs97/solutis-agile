"""
Purchase Process router for Ninja API v1 (FO-AD-01).
"""

# pylint: disable=too-many-branches,too-many-statements,too-many-positional-arguments

import math
from datetime import datetime, timedelta
from typing import Dict, Optional

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from ninja import Router
from src.api.v1.schemas.common import ErrorOut
from src.api.v1.schemas.purchase_process import (
    AgingQueueItem,
    MetricDistributionItem,
    MonthlyTrendItem,
    PaginatedPurchaseProcessListOut,
    PurchaseProcessComputedSchema,
    PurchaseProcessCreateIn,
    PurchaseProcessDecisionIn,
    PurchaseProcessMetricsOut,
    PurchaseProcessOut,
    PurchaseProcessSummaryOut,
    PurchaseProcessUpdateIn,
)
from src.supplier.models.purchase_process import PurchaseProcess

router = Router(tags=["purchase_processes"])


def _serialize_computed(proc: PurchaseProcess) -> PurchaseProcessComputedSchema:
    lowest = proc.get_lowest_cta_supplier()
    highest = proc.get_highest_cta_supplier()
    selected = proc.get_selected_supplier()

    return PurchaseProcessComputedSchema(
        valorProcesso=proc.get_process_value(),
        menorCta=proc.calculate_cta(lowest) if lowest else None,
        maiorCta=proc.calculate_cta(highest) if highest else None,
        economiaEstimada=proc.get_estimated_savings(),
        indiceAvaliacao=proc.get_evaluation_index(),
        classificacaoDesempenho=proc.get_performance_classification(),
        fornecedorRecomendadoNome=selected.get("nome") if selected else None,
    )


def serialize_purchase_process(proc: PurchaseProcess) -> PurchaseProcessOut:
    """Serialize full purchase process model to output schema."""
    return PurchaseProcessOut(
        id=str(proc.id),
        schemaVersion=proc.schema_version,
        criadoEm=proc.created_at.isoformat() if proc.created_at else "",
        atualizadoEm=proc.updated_at.isoformat() if proc.updated_at else "",
        identificacao=proc.identification or {},
        fornecedores=proc.suppliers or [],
        itens=proc.items or [],
        decisao=proc.decision or {},
        aprovacao=proc.approval or {},
        avaliacao=proc.evaluation or {},
        computed=_serialize_computed(proc),
    )


def serialize_purchase_summary(proc: PurchaseProcess) -> PurchaseProcessSummaryOut:
    """Serialize purchase process model to list summary output schema."""
    selected = proc.get_selected_supplier()
    ident = proc.identification or {}
    return PurchaseProcessSummaryOut(
        id=str(proc.id),
        data=ident.get("data")
        or (proc.process_date.isoformat() if proc.process_date else None),
        objeto=proc.object_description or ident.get("objeto") or "(Sem objeto)",
        categoria=proc.category or ident.get("categoria") or "Normal",
        solicitante=proc.requester or ident.get("solicitante") or "",
        compradorResponsavel=proc.responsible_buyer
        or ident.get("compradorResponsavel")
        or "",
        fornecedorRecomendadoNome=selected.get("nome") if selected else None,
        valorProcesso=proc.get_process_value(),
        status=proc.status,
        criadoEm=proc.created_at.isoformat() if proc.created_at else "",
        atualizadoEm=proc.updated_at.isoformat() if proc.updated_at else "",
    )


@router.get(
    "/purchase-processes/",
    response={200: PaginatedPurchaseProcessListOut, 400: ErrorOut},
    operation_id="listPurchaseProcesses",
)
def list_purchase_processes(
    request,
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
    order_by: str = "-updated_at",
):
    """List purchase processes with filtering and pagination."""
    qs = PurchaseProcess.objects.all()

    if search:
        s = search.strip()
        qs = qs.filter(
            Q(object_description__icontains=s)
            | Q(responsible_buyer__icontains=s)
            | Q(requester__icontains=s)
        )

    if status:
        qs = qs.filter(status=status)

    if category:
        qs = qs.filter(category=category)

    valid_orderings = [
        "-updated_at",
        "updated_at",
        "-created_at",
        "created_at",
        "-process_date",
        "process_date",
        "status",
        "-status",
    ]
    if order_by in valid_orderings:
        qs = qs.order_by(order_by)
    else:
        qs = qs.order_by("-updated_at")

    total_count = qs.count()
    page_size = max(1, min(page_size, 200))
    total_pages = max(1, math.ceil(total_count / page_size)) if total_count > 0 else 1
    page = max(1, min(page, total_pages))

    start = (page - 1) * page_size
    end = start + page_size
    items = [serialize_purchase_summary(p) for p in qs[start:end]]

    return 200, {
        "count": total_count,
        "items": items,
        "page": page,
        "pageSize": page_size,
        "totalPages": total_pages,
    }


@router.get(
    "/purchase-processes/metrics/",
    response={200: PurchaseProcessMetricsOut},
    operation_id="getPurchaseProcessMetrics",
)
def get_purchase_process_metrics(
    request,
    periodo: Optional[str] = None,
    categoria: Optional[str] = None,
):
    """Retrieve executive metrics and aggregated indicators for purchase processes."""
    qs = PurchaseProcess.objects.all()

    if categoria:
        qs = qs.filter(category=categoria)

    now = timezone.now()
    if periodo == "30":
        cutoff = now - timedelta(days=30)
        qs = qs.filter(created_at__gte=cutoff)
    elif periodo == "90":
        cutoff = now - timedelta(days=90)
        qs = qs.filter(created_at__gte=cutoff)
    elif periodo == "ano":
        cutoff = timezone.datetime(now.year, 1, 1, tzinfo=now.tzinfo)
        qs = qs.filter(created_at__gte=cutoff)

    processes = list(qs)
    total_count = len(processes)

    aprovados = [p for p in processes if p.status == "Aprovado"]
    valor_total_aprovado = sum(p.get_process_value() for p in aprovados)
    ticket_medio = (valor_total_aprovado / len(aprovados)) if aprovados else 0.0
    economia_identificada = sum(p.get_estimated_savings() for p in processes)

    # Tempo médio de decisão (para decididos: Aprovado ou Reprovado)
    tempos = []
    conformes = 0
    for p in processes:
        # Conformidade de cotações
        filled_cnt = len(p.get_filled_suppliers())
        dec = p.decision or {}
        min_reached = dec.get("minimoAtingido") == "sim" or filled_cnt >= 3
        has_reason = bool(dec.get("motivoKey"))
        if min_reached or (dec.get("minimoAtingido") == "nao" and has_reason):
            conformes += 1

        # Tempo de decisão
        if p.status in ["Aprovado", "Reprovado"]:
            apr = p.approval or {}
            dec_date_str = apr.get("dataDecisao")
            if dec_date_str and p.created_at:
                try:
                    dec_date = datetime.fromisoformat(
                        dec_date_str.replace("Z", "+00:00")
                    )
                    if dec_date.tzinfo is None:
                        dec_date = timezone.make_aware(dec_date)
                    diff_days = max(
                        0, (dec_date - p.created_at).total_seconds() / 86400.0
                    )
                    tempos.append(diff_days)
                except Exception:
                    pass

    tempo_medio = (sum(tempos) / len(tempos)) if tempos else None
    taxa_conformidade = (
        round((conformes / total_count) * 100) if total_count > 0 else None
    )

    # Status distribution
    status_order = ["Pendente", "Em análise", "Aprovado", "Reprovado", "Dispensado"]
    status_colors = {
        "Pendente": "#868e96",
        "Em análise": "#228be6",
        "Aprovado": "#40c057",
        "Reprovado": "#fa5252",
        "Dispensado": "#adb5bd",
    }
    status_dist = []
    for st in status_order:
        cnt = sum(1 for p in processes if p.status == st)
        if cnt > 0:
            status_dist.append(
                MetricDistributionItem(
                    label=st,
                    value=cnt,
                    display=str(cnt),
                    color=status_colors.get(st, "#228be6"),
                )
            )

    # Category distribution
    cat_dist = []
    for cat in ["Normal", "Urgência", "Prioridade"]:
        cnt = sum(1 for p in processes if p.category == cat)
        if cnt > 0:
            cat_dist.append(
                MetricDistributionItem(
                    label=cat,
                    value=cnt,
                    display=str(cnt),
                    color=(
                        "#12b886"
                        if cat == "Normal"
                        else "#fd7e14" if cat == "Prioridade" else "#e03131"
                    ),
                )
            )

    # Top buyers
    buyers_map: Dict[str, int] = {}
    for p in processes:
        buyer = (p.responsible_buyer or "").strip()
        if buyer:
            buyers_map[buyer] = buyers_map.get(buyer, 0) + 1
    sorted_buyers = sorted(buyers_map.items(), key=lambda x: x[1], reverse=True)[:6]
    top_buyers = [
        MetricDistributionItem(
            label=b[0], value=b[1], display=str(b[1]), color="#4c6ef5"
        )
        for b in sorted_buyers
    ]

    # Supplier evaluation distribution
    classif_map = {"Excelente": 0, "Satisfatório": 0, "Atenção": 0, "Insatisfatório": 0}
    classif_colors = {
        "Excelente": "#40c057",
        "Satisfatório": "#228be6",
        "Atenção": "#fab005",
        "Insatisfatório": "#fa5252",
    }
    for p in processes:
        cl = p.get_performance_classification()
        if cl and cl in classif_map:
            classif_map[cl] += 1
    eval_dist = [
        MetricDistributionItem(
            label=k,
            value=v,
            display=str(v),
            color=classif_colors.get(k),
        )
        for k, v in classif_map.items()
        if v > 0
    ]

    # Monthly Trend (last 6 months across all processes)
    months_trend = []
    month_names = [
        "Jan",
        "Fev",
        "Mar",
        "Abr",
        "Mai",
        "Jun",
        "Jul",
        "Ago",
        "Set",
        "Out",
        "Nov",
        "Dez",
    ]
    all_qs = PurchaseProcess.objects.all()
    if categoria:
        all_qs = all_qs.filter(category=categoria)

    for i in range(5, -1, -1):
        target_month_date = now - timedelta(days=i * 30)
        y = target_month_date.year
        m = target_month_date.month
        month_label = f"{month_names[m - 1]}/{str(y)[2:]}"
        month_key = f"{y}-{m:02d}"

        cnt = all_qs.filter(created_at__year=y, created_at__month=m).count()
        months_trend.append(
            MonthlyTrendItem(
                key=month_key,
                label=month_label,
                value=cnt,
            )
        )

    # Aging Queue (Pending / Under Analysis, oldest first)
    pending_processes = [
        p for p in processes if p.status in ["Pendente", "Em análise"] and p.created_at
    ]
    pending_processes.sort(key=lambda p: p.created_at)
    aging_queue = []
    for p in pending_processes[:7]:
        dias = max(0, (now - p.created_at).days)
        ident = p.identification or {}
        aging_queue.append(
            AgingQueueItem(
                id=str(p.id),
                objeto=p.object_description or ident.get("objeto") or "(Sem objeto)",
                compradorResponsavel=p.responsible_buyer
                or ident.get("compradorResponsavel")
                or "—",
                status=p.status,
                diasAguardando=dias,
            )
        )

    return 200, {
        "totalProcessos": total_count,
        "valorTotalAprovado": round(valor_total_aprovado, 2),
        "ticketMedio": round(ticket_medio, 2),
        "economiaIdentificada": round(economia_identificada, 2),
        "tempoMedioDecisaoDias": (
            round(tempo_medio, 1) if tempo_medio is not None else None
        ),
        "taxaConformidadeCotacao": taxa_conformidade,
        "statusDistribution": status_dist,
        "monthlyTrend": months_trend,
        "categoryDistribution": cat_dist,
        "agingQueue": aging_queue,
        "topBuyers": top_buyers,
        "supplierEvaluationDistribution": eval_dist,
    }


@router.get(
    "/purchase-processes/{id}/",
    response={200: PurchaseProcessOut, 404: ErrorOut},
    operation_id="getPurchaseProcess",
)
def get_purchase_process(request, id: str):
    """Retrieve full details of a purchase process by ID."""
    proc = get_object_or_404(PurchaseProcess, id=id)
    return 200, serialize_purchase_process(proc)


@router.post(
    "/purchase-processes/",
    response={201: PurchaseProcessOut, 400: ErrorOut},
    operation_id="createPurchaseProcess",
)
def create_purchase_process(request, payload: PurchaseProcessCreateIn):
    """Create a new purchase process."""
    data = payload.dict()
    proc = PurchaseProcess(
        schema_version=data.get("schemaVersion", 1),
        identification=data.get("identificacao") or {},
        suppliers=data.get("fornecedores") or [],
        items=data.get("itens") or [],
        decision=data.get("decisao") or {},
        approval=data.get("aprovacao") or {},
        evaluation=data.get("avaliacao") or {},
    )
    proc.save()
    return 201, serialize_purchase_process(proc)


@router.put(
    "/purchase-processes/{id}/",
    response={200: PurchaseProcessOut, 400: ErrorOut, 404: ErrorOut},
    operation_id="updatePurchaseProcess",
)
def update_purchase_process(request, id: str, payload: PurchaseProcessUpdateIn):
    """Update an existing purchase process."""
    proc = get_object_or_404(PurchaseProcess, id=id)
    data = payload.dict(exclude_unset=True)

    if "identificacao" in data and data["identificacao"] is not None:
        proc.identification = data["identificacao"]
    if "fornecedores" in data and data["fornecedores"] is not None:
        proc.suppliers = data["fornecedores"]
    if "itens" in data and data["itens"] is not None:
        proc.items = data["itens"]
    if "decisao" in data and data["decisao"] is not None:
        proc.decision = data["decisao"]
    if "aprovacao" in data and data["aprovacao"] is not None:
        proc.approval = data["aprovacao"]
    if "avaliacao" in data and data["avaliacao"] is not None:
        proc.evaluation = data["avaliacao"]

    proc.save()
    return 200, serialize_purchase_process(proc)


@router.delete(
    "/purchase-processes/{id}/",
    response={200: Dict[str, bool], 404: ErrorOut},
    operation_id="deletePurchaseProcess",
)
def delete_purchase_process(request, id: str):
    """Delete a purchase process."""
    proc = get_object_or_404(PurchaseProcess, id=id)
    proc.delete()
    return 200, {"ok": True}


@router.post(
    "/purchase-processes/{id}/decision/",
    response={200: PurchaseProcessOut, 400: ErrorOut, 404: ErrorOut},
    operation_id="decidePurchaseProcess",
)
def decide_purchase_process(request, id: str, payload: PurchaseProcessDecisionIn):
    """Record an approval or decision on a purchase process."""
    proc = get_object_or_404(PurchaseProcess, id=id)
    apr = proc.approval or {}

    apr["status"] = payload.status
    if payload.aprovado_por:
        apr["aprovadoPor"] = payload.aprovado_por
    if payload.data_decisao:
        apr["dataDecisao"] = payload.data_decisao
    elif not apr.get("dataDecisao"):
        apr["dataDecisao"] = timezone.now().isoformat()
    if payload.comentario is not None:
        apr["comentario"] = payload.comentario

    proc.approval = apr
    proc.status = payload.status
    proc.save()
    return 200, serialize_purchase_process(proc)
