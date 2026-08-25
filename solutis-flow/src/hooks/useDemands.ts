import { useState, useEffect, useCallback } from 'react';
import { Demand, DemandStatus } from '../types';
import { mockInitialDemands } from '../mockData';
import {
  fetchDemands as apiFetchDemands,
  createDemand as apiCreateDemand,
  updateDemandStatus as apiUpdateDemandStatus,
  requestTransfer as apiRequestTransfer,
  submitFeedback as apiSubmitFeedback,
} from '../services/api';

export function useDemands(token?: string) {
  const [demands, setDemands] = useState<Demand[]>(() => {
    const saved = localStorage.getItem('flowta_demands');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialDemands;
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('flowta_demands', JSON.stringify(demands));
  }, [demands]);

  // Load demands from backend
  const refreshDemands = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const backendDemands = await apiFetchDemands(token);
      if (backendDemands && backendDemands.length > 0) {
        setDemands(backendDemands);
      }
    } catch (err: any) {
      // Graceful fallback to local state if backend service is unreachable
      console.info('Backend unreachable, keeping local demands state:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    refreshDemands();
  }, [refreshDemands]);

  const addDemand = useCallback(
    async (demandData: Partial<Demand>): Promise<Demand> => {
      try {
        const created = await apiCreateDemand(demandData, token);
        setDemands((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        // Fallback for offline local creation
        const fallback: Demand = {
          id: `dem-${Date.now()}`,
          type: demandData.type || 'ESPORADICA',
          title: demandData.title || 'Nova Demanda',
          description: demandData.description || '',
          solicitorId: demandData.solicitorId || 'usr-solicitante',
          assigneeId: demandData.assigneeId || null,
          managerId: demandData.managerId || 'usr-gestor',
          observerIds: demandData.observerIds || [],
          priority: demandData.priority || 'MEDIA',
          status: 'PENDENTE',
          approvalStatus: 'NENHUMA',
          slaLimitHours: demandData.slaLimitHours || 24,
          slaSpentHours: 0,
          dueDate: demandData.dueDate || new Date().toISOString().split('T')[0],
          costCenterId: demandData.costCenterId || 'cc-101',
          areaId: demandData.areaId || 'area-compras',
          attachments: [],
          timeEstimatedHours: demandData.timeEstimatedHours || 1,
          timeSpentHours: 0,
          comments: [],
          history: [
            {
              id: `hist-${Date.now()}`,
              userId: demandData.solicitorId || 'usr-solicitante',
              action: 'Criou a demanda em modo local',
              date: new Date().toLocaleDateString('pt-BR'),
            },
          ],
          currentStageIndex: 0,
        };
        setDemands((prev) => [fallback, ...prev]);
        return fallback;
      }
    },
    [token]
  );

  const changeDemandStatus = useCallback(
    async (
      demandId: string,
      newStatus: DemandStatus,
      evidenceDescription?: string,
      evidenceAttachmentId?: string
    ) => {
      // Backend call
      try {
        const updated = await apiUpdateDemandStatus(
          demandId,
          newStatus,
          evidenceDescription,
          evidenceAttachmentId,
          token
        );
        setDemands((prev) => prev.map((d) => (d.id === demandId ? updated : d)));
        return updated;
      } catch (err: any) {
        // Strict evidence rule check if moving to CONCLUIDO in offline fallback mode
        if (newStatus === 'CONCLUIDO' && (!evidenceDescription || !evidenceDescription.trim())) {
          throw new Error('A conclusão da atividade exige obrigatoriamente uma descrição de evidência.');
        }

        // Local state update fallback
        setDemands((prev) =>
          prev.map((d) => {
            if (d.id !== demandId) return d;
            return {
              ...d,
              status: newStatus,
              evidenceDescription: evidenceDescription || d.evidenceDescription,
              evidenceAttachmentId: evidenceAttachmentId || d.evidenceAttachmentId,
              currentStageIndex: newStatus === 'CONCLUIDO' ? 2 : newStatus === 'EM_ANDAMENTO' ? 1 : 0,
              history: [
                ...d.history,
                {
                  id: `hist-${Date.now()}`,
                  userId: 'usr-analista',
                  action: `Alterou status para ${newStatus}`,
                  prevStatus: d.status,
                  nextStatus: newStatus,
                  justification: evidenceDescription,
                  date: new Date().toLocaleDateString('pt-BR'),
                },
              ],
            };
          })
        );
      }
    },
    [token]
  );

  const transferDemand = useCallback(
    async (demandId: string, targetAssigneeId: string, justification: string) => {
      try {
        await apiRequestTransfer(demandId, targetAssigneeId, justification, token);
      } catch (e) {
        // Log fallback
      }
      setDemands((prev) =>
        prev.map((d) => {
          if (d.id !== demandId) return d;
          return {
            ...d,
            assigneeId: targetAssigneeId,
            history: [
              ...d.history,
              {
                id: `hist-${Date.now()}`,
                userId: d.assigneeId || 'usr-analista',
                action: 'Solicitou transferência de responsável',
                justification,
                date: new Date().toLocaleDateString('pt-BR'),
              },
            ],
          };
        })
      );
    },
    [token]
  );

  const sendFeedback = useCallback(
    async (demandId: string, rating: number, comment: string, isNegative: boolean) => {
      try {
        await apiSubmitFeedback(demandId, rating, comment, isNegative, token);
      } catch (e) {}

      setDemands((prev) =>
        prev.map((d) => {
          if (d.id !== demandId) return d;
          return {
            ...d,
            feedback: {
              managerId: d.managerId,
              rating,
              comment,
              isNegative,
              date: new Date().toLocaleDateString('pt-BR'),
            },
          };
        })
      );
    },
    [token]
  );

  return {
    demands,
    isLoading,
    error,
    refreshDemands,
    addDemand,
    changeDemandStatus,
    transferDemand,
    sendFeedback,
  };
}
