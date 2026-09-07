"""
Schemas for Purchase Process (FO-AD-01) - Ninja API v1
"""

from typing import Any, Dict, List, Optional

from ninja import Schema
from pydantic import Field
from src.api.v1.schemas.common import CamelSchema


class PurchaseIdentificationSchema(Schema):
    data: Optional[str] = None
    categoria: str = "Normal"
    modalidade: str = "Produto"
    centroCusto: str = ""
    objeto: str = ""
    tipoContratacao: str = "Compra nova"
    risco: str = "Baixo"
    solicitante: str = ""
    compradorResponsavel: str = ""


class PurchaseSupplierSchema(Schema):
    id: str
    nome: str = ""
    cnpj: str = ""
    desconto: float = 0.0
    impostos: float = 0.0
    frete: float = 0.0
    outros: float = 0.0
    valorBrutoManual: Optional[float] = None
    orcado: Optional[float] = None
    condPagamento: str = ""
    prazoEntrega: str = ""
    validadeProposta: str = ""
    garantia: str = ""
    obs: str = ""


class PurchaseItemSchema(Schema):
    id: str
    descricao: str = ""
    qtd: float = 1.0
    unidade: str = "UN"
    precos: Dict[str, Optional[float]] = Field(default_factory=dict)


class PurchaseDecisionSchema(Schema):
    fornecedorRecomendadoId: str = ""
    minimoAtingido: str = "sim"
    motivoKey: str = ""
    justificativa: str = ""
    recomendacao: str = ""
    observacoes: str = ""


class PurchaseApprovalSchema(Schema):
    status: str = "Pendente"
    aprovadoPor: str = ""
    dataDecisao: str = ""
    comentario: str = ""


class PurchaseEvaluationSchema(Schema):
    preenchida: bool = False
    razaoSocial: str = ""
    cnpj: str = ""
    descritivoCompra: str = ""
    nfNumero: str = ""
    dataCompra: str = ""
    criterios: Dict[str, Any] = Field(default_factory=dict)
    avaliador: str = ""
    dataAvaliacao: str = ""


class PurchaseProcessCreateIn(Schema):
    schemaVersion: int = 1
    identificacao: PurchaseIdentificationSchema
    fornecedores: List[PurchaseSupplierSchema] = Field(default_factory=list)
    itens: List[PurchaseItemSchema] = Field(default_factory=list)
    decisao: Optional[PurchaseDecisionSchema] = None
    aprovacao: Optional[PurchaseApprovalSchema] = None
    avaliacao: Optional[PurchaseEvaluationSchema] = None


class PurchaseProcessUpdateIn(Schema):
    schemaVersion: int = 1
    identificacao: Optional[PurchaseIdentificationSchema] = None
    fornecedores: Optional[List[PurchaseSupplierSchema]] = None
    itens: Optional[List[PurchaseItemSchema]] = None
    decisao: Optional[PurchaseDecisionSchema] = None
    aprovacao: Optional[PurchaseApprovalSchema] = None
    avaliacao: Optional[PurchaseEvaluationSchema] = None


class PurchaseProcessDecisionIn(CamelSchema):
    status: str
    aprovado_por: Optional[str] = ""
    data_decisao: Optional[str] = ""
    comentario: Optional[str] = ""


class PurchaseProcessComputedSchema(Schema):
    valorProcesso: float = 0.0
    menorCta: Optional[float] = None
    maiorCta: Optional[float] = None
    economiaEstimada: float = 0.0
    indiceAvaliacao: Optional[float] = None
    classificacaoDesempenho: Optional[str] = None
    fornecedorRecomendadoNome: Optional[str] = None


class PurchaseProcessOut(Schema):
    id: str
    schemaVersion: int = 1
    criadoEm: str
    atualizadoEm: str
    identificacao: Dict[str, Any]
    fornecedores: List[Dict[str, Any]]
    itens: List[Dict[str, Any]]
    decisao: Dict[str, Any]
    aprovacao: Dict[str, Any]
    avaliacao: Dict[str, Any]
    computed: PurchaseProcessComputedSchema


class PurchaseProcessSummaryOut(Schema):
    id: str
    data: Optional[str] = None
    objeto: str
    categoria: str
    solicitante: str
    compradorResponsavel: str
    fornecedorRecomendadoNome: Optional[str] = None
    valorProcesso: float
    status: str
    criadoEm: str
    atualizadoEm: str


class PaginatedPurchaseProcessListOut(Schema):
    count: int
    items: List[PurchaseProcessSummaryOut]
    page: int
    pageSize: int
    totalPages: int


class MetricDistributionItem(Schema):
    label: str
    value: int
    display: str
    color: Optional[str] = None


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
    tempoMedioDecisaoDias: Optional[float] = None
    taxaConformidadeCotacao: Optional[int] = None
    statusDistribution: List[MetricDistributionItem]
    monthlyTrend: List[MonthlyTrendItem]
    categoryDistribution: List[MetricDistributionItem]
    agingQueue: List[AgingQueueItem]
    topBuyers: List[MetricDistributionItem]
    supplierEvaluationDistribution: List[MetricDistributionItem]
