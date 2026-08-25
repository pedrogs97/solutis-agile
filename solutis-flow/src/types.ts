/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'GESTOR' | 'ANALISTA' | 'SOLICITANTE' | 'APROVADOR' | 'OBSERVADOR';

export interface User {
  id: string; // Accepts string or stringified numeric ID
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  areaId: string;
}

export interface Area {
  id: string;
  name: string;
  description: string;
}

export interface CostCenter {
  id: string;
  code: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO';
  dueDate: string; // YYYY-MM-DD
  areaId: string;
  creatorId?: string;
}

export type DemandType = 'COMPRAS' | 'REEMBOLSO' | 'CONTRATOS' | 'INVENTARIO' | 'ESG' | 'ESPORADICA';

export type DemandStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO';

export type ApprovalStatus = 'NENHUMA' | 'AGUARDANDO_APROVACAO' | 'APROVADO' | 'REJEITADO';

export type SLAStatus = 'DENTRO_DO_PRAZO' | 'EM_RISCO' | 'ATRASADO';

export interface Attachment {
  id: string;
  name: string;
  size: string; // e.g. "1.2 MB"
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  date: string;
}

export interface HistoryLog {
  id: string;
  userId: string;
  action: string;
  prevStatus?: string;
  nextStatus?: string;
  justification?: string;
  date: string;
}

export interface Feedback {
  managerId: string;
  rating: number; // 1 to 5
  comment: string;
  isNegative: boolean;
  date: string;
}

export interface StandardProcedure {
  flowsteps: string[]; // Step description labels
  procedureDocument: string; // Markdown / descriptive text of PR
  videoUrl: string; // Mock video guide
}

export interface Demand {
  id: string;
  type: DemandType;
  title: string;
  description: string;
  solicitorId: string;
  assigneeId: string | null;
  managerId: string;
  observerIds: string[];
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  status: DemandStatus;
  approvalStatus: ApprovalStatus;
  slaLimitHours: number;
  slaSpentHours: number;
  dueDate: string;
  costCenterId: string;
  areaId: string;
  attachments: Attachment[];
  evidenceDescription?: string;
  evidenceAttachmentId?: string;
  feedback?: Feedback;
  timeEstimatedHours: number;
  timeSpentHours: number;
  comments: Comment[];
  history: HistoryLog[];
  currentStageIndex: number;
  customSop?: StandardProcedure;
  projectId?: string | null;
}

export interface DashboardMetrics {
  totalDemands: number;
  pending: number;
  inProgress: number;
  completed: number;
  totalEstimatedHours: number;
  totalSpentHours: number;
}

export type AutomationTrigger = 
  | 'AO_CRIAR' 
  | 'AO_SLA_VENCER' 
  | 'AO_CONCLUIR' 
  | 'AO_APROVAR';

export type AutomationAction = 
  | 'ENVIAR_APROVACAO_DIRETORIA' 
  | 'NOTIFICAR_GESTOR' 
  | 'MUDAR_STATUS_AUTOMATICO'
  | 'ATRIBUIR_ANALISTA';

export interface Automation {
  id: string;
  name: string;
  trigger: AutomationTrigger;
  conditionField?: string;
  conditionOperator?: '>' | '<' | '==';
  conditionValue?: string;
  action: AutomationAction;
  destinationUserOrRole?: string;
  isActive: boolean;
}

export interface RecurringTask {
  id: string;
  title: string;
  frequency: 'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL';
  areaId: string;
  costCenterId: string;
  checklist: string[];
  lastGenerated?: string;
  nextGeneration?: string;
  customSop?: StandardProcedure;
}

export interface SLAConfiguration {
  id: string;
  demandType: DemandType;
  priority: 'ALTA' | 'MEDIA' | 'BAIXA';
  limitHours: number;
}
