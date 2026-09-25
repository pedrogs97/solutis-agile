"""
Schemas for Purchase Process (FO-AD-01) - Ninja API v1
"""

from typing import Any

from ninja import Schema
from pydantic import Field
from src.api.v1.schemas.common import CamelSchema


class PurchaseIdentificationSchema(CamelSchema):
    data: str | None = None
    categoria: str = "Normal"
    modalidade: str = "Produto"
    centro_custo: str = ""
    objeto: str = ""
    tipo_contratacao: str = "Compra nova"
    risco: str = "Baixo"
    solicitante: str = ""
    comprador_responsavel: str = ""


class PurchaseSupplierSchema(CamelSchema):
    id: str
    nome: str = ""
    cnpj: str = ""
    desconto: float = 0.0
    impostos: float = 0.0
    frete: float = 0.0
    outros: float = 0.0
    valor_bruto_manual: float | None = None
    orcado: float | None = None
    cond_pagamento: str = ""
    prazo_entrega: str = ""
    validade_proposta: str = ""
    garantia: str = ""
    obs: str = ""


class PurchaseItemSchema(CamelSchema):
    id: str
    descricao: str = ""
    qtd: float = 1.0
    unidade: str = "UN"
    precos: dict[str, float | None] = Field(default_factory=dict)


class PurchaseDecisionSchema(CamelSchema):
    fornecedor_recomendado_id: str = ""
    minimo_atingido: str = "sim"
    motivo_key: str = ""
    justificativa: str = ""
    recomendacao: str = ""
    observacoes: str = ""


class PurchaseApprovalSchema(CamelSchema):
    status: str = "Pendente"
    aprovado_por: str = ""
    data_decisao: str = ""
    comentario: str = ""


class PurchaseEvaluationSchema(CamelSchema):
    preenchida: bool = False
    razao_social: str = ""
    cnpj: str = ""
    descritivo_compra: str = ""
    nf_numero: str = ""
    data_compra: str = ""
    criterios: dict[str, Any] = Field(default_factory=dict)
    avaliador: str = ""
    data_avaliacao: str = ""


class PurchaseProcessCreateIn(CamelSchema):
    schema_version: int = 1
    identificacao: PurchaseIdentificationSchema
    fornecedores: list[PurchaseSupplierSchema] = Field(default_factory=list)
    itens: list[PurchaseItemSchema] = Field(default_factory=list)
    decisao: PurchaseDecisionSchema | None = None
    aprovacao: PurchaseApprovalSchema | None = None
    avaliacao: PurchaseEvaluationSchema | None = None


class PurchaseProcessUpdateIn(CamelSchema):
    schema_version: int = 1
    identificacao: PurchaseIdentificationSchema | None = None
    fornecedores: list[PurchaseSupplierSchema] | None = None
    itens: list[PurchaseItemSchema] | None = None
    decisao: PurchaseDecisionSchema | None = None
    aprovacao: PurchaseApprovalSchema | None = None
    avaliacao: PurchaseEvaluationSchema | None = None


class PurchaseProcessDecisionIn(CamelSchema):
    status: str
    aprovado_por: str | None = ""
    data_decisao: str | None = ""
    comentario: str | None = ""
    decisao: PurchaseDecisionSchema | None = None


class PurchaseProcessComputedSchema(Schema):
    valorProcesso: float = 0.0
    menorCta: float | None = None
    maiorCta: float | None = None
    economiaEstimada: float = 0.0
    indiceAvaliacao: float | None = None
    classificacaoDesempenho: str | None = None
    fornecedorRecomendadoNome: str | None = None


class PurchaseProcessOut(Schema):
    id: str
    schemaVersion: int = 1
    criadoEm: str
    atualizadoEm: str
    identificacao: dict[str, Any]
    fornecedores: list[dict[str, Any]]
    itens: list[dict[str, Any]]
    decisao: dict[str, Any]
    aprovacao: dict[str, Any]
    avaliacao: dict[str, Any]
    computed: PurchaseProcessComputedSchema


class PurchaseProcessSummaryOut(Schema):
    id: str
    data: str | None = None
    objeto: str
    categoria: str
    solicitante: str
    compradorResponsavel: str
    fornecedorRecomendadoNome: str | None = None
    valorProcesso: float
    status: str
    criadoEm: str
    atualizadoEm: str


class PaginatedPurchaseProcessListOut(Schema):
    count: int
    items: list[PurchaseProcessSummaryOut]
    page: int
    pageSize: int
    totalPages: int


class MetricDistributionItem(Schema):
    label: str
    value: int
    display: str
    color: str | None = None


class MonthlyTrendItem(Schema):
    key: str
    label: str
    value: int


class AgingQueueItem(Schema):
    id: str
    objeto: str
    compradorResponsavel: str
    status: str
    diasAguardando: int


class PurchaseProcessMetricsOut(Schema):
    totalProcessos: int
    valorTotalAprovado: float
    ticketMedio: float
    economiaIdentificada: float
    tempoMedioDecisaoDias: float | None = None
    taxaConformidadeCotacao: int | None = None
    statusDistribution: list[MetricDistributionItem]
    monthlyTrend: list[MonthlyTrendItem]
    categoryDistribution: list[MetricDistributionItem]
    agingQueue: list[AgingQueueItem]
    topBuyers: list[MetricDistributionItem]
    supplierEvaluationDistribution: list[MetricDistributionItem]
