import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Demand, Project, DashboardMetrics, DemandStatus, Area, CostCenter } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useDemands } from '../hooks/useDemands';
import { useProjects } from '../hooks/useProjects';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useUsers } from '../hooks/useUsers';
import { useOrganizationData } from '../hooks/useOrganizationData';
import { useSSE, SSEDomainEvent } from '../hooks/useSSE';

export interface FlowState {
  currentUser: User;
  isLoggedIn: boolean;
  demands: Demand[];
  projects: Project[];
  metrics: DashboardMetrics | null;
  users: User[];
  areas: Area[];
  costCenters: CostCenter[];
  isLoadingDemands: boolean;
}

export interface FlowDispatch {
  login: (user: User) => void;
  logout: () => void;
  switchRole: (role: User['role']) => void;
  addDemand: (demandData: Partial<Demand>) => Promise<Demand>;
  changeDemandStatus: (
    demandId: string,
    newStatus: DemandStatus,
    evidenceDescription?: string,
    evidenceAttachmentId?: string
  ) => Promise<Demand | void>;
  transferDemand: (demandId: string, targetAssigneeId: string, justification: string) => Promise<void>;
  sendFeedback: (demandId: string, rating: number, comment: string, isNegative: boolean) => Promise<void>;
  addProject: (project: Project) => void;
  refreshDemands: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
  refreshUsers: () => Promise<void>;
}

const FlowStateContext = createContext<FlowState | undefined>(undefined);
const FlowDispatchContext = createContext<FlowDispatch | undefined>(undefined);

export function FlowProvider({ children, onNotification }: { children: ReactNode; onNotification?: (msg: string) => void }) {
  const auth = useAuth();
  const demandsHook = useDemands(auth.token);
  const projectsHook = useProjects(auth.token);
  const metricsHook = useDashboardMetrics(auth.token);
  const usersHook = useUsers(auth.token);
  const orgHook = useOrganizationData(auth.token);

  // Listen to SSE real-time events
  const handleSSEEvent = useCallback(
    (event: SSEDomainEvent) => {
      if (event.message) {
        if (onNotification) {
          onNotification(`[Real-time Event] ${event.message}`);
        }
        demandsHook.refreshDemands();
        metricsHook.refreshMetrics();
      }
    },
    [onNotification, demandsHook.refreshDemands, metricsHook.refreshMetrics]
  );

  useSSE(handleSSEEvent, auth.token);

  const stateValue: FlowState = {
    currentUser: auth.currentUser,
    isLoggedIn: auth.isLoggedIn,
    demands: demandsHook.demands,
    projects: projectsHook.projects,
    metrics: metricsHook.metrics,
    users: usersHook.users,
    areas: orgHook.areas,
    costCenters: orgHook.costCenters,
    isLoadingDemands: demandsHook.isLoading,
  };

  const dispatchValue: FlowDispatch = {
    login: auth.login,
    logout: auth.logout,
    switchRole: auth.switchRole,
    addDemand: demandsHook.addDemand,
    changeDemandStatus: demandsHook.changeDemandStatus,
    transferDemand: demandsHook.transferDemand,
    sendFeedback: demandsHook.sendFeedback,
    addProject: projectsHook.addProject,
    refreshDemands: demandsHook.refreshDemands,
    refreshOrganization: orgHook.refreshOrganization,
    refreshUsers: usersHook.refreshUsers,
  };

  return (
    <FlowStateContext.Provider value={stateValue}>
      <FlowDispatchContext.Provider value={dispatchValue}>
        {children}
      </FlowDispatchContext.Provider>
    </FlowStateContext.Provider>
  );
}

export function useFlowState() {
  const context = useContext(FlowStateContext);
  if (!context) {
    throw new Error('useFlowState deve ser utilizado dentro de um FlowProvider');
  }
  return context;
}

export function useFlowDispatch() {
  const context = useContext(FlowDispatchContext);
  if (!context) {
    throw new Error('useFlowDispatch deve ser utilizado dentro de um FlowProvider');
  }
  return context;
}

export function useFlow() {
  return {
    ...useFlowState(),
    ...useFlowDispatch(),
  };
}
