import React, { createContext, useContext, ReactNode } from 'react';
import { User, Demand, Project, DashboardMetrics, DemandStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import { useDemands } from '../hooks/useDemands';
import { useProjects } from '../hooks/useProjects';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';
import { useSSE, SSEDomainEvent } from '../hooks/useSSE';

export interface FlowState {
  currentUser: User;
  isLoggedIn: boolean;
  demands: Demand[];
  projects: Project[];
  metrics: DashboardMetrics | null;
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
}

const FlowStateContext = createContext<FlowState | undefined>(undefined);
const FlowDispatchContext = createContext<FlowDispatch | undefined>(undefined);

export function FlowProvider({ children, onNotification }: { children: ReactNode; onNotification?: (msg: string) => void }) {
  const auth = useAuth();
  const demandsHook = useDemands();
  const projectsHook = useProjects();
  const metricsHook = useDashboardMetrics();

  // Listen to SSE real-time events
  useSSE((event: SSEDomainEvent) => {
    if (event.message) {
      if (onNotification) {
        onNotification(`[Real-time Event] ${event.message}`);
      }
      demandsHook.refreshDemands();
      metricsHook.refreshMetrics();
    }
  });

  const stateValue: FlowState = {
    currentUser: auth.currentUser,
    isLoggedIn: auth.isLoggedIn,
    demands: demandsHook.demands,
    projects: projectsHook.projects,
    metrics: metricsHook.metrics,
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
