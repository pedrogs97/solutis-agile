export interface ApprovalStep {
  id: number
  name: string
  description: string
  order: number
  department: string
  isMandatory: boolean
}

export interface Approver {
  id: number
  name: string
  email: string
}

export interface StepApproval {
  id: number
  stepId: number
  stepName: string
  stepDepartment: string
  approverId: number
  approver?: Approver | null
  approvalAt: string
  observations: string
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

export interface ApprovalFlow {
  id: number
  supplier: number
  isApproved: boolean
  isReproved: boolean
  approvedAt: string | null
  reprovedAt: string | null
  step: ApprovalStep
  approverId: number | null
  approver: Approver | null
  nextStep: number | null
  observations?: string | null
}

export interface ApproveStepPayload {
  workflowId: number
  isApproved: boolean
  token?: string
}

export interface ResponsibleStepPayload {
  name: string
  email: string
  workflowId: number
  stepId: number
  observations?: string
}

export interface ApprovalTimelineItem {
  step: ApprovalStep
  status: 'completed' | 'current' | 'pending' | 'rejected' | 'pendingApproval'
  approval?: StepApproval
}
