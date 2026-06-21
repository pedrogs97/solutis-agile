/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Demand, User, DemandStatus, CostCenter, Area, Attachment, Comment, StandardProcedure, Project } from '../types';
import { mockStandardProcedures, mockUsers } from '../mockData';
import { 
  X, Clock, Clipboard, FileText, Check, AlertCircle, ArrowRightLeft, 
  Send, UserPlus, Play, FileUp, Star, AlertOctagon, HelpCircle, Sparkles, ListChecks, Trash2, FolderKanban, Share2, Users
} from 'lucide-react';
import { parseSopFileContent } from '../utils/sopParser';
import { useToast } from './Toast';

interface DemandDetailProps {
  demandId: string;
  demands: Demand[];
  currentUser: User;
  onClose: () => void;
  onUpdateDemand: (updatedDemand: Demand) => void;
  costCenters: CostCenter[];
  areas: Area[];
  projects: Project[];
}

export const DemandDetail: React.FC<DemandDetailProps> = ({
  demandId,
  demands,
  currentUser,
  onClose,
  onUpdateDemand,
  costCenters,
  areas,
  projects
}) => {
  const demand = demands.find(d => d.id === demandId);
  if (!demand) return null;

  const { success: toastSuccess, error: toastError } = useToast();
  const sop = demand.customSop || mockStandardProcedures[demand.type];

  const isObserver = demand.observerIds?.includes(currentUser.id) || false;
  const isObserverOnly = isObserver && 
    demand.assigneeId !== currentUser.id && 
    demand.solicitorId !== currentUser.id && 
    currentUser.role !== 'GESTOR' && 
    currentUser.role !== 'ADMIN';

  // Logic states
  const [commentText, setCommentText] = useState('');
  const [sopExpanded, setSopExpanded] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedAcompUserId, setSelectedAcompUserId] = useState('');

  const handleAddObserver = (userIdToAdd: string) => {
    if (!userIdToAdd) return;
    const currentObservers = demand.observerIds || [];
    if (currentObservers.includes(userIdToAdd)) {
      toastError('Este colaborador já está acompanhando esta demanda.');
      return;
    }
    const updatedObserverIds = [...currentObservers, userIdToAdd];
    const targetUser = mockUsers.find(u => u.id === userIdToAdd);
    const targetName = targetUser ? targetUser.name : userIdToAdd;

    const updatedHistory = [...demand.history, logToHistory(`Adicionou piloto acompanhante: ${targetName}`)];
    
    onUpdateDemand({
      ...demand,
      observerIds: updatedObserverIds,
      history: updatedHistory
    });

    toastSuccess(`${targetName} foi adicionado como acompanhante!`);
  };

  const handleRemoveObserver = (userIdToRemove: string) => {
    const currentObservers = demand.observerIds || [];
    const updatedObserverIds = currentObservers.filter(id => id !== userIdToRemove);
    const targetUser = mockUsers.find(u => u.id === userIdToRemove);
    const targetName = targetUser ? targetUser.name : userIdToRemove;

    const updatedHistory = [...demand.history, logToHistory(`Removeu piloto acompanhante: ${targetName}`)];

    onUpdateDemand({
      ...demand,
      observerIds: updatedObserverIds,
      history: updatedHistory
    });

    toastSuccess(`${targetName} foi removido dos acompanhantes.`);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?demandId=${demand.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      toastSuccess('Link de compartilhamento da demanda copiado!');
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      toastError('Não foi possível copiar o link de compartilhamento.');
    });
  };

  // Custom standard procedure (SOP) edit state
  const [sopEditOpen, setSopEditOpen] = useState(false);
  const [sopImportName, setSopImportName] = useState('');
  const [editingSopDoc, setEditingSopDoc] = useState('');
  const [editingFlowsteps, setEditingFlowsteps] = useState<string[]>([]);
  const [newFlowstepText, setNewFlowstepText] = useState('');
  const [editingVideoUrl, setEditingVideoUrl] = useState(sop?.videoUrl || '');

  const handleOpenSopEditor = () => {
    setEditingSopDoc(sop.procedureDocument);
    setEditingFlowsteps([...sop.flowsteps]);
    setEditingVideoUrl(sop.videoUrl || '');
    setSopEditOpen(!sopEditOpen);
  };

  const handleAddFlowstep = () => {
    if (!newFlowstepText.trim()) return;
    setEditingFlowsteps([...editingFlowsteps, newFlowstepText.trim()]);
    setNewFlowstepText('');
  };

  const handleRemoveFlowstep = (index: number) => {
    setEditingFlowsteps(editingFlowsteps.filter((_, i) => i !== index));
  };

  const handleSaveSopChanges = () => {
    if (editingFlowsteps.length === 0) {
      toastError('O padrão de execução (SOP/POP) exige pelo menos uma etapa de fluxo.');
      return;
    }
    const updatedSop: StandardProcedure = {
      flowsteps: editingFlowsteps,
      procedureDocument: editingSopDoc.trim() || 'Procedimento manual atualizado.',
      videoUrl: editingVideoUrl.trim() || 'https://www.w3schools.com/html/mov_bbb.mp4'
    };
    
    // Save to demand history too
    const updatedHistory = [...demand.history, logToHistory(`Padrão de Execução (POP) customizado e atualizado por Gestor`)];

    onUpdateDemand({
      ...demand,
      customSop: updatedSop,
      history: updatedHistory
    });

    toastSuccess('Padrão de Execução (POP) operacional atualizado com sucesso!');
    setSopEditOpen(false);
    setSopImportName('');
  };

  // Evidence Inputs
  const [evidenceNote, setEvidenceNote] = useState(demand.evidenceDescription || '');
  const [tempFileUploaded, setTempFileUploaded] = useState<Attachment | null>(
    demand.evidenceAttachmentId 
      ? demand.attachments.find(a => a.id === demand.evidenceAttachmentId) || null 
      : null
  );
  const [evidenceError, setEvidenceError] = useState('');

  // Transfer Inputs
  const [transferUserId, setTransferUserId] = useState('');
  const [transferRationale, setTransferRationale] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferMessage, setTransferMessage] = useState('');

  // Delegation Inputs
  const [delegationUserId, setDelegationUserId] = useState('');
  const [delegationOpen, setDelegationOpen] = useState(false);

  // Feedback Inputs
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackIsNegative, setFeedbackIsNegative] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  // Find users
  const analystUsers = mockUsers.filter(u => u.role === 'ANALISTA');
  const allPossibleAssignees = mockUsers.filter(u => u.role === 'ANALISTA' || u.role === 'GESTOR' || u.role === 'ADMIN');

  const getUserName = (id: string | null) => {
    if (!id) return 'Não atribuído';
    const user = mockUsers.find(u => u.id === id);
    return user ? user.name : id;
  };

  const getUserAvatar = (id: string | null) => {
    if (!id) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    const user = mockUsers.find(u => u.id === id);
    return user ? user.avatar : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
  };

  const getAreaName = (id: string) => {
    const area = areas.find(a => a.id === id);
    return area ? area.name : id;
  };

  const getCostCenterName = (id: string) => {
    const cc = costCenters.find(c => c.id === id);
    return cc ? `${cc.code} - ${cc.name}` : id;
  };

  // Helper logger
  const logToHistory = (action: string, justification?: string, prev?: string, next?: string) => {
    return {
      id: `hst-${Date.now()}`,
      userId: currentUser.id,
      action,
      prevStatus: prev,
      nextStatus: next,
      justification,
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // 1. Core workflow status updates
  const handleTransitionStatus = (newStatus: DemandStatus) => {
    // 🔴 Crucial transition check: COMPLETE -> REQUIRES EVIDENCE
    if (newStatus === 'CONCLUIDO') {
      if (!evidenceNote.trim()) {
        const msg = 'ERRO CRÍTICO: Descrição da evidência é obrigatória para conclusão.';
        setEvidenceError(msg);
        toastError(msg);
        return;
      }
      if (!tempFileUploaded) {
        const msg = 'ERRO CRÍTICO: É obrigatório anexar um documento de evidência.';
        setEvidenceError(msg);
        toastError(msg);
        return;
      }
      setEvidenceError('');
    }

    const previousStatus = demand.status;
    const updatedHistory = [...demand.history, logToHistory(`Status alterado para ${newStatus}`, undefined, previousStatus, newStatus)];
    
    // Auto increment step index to final if concluded
    let stageIdx = demand.currentStageIndex;
    if (newStatus === 'CONCLUIDO') {
      stageIdx = sop ? sop.flowsteps.length - 1 : stageIdx;
    } else if (newStatus === 'EM_ANDAMENTO') {
      stageIdx = 1;
    }

    const updatedDemand: Demand = {
      ...demand,
      status: newStatus,
      approvalStatus: newStatus === 'CONCLUIDO' ? 'AGUARDANDO_APROVACAO' : demand.approvalStatus,
      currentStageIndex: stageIdx,
      evidenceDescription: newStatus === 'CONCLUIDO' ? evidenceNote : demand.evidenceDescription,
      evidenceAttachmentId: newStatus === 'CONCLUIDO' ? tempFileUploaded?.id : demand.evidenceAttachmentId,
      timeSpentHours: newStatus === 'CONCLUIDO' ? demand.timeEstimatedHours : demand.timeSpentHours, // Simulate real hours matching estimated
      history: updatedHistory
    };

    onUpdateDemand(updatedDemand);
    toastSuccess(`Workflow atualizado! Status alterado para: ${newStatus}`);
  };

  // 2. Submit Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `com-${Date.now()}`,
      userId: currentUser.id,
      text: commentText,
      date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedDemand: Demand = {
      ...demand,
      comments: [...demand.comments, newComment],
      history: [...demand.history, logToHistory(`Inseriu um comentário`)]
    };

    onUpdateDemand(updatedDemand);
    setCommentText('');
    toastSuccess('Comentário publicado com sucesso!');
  };

  // 3. File upload simulation
  const handleSimulateUpload = () => {
    const assetId = `att-ev-${Date.now()}`;
    const mockFile: Attachment = {
      id: assetId,
      name: `Evidencia_Documental_${demand.id}_Assinada.pdf`,
      size: '1.4 MB',
      url: '#',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedDemand: Demand = {
      ...demand,
      attachments: [...demand.attachments, mockFile]
    };

    setTempFileUploaded(mockFile);
    onUpdateDemand(updatedDemand);
    setEvidenceError('');
    toastSuccess('Documento de comprovação anexado com sucesso!');
  };

  // 4. Request Transfer (Analyste)
  const handleRequestTransfer = () => {
    if (!transferUserId) {
      const msg = 'Selecione um analista para transferência.';
      setTransferMessage(msg);
      toastError(msg);
      return;
    }
    if (!transferRationale.trim()) {
      const msg = 'A justificativa da transferência é obrigatória.';
      setTransferMessage(msg);
      toastError(msg);
      return;
    }

    const targetUser = mockUsers.find(u => u.id === transferUserId);
    const targetName = targetUser ? targetUser.name : transferUserId;

    // A transfer request gets labeled as a transfer pending approval in the audit logs
    const updatedHistory = [
      ...demand.history, 
      logToHistory(
        `Solicitou transferência de responsabilidade para ${targetName}`, 
        `Justificativa: ${transferRationale}`
      )
    ];

    const updatedDemand: Demand = {
      ...demand,
      approvalStatus: 'AGUARDANDO_APROVACAO',
      // Store draft proposal metadata temporarily inside comments or historical data
      comments: [
        ...demand.comments,
        {
          id: `com-trans-${Date.now()}`,
          userId: 'usr-admin',
          text: `⚠️ [SOLICITAÇÃO DE TRANSFERÊNCIA] Proposto: ${targetName}. Motivo: "${transferRationale}". Requer aprovação do Gestor.`,
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ],
      history: updatedHistory
    };

    onUpdateDemand(updatedDemand);
    setTransferOpen(false);
    setTransferRationale('');
    setTransferUserId('');
    setTransferMessage('Solicitação de transferência submetida ao Gestor.');
    toastSuccess('Solicitação de transferência submetida ao Gestor.');
  };

  // 5. Approve Transfer (By Gestor / Admin)
  const handleApproveTransfer = (approve: boolean) => {
    // Detect latest proposed user name from transfer comment metadata
    const transferComment = demand.comments.find(c => c.text.includes('[SOLICITAÇÃO DE TRANSFERÊNCIA]'));
    if (!transferComment) return;

    let targetId = 'usr-analista'; // default fallback
    const text = transferComment.text;
    if (text.includes('Rafael Santos')) targetId = 'usr-analista';
    else if (text.includes('Carlos Eduardo')) targetId = 'usr-admin';
    else if (text.includes('Beatriz Mello')) targetId = 'usr-gestor';

    const targetUser = mockUsers.find(u => u.id === targetId);
    const targetName = targetUser ? targetUser.name : 'Outro Integrante';

    let updatedHistory = [];
    let updatedDemand: Demand;

    if (approve) {
      updatedHistory = [...demand.history, logToHistory(`Aprovou transferência de responsabilidade para de ${targetName}`)];
      updatedDemand = {
        ...demand,
        assigneeId: targetId,
        approvalStatus: 'NENHUMA',
        // Filter out transfer ticket comment
        comments: demand.comments.filter(c => c.id !== transferComment.id),
        history: updatedHistory
      };
      toastSuccess(`Transferência para ${targetName} aprovada!`);
    } else {
      updatedHistory = [...demand.history, logToHistory(`Rejeitou solicitação de transferência`)];
      updatedDemand = {
        ...demand,
        approvalStatus: 'REJEITADO',
        comments: demand.comments.filter(c => c.id !== transferComment.id),
        history: updatedHistory
      };
      toastSuccess('Solicitação de transferência recusada.');
    }

    onUpdateDemand(updatedDemand);
  };

  // 6. Direct Delegation (By Gestor)
  const handleDirectDelegate = () => {
    if (!delegationUserId) return;

    const delegateUser = mockUsers.find(u => u.id === delegationUserId);
    const delegateName = delegateUser ? delegateUser.name : delegationUserId;

    const updatedHistory = [...demand.history, logToHistory(`Gestor delegou diretamente esta demanda para ${delegateName}`)];
    
    const updatedDemand: Demand = {
      ...demand,
      assigneeId: delegationUserId,
      history: updatedHistory
    };

    onUpdateDemand(updatedDemand);
    setDelegationOpen(false);
    toastSuccess(`Demanda delegada com sucesso para ${delegateName}!`);
  };

  // 7. Submit Feedback (By Gestor / Admin)
  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) {
      const msg = 'É necessário fornecer um comentário explicativo no feedback.';
      setFeedbackError(msg);
      toastError(msg);
      return;
    }

    const feedbackObj = {
      managerId: currentUser.id,
      rating: feedbackRating,
      comment: feedbackComment,
      isNegative: feedbackIsNegative,
      date: new Date().toLocaleDateString('pt-BR')
    };

    const updatedHistory = [
      ...demand.history, 
      logToHistory(`Avaliação de produtividade e feedback salvo: ${feedbackRating} Estrelas (${feedbackIsNegative ? 'Crítico/Negativo' : 'Informativo'})`)
    ];

    const updatedDemand: Demand = {
      ...demand,
      feedback: feedbackObj,
      approvalStatus: 'APROVADO',
      history: updatedHistory
    };

    onUpdateDemand(updatedDemand);
    setFeedbackComment('');
    setFeedbackError('');
    toastSuccess('Feedback e avaliação de performance registrados!');
  };

  return (
    <motion.div
      id="demand-detail-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: 'spring', damping: 28, stiffness: 240 }}
        className="bg-white w-full max-w-3xl h-full flex flex-col shadow-2xl relative overflow-y-auto custom-scrollbar"
      >
        
        {/* Header toolbar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-10 font-display">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md">
                {demand.id}
              </span>
              <span className="text-xs font-mono font-extrabold text-blue-400">
                {demand.type}
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-slate-100 uppercase line-clamp-1">{demand.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              id={`btn-share-demand-${demand.id}`}
              onClick={handleShareLink}
              title="Copiar link de compartilhamento"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition font-sans ${
                copied
                  ? 'bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>{copied ? 'Link Copiado!' : 'Compartilhar'}</span>
            </button>
            <button 
              id="close-detail-modal"
              onClick={onClose} 
              className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar / Status transition switches */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Estado Atual:</span>
            {demand.status === 'PENDENTE' && <span className="bg-red-50 text-red-700 text-xs font-bold border border-red-200 py-1 px-3 rounded-full">🔴 Pendente</span>}
            {demand.status === 'EM_ANDAMENTO' && <span className="bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 py-1 px-3 rounded-full">🟠 Em Andamento</span>}
            {demand.status === 'CONCLUIDO' && <span className="bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 py-1 px-3 rounded-full">🟢 Concluído</span>}
          </div>

          <div className="flex gap-1.5">
            {/* Operational transitions depending on permissions */}
            {demand.status === 'PENDENTE' && !isObserverOnly && (currentUser.role === 'ANALISTA' || currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
              <button
                id="btn-start-execution"
                onClick={() => handleTransitionStatus('EM_ANDAMENTO')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs flex items-center gap-1 transition"
              >
                <Clock className="w-3.5 h-3.5" /> Iniciar Execução
              </button>
            )}

            {demand.status === 'EM_ANDAMENTO' && !isObserverOnly && (
              <a 
                href="#evidence-completion-anchor"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs flex items-center gap-1 transition animate-pulse"
              >
                <Check className="w-3.5 h-3.5" /> Concluir Atividade
              </a>
            )}

            {/* If transfer request exists, showcase gestor action triggers */}
            {demand.comments.some(c => c.text.includes('[SOLICITAÇÃO DE TRANSFERÊNCIA]')) && !isObserverOnly && (currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
              <div className="bg-blue-50 p-1.5 rounded-md border border-blue-200 flex gap-1.5 text-xs text-blue-800">
                <span className="font-bold self-center">Aprovar Transferência?</span>
                <button 
                  id="btn-approve-trans-yes"
                  onClick={() => handleApproveTransfer(true)} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded font-semibold text-[10px]"
                >
                  Sim
                </button>
                <button 
                  id="btn-approve-trans-no"
                  onClick={() => handleApproveTransfer(false)} 
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded font-semibold text-[10px]"
                >
                  Não
                </button>
              </div>
            )}
            
            {isObserverOnly && (
              <span className="bg-slate-100 border text-slate-500 font-bold text-[10px] uppercase py-1.5 px-3 rounded-md">
                Apenas Visualização 👁️
              </span>
            )}
          </div>
        </div>

        {/* Content body split */}
        <div className="p-6 space-y-6 flex-1">

          {isObserverOnly && (
            <div id="observer-warning-banner" className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>Você está acompanhando esta demanda como Co-piloto / Observador. Edições, atualizações e transações operacionais estão restritas para visualização.</span>
            </div>
          )}

          {/* Quick core fields grid layout */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
            <div className="space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase">Solicitante</span>
              <div className="flex items-center gap-1.5">
                <img src={getUserAvatar(demand.solicitorId)} alt="solicitor" className="w-4 h-4 rounded-full object-cover border" />
                <span className="text-xs font-semibold text-slate-700 truncate">{getUserName(demand.solicitorId).split(' ')[0]}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase">Responsável</span>
              <div className="flex items-center gap-1.5">
                <img src={getUserAvatar(demand.assigneeId)} alt="assignee" className="w-4 h-4 rounded-full object-cover border" />
                <span className="text-xs font-semibold text-slate-700 truncate">{getUserName(demand.assigneeId).split(' ')[0]}</span>
              </div>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase">Ambiente / Área</span>
              <span className="text-xs font-bold text-slate-700 block truncate">{getAreaName(demand.areaId)}</span>
            </div>

            <div className="space-y-0.5">
              <span className="block text-[9px] font-bold text-slate-400 uppercase">Centro de Custo</span>
              <span className="text-xs font-mono font-bold text-rose-700 block truncate">{getCostCenterName(demand.costCenterId)}</span>
            </div>
          </div>

          {/* Vínculo de Projeto Corporativo */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-150 text-xs gap-3">
            <div className="flex items-center gap-2 text-indigo-900 font-semibold">
              <FolderKanban className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Projeto Corporativo Associado:</span>
            </div>
            {currentUser.role === 'ADMIN' || currentUser.role === 'GESTOR' ? (
              <select
                value={demand.projectId || ''}
                onChange={(e) => {
                  const nextId = e.target.value || null;
                  const projName = projects.find(p => p.id === nextId)?.name || '';
                  onUpdateDemand({
                    ...demand,
                    projectId: nextId,
                    history: [
                      ...demand.history,
                      {
                        id: `hst-proj-${Date.now()}`,
                        userId: currentUser.id,
                        action: nextId 
                          ? `Atividade movida para o projeto: ${projName}`
                          : 'Atividade desvinculada de projetos corporativos',
                        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      }
                    ]
                  });
                }}
                className="p-1 px-3.5 rounded-lg border border-indigo-200 bg-white text-indigo-950 font-bold text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Tarefa Isolada (Sem Projeto)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : (
              <span className="font-extrabold text-indigo-800">
                {projects.find(p => p.id === demand.projectId)?.name || 'Tarefa Isolada (Sem Projeto)'}
              </span>
            )}
          </div>

          {/* SECÇÃO DE ACOMPANHANTES (OBSERVADORES) */}
          <div id="demand-observers-management-card" className="bg-white p-4 rounded-xl border border-slate-200/90 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-display">
                <Users className="w-4 h-4 text-indigo-500 shrink-0" /> Colaboradores Acompanhantes (Acompanhamento)
              </h4>
              <span className="text-[10px] font-extrabold bg-indigo-50 border border-indigo-150 text-indigo-750 px-2.5 py-0.5 rounded-full">
                {(demand.observerIds || []).length} Acompanhando
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-semibold leading-tight font-sans">
              Os colaboradores listados abaixo acompanham o andamento desta demanda (recebem notificações e visualizam os históricos), mas não alteram ou operam fluxos diretos.
            </p>

            {/* List of current accompanying users */}
            <div className="flex flex-wrap gap-1.5">
              {(demand.observerIds || []).length > 0 ? (
                (demand.observerIds || []).map(obsId => {
                  const u = mockUsers.find(user => user.id === obsId);
                  if (!u) return null;
                  return (
                    <div 
                      key={u.id}
                      className="bg-indigo-50/60 border border-indigo-150 pl-2.5 pr-1.5 py-1 rounded-lg flex items-center gap-1.5 text-xs text-indigo-950 font-bold"
                    >
                      <span className="w-4.5 h-4.5 rounded-full bg-indigo-200 text-indigo-800 text-[8.5px] flex items-center justify-center font-black">
                        {u.name.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate max-w-[125px] font-sans">{u.name}</span>
                      <span className="text-[8.5px] text-indigo-500 font-extrabold bg-indigo-100/40 px-1 rounded">({u.role})</span>
                      
                      {/* Only allow removing if not isObserverOnly */}
                      {!isObserverOnly && (
                        <button
                          type="button"
                          id={`btn-remove-observer-detail-${u.id}`}
                          onClick={() => handleRemoveObserver(u.id)}
                          className="text-red-500 hover:text-red-700 font-extrabold ml-1 hover:bg-slate-100 rounded p-0.5 leading-none transition cursor-pointer"
                          title="Remover acompanhante"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <span className="text-[11px] text-slate-400 italic">Nenhum colaborador adicional acompanhando esta demanda no momento.</span>
              )}
            </div>

            {/* Add observers form for authorized users */}
            {!isObserverOnly && (
              <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                <div className="flex-1 w-full">
                  <label htmlFor="select-acomp-user" className="block text-[9px] font-black text-slate-400 uppercase mb-1">Escolher outro colaborador para acompanhar</label>
                  <select
                    id="select-acomp-user"
                    value={selectedAcompUserId}
                    onChange={(e) => setSelectedAcompUserId(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer text-slate-800"
                  >
                    <option value="">Selecione um colega...</option>
                    {mockUsers
                      .filter(u => u.id !== currentUser.id && u.id !== demand.solicitorId && u.id !== demand.assigneeId && !(demand.observerIds || []).includes(u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))
                    }
                  </select>
                </div>
                <button
                  type="button"
                  id="btn-add-acomp-user"
                  onClick={() => {
                    handleAddObserver(selectedAcompUserId);
                    setSelectedAcompUserId('');
                  }}
                  disabled={!selectedAcompUserId}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-450 text-white font-bold text-[11px] py-2 px-3.5 rounded-lg transition shrink-0 h-9 flex items-center justify-center cursor-pointer"
                >
                  Confirmar Acompanhamento
                </button>
              </div>
            )}
          </div>

          {/* SLA Timeline Countdown visual */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Governança de SLA & Tempo Estimado</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">SLA Limite</div>
                <div className="text-lg font-extrabold text-slate-700">{demand.slaLimitHours} horas</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">SLA Consumido</div>
                <div className="text-lg font-extrabold text-slate-700">{demand.slaSpentHours} horas</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Tempo Estimado de Foco</div>
                <div className="text-lg font-extrabold text-slate-700">{demand.timeEstimatedHours} horas</div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center text-[11px] mb-1">
                <span className="text-slate-400">Progresso do tempo expirando</span>
                <span className="font-mono font-bold text-slate-600">{Math.round((demand.slaSpentHours / demand.slaLimitHours) * 100)}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  style={{ width: `${Math.min((demand.slaSpentHours / demand.slaLimitHours) * 100, 100)}%` }} 
                  className={`h-full rounded-full ${
                    demand.slaSpentHours > demand.slaLimitHours ? 'bg-red-500' : 'bg-slate-700'
                  }`} 
                />
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Detalhes do Pedido</h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
              {demand.description}
            </div>
          </div>

          {/* Standard Procedure (POP) Flowchart & detail documentation */}
          {sop && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clipboard className="w-3.5 h-3.5 text-blue-500" /> Padrão de Execução (POP)
                  </h4>
                  <p className="text-[10px] text-slate-400">Instruções reguladoras de conformidade</p>
                </div>

                <div className="flex items-center gap-2">
                  {(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
                    <button
                      id="btn-edit-sop-trigger"
                      onClick={handleOpenSopEditor}
                      className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold px-2.5 py-1 rounded transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-blue-500" />
                      {sopEditOpen ? 'Fechar Editor' : 'Gerenciar POP'}
                    </button>
                  )}
                  <button
                    id="btn-toggle-sop"
                    onClick={() => setSopExpanded(!sopExpanded)}
                    className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1"
                  >
                    {sopExpanded ? 'Contrair PDF' : 'Ler Manual PR'}
                  </button>
                </div>
              </div>

              {/* Styled SVG flowchart of stages */}
              <div className="flex flex-wrap items-center justify-start gap-1 py-1.5 scroll-x overflow-auto">
                {sop.flowsteps.map((step, idx) => {
                  const isActive = idx === demand.currentStageIndex;
                  const isPast = idx < demand.currentStageIndex;

                  return (
                    <React.Fragment key={idx}>
                      <div className={`p-2 rounded-md text-[10px] font-bold tracking-tight border flex items-center gap-1.5 transition ${
                        isActive 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-105' 
                          : isPast 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-white text-slate-400 border-slate-200'
                      }`}>
                        {isPast ? <Check className="w-3 h-3 text-emerald-600" /> : <span className="w-3.5 h-3.5 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center text-[8px] font-mono">{idx + 1}</span>}
                        <span>{step}</span>
                      </div>
                      {idx < sop.flowsteps.length - 1 && (
                        <span className="text-slate-300 font-mono text-[10px]">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Gestor POP Editor & Importer panel */}
              {sopEditOpen && (currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
                <div className="bg-blue-50/50 p-3.5 rounded-lg border border-blue-200 text-xs space-y-3.5 my-2">
                  <div className="flex items-center justify-between border-b border-blue-100 pb-1.5">
                    <span className="font-extrabold text-blue-900 flex items-center gap-1 uppercase tracking-tight">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Painel de Governança de Padrão (POP)
                    </span>
                    <span className="bg-blue-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                      Permissões Gestor Ativas
                    </span>
                  </div>

                  {/* SOP File importer option */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">1. Importar Novo Arquivo POP</label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 bg-white border border-blue-200 hover:bg-blue-50/10 transition rounded p-2 min-h-[36px] flex items-center">
                        <input
                          id="file-sop-detail-uploader"
                          type="file"
                          accept=".json,.txt,.md"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const content = evt.target?.result as string;
                              const parsed = parseSopFileContent(file.name, content);
                              setEditingFlowsteps(parsed.flowsteps);
                              setEditingSopDoc(parsed.procedureDocument);
                              setSopImportName(file.name);
                            };
                            reader.readAsText(file);
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <span className="text-[11px] text-blue-800 font-bold flex items-center gap-1.5">
                          <FileUp className="w-4 h-4 text-blue-500 shrink-0" />
                          {sopImportName ? `Importado: ${sopImportName}` : 'Clique para selecionar arquivo de instruções (.json, .txt, .md)'}
                        </span>
                      </div>
                      
                      {sopImportName && (
                        <button
                          id="btn-discard-uploaded-sop-detail"
                          type="button"
                          onClick={() => {
                            setSopImportName('');
                            setEditingSopDoc(sop.procedureDocument);
                            setEditingFlowsteps([...sop.flowsteps]);
                          }}
                          className="text-red-500 hover:underline font-bold text-[10px]"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Flowsteps adjustments */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">2. Ajustar Etapas do Fluxo</label>
                    
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded border border-blue-100 max-h-[120px] overflow-y-auto">
                      {editingFlowsteps.map((step, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 text-[10px] pl-2 pr-1.5 py-0.5 rounded flex items-center gap-1 font-bold text-slate-700">
                          <span>{idx + 1}. {step}</span>
                          <button
                            id={`btn-remove-flowstep-${idx}`}
                            type="button"
                            onClick={() => handleRemoveFlowstep(idx)}
                            className="text-red-500 hover:text-red-700 font-bold ml-1 text-[11px] hover:scale-110"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="txt-add-flowstep-field"
                        type="text"
                        placeholder="Novo passo operacional (ex: Homologação Sênior)..."
                        value={newFlowstepText}
                        onChange={(e) => setNewFlowstepText(e.target.value)}
                        className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-[11px] placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                      />
                      <button
                        id="btn-add-flowstep-action"
                        type="button"
                        onClick={handleAddFlowstep}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded text-[11px]"
                      >
                        Incluir Etapa
                      </button>
                    </div>
                  </div>

                  {/* Manual/Text procedure markdown input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">3. Instruções e Manual (Texto/Markdown)</label>
                    <textarea
                      id="txt-sop-manual-markdown"
                      rows={4}
                      value={editingSopDoc}
                      onChange={(e) => setEditingSopDoc(e.target.value)}
                      placeholder="Descreva as obrigações, prazos e os documentos válidos para cada etapa..."
                      className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-[11px] focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  {/* Video Tutorial URL Input */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">4. Link ou URL da Vídeo Aula (Vídeo POP)</label>
                    <input
                      id="txt-sop-video-url"
                      type="text"
                      value={editingVideoUrl}
                      onChange={(e) => setEditingVideoUrl(e.target.value)}
                      placeholder="Ex: https://www.w3schools.com/html/mov_bbb.mp4"
                      className="w-full p-2 bg-white border border-slate-200 rounded text-[11px] focus:outline-none focus:border-blue-400 font-mono"
                    />
                    <p className="text-[9px] text-slate-400">Insira um link de vídeo válido (formato MP4 ou similar para streaming)</p>
                  </div>

                  {/* Row buttons */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-blue-100">
                    <button
                      id="btn-cancel-sop-detail"
                      type="button"
                      onClick={() => {
                        setSopEditOpen(false);
                        setSopImportName('');
                      }}
                      className="text-slate-500 hover:text-slate-700 font-bold text-[10px] px-3 py-1 bg-white hover:bg-slate-50 border rounded"
                    >
                      Descartar
                    </button>
                    <button
                      id="btn-confirm-sop-detail"
                      type="button"
                      onClick={handleSaveSopChanges}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-4 py-1.5 rounded flex items-center gap-1.5 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" /> Salvar Padrão para esta Demanda
                    </button>
                  </div>
                </div>
              )}

              {/* Expansible Procedure text */}
              {sopExpanded && (
                <div className="bg-white p-4 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans space-y-3 max-h-[300px] overflow-y-auto">
                  <div className="whitespace-pre-line border-l-4 border-l-blue-500 pl-3">
                    {sop.procedureDocument}
                  </div>
                  
                  {/* Interactive Video training help */}
                  <div className="bg-slate-900 text-white p-3.5 rounded-lg flex flex-col items-center justify-center relative overflow-hidden h-[180px]">
                    {videoPlaying ? (
                      <video controls className="w-full h-full object-cover" autoPlay src={sop.videoUrl} />
                    ) : (
                      <div className="text-center space-y-3.5">
                        <Play className="w-10 h-10 text-amber-400 mx-auto bg-white/10 p-2.5 rounded-full cursor-pointer hover:scale-110 transition" onClick={() => setVideoPlaying(true)} />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-200">Guia em Vídeo de Execução Operacional</p>
                          <p className="text-[9px] text-slate-400">Capacitação institucional rápida do processo</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transfers / Delegation actions bar */}
          {(currentUser.role === 'ANALISTA' || currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && !isObserverOnly && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" /> Integração, Delegação & Transferência
              </h4>

              {/* Intelligent Workload Allocation Insight */}
              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 flex flex-col gap-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h5 className="text-[11px] font-extrabold text-indigo-950 uppercase tracking-wide">
                      Insight de Alocação Inteligente (Carga de Trabalho)
                    </h5>
                    <p className="text-[10px] text-indigo-700 leading-relaxed font-sans">
                      Disponibilidade em tempo real. Redirecione esta atividade para colaboradores com menor sobrecarga operacional de tarefas abertas:
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {(() => {
                    const currentAssigneeId = demand.assigneeId;
                    const eligibleUsers = mockUsers.filter(u => u.role === 'ANALISTA' || u.role === 'GESTOR' || u.role === 'ADMIN');
                    const workloads = eligibleUsers
                      .filter(u => u.id !== currentAssigneeId)
                      .map(u => {
                        const activeCount = demands.filter(d => d.assigneeId === u.id && d.status !== 'CONCLUIDO').length;
                        return { user: u, activeCount };
                      })
                      .sort((a, b) => a.activeCount - b.activeCount);

                    return workloads.slice(0, 3).map(({ user, activeCount }) => {
                      const isManager = currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN';
                      
                      const handleQuickSelect = () => {
                        if (isManager) {
                          setDelegationUserId(user.id);
                          setDelegationOpen(true);
                          setTransferOpen(false);
                        } else {
                          setTransferUserId(user.id);
                          setTransferOpen(true);
                          setDelegationOpen(false);
                        }
                      };

                      return (
                        <div 
                          key={user.id}
                          className="bg-white p-2 rounded-md border border-slate-150 flex flex-col justify-between hover:border-indigo-300 transition-all shadow-2xs group"
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-800 block truncate leading-tight">
                              {user.name}
                            </span>
                            <span className="text-[8px] text-slate-450 block truncate uppercase font-mono tracking-wider font-extrabold">
                              {user.role}
                            </span>
                          </div>
                          
                          <div className="mt-2.5 flex items-center justify-between gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                              activeCount === 0 
                                ? 'bg-emerald-50 text-emerald-700 font-extrabold' 
                                : activeCount < 3 
                                ? 'bg-blue-50 text-blue-700 font-extrabold'
                                : 'bg-amber-50 text-amber-700 font-extrabold'
                            }`}>
                              {activeCount} {activeCount === 1 ? 'ativa' : 'ativas'}
                            </span>

                            <button
                              type="button"
                              onClick={handleQuickSelect}
                              className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline px-1.5 py-0.5 rounded transition shrink-0"
                            >
                              {isManager ? 'Delegar' : 'Propor'}
                            </button>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {/* 1. Request Transfer (Analyste or Gestor) */}
                <button
                  id="btn-open-transfer"
                  onClick={() => setTransferOpen(!transferOpen)}
                  className="bg-white border text-xs font-bold text-slate-700 py-1.5 px-3 rounded-md hover:bg-slate-150 border-slate-200 transition inline-flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Transferir Atividade
                </button>

                {/* 2. Direct Delegation (By Gestor / Admin) */}
                {(currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
                  <button
                    id="btn-open-delegation"
                    onClick={() => setDelegationOpen(!delegationOpen)}
                    className="bg-white border text-xs font-bold text-blue-700 py-1.5 px-3 rounded-md hover:bg-blue-50 border-blue-200 transition inline-flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Delegar Direto (Gestor)
                  </button>
                )}
              </div>

              {/* Render Transfer form elements */}
              {transferOpen && (
                <div className="bg-white p-4 rounded-lg border border-slate-250 text-xs space-y-3">
                  <h5 className="font-bold text-slate-800">Solicitar Transferência (Rastreável)</h5>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Selecione o destinatário. O pedido gera auditoria e ficará pendente de aprovação prévia do Gestor.
                  </p>
                  
                  <div className="space-y-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destinatário</label>
                      <select
                        id="select-transfer-user"
                        value={transferUserId}
                        onChange={(e) => setTransferUserId(e.target.value)}
                        className="w-full p-2 bg-slate-50 border rounded"
                      >
                        <option value="">Selecione...</option>
                        {analystUsers.filter(u => u.id !== demand.assigneeId).map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Justificativa da Transferência (Mandatória)</label>
                      <textarea
                        id="txt-transfer-justification"
                        rows={2}
                        value={transferRationale}
                        onChange={(e) => setTransferRationale(e.target.value)}
                        placeholder="Insira as razões práticas para a transferência..."
                        className="w-full p-2 bg-slate-50 border rounded focus:ring-1 focus:ring-slate-500 text-xs"
                      />
                    </div>

                    {transferMessage && (
                      <p className="text-[10px] text-amber-600 font-bold">{transferMessage}</p>
                    )}

                    <div className="flex justify-end gap-2">
                      <button 
                        id="btn-confirm-transfer"
                        onClick={handleRequestTransfer} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 font-bold rounded"
                      >
                        Submeter Pedido
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Render Direct Delegation form elements */}
              {delegationOpen && (
                <div className="bg-white p-4 rounded-lg border border-purple-200 text-xs space-y-3">
                  <h5 className="font-bold text-purple-800">Delegar Atividade (Ação Imediata)</h5>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Selecione Colaborador</label>
                    <div className="flex gap-2">
                      <select
                        id="select-delegate-user"
                        value={delegationUserId}
                        onChange={(e) => setDelegationUserId(e.target.value)}
                        className="flex-1 p-2 bg-slate-50 border rounded"
                      >
                        <option value="">Selecione...</option>
                        {allPossibleAssignees.map(u => (
                          <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <button 
                        id="btn-confirm-delegate"
                        onClick={handleDirectDelegate} 
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-1.5 font-bold rounded"
                      >
                        Delegar Já
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CRITICAL GOVERNANCE MODULE: Evidence Comprobatory form */}
          {demand.status === 'EM_ANDAMENTO' && !isObserverOnly && (
            <div id="evidence-completion-anchor" className="bg-white p-5 rounded-xl border border-emerald-200 ring-2 ring-emerald-500/15 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-emerald-600">
                  <FileUp className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Módulo de Conclusão Obrigatória</h4>
                  <p className="text-[11px] text-slate-500">Conclusão de atividades exige evidência documental e explicativa formal.</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Justificativa Textual (Explicar o que e como foi resolvido)
                  </label>
                  <textarea
                    id="evidence-text-input"
                    rows={3}
                    value={evidenceNote}
                    onChange={(e) => setEvidenceNote(e.target.value)}
                    placeholder="Exemplo: 'Nota Fiscal emitida e conferida física e tributariamente no almoxarifado sob protocolo 458-12...'"
                    className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-emerald-500/20 text-xs text-slate-800"
                  />
                </div>

                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase leading-none">Comprovante de Evidência</span>
                    <span className="text-xs text-slate-600 font-medium block mt-1.5">
                      {tempFileUploaded 
                        ? `✅ ${tempFileUploaded.name} (${tempFileUploaded.size})` 
                        : 'Nenhum arquivo anexado para provar execução'
                      }
                    </span>
                  </div>

                  <button
                    id="btn-simulate-evidence-upload"
                    type="button"
                    onClick={handleSimulateUpload}
                    className="bg-slate-800 hover:bg-slate-950 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg inline-flex items-center gap-1.5 transition whitespace-nowrap"
                  >
                    <FileUp className="w-3.5 h-3.5" /> {tempFileUploaded ? 'Substituir Prova' : 'Simular Upload de Prova'}
                  </button>
                </div>

                {evidenceError && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 shrink-0" />
                    <span>{evidenceError}</span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    id="btn-finalize-with-evidence"
                    onClick={() => handleTransitionStatus('CONCLUIDO')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-6 rounded-lg transition"
                  >
                    Validar Provas e Concluir Atividade 🟢
                  </button>
                </div>

              </div>
            </div>
          )}

          {/* Concluded evidence archive visual */}
          {demand.status === 'CONCLUIDO' && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-250 text-xs space-y-2 leading-relaxed">
              <h4 className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider">Evidência registrada arquivada</h4>
              <p className="text-slate-700"><strong>Justificativa:</strong> "{demand.evidenceDescription}"</p>
              
              <div className="flex items-center gap-2 text-blue-600 font-bold pt-1.5">
                <FileText className="w-4 h-4" />
                <a href="#" className="hover:underline">
                  {tempFileUploaded?.name || 'Documento_Evidencia_Atividade.pdf'} ({tempFileUploaded?.size || '1.4 MB'})
                </a>
              </div>
            </div>
          )}

          {/* MANAGER FEEDBACK MODULE: For review of completed tasks */}
          {demand.status === 'CONCLUIDO' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                  <Star className="w-5 h-5 fill-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Avaliação do Gestor (Feedbacks de Execução de SLA)</h4>
                  <p className="text-[11px] text-slate-500">Mapeamento de desvios operacionais, produtividade e atrasos do operador.</p>
                </div>
              </div>

              {demand.feedback ? (
                /* Existent Feedback view */
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs text-slate-705">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < demand.feedback!.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} 
                        />
                      ))}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      demand.feedback!.isNegative ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      {demand.feedback!.isNegative ? 'Fato Corretivo/Gargalo' : 'Desempenho Excelente'}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed italic">"{demand.feedback!.comment}"</p>
                  <p className="text-[10px] text-slate-400">Avaliado por {getUserName(demand.feedback!.managerId)} em {demand.feedback!.date}</p>
                </div>
              ) : (
                /* Creating feedback form */
                ((currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') ? (
                  <form onSubmit={handleSubmitFeedback} className="space-y-3.5">
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nota de Execução</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              type="button"
                              key={star}
                              onClick={() => setFeedbackRating(star)}
                              className="focus:outline-none"
                            >
                              <Star className={`w-5 h-5 ${star <= feedbackRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 self-end">
                        <input
                          id="chk-feedback-negative"
                          type="checkbox"
                          checked={feedbackIsNegative}
                          onChange={(e) => setFeedbackIsNegative(e.target.checked)}
                          className="w-4 h-4 border rounded"
                        />
                        <label htmlFor="chk-feedback-negative" className="text-xs font-bold text-slate-600 flex items-center gap-1">
                          Registrar como desvio/gargalo (Feedback Negativo) ⚠️
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Comentário/Retorno do Avaliador</label>
                      <textarea
                        id="feedback-comment-input"
                        rows={2}
                        value={feedbackComment}
                        onChange={(e) => setFeedbackComment(e.target.value)}
                        placeholder="Ex: 'Parbéns pela agilidade. Operação executada conforme regras de governança.'"
                        className="w-full p-2 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-slate-500 text-xs text-slate-800"
                      />
                    </div>

                    {feedbackError && (
                      <p className="text-xs text-red-600 font-semibold">{feedbackError}</p>
                    )}

                    <div className="flex justify-end">
                      <button
                        id="btn-save-feedback"
                        type="submit"
                        className="bg-slate-900 hover:bg-slate-955 text-white font-bold text-xs py-1.5 px-4 rounded-lg"
                      >
                        Registrar Avaliação e Feedback
                      </button>
                    </div>

                  </form>
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    Aguardando avaliação final pelo Gestor Operacional.
                  </div>
                ))
              )}
            </div>
          )}

          {/* Comment thread */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Histórico de Comentários</h4>
            
            <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
              {demand.comments.length > 0 ? (
                demand.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 text-xs leading-relaxed">
                    <img src={getUserAvatar(comment.userId)} alt="user avatar" className="w-7 h-7 rounded-full object-cover shrink-0 border" />
                    <div className="bg-slate-50 p-3 rounded-lg flex-1 border border-slate-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-slate-800">{getUserName(comment.userId)}</span>
                        <span className="text-[9px] text-slate-400">{comment.date}</span>
                      </div>
                      <p className="text-slate-600 text-xs pr-1">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-400 text-xs py-4">Nenhum comentário registrado yet. Instigue colaboração.</div>
              )}
            </div>

            {!isObserverOnly ? (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  id="comment-text-input"
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Insira sua nota de acompanhamento..."
                  className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-500 text-slate-850"
                />
                <button
                  id="btn-submit-comment"
                  type="submit"
                  className="bg-slate-800 hover:bg-slate-950 p-2 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-150 text-slate-500 rounded-lg text-xs font-semibold text-center">
                🔒 Como piloto/observador de acompanhamento, você tem acesso somente leitura a este canal de comunicação.
              </div>
            )}
          </div>

          {/* Audit Logs Trail */}
          <div className="border-t border-slate-100 pt-5 space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> Log de Auditoria e Rastreabilidade
            </h4>

            <div className="relative border-l border-slate-200 pl-4 space-y-4">
              {demand.history.map((log) => (
                <div key={log.id} className="text-xs relative">
                  {/* Point item timeline anchor */}
                  <div className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white ring-1 ring-slate-200" />
                  
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{getUserName(log.userId)}</span>
                      <span className="text-[9px] text-slate-400">{log.date}</span>
                    </div>
                    <p className="text-slate-600">{log.action}</p>
                    {log.justification && (
                      <p className="text-[10px] bg-slate-50 text-slate-600 p-1.5 rounded-md border border-slate-200 italic">
                        "{log.justification}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </motion.div>
    </motion.div>
  );
};
