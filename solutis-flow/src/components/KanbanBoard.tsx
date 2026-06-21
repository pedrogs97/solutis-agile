/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Demand, DemandStatus, User } from '../types';
import { Plus, ArrowRight, Clock, AlertTriangle, MessageSquare, Paperclip, ChevronRight, Check } from 'lucide-react';

interface KanbanBoardProps {
  demands: Demand[];
  users: User[];
  onSelectDemand: (id: string) => void;
  onQuickTransition?: (id: string, newStatus: DemandStatus) => void;
  currentUser: User;
  kanbanColumns?: any[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  demands,
  users,
  onSelectDemand,
  onQuickTransition,
  currentUser,
  kanbanColumns
}) => {
  // Filter out demands if current user is 'SOLICITANTE'
  const allowedDemands = demands.filter(d => {
    if (currentUser.role === 'SOLICITANTE' && d.solicitorId !== currentUser.id && d.assigneeId !== currentUser.id && !d.observerIds.includes(currentUser.id)) {
      return false;
    }
    return true;
  });

  const getColorClasses = (colorName: string) => {
    switch (colorName) {
      case 'rose':
        return {
          bgClass: 'bg-rose-50/40 border-rose-200/90 shadow-2xs',
          textClass: 'text-rose-950 font-black',
          badgeBg: 'bg-rose-100 border-rose-300 text-rose-800 font-extrabold',
          dotColor: 'bg-rose-500 ring-2 ring-rose-200',
          topLine: 'bg-rose-500'
        };
      case 'indigo':
        return {
          bgClass: 'bg-indigo-50/40 border-indigo-200/90 shadow-2xs',
          textClass: 'text-indigo-950 font-black',
          badgeBg: 'bg-indigo-100 border-indigo-300 text-indigo-800 font-extrabold',
          dotColor: 'bg-indigo-500 ring-2 ring-indigo-200',
          topLine: 'bg-indigo-500'
        };
      case 'amber':
        return {
          bgClass: 'bg-amber-50/40 border-amber-200/90 shadow-2xs',
          textClass: 'text-amber-950 font-black',
          badgeBg: 'bg-amber-100 border-amber-300 text-amber-800 font-extrabold',
          dotColor: 'bg-amber-500 ring-2 ring-amber-200',
          topLine: 'bg-amber-500'
        };
      case 'emerald':
        return {
          bgClass: 'bg-emerald-50/25 border-emerald-200/80 shadow-2xs',
          textClass: 'text-emerald-950 font-black',
          badgeBg: 'bg-emerald-100 border-emerald-300 text-emerald-800 font-extrabold',
          dotColor: 'bg-emerald-500 ring-2 ring-emerald-200',
          topLine: 'bg-emerald-500'
        };
      case 'violet':
        return {
          bgClass: 'bg-violet-50/30 border-violet-200 shadow-2xs',
          textClass: 'text-violet-950 font-black',
          badgeBg: 'bg-violet-100 border-violet-300 text-violet-805 font-extrabold',
          dotColor: 'bg-violet-500 ring-2 ring-violet-200',
          topLine: 'bg-violet-500'
        };
      case 'orange':
        return {
          bgClass: 'bg-orange-50/30 border-orange-200 shadow-2xs',
          textClass: 'text-orange-955 font-black',
          badgeBg: 'bg-orange-100 border-orange-300 text-orange-800 font-extrabold',
          dotColor: 'bg-orange-500 ring-2 ring-orange-200',
          topLine: 'bg-orange-500'
        };
      case 'sky':
        return {
          bgClass: 'bg-sky-50/30 border-sky-200 shadow-2xs',
          textClass: 'text-sky-955 font-black',
          badgeBg: 'bg-sky-100 border-sky-300 text-sky-800 font-extrabold',
          dotColor: 'bg-sky-500 ring-2 ring-sky-200',
          topLine: 'bg-sky-500'
        };
      default:
        return {
          bgClass: 'bg-slate-50 border-slate-205 shadow-2xs',
          textClass: 'text-slate-950 font-black',
          badgeBg: 'bg-slate-100 border-slate-300 text-slate-800 font-extrabold',
          dotColor: 'bg-slate-500 ring-2 ring-slate-200',
          topLine: 'bg-slate-500'
        };
    }
  };

  const activeCols = (kanbanColumns || [
    { id: 'PENDENTE', title: 'Pendente', visible: true, color: 'rose' },
    { id: 'EM_ANDAMENTO', title: 'Em Andamento', visible: true, color: 'indigo' },
    { id: 'AGUARDANDO_APROVACAO', title: 'Aguardando Aprovação', visible: true, color: 'amber' },
    { id: 'CONCLUIDO', title: 'Concluído', visible: true, color: 'emerald' }
  ]).filter(c => c.visible);

  const isAwaitingColVisible = activeCols.some(c => c.id === 'AGUARDANDO_APROVACAO');

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return <span className="bg-rose-50 text-rose-700 text-[9px] border border-rose-200 px-2 py-0.5 rounded font-extrabold uppercase font-mono">Alta</span>;
      case 'MEDIA':
        return <span className="bg-amber-50 text-amber-700 text-[9px] border border-amber-200 px-2 py-0.5 rounded font-semibold uppercase font-mono">Média</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 text-[9px] border border-emerald-200 px-2 py-0.5 rounded font-semibold uppercase font-mono">Baixa</span>;
    }
  };

  const getUserInitials = (userId: string | null) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    if (!user) return '?';
    const parts = user.name.split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getUserAvatar = (userId: string | null) => {
    if (!userId) return null;
    const user = users.find(u => u.id === userId);
    return user ? user.avatar : null;
  };

  return (
    <div className="space-y-6 w-full animate-fadeIn">
      
      {/* Kanban header mimicking Image 2 */}
      <div id="kanban-view-header" className="text-left py-2 border-b border-slate-200/60 pb-5">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-sans">
          VISUALIZAÇÃO
        </p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5 font-display">
          Quadro Kanban
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
          3 status oficiais. Mova rapidamente entre etapas — para concluir, é exigida evidência.
        </p>
      </div>

      <div 
        id="kanban-board-root" 
        className={`grid grid-cols-1 gap-6 w-full ${
          activeCols.length === 4 ? 'lg:grid-cols-4' :
          activeCols.length === 3 ? 'lg:grid-cols-3' :
          activeCols.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
        }`}
      >
      {activeCols.map((col) => {
        const styleClasses = getColorClasses(col.color);
        
        let colDemands = [];
        if (col.id === 'PENDENTE') {
          colDemands = allowedDemands.filter(d => d.status === 'PENDENTE');
        } else if (col.id === 'EM_ANDAMENTO') {
          colDemands = allowedDemands.filter(d => d.status === 'EM_ANDAMENTO');
        } else if (col.id === 'AGUARDANDO_APROVACAO') {
          colDemands = allowedDemands.filter(d => d.status === 'CONCLUIDO' && (!d.feedback || d.approvalStatus === 'AGUARDANDO_APROVACAO'));
        } else if (col.id === 'CONCLUIDO') {
          if (isAwaitingColVisible) {
            colDemands = allowedDemands.filter(d => d.status === 'CONCLUIDO' && (d.feedback && d.approvalStatus !== 'AGUARDANDO_APROVACAO'));
          } else {
            colDemands = allowedDemands.filter(d => d.status === 'CONCLUIDO');
          }
        }

        return (
          <div 
            id={`kanban-col-${col.id}`}
            key={col.id} 
            className={`flex flex-col rounded-2xl border p-5 min-h-[580px] shadow-sm relative overflow-hidden transition-all duration-300 ${styleClasses.bgClass}`}
          >
            {/* Top high-contrast visual accent line for instant group context */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 ${styleClasses.topLine}`} />

            {/* Column Header */}
            <div className="flex items-center justify-between mb-4.5 px-1 mt-1">
              <h3 className={`text-xs uppercase tracking-widest flex items-center gap-2.5 font-display ${styleClasses.textClass}`}>
                <span className={`w-2.5 h-2.5 rounded-full ${styleClasses.dotColor}`}></span> {col.title}
              </h3>
              <span className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full font-mono border shadow-2xs ${styleClasses.badgeBg}`}>
                {colDemands.length}
              </span>
            </div>

            {/* Demand cards list */}
            <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[700px] pr-1">
              {colDemands.length > 0 ? (
                colDemands.map((demand) => {
                  const isSlaOverdue = col.id !== 'CONCLUIDO' && col.id !== 'AGUARDANDO_APROVACAO' && (demand.slaSpentHours > demand.slaLimitHours);
                  const isSlaRisk = col.id !== 'CONCLUIDO' && col.id !== 'AGUARDANDO_APROVACAO' && !isSlaOverdue && (demand.slaLimitHours - demand.slaSpentHours <= 6);

                  return (
                    <motion.div
                      id={`kanban-card-${demand.id}`}
                      key={demand.id}
                      onClick={() => onSelectDemand(demand.id)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ 
                        y: -3, 
                        scale: 1.012,
                        boxShadow: "0 10px 20px -10px rgba(0, 0, 0, 0.08), 0 3px 6px -3px rgba(0, 0, 0, 0.03)",
                        borderColor: '#cbd5e1'
                      }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                      className={`bg-white rounded-lg p-4 border border-slate-200 cursor-pointer text-left relative overflow-hidden group`}
                    >
                      {/* SLA alert colored corner left tip */}
                      {isSlaOverdue && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
                      )}
                      {isSlaRisk && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
                      )}

                      {/* Card Info */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase bg-slate-50 px-1 py-0.5 rounded select-none">
                            {demand.id}
                          </span>
                          <span className="text-[9px] font-mono text-blue-600 font-extrabold uppercase bg-blue-50 px-1.5 rounded">
                            {demand.type}
                          </span>
                        </div>

                        <h5 className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition tracking-tight line-clamp-1">
                          {demand.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {demand.description}
                        </p>
                      </div>

                      {/* Quick Meta indicators */}
                      <div className="mt-3 pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(demand.priority)}
                          <span className="font-mono text-[9px]">{demand.costCenterId}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500">
                          {demand.attachments.length > 0 && (
                            <span className="flex items-center gap-0.5 px-1 py-0.2 background bg-slate-50 border rounded-xs" title={`${demand.attachments.length} Anexos`}>
                              <Paperclip className="w-2.5 h-2.5" />
                              <strong className="font-sans text-[8px]">{demand.attachments.length}</strong>
                            </span>
                          )}
                          {demand.comments.length > 0 && (
                            <span className="flex items-center gap-0.5 px-1 py-0.2 background bg-slate-50 border rounded-xs" title={`${demand.comments.length} Comentários`}>
                              <MessageSquare className="w-2.5 h-2.5" />
                              <strong className="font-sans text-[8px]">{demand.comments.length}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom SLA tag & avatar assignee */}
                      <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3 h-3 ${isSlaOverdue ? 'text-red-500 animate-pulse' : isSlaRisk ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className={`text-[9px] font-sans ${isSlaOverdue ? 'text-red-600 font-semibold' : isSlaRisk ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                            {col.id === 'CONCLUIDO' || col.id === 'AGUARDANDO_APROVACAO' ? 'Finalizado' : `${demand.slaSpentHours}h de ${demand.slaLimitHours}h`}
                          </span>
                        </div>

                        <div>
                          {getUserAvatar(demand.assigneeId) ? (
                            <img 
                              src={getUserAvatar(demand.assigneeId)!} 
                              alt="assignee" 
                              className="w-4 h-4 rounded-full border border-slate-200 object-cover"
                              title={`Responsável: ${getUserInitials(demand.assigneeId)}`}
                            />
                          ) : (
                            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center font-mono text-[8px] text-slate-500 border border-dotted" title="Sem Atribuição">
                              --
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick transition controls for non-purchasers/convenience */}
                      {onQuickTransition && demand.status !== 'CONCLUIDO' && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition duration-150 relative z-10">
                          {demand.status === 'PENDENTE' && (
                            <button
                              id={`quick-start-${demand.id}`}
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickTransition(demand.id, 'EM_ANDAMENTO');
                              }}
                              className="text-[9px] font-bold bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded flex items-center gap-0.5 cursor-pointer"
                            >
                              Iniciar <ChevronRight className="w-2.5 h-2.5" />
                            </button>
                          )}
                          {demand.status === 'EM_ANDAMENTO' && (
                            <span id={`quick-hint-obs-${demand.id}`} className="text-[9px] text-slate-400 italic px-1 self-center">
                              Conclusão exige evidência
                            </span>
                          )}
                        </div>
                      )}

                    </motion.div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 bg-white/50 border border-slate-100/50 rounded-lg select-none">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
