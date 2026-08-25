import { Demand, DemandStatus, Area, CostCenter, Project, DashboardMetrics } from '../types';

export const GATEWAY_BASE_URL = 'http://localhost:8080/proxy/flow/v1';

function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Maps raw backend Demand JSON (snake_case) to frontend Demand interface (camelCase)
 */
export function mapBackendDemandToFrontend(raw: any): Demand {
  return {
    id: String(raw.id),
    type: raw.type,
    title: raw.title,
    description: raw.description || '',
    solicitorId: String(raw.solicitor_user_id),
    assigneeId: raw.assignee_user_id ? String(raw.assignee_user_id) : null,
    managerId: String(raw.manager_user_id),
    observerIds: (raw.observer_user_ids || []).map(String),
    priority: raw.priority,
    status: raw.status,
    approvalStatus: raw.approval_status || 'NENHUMA',
    slaLimitHours: raw.sla_limit_hours ?? 24,
    slaSpentHours: raw.sla_spent_hours ?? 0,
    dueDate: raw.due_date ? String(raw.due_date).split('T')[0] : new Date().toISOString().split('T')[0],
    costCenterId: raw.cost_center_id ? String(raw.cost_center_id) : 'cc-101',
    areaId: raw.area_id ? String(raw.area_id) : 'area-compras',
    attachments: [],
    evidenceDescription: raw.evidence_description || undefined,
    evidenceAttachmentId: raw.evidence_attachment_id ? String(raw.evidence_attachment_id) : undefined,
    timeEstimatedHours: raw.time_estimated_hours ?? 1,
    timeSpentHours: raw.time_spent_hours ?? 0,
    comments: [],
    history: [],
    currentStageIndex: raw.status === 'CONCLUIDO' ? 2 : raw.status === 'EM_ANDAMENTO' ? 1 : 0,
    projectId: raw.project_id ? String(raw.project_id) : null,
  };
}

export async function fetchDemands(token?: string): Promise<Demand[]> {
  const response = await fetch(`${GATEWAY_BASE_URL}/demands`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar demandas do servidor');
  }
  const data = await response.json();
  return data.map(mapBackendDemandToFrontend);
}

export async function fetchDemandById(demandId: string | number, token?: string): Promise<Demand> {
  const response = await fetch(`${GATEWAY_BASE_URL}/demands/${demandId}`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao buscar detalhes da demanda');
  }
  const data = await response.json();
  return mapBackendDemandToFrontend(data);
}

export async function createDemand(demandData: Partial<Demand>, token?: string): Promise<Demand> {
  const payload = {
    type: demandData.type || 'ESPORADICA',
    title: demandData.title,
    description: demandData.description || '',
    assignee_user_id: demandData.assigneeId ? parseInt(demandData.assigneeId, 10) : null,
    manager_user_id: demandData.managerId ? parseInt(demandData.managerId, 10) : 2,
    observer_user_ids: (demandData.observerIds || []).map((id) => parseInt(id, 10)).filter(Boolean),
    priority: demandData.priority || 'MEDIA',
    sla_limit_hours: demandData.slaLimitHours || 24,
    due_date: demandData.dueDate ? `${demandData.dueDate}T23:59:59` : null,
    time_estimated_hours: demandData.timeEstimatedHours || 1,
    area_id: demandData.areaId ? parseInt(demandData.areaId.replace(/\D/g, ''), 10) || 1 : 1,
    cost_center_id: demandData.costCenterId ? parseInt(demandData.costCenterId.replace(/\D/g, ''), 10) || 1 : 1,
    project_id: demandData.projectId ? parseInt(demandData.projectId.replace(/\D/g, ''), 10) || null : null,
  };

  const response = await fetch(`${GATEWAY_BASE_URL}/demands`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao criar demanda no backend');
  }

  const data = await response.json();
  return mapBackendDemandToFrontend(data);
}

export async function updateDemandStatus(
  demandId: string | number,
  status: DemandStatus,
  evidenceDescription?: string,
  evidenceAttachmentId?: string,
  token?: string
): Promise<Demand> {
  const payload = {
    status,
    evidence_description: evidenceDescription,
    evidence_attachment_id: evidenceAttachmentId ? parseInt(evidenceAttachmentId, 10) : null,
  };

  const response = await fetch(`${GATEWAY_BASE_URL}/demands/${demandId}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao atualizar status da demanda');
  }

  const data = await response.json();
  return mapBackendDemandToFrontend(data);
}

export async function requestTransfer(
  demandId: string | number,
  targetAssigneeUserId: string | number,
  justification: string,
  token?: string
): Promise<{ message: string; transfer_id: number }> {
  const payload = {
    target_assignee_user_id: typeof targetAssigneeUserId === 'string' ? parseInt(targetAssigneeUserId, 10) : targetAssigneeUserId,
    justification,
  };

  const response = await fetch(`${GATEWAY_BASE_URL}/demands/${demandId}/transfer`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao solicitar transferência da demanda');
  }

  return response.json();
}

export async function submitFeedback(
  demandId: string | number,
  rating: number,
  comment: string,
  isNegative: boolean,
  token?: string
): Promise<{ message: string }> {
  const payload = { rating, comment, is_negative: isNegative };

  const response = await fetch(`${GATEWAY_BASE_URL}/demands/${demandId}/feedback`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Falha ao registrar feedback');
  }

  return response.json();
}

export async function fetchAreas(token?: string): Promise<Area[]> {
  const response = await fetch(`${GATEWAY_BASE_URL}/areas`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar áreas');
  }
  const data = await response.json();
  return data.map((a: any) => ({
    id: String(a.id),
    name: a.name,
    description: a.description || '',
  }));
}

export async function fetchCostCenters(token?: string): Promise<CostCenter[]> {
  const response = await fetch(`${GATEWAY_BASE_URL}/cost-centers`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar centros de custo');
  }
  const data = await response.json();
  return data.map((c: any) => ({
    id: String(c.id),
    code: c.code,
    name: c.name,
  }));
}

export async function fetchProjects(token?: string): Promise<Project[]> {
  const response = await fetch(`${GATEWAY_BASE_URL}/projects`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar projetos');
  }
  const data = await response.json();
  return data.map((p: any) => ({
    id: String(p.id),
    name: p.name,
    description: p.description || '',
    status: p.status || 'EM_ANDAMENTO',
    dueDate: p.due_date ? String(p.due_date).split('T')[0] : '',
    areaId: p.area_id ? String(p.area_id) : 'area-compras',
  }));
}

export async function fetchDashboardMetrics(token?: string): Promise<DashboardMetrics> {
  const response = await fetch(`${GATEWAY_BASE_URL}/dashboard/metrics`, {
    headers: getAuthHeaders(token),
  });
  if (!response.ok) {
    throw new Error('Falha ao buscar métricas do dashboard');
  }
  const data = await response.json();
  return {
    totalDemands: data.total_demands ?? 0,
    pending: data.pending ?? 0,
    inProgress: data.in_progress ?? 0,
    completed: data.completed ?? 0,
    totalEstimatedHours: data.total_estimated_hours ?? 0,
    totalSpentHours: data.total_spent_hours ?? 0,
  };
}
