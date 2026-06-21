/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  mockUsers, mockAreas, mockCostCenters, mockInitialDemands, 
  mockInitialAutomations, mockInitialRecurringTasks, mockSlaConfigs,
  mockInitialProjects
} from './mockData';
import { User, Demand, Automation, RecurringTask, DemandStatus, SLAConfiguration, Project } from './types';
import { RoleSwitcher } from './components/RoleSwitcher';
import { Dashboard } from './components/Dashboard';
import { DemandList } from './components/DemandList';
import { KanbanBoard } from './components/KanbanBoard';
import { DemandDetail } from './components/DemandDetail';
import { Settings } from './components/Settings';
import { Portal } from './components/Portal';
import { CreateDemandModal } from './components/CreateDemandModal';
import { ProjectsView } from './components/ProjectsView';
import { Login } from './components/Login';
import { ReportsView } from './components/ReportsView';
import { ContinuousImprovement, ImprovementIdea } from './components/ContinuousImprovement';
import { ManagerApprovals } from './components/ManagerApprovals';
import { CalendarView, SharedMeeting } from './components/CalendarView';
import { 
  Layers, BarChart3, Settings as SettingsIcon, Kanban, 
  Calendar, Clock, CheckCircle, Bell, Plus, ShieldCheck, Zap, FolderKanban, LogOut, FileText,
  Lightbulb, ShieldAlert
} from 'lucide-react';

export default function App() {
  // Load initial states from localStorage if existing
  const [users] = useState<User[]>(mockUsers);
  
  const [ideas, setIdeas] = useState<ImprovementIdea[]>(() => {
    const saved = localStorage.getItem('flowta_ideas');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'idea-1',
        title: 'Triagem Automática por IA de Emails de Cotação',
        description: 'Hoje perdemos cerca de 30 minutos diários transferindo dados de emails de cotação de fornecedores para planilhas manuais de Excel.',
        solutionProposal: 'Implementar a leitura automática usando o conector integrado para extrair volumes, itens e preços diretamente no sistema.',
        expectedBenefit: 'Economia estimada de 2.5 horas semanais por analista de Compras e redução de 40% nas falhas de digitação.',
        collaboratorId: 'usr-analista',
        collaboratorName: 'Rafael Santos (Analista)',
        collaboratorRole: 'ANALISTA',
        collaboratorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        departmentId: 'area-compras',
        date: '15/06/2026',
        status: 'APROVADO',
        scoreBonus: 15,
        likes: 4
      },
      {
        id: 'idea-2',
        title: 'Modelo Único para Minutas Jurídicas de Fornecedores',
        description: 'Cada fornecedor envia uma minuta de contrato diferente. O tempo de análise jurídica em reclamações excede 15 dias de SLA.',
        solutionProposal: 'Definição de uma minuta padrão de execução mandatório no momento do cadastro de novos fornecedores no portal.',
        expectedBenefit: 'Redução do tempo médio de análise jurídica de 15 dias para 2 dias úteis.',
        collaboratorId: 'usr-analista',
        collaboratorName: 'Rafael Santos (Analista)',
        collaboratorRole: 'ANALISTA',
        collaboratorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        departmentId: 'area-jur',
        date: '18/06/2026',
        status: 'PENDENTE',
        scoreBonus: 15,
        likes: 2
      }
    ];
  });

  const [meetings, setMeetings] = useState<SharedMeeting[]>(() => {
    const saved = localStorage.getItem('flowta_meetings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      {
        id: 'meet-1',
        title: 'Reunião de Alinhamento de SLA e POP Compras',
        description: 'Pauta: Revisão técnica passo a passo das regras do procedimento operacional padrão de compras.',
        date: new Date().toISOString().split('T')[0], // Hoje
        time: '14:00',
        hostId: 'usr-gestor',
        hostName: 'Beatriz Mello (Gestor)',
        guestId: 'usr-analista',
        guestName: 'Rafael Santos (Analista)',
        status: 'PENDENTE'
      },
      {
        id: 'meet-2',
        title: 'Sincronização de Encerramento Financeiro Mensal',
        description: 'Auditoria cruzada sobre os centros de custo e custos de mão de obra de junho.',
        date: new Date().toISOString().split('T')[0], // Hoje
        time: '16:30',
        hostId: 'usr-gestor',
        hostName: 'Beatriz Mello (Gestor)',
        guestId: 'usr-aprovador',
        guestName: 'Pedro Gustavo (Diretoria)',
        status: 'PENDENTE'
      }
    ];
  });
  
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('flowta_is_logged_in') === 'true';
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('flowta_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = mockUsers.find(u => u.id === parsed.id);
        if (exists) return exists;
      } catch (e) {}
    }
    return mockUsers[1]; // Default to Gestor context for deep features
  });

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('flowta_is_logged_in');
    localStorage.removeItem('flowta_user');
    setLastNotification('Até breve! Logout efetuado na sessão sandbox.');
  };

  const [demands, setDemands] = useState<Demand[]>(() => {
    const saved = localStorage.getItem('flowta_demands');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialDemands;
  });

  const [automations, setAutomations] = useState<Automation[]>(() => {
    const saved = localStorage.getItem('flowta_automations');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialAutomations;
  });

  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>(() => {
    const saved = localStorage.getItem('flowta_recurring');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialRecurringTasks;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('flowta_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockInitialProjects;
  });

  const [kanbanColumns, setKanbanColumns] = useState(() => {
    const saved = localStorage.getItem('flowta_kanban_columns');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [
      { id: 'PENDENTE', title: 'Pendente', visible: true, color: 'rose' },
      { id: 'EM_ANDAMENTO', title: 'Em Andamento', visible: true, color: 'indigo' },
      { id: 'AGUARDANDO_APROVACAO', title: 'Aguardando Aprovação', visible: true, color: 'amber' },
      { id: 'CONCLUIDO', title: 'Concluído', visible: true, color: 'emerald' }
    ];
  });

  const [slaConfigs, setSlaConfigs] = useState<SLAConfiguration[]>(() => {
    const saved = localStorage.getItem('flowta_sla_configs');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return mockSlaConfigs;
  });

  // Layout states
  const [activeTab, setActiveTab] = useState<string>('DASHBOARD');
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>('TODOS');

  const handleDashboardNavigate = (tab: string, filters?: { status?: string }) => {
    if (filters?.status) {
      setInitialStatusFilter(filters.status);
    } else {
      setInitialStatusFilter('TODOS');
    }
    setActiveTab(tab);
  };

  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<string>('');
  const [quickCreateModal, setQuickCreateModal] = useState(false);

  // Save states to localStorage on change
  useEffect(() => {
    localStorage.setItem('flowta_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('flowta_demands', JSON.stringify(demands));
  }, [demands]);

  useEffect(() => {
    localStorage.setItem('flowta_automations', JSON.stringify(automations));
  }, [automations]);

  useEffect(() => {
    localStorage.setItem('flowta_recurring', JSON.stringify(recurringTasks));
  }, [recurringTasks]);

  useEffect(() => {
    localStorage.setItem('flowta_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('flowta_kanban_columns', JSON.stringify(kanbanColumns));
  }, [kanbanColumns]);

  useEffect(() => {
    localStorage.setItem('flowta_sla_configs', JSON.stringify(slaConfigs));
  }, [slaConfigs]);

  useEffect(() => {
    localStorage.setItem('flowta_ideas', JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    localStorage.setItem('flowta_meetings', JSON.stringify(meetings));
  }, [meetings]);

  // Adjust default screen depending on Role switches
  useEffect(() => {
    if (currentUser.role === 'SOLICITANTE') {
      if (activeTab !== 'PROJECTS') {
        setActiveTab('PORTAL');
      }
    } else if (activeTab === 'PORTAL') {
      setActiveTab('DASHBOARD');
    }
  }, [currentUser]);

  // deep-link handler for demandId and projectId URL search parameters on boot
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dId = urlParams.get('demandId');
    const pId = urlParams.get('projectId');
    
    if (dId) {
      setSelectedDemandId(dId);
      if (currentUser.role === 'SOLICITANTE') {
        setActiveTab('PORTAL');
      } else {
        setActiveTab('DEMANDS');
      }
    } else if (pId) {
      setActiveTab('PROJECTS');
    }
  }, []);

  // Real-time Simulation: Every 15 seconds, simulate tick on non-completed demands to increment SLA
  useEffect(() => {
    const interval = setInterval(() => {
      setDemands(prev => {
        let changed = false;
        const updated = prev.map(d => {
          if (d.status !== 'CONCLUIDO') {
            changed = true;
            const newSla = d.slaSpentHours + 1;
            
            // Check if automation triggers on SLA vencimento!
            if (newSla > d.slaLimitHours && d.slaSpentHours <= d.slaLimitHours) {
              // Trigger SLA overdue notification
              const activeSlaAutos = automations.filter(a => a.trigger === 'AO_SLA_VENCER' && a.isActive);
              if (activeSlaAutos.length > 0) {
                setLastNotification(`⚠️ ALTA GRAVIDADE: SLA estourou na demanda ${d.id}! Gestor de plantão notificado por automação.`);
              }
            }

            return { ...d, slaSpentHours: newSla };
          }
          return d;
        });
        return changed ? updated : prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, [automations]);

  // Handle addition of a new demand and process rule triggers (Automation Core)
  const handleAddNewDemand = (newDemand: Demand) => {
    // Process Trigger: AO_CRIAR automations
    let processedDemand = { ...newDemand };
    let triggeredAutoName = '';

    const activeCreateAutos = automations.filter(a => a.trigger === 'AO_CRIAR' && a.isActive);
    
    activeCreateAutos.forEach(auto => {
      if (auto.conditionField === 'value' && auto.conditionOperator === '>') {
        // Parse value from description e.g., "Valor Estimado: R$ 15.000,00"
        const valueMatch = newDemand.description.match(/Valor Estimado:\s*R\$\s*([\d.,]+)/);
        if (valueMatch) {
          const val = Number(valueMatch[1].replace(/\./g, '').replace(',', '.'));
          const limit = Number(auto.conditionValue) || 0;
          if (val > limit) {
            triggeredAutoName = auto.name;
            if (auto.action === 'ENVIAR_APROVACAO_DIRETORIA') {
              processedDemand.approvalStatus = 'AGUARDANDO_APROVACAO';
              processedDemand.assigneeId = 'usr-aprovador'; // Direct routing to director
            }
          }
        }
      } else if (auto.conditionField === 'type' && auto.conditionOperator === '==') {
        if (newDemand.type === auto.conditionValue) {
          triggeredAutoName = auto.name;
          if (auto.action === 'ATRIBUIR_ANALISTA') {
            processedDemand.assigneeId = auto.destinationUserOrRole || 'usr-analista';
          }
        }
      }
    });

    if (triggeredAutoName) {
      processedDemand.history.push({
        id: `hst-auto-${Date.now()}`,
        userId: 'usr-admin',
        action: `⚙️ Automação Executada: "${triggeredAutoName}"`,
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
      setLastNotification(`⚡ Automação disparada: "${triggeredAutoName}"`);
    } else {
      setLastNotification(`✅ Nova demanda ${newDemand.id} criada. Triagem acionada.`);
    }

    setDemands(prev => [processedDemand, ...prev]);
  };

  // Update a single demand in depth
  const handleUpdateDemand = (updatedDemand: Demand) => {
    // Find original to detect observer actions or updates to trigger alerts
    const oldDemand = demands.find(d => d.id === updatedDemand.id);
    if (oldDemand) {
      const addedObservers = (updatedDemand.observerIds || []).filter(id => !(oldDemand.observerIds || []).includes(id));
      const removedObservers = (oldDemand.observerIds || []).filter(id => !(updatedDemand.observerIds || []).includes(id));
      
      if (addedObservers.length > 0) {
        const names = addedObservers.map(id => users.find(u => u.id === id)?.name || id).join(', ');
        setLastNotification(`👥 Novo colaborador convidado para acompanhar a demanda ${updatedDemand.id}: ${names}. Notificações ativas.`);
      } else if (removedObservers.length > 0) {
        const names = removedObservers.map(id => users.find(u => u.id === id)?.name || id).join(', ');
        setLastNotification(`👥 Acompanhamento de ${names} encerrado para a demanda ${updatedDemand.id}.`);
      } else {
        const statusChanged = oldDemand.status !== updatedDemand.status;
        const commentAdded = (updatedDemand.comments || []).length > (oldDemand.comments || []).length;
        
        if ((updatedDemand.observerIds || []).length > 0) {
          if (statusChanged) {
            setLastNotification(`📢 Alerta de Acompanhamento: Status da demanda ${updatedDemand.id} mudou para ${updatedDemand.status === 'EM_ANDAMENTO' ? '🟠 EM ANDAMENTO' : '🟢 CONCLUÍDO'}. Co-pilotos notificados.`);
          } else if (commentAdded) {
            setLastNotification(`💬 Alerta de Acompanhamento: Novo comentário/registro na demanda ${updatedDemand.id}. Co-pilotos notificados.`);
          }
        }
      }
    }
    setDemands(prev => prev.map(d => d.id === updatedDemand.id ? updatedDemand : d));
  };

  // Continuous Improvement handlers
  const handleAddIdea = (newIdea: ImprovementIdea) => {
    setIdeas(prev => [newIdea, ...prev]);
    setLastNotification(`💡 Proposta de melhoria registrada! Seus pontos de avaliação foram atualizados.`);
  };

  const handleUpdateIdea = (updatedIdea: ImprovementIdea) => {
    setIdeas(prev => prev.map(i => i.id === updatedIdea.id ? updatedIdea : i));
  };

  // Shared meetings calendar handlers
  const handleAddMeeting = (meet: SharedMeeting) => {
    setMeetings(prev => [meet, ...prev]);
    setLastNotification(`📅 Reunião "${meet.title}" enviada para o calendário cooperativo.`);
  };

  const handleUpdateMeetingStatus = (meetingId: string, status: 'ACEITO' | 'RECUSADO') => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status } : m));
    setLastNotification(status === 'ACEITO' ? '✅ Convite de reunião confirmado com sucesso!' : '❌ Convite de reunião declinado.');
  };

  // Projects core handlers
  const handleAddProject = (newProjData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...newProjData,
      id: `prj-${Date.now()}`,
      creatorId: currentUser.id
    };
    setProjects(prev => [newProj, ...prev]);
    setLastNotification(`💼 Novo projeto "${newProj.name}" planejado com sucesso.`);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    setDemands(prev => prev.map(d => d.projectId === projectId ? { ...d, projectId: null } : d));
    setLastNotification(`🗑️ Projeto excluído. Atividades vinculadas foram liberadas.`);
  };

  const handleLinkDemand = (demandId: string, projectId: string | null) => {
    setDemands(prev => prev.map(d => d.id === demandId ? {
      ...d,
      projectId,
      history: [
        ...d.history,
        {
          id: `hst-lnk-${Date.now()}`,
          userId: currentUser.id,
          action: projectId 
            ? `Atividade vinculada ao projeto: ${projects.find(p => p.id === projectId)?.name || projectId}`
            : 'Atividade desvinculada de projetos corporativos',
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    } : d));
  };

  const handleQuickTransition = (id: string, newStatus: DemandStatus) => {
    const target = demands.find(d => d.id === id);
    if (!target) return;

    const previous = target.status;
    const updated: Demand = {
      ...target,
      status: newStatus,
      currentStageIndex: newStatus === 'EM_ANDAMENTO' ? 1 : target.currentStageIndex,
      history: [
        ...target.history,
        {
          id: `hst-quick-${Date.now()}`,
          userId: currentUser.id,
          action: `Transição rápida para ${newStatus}`,
          prevStatus: previous,
          nextStatus: newStatus,
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    handleUpdateDemand(updated);
  };

  // Automations callbacks
  const handleAddAutomation = (newAuto: Automation) => {
    setAutomations(prev => [...prev, newAuto]);
    setLastNotification(`Regra de automação "${newAuto.name}" adicionada.`);
  };

  const handleToggleAutomation = (id: string) => {
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleDeleteAutomation = (id: string) => {
    setAutomations(prev => prev.filter(a => a.id !== id));
  };

  // Recurring core callbacks
  const handleAddRecurringTask = (newTask: RecurringTask) => {
    setRecurringTasks(prev => [...prev, newTask]);
    setLastNotification(`Rotina periódica "${newTask.title}" programada com sucesso.`);
  };

  // Calculated generic badge stats
  const totalInRiskSla = demands.filter(d => {
    return d.status !== 'CONCLUIDO' && (d.slaLimitHours - d.slaSpentHours <= 6);
  }).length;

  if (!isLoggedIn) {
    return (
      <Login 
        users={users} 
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoggedIn(true);
          localStorage.setItem('flowta_is_logged_in', 'true');
          setLastNotification(`Sessão iniciada como ${user.name}`);
        }} 
      />
    );
  }

  return (
    <div id="flowta-app-shell" className="min-h-screen bg-slate-100 flex flex-col font-sans select-none antialiased">
      
      {/* 1. Header Role Switcher Bar */}
      <RoleSwitcher 
        currentUser={currentUser} 
        onUserChange={setCurrentUser} 
        users={users} 
        onLogout={handleLogout}
      />

      {/* Primary Container layout */}
      <div className="max-w-7xl mx-auto w-full flex-1 p-4 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Left Side menu sidebar layout for large devices */}
        <aside id="layout-sidebar" className="w-full lg:w-64 space-y-6 shrink-0 text-left">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-slate-100">
              <div className="bg-blue-600 text-white p-2 rounded-md">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800 leading-tight">Flowta Workspace</h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Gestão de Governança</p>
              </div>
            </div>

            {/* Notification alert banner */}
            <AnimatePresence>
              {lastNotification && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="p-3 bg-indigo-50 border border-indigo-150 rounded-lg flex items-start gap-2 text-indigo-900 text-[11px] leading-snug relative overflow-hidden shadow-xs"
                >
                  <Bell className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-bounce" />
                  <div className="flex-1">
                    <strong className="font-extrabold">Notificação:</strong> {lastNotification}
                  </div>
                  <button onClick={() => setLastNotification('')} className="absolute top-1.5 right-1.5 text-indigo-400 hover:text-indigo-700 font-extrabold text-[10.5px] cursor-pointer">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Create Demand CTA Button in Sidebar */}
            <button
              id="sidebar-create-demand-btn"
              onClick={() => setQuickCreateModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-md flex items-center justify-center gap-1.5 transition shadow-xs font-display cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar Demanda
            </button>

            {/* Tab navigation links list */}
            <nav className="space-y-1">
              {currentUser.role !== 'SOLICITANTE' ? (
                <>
                  <button
                    id="nav-dashboard"
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'DASHBOARD' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" /> BI Executive Dashboard
                    </span>
                  </button>

                  <button
                    id="nav-demands"
                    onClick={() => setActiveTab('DEMANDS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'DEMANDS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers className="w-4 h-4" /> Demandas Ativas
                    </span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 py-0.5 px-1.5 rounded font-bold border border-slate-205">
                      {demands.length}
                    </span>
                  </button>

                  <button
                    id="nav-projects"
                    onClick={() => setActiveTab('PROJECTS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'PROJECTS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4" /> Projetos Corporativos
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-55 text-indigo-750 py-0.5 px-1.5 rounded font-bold border border-indigo-150">
                      {projects.length}
                    </span>
                  </button>

                  <button
                    id="nav-kanban"
                    onClick={() => setActiveTab('KANBAN')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'KANBAN' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Kanban className="w-4 h-4" /> Board Kanban Jirista
                    </span>
                    {totalInRiskSla > 0 && (
                      <span className="text-[9px] bg-red-600 text-white px-1.5 py-0.2 rounded font-extrabold animate-bounce">
                        {totalInRiskSla} Risco
                      </span>
                    )}
                  </button>

                  <button
                    id="nav-reports"
                    onClick={() => setActiveTab('REPORTS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'REPORTS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Relatórios e Auditoria
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 py-0.5 px-1.5 rounded font-bold border border-indigo-120">
                      Novo
                    </span>
                  </button>

                  <button
                    id="nav-settings"
                    onClick={() => setActiveTab('SETTINGS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'SETTINGS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <SettingsIcon className="w-4 h-4" /> Configurações e Automação
                    </span>
                  </button>

                  {(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN' || currentUser.role === 'APROVADOR') && (
                    <button
                      id="nav-approvals"
                      onClick={() => setActiveTab('APPROVALS')}
                      className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                        activeTab === 'APPROVALS' 
                          ? 'bg-indigo-600 text-white shadow-sm font-bold' 
                          : 'text-slate-655 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0" /> Painel de Aprovações
                      </span>
                      {demands.filter(d => d.approvalStatus === 'AGUARDANDO_APROVACAO').length > 0 && (
                        <span className="text-[10px] font-mono bg-rose-100 text-rose-700 py-0.5 px-1.5 rounded font-bold border border-rose-150 animate-pulse">
                          {demands.filter(d => d.approvalStatus === 'AGUARDANDO_APROVACAO').length}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    id="nav-improvements"
                    onClick={() => setActiveTab('IMPROVEMENTS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'IMPROVEMENTS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" /> Melhoria Contínua
                    </span>
                    <span className="text-[9px] bg-amber-100 text-amber-800 py-0.2 px-1 rounded uppercase font-black text-center">
                      Ideias
                    </span>
                  </button>

                  <button
                    id="nav-calendar"
                    onClick={() => setActiveTab('CALENDAR')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'CALENDAR' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Calendário e Meetings
                    </span>
                  </button>
                </>
              ) : (
                <div className="space-y-1">
                  <button
                    id="nav-portal"
                    onClick={() => setActiveTab('PORTAL')}
                    className={`w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center gap-2 transition ${
                      activeTab === 'PORTAL'
                        ? 'bg-blue-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Portal do Solicitante
                  </button>

                  <button
                    id="nav-projects-solicitante"
                    onClick={() => setActiveTab('PROJECTS')}
                    className={`w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'PROJECTS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderKanban className="w-4 h-4" /> Projetos Corporativos
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-55 text-indigo-750 py-0.5 px-1.5 rounded font-bold border border-indigo-150">
                      {projects.length}
                    </span>
                  </button>

                  <button
                    id="nav-improvements-solic"
                    onClick={() => setActiveTab('IMPROVEMENTS')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'IMPROVEMENTS' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" /> Melhoria Contínua
                    </span>
                  </button>

                  <button
                    id="nav-calendar-solic"
                    onClick={() => setActiveTab('CALENDAR')}
                    className={`nav-btn w-full text-left font-semibold text-xs py-2.5 px-3 rounded-md flex items-center justify-between transition ${
                      activeTab === 'CALENDAR' 
                        ? 'bg-blue-600 text-white shadow-sm font-bold' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" /> Calendário e Meetings
                    </span>
                  </button>
                </div>
              )}
            </nav>

          </div>

          {/* Quick status indicators card block */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-3 shadow-xs">
            <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Regras de Negócio de Reunião</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>3 Status Oficiais unicamente</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Anexo e Justificativa mandatórios em Conclusão</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Mudar responsável exige justificativa e veto gestor</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Tempo medido vs estimado na auditoria</span>
              </div>
            </div>
          </div>

          {/* Quick logout option in bottom sidebar */}
          <button
            onClick={handleLogout}
            className="w-full mt-2 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 font-bold text-xs py-2.5 px-4 border border-slate-200 hover:border-rose-200 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 group"
          >
            <LogOut className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-rose-500 transition-colors" />
            <span>Desconectar Sessão</span>
          </button>

        </aside>

        {/* Right Main workspace core */}
        <main id="layout-workspace-core" className="flex-1 min-w-0">
          
          {/* Main workspace action sheets */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="space-y-6"
            >
              
              {activeTab === 'DASHBOARD' && (
                <Dashboard 
                  demands={demands} 
                  costCenters={mockCostCenters} 
                  areas={mockAreas} 
                  projects={projects}
                  currentUser={currentUser}
                  onSelectDemand={setSelectedDemandId} 
                  onNavigate={handleDashboardNavigate}
                />
              )}

              {activeTab === 'PROJECTS' && (
                <ProjectsView
                  projects={projects}
                  demands={demands}
                  areas={mockAreas}
                  currentUser={currentUser}
                  onAddProject={handleAddProject}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onLinkDemand={handleLinkDemand}
                />
              )}

              {activeTab === 'DEMANDS' && (
                <DemandList 
                  demands={demands} 
                  users={users} 
                  costCenters={mockCostCenters} 
                  areas={mockAreas} 
                  onSelectDemand={setSelectedDemandId} 
                  currentUser={currentUser}
                  onQuickCreateClick={() => setQuickCreateModal(true)}
                  initialStatusFilter={initialStatusFilter}
                  onClearInitialStatusFilter={() => setInitialStatusFilter('TODOS')}
                />
              )}

              {activeTab === 'KANBAN' && (
                <KanbanBoard 
                  demands={demands} 
                  users={users} 
                  onSelectDemand={setSelectedDemandId} 
                  onQuickTransition={handleQuickTransition}
                  currentUser={currentUser}
                  kanbanColumns={kanbanColumns}
                />
              )}

              {activeTab === 'SETTINGS' && (
                <Settings 
                  automations={automations} 
                  recurringTasks={recurringTasks} 
                  slaConfigs={slaConfigs} 
                  currentUser={currentUser}
                  onAddAutomation={handleAddAutomation}
                  onToggleAutomation={handleToggleAutomation}
                  onDeleteAutomation={handleDeleteAutomation}
                  onAddRecurringTask={handleAddRecurringTask}
                  onAddDemand={handleAddNewDemand}
                  kanbanColumns={kanbanColumns}
                  onUpdateKanbanColumns={setKanbanColumns}
                  onUpdateSlaConfigs={setSlaConfigs}
                />
              )}

              {activeTab === 'PORTAL' && (
                <Portal 
                  demands={demands} 
                  users={users} 
                  costCenters={mockCostCenters} 
                  areas={mockAreas} 
                  currentUser={currentUser}
                  onAddDemand={handleAddNewDemand}
                  onSelectDemand={setSelectedDemandId}
                />
              )}

              {activeTab === 'REPORTS' && (
                <ReportsView
                  demands={demands}
                  projects={projects}
                  recurringTasks={recurringTasks}
                  costCenters={mockCostCenters}
                  areas={mockAreas}
                  users={users}
                  ideas={ideas}
                />
              )}

              {activeTab === 'APPROVALS' && (
                <ManagerApprovals
                  demands={demands}
                  users={users}
                  areas={mockAreas}
                  costCenters={mockCostCenters}
                  currentUser={currentUser}
                  onUpdateDemand={handleUpdateDemand}
                />
              )}

              {activeTab === 'IMPROVEMENTS' && (
                <ContinuousImprovement
                  ideas={ideas}
                  currentUser={currentUser}
                  users={users}
                  areas={mockAreas}
                  onAddIdea={handleAddIdea}
                  onUpdateIdea={handleUpdateIdea}
                />
              )}

              {activeTab === 'CALENDAR' && (
                <CalendarView
                  demands={demands}
                  users={users}
                  currentUser={currentUser}
                  meetings={meetings}
                  onAddMeeting={handleAddMeeting}
                  onUpdateMeetingStatus={handleUpdateMeetingStatus}
                />
              )}

            </motion.div>
          </AnimatePresence>

        </main>

      </div>

      {/* 2. Side sheet details modal */}
      <AnimatePresence>
        {selectedDemandId && (
          <DemandDetail 
            demandId={selectedDemandId} 
            demands={demands} 
            currentUser={currentUser} 
            onClose={() => setSelectedDemandId(null)} 
            onUpdateDemand={handleUpdateDemand}
            costCenters={mockCostCenters}
            areas={mockAreas}
            projects={projects}
          />
        )}
      </AnimatePresence>

      {/* 3. Create Demand registration modal */}
      <CreateDemandModal 
        isOpen={quickCreateModal}
        onClose={() => setQuickCreateModal(false)}
        users={users}
        demands={demands}
        costCenters={mockCostCenters}
        areas={mockAreas}
        projects={projects}
        currentUser={currentUser}
        onAddDemand={handleAddNewDemand}
      />

      {/* Footer corporativo */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs mt-auto">
        <p>© 2026 Flowta Co. • Todos os direitos reservados. Plataforma de Governança Operacional e Automatação de Atividades.</p>
      </footer>

    </div>
  );
}
