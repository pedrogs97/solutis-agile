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
import { FlowProvider, useFlow } from './context/FlowContext';
import { 
  Layers, BarChart3, Settings as SettingsIcon, Kanban, 
  Calendar, Clock, CheckCircle, Bell, Plus, ShieldCheck, Zap, FolderKanban, LogOut, FileText,
  Lightbulb, ShieldAlert
} from 'lucide-react';

function MainAppContent() {
  const {
    currentUser,
    isLoggedIn,
    login,
    logout,
    switchRole,
    demands,
    projects,
    metrics,
    addDemand,
    changeDemandStatus,
    transferDemand,
    sendFeedback,
    addProject,
  } = useFlow();

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
        date: new Date().toISOString().split('T')[0],
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
        date: new Date().toISOString().split('T')[0],
        time: '16:30',
        hostId: 'usr-gestor',
        hostName: 'Beatriz Mello (Gestor)',
        guestId: 'usr-aprovador',
        guestName: 'Pedro Gustavo (Diretoria)',
        status: 'PENDENTE'
      }
    ];
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
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [lastNotification, setLastNotification] = useState<string>('');
  const [quickCreateModal, setQuickCreateModal] = useState(false);

  const handleDashboardNavigate = (tab: string, filters?: { status?: string }) => {
    if (filters?.status) {
      setInitialStatusFilter(filters.status);
    } else {
      setInitialStatusFilter('TODOS');
    }
    setActiveTab(tab);
  };

  const handleLogout = () => {
    logout();
    setLastNotification('Até breve! Logout efetuado na sessão sandbox.');
  };

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

  // Deep-link handler
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

  const handleAddNewDemand = async (newDemandData: Demand) => {
    try {
      const created = await addDemand(newDemandData);
      setLastNotification(`✅ Nova demanda ${created.id} registrada com sucesso.`);
    } catch (err: any) {
      setLastNotification(`⚠️ Erro ao registrar demanda: ${err.message}`);
    }
  };

  const handleUpdateDemand = async (updatedDemand: Demand) => {
    try {
      await changeDemandStatus(
        updatedDemand.id,
        updatedDemand.status,
        updatedDemand.evidenceDescription,
        updatedDemand.evidenceAttachmentId
      );
      setLastNotification(`📢 Demanda #${updatedDemand.id} atualizada.`);
    } catch (err: any) {
      setLastNotification(`⚠️ ${err.message}`);
    }
  };

  const handleAddIdea = (newIdea: ImprovementIdea) => {
    setIdeas(prev => [newIdea, ...prev]);
    setLastNotification(`💡 Proposta de melhoria registrada! Seus pontos de avaliação foram atualizados.`);
  };

  const handleToggleLikeIdea = (ideaId: string) => {
    setIdeas(prev => prev.map(idea => {
      if (idea.id === ideaId) {
        return { ...idea, likes: idea.likes + 1 };
      }
      return idea;
    }));
  };

  const handleScheduleMeeting = (newMeeting: SharedMeeting) => {
    setMeetings(prev => [newMeeting, ...prev]);
    setLastNotification(`📅 Reunião "${newMeeting.title}" agendada com sucesso!`);
  };

  const handleUpdateMeetingStatus = (meetingId: string, status: 'ACEITO' | 'RECUSADO') => {
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, status } : m));
    setLastNotification(`📅 Convite de reunião ${status.toLowerCase()}!`);
  };

  if (!isLoggedIn) {
    return (
      <Login 
        users={users} 
        onSelectUser={(user) => {
          login(user);
          setLastNotification(`Bem-vindo, ${user.name}! Sessão iniciada como ${user.role}.`);
        }} 
      />
    );
  }

  const selectedDemand = demands.find(d => d.id === selectedDemandId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl text-white shadow-indigo-500/20 shadow-lg">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-100 tracking-tight flex items-center gap-2">
              Solutis Flow
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0 Backend Integrated
              </span>
            </span>
            <p className="text-xs text-slate-400">Governança Operacional & Demanda em Tempo Real</p>
          </div>
        </div>

        {/* Global Notification Banner */}
        {lastNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="hidden md:flex items-center space-x-2 bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 text-xs px-3 py-1.5 rounded-full shadow-inner"
          >
            <Bell className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="truncate max-w-xs">{lastNotification}</span>
            <button onClick={() => setLastNotification('')} className="text-indigo-400 hover:text-white ml-1">✕</button>
          </motion.div>
        )}

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setQuickCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center space-x-1.5 transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Demanda</span>
          </button>

          <RoleSwitcher 
            currentUser={currentUser} 
            users={users} 
            onSwitchRole={switchRole} 
          />

          <button 
            onClick={handleLogout}
            title="Encerrar Sessão"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-500 px-3 py-2 uppercase tracking-wider">
            Navegação Principal
          </div>

          {currentUser.role === 'SOLICITANTE' ? (
            <>
              <button 
                onClick={() => setActiveTab('PORTAL')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'PORTAL' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <Plus className="w-4 h-4" />
                <span>Portal de Requisições</span>
              </button>
              
              <button 
                onClick={() => setActiveTab('PROJECTS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'PROJECTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projetos & Atividades</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('DASHBOARD')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'DASHBOARD' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard Executivo</span>
              </button>

              <button 
                onClick={() => setActiveTab('DEMANDS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'DEMANDS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <FileText className="w-4 h-4" />
                <span>Gestão de Demandas</span>
              </button>

              <button 
                onClick={() => setActiveTab('KANBAN')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'KANBAN' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <Kanban className="w-4 h-4" />
                <span>Quadro Kanban</span>
              </button>

              <button 
                onClick={() => setActiveTab('PROJECTS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'PROJECTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>Projetos Operacionais</span>
              </button>

              <button 
                onClick={() => setActiveTab('MANAGER_APPROVALS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'MANAGER_APPROVALS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Aprovações de Gestão</span>
              </button>

              <button 
                onClick={() => setActiveTab('CALENDAR')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'CALENDAR' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <Calendar className="w-4 h-4" />
                <span>Calendário & Alinhamentos</span>
              </button>

              <button 
                onClick={() => setActiveTab('CONTINUOUS_IMPROVEMENT')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'CONTINUOUS_IMPROVEMENT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>Ideias & Melhorias</span>
              </button>

              <button 
                onClick={() => setActiveTab('REPORTS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'REPORTS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Relatórios & Governança</span>
              </button>

              <button 
                onClick={() => setActiveTab('SETTINGS')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl font-medium text-sm transition ${activeTab === 'SETTINGS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Configurações & SLA</span>
              </button>
            </>
          )}

          <div className="mt-auto pt-4 border-t border-slate-800/80">
            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex items-center space-x-3">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-9 h-9 rounded-full object-cover border border-indigo-500/30"
              />
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-slate-200 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span className="uppercase tracking-wider font-mono">{currentUser.role}</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Main Workspace View Area */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          {activeTab === 'PORTAL' && (
            <Portal 
              demands={demands}
              currentUser={currentUser}
              onSelectDemand={(id) => setSelectedDemandId(id)}
              onCreateDemand={() => setQuickCreateModal(true)}
            />
          )}

          {activeTab === 'DASHBOARD' && (
            <Dashboard 
              demands={demands} 
              currentUser={currentUser} 
              onNavigate={handleDashboardNavigate} 
              onSelectDemand={(id) => {
                setSelectedDemandId(id);
                setActiveTab('DEMANDS');
              }}
            />
          )}

          {activeTab === 'DEMANDS' && (
            <DemandList 
              demands={demands} 
              currentUser={currentUser} 
              initialStatusFilter={initialStatusFilter}
              onSelectDemand={(id) => setSelectedDemandId(id)}
              onCreateDemand={() => setQuickCreateModal(true)}
            />
          )}

          {activeTab === 'KANBAN' && (
            <KanbanBoard 
              demands={demands} 
              currentUser={currentUser} 
              columns={kanbanColumns}
              onSelectDemand={(id) => setSelectedDemandId(id)}
              onUpdateDemand={handleUpdateDemand}
            />
          )}

          {activeTab === 'PROJECTS' && (
            <ProjectsView 
              demands={demands}
              projects={projects}
              currentUser={currentUser}
              areas={mockAreas}
              onSelectDemand={(id) => {
                setSelectedDemandId(id);
                setActiveTab('DEMANDS');
              }}
              onAddProject={addProject}
              onUpdateDemand={handleUpdateDemand}
            />
          )}

          {activeTab === 'MANAGER_APPROVALS' && (
            <ManagerApprovals 
              demands={demands}
              currentUser={currentUser}
              users={users}
              onSelectDemand={(id) => {
                setSelectedDemandId(id);
                setActiveTab('DEMANDS');
              }}
              onUpdateDemand={handleUpdateDemand}
            />
          )}

          {activeTab === 'CALENDAR' && (
            <CalendarView 
              meetings={meetings}
              demands={demands}
              currentUser={currentUser}
              users={users}
              onScheduleMeeting={handleScheduleMeeting}
              onUpdateMeetingStatus={handleUpdateMeetingStatus}
              onSelectDemand={(id) => {
                setSelectedDemandId(id);
                setActiveTab('DEMANDS');
              }}
            />
          )}

          {activeTab === 'CONTINUOUS_IMPROVEMENT' && (
            <ContinuousImprovement 
              ideas={ideas}
              currentUser={currentUser}
              onAddIdea={handleAddIdea}
              onLikeIdea={handleToggleLikeIdea}
            />
          )}

          {activeTab === 'REPORTS' && (
            <ReportsView 
              demands={demands}
              users={users}
              areas={mockAreas}
              costCenters={mockCostCenters}
            />
          )}

          {activeTab === 'SETTINGS' && (
            <Settings 
              automations={automations} 
              onUpdateAutomations={setAutomations}
              recurringTasks={recurringTasks}
              onUpdateRecurringTasks={setRecurringTasks}
              kanbanColumns={kanbanColumns}
              onUpdateKanbanColumns={setKanbanColumns}
              slaConfigs={slaConfigs}
              onUpdateSlaConfigs={setSlaConfigs}
              currentUser={currentUser}
            />
          )}
        </main>
      </div>

      {/* Modal - Demand Details */}
      <AnimatePresence>
        {selectedDemand && (
          <DemandDetail 
            demand={selectedDemand}
            currentUser={currentUser}
            users={users}
            areas={mockAreas}
            costCenters={mockCostCenters}
            onClose={() => setSelectedDemandId(null)}
            onUpdateDemand={handleUpdateDemand}
          />
        )}
      </AnimatePresence>

      {/* Modal - Quick Create Demand */}
      <AnimatePresence>
        {quickCreateModal && (
          <CreateDemandModal 
            currentUser={currentUser}
            users={users}
            areas={mockAreas}
            costCenters={mockCostCenters}
            projects={projects}
            onClose={() => setQuickCreateModal(false)}
            onSave={(newDemand) => {
              handleAddNewDemand(newDemand);
              setQuickCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <FlowProvider>
      <MainAppContent />
    </FlowProvider>
  );
}
