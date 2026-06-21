/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Demand, CostCenter, Area, User } from '../types';
import { Search, Filter, AlertTriangle, Eye, Clock, Calendar, CheckSquare, Layers, FolderHeart, ArrowRight, Plus } from 'lucide-react';

interface DemandListProps {
  demands: Demand[];
  users: User[];
  costCenters: CostCenter[];
  areas: Area[];
  onSelectDemand: (id: string) => void;
  currentUser: User;
  onQuickCreateClick?: () => void;
  initialStatusFilter?: string;
  onClearInitialStatusFilter?: () => void;
}

export const DemandList: React.FC<DemandListProps> = ({
  demands,
  users,
  costCenters,
  areas,
  onSelectDemand,
  currentUser,
  onQuickCreateClick,
  initialStatusFilter = 'TODOS',
  onClearInitialStatusFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('TODOS');
  const [selectedPriority, setSelectedPriority] = useState<string>('TODOS');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatusFilter);
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('TODOS');
  const [groupBy, setGroupBy] = useState<'NENHUM' | 'STATUS' | 'PRIORIDADE' | 'CENTRO_CUSTO' | 'AREA'>('NENHUM');

  useEffect(() => {
    if (initialStatusFilter && initialStatusFilter !== 'TODOS') {
      setSelectedStatus(initialStatusFilter);
      onClearInitialStatusFilter?.();
    }
  }, [initialStatusFilter, onClearInitialStatusFilter]);

  const getUserName = (id: string | null) => {
    if (!id) return 'Não atribuído';
    const user = users.find(u => u.id === id);
    return user ? user.name : id;
  };

  const getAreaName = (id: string) => {
    const area = areas.find(a => a.id === id);
    return area ? area.name : id;
  };

  const getCostCenterName = (id: string) => {
    const cc = costCenters.find(c => c.id === id);
    return cc ? `${cc.code} - ${cc.name}` : id;
  };

  // Filter demands
  const filteredDemands = demands.filter(d => {
    // Search keyword match
    const matchesSearch = 
      d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'TODOS' || d.type === selectedType;
    const matchesPriority = selectedPriority === 'TODOS' || d.priority === selectedPriority;
    const matchesStatus = selectedStatus === 'TODOS' || d.status === selectedStatus;
    const matchesCostCenter = selectedCostCenter === 'TODOS' || d.costCenterId === selectedCostCenter;

    // Filter view for SOLICITANTE: Can only see their requests or where observer/owner
    if (currentUser.role === 'SOLICITANTE' && d.solicitorId !== currentUser.id && d.assigneeId !== currentUser.id && !d.observerIds.includes(currentUser.id)) {
      return false;
    }

    return matchesSearch && matchesType && matchesPriority && matchesStatus && matchesCostCenter;
  });

  // Group demands if requested
  const getGroupedDemands = () => {
    if (groupBy === 'NENHUM') {
      return { 'Todas as Atividades': filteredDemands };
    }

    const groups: Record<string, Demand[]> = {};

    filteredDemands.forEach(d => {
      let key = 'Outros';
      if (groupBy === 'STATUS') {
        key = d.status === 'PENDENTE' ? '🔴 PENDENTE' : d.status === 'EM_ANDAMENTO' ? '🟠 EM ANDAMENTO' : '🟢 CONCLUÍDO';
      } else if (groupBy === 'PRIORIDADE') {
        key = d.priority === 'ALTA' ? '🔥 ALTA PRIORIDADE' : d.priority === 'MEDIA' ? '⚡ MÉDIA PRIORIDADE' : '🌱 BAIXA PRIORIDADE';
      } else if (groupBy === 'CENTRO_CUSTO') {
        key = getCostCenterName(d.costCenterId);
      } else if (groupBy === 'AREA') {
        key = getAreaName(d.areaId);
      }

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(d);
    });

    return groups;
  };

  const grouped = getGroupedDemands();

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'ALTA':
        return <span className="bg-rose-50 text-rose-700 text-[10px] font-semibold border border-rose-200 px-2.5 py-0.5 rounded-full uppercase">Alta</span>;
      case 'MEDIA':
        return <span className="bg-amber-50 text-amber-700 text-[10px] font-semibold border border-amber-200 px-2.5 py-0.5 rounded-full uppercase">Média</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">Baixa</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> PENDENTE</span>;
      case 'EM_ANDAMENTO':
        return <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> EM ANDAMENTO</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 px-2.5 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CONCLUÍDO</span>;
    }
  };

  return (
    <div id="demand-list-root" className="space-y-4">
      
      {/* Filter and control panel */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              id="search-input"
              type="text"
              placeholder="Pesquisar por ID, título ou descrição de demanda..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-800 transition"
            />
          </div>

          {onQuickCreateClick && (
            <button
              id="btn-demand-list-create"
              type="button"
              onClick={onQuickCreateClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-md flex items-center justify-center gap-1.5 transition shadow-xs whitespace-nowrap cursor-pointer font-display"
            >
              <Plus className="w-4 h-4" /> Cadastrar Demanda
            </button>
          )}

          {/* Group state switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Agrupar por:</span>
            <select
              id="groupby-select"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs py-2 px-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 transition font-medium"
            >
              <option value="NENHUM">Sem agrupamento</option>
              <option value="STATUS">Status Operacional</option>
              <option value="PRIORIDADE">Grau de Prioridade</option>
              <option value="CENTRO_CUSTO">Centro de Custo</option>
              <option value="AREA">Área Interna</option>
            </select>
          </div>
        </div>

        {/* Extended drop-down filters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="COMPRAS">Compras</option>
              <option value="REEMBOLSO">Reembolso</option>
              <option value="CONTRATOS">Contratos</option>
              <option value="INVENTARIO">Inventário</option>
              <option value="ESG">ESG Sustentabilidade</option>
              <option value="ESPORADICA">Esporádica/Pontual</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Prioridade</label>
            <select
              id="filter-priority"
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="TODOS">Todas</option>
              <option value="ALTA">Alta</option>
              <option value="MEDIA">Média</option>
              <option value="BAIXA">Baixa</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Status</label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="TODOS">Todos</option>
              <option value="PENDENTE">🔴 Pendente</option>
              <option value="EM_ANDAMENTO">🟠 Em Andamento</option>
              <option value="CONCLUIDO">🟢 Concluído</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Centro de Custo</label>
            <select
              id="filter-costcenter"
              value={selectedCostCenter}
              onChange={(e) => setSelectedCostCenter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg text-xs p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-500"
            >
              <option value="TODOS">Todos</option>
              {costCenters.map(cc => (
                <option key={cc.id} value={cc.id}>{cc.code} ({cc.name.split(' ')[0]})</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Render grouped items */}
      <div className="space-y-6">
        {Object.keys(grouped).map((groupTitle) => {
          const groupDemands = grouped[groupTitle];
          if (groupDemands.length === 0) return null;

          return (
            <div key={groupTitle} className="space-y-3">
              {groupBy !== 'NENHUM' && (
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1 flex items-center gap-2">
                  <span className="w-1.5 h-3 bg-slate-800 rounded-full inline-block" /> {groupTitle} 
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">
                    {groupDemands.length}
                  </span>
                </h3>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupDemands.map((demand) => {
                  const isSlaExpired = demand.status !== 'CONCLUIDO' && (demand.slaSpentHours > demand.slaLimitHours);
                  const isSlaWarning = demand.status !== 'CONCLUIDO' && !isSlaExpired && (demand.slaLimitHours - demand.slaSpentHours <= 6);

                  const progressPercent = Math.min((demand.slaSpentHours / demand.slaLimitHours) * 100, 100);

                  return (
                    <motion.div
                      id={`demand-card-${demand.id}`}
                      key={demand.id}
                      onClick={() => onSelectDemand(demand.id)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ 
                        y: -3, 
                        boxShadow: "0 12px 24px -10px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)",
                        borderColor: '#cbd5e1'
                      }}
                      whileTap={{ scale: 0.985 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                      className={`bg-white rounded-xl border p-5 flex flex-col justify-between cursor-pointer text-left relative overflow-hidden group ${
                        isSlaExpired 
                          ? 'border-l-4 border-l-red-500 border-slate-205' 
                          : isSlaWarning 
                            ? 'border-l-4 border-l-amber-500 border-slate-205' 
                            : 'border-slate-200'
                      }`}
                    >
                      {/* Inner item card header */}
                      <div className="space-y-2">
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono tracking-wider font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                              {demand.id}
                            </span>
                            <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-extrabold border border-blue-100">
                              {demand.type}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            {getPriorityBadge(demand.priority)}
                            {getStatusBadge(demand.status)}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition leading-snug line-clamp-1">
                            {demand.title}
                          </h4>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {demand.description}
                          </p>
                        </div>

                      </div>

                      {/* SLA Progress ticker */}
                      <div className="my-4 border-t border-slate-100 pt-3 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> SLA Executante: <strong>{demand.slaSpentHours}h / {demand.slaLimitHours}h</strong>
                          </span>
                          
                          {demand.status === 'CONCLUIDO' ? (
                            <span className="text-emerald-600 font-semibold uppercase font-mono bg-emerald-50 px-1 rounded">Finalizado</span>
                          ) : isSlaExpired ? (
                            <span className="text-red-600 font-bold uppercase font-mono flex items-center gap-1 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> SLA Estourado!
                            </span>
                          ) : isSlaWarning ? (
                            <span className="text-amber-600 font-semibold uppercase font-mono flex items-center gap-0.5">
                              ⚠️ SLA no Limite
                            </span>
                          ) : (
                            <span className="text-slate-500 font-medium">SLA regular</span>
                          )}
                        </div>
                        {demand.status !== 'CONCLUIDO' && (
                          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${progressPercent}%` }} 
                              className={`h-full rounded-full transition-all duration-300 ${
                                isSlaExpired ? 'bg-red-500' : isSlaWarning ? 'bg-amber-500' : 'bg-slate-500'
                              }`} 
                            />
                          </div>
                        )}
                      </div>

                      {/* Card Footer tags and responsibles */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100/50 pt-3 mt-auto">
                        
                        <div className="flex items-center gap-3">
                          <div className="space-y-0.5">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Responsável</span>
                            <span className="font-semibold text-slate-600 truncate max-w-[100px] block">
                              {getUserName(demand.assigneeId)}
                            </span>
                          </div>
                          
                          <div className="space-y-0.5 border-l border-slate-100 pl-3">
                            <span className="block text-[8px] font-bold text-slate-400 uppercase leading-none">Centro de Custo</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {demand.costCenterId}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 group-hover:translate-x-1.5 transition duration-200">
                          <span className="font-semibold text-xs text-slate-700">Ver detecção</span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-700" />
                        </div>

                      </div>

                    </motion.div>
                  );
                })}
              </div>

            </div>
          );
        })}

        {filteredDemands.length === 0 && (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-400 space-y-3">
            <FolderHeart className="w-12 h-12 text-slate-300 mx-auto" />
            <h5 className="text-sm font-semibold text-slate-700">Nenhuma demanda encontrada</h5>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Nenhuma atividade corresponde aos critérios de pesquisa ou filtros selecionados. Tente ajustar os filtros acima.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
