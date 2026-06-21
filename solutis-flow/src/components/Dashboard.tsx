/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Demand, CostCenter, Area, Project, DemandType, User } from '../types';
import { Clock, CheckCircle2, AlertTriangle, BarChart3, TrendingUp, Layers, Users, FolderKanban, Calendar, ArrowUpRight, ExternalLink } from 'lucide-react';
import { mockUsers } from '../mockData';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell
} from 'recharts';

// Color Palette for Cost Centers and Areas
const CC_COLORS = ['#6366f1', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

interface DashboardProps {
  demands: Demand[];
  costCenters: CostCenter[];
  areas: Area[];
  projects: Project[];
  currentUser: User;
  onSelectDemand?: (demandId: string) => void;
  onNavigate?: (tab: string, filters?: { status?: string }) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ demands, costCenters, areas, projects, currentUser, onSelectDemand, onNavigate }) => {
  // Calculated stats
  const total = demands.length;
  const pending = demands.filter(d => d.status === 'PENDENTE').length;
  const inProgress = demands.filter(d => d.status === 'EM_ANDAMENTO').length;
  const completed = demands.filter(d => d.status === 'CONCLUIDO').length;

  const overdue = demands.filter(d => {
    // Overdue is either SLA spent > SLA limit or specifically flagged
    return d.status !== 'CONCLUIDO' && d.slaSpentHours > d.slaLimitHours;
  }).length;

  const inRisk = demands.filter(d => {
    return d.status !== 'CONCLUIDO' && d.slaSpentHours <= d.slaLimitHours && (d.slaLimitHours - d.slaSpentHours <= 6);
  }).length;

  // Average completion rate
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Average execution time vs estimated
  const completedDemands = demands.filter(d => d.status === 'CONCLUIDO');
  const avgSpent = completedDemands.length > 0 
    ? (completedDemands.reduce((acc, d) => acc + d.timeSpentHours, 0) / completedDemands.length).toFixed(1)
    : '0';
  const avgEstimated = completedDemands.length > 0
    ? (completedDemands.reduce((acc, d) => acc + d.timeEstimatedHours, 0) / completedDemands.length).toFixed(1)
    : '0';

  // Cost Center distribution
  const ccData = costCenters.map(cc => {
    const ccDemands = demands.filter(d => d.costCenterId === cc.id);
    return {
      name: cc.name,
      code: cc.code,
      count: ccDemands.length,
      completed: ccDemands.filter(d => d.status === 'CONCLUIDO').length
    };
  });

  // Department distribution
  const deptData = areas.map(area => {
    const areaDemands = demands.filter(d => d.areaId === area.id);
    return {
      name: area.name,
      count: areaDemands.length,
      pending: areaDemands.filter(d => d.status === 'PENDENTE').length,
      inProgress: areaDemands.filter(d => d.status === 'EM_ANDAMENTO').length,
      completed: areaDemands.filter(d => d.status === 'CONCLUIDO').length
    };
  });

  // SLA issues checklist
  const urgentDemands = demands.filter(d => d.status !== 'CONCLUIDO' && (d.priority === 'ALTA' || d.slaSpentHours > d.slaLimitHours));

  // Dynamic Team productivity metrics calculations
  const teamMetrics = mockUsers.filter(u => u.role !== 'SOLICITANTE' && u.name !== 'Solicitador Integrado').map(user => {
    let relevantCount = 0;
    let completedCount = 0;
    
    if (user.role === 'GESTOR') {
      const relevant = demands.filter(d => d.managerId === user.id);
      relevantCount = relevant.length;
      completedCount = relevant.filter(d => d.status === 'CONCLUIDO').length;
    } else {
      const relevant = demands.filter(d => d.assigneeId === user.id);
      relevantCount = relevant.length;
      completedCount = relevant.filter(d => d.status === 'CONCLUIDO').length;
    }
    
    const activeCount = relevantCount - completedCount;
    // Round rate with soft cap at 100
    const rate = relevantCount > 0 ? Math.min(Math.round((completedCount / relevantCount) * 100), 100) : 100;
    
    return {
      id: user.id,
      name: user.name,
      firstName: user.name.split(' ')[0],
      position: user.role === 'GESTOR' ? 'Gestora Operacional' : user.role === 'ADMIN' ? 'Administrador' : 'Analista Financeiro',
      avatar: user.id === 'usr-analista' 
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' 
        : user.id === 'usr-gestor'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80',
      total: relevantCount,
      completed: completedCount,
      active: activeCount,
      rate
    };
  });

  // Process KPI metrics of Estimated vs Spent per Process type (migrated from ReportsView)
  const processGroupedMetrics = useMemo(() => {
    const types: DemandType[] = ['COMPRAS', 'REEMBOLSO', 'CONTRATOS', 'INVENTARIO', 'ESG', 'ESPORADICA'];
    return types.map(t => {
      const typeDemands = demands.filter(d => d.type === t);
      const total = typeDemands.length;
      const completed = typeDemands.filter(d => d.status === 'CONCLUIDO');
      const avgSpent = completed.length > 0 
        ? parseFloat((completed.reduce((acc, d) => acc + d.timeSpentHours, 0) / completed.length).toFixed(1))
        : 0;
      const avgEstimated = completed.length > 0
        ? parseFloat((completed.reduce((acc, d) => acc + d.timeEstimatedHours, 0) / completed.length).toFixed(1))
        : 0;

      return {
        name: t,
        volume: total,
        tempoEstimado: avgEstimated,
        tempoReal: avgSpent,
        concluidas: completed.length
      };
    }).filter(m => m.volume > 0);
  }, [demands]);

  // Status Distribution Data
  const statusData = useMemo(() => {
    const pendingCount = demands.filter(d => d.status === 'PENDENTE').length;
    const inProgressCount = demands.filter(d => d.status === 'EM_ANDAMENTO').length;
    const completedCount = demands.filter(d => d.status === 'CONCLUIDO').length;

    return [
      { name: 'Pendente', value: pendingCount, color: '#f59e0b' },     // Amber
      { name: 'Em Andamento', value: inProgressCount, color: '#3b82f6' }, // Blue
      { name: 'Concluído', value: completedCount, color: '#10b981' }     // Emerald
    ];
  }, [demands]);

  const isManagerOrAdmin = currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN';
  const firstName = currentUser.name.replace(/\s*\(.*\)\s*/g, '').split(' ')[0]; // Strip roles like (Admin) and take first name
  const greetingPhrase = useMemo(() => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Bom dia';
    if (hr < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const pendingOperational = useMemo(() => {
    return demands.filter(d => d.status !== 'CONCLUIDO' && (d.assigneeId === currentUser.id || d.solicitorId === currentUser.id)).length;
  }, [demands, currentUser]);

  const pendingValidation = useMemo(() => {
    // Activities that need validation (completed but no feedback or awaiting approval status)
    return demands.filter(d => d.status === 'CONCLUIDO' && (!d.feedback || d.approvalStatus === 'AGUARDANDO_APROVACAO')).length;
  }, [demands]);

  return (
    <div id="dashboard-main" className="space-y-6">
      
      {/* 1. On-Screen Greetings and Task Information Interaction Header */}
      <div id="dashboard-greetings-header" className="text-left py-2 border-b border-slate-200/60 pb-5 animate-fadeIn">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-sans">
          {isManagerOrAdmin ? 'VISÃO EXECUTIVA' : 'VISÃO OPERACIONAL'}
        </p>
        <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1.5 font-display">
          {greetingPhrase}, {firstName}.
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1.5 leading-relaxed">
          {isManagerOrAdmin ? (
            <span>
              Você tem <strong className="font-extrabold text-indigo-600 font-mono bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">{pendingValidation}</strong> {pendingValidation === 1 ? 'atividade pendente' : 'atividades pendentes'} de validação corporativa sob sua gestão.
            </span>
          ) : (
            <span>
              Você tem <strong className="font-extrabold text-blue-600 font-mono bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{pendingOperational}</strong> {pendingOperational === 1 ? 'atividade' : 'atividades'} em aberto vinculadas a você.
            </span>
          )}
        </p>
      </div>
      
      {/* Top executive summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atividades em Andamento</p>
            <button
              onClick={() => onNavigate?.('DEMANDS', { status: 'TODOS' })}
              className="text-3xl font-bold font-sans text-slate-900 mt-1 hover:text-blue-600 transition hover:underline cursor-pointer focus:outline-hidden block text-left"
              title="Acessar página de atividades"
            >
              {pending + inProgress}
            </button>
            <p className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-x-1.5 gap-y-0.5 items-center">
              <button
                onClick={() => onNavigate?.('DEMANDS', { status: 'PENDENTE' })}
                className="text-amber-600 hover:text-amber-800 font-semibold hover:underline cursor-pointer focus:outline-hidden"
                title="Acessar página de atividades pendentes"
              >
                {pending} pendentes
              </button>
              <span>•</span>
              <button
                onClick={() => onNavigate?.('DEMANDS', { status: 'EM_ANDAMENTO' })}
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline cursor-pointer focus:outline-hidden"
                title="Acessar página de atividades em andamento"
              >
                {inProgress} em andamento
              </button>
            </p>
          </div>
          <button 
            onClick={() => onNavigate?.('DEMANDS', { status: 'TODOS' })}
            className="bg-slate-100 p-3 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition cursor-pointer focus:outline-hidden"
            title="Acessar página de atividades"
          >
            <Layers className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taxa de Conclusão</p>
            <h3 className="text-3xl font-bold font-sans text-emerald-600 mt-1">{completionRate}%</h3>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-slate-700 font-medium">{completed} de {total}</span> finalizadas
            </p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fora do Prazo (SLA)</p>
            <h3 className={`text-3xl font-bold font-sans mt-1 ${overdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdue}</h3>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-rose-600 font-medium">{overdue} estouradas</span> • <span className="text-amber-600 font-semibold">{inRisk} em risco</span>
            </p>
          </div>
          <div className={`p-3 rounded-xl ${overdue > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Eficiência de Produção</p>
            <h3 className="text-3xl font-bold font-sans text-indigo-600 mt-1">
              {Number(avgSpent) > 0 ? Math.round((Number(avgEstimated) / Number(avgSpent)) * 100) : 100}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              tempo <span className="font-semibold text-indigo-650">{avgSpent}h real</span> vs <span className="font-semibold text-slate-600">{avgEstimated}h</span> estimado
            </p>
          </div>
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600 border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Charts & Visualizations layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1: Capacity & Volume by Department */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-base font-bold text-slate-900">Volume de Atividades por Área</h4>
              <p className="text-xs text-slate-500">Fluxo operacional segmentado por setor e status atual</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-72 w-full pt-1">
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deptData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#475569" 
                    fontSize={11} 
                    width={110}
                    tickFormatter={(value) => value.length > 18 ? `${value.substring(0, 16)}...` : value}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                    labelClassName="font-extrabold text-slate-800"
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={32} 
                    iconType="circle" 
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                  />
                  <Bar dataKey="completed" name="Concluído" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="inProgress" name="Em Andamento" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={16} />
                  <Bar dataKey="pending" name="Pendente" stackId="a" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Nenhum registro para exibir</div>
            )}
          </div>
        </div>

        {/* Column 2: Cost Center Burden allocation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">Carga por Centro de Custo</h4>
              <p className="text-xs text-slate-500">Alocação financeira e execução (Volume total)</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="h-52 w-full flex items-center justify-center relative">
            {ccData.some(c => c.count > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ccData.filter(c => c.count > 0)}
                    cx="50%"
                    cy="48%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {ccData.filter(c => c.count > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CC_COLORS[index % CC_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }}
                    formatter={(value, name) => [`${value} atividades`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Nenhuma atividade registrada</div>
            )}
            
            {/* Center total count label */}
            {ccData.some(c => c.count > 0) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
                <span className="text-2xl font-black text-slate-800 leading-none">
                  {ccData.reduce((acc, c) => acc + c.count, 0)}
                </span>
                <span className="text-[9px] text-slate-450 tracking-wider font-black mt-1">Total CC</span>
              </div>
            )}
          </div>

          {/* Dynamic Interactive Legend mapping below */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 max-h-[140px] overflow-y-auto custom-scrollbar">
            {ccData.map((cc, idx) => {
              if (cc.count === 0) return null;
              const color = CC_COLORS[idx % CC_COLORS.length];
              return (
                <div key={idx} className="flex items-center gap-1.5 p-1.5 hover:bg-slate-50 rounded-lg transition-all text-left">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 truncate mr-1" title={cc.name}>{cc.name}</span>
                      <span className="font-extrabold text-slate-900 font-mono shrink-0">{cc.count}</span>
                    </div>
                    <span className="block text-[8px] text-slate-400 uppercase font-mono tracking-wider font-semibold">
                      {cc.code} • {cc.completed} concluídas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Gráficos de Performance e Distribuição de Processos (vindos da Grade de Demandas) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">Distribuição por Status</h4>
              <p className="text-xs text-slate-500">Divisão das atividades atuais e concluídas</p>
            </div>
            <Clock className="w-5 h-5 text-indigo-500" />
          </div>
          
          <div className="h-64 pt-2 flex flex-col justify-between">
            <div className="h-44 w-full">
              {statusData.some(s => s.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.filter(s => s.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      nameKey="name"
                    >
                      {statusData.filter(s => s.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-300">Sem dados para exibir</div>
              )}
            </div>

            {/* Legend for individual statuses */}
            <div className="flex justify-around items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
              {statusData.map((status, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                  <span className="text-[10px] font-semibold text-slate-550 font-sans">{status.name}:</span>
                  <span className="text-[10px] font-extrabold font-mono text-slate-900">{status.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">Performance de Tempo: Estimado vs Real</h4>
              <p className="text-xs text-slate-500">Média de esforço real executado vs planejado por tipo de processo</p>
            </div>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </div>
          
          <div className="h-64 pt-2">
            {processGroupedMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processGroupedMetrics} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                  <Bar dataKey="tempoEstimado" name="Esforço Estimado (h)" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tempoReal" name="Tempo Real Gasto (h)" fill="#6366f1" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-300">Sem dados conclusivos para exibir</div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 text-left">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-bold text-slate-900">Distribuição Operacional de Processos</h4>
              <p className="text-xs text-slate-500">Volume total de chamados ativos por categoria de operação</p>
            </div>
            <BarChart3 className="w-5 h-5 text-indigo-500" />
          </div>
          
          <div className="h-64 pt-2">
            {processGroupedMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processGroupedMetrics}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="volume"
                    nameKey="name"
                  >
                    {processGroupedMetrics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-300">Sem dados para exibir</div>
            )}
          </div>
        </div>
      </div>

      {/* Seção de Projetos em Andamento e Prazos */}
      <div id="projects-dashboard-section" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" /> Acompanhamento de Projetos em Andamento
            </h4>
            <p className="text-xs text-slate-500">Monitoramento integrado de prazos executivos, entregas e eficiência de atividades vinculadas</p>
          </div>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 py-1 px-3 rounded-full border border-indigo-100 font-mono">
            {projects.filter(p => p.status === 'EM_ANDAMENTO').length} Em Execução
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => {
            const pDemands = demands.filter(d => d.projectId === p.id);
            const totalCount = pDemands.length;
            const completedCount = pDemands.filter(d => d.status === 'CONCLUIDO').length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            // Date calculations
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Handle due date format (YYYY-MM-DD) safely
            const [year, month, day] = p.dueDate.split('-').map(Number);
            const projectDueDate = new Date(year, month - 1, day);
            projectDueDate.setHours(23, 59, 59, 999);
            const timeDiff = projectDueDate.getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

            let deadlineLabel = '';
            let deadlineBadgeClass = '';

            if (p.status === 'CONCLUIDO') {
              deadlineLabel = 'Concluído';
              deadlineBadgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
            } else if (daysLeft < 0) {
              deadlineLabel = `Atrasado há ${Math.abs(daysLeft)} dia(s)`;
              deadlineBadgeClass = 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse';
            } else if (daysLeft === 0) {
              deadlineLabel = 'Vence hoje!';
              deadlineBadgeClass = 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
            } else if (daysLeft <= 14) {
              deadlineLabel = `Alerta: restam ${daysLeft} dias`;
              deadlineBadgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
            } else {
              deadlineLabel = `No prazo: restam ${daysLeft} dias`;
              deadlineBadgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
            }

            // Find area name
            const areaName = areas.find(a => a.id === p.areaId)?.name || 'Geral';

            return (
              <div 
                key={p.id} 
                onClick={() => {
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.set('projectId', p.id);
                  window.history.pushState({}, '', newUrl);
                  onNavigate('PROJECTS');
                }}
                className="p-5 rounded-xl border border-slate-300 hover:border-indigo-600 bg-white hover:bg-slate-50 transition-all duration-300 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md cursor-pointer group text-left relative overflow-hidden"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 py-0.5 px-2 rounded-md uppercase tracking-wider">
                      {areaName}
                    </span>
                    <span className={`text-[10px] font-extrabold py-0.5 px-2 rounded-full border uppercase tracking-wide ${deadlineBadgeClass}`}>
                      {deadlineLabel}
                    </span>
                  </div>

                  <h5 className="text-sm font-extrabold text-slate-950 mt-3 group-hover:text-indigo-700 transition-colors flex items-center justify-between">
                    <span className="truncate">{p.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 ml-1.5" />
                  </h5>
                  <p className="text-xs text-slate-650 mt-1.5 line-clamp-2 leading-relaxed h-[36px]">
                    {p.description}
                  </p>
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Prazo final:</span>
                    <span className="font-extrabold text-slate-900 flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" /> {p.dueDate.split('-').reverse().join('/')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Atividades vinculadas:</span>
                    <span className="font-extrabold text-slate-900">
                      {completedCount}/{totalCount} ({progressPercent}%)
                    </span>
                  </div>

                  {/* Elegant dynamic progress bar */}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden border border-slate-300/30">
                      <div 
                        style={{ width: `${progressPercent}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${
                          progressPercent === 100 
                            ? 'bg-emerald-600' 
                            : p.status === 'ATRASADO' || daysLeft < 0 
                            ? 'bg-rose-600' 
                            : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 italic text-right group-hover:text-indigo-600 transition-colors pt-1">
                    Clique para abrir a modal de detalhes (Jira) →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SLA Risk Hotlist / Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: SLA Warning alert logs */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Alerta de SLAs & Riscos de Operação
              </h4>
              <p className="text-xs text-slate-500">Demandas críticas pendentes ou fora do limite legal de SLA</p>
            </div>
            <span className="text-[10px] font-mono bg-rose-50 text-rose-700 py-0.5 px-2 rounded-full border border-rose-200">
              {urgentDemands.length} Críticas
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
            {urgentDemands.length > 0 ? (
              urgentDemands.map((demand) => {
                const isOverdue = demand.slaSpentHours > demand.slaLimitHours;
                const hoursLeft = demand.slaLimitHours - demand.slaSpentHours;

                return (
                  <div 
                    key={demand.id} 
                    onClick={() => onSelectDemand?.(demand.id)}
                    className="py-3 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500">{demand.id}</span>
                        <span className="text-xs font-semibold text-slate-900 line-clamp-1">{demand.title}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] text-slate-400">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium text-[10px]">
                          {demand.type}
                        </span>
                        <span>Prioridade: <strong className="text-slate-600 font-semibold">{demand.priority}</strong></span>
                        <span>Centro de Custo: <strong className="text-slate-600 font-mono text-[10px]">{demand.costCenterId}</strong></span>
                      </div>
                    </div>

                    <div className="text-right">
                      {isOverdue ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                          Atrasado por {demand.slaSpentHours - demand.slaLimitHours}h
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                          Restam {hoursLeft}h (SLA)
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                🎉 Nenhum alerta crítico de SLA no momento. Parabéns, equipe qualificada!
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Operator Workloads / Productivity scorecard & Recharts chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-505" /> Produtividade e Equipe
              </h4>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 py-0.5 px-2.5 rounded-full border border-indigo-200 uppercase tracking-wider font-extrabold">
                Performance
              </span>
            </div>

            {/* Premium Grouped Bar Chart of team members' active/completed demands */}
            <div className="h-44 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamMetrics} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="firstName" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickCount={4} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '10px', borderColor: '#f1f5f9' }}
                    labelClassName="font-extrabold text-slate-800"
                  />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '9px', paddingTop: '4px' }} />
                  <Bar dataKey="completed" name="Concluídas" fill="#10b981" radius={[2, 2, 0, 0]} barSize={10} />
                  <Bar dataKey="active" name="Ativas" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={10} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Dynamic performance list with micro-bars */}
            <div className="space-y-3.5">
              {teamMetrics.map((op) => (
                <div key={op.id} className="flex flex-col border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={op.avatar} alt={op.name} className="w-7 h-7 rounded-full border border-slate-100 object-cover shrink-0" />
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{op.name}</h5>
                        <p className="text-[9.5px] text-slate-400 font-medium leading-none mt-1">{op.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11.5px] font-extrabold text-indigo-600 font-mono">{op.rate}%</span>
                      <p className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">Conclusão</p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${op.rate}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${
                          op.rate >= 75 ? 'bg-emerald-500' : op.rate >= 40 ? 'bg-indigo-500' : 'bg-slate-400'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 min-w-[28px] text-right font-mono leading-none">
                      {op.completed}/{op.total} d.
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-[11px] text-slate-500 leading-relaxed border border-slate-200/50">
            <strong>💡 Insight de produtividade:</strong> Atividades de centro de custo <strong>CC-102 (Logística)</strong> exibem o menor lead-time médio (8h). Focar revisões de automações no <strong>CC-103</strong> que possui 1 gargalo de reembolso em aprovação.
          </div>
        </div>

      </div>

      {/* Elegant Application Footer */}
      <footer className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-[10px]">F</div>
          <span className="font-bold text-slate-800 font-display transition-colors duration-200 hover:text-indigo-600">Flowta Governance</span>
          <span className="text-slate-300">|</span>
          <span>© 2026 Flowta Inc. Todos os direitos reservados.</span>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-600">Sistemas Operacionais Ativos</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex gap-4">
            <button className="hover:text-indigo-600 transition-colors font-medium cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">Políticas de SLA</button>
            <button className="hover:text-indigo-600 transition-colors font-medium cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">Termos de Uso</button>
            <span className="text-slate-400 font-mono">v2.4.0</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
