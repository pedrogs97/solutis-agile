"""Schemas Pydantic para o módulo FO-PAT-02 (Avaliação Técnica de Patrimônio)"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CatalogComponentBaseSchema(BaseModel):
    name: str = Field(..., description="Nome do componente")


class CatalogComponentCreateSchema(CatalogComponentBaseSchema):
    pass


class CatalogComponentOutSchema(CatalogComponentBaseSchema):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ComponentItemSchema(BaseModel):
    name: str = Field(..., description="Nome da peça/componente")
    quantity: int = Field(default=1, ge=0)
    condition: str = Field(
        default="Boa", description="Condição: Boa, Regular, Danificada, Inservível"
    )
    destination: str = Field(
        default="Reaproveitamento interno", description="Destino da peça"
    )
    observations: Optional[str] = Field(default=None)


class ComponentItemOutSchema(ComponentItemSchema):
    id: int
    evaluation_id: int

    model_config = ConfigDict(from_attributes=True)


class AttachmentOutSchema(BaseModel):
    id: int
    file_name: str
    path: str
    checklist_key: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AssetEvaluationBaseSchema(BaseModel):
    asset_id: Optional[int] = Field(
        default=None, description="ID do ativo no banco (se cadastrado)"
    )
    patrimonio: Optional[str] = Field(
        default=None, description="Número de patrimônio ou tombo"
    )
    asset_type_name: Optional[str] = Field(
        default=None, description="Tipo de ativo (Notebook, Mobiliário, etc.)"
    )
    brand_model: Optional[str] = Field(
        default=None, description="Marca e modelo do ativo"
    )
    serial_number: Optional[str] = Field(default=None, description="Número de série")
    cost_center: Optional[str] = Field(default=None, description="Centro de custo")
    unity: Optional[str] = Field(default=None, description="Unidade ou filial")

    status: str = Field(default="Rascunho", description="Status da avaliação")
    classification: Optional[str] = Field(
        default=None, description="Excelente, Bom, Regular, Danificado, Inservível"
    )
    feasibility: Optional[str] = Field(
        default=None, description="Alta, Média, Baixa, Inviável"
    )
    destination: List[str] = Field(
        default_factory=list, description="Lista de destinos selecionados"
    )

    gross_weight: float = Field(default=0.0, ge=0.0, description="Peso bruto em kg")
    reused_weight: float = Field(
        default=0.0, ge=0.0, description="Peso reaproveitado em kg"
    )
    discarded_weight: float = Field(
        default=0.0, ge=0.0, description="Peso descartado em kg"
    )
    recycle_weight: float = Field(
        default=0.0, ge=0.0, description="Peso encaminhado para reciclagem em kg"
    )
    reuse_percentage: float = Field(
        default=0.0,
        ge=0.0,
        le=100.0,
        description="Percentual calculado de aproveitamento",
    )

    acquisition_value: float = Field(
        default=0.0, ge=0.0, description="Valor original de aquisição em R$"
    )
    net_book_value: float = Field(
        default=0.0, ge=0.0, description="Valor contábil líquido em R$"
    )
    estimated_economy: float = Field(
        default=0.0, ge=0.0, description="Economia estimada gerada em R$"
    )

    justification: Optional[str] = Field(
        default=None, description="Justificativa da baixa/descarte"
    )
    technical_opinion: Optional[str] = Field(
        default=None, description="Parecer técnico detalhado"
    )

    @model_validator(mode="after")
    def calculate_esg_and_financials(self) -> "AssetEvaluationBaseSchema":
        """Calcula automaticamente a taxa ESG de reaproveitamento e a economia financeira estimada."""
        if self.gross_weight > 0:
            calculated_pct = (self.reused_weight / self.gross_weight) * 100.0
            self.reuse_percentage = round(min(100.0, max(0.0, calculated_pct)), 2)
        else:
            self.reuse_percentage = 0.0

        if self.net_book_value > 0 and self.reuse_percentage > 0:
            self.estimated_economy = round(
                self.net_book_value * (self.reuse_percentage / 100.0), 2
            )
        return self


class AssetEvaluationCreateSchema(AssetEvaluationBaseSchema):
    protocol: Optional[str] = Field(
        default=None, description="Protocolo (gerado automaticamente se omitido)"
    )
    components: List[ComponentItemSchema] = Field(
        default_factory=list, description="Matriz dinâmica de componentes"
    )
    new_components_for_catalog: List[str] = Field(
        default_factory=list,
        description="Novos nomes de componentes digitados na matriz para auto-cadastro no catálogo",
    )


class AssetEvaluationUpdateSchema(BaseModel):
    asset_id: Optional[int] = None
    patrimonio: Optional[str] = None
    asset_type_name: Optional[str] = None
    brand_model: Optional[str] = None
    serial_number: Optional[str] = None
    cost_center: Optional[str] = None
    unity: Optional[str] = None

    status: Optional[str] = None
    classification: Optional[str] = None
    feasibility: Optional[str] = None
    destination: Optional[List[str]] = None

    gross_weight: Optional[float] = None
    reused_weight: Optional[float] = None
    discarded_weight: Optional[float] = None
    recycle_weight: Optional[float] = None
    reuse_percentage: Optional[float] = None

    acquisition_value: Optional[float] = None
    net_book_value: Optional[float] = None
    estimated_economy: Optional[float] = None

    justification: Optional[str] = None
    technical_opinion: Optional[str] = None

    components: Optional[List[ComponentItemSchema]] = None
    new_components_for_catalog: Optional[List[str]] = None


class AssetEvaluationApproveSchema(BaseModel):
    comments: Optional[str] = Field(
        default=None, description="Parecer/comentário de aprovação"
    )
    write_off_asset: bool = Field(
        default=True,
        description="Se True, baixa automaticamente o ativo no sistema com status DESCARTE",
    )


class AssetEvaluationOutSchema(BaseModel):
    id: int
    protocol: str
    evaluation_date: datetime

    asset_id: Optional[int] = None
    patrimonio: Optional[str] = None
    asset_type_name: Optional[str] = None
    brand_model: Optional[str] = None
    serial_number: Optional[str] = None
    cost_center: Optional[str] = None
    unity: Optional[str] = None

    status: str
    classification: Optional[str] = None
    feasibility: Optional[str] = None
    destination: List[str] = Field(default_factory=list)

    gross_weight: float
    reused_weight: float
    discarded_weight: float
    recycle_weight: float
    reuse_percentage: float

    acquisition_value: float
    net_book_value: float
    estimated_economy: float

    justification: Optional[str] = None
    technical_opinion: Optional[str] = None

    evaluator_id: Optional[int] = None
    evaluator_name: Optional[str] = None
    approver_id: Optional[int] = None
    approver_name: Optional[str] = None
    approval_date: Optional[datetime] = None
    approval_comments: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    components: List[ComponentItemOutSchema] = Field(default_factory=list)
    attachments: List[AttachmentOutSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AssetEvaluationListOutSchema(BaseModel):
    items: List[AssetEvaluationOutSchema]
    total: int
    page: int
    size: int
    pages: int


class AssetEvaluationMetricsSchema(BaseModel):
    total_evaluations: int = Field(..., description="Total de avaliações finalizadas")
    total_reused_assets: int = Field(
        ..., description="Total com reaproveitamento interno/estoque"
    )
    total_written_off_assets: int = Field(
        ..., description="Total com baixa/descarte efetivado"
    )
    total_reused_weight: float = Field(
        ..., description="Total em peso (kg) reaproveitado"
    )
    total_discarded_weight: float = Field(
        ..., description="Total em peso (kg) descartado"
    )
    total_recycle_weight: float = Field(
        ..., description="Total em peso (kg) para reciclagem"
    )
    average_reuse_percentage: float = Field(
        ..., description="Taxa média global de reaproveitamento ESG (%)"
    )
    total_estimated_economy: float = Field(
        ..., description="Economia estimada total gerada em R$"
    )
