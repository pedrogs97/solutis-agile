export interface AssetEvaluationComponent {
  id?: number
  evaluation_id?: number
  name: string
  quantity: number
  condition: string
  destination: string
  observations?: string | null
}

export interface AssetEvaluationAttachment {
  id: number
  file_name: string
  path: string
  checklist_key?: string | null
  created_at?: string
  createdAt?: string
}

export interface AssetCatalogComponent {
  id: number
  name: string
  created_at?: string
  createdAt?: string
}

export interface AssetDepreciationCategory {
  id: number
  name: string
  annual_rate: number
  lifespan_months: number
  description?: string | null
  is_active: boolean
  created_at?: string
}

export interface VCLCalculationInput {
  acquisition_value: number
  acquisition_date: string
  lifespan_months?: number
  annual_rate?: number
  reference_date?: string
  residual_value?: number
  write_off_date?: string | null
}

export interface VCLCalculationOutput {
  monthly_depreciation: number
  depreciated_months: number
  accumulated_depreciation: number
  net_book_value: number
  base_depreciable: number
  lifespan_months: number
  annual_rate: number
}

export interface AssetTechnicalEvaluation {
  id: number
  protocol: string
  evaluation_date: string
  // Document Control (FO-PAT-02)
  document_start_date?: string | null
  document_end_date?: string | null
  document_classification?: string | null
  elaborated_by_date?: string | null
  reviewed_by_date?: string | null
  approved_by_date?: string | null

  asset_id?: number | null
  is_unregistered?: boolean
  unregistered_description?: string | null
  patrimonio?: string | null
  asset_type_name?: string | null
  brand_model?: string | null
  manufacturer?: string | null
  model?: string | null
  serial_number?: string | null
  cost_center?: string | null
  unity?: string | null
  current_location?: string | null
  acquisition_date?: string | null
  is_under_warranty?: boolean
  warranty_expiry_date?: string | null
  asset_description?: string | null
  status: string
  classification?: string | null
  feasibility?: string | null
  destination: string[]
  gross_weight: number
  reused_weight: number
  discarded_weight: number
  recycle_weight: number
  reuse_percentage: number
  destination_company?: string | null
  destination_cnpj?: string | null
  destination_certificate?: string | null
  waste_manifest?: string | null
  acquisition_value: number
  net_book_value: number
  depreciation_category_id?: number | null
  depreciation_category_name?: string | null
  reference_date?: string | null
  residual_value?: number | null
  monthly_depreciation?: number | null
  depreciated_months?: number | null
  accumulated_depreciation?: number | null
  usage_time?: string | null
  expected_lifespan?: string | null
  estimated_economy: number
  justification?: string | null
  technical_opinion?: string | null
  // Gestão Patrimonial — Registro da Baixa em Sistema (FO-PAT-02)
  write_off_date?: string | null
  write_off_reason?: string | null
  reused_parts_location?: string | null
  waste_final_destination?: string | null
  write_off_notes?: string | null
  evaluator_id?: number | null
  evaluator_name?: string | null
  reviewer_name?: string | null
  approver_id?: number | null
  approver_name?: string | null
  approval_date?: string | null
  approval_comments?: string | null
  created_at: string
  updated_at: string
  components: AssetEvaluationComponent[]
  attachments: AssetEvaluationAttachment[]
}

export interface AssetEvaluationMetrics {
  total_evaluations: number
  total_reused_assets: number
  total_written_off_assets: number
  total_reused_weight: number
  total_discarded_weight: number
  total_recycle_weight: number
  average_reuse_percentage: number
  total_estimated_economy: number
}

export interface AssetEvaluationListResponse {
  items: AssetTechnicalEvaluation[]
  total: number
  page: number
  size: number
  pages: number
}

export interface AssetEvaluationFormValues {
  // Document Control (FO-PAT-02)
  document_start_date?: string | null
  document_end_date?: string | null
  document_classification?: string | null
  elaborated_by_date?: string | null
  reviewed_by_date?: string | null
  approved_by_date?: string | null

  asset_id?: number | null
  is_unregistered?: boolean
  unregistered_description?: string | null
  patrimonio?: string | null
  asset_type_name?: string | null
  brand_model?: string | null
  manufacturer?: string | null
  model?: string | null
  serial_number?: string | null
  cost_center?: string | null
  unity?: string | null
  current_location?: string | null
  acquisition_date?: string | null
  evaluation_date?: string | null
  evaluator_name?: string | null
  is_under_warranty?: boolean
  warranty_expiry_date?: string | null
  asset_description?: string | null
  status: string
  classification?: string | null
  feasibility?: string | null
  destination: string[]
  gross_weight: number
  reused_weight: number
  discarded_weight: number
  recycle_weight: number
  reuse_percentage: number
  destination_company?: string | null
  destination_cnpj?: string | null
  destination_certificate?: string | null
  waste_manifest?: string | null
  acquisition_value: number
  net_book_value: number
  depreciation_category_id?: number | null
  depreciation_category_name?: string | null
  reference_date?: string | null
  residual_value?: number | null
  monthly_depreciation?: number | null
  depreciated_months?: number | null
  accumulated_depreciation?: number | null
  usage_time?: string | null
  expected_lifespan?: string | null
  estimated_economy: number
  justification?: string | null
  technical_opinion?: string | null
  // Gestão Patrimonial — Registro da Baixa em Sistema (FO-PAT-02)
  write_off_date?: string | null
  write_off_reason?: string | null
  reused_parts_location?: string | null
  waste_final_destination?: string | null
  write_off_notes?: string | null
  reviewer_name?: string | null
  approver_name?: string | null
  approval_date?: string | null
  approval_comments?: string | null
  components: AssetEvaluationComponent[]
  new_components_for_catalog?: string[]
}

export interface AssetEvaluationFilters {
  page?: number
  size?: number | string
  status?: string
  search?: string
  date_start?: string
  date_end?: string
}
