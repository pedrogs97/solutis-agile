import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Demand, User, Area, CostCenter } from '../types';
import { 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Star, 
  ArrowRight,
  Send,
  Workflow,
  Search,
  ThumbsUp,
  Coins
} from 'lucide-react';

interface ManagerApprovalsProps {
  demands: Demand[];
  users: User[];
  areas: Area[];
  costCenters: CostCenter[];
  currentUser: User;
  onUpdateDemand: (demand: Demand) => void;
}

export const ManagerApprovals: React.FC<ManagerApprovalsProps> = ({
  demands,
  users,
  areas,
  costCenters,
  currentUser,
  onUpdateDemand
}) => {
  // We filter demands where approvalStatus is AGUARDANDO_APROVACAO
  const pendingApprovals = useMemo(() => {
    return demands.filter(d => d.approvalStatus === 'AGUARDANDO_APROVACAO');
  }, [demands]);

  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  
  // Feedback / Approval form states
  const [rating, setRating] = useState<number>(5);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [rejectionRationale, setRejectionRationale] = useState<string>('');
  
  // Tab within approvals
  const [subTab, setSubTab] = useState<'PENDING' | 'HISTORY'>('PENDING');

  const getCollaboratorName = (id: string | null) => {
    if (!id) return 'Sem responsável';
    return users.find(u => u.id === id)?.name || id;
  };

  const getAreaName = (id: string) => {
    return areas.find(a => a.id === id)?.name || id;
  };

  const getCostCenterName = (id: string) => {
    const cc = costCenters.find(c => c.id === id);
    return cc ? `${cc.code} - ${cc.name}` : id;
  };

  const activeDemand = useMemo(() => {
    return pendingApprovals.find(d => d.id === selectedDemandId) || pendingApprovals[0] || null;
  }, [pendingApprovals, selectedDemandId]);

  // Set selected if not set or if current selected is no longer pending
  React.useEffect(() => {
    if (pendingApprovals.length > 0 && (!selectedDemandId || !pendingApprovals.some(d => d.id === selectedDemandId))) {
      setSelectedDemandId(pendingApprovals[0].id);
    }
  }, [pendingApprovals, selectedDemandId]);

  const handleApproveWithFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDemand) return;
    if (!feedbackText.trim()) {
      alert('Por favor, escreva um comentário de avaliação de performance.');
      return;
    }

    const updatedHistory = [
      ...activeDemand.history,
      {
        id: `hst-appr-${Date.now()}`,
        userId: currentUser.id,
        action: `✅ Homologação Concluída por Supervisor: Demanda em conformidade com o POP (${rating} Estrelas)`,
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    const approvedDemand: Demand = {
      ...activeDemand,
      status: 'CONCLUIDO',
      approvalStatus: 'APROVADO',
      feedback: {
        managerId: currentUser.id,
        rating: rating,
        comment: feedbackText.trim(),
        isNegative: false,
        date: new Date().toLocaleDateString('pt-BR')
      },
      history: updatedHistory
    };

    onUpdateDemand(approvedDemand);
    setFeedbackText('');
    setRating(5);
    // Select next if any
    const index = pendingApprovals.findIndex(d => d.id === activeDemand.id);
    if (pendingApprovals.length > 1) {
      const nextIndex = index === pendingApprovals.length - 1 ? 0 : index + 1;
      setSelectedDemandId(pendingApprovals[nextIndex].id);
    } else {
      setSelectedDemandId(null);
    }
  };

  const handleRejectAndReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDemand) return;
    if (!rejectionRationale.trim()) {
      alert('Por favor, indique a justificativa de retorno / inadequação.');
      return;
    }

    const updatedHistory = [
      ...activeDemand.history,
      {
        id: `hst-rej-${Date.now()}`,
        userId: currentUser.id,
        action: `🛑 Retornado para correção pelo Gestor. Justificativa: ${rejectionRationale}`,
        date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    const rejectedDemand: Demand = {
      ...activeDemand,
      status: 'EM_ANDAMENTO', // devolve para andamento
      approvalStatus: 'REJEITADO',
      history: updatedHistory
    };

    onUpdateDemand(rejectedDemand);
    setRejectionRationale('');
    // Select next if any
    const index = pendingApprovals.findIndex(d => d.id === activeDemand.id);
    if (pendingApprovals.length > 1) {
      const nextIndex = index === pendingApprovals.length - 1 ? 0 : index + 1;
      setSelectedDemandId(pendingApprovals[nextIndex].id);
    } else {
      setSelectedDemandId(null);
    }
  };

  const approvedDemandsHistory = useMemo(() => {
    return demands.filter(d => d.approvalStatus === 'APROVADO' || (d.status === 'CONCLUIDO' && d.approvalStatus !== 'AGUARDANDO_APROVACAO'));
  }, [demands]);

  return (
    <div id="manager-approvals-shell" className="space-y-6 text-left">
      
      {/* Header section with supervisor badge */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] bg-indigo-600/80 text-white font-extrabold px-2.5 py-0.5 rounded border border-indigo-500 uppercase tracking-wide">
            Painel Geral do Supervisor
          </span>
          <h2 className="text-lg font-black font-sans flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" /> Painel de Avaliação & Aprovação de Atividades
          </h2>
          <p className="text-xs text-slate-400">
            Fila reguladora de conformidade corporativa. Audite as evidências, atribua notas de performance sênior e assine a entrega dos analistas subordinados.
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setSubTab('PENDING')}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'PENDING' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Pendentes ({pendingApprovals.length})
          </button>
          <button
            onClick={() => setSubTab('HISTORY')}
            className={`py-1.5 px-3.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              subTab === 'HISTORY' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" /> Histórico Operacional ({approvedDemandsHistory.length})
          </button>
        </div>
      </div>

      {subTab === 'PENDING' ? (
        pendingApprovals.length === 0 ? (
          <div className="bg-white p-16 text-center rounded-2xl border border-slate-200">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-3 animate-pulse" />
            <h3 className="text-base font-black text-slate-900">Excelente! Tudo em conformidade</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto">
              Nenhuma atividade pendente de homologação na fila de governança corporativa de sua alçada. Seus analistas receberão e-mails com as metas devidas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left side list of approvals */}
            <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50/80 border-b border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Fila de Triagem de Alçada ({pendingApprovals.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[550px] overflow-y-auto">
                {pendingApprovals.map((dem) => {
                  const isSelected = dem.id === selectedDemandId;
                  const coll = users.find(u => u.id === dem.assigneeId);
                  
                  return (
                    <button
                      key={dem.id}
                      onClick={() => setSelectedDemandId(dem.id)}
                      className={`w-full text-left p-4 transition-colors flex items-start gap-3 border-b border-slate-100 cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <img 
                        src={coll?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                        alt={coll?.name} 
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-2">
                          <span className="font-mono text-[9px] font-extrabold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded border border-indigo-150">
                            {dem.id}
                          </span>
                          <span className="text-[9.5px] font-bold text-slate-400">{dem.dueDate}</span>
                        </div>
                        <h4 className="font-extrabold text-xs text-slate-900 truncate leading-tight">{dem.title}</h4>
                        <div className="text-[10px] font-medium text-slate-500 flex items-center justify-between">
                          <span>Resp: {coll?.name.split(' ')[0]}</span>
                          <span className="bg-rose-50 text-rose-700 text-[9px] px-1.5 py-0.2 rounded border border-rose-150 font-black">
                            {dem.type}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side detailed evaluation card */}
            {activeDemand && (
              <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
                
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 tracking-tight inline-block mb-1">
                      {activeDemand.priority} PRIORIDADE • {activeDemand.type}
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-snug">{activeDemand.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      Entregue pelo colaborador em: {activeDemand.dueDate} • Setor: {getAreaName(activeDemand.areaId)}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Centro de Custo</span>
                    <span className="text-xs font-extrabold text-slate-800">{getCostCenterName(activeDemand.costCenterId)}</span>
                  </div>
                </div>

                {/* Submitter & Effort info row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-150 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Colaborador Executor</span>
                    <div className="flex items-center gap-2">
                      <img 
                        src={users.find(u => u.id === activeDemand.assigneeId)?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'} 
                        referrerPolicy="no-referrer"
                        className="w-5 h-5 rounded-full object-cover border border-slate-200" 
                        alt="" 
                      />
                      <strong className="text-slate-800 font-extrabold">{getCollaboratorName(activeDemand.assigneeId)}</strong>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Esforço Operacional</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>Estimado: <strong>{activeDemand.timeEstimatedHours}h</strong></span>
                      <span className="text-slate-350">•</span>
                      <span>Realizado: <strong className="text-indigo-600 font-extrabold">{activeDemand.timeSpentHours}h</strong></span>
                    </div>
                  </div>

                  <div className="space-y-0.5 text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block sm:hidden md:block">SLA de Resposta</span>
                    <span className="font-mono font-bold text-slate-700 block">
                      {activeDemand.slaSpentHours}h consumidas / teto de {activeDemand.slaLimitHours}h
                    </span>
                  </div>
                </div>

                {/* Description details */}
                <div className="space-y-2 text-xs">
                  <h4 className="font-extrabold text-slate-700 uppercase tracking-wider block">O que foi solicitado:</h4>
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-slate-655 leading-relaxed font-sans">
                    {activeDemand.description}
                  </div>
                </div>

                {/* Submited Proof/Evidence! (Very critical for approval screens) */}
                <div className="bg-indigo-50/20 border border-indigo-100/60 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100/50 pb-2">
                    <span className="font-extrabold text-indigo-950 text-xs uppercase tracking-wide flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" /> Declaração de Evidência de Entrega
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.2 rounded uppercase border border-indigo-200">
                      Conformidade POP
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-700 italic font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-150">
                      "{activeDemand.evidenceDescription || 'Nenhum comentário descritivo anexado. Atividade entregue em lote.'}"
                    </p>

                    {activeDemand.evidenceAttachmentId && (
                      <div className="flex items-center justify-between bg-white border rounded-lg p-2.5 shadow-xs max-w-sm">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs truncate">
                          <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                          Documento_Metodo_Execucao.pdf
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">1.4 MB</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Decision Matrix Form (Approve with Feedback vs Reject) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200">
                  
                  {/* Approve action form */}
                  <form onSubmit={handleApproveWithFeedback} className="space-y-3 bg-emerald-50/15 border border-emerald-100 rounded-xl p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" /> APROVAR E HOMOLOGAR
                      </span>
                      <span className="bg-emerald-100 text-emerald-900 text-[8.5px] font-extrabold px-1.5 py-0.2 border border-emerald-200 rounded">
                        Produtividade (+)
                      </span>
                    </div>

                    {/* Star evaluation */}
                    <div className="space-y-1">
                      <label className="block text-slate-400 uppercase text-[9.5px] font-bold">1. Nota de Desempenho (1-5 Estrelas)</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="text-amber-400 hover:scale-115 transition cursor-pointer"
                          >
                            <Star className={`w-5 h-5 ${rating >= star ? 'fill-amber-400' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-1.5">
                      <label className="block text-slate-400 uppercase text-[9.5px] font-bold">2. Feedback de Produtividade/Qualidade</label>
                      <textarea
                        rows={3}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Escreva elogios, observações técnicas de melhoria ou conformidade de execução..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-indigo-500 text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition duration-150 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:shadow-emerald-500/10"
                    >
                      <Send className="w-3.5 h-3.5" /> Confirmar e Gravar Avaliação
                    </button>
                  </form>

                  {/* Reject / Repetition form */}
                  <form onSubmit={handleRejectAndReturn} className="space-y-3 bg-rose-50/15 border border-rose-100 rounded-xl p-4 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" /> RECUSAR / SOLICITAR CORREÇÃO
                      </span>
                      <span className="bg-rose-100 text-rose-900 text-[8.5px] font-extrabold px-1.5 py-0.2 border border-rose-200 rounded">
                        Retornar ao Analista
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-450 leading-normal">
                      A atividade será retornada ao status <strong className="text-indigo-600">Em Andamento</strong>. O executor será notificado para corrigir divergências operacionais frente ao manual corporativo.
                    </p>

                    <div className="space-y-1.5">
                      <label className="block text-slate-400 uppercase text-[9.5px] font-bold">Justificativa de Não-Estreitabilidade</label>
                      <textarea
                        rows={3}
                        value={rejectionRationale}
                        onChange={(e) => setRejectionRationale(e.target.value)}
                        placeholder="Explique detalhadamente quais pontos de conformidade ou arquivos do POP não foram cumpridos ou estão inconsistentes..."
                        className="w-full p-2 bg-white border border-slate-200 rounded text-xs focus:outline-none focus:border-rose-400 text-slate-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg transition duration-150 flex items-center justify-center gap-1.5 shadow-sm cursor-pointer hover:shadow-rose-500/10"
                    >
                      <Workflow className="w-3.5 h-3.5" /> Devolver para Ajustes
                    </button>
                  </form>

                </div>

              </div>
            )}

          </div>
        )
      ) : (
        /* History of approved/settled activities */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-indigo-600" /> Histórico Operacional de Atividades Homologadas
            </span>
            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2 py-0.5 rounded border border-indigo-200">
              {approvedDemandsHistory.length} Registradas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Atividade</th>
                  <th className="py-3 px-4">Colaborador</th>
                  <th className="py-3 px-4">Tempo Real</th>
                  <th className="py-3 px-4 text-center">Avaliação de Supervisor</th>
                  <th className="py-3 px-4">Feedback Descritivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {approvedDemandsHistory.map((dem) => {
                  const coll = users.find(u => u.id === dem.assigneeId);
                  return (
                    <tr key={dem.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">{dem.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{dem.title}</span>
                        <span className="text-[10px] text-slate-400">{dem.type}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{coll?.name || 'Direto'}</td>
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{dem.timeSpentHours}h de esforço</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex justify-center text-amber-400">
                          {Array.from({ length: dem.feedback?.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium italic text-slate-500 max-w-xs truncate" title={dem.feedback?.comment}>
                        "{dem.feedback?.comment || 'Sem comentários de avaliação.'}"
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
