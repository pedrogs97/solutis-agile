"""Schemas Pydantic para o módulo FO-PAT-02 (Avaliação Técnica de Patrimônio)"""

from datetime import datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class CatalogComponentBaseSchema(BaseModel):
    name: str = Field(..., description="Nome do componente")


class CatalogComponentCreateSchema(CatalogComponentBaseSchema):
    pass


class CatalogComponentOutSchema(CatalogComponentBaseSchema):
    id: int
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetDepreciationCategorySchema(BaseModel):
    id: int
    name: str
    annual_rate: float
    useful_life_months: int
    lifespan_months: int | None = None
    description: str | None = None
    active: bool = True
    is_active: bool = True

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    @model_validator(mode="after")
    def populate_aliases(self) -> Self:
        if self.lifespan_months is None:
            self.lifespan_months = self.useful_life_months
        self.is_active = self.active
        return self


class VCLCalculationInputSchema(BaseModel):
    valor_aquisicao: float = Field(
        default=0.0, ge=0.0, description="Valor original de aquisição"
    )
    acquisition_value: float | None = Field(default=None)
    data_aquisicao: str | None = Field(
        default=None, description="Data de aquisição (YYYY-MM-DD)"
    )
    acquisition_date: str | None = Field(default=None)
    vida_util_meses: int | None = Field(default=None, ge=0)
    lifespan_months: int | None = Field(default=None)
    annual_rate: float | None = Field(default=None)
    depreciation_category_id: int | None = Field(default=None)
    data_referencia: str | None = Field(
        default=None, description="Data de referência (YYYY-MM-DD)"
    )
    reference_date: str | None = Field(default=None)
    valor_residual: float = Field(
        default=0.0, ge=0.0, description="Valor residual em R$"
    )
    residual_value: float | None = Field(default=None)
    data_baixa: str | None = Field(
        default=None, description="Data da baixa (YYYY-MM-DD)"
    )
    write_off_date: str | None = Field(default=None)

    @model_validator(mode="after")
    def unify_fields(self) -> Self:
        if self.acquisition_value is not None:
            self.valor_aquisicao = self.acquisition_value
        if self.acquisition_date is not None:
            self.data_aquisicao = self.acquisition_date
        if self.lifespan_months is not None:
            self.vida_util_meses = self.lifespan_months
        if self.reference_date is not None:
            self.data_referencia = self.reference_date
        if self.residual_value is not None:
            self.valor_residual = self.residual_value
        if self.write_off_date is not None:
            self.data_baixa = self.write_off_date
        if not self.data_aquisicao:
            raise ValueError("Data de aquisição é obrigatória.")
        return self


class VCLCalculationOutputSchema(BaseModel):
    depreciacao_mensal: float
    monthly_depreciation: float | None = None
    meses: int
    depreciated_months: int | None = None
    depreciacao_acumulada: float
    accumulated_depreciation: float | None = None
    vcl: float
    net_book_value: float | None = None
    base_depreciavel: float
    base_depreciable: float | None = None
    vida_util_meses: int
    lifespan_months: int | None = None
    is_out_of_scope: bool
    annual_rate: float | None = None

    @model_validator(mode="after")
    def populate_bilingual_fields(self) -> Self:
        self.monthly_depreciation = self.depreciacao_mensal
        self.depreciated_months = self.meses
        self.accumulated_depreciation = self.depreciacao_acumulada
        self.net_book_value = self.vcl
        self.base_depreciable = self.base_depreciavel
        self.lifespan_months = self.vida_util_meses
        return self


class ComponentItemSchema(BaseModel):
    name: str = Field(..., description="Nome da peça/componente")
    quantity: int = Field(default=1, ge=0)
    condition: str = Field(
        default="Boa", description="Condição: Boa, Regular, Danificada, Inservível"
    )
    destination: str = Field(
        default="Reaproveitamento interno", description="Destino da peça"
    )
    observations: str | None = Field(default=None)


class ComponentItemOutSchema(ComponentItemSchema):
    id: int
    evaluation_id: int

    model_config = ConfigDict(from_attributes=True)


class AttachmentOutSchema(BaseModel):
    id: int
    file_name: str
    path: str
    checklist_key: str | None = None
    created_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class AssetEvaluationBaseSchema(BaseModel):
    asset_id: int | None = Field(
        default=None, description="ID do ativo no banco (se cadastrado)"
    )
    is_unregistered: bool = Field(
        default=False,
        description="Indica se o ativo não possui número de patrimônio (não tombado)",
    )
    unregistered_description: str | None = Field(
        default=None,
        description="Descrição detalhada do item sem número de patrimônio",
    )
    patrimonio: str | None = Field(
        default=None, description="Número de patrimônio ou tombo"
    )
    asset_type_name: str | None = Field(
        default=None, description="Tipo de ativo (Notebook, Mobiliário, etc.)"
    )
    brand_model: str | None = Field(default=None, description="Marca e modelo do ativo")
    manufacturer: str | None = Field(
        default=None, description="Fabricante do ativo (ex: Dell, Lenovo)"
    )
    model: str | None = Field(
        default=None, description="Modelo do ativo (ex: Latitude 5420)"
    )
    serial_number: str | None = Field(default=None, description="Número de série")
    cost_center: str | None = Field(default=None, description="Centro de custo")
    unity: str | None = Field(default=None, description="Unidade ou filial")
    current_location: str | None = Field(
        default=None, description="Localização atual do ativo"
    )
    acquisition_date: datetime | None = Field(
        default=None, description="Data de aquisição original do bem"
    )
    evaluation_date: datetime | None = Field(
        default=None, description="Data da avaliação técnica"
    )
    evaluator_name: str | None = Field(
        default=None, description="Responsável pela avaliação inicial"
    )
    is_under_warranty: bool | None = Field(
        default=False, description="Indica se o ativo está em garantia"
    )
    warranty_expiry_date: datetime | None = Field(
        default=None, description="Data de validade da garantia"
    )
    asset_description: str | None = Field(
        default=None, description="Descrição complementar do ativo"
    )

    status: str = Field(default="Rascunho", description="Status da avaliação")
    classification: str | None = Field(
        default=None, description="Excelente, Bom, Regular, Danificado, Inservível"
    )
    feasibility: str | None = Field(
        default=None, description="Alta, Média, Baixa, Inviável"
    )
    destination: list[str] = Field(
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

    # ESG & Destinação Ambiental (FO-PAT-02)
    destination_company: str | None = Field(
        default=None, description="Empresa responsável pela destinação"
    )
    destination_cnpj: str | None = Field(
        default=None, description="CNPJ da empresa responsável pela destinação"
    )
    destination_certificate: str | None = Field(
        default=None, description="Nº certificado de destinação final"
    )
    waste_manifest: str | None = Field(
        default=None, description="Manifesto de transporte de resíduos (MTR)"
    )

    # Avaliação Financeira e Contábil (Beatriz Cunha - 24/09/2026)
    depreciation_category_id: int | None = Field(
        default=None, description="ID da categoria contábil de depreciação"
    )
    depreciation_category_name: str | None = Field(
        default=None, description="Nome da categoria contábil de depreciação"
    )
    reference_date: datetime | None = Field(
        default=None, description="Data de referência para o cálculo de depreciação"
    )
    residual_value: float = Field(
        default=0.0, ge=0.0, description="Valor residual estimado em R$"
    )
    monthly_depreciation: float = Field(
        default=0.0, ge=0.0, description="Depreciação mensal calculada em R$"
    )
    depreciated_months: int = Field(
        default=0, ge=0, description="Meses depreciados até a data de referência"
    )
    accumulated_depreciation: float = Field(
        default=0.0, ge=0.0, description="Depreciação acumulada em R$"
    )
    acquisition_value: float = Field(
        default=0.0, ge=0.0, description="Valor original de aquisição em R$"
    )
    net_book_value: float = Field(
        default=0.0, ge=0.0, description="Valor contábil líquido em R$"
    )
    usage_time: str | None = Field(
        default=None, description="Tempo de utilização do ativo (ex: 3 anos e 4 meses)"
    )
    expected_lifespan: str | None = Field(
        default=None, description="Vida útil prevista do ativo (ex: 5 anos)"
    )
    estimated_economy: float = Field(
        default=0.0, ge=0.0, description="Economia estimada gerada em R$"
    )

    justification: str | None = Field(
        default=None, description="Justificativa da baixa/descarte"
    )
    technical_opinion: str | None = Field(
        default=None, description="Parecer técnico detalhado"
    )

    # Gestão Patrimonial — Registro da Baixa em Sistema (FO-PAT-02)
    write_off_date: datetime | None = Field(
        default=None, description="Data da baixa patrimonial em sistema"
    )
    write_off_reason: str | None = Field(
        default=None, description="Motivo da baixa em sistema"
    )
    reused_parts_location: str | None = Field(
        default=None, description="Local das peças reaproveitadas"
    )
    waste_final_destination: str | None = Field(
        default=None, description="Destino final do resíduo"
    )
    write_off_notes: str | None = Field(
        default=None, description="Observações da gestão patrimonial"
    )

    # Document Control (FO-PAT-02)
    document_start_date: datetime | None = Field(
        default=None, description="Data início de vigência do formulário"
    )
    document_end_date: datetime | None = Field(
        default=None, description="Data final de vigência do formulário"
    )
    document_classification: str | None = Field(
        default="USO INTERNO", description="Classificação da informação do documento"
    )
    elaborated_by_date: datetime | None = Field(
        default=None, description="Data de elaboração (Área de Patrimônio e TI)"
    )
    reviewed_by_date: datetime | None = Field(
        default=None, description="Data de revisão (Gestão Patrimonial)"
    )
    approved_by_date: datetime | None = Field(
        default=None, description="Data de aprovação (Gestão da Área Administrativa)"
    )

    reviewer_name: str | None = Field(
        default=None, description="Responsável pela validação (Gestão Patrimonial)"
    )
    approver_name: str | None = Field(
        default=None, description="Nome do aprovador final"
    )
    approval_date: datetime | None = Field(
        default=None, description="Data da aprovação formal"
    )
    approval_comments: str | None = Field(
        default=None, description="Parecer/observações do aprovador"
    )

    @field_validator(
        "acquisition_date",
        "evaluation_date",
        "reference_date",
        "warranty_expiry_date",
        "document_start_date",
        "document_end_date",
        "elaborated_by_date",
        "reviewed_by_date",
        "approved_by_date",
        "write_off_date",
        "approval_date",
        mode="before",
    )
    @classmethod
    def coerce_empty_dates(cls, v):
        if v == "" or v is None:
            return None
        return v

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
    protocol: str | None = Field(
        default=None, description="Protocolo (gerado automaticamente se omitido)"
    )
    components: list[ComponentItemSchema] = Field(
        default_factory=list, description="Matriz dinâmica de componentes"
    )
    new_components_for_catalog: list[str] = Field(
        default_factory=list,
        description="Novos nomes de componentes digitados na matriz para auto-cadastro no catálogo",
    )


class AssetEvaluationUpdateSchema(BaseModel):
    asset_id: int | None = None
    is_unregistered: bool | None = None
    unregistered_description: str | None = None
    patrimonio: str | None = None
    asset_type_name: str | None = None
    brand_model: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None
    cost_center: str | None = None
    unity: str | None = None
    current_location: str | None = None
    acquisition_date: datetime | None = None
    evaluation_date: datetime | None = None
    evaluator_name: str | None = None
    is_under_warranty: bool | None = None
    warranty_expiry_date: datetime | None = None
    asset_description: str | None = None

    status: str | None = None
    classification: str | None = None
    feasibility: str | None = None
    destination: list[str] | None = None

    gross_weight: float | None = None
    reused_weight: float | None = None
    discarded_weight: float | None = None
    recycle_weight: float | None = None
    reuse_percentage: float | None = None

    # ESG & Destinação Ambiental (FO-PAT-02)
    destination_company: str | None = None
    destination_cnpj: str | None = None
    destination_certificate: str | None = None
    waste_manifest: str | None = None

    acquisition_value: float | None = None
    net_book_value: float | None = None
    depreciation_category_id: int | None = None
    depreciation_category_name: str | None = None
    reference_date: datetime | None = None
    residual_value: float | None = None
    monthly_depreciation: float | None = None
    depreciated_months: int | None = None
    accumulated_depreciation: float | None = None
    usage_time: str | None = None
    expected_lifespan: str | None = None
    estimated_economy: float | None = None

    justification: str | None = None
    technical_opinion: str | None = None

    # Gestão Patrimonial — Registro da Baixa em Sistema (FO-PAT-02)
    write_off_date: datetime | None = None
    write_off_reason: str | None = None
    reused_parts_location: str | None = None
    waste_final_destination: str | None = None
    write_off_notes: str | None = None

    # Document Control (FO-PAT-02)
    document_start_date: datetime | None = None
    document_end_date: datetime | None = None
    document_classification: str | None = None
    elaborated_by_date: datetime | None = None
    reviewed_by_date: datetime | None = None
    approved_by_date: datetime | None = None

    reviewer_name: str | None = None
    approver_name: str | None = None
    approval_date: datetime | None = None
    approval_comments: str | None = None

    @field_validator(
        "acquisition_date",
        "evaluation_date",
        "reference_date",
        "warranty_expiry_date",
        "document_start_date",
        "document_end_date",
        "elaborated_by_date",
        "reviewed_by_date",
        "approved_by_date",
        "write_off_date",
        "approval_date",
        mode="before",
    )
    @classmethod
    def coerce_empty_dates(cls, v):
        if v == "" or v is None:
            return None
        return v

    components: list[ComponentItemSchema] | None = None
    new_components_for_catalog: list[str] | None = None


class AssetEvaluationApproveSchema(BaseModel):
    comments: str | None = Field(
        default=None, description="Parecer/comentário de aprovação"
    )
    write_off_asset: bool = Field(
        default=True,
        description="Se True, baixa automaticamente o ativo no sistema com status DESCARTE",
    )
    evaluation_data: AssetEvaluationUpdateSchema | None = Field(
        default=None,
        description="Dados correntes do formulário para salvar antes de aprovar",
    )


class AssetEvaluationOutSchema(BaseModel):
    id: int
    protocol: str
    evaluation_date: datetime

    # Document Control (FO-PAT-02)
    document_start_date: datetime | None = None
    document_end_date: datetime | None = None
    document_classification: str | None = "USO INTERNO"
    elaborated_by_date: datetime | None = None
    reviewed_by_date: datetime | None = None
    approved_by_date: datetime | None = None

    asset_id: int | None = None
    is_unregistered: bool = False
    unregistered_description: str | None = None
    patrimonio: str | None = None
    asset_type_name: str | None = None
    brand_model: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    serial_number: str | None = None
    cost_center: str | None = None
    unity: str | None = None
    current_location: str | None = None
    acquisition_date: datetime | None = None
    is_under_warranty: bool | None = False
    warranty_expiry_date: datetime | None = None
    asset_description: str | None = None

    status: str
    classification: str | None = None
    feasibility: str | None = None
    destination: list[str] = Field(default_factory=list)

    gross_weight: float
    reused_weight: float
    discarded_weight: float
    recycle_weight: float
    reuse_percentage: float

    # ESG & Destinação Ambiental (FO-PAT-02)
    destination_company: str | None = None
    destination_cnpj: str | None = None
    destination_certificate: str | None = None
    waste_manifest: str | None = None

    acquisition_value: float
    net_book_value: float
    depreciation_category_id: int | None = None
    depreciation_category_name: str | None = None
    reference_date: datetime | None = None
    residual_value: float = 0.0
    monthly_depreciation: float = 0.0
    depreciated_months: int = 0
    accumulated_depreciation: float = 0.0
    usage_time: str | None = None
    expected_lifespan: str | None = None
    estimated_economy: float

    justification: str | None = None
    technical_opinion: str | None = None

    # Gestão Patrimonial — Registro da Baixa em Sistema (FO-PAT-02)
    write_off_date: datetime | None = None
    write_off_reason: str | None = None
    reused_parts_location: str | None = None
    waste_final_destination: str | None = None
    write_off_notes: str | None = None

    evaluator_id: int | None = None
    evaluator_name: str | None = None
    reviewer_name: str | None = None
    approver_id: int | None = None
    approver_name: str | None = None
    approval_date: datetime | None = None
    approval_comments: str | None = None

    created_at: datetime
    updated_at: datetime

    components: list[ComponentItemOutSchema] = Field(default_factory=list)
    attachments: list[AttachmentOutSchema] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AssetEvaluationListOutSchema(BaseModel):
    items: list[AssetEvaluationOutSchema]
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
