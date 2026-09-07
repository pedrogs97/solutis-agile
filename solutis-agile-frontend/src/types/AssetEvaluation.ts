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

export interface AssetTechnicalEvaluation {
  id: number
  protocol: string
  evaluation_date: string
  asset_id?: number | null
  patrimonio?: string | null
  asset_type_name?: string | null
  brand_model?: string | null
  serial_number?: string | null
  cost_center?: string | null
  unity?: string | null
  status: string
  classification?: string | null
  feasibility?: string | null
  destination: string[]
  gross_weight: number
  reused_weight: number
  discarded_weight: number
  recycle_weight: number
  reuse_percentage: number
  acquisition_value: number
  net_book_value: number
  estimated_economy: number
  justification?: string | null
  technical_opinion?: string | null
  evaluator_id?: number | null
  evaluator_name?: string | null
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
  asset_id?: number | null
  patrimonio?: string | null
  asset_type_name?: string | null
  brand_model?: string | null
  serial_number?: string | null
  cost_center?: string | null
  unity?: string | null
  status: string
  classification?: string | null
  feasibility?: string | null
  destination: string[]
  gross_weight: number
  reused_weight: number
  discarded_weight: number
  recycle_weight: number
  reuse_percentage: number
  acquisition_value: number
  net_book_value: number
  estimated_economy: number
  justification?: string | null
  technical_opinion?: string | null
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
