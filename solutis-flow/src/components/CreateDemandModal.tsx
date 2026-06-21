/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Demand, DemandType, DemandStatus, User, CostCenter, Area, Attachment, StandardProcedure, Project } from '../types';
import { X, Save, AlertTriangle, FileText, ClipboardList, Plus, Sparkles, UserCheck, CheckCircle2, FileUp, ListChecks, HelpCircle } from 'lucide-react';
import { parseSopFileContent } from '../utils/sopParser';
import { useToast } from './Toast';

interface CreateDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  demands?: Demand[];
  costCenters: CostCenter[];
  areas: Area[];
  projects: Project[];
  currentUser: User;
  onAddDemand: (demand: Demand) => void;
}

export const CreateDemandModal: React.FC<CreateDemandModalProps> = ({
  isOpen,
  onClose,
  users,
  demands = [],
  costCenters,
  areas,
  projects,
  currentUser,
  onAddDemand,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DemandType>('COMPRAS');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [costCenterId, setCostCenterId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [customSla, setCustomSla] = useState<string>('');
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [customSop, setCustomSop] = useState<StandardProcedure | undefined>(undefined);
  const [sopFileName, setSopFileName] = useState('');
  const [selectedObserverIds, setSelectedObserverIds] = useState<string[]>([]);
  const { success: toastSuccess, error: toastError } = useToast();

  // Seta valores padrão ao abrir
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setType('COMPRAS');
      setDescription('');
      setPriority('MEDIA');
      if (costCenters.length > 0) setCostCenterId(costCenters[0].id);
      if (areas.length > 0) setAreaId(areas[0].id);
      setAssigneeId('');
      setProjectId('');
      setEstimatedValue('');
      setVendorName('');
      setCustomSla('');
      setUploadedFileNames([]);
      setSelectedObserverIds([]);
      setErrorMsg('');
      setSuccessMsg('');
      setCustomSop(undefined);
      setSopFileName('');
    }
  }, [isOpen, costCenters, areas]);

  // Atualiza SLA sugerido dependendo do tipo de demanda selecionado
  const getSlaHoursDefault = (demandType: DemandType) => {
    switch (demandType) {
      case 'COMPRAS': return 48;
      case 'REEMBOLSO': return 24;
      case 'CONTRATOS': return 72;
      case 'INVENTARIO': return 48;
      case 'ESG': return 120;
      case 'ESPORADICA': return 96;
      default: return 48;
    }
  };

  useEffect(() => {
    setCustomSla(getSlaHoursDefault(type).toString());
  }, [type]);

  const handleSimulateAttachment = () => {
    const defaultFiles = [
      'Orcamento_TI_Dell_Empresarial.pdf',
      'Cupom_Fiscal_Almoco_Parceiro.jpg',
      'Minuta_Contrato_Prestacao_Servicos_V3.docx',
      'Relatorio_Emissoes_Carbono_Assinado.pdf',
      'Termo_Comodato_Computador_Macbook.pdf'
    ];
    const unattached = defaultFiles.filter(name => !uploadedFileNames.includes(name));
    if (unattached.length > 0) {
      const randomFile = unattached[Math.floor(Math.random() * unattached.length)];
      setUploadedFileNames(prev => [...prev, randomFile]);
    } else {
      const simulatedName = `Anexo_Suplementar_${Math.floor(Math.random() * 900) + 100}.pdf`;
      setUploadedFileNames(prev => [...prev, simulatedName]);
    }
  };

  const handleRemoveSimulatedFile = (nameToRemove: string) => {
    setUploadedFileNames(prev => prev.filter(name => name !== nameToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      const msg = 'O campo "Título da Atividade" é obrigatório.';
      setErrorMsg(msg);
      toastError(msg);
      return;
    }
    if (!description.trim()) {
      const msg = 'O campo "Descrição da Atividade" é obrigatório.';
      setErrorMsg(msg);
      toastError(msg);
      return;
    }

    const valueNum = Number(estimatedValue) || 0;
    const slaHours = Number(customSla) || getSlaHoursDefault(type);

    // Constrói anexos mockados
    const buildAttachments: Attachment[] = uploadedFileNames.map((name, i) => ({
      id: `att-modal-${Date.now()}-${i}`,
      name,
      size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
      url: '#',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }));

    // Descrição estendida caso exista fornecedor ou orçamento
    let finalDescription = description.trim();
    if (vendorName || valueNum > 0) {
      const metaStr = `\n\n[Dados do Cadastro | Fornecedor: ${vendorName || 'N/D'} | Valor Estimado: R$ ${valueNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}]`;
      finalDescription += metaStr;
    }

    // Criação da estrutura de Demanda
    const newDemand: Demand = {
      id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      title: title.trim(),
      description: finalDescription,
      solicitorId: currentUser.id,
      assigneeId: assigneeId || null,
      managerId: 'usr-gestor', // Direcionado de início ao gestor correspondente
      observerIds: selectedObserverIds,
      priority,
      status: 'PENDENTE',
      approvalStatus: 'NENHUMA',
      slaLimitHours: slaHours,
      slaSpentHours: 0,
      dueDate: new Date(Date.now() + (slaHours / 24 || 3) * 24 * 60 * 60 * 1000).toISOString(),
      costCenterId,
      areaId,
      attachments: buildAttachments,
      timeEstimatedHours: Math.ceil(slaHours * 0.1), // Estimativa técnica proporcional
      timeSpentHours: 0,
      comments: [],
      currentStageIndex: 0,
      customSop: customSop,
      projectId: projectId || null,
      history: [
        {
          id: `hst-crt-${Date.now()}`,
          userId: currentUser.id,
          action: `Demanda cadastrada por ${currentUser.name} (${currentUser.role})`,
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    // Callback de inclusão
    onAddDemand(newDemand);

    setSuccessMsg('🎉 Demanda cadastrada com sucesso! Notificações enviadas aos envolvidos e regras de automação aplicadas.');
    toastSuccess(`Demanda ${newDemand.id} cadastrada com sucesso!`);
    
    // Fecha após pequeno tempo para feedback visual
    setTimeout(() => {
      onClose();
    }, 2050);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="create-demand-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 overflow-hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.12 }}
            className="bg-white w-full max-w-3xl rounded-[20px] border border-slate-200 shadow-3xl overflow-hidden flex flex-col text-left max-h-[92vh] focus-within:ring-1 focus-within:ring-slate-550/10 transition-all font-sans"
          >
        
        {/* Header toolbar */}
        <div className="bg-[#0B1528] text-white px-5 py-4 flex items-center justify-between border-b border-slate-800 shrink-0 sticky top-0 z-10 font-display">
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2 tracking-wide uppercase">
              <ClipboardList className="w-5 h-5 text-blue-500" /> Cadastrar Nova Demanda
            </h2>
            <p className="text-[10px] text-slate-400 font-medium leading-tight">
              Registre atividades operacionais, solicitações, reembolsos ou metas com SLAs automatizados.
            </p>
          </div>

          <button 
            id="close-create-modal"
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container with vertical overflow scrolling */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs text-slate-700 overflow-y-auto flex-1 custom-scroll">
          
          {successMsg && (
            <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-green-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-800 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-650 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title and Type Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Título da Atividade / Demanda</label>
              <input
                id="create-demand-title"
                type="text"
                placeholder="Ex: Aquisição de novas licenças de software"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 focus:outline-none transition-all placeholder-slate-400 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Tipo de Processo</label>
              <select
                id="create-demand-type"
                value={type}
                onChange={(e) => setType(e.target.value as DemandType)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                <option value="COMPRAS">Compras / Orçamento</option>
                <option value="REEMBOLSO">Reembolso de Despesas</option>
                <option value="CONTRATOS">Minuta Contratual / Legal</option>
                <option value="INVENTARIO">Kit Comodato / Tecnologia</option>
                <option value="ESG">ESG Sustentabilidade</option>
                <option value="ESPORADICA">Outros Administrativos</option>
              </select>
            </div>
          </div>

          {/* Cost Center, Origin Area, and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Centro de Custo Responsável</label>
              <select
                id="create-demand-cc"
                value={costCenterId}
                onChange={(e) => setCostCenterId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-805 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Área Destinatária</label>
              <select
                id="create-demand-area"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-805 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                {areas.map(area => (
                  <option key={area.id} value={area.id}>{area.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Nível de Prioridade / Urgência</label>
              <select
                id="create-demand-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-805 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                <option value="BAIXA">Baixa (Até 5 dias)</option>
                <option value="MEDIA">Média (Até 3 dias)</option>
                <option value="ALTA">Alta Urgência (Exige Tratamento Imediato)</option>
              </select>
            </div>
          </div>

          {/* Procurement Metadata Section helper with custom image style card */}
          {(type === 'COMPRAS' || type === 'REEMBOLSO') && (
            <div className="p-4 bg-[#F0F7FF] rounded-xl border border-blue-105 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[9px] font-extrabold text-[#1E40AF] uppercase mb-1.5 tracking-wide">Fornecedor Proposto / Favorecido</label>
                <input
                  id="create-demand-vendor"
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Nome do Fornecedor..."
                  className="w-full p-2.5 border border-slate-300 bg-white rounded-lg text-slate-800 text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex-1">
                <label className="block text-[9px] font-extrabold text-[#1E40AF] uppercase mb-1.5 tracking-wide">Valor Estimado (R$)</label>
                <input
                  id="create-demand-value"
                  type="number"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  placeholder="Ex: 5000.00"
                  className="w-full p-2.5 border border-slate-300 bg-white rounded-lg font-mono text-slate-800 text-xs placeholder-slate-400 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 focus:outline-none"
                />
                {type === 'COMPRAS' && Number(estimatedValue) > 10000 && (
                  <span className="text-[9px] text-[#2563EB] font-bold block mt-1.5 animate-pulse">
                    🔥 Alerta: Valor superior a R$ 10k aciona aprovação automática da Diretoria Executiva!
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SLA Hours, Assignee, Workloads and Project in matching mockup 3-column layouts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Responsável Inicial */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Responsável Inicial (Atribuição direta)</label>
              <select
                id="create-demand-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                <option value="">Não atribuído (Deixar para triagem)</option>
                {users
                  .filter(u => u.role !== 'SOLICITANTE')
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))
                }
              </select>

              {/* Workload suggestions perfectly styled as clickable buttons in original mockup color scheme */}
              <div className="mt-2.5 space-y-1.5">
                <span className="text-[9px] font-extrabold text-[#6366F1] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> Sugestões de Menor Carga:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const eligibleAssignees = users.filter(u => u.role !== 'SOLICITANTE');
                    const workloads = eligibleAssignees.map(u => {
                      const activeCount = demands.filter(d => d.assigneeId === u.id && d.status !== 'CONCLUIDO').length;
                      return { user: u, activeCount };
                    }).sort((a, b) => a.activeCount - b.activeCount);

                    return workloads.slice(0, 3).map(({ user, activeCount }) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setAssigneeId(user.id)}
                        className={`py-1 px-2.5 text-[9px] font-black rounded-lg border flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                          assigneeId === user.id
                            ? 'bg-[#6366F1] border-[#4F46E5] text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="truncate max-w-[80px]">{user.name.split(' ')[0]}</span>
                        <span className={`px-1 rounded text-[8px] font-black leading-none ${
                          assigneeId === user.id
                            ? 'bg-[#4F46E5] text-indigo-50'
                            : activeCount === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {activeCount}
                        </span>
                      </button>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Projeto Corporativo */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Projeto Corporativo (Opcional)</label>
              <select
                id="create-demand-project"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none cursor-pointer text-xs"
              >
                <option value="">Nenhum (Tarefa Isolada)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* SLA Limits */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Limite Máximo de SLA (Horas corridas)</label>
              <div className="flex items-center gap-2.5">
                <input
                  id="create-demand-sla"
                  type="number"
                  value={customSla}
                  onChange={(e) => setCustomSla(e.target.value)}
                  placeholder="Horas..."
                  className="w-24 p-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-blue-550 font-semibold font-mono whitespace-nowrap">
                  (Equivale a ≈ {Math.max(1, Math.round((Number(customSla) || 0) / 24))} dias)
                </span>
              </div>
            </div>
          </div>

          {/* Collaborator Accompaniment (Observers) Selection */}
          <div id="create-demand-observers-section">
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">
              Escolher Colaboradores para Acompanhar (Acompanhantes / Visualizadores)
            </label>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <p className="text-[10px] text-slate-400 font-medium">
                Selecione os colaboradores que deverão acompanhar o andamento desta atividade. Eles poderão visualizar a demanda, receber atualizações e interagir de forma assistiva, mas não realizarão edições críticas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                {users
                  .filter(u => u.id !== currentUser.id)
                  .map(u => {
                    const isSelected = selectedObserverIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        id={`btn-select-observer-${u.id}`}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedObserverIds(prev => prev.filter(id => id !== u.id));
                          } else {
                            setSelectedObserverIds(prev => [...prev, u.id]);
                          }
                        }}
                        className={`p-2 rounded-lg border text-left flex items-center justify-between transition cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-705 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border text-[9px] flex items-center justify-center font-bold text-slate-500 shrink-0">
                            {u.name.substring(0, 2).toUpperCase()}
                          </span>
                          <div className="truncate">
                            <p className="text-[11px] leading-tight truncate">{u.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium leading-none">{u.role}</p>
                          </div>
                        </div>
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-black shrink-0 ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && '✓'}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-wider">Descrição Detalhada do Pedido / Escopo</label>
            <textarea
              id="create-demand-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite especificações, regras, cronograma e justificativas necessárias..."
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-850 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs transition-all"
            />
          </div>

          {/* Gestor-Restricted SOP Import Compartment with high fidelity to image */}
          {(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
            <div className="p-4 bg-blue-50/15 rounded-xl border border-blue-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0" /> IMPORTAR ARQUIVO DE PADRÃO DE EXECUÇÃO (POP)
                  </span>
                  <p className="text-[9px] text-blue-650 font-bold leading-tight">
                    Apenas Gestores podem carregar ou ajustar o manual de diretivas e as etapas deste processo.
                  </p>
                </div>
                
                <span className="bg-[#2563EB] text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider font-mono">
                  Acesso Gestor
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-0.5">
                {/* Custom File Uploader with Image exact style */}
                <div className="flex flex-col justify-center border-2 border-dashed border-blue-200 rounded-xl p-4 bg-white/70 hover:bg-blue-50/30 transition relative cursor-pointer group">
                  <input
                    id="sop-file-uploader-input"
                    type="file"
                    accept=".json,.txt,.md"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const content = evt.target?.result as string;
                        setCustomSop(parseSopFileContent(file.name, content));
                        setSopFileName(file.name);
                      };
                      reader.readAsText(file);
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="text-center space-y-1.5">
                    <FileUp className="w-6 h-6 mx-auto text-blue-500 group-hover:scale-110 transition-transform" />
                    <span className="block text-[10px] font-extrabold text-[#2563EB]">
                      {sopFileName ? `✓ ${sopFileName}` : 'Escolher arquivo POP (.txt, .md, .json)'}
                    </span>
                    <span className="block text-[9px] text-slate-400 font-medium">
                      PDF, texto estruturado ou etapas automatizadas
                    </span>
                  </div>
                </div>

                {/* Templates and Manual Tweaks matching the screenshot */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Ou carregar modelo sugerido:</span>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      id="btn-load-preset-purchasing"
                      type="button"
                      onClick={() => {
                        setCustomSop({
                          flowsteps: ['Abertura', 'Cotações de Fornecedores', 'Revisão Financeira', 'Aprovado pelo Diretor', 'Processo Concluído'],
                          procedureDocument: '### Procedimento de Compras Personalizado\n1. Coleta das melhores propostas comerciais.\n2. Verificação de teto orçamentário secundário.\n3. Recebimento físico de todos os equipamentos.',
                          videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
                        });
                        setSopFileName('SOP_Compras_Corporativas_V2.json');
                      }}
                      className="bg-white border hover:bg-slate-50 border-slate-200 text-slate-750 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs cursor-pointer transition"
                    >
                      Preset Compras V2
                    </button>
                    <button
                      id="btn-load-preset-audit"
                      type="button"
                      onClick={() => {
                        setCustomSop({
                          flowsteps: ['Identificação', 'Inventário Preliminar', 'Bate de Saldos', 'Ajuste Contábil', 'Fechamento'],
                          procedureDocument: '### Procedimento Operacional de Auditorias Especiais\nProcedimento revisado contra fraudes internas e conciliação bancária das filiais.',
                          videoUrl: 'https://www.w3schools.com/html/movie.mp4'
                        });
                        setSopFileName('SOP_Auditoria_Fisica_Anual.txt');
                      }}
                      className="bg-white border hover:bg-slate-50 border-slate-200 text-slate-750 font-bold px-3 py-1.5 rounded-lg text-[10px] shadow-xs cursor-pointer transition"
                    >
                      Preset Auditoria
                    </button>
                  </div>
                </div>
              </div>

              {/* Parsed Preview */}
              {customSop && (
                <div className="p-3 bg-white border border-blue-150 rounded-xl space-y-2 text-[10px]">
                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Estrutura Ativa Carregada com Êxito</span>
                    <button
                      id="btn-reset-custom-sop"
                      type="button"
                      onClick={() => {
                        setCustomSop(undefined);
                        setSopFileName('');
                      }}
                      className="text-red-500 hover:underline font-bold"
                    >
                      Descartar Padrão
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1.5 font-mono font-bold text-blue-700">
                    <ListChecks className="w-4 h-4 shrink-0 text-blue-500" />
                    <span>Etapas ({customSop.flowsteps.length}):</span>
                    <span className="text-slate-650">{customSop.flowsteps.join(' → ')}</span>
                  </div>

                  <p className="text-slate-500 font-sans italic leading-tight line-clamp-2 border-l-2 border-slate-200 pl-2">
                    "{customSop.procedureDocument.replace(/[#*`_]/g, '')}"
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Simulated File upload container */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Documentos / Cotações Iniciais</span>
              <p className="text-[10px] text-slate-400 mt-0.5">Associe arquivos ao processo de triagem ou aprovações iniciais.</p>
              
              {uploadedFileNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {uploadedFileNames.map((name) => (
                    <span key={name} className="bg-white border border-slate-200 text-[10px] pl-2.5 pr-2 py-1 font-bold text-slate-705 rounded-lg flex items-center gap-1.5 shadow-xs">
                      <FileText className="w-3.5 h-3.5 text-slate-400" /> 
                      <span className="max-w-[150px] truncate">{name}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSimulatedFile(name)}
                        className="text-red-500 hover:text-red-700 font-extrabold ml-1.5 transition-colors cursor-pointer"
                        title="Remover anexo"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              id="btn-create-demand-attach"
              type="button"
              onClick={handleSimulateAttachment}
              className="bg-[#1E293B] hover:bg-[#0F172A] text-white font-black text-[10px] sm:text-[11px] py-2 px-4 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer shrink-0 uppercase tracking-wide"
            >
              <Plus className="w-4 h-4" /> Simular Anexo
            </button>
          </div>

          {/* Actions toolbar */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-150 shrink-0">
            <button
              id="btn-create-demand-cancel"
              type="button"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold px-4 py-2 hover:bg-slate-50 rounded-lg transition"
            >
              Cancelar
            </button>

            <button
              id="btn-create-demand-save"
              type="submit"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs py-2 px-6 rounded-lg transition shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> Registrar Demanda Oficial
            </button>
          </div>

        </form>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
