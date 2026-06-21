/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Automation, RecurringTask, SLAConfiguration, DemandType, AutomationTrigger, AutomationAction, User, StandardProcedure, Demand } from '../types';
import { 
  HelpCircle, ToggleLeft, ToggleRight, Sparkles, Plus, Trash2, Calendar, 
  CheckSquare, Clock, Save, Clipboard, FileUp, Check, Kanban, Lock, Unlock, Eye, EyeOff, Palette, ShieldAlert
} from 'lucide-react';
import { parseSopFileContent } from '../utils/sopParser';
import { useToast } from './Toast';

interface SettingsProps {
  automations: Automation[];
  recurringTasks: RecurringTask[];
  slaConfigs: SLAConfiguration[];
  currentUser: User;
  onAddAutomation: (auto: Automation) => void;
  onToggleAutomation: (id: string) => void;
  onDeleteAutomation: (id: string) => void;
  onAddRecurringTask: (task: RecurringTask) => void;
  onAddDemand?: (demand: Demand) => void;
  kanbanColumns?: any[];
  onUpdateKanbanColumns?: (newCols: any[]) => void;
  onUpdateSlaConfigs?: (configs: SLAConfiguration[]) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  automations,
  recurringTasks,
  slaConfigs,
  currentUser,
  onAddAutomation,
  onToggleAutomation,
  onDeleteAutomation,
  onAddRecurringTask,
  onAddDemand,
  kanbanColumns = [],
  onUpdateKanbanColumns,
  onUpdateSlaConfigs
}) => {
  const [activeTab, setActiveTab] = useState<'AUTOMATIONS' | 'RECURRING' | 'SLA' | 'KANBAN_COLS'>('AUTOMATIONS');
  const { success: toastSuccess, error: toastError } = useToast();

  const [editedCols, setEditedCols] = useState<any[]>(() => {
    return kanbanColumns ? JSON.parse(JSON.stringify(kanbanColumns)) : [];
  });

  const columnsString = JSON.stringify(kanbanColumns);
  useEffect(() => {
    if (kanbanColumns) {
      setEditedCols(JSON.parse(JSON.stringify(kanbanColumns)));
    }
  }, [columnsString]);

  // Automation creation wizard form states
  const [autoName, setAutoName] = useState('');
  const [autoTrigger, setAutoTrigger] = useState<AutomationTrigger>('AO_CRIAR');
  const [autoCondField, setAutoCondField] = useState('');
  const [autoCondOp, setAutoCondOp] = useState<'>' | '<' | '=='>('==');
  const [autoCondVal, setAutoCondVal] = useState('');
  const [autoAction, setAutoAction] = useState<AutomationAction>('NOTIFICAR_GESTOR');
  const [autoDest, setAutoDest] = useState('usr-gestor');
  const [autoErr, setAutoErr] = useState('');

  // Recurring Routine form states
  const [recTitle, setRecTitle] = useState('');
  const [recFreq, setRecFreq] = useState<'DIARIA' | 'SEMANAL' | 'QUINZENAL' | 'MENSAL'>('MENSAL');
  const [recArea, setRecArea] = useState('area-fin');
  const [recCC, setRecCC] = useState('cc-103');
  const [checklistItems, setChecklistItems] = useState<string[]>(['Verificar fluxo', 'Checar pendências']);
  const [newItemText, setNewItemText] = useState('');
  const [recErr, setRecErr] = useState('');

  // Recurring SOP States
  const [recSop, setRecSop] = useState<StandardProcedure | undefined>(undefined);
  const [recSopFileName, setRecSopFileName] = useState('');

  const handleCreateAutomation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autoName.trim()) {
      const msg = 'O nome da regra de automação é obrigatório.';
      setAutoErr(msg);
      toastError(msg);
      return;
    }

    const newAuto: Automation = {
      id: `aut-new-${Date.now()}`,
      name: autoName,
      trigger: autoTrigger,
      conditionField: autoCondField ? autoCondField : undefined,
      conditionOperator: autoCondField ? autoCondOp : undefined,
      conditionValue: autoCondField ? autoCondVal : undefined,
      action: autoAction,
      destinationUserOrRole: autoDest,
      isActive: true
    };

    onAddAutomation(newAuto);
    toastSuccess(`Automação "${autoName}" criada com sucesso!`);
    setAutoName('');
    setAutoCondField('');
    setAutoCondVal('');
    setAutoErr('');
  };

  const handleAddChecklistItem = () => {
    if (!newItemText.trim()) return;
    setChecklistItems([...checklistItems, newItemText]);
    setNewItemText('');
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleCreateRecurring = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) {
      const msg = 'O título da rotina recorrente é obrigatório.';
      setRecErr(msg);
      toastError(msg);
      return;
    }
    if (checklistItems.length === 0) {
      const msg = 'Adicione pelo menos um item operacional ao checklist.';
      setRecErr(msg);
      toastError(msg);
      return;
    }

    const newRec: RecurringTask = {
      id: `rec-new-${Date.now()}`,
      title: recTitle,
      frequency: recFreq,
      areaId: recArea,
      costCenterId: recCC,
      checklist: checklistItems,
      lastGenerated: new Date().toLocaleDateString('pt-BR'),
      nextGeneration: 'Próxima ocorrência programada',
      customSop: recSop
    };

    onAddRecurringTask(newRec);
    toastSuccess(`Rotina recorrente "${recTitle}" cadastrada com sucesso!`);
    setRecTitle('');
    setChecklistItems(['Verificar fluxo', 'Checar pendências']);
    setRecErr('');
    setRecSop(undefined);
    setRecSopFileName('');
  };

  const handleTriggerRoutineInstance = (task: RecurringTask) => {
    if (!onAddDemand) return;
    
    const assignedType: DemandType = task.title.toLowerCase().includes('compra')
      ? 'COMPRAS'
      : task.title.toLowerCase().includes('reembolso')
        ? 'REEMBOLSO'
        : task.title.toLowerCase().includes('contrato')
          ? 'CONTRATOS'
          : task.title.toLowerCase().includes('inventario')
            ? 'INVENTARIO'
            : task.title.toLowerCase().includes('esg')
              ? 'ESG'
              : 'ESPORADICA';

    const mockDemandId = `DEM-${Date.now().toString().slice(-4)}`;
    
    const newDemand: Demand = {
      id: mockDemandId,
      type: assignedType,
      title: `[Rotina] ${task.title}`,
      description: `Processamento periódico conforme ciclo de rotina recorrente ${task.frequency}.\n\nItens cadastrados no Checklist do Calendário:\n${task.checklist.map((c, i) => `${i+1}. ${c}`).join('\n')}`,
      solicitorId: currentUser.id,
      assigneeId: null, // Default assignee
      managerId: currentUser.id,
      observerIds: [],
      priority: 'MEDIA',
      status: 'PENDENTE',
      approvalStatus: 'NENHUMA',
      slaLimitHours: 72,
      slaSpentHours: 0,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().split('T')[0], // 3 days default limit
      costCenterId: task.costCenterId,
      areaId: task.areaId,
      timeEstimatedHours: 4,
      timeSpentHours: 0,
      currentStageIndex: 0,
      customSop: task.customSop, // Copied SOP
      comments: [],
      attachments: [],
      history: [
        {
          id: `h-trigger-${Date.now()}`,
          userId: currentUser.id,
          action: `Rotina recorrente disparada e ativada pelo Gestor. POP sincronizado.`,
          date: new Date().toLocaleDateString('pt-BR')
        }
      ]
    };

    onAddDemand(newDemand);
    toastSuccess(`Rotina disparada com sucesso! A demanda ${newDemand.id} foi gerada.`);
  };

  const canEditSLA = currentUser.role === 'ADMIN' || currentUser.role === 'GESTOR';

  const [tempSlaConfigs, setTempSlaConfigs] = useState<SLAConfiguration[]>([]);

  useEffect(() => {
    const initialConfigs: SLAConfiguration[] = [];
    const types: DemandType[] = ['COMPRAS', 'REEMBOLSO', 'CONTRATOS', 'INVENTARIO', 'ESG', 'ESPORADICA'];
    const priorities: ('ALTA' | 'MEDIA' | 'BAIXA')[] = ['ALTA', 'MEDIA', 'BAIXA'];

    types.forEach(t => {
      priorities.forEach(p => {
        const found = slaConfigs.find(s => s.demandType === t && s.priority === p);
        if (found) {
          initialConfigs.push({ ...found });
        } else {
          let limit = 72;
          if (t === 'COMPRAS') {
            limit = p === 'ALTA' ? 48 : p === 'MEDIA' ? 72 : 120;
          } else if (t === 'REEMBOLSO') {
            limit = p === 'ALTA' ? 24 : p === 'MEDIA' ? 48 : 48;
          } else if (t === 'CONTRATOS') {
            limit = p === 'ALTA' ? 24 : p === 'MEDIA' ? 48 : 72;
          } else if (t === 'INVENTARIO') {
            limit = p === 'ALTA' ? 24 : p === 'MEDIA' ? 48 : 96;
          } else if (t === 'ESG') {
            limit = p === 'ALTA' ? 48 : p === 'MEDIA' ? 96 : 144;
          } else if (t === 'ESPORADICA') {
            limit = p === 'ALTA' ? 24 : p === 'MEDIA' ? 48 : 72;
          }
          initialConfigs.push({
            id: `sla-${t.toLowerCase()}-${p.toLowerCase()}`,
            demandType: t,
            priority: p,
            limitHours: limit
          });
        }
      });
    });

    setTempSlaConfigs(initialConfigs);
  }, [slaConfigs]);

  const handleUpdateSlaHour = (type: DemandType, priority: 'ALTA' | 'MEDIA' | 'BAIXA', value: number) => {
    setTempSlaConfigs(prev => 
      prev.map(item => 
        item.demandType === type && item.priority === priority 
          ? { ...item, limitHours: isNaN(value) ? 0 : Math.max(0, value) }
          : item
      )
    );
  };

  const getSlaHours = (type: DemandType, priority: 'ALTA' | 'MEDIA' | 'BAIXA'): number => {
    const found = tempSlaConfigs.find(s => s.demandType === type && s.priority === priority);
    if (found) return found.limitHours;
    
    if (type === 'COMPRAS') {
      return priority === 'ALTA' ? 48 : priority === 'MEDIA' ? 72 : 120;
    } else if (type === 'REEMBOLSO') {
      return priority === 'ALTA' ? 24 : priority === 'MEDIA' ? 48 : 48;
    } else if (type === 'CONTRATOS') {
      return priority === 'ALTA' ? 24 : priority === 'MEDIA' ? 48 : 72;
    } else if (type === 'INVENTARIO') {
      return priority === 'ALTA' ? 24 : priority === 'MEDIA' ? 48 : 96;
    } else if (type === 'ESG') {
      return priority === 'ALTA' ? 48 : priority === 'MEDIA' ? 96 : 144;
    }
    return 72;
  };

  return (
    <div id="settings-engine-container" className="grid grid-cols-1 md:grid-cols-4 gap-6">
      
      {/* Settings Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-205 md:col-span-1 h-fit space-y-1.5 shadow-xs">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Painel de Configurações</h4>
        
        <button
          onClick={() => setActiveTab('AUTOMATIONS')}
          className={`w-full text-left font-semibold text-xs py-2 px-3 rounded-md flex items-center gap-2 transition ${
            activeTab === 'AUTOMATIONS' 
              ? 'bg-blue-600 text-white shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Automações de Processo
        </button>

        <button
          onClick={() => setActiveTab('RECURRING')}
          className={`w-full text-left font-semibold text-xs py-2 px-3 rounded-md flex items-center gap-2 transition ${
            activeTab === 'RECURRING' 
              ? 'bg-blue-600 text-white shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Calendar className="w-4 h-4" /> Rotinas e Obrigações Periódicas
        </button>

        <button
          onClick={() => setActiveTab('SLA')}
          className={`w-full text-left font-semibold text-xs py-2 px-3 rounded-md flex items-center gap-2 transition ${
            activeTab === 'SLA' 
              ? 'bg-blue-600 text-white shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Clock className="w-4 h-4" /> Prazos e SLAs
        </button>

        <button
          id="btn-tab-kanban-cols"
          onClick={() => setActiveTab('KANBAN_COLS')}
          className={`w-full text-left font-semibold text-xs py-2 px-3 rounded-md flex items-center gap-2 transition ${
            activeTab === 'KANBAN_COLS' 
              ? 'bg-blue-600 text-white shadow-xs font-bold' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Kanban className="w-4 h-4" /> Colunas do Kanban
        </button>
      </div>

      {/* Main Settings content tab split */}
      <div className="md:col-span-3 space-y-6">

        {/* Tab 1: AUTOMATIONS ENGINE */}
        {activeTab === 'AUTOMATIONS' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Eventos e Regras de Automação</h3>
                <p className="text-xs text-slate-500">
                  Estruture regras condicionais do tipo <strong>Evento Ativador → Condição → Ação</strong> para automatizar fluxos.
                </p>
              </div>

              {/* Automation Rules List */}
              <div className="space-y-3">
                {automations.map((auto) => (
                  <div key={auto.id} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">{auto.name}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 select-none border rounded ${
                          auto.isActive ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-200 border-slate-300 text-slate-500'
                        }`}>
                          {auto.isActive ? 'Ativa' : 'Pausada'}
                        </span>
                      </div>
                      
                      <div className="text-slate-500 font-medium font-sans">
                        Evento Ativador: <strong className="text-slate-700 font-mono text-[10px]">{auto.trigger}</strong> 
                        {auto.conditionField && (
                          <span> | Se <code>{auto.conditionField} {auto.conditionOperator} {auto.conditionValue}</code></span>
                        )}
                        <span> → Ação: <strong className="text-slate-700 font-mono text-[10px]">{auto.action}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          onToggleAutomation(auto.id);
                          toastSuccess(`Regra "${auto.name}" ${auto.isActive ? 'pausada' : 'ativada'} com sucesso!`);
                        }}
                        className="p-1 hover:bg-slate-200 rounded transition"
                        title={auto.isActive ? 'Desativar Regra' : 'Ativar Regra'}
                      >
                        {auto.isActive ? <ToggleRight className="w-6 h-6 text-blue-600" /> : <ToggleLeft className="w-6 h-6 text-slate-400" />}
                      </button>
                      <button 
                        onClick={() => {
                          onDeleteAutomation(auto.id);
                          toastSuccess(`Regra "${auto.name}" excluída.`);
                        }}
                        className="p-1 hover:bg-red-50 text-red-500 hover:text-red-700 rounded transition"
                        title="Deletar Automação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Automation rule wizard builder */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" /> Criar Nova Automação de Processo
              </h4>

              <form onSubmit={handleCreateAutomation} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nome Descritivo da Regra</label>
                    <input
                      id="txt-auto-name"
                      type="text"
                      placeholder="Ex: Alerta Diretor Reembolso > 500"
                      value={autoName}
                      onChange={(e) => setAutoName(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Evento Ativador (Trigger)</label>
                    <select
                      id="select-auto-trigger"
                      value={autoTrigger}
                      onChange={(e) => setAutoTrigger(e.target.value as AutomationTrigger)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="AO_CRIAR">Quando atividade for criada</option>
                      <option value="AO_SLA_VENCER">Quando SLA de atividade expirar</option>
                      <option value="AO_CONCLUIR">Quando operador concluir a atividade</option>
                      <option value="AO_APROVAR">Quando aprovador validar a atividade</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase">
                    <span>Definir Condição Seletiva (Opcional)</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Ex: Se valor for maior que 10000" />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Campo</label>
                      <input
                        id="txt-auto-cond-field"
                        type="text"
                        placeholder="Ex: valor ou tipo"
                        value={autoCondField}
                        onChange={(e) => setAutoCondField(e.target.value)}
                        className="w-full p-1.5 bg-white border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Operador</label>
                      <select
                        id="select-auto-cond-of"
                        value={autoCondOp}
                        onChange={(e) => setAutoCondOp(e.target.value as any)}
                        className="w-full p-1.5 bg-white border rounded"
                      >
                        <option value="==">Igual a (==)</option>
                        <option value=">">Maior que (&gt;)</option>
                        <option value="<">Menor que (&lt;)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-slate-400 uppercase mb-1">Valor</label>
                      <input
                        id="txt-auto-cond-val"
                        type="text"
                        placeholder="Ex: 10000 ou ESG"
                        value={autoCondVal}
                        onChange={(e) => setAutoCondVal(e.target.value)}
                        className="w-full p-1.5 bg-white border rounded"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Enviar Ação</label>
                    <select
                      id="select-auto-action"
                      value={autoAction}
                      onChange={(e) => setAutoAction(e.target.value as AutomationAction)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="ENVIAR_APROVACAO_DIRETORIA">Enviar para aprovação da Diretoria</option>
                      <option value="NOTIFICAR_GESTOR">Disparar alerta ao Gestor de Área</option>
                      <option value="MUDAR_STATUS_AUTOMATICO">Mudar status operacional automaticamente</option>
                      <option value="ATRIBUIR_ANALISTA">Atribuir analista especialista da fila</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destinatário da Ação (Responsável/Cargo)</label>
                    <select
                      id="select-auto-dest"
                      value={autoDest}
                      onChange={(e) => setAutoDest(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="usr-gestor">Beatriz Mello (Gestora)</option>
                      <option value="usr-aprovador">Pedro Gustavo (Diretoria)</option>
                      <option value="usr-analista">Rafael Santos (Analista)</option>
                    </select>
                  </div>
                </div>

                {autoErr && (
                  <p className="text-xs text-red-600 font-semibold">{autoErr}</p>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    id="btn-save-automation"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-md flex items-center gap-1 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Salvar Regra de Automação
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

        {/* Tab 2: RECURRING ROUTINES */}
        {activeTab === 'RECURRING' && (
          <div className="space-y-6">
            
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Agenda de Obrigações e Rotinas Recorrentes</h3>
                <p className="text-xs text-slate-500">
                  Geração automática de rotinas e obrigações periódicas baseadas em calendário. Cada rotina incorpora checklists de execução.
                </p>
              </div>

              {/* List of Recurring Tasks */}
              <div className="space-y-4">
                {recurringTasks.map((task) => (
                  <div key={task.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm tracking-tight">{task.title}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Área: <strong className="text-slate-600">{task.areaId}</strong></span>
                          <span>•</span>
                          <span>Centro Custo: <strong className="text-slate-600 font-mono text-[9px]">{task.costCenterId}</strong></span>
                        </div>
                      </div>

                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                        {task.frequency}
                      </span>
                    </div>

                    {/* Checklist preview */}
                    <div className="text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Checklist Operacional Obrigatório ({task.checklist.length} Passos)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 bg-white rounded border border-slate-100">
                        {task.checklist.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                            <CheckSquare className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {task.customSop && (
                      <div className="text-[10px] bg-blue-50/70 border border-blue-200 p-2.5 rounded-lg space-y-1">
                        <span className="font-bold text-blue-950 flex items-center gap-1 uppercase tracking-wider text-[9px]">
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" /> POP Incorporado (Gestor)
                        </span>
                        <div className="flex flex-wrap gap-1 leading-none">
                          {task.customSop.flowsteps.map((st, i) => (
                            <span key={i} className="bg-white text-[9px] text-slate-700 font-semibold px-1.5 py-0.5 rounded border border-slate-150">
                              {i+1}. {st}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1.5 border-t border-slate-100/50">
                      <div>
                        <span>Último Processo: {task.lastGenerated || 'Nunca'}</span>
                        <span className="mx-1.5">•</span>
                        <span>Próxima Geração: <strong className="text-slate-600">Simulador Executar</strong></span>
                      </div>
                      
                      {onAddDemand && (
                        <button
                          id={`btn-trigger-rec-now-${task.id}`}
                          type="button"
                          onClick={() => handleTriggerRoutineInstance(task)}
                          className="text-[10px] font-bold bg-blue-600 text-white px-3 py-1 rounded shadow-xs hover:bg-blue-700 transition"
                        >
                          Disparar Demanda ⚡
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Creation form */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1">
                <Clipboard className="w-3.5 h-3.5 text-blue-500" /> Cadastrar Nova Rotina Recorrente
              </h4>

              <form onSubmit={handleCreateRecurring} className="space-y-4 text-xs">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título da Rotina</label>
                    <input
                      id="txt-rec-title"
                      type="text"
                      placeholder="Ex: Conciliação de Inventário e Lacres"
                      value={recTitle}
                      onChange={(e) => setRecTitle(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Frequência</label>
                    <select
                      id="select-rec-freq"
                      value={recFreq}
                      onChange={(e) => setRecFreq(e.target.value as any)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="DIARIA">Diária</option>
                      <option value="SEMANAL">Semanal</option>
                      <option value="QUINZENAL">Quinzenal</option>
                      <option value="MENSAL">Mensal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Área Destinatária</label>
                    <select
                      id="select-rec-area"
                      value={recArea}
                      onChange={(e) => setRecArea(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="area-fin">Financeiro</option>
                      <option value="area-ops">Operações</option>
                      <option value="area-esg">ESG Sustentabilidade</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Centro de Custo</label>
                    <select
                      id="select-rec-cc"
                      value={recCC}
                      onChange={(e) => setRecCC(e.target.value)}
                      className="w-full p-2 bg-slate-50 border rounded-lg"
                    >
                      <option value="cc-102">CC-102 (Operações)</option>
                      <option value="cc-103">CC-103 (Financeiro)</option>
                      <option value="cc-104">CC-104 (ESG)</option>
                    </select>
                  </div>
                </div>

                {/* Checklist steps editor */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
                  <span className="block text-[10px] font-extrabold text-slate-500 uppercase">Checklist de Passos Obrigatórios</span>
                  
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto">
                    {checklistItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-1 px-2.5 bg-white rounded border border-slate-205 text-[11px] text-slate-600">
                        <span>{idx + 1}. {item}</span>
                        <button
                          id={`btn-remove-chk-${idx}`}
                          type="button" 
                          onClick={() => handleRemoveChecklistItem(idx)}
                          className="text-red-500 font-bold hover:text-red-700 hover:scale-105"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      id="txt-new-chk-item"
                      type="text"
                      placeholder="Adicione um passo obrigatório..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      className="flex-1 p-2 bg-white border rounded"
                    />
                    <button
                      id="btn-add-chk-item"
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3 rounded"
                    >
                      Adicionar Passo
                    </button>
                  </div>
                </div>

                {/* Gestor SOP Uploader for Recurring routine -- ROLE LOCKED */}
                {currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN' ? (
                  <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-200 space-y-2.5">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-1">
                      <span className="font-extrabold text-blue-950 flex items-center gap-1.5 uppercase text-[10px]">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Padrão de Execução de Processo (SOP / POP)
                      </span>
                      <span className="text-[8px] bg-blue-600 text-white font-extrabold px-1.5 py-0.5 rounded uppercase">
                        Gestor Ativo
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-tight">
                      Garante que as futuras demandas abertas por esta rotina incorporem o fluxo regulador de conformidade correto.
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 bg-white border border-blue-200 hover:bg-blue-50/10 transition rounded p-2 min-h-[36px] flex items-center">
                        <input
                          id="file-rec-sop-uploader"
                          type="file"
                          accept=".json,.txt,.md"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result as string;
                              const parsed = parseSopFileContent(file.name, text);
                              setRecSop(parsed);
                              setRecSopFileName(file.name);
                              if (parsed.flowsteps && parsed.flowsteps.length > 0) {
                                setChecklistItems(parsed.flowsteps);
                              }
                            };
                            reader.readAsText(file);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="text-[11px] text-blue-900 font-bold flex items-center gap-1.5">
                          <FileUp className="w-4 h-4 text-blue-500 shrink-0" />
                          {recSopFileName ? `POP Importado: ${recSopFileName}` : 'Importar arquivo de conformidade (.json, .txt, .md)'}
                        </span>
                      </div>
                      
                      {recSopFileName && (
                        <button
                          id="btn-clear-rec-sop"
                          type="button"
                          onClick={() => {
                            setRecSop(undefined);
                            setRecSopFileName('');
                          }}
                          className="text-red-500 text-[10px] font-bold hover:underline"
                        >
                          Limpar
                        </button>
                      )}
                    </div>

                    {recSop && (
                      <div className="bg-white p-2.5 rounded border border-blue-100 space-y-1.5 text-[10px]">
                        <div className="font-bold text-slate-700">Fluxflow Sincronizado ({recSop.flowsteps.length} etapas):</div>
                        <div className="flex flex-wrap gap-1 text-[9px]">
                          {recSop.flowsteps.map((st, i) => (
                            <span key={i} className="bg-slate-100 px-1.5 py-0.5 rounded border text-slate-600 font-bold">
                              {i+1}. {st}
                            </span>
                          ))}
                        </div>
                        <div className="text-slate-400 italic line-clamp-2 pt-1 border-t text-[9px] whitespace-pre-wrap">
                          {recSop.procedureDocument}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-slate-400 text-[10px]">
                    🔒 Importação de Padrão de Execução (POP) restrita para gestores do sistema.
                  </div>
                )}

                {recErr && (
                  <p className="text-xs text-red-600 font-semibold">{recErr}</p>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    id="btn-save-recurring"
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-md flex items-center gap-1 transition"
                  >
                    <Save className="w-3.5 h-3.5" /> Cadastrar Rotina Rotativa
                  </button>
                </div>

              </form>
            </div>

          </div>
        )}

        {/* Tab 3: SLA THRESHOLDS */}
        {activeTab === 'SLA' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4 text-left">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-sans">Configuração Proporcional de SLAs</h3>
                <p className="text-xs text-slate-500 max-w-xl">
                  Determina o limite ideal (horas corridas) para a entrega da demanda com base no tipo de registro e severidade de prioridade.
                </p>
              </div>
              {canEditSLA ? (
                <div id="sla-edit-badge" className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-250 py-1.5 px-3 rounded-lg font-bold">
                  <Unlock className="w-3.5 h-3.5" /> Modo de Edição Ativo ({currentUser.role === 'ADMIN' ? 'Administrador' : 'Gestor'})
                </div>
              ) : (
                <div id="sla-lock-badge" className="flex items-center gap-1.5 text-[10px] bg-slate-100 text-slate-500 border border-slate-200 py-1.5 px-3 rounded-lg font-semibold">
                  <Lock className="w-3.5 h-3.5" /> Somente Leitura (Disponível para Admin/Gestor)
                </div>
              )}
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-xs text-left text-slate-705">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Tipo de Demanda</th>
                    <th className="px-4 py-3">Alta Prioridade</th>
                    <th className="px-4 py-3">Média Prioridade</th>
                    <th className="px-4 py-3">Baixa Prioridade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {(['COMPRAS', 'REEMBOLSO', 'CONTRATOS', 'INVENTARIO', 'ESG'] as DemandType[]).map((type) => {
                    const label = type === 'INVENTARIO' ? 'INVENTÁRIO' : type === 'ESG' ? 'ESG SUSTENTABILIDADE' : type;
                    return (
                      <tr key={type}>
                        <td className="px-4 py-3.5 font-bold text-slate-800">{label}</td>
                        {/* ALTA */}
                        <td className="px-4 py-3.5">
                          {canEditSLA ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={getSlaHours(type, 'ALTA')}
                                onChange={(e) => handleUpdateSlaHour(type, 'ALTA', parseInt(e.target.value) || 0)}
                                className="w-16 px-2 py-1 text-center font-mono font-bold text-rose-700 bg-rose-50/50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
                              />
                              <span className="font-semibold text-slate-400">h</span>
                              {type === 'INVENTARIO' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Fila urgente)</span>}
                              {type === 'ESG' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Atuação urgente)</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-mono text-rose-700 font-bold">{getSlaHours(type, 'ALTA')}h</span>
                              {type === 'INVENTARIO' && <span className="text-[10px] text-slate-400 font-sans">(Fila urgente)</span>}
                              {type === 'ESG' && <span className="text-[10px] text-slate-400 font-sans">(Ação mitigatória urgente)</span>}
                            </div>
                          )}
                        </td>
                        {/* MEDIA */}
                        <td className="px-4 py-3.5">
                          {canEditSLA ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={getSlaHours(type, 'MEDIA')}
                                onChange={(e) => handleUpdateSlaHour(type, 'MEDIA', parseInt(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-center font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
                              />
                              <span className="font-semibold text-slate-400">h</span>
                              {type === 'CONTRATOS' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Análise padrão)</span>}
                              {type === 'INVENTARIO' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Almoxarifado)</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-mono text-slate-600">{getSlaHours(type, 'MEDIA')}h</span>
                              {type === 'CONTRATOS' && <span className="text-[10px] text-slate-400 font-sans">(Análise padrão)</span>}
                              {type === 'INVENTARIO' && <span className="text-[10px] text-slate-400 font-sans">(Almoxarifado comum)</span>}
                            </div>
                          )}
                        </td>
                        {/* BAIXA */}
                        <td className="px-4 py-3.5">
                          {canEditSLA ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                max="999"
                                value={getSlaHours(type, 'BAIXA')}
                                onChange={(e) => handleUpdateSlaHour(type, 'BAIXA', parseInt(e.target.value) || 0)}
                                className="w-16 px-1.5 py-1 text-center font-mono text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
                              />
                              <span className="font-semibold text-slate-400">h</span>
                              {type === 'REEMBOLSO' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Teto)</span>}
                              {type === 'CONTRATOS' && <span className="text-[10px] text-slate-400 font-sans hidden sm:inline ml-1">(Minuta simples)</span>}
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="font-mono text-slate-600">{getSlaHours(type, 'BAIXA')}h</span>
                              {type === 'REEMBOLSO' && <span className="text-[10px] text-slate-400 font-sans">(Teto estipulado)</span>}
                              {type === 'CONTRATOS' && <span className="text-[10px] text-slate-400 font-sans">(Minuta de baixo risco)</span>}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {canEditSLA && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSlaConfigs?.(tempSlaConfigs);
                    toastSuccess('Parâmetros de SLAs atualizados com sucesso!');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <Save className="w-4 h-4" /> Salvar Configurações de SLA
                </button>
              </div>
            )}

            <p className="text-[10px] text-slate-400 italic text-left">
              *Nota: Mudanças estruturais de SLA impactam apenas novas atividades criadas no sistema Flowta. Atividades herdam o SLA original de conformidade.
            </p>
          </div>
        )}

        {/* Tab 4: KANBAN COLUMNS CONFIGURATION */}
        {activeTab === 'KANBAN_COLS' && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-5 animate-fadeIn text-left">
            <div className="flex items-center justify-between border-b border-slate-105 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Estruturação de Colunas do Kanban</h3>
                <p className="text-xs text-slate-500 text-left">
                  Customize os títulos, cores de destaque e a visibilidade dos blocos operacionais do fluxo de trabalho.
                </p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 border border-indigo-100">
                <Kanban className="w-3.5 h-3.5" /> Quadro Dinâmico
              </span>
            </div>

            {/* Locked alert if the current user doesn't have privileges */}
            {!(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 text-left">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black">Permissão Restrita</strong>
                  Este painel é de acesso exclusivo para os perfis de <strong className="text-amber-950">Gestor</strong> e <strong className="text-amber-950">Admin</strong>. Colaboradores analistas e solicitantes possuem apenas visualização de conformidade sem direito à alteração da grade do pipeline.
                </div>
              </div>
            )}

            <div className="space-y-4 text-left">
              {editedCols.map((col, idx) => {
                const colors = [
                  { name: 'rose', bg: 'bg-rose-500' },
                  { name: 'indigo', bg: 'bg-indigo-500' },
                  { name: 'amber', bg: 'bg-amber-500' },
                  { name: 'emerald', bg: 'bg-emerald-500' },
                  { name: 'violet', bg: 'bg-violet-500' },
                  { name: 'orange', bg: 'bg-orange-500' },
                  { name: 'sky', bg: 'bg-sky-500' }
                ];
                const canEdit = currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN';

                return (
                  <div key={col.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${
                          col.color === 'rose' ? 'bg-rose-500' :
                          col.color === 'indigo' ? 'bg-indigo-500' :
                          col.color === 'amber' ? 'bg-amber-500' :
                          col.color === 'emerald' ? 'bg-emerald-500' :
                          col.color === 'violet' ? 'bg-violet-500' :
                          col.color === 'orange' ? 'bg-orange-500' : 'bg-sky-500'
                        }`} />
                        <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Identificador: {col.id} {col.id === 'AGUARDANDO_APROVACAO' ? '(Padrão / Nova)' : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          id={`chk-col-vis-${col.id}`}
                          type="checkbox"
                          checked={col.visible}
                          disabled={!canEdit}
                          onChange={(e) => {
                            const updated = [...editedCols];
                            updated[idx].visible = e.target.checked;
                            setEditedCols(updated);
                          }}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <label htmlFor={`chk-col-vis-${col.id}`} className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                          Exibir no Quadro Kanban
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1">Título Amigável da Coluna</label>
                        <input
                          id={`txt-col-title-${col.id}`}
                          type="text"
                          value={col.title}
                          placeholder="Ex: Em Espera de Avaliação"
                          disabled={!canEdit}
                          onChange={(e) => {
                            const updated = [...editedCols];
                            updated[idx].title = e.target.value;
                            setEditedCols(updated);
                          }}
                          className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>

                      <div>
                        <span className="block text-[10px] font-extrabold text-slate-400 uppercase mb-1.5">Cor Temática de Destaque</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {colors.map((c) => {
                            const isSelected = col.color === c.name;
                            return (
                              <button
                                key={c.name}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => {
                                  const updated = [...editedCols];
                                  updated[idx].color = c.name;
                                  setEditedCols(updated);
                                }}
                                className={`w-6 h-6 rounded-full ${c.bg} transition-all relative cursor-pointer disabled:cursor-not-allowed ${
                                  isSelected ? 'ring-3 ring-indigo-600 scale-110 shadow-xs' : 'hover:scale-105 opacity-85'
                                }`}
                                title={`Cor ${c.name}`}
                              >
                                {isSelected && (
                                  <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-black">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
              <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
                <button
                  id="btn-chk-reset-canon"
                  type="button"
                  onClick={() => {
                    const defaultCols = [
                      { id: 'PENDENTE', title: 'Pendente', visible: true, color: 'rose' },
                      { id: 'EM_ANDAMENTO', title: 'Em Andamento', visible: true, color: 'indigo' },
                      { id: 'AGUARDANDO_APROVACAO', title: 'Aguardando Aprovação', visible: true, color: 'amber' },
                      { id: 'CONCLUIDO', title: 'Concluído', visible: true, color: 'emerald' }
                    ];
                    setEditedCols(defaultCols);
                    toastSuccess('Colunas redefinidas para o padrão.');
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs rounded-lg transition cursor-pointer"
                >
                  Restaurar Padrão
                </button>

                <button
                  id="btn-save-kanban-cols"
                  type="button"
                  onClick={() => {
                    if (editedCols.some((col: any) => !col.title.trim())) {
                      toastError('Nenhum título de coluna pode estar vazio.');
                      return;
                    }
                    if (onUpdateKanbanColumns) {
                      onUpdateKanbanColumns(editedCols);
                      toastSuccess('Configurações de colunas salvas com sucesso no Flowta Engine!');
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs py-2 px-5 rounded-lg flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Salvar Alterações de Colunas
                </button>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
