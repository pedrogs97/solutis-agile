/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Demand, Project, RecurringTask, CostCenter, Area, DemandType, DemandStatus, User } from '../types';
import { 
  FileText, Download, Calendar, Filter, Search, CheckSquare, 
  AlertTriangle, CheckCircle2, TrendingUp, HelpCircle, RefreshCw, BarChart2,
  Printer, Layers, CheckCircle, Clock, PieChart as PieIcon, DollarSign, ArrowRight,
  Users, UserCheck, Briefcase, Lightbulb
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface ReportsViewProps {
  demands: Demand[];
  projects: Project[];
  recurringTasks: RecurringTask[];
  costCenters: CostCenter[];
  areas: Area[];
  users: User[];
  ideas?: any[];
}

type ReportTab = 'DEMANDS' | 'PROJECTS' | 'RECURRING' | 'SLA_CUSTOS' | 'LABOR_COSTS' | 'PRODUCTIVITY';

export const ReportsView: React.FC<ReportsViewProps> = ({
  demands,
  projects,
  recurringTasks,
  costCenters,
  areas,
  users,
  ideas = []
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('DEMANDS');
  const [selectedLaborAreaId, setSelectedLaborAreaId] = useState<string | null>(null);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCostCenter, setSelectedCostCenter] = useState<string>('ALL');
  const [selectedArea, setSelectedArea] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCostCenter('ALL');
    setSelectedArea('ALL');
    setSelectedStatus('ALL');
    setSelectedType('ALL');
  };

  // ----------------------------------------------------
  // FILTERING LOGIC
  // ----------------------------------------------------
  
  // Filered Demands
  const filteredDemands = useMemo(() => {
    return demands.filter(d => {
      const matchSearch = searchQuery ? (
        d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;

      const matchCC = selectedCostCenter === 'ALL' ? true : d.costCenterId === selectedCostCenter;
      const matchArea = selectedArea === 'ALL' ? true : d.areaId === selectedArea;
      const matchStatus = selectedStatus === 'ALL' ? true : d.status === selectedStatus;
      const matchType = selectedType === 'ALL' ? true : d.type === selectedType;

      return matchSearch && matchCC && matchArea && matchStatus && matchType;
    });
  }, [demands, searchQuery, selectedCostCenter, selectedArea, selectedStatus, selectedType]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = searchQuery ? (
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;

      const matchArea = selectedArea === 'ALL' ? true : p.areaId === selectedArea;
      const matchStatus = selectedStatus === 'ALL' ? true : p.status === selectedStatus;

      return matchSearch && matchArea && matchStatus;
    });
  }, [projects, searchQuery, selectedArea, selectedStatus]);

  // Filtered Recurring Tasks
  const filteredRecurring = useMemo(() => {
    return recurringTasks.filter(r => {
      const matchSearch = searchQuery ? (
        r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      ) : true;

      const matchCC = selectedCostCenter === 'ALL' ? true : r.costCenterId === selectedCostCenter;
      const matchArea = selectedArea === 'ALL' ? true : r.areaId === selectedArea;

      return matchSearch && matchCC && matchArea;
    });
  }, [recurringTasks, searchQuery, selectedCostCenter, selectedArea]);


  // ----------------------------------------------------
  // FILE GENERATOR LOGIC (Real downloads of CSV/JSON files)
  // ----------------------------------------------------
  
  // Utility to trigger physical download
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Convert Demand lists to Excel (XLSX)
  const handleExportDemandsXLSX = () => {
    const data = filteredDemands.map(d => {
      const areaName = areas.find(a => a.id === d.areaId)?.name || d.areaId;
      const ccName = costCenters.find(cc => cc.id === d.costCenterId)?.name || d.costCenterId;
      return {
        'Código ID': d.id,
        'Tipo de Processo': d.type,
        'Título': d.title,
        'Descrição': d.description,
        'Status': d.status,
        'Prioridade': d.priority,
        'Aprovação': d.approvalStatus === 'NENHUMA' ? 'Não Exigida' : d.approvalStatus.replace('_', ' '),
        'Centro de Custo': ccName,
        'Área': areaName,
        'Limite SLA (h)': d.slaLimitHours,
        'Consumido SLA (h)': d.slaSpentHours,
        'Horas Estimadas': d.timeEstimatedHours,
        'Horas Gastas': d.timeSpentHours,
        'Vencimento': d.dueDate.split('-').reverse().join('/')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Demandas');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowta_demandas_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Demands JSON
  const handleExportDemandsJSON = () => {
    const jsonString = JSON.stringify(filteredDemands, null, 2);
    downloadFile(jsonString, `flowta_demandas_${Date.now()}.json`, 'application/json');
  };

  // Convert Projects lists to Excel (XLSX)
  const handleExportProjectsXLSX = () => {
    const data = filteredProjects.map(p => {
      const areaName = areas.find(a => a.id === p.areaId)?.name || p.areaId;
      const projectDemands = demands.filter(d => d.projectId === p.id);
      const completedDemands = projectDemands.filter(d => d.status === 'CONCLUIDO');
      const progress = projectDemands.length > 0 
        ? Math.round((completedDemands.length / projectDemands.length) * 100) 
        : 0;
      return {
        'Código ID': p.id,
        'Nome do Projeto': p.name,
        'Descrição': p.description,
        'Status': p.status,
        'Prazo Final': p.dueDate.split('-').reverse().join('/'),
        'Área Responsável': areaName,
        'Quantidade Atividades': projectDemands.length,
        'Concluídas': completedDemands.length,
        'Progresso Geral %': progress
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Projetos');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowta_projetos_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Projects JSON
  const handleExportProjectsJSON = () => {
    const jsonString = JSON.stringify(filteredProjects, null, 2);
    downloadFile(jsonString, `flowta_projetos_${Date.now()}.json`, 'application/json');
  };

  // Convert Recurring to Excel (XLSX)
  const handleExportRecurringXLSX = () => {
    const data = filteredRecurring.map(r => {
      const areaName = areas.find(a => a.id === r.areaId)?.name || r.areaId;
      const ccName = costCenters.find(cc => cc.id === r.costCenterId)?.name || r.costCenterId;
      return {
        'Código ID': r.id,
        'Título': r.title,
        'Frequência': r.frequency,
        'Centro de Custo': ccName,
        'Área': areaName,
        'Última Geração': r.lastGenerated || 'Não Registrado',
        'Próxima Execução': r.nextGeneration || 'Agendável',
        'Checklist': r.checklist.join(' | ')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rotinas Periódicas');
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowta_rotinas_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  // ----------------------------------------------------
  // COMPUTED REPORT STATS & VIOLATIONS (For SLA & Cost Audit)
  // ----------------------------------------------------

  // SLA Violations: list of non-concluded demands past SLA OR finished with SLA violations
  const slaViolations = useMemo(() => {
    return demands.filter(d => d.slaSpentHours > d.slaLimitHours);
  }, [demands]);

  // Cost Violations: e.g. Reembolsos with rating=1 and boundaryValueExceeded (limit is R$ 80)
  const budgetViolations = useMemo(() => {
    return demands.filter(d => {
      return d.type === 'REEMBOLSO' && (
        (d.feedback && (d.feedback as any).boundaryValueExceeded) ||
        (d.description.toLowerCase().includes('reembolso') && d.timeSpentHours > d.timeEstimatedHours)
      );
    });
  }, [demands]);

  // Process KPI metrics of Estimated vs Spent per Process type
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
        concluídas: completed.length
      };
    }).filter(m => m.volume > 0);
  }, [demands]);

  // Moeda nacional formatador
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const getHourlyRate = (userId: string | undefined): number => {
    if (!userId) return 50; // default R$ 50
    const u = users.find(usr => usr.id === userId);
    if (!u) return 50;
    switch (u.role) {
      case 'ADMIN': return 125;
      case 'GESTOR': return 95;
      case 'ANALISTA': return 65;
      case 'APROVADOR': return 150;
      case 'SOLICITANTE': return 45;
      case 'OBSERVADOR': return 50;
      default: return 50;
    }
  };

  const laborCostsByDepartment = useMemo(() => {
    return areas.map(area => {
      const deptDemands = demands.filter(d => d.areaId === area.id);
      let totEstimatedHours = 0;
      let totSpentHours = 0;
      let totEstimatedCost = 0;
      let totSpentCost = 0;

      const contributorsMap: Record<string, { hoursSpent: number; estimatedHours: number; cost: number; name: string; role: string; avatar: string }> = {};

      deptDemands.forEach(d => {
        const rate = getHourlyRate(d.assigneeId);
        totEstimatedHours += d.timeEstimatedHours;
        totSpentHours += d.timeSpentHours;
        totEstimatedCost += d.timeEstimatedHours * rate;
        totSpentCost += d.timeSpentHours * rate;

        const assId = d.assigneeId || 'unassigned';
        const userObj = users.find(u => u.id === d.assigneeId) || {
          name: 'Sem responsável',
          role: 'N/A',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
        };

        if (!contributorsMap[assId]) {
          contributorsMap[assId] = {
            hoursSpent: 0,
            estimatedHours: 0,
            cost: 0,
            name: userObj.name,
            role: userObj.role,
            avatar: userObj.avatar
          };
        }
        contributorsMap[assId].hoursSpent += d.timeSpentHours;
        contributorsMap[assId].estimatedHours += d.timeEstimatedHours;
        contributorsMap[assId].cost += d.timeSpentHours * rate;
      });

      const contributors = Object.values(contributorsMap).filter(c => c.hoursSpent > 0 || c.estimatedHours > 0);
      const avgHourlyRate = totSpentHours > 0 ? Math.round(totSpentCost / totSpentHours) : 0;

      return {
        id: area.id,
        name: area.name,
        description: area.description,
        totalDemands: deptDemands.length,
        completedDemands: deptDemands.filter(d => d.status === 'CONCLUIDO').length,
        totalEstimatedHours: totEstimatedHours,
        totalSpentHours: totSpentHours,
        totalEstimatedCost: Math.round(totEstimatedCost),
        totalSpentCost: Math.round(totSpentCost),
        variance: Math.round(totSpentCost - totEstimatedCost),
        avgHourlyRate: avgHourlyRate,
        contributors: contributors,
        demands: deptDemands
      };
    });
  }, [demands, areas, users]);

  const handleExportLaborCostsXLSX = () => {
    const data = laborCostsByDepartment.map(dept => {
      return {
        'Departamento/Área': dept.name,
        'Descrição': dept.description,
        'Total Demandas': dept.totalDemands,
        'Demandas Concluídas': dept.completedDemands,
        'Total Horas Estimadas': dept.totalEstimatedHours,
        'Total Horas Gastas Real': dept.totalSpentHours,
        'Custo Planejado Mão de Obra (R$)': dept.totalEstimatedCost,
        'Custo Real Mão de Obra (R$)': dept.totalSpentCost,
        'Desvio de Custo (R$)': dept.variance,
        'Taxa Horária Média (R$/h)': dept.avgHourlyRate,
        'Quantidade Analistas Ativos': dept.contributors.length
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumo de Custos por Área');
    
    // Add sheet with detailed contributors breakdown
    const contribsData: any[] = [];
    laborCostsByDepartment.forEach(dept => {
      dept.contributors.forEach(c => {
        contribsData.push({
          'Departamento/Área': dept.name,
          'Colaborador': c.name,
          'Cargo/Papel': c.role,
          'Horas Gastas (h)': c.hoursSpent,
          'Custo Real Mão de Obra (R$)': c.cost
        });
      });
    });

    if (contribsData.length > 0) {
      const worksht2 = XLSX.utils.json_to_sheet(contribsData);
      XLSX.utils.book_append_sheet(workbook, worksht2, 'Detalhamento Colaboradores');
    }

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `flowta_custos_mao_obra_${Date.now()}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="reports-center-wrapper" className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Relatórios e Auditorias Fiscais
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Geração de arquivos reais (CSV, JSON, Relatórios de Texto), análise de desvios operacionais e previsualização em grade executiva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('DEMANDS')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'DEMANDS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Grade de Demandas
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'PROJECTS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Status Projetos
          </button>
          <button
            onClick={() => setActiveTab('RECURRING')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'RECURRING' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Prazos de Rotinas
          </button>
          <button
            onClick={() => setActiveTab('SLA_CUSTOS')}
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'SLA_CUSTOS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            Auditoria & Alçadas
          </button>
          <button
            onClick={() => setActiveTab('LABOR_COSTS')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'LABOR_COSTS' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Custos de Mão de Obra
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTIVITY')}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              activeTab === 'PRODUCTIVITY' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-yellow-500" /> Boletas & Avaliação
          </button>
        </div>
      </div>

      {/* 2. Unified Filter Ribbon (Only visible when not on print/audit/labor/productivity mode) */}
      {activeTab !== 'SLA_CUSTOS' && activeTab !== 'LABOR_COSTS' && activeTab !== 'PRODUCTIVITY' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-2 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400" /> Parâmetros de Filtragem e Exportação
            </span>
            <button
              onClick={handleResetFilters}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3" /> Limpar Filtros
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Id, termo ou título..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-slate-50/50"
              />
            </div>

            {/* Cost Centers */}
            <div>
              <select
                value={selectedCostCenter}
                onChange={(e) => setSelectedCostCenter(e.target.value)}
                className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todos C. Custos</option>
                {costCenters.map(cc => (
                  <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                ))}
              </select>
            </div>

            {/* Areas */}
            <div>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todas as Áreas</option>
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Status (Different logic based on entity) */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">Todos os Statues</option>
                {activeTab === 'DEMANDS' ? (
                  <>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="CONCLUIDO">CONCLUÍDO</option>
                  </>
                ) : (
                  <>
                    <option value="PLANEJADO">PLANEJADO</option>
                    <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                    <option value="CONCLUIDO">CONCLUÍDO</option>
                    <option value="ATRASADO">ATRASADO</option>
                  </>
                )}
              </select>
            </div>

            {/* Demand Types */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full text-xs py-2 px-2.5 border border-slate-200 rounded-lg bg-slate-50/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                disabled={activeTab !== 'DEMANDS'}
              >
                <option value="ALL">Todos os Processos</option>
                <option value="COMPRAS">COMPRAS</option>
                <option value="REEMBOLSO">REEMBOLSO</option>
                <option value="CONTRATOS">CONTRATOS</option>
                <option value="INVENTARIO">INVENTÁRIO</option>
                <option value="ESG">ESG</option>
                <option value="ESPORADICA">ESPORÁDICA</option>
              </select>
            </div>
          </div>
        </div>
      )}


      {/* 3. Main Views Panels Render */}

      {/* TAB A: DEMANDS PREVIEW & GENERATE */}
      {activeTab === 'DEMANDS' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Visualização em Planilha de Auditoria ({filteredDemands.length} registros)</h3>
                <p className="text-[11px] text-slate-400 mt-1">Grade operacional refinada pelos filtros selecionados. Clique para gerar arquivos de dados.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportDemandsXLSX}
                  disabled={filteredDemands.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Planilha Excel (.xlsx)
                </button>
                <button
                  onClick={handleExportDemandsJSON}
                  disabled={filteredDemands.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Exportar Dados JSON
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Processo</th>
                    <th className="py-3 px-4">Título do Registro</th>
                    <th className="py-3 px-4">Centro Custo</th>
                    <th className="py-3 px-4">SLA Tempo</th>
                    <th className="py-3 px-4">Esforço Real</th>
                    <th className="py-3 px-4">Aprovação</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                  {filteredDemands.length > 0 ? (
                    filteredDemands.map((d) => {
                      const isSlaOut = d.status !== 'CONCLUIDO' && d.slaSpentHours > d.slaLimitHours;
                      const hasNegativeFeedback = d.feedback?.isNegative;
                      const ccCode = costCenters.find(cc => cc.id === d.costCenterId)?.code || d.costCenterId;
                      
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-500">{d.id}</td>
                          <td className="py-3 px-4">
                            <span className="bg-slate-100 text-slate-600 font-semibold py-0.5 px-2 rounded-md font-mono text-[10px]">
                              {d.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-800 leading-snug">{d.title}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{d.description}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-600">{ccCode}</td>
                          <td className="py-3 px-4">
                            <span className={`font-mono font-bold p-1 rounded ${
                              isSlaOut ? 'text-red-650 bg-red-50' : 'text-slate-600'
                            }`}>
                              {d.slaSpentHours}h de {d.slaLimitHours}h
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {d.timeSpentHours > 0 ? (
                              <span className={d.timeSpentHours > d.timeEstimatedHours ? 'text-amber-600 font-bold' : 'text-slate-600'}>
                                {d.timeSpentHours}h / Est: {d.timeEstimatedHours}h
                              </span>
                            ) : (
                              <span className="text-slate-400">0h / Est: {d.timeEstimatedHours}h</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-bold text-[10px] uppercase py-0.5 px-2 rounded-full border ${
                              d.approvalStatus === 'APROVADO' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                              d.approvalStatus === 'REJEITADO' ? 'bg-rose-55 text-rose-700 border-rose-100' :
                              d.approvalStatus === 'AGUARDANDO_APROVACAO' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                              {d.approvalStatus === 'NENHUMA' ? 'Não Exigida' : d.approvalStatus.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full ${
                              d.status === 'CONCLUIDO' ? 'bg-emerald-100 text-emerald-800' :
                              d.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-800' :
                              'bg-slate-100 text-slate-500'
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                        Nenhum registro encontrado para os filtros selecionados. Refine os parâmetros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Quick KPI recap row */}
            <div className="bg-slate-50 p-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="text-left">
                <span className="text-slate-400 font-medium uppercase font-mono text-[9px] block">Média Esforço Realizado</span>
                <strong className="text-slate-800 text-sm font-bold font-mono">
                  {(filteredDemands.filter(d=>d.status==='CONCLUIDO').reduce((acc,d)=>acc+d.timeSpentHours,0) / 
                   (filteredDemands.filter(d=>d.status==='CONCLUIDO').length || 1)).toFixed(1)} horas/demanda
                </strong>
              </div>
              <div className="text-left">
                <span className="text-slate-400 font-medium uppercase font-mono text-[9px] block">SLA Overdue Rate</span>
                <strong className="text-rose-650 text-sm font-bold font-mono">
                  {Math.round((filteredDemands.filter(d=>d.status!=='CONCLUIDO'&&d.slaSpentHours>d.slaLimitHours).length / (filteredDemands.length || 1))*100)}% das filtradas
                </strong>
              </div>
              <div className="text-left">
                <span className="text-slate-400 font-medium uppercase font-mono text-[9px] block">Aprovações Concluídas</span>
                <strong className="text-emerald-700 text-sm font-bold font-mono">
                  {filteredDemands.filter(d=>d.approvalStatus==='APROVADO').length} de {filteredDemands.filter(d=>d.approvalStatus!=='NENHUMA').length} solicitadas
                </strong>
              </div>
              <div className="text-left">
                <span className="text-slate-400 font-medium uppercase font-mono text-[9px] block">Registros Filtrados</span>
                <strong className="text-slate-800 text-sm font-bold font-mono">
                  {filteredDemands.length} de {demands.length} cadastrados
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: PROJECTS PREVIEW */}
      {activeTab === 'PROJECTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Projetos Planejados e em Andamento ({filteredProjects.length} registros)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Status de prazos e eficiência de cronograma corporativo e desvios de datas.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportProjectsXLSX}
                disabled={filteredProjects.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Planilha Projetos Excel (.xlsx)
              </button>
              <button
                onClick={handleExportProjectsJSON}
                disabled={filteredProjects.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Exportar JSON
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Código ID</th>
                  <th className="py-3 px-4">Área Responsável</th>
                  <th className="py-3 px-4">Nome do Projeto</th>
                  <th className="py-3 px-4">Descrição do Escopo</th>
                  <th className="py-3 px-4">Data Planejada</th>
                  <th className="py-3 px-4">Progresso Geral</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => {
                    const projectDemands = demands.filter(d => d.projectId === p.id);
                    const completedDemands = projectDemands.filter(d => d.status === 'CONCLUIDO');
                    const progress = projectDemands.length > 0 
                      ? Math.round((completedDemands.length / projectDemands.length) * 100) 
                      : 0;
                    const areaName = areas.find(a => a.id === p.areaId)?.name || p.areaId;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{p.id}</td>
                        <td className="py-3 px-4 font-medium">{areaName}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{p.name}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{p.description}</td>
                        <td className="py-3 px-4 font-mono font-bold">{p.dueDate.split('-').reverse().join('/')}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                              <div style={{ width: `${progress}%` }} className="h-full bg-indigo-600 rounded-full" />
                            </div>
                            <span className="font-bold font-mono text-[10px] text-slate-600">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-bold text-[10px] uppercase py-0.5 px-2 rounded-full border ${
                            p.status === 'PLANEJADO' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                            p.status === 'EM_ANDAMENTO' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            p.status === 'CONCLUIDO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      Nenhum projeto se adequa aos filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB C: RECURRING LIST PREVIEW */}
      {activeTab === 'RECURRING' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Acordos de Rotinas Operacionais Periódicas ({filteredRecurring.length} rotinas)</h3>
              <p className="text-[11px] text-slate-400 mt-1">Inspeções, fechamento de tributos e controles preventivos para governança contínua.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportRecurringXLSX}
                disabled={filteredRecurring.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold text-xs py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Agenda Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Procedimento / Título</th>
                  <th className="py-3 px-4">Frequência</th>
                  <th className="py-3 px-4">Centro Custo Coberto</th>
                  <th className="py-3 px-4">Última Geração</th>
                  <th className="py-3 px-4">Próxima Execução</th>
                  <th className="py-3 px-4">Itens Obrigatórios de Checklist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs text-slate-700">
                {filteredRecurring.length > 0 ? (
                  filteredRecurring.map((r) => {
                    const ccCode = costCenters.find(cc => cc.id === r.costCenterId)?.code || r.costCenterId;
                    
                    return (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">{r.id}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{r.title}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-[10px] text-indigo-750 bg-indigo-50 border border-indigo-150 py-0.5 px-2 rounded-full">
                            {r.frequency}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-slate-600">{ccCode}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{r.lastGenerated || 'Não Registrado'}</td>
                        <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{r.nextGeneration || 'Agendável'}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {r.checklist.map((item, index) => (
                              <div key={index} className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                                <CheckSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                      Nenhuma rotina preventiva com as configurações especificadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: AUDIT & ALÇADAS VIOLATIONS */}
      {activeTab === 'SLA_CUSTOS' && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* SLA Violations Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-805 flex items-center gap-2">
                    <AlertTriangle className="text-red-500 w-4 h-4 shrink-0" /> Auditoria de SLAs Estourados
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Atividades que excederam o limite de SLA fixado na governança.</p>
                </div>
                <span className="bg-red-50 text-red-700 text-xs px-2.5 py-0.5 rounded-full border border-red-150 font-bold">
                  {slaViolations.length} Casos
                </span>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                {slaViolations.length > 0 ? (
                  slaViolations.map((d) => {
                    const hoursOver = d.slaSpentHours - d.slaLimitHours;
                    return (
                      <div key={d.id} className="pt-3.5 first:pt-0 flex items-start justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-slate-500">{d.id}</span>
                            <span className="font-bold text-slate-800 line-clamp-1">{d.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-1">
                            Processo: <strong className="text-slate-600">{d.type}</strong> • 
                            Status Atual: <strong className="text-indigo-600">{d.status}</strong>
                          </p>
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="bg-slate-100 font-semibold p-1 rounded font-mono text-[10px] text-slate-500">
                              Limite: {d.slaLimitHours}h
                            </span>
                            <span className="bg-red-50 text-red-700 font-bold p-1 rounded font-mono text-[10px] border border-red-100">
                              Consumido: {d.slaSpentHours}h
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] text-red-650 font-black bg-red-100/50 py-1 px-2.5 rounded-lg border border-red-200">
                            +{hoursOver}h estourado
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    🎉 Nenhuma violação de SLA registrada no ciclo operacional vigente!
                  </div>
                )}
              </div>
            </div>

            {/* Budget/Alçada / Limit Violations Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-805 flex items-center gap-2">
                    <DollarSign className="text-rose-500 w-4 h-4 shrink-0" /> Desvios de Gastos e Políticas
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">Reembolsos e compras que excederam limites normativos de alçada.</p>
                </div>
                <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-0.5 rounded-full border border-rose-150 font-bold">
                  {budgetViolations.length} Alertas
                </span>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 max-h-[350px] overflow-y-auto pr-1">
                {budgetViolations.length > 0 ? (
                  budgetViolations.map((d) => {
                    return (
                      <div key={d.id} className="pt-3.5 first:pt-0 flex flex-col justify-between text-xs gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-extrabold text-slate-500">{d.id}</span>
                              <span className="font-bold text-slate-800">{d.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                              {d.description}
                            </p>
                          </div>
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 py-1 px-2.5 rounded-lg text-[10px] font-bold">
                            Grave
                          </span>
                        </div>

                        {d.feedback && (
                          <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100 mt-1 text-[11px] text-rose-900 leading-relaxed">
                            <strong>🚫 Glosa / Contestação do Gestor:</strong> {d.feedback.comment}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-slate-400">
                    🎉 Nenhuma violação financeira listada no período. Controles fiscais saudáveis.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Audit Rule Summary Info Block */}
          <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="space-y-1 text-xs text-indigo-900 leading-relaxed">
              <strong className="text-sm font-bold">Resumo Oficial de Controles Governamentais</strong>
              <p>
                De acordo com o POP oficial de <strong>Compras</strong> e <strong>Reembolso de Despesas</strong>:
              </p>
              <ul className="list-disc pl-4 space-y-1 font-medium mt-1">
                <li>Todo reembolso exige cupons originais anexos e limite de R$ 80,00 por almoço de relacionamento corporativo.</li>
                <li>Compras que ultrapassem R$ 10.000,00 são submetidas de forma mandatória à Diretoria Executiva na esteira de automação.</li>
                <li>A transição de status para Concluído exige obrigatoriamente imagem comprovante de evidecia de entrega física.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB E: LABOR COSTS PER DEPARTMENT */}
      {activeTab === 'LABOR_COSTS' && (
        <div className="space-y-6 text-left">
          
          {/* Header & Excel Download */}
          <div className="bg-slate-900 text-white p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                Gestão Financeira Escalonada
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Relatório de Custos de Mão de Obra por Departamento
              </h3>
              <p className="text-xs text-slate-300">
                Alocação de horas gastas em atividades auditadas pelos especialistas e traduzidas em custos operacionais reais conforme tabela de alçada salarial.
              </p>
            </div>

            <button
              id="btn-export-labor"
              onClick={handleExportLaborCostsXLSX}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Planilha de Custos (.xlsx)
            </button>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Custo Total Real Incorrido</span>
              <span className="text-2xl font-black text-slate-900 block">
                {formatBRL(laborCostsByDepartment.reduce((acc, d) => acc + d.totalSpentCost, 0))}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Baseado em {laborCostsByDepartment.reduce((acc, d) => acc + d.totalSpentHours, 0)}h de esforço operacional
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Custo de Esforço Planejado</span>
              <span className="text-2xl font-black text-slate-900 block">
                {formatBRL(laborCostsByDepartment.reduce((acc, d) => acc + d.totalEstimatedCost, 0))}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Baseado em {laborCostsByDepartment.reduce((acc, d) => acc + d.totalEstimatedHours, 0)}h estipuladas em POP
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Desvio Financeiro Geral</span>
              {(() => {
                const totalVariance = laborCostsByDepartment.reduce((acc, d) => acc + d.variance, 0);
                const isOver = totalVariance > 0;
                return (
                  <>
                    <span className={`text-2xl font-black block ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isOver ? '+' : ''}{formatBRL(totalVariance)}
                    </span>
                    <span className="text-[10px] text-slate-550 font-semibold block">
                      {isOver ? '⚠️ Custos reais acima do orçamento' : '✅ Esforço executado abaixo do teto'}
                    </span>
                  </>
                );
              })()}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Taxa Média por Hora</span>
              <span className="text-2xl font-black text-slate-900 block">
                {(() => {
                  const totSpent = laborCostsByDepartment.reduce((acc, d) => acc + d.totalSpentHours, 0);
                  const totSpentCost = laborCostsByDepartment.reduce((acc, d) => acc + d.totalSpentCost, 0);
                  return formatBRL(totSpent > 0 ? Math.round(totSpentCost / totSpent) : 0);
                })()}/h
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Média ponderada por papel dos analistas ativos
              </span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart comparing Estimated vs Real Cost */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Análise Comparativa de Orçamentos por Área</h4>
                <p className="text-[11px] text-slate-500">Comparativo do custo planejado de mão de obra (POP) vs. custo operacional realmente incorrido</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={laborCostsByDepartment} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                    <ChartTooltip 
                      formatter={(value: any) => [formatBRL(value as number), '']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px', borderColor: '#e2e8f0' }}
                    />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                    <Bar dataKey="totalEstimatedCost" name="Custo Planejado (R$)" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="totalSpentCost" name="Custo Real Incorrido (R$)" fill="#4f46e5" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart of cost distribution */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900">Distribuição Percentual de Custos</h4>
                <p className="text-[11px] text-slate-500">Participação de cada área no orçamento de mão de obra real acumulado</p>
              </div>

              <div className="h-64 w-full relative flex items-center justify-center">
                {laborCostsByDepartment.some(d => d.totalSpentCost > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={laborCostsByDepartment.filter(d => d.totalSpentCost > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="totalSpentCost"
                        nameKey="name"
                      >
                        {laborCostsByDepartment.filter(d => d.totalSpentCost > 0).map((entry, index) => {
                          const colors = ['#4f46e5', '#10b981', '#0ea5e9', '#ec4899', '#f59e0b', '#8b5cf6', '#14b8a6'];
                          return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                        })}
                      </Pie>
                      <ChartTooltip formatter={(value: any) => [formatBRL(value as number), '']} />
                      <Legend iconType="circle" iconSize={6} layout="horizontal" align="center" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-450 italic">Sem custos reais registrados para divisão.</p>
                )}
              </div>
            </div>
          </div>

          {/* Table list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Quadro Consolidado de Esforço por Departamento
              </h4>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
                {areas.length} Departamentos Registrados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="py-4 px-4">Departamento</th>
                    <th className="py-4 px-4 text-center">Atividades</th>
                    <th className="py-4 px-4 text-center">Horas Est.</th>
                    <th className="py-4 px-4 text-center">Horas Gastas</th>
                    <th className="py-4 px-4 text-right">Planejado (R$)</th>
                    <th className="py-4 px-4 text-right bg-indigo-50/50">Custo Real (R$)</th>
                    <th className="py-4 px-4 text-right">Orçamento Devido</th>
                    <th className="py-4 px-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-xs text-slate-800">
                  {laborCostsByDepartment.map((dept) => {
                    const isSelected = selectedLaborAreaId === dept.id;
                    const isOver = dept.variance > 0;
                    
                    return (
                      <React.Fragment key={dept.id}>
                        <tr className={`hover:bg-indigo-50/20 transition-colors ${isSelected ? 'bg-indigo-50/40 font-semibold' : ''}`}>
                          <td className="py-4 px-4">
                            <span className="font-bold text-slate-900 block">{dept.name}</span>
                            <span className="text-[10px] text-slate-500 font-normal line-clamp-1">{dept.description}</span>
                          </td>
                          <td className="py-4 px-4 text-center font-bold">
                            {dept.totalDemands} <span className="text-[10px] text-slate-400 font-normal">({dept.completedDemands} concl.)</span>
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-slate-600">
                            {dept.totalEstimatedHours}h
                          </td>
                          <td className="py-4 px-4 text-center font-mono text-slate-700 font-semibold">
                            {dept.totalSpentHours}h
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-600 zoom-xs">
                            {formatBRL(dept.totalEstimatedCost)}
                          </td>
                          <td className="py-4 px-4 text-right font-mono text-slate-900 font-extrabold bg-indigo-50/30">
                            {formatBRL(dept.totalSpentCost)}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {dept.variance === 0 ? (
                              <span className="text-[10.5px] font-bold text-slate-500">Empatado (0%)</span>
                            ) : (
                              <span className={`text-[10.5px] font-bold py-0.5 px-2 rounded-full border ${
                                isOver 
                                  ? 'bg-rose-50 text-rose-700 border-rose-100 font-mono text-[10px]' 
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100 font-mono text-[10px]'
                              }`}>
                                {isOver ? '+' : ''}{formatBRL(dept.variance)}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <button
                              id={`btn-view-team-${dept.id}`}
                              onClick={() => setSelectedLaborAreaId(isSelected ? null : dept.id)}
                              className={`py-1 px-3.5 rounded text-[11px] font-bold transition flex items-center gap-1 mx-auto cursor-pointer ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white shadow-xs font-bold' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-755 font-bold border border-slate-200'
                              }`}
                            >
                              <Users className="w-3.5 h-3.5" /> 
                              {isSelected ? 'Ocultar' : 'Ver Equipe'}
                            </button>
                          </td>
                        </tr>

                        {/* Collapsible Details Row */}
                        {isSelected && (
                          <tr>
                            <td colSpan={8} className="p-4 bg-slate-50 border-y border-indigo-100/50">
                              <div className="space-y-4">
                                <h5 className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                                  <UserCheck className="w-4 h-4 text-indigo-600" /> Alocação de Analistas e Atividades em {dept.name}
                                </h5>

                                {dept.contributors.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    
                                    {/* Contributors List */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                                      <h6 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                                        Especialistas Alocados ({dept.contributors.length})
                                      </h6>
                                      
                                      <div className="space-y-3">
                                        {dept.contributors.map((contrib, idx) => {
                                          const rate = getHourlyRate(users.find(u => u.name === contrib.name)?.id);
                                          return (
                                            <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100/50 transition">
                                              <div className="flex items-center gap-2.5">
                                                <img 
                                                  src={contrib.avatar} 
                                                  referrerPolicy="no-referrer" 
                                                  alt={contrib.name} 
                                                  className="w-8 h-8 rounded-full border border-slate-200 object-cover" 
                                                />
                                                <div>
                                                  <span className="font-extrabold text-slate-900 block text-xs">{contrib.name}</span>
                                                  <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-150 py-0.2 px-1.5 rounded font-black max-w-max block mt-0.5">
                                                    {contrib.role}
                                                  </span>
                                                </div>
                                              </div>

                                              <div className="text-right flex items-center gap-4">
                                                <div className="text-[10px] text-slate-500 font-semibold text-center">
                                                  <span className="block font-mono text-slate-700 font-bold">{contrib.hoursSpent}h</span>
                                                  <span>esforço</span>
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-semibold text-center">
                                                  <span className="block font-mono text-slate-700 font-bold">{formatBRL(rate)}</span>
                                                  <span>taxa/h</span>
                                                </div>
                                                <div className="text-right">
                                                  <span className="font-mono font-black text-slate-900 block text-xs">{formatBRL(contrib.cost)}</span>
                                                  <span className="text-[9px] text-slate-450 font-medium font-sans">custo total</span>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Activities breakdown list */}
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 shadow-xs">
                                      <h6 className="text-[11px] font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-1.5">
                                        Histórico de Atividades e Custos ({dept.demands.length})
                                      </h6>

                                      <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                        {dept.demands.map((dem) => {
                                          const rate = getHourlyRate(dem.assigneeId);
                                          const taskCost = dem.timeSpentHours * rate;
                                          const assignee = users.find(u => u.id === dem.assigneeId);
                                          
                                          return (
                                            <div key={dem.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-150/80 flex justify-between gap-4 text-xs font-medium">
                                              <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="font-mono font-extrabold text-slate-400">[{dem.id}]</span>
                                                  <span className="font-bold text-slate-800 line-clamp-1">{dem.title}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">
                                                  Resp: <strong className="text-slate-700">{assignee?.name || 'Sem Responsável'}</strong>
                                                </p>
                                                <span className="text-[9px] bg-slate-150 text-slate-655 font-bold py-0.5 px-2 rounded-full inline-block">
                                                  {dem.type} • {dem.status}
                                                </span>
                                              </div>

                                              <div className="text-right shrink-0">
                                                <span className="font-mono font-bold text-slate-800 block text-xs">
                                                  {formatBRL(taskCost)}
                                                </span>
                                                <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">
                                                  {dem.timeSpentHours}h gastas
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                  </div>
                                ) : (
                                  <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                                    Nenhum esforço registrado para esta área operacional.
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: PRODUCTIVITY & EVALUATION REPORT WITH PROCESS IMPROVEMENT IDEAS INTEGRATION */}
      {activeTab === 'PRODUCTIVITY' && (
        <div id="productivity-report-container" className="space-y-6 text-left">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-955/80 px-2 py-0.5 rounded border border-amber-800">
                PDI & Melhoria de Processos Reconhecidos
              </span>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Boletim de Produtividade, Avaliação e Ideias de Processos
              </h3>
              <p className="text-xs text-slate-300">
                Acompanhamento integrado de pontos de avaliação e engajamento. As propostas aprovadas de melhoria contínua concedem bonificações diretas na pontuação geral do colaborador.
              </p>
            </div>

            <button
              id="btn-export-productivity"
              onClick={() => {
                const data = users.map(u => {
                  const userDemands = demands.filter(d => d.assigneeId === u.id);
                  const completed = userDemands.filter(d => d.status === 'CONCLUIDO');
                  const onTime = completed.filter(d => d.slaSpentHours <= d.slaLimitHours).length;
                  const userIdeas = ideas.filter(i => i.collaboratorId === u.id);
                  const approvedIdeas = userIdeas.filter(i => i.status === 'APROVADO').length;
                  const ideasPointsBonus = approvedIdeas * 15;
                  
                  // Base Score based on completed demands
                  const baseScore = completed.length * 10;
                  const devAdhesive = completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 100;
                  const finalScore = baseScore + ideasPointsBonus;

                  let classification = 'CONFORME';
                  if (finalScore >= 50) classification = 'DESTACADO ⭐';
                  else if (finalScore >= 30) classification = 'ALTAMENTE PRODUTIVO';

                  return {
                    'Colaborador': u.name,
                    'Cargo': u.role,
                    'Atividades Atribuídas': userDemands.length,
                    'Atividades Concluídas': completed.length,
                    'Aderência SLA (%)': devAdhesive,
                    'Ideias de Processo Sugeridas': userIdeas.length,
                    'Ideias de Processo Aprovadas': approvedIdeas,
                    'Pontos de Bonificação (Melhoria)': ideasPointsBonus,
                    'Pontuação de Avaliação Total': finalScore,
                    'Classificação Período': classification
                  };
                });

                const worksheet = XLSX.utils.json_to_sheet(data);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Avaliação de Produtividade');

                // Sheet 2: Ideas registered details
                const ideasData = ideas.map(i => ({
                  'Título da Ideia': i.title,
                  'Descrição do Processo': i.description,
                  'Solução Proposta': i.solutionProposal,
                  'Benefício Estimado': i.expectedBenefit,
                  'Colaborador': i.collaboratorName,
                  'Data de Envio': i.date,
                  'Status de Aprovação': i.status,
                  'Pontos Concedidos': i.status === 'APROVADO' ? 15 : 0
                }));
                if (ideasData.length > 0) {
                  const worksht2 = XLSX.utils.json_to_sheet(ideasData);
                  XLSX.utils.book_append_sheet(workbook, worksht2, 'Ideias de Melhoria Anexadas');
                }

                const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
                const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `boletim_produtividade_e_avaliacao_${Date.now()}.xlsx`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-2 shadow-md transition shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exportar Planilha de Avaliação (.xlsx)
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total de Ideias de Processo</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">{ideas.length}</span>
              <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                {ideas.filter(i => i.status === 'APROVADO').length} aprovadas e bonificadas (+15 pts cada)
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Maior Pontuação de Avaliação</span>
              <span className="text-2xl font-black text-slate-800 block mt-1">
                {Math.max(...users.map(u => {
                  const compCount = demands.filter(d => d.assigneeId === u.id && d.status === 'CONCLUIDO').length;
                  const appIdeas = ideas.filter(i => i.collaboratorId === u.id && i.status === 'APROVADO').length;
                  return (compCount * 10) + (appIdeas * 15);
                }), 0)} pts
              </span>
              <span className="text-[10px] text-indigo-600 font-semibold block mt-1">
                Colaborador com maior engajamento em melhorias
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Média de Aderência de SLA Geral</span>
              <span className="text-2xl font-black text-emerald-600 block mt-1">
                {(() => {
                  const completed = demands.filter(d => d.status === 'CONCLUIDO');
                  const onTime = completed.filter(d => d.slaSpentHours <= d.slaLimitHours).length;
                  return completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 100;
                })()}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                Compromisso com prazos regulamentados
              </span>
            </div>
          </div>

          {/* Leaders Board Section */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Grade Consolidada de Avaliação e Produtividade Operacional</h4>
              <p className="text-[11px] text-slate-500">Ranking interno de desempenho com bonificação de +15 pontos por Processo de Melhoria Contínua aprovado.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-550 border-b border-slate-200 font-semibold">
                    <th className="py-3 px-4">Colaborador</th>
                    <th className="py-3 px-4">Papel / Cargo</th>
                    <th className="py-3 px-4 text-center">Atividades Atribuídas</th>
                    <th className="py-3 px-4 text-center">Concluídas</th>
                    <th className="py-3 px-4 text-center">SLA Aderência</th>
                    <th className="py-3 px-4 text-center">Ideias Propostas</th>
                    <th className="py-3 px-4 text-center">Ideias Aprovadas</th>
                    <th className="py-3 px-4 text-right">Bônus de Melhoria</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Nota Total</th>
                    <th className="py-3 px-4 text-right font-bold text-slate-800">Classificação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const userDemands = demands.filter(d => d.assigneeId === u.id);
                    const completed = userDemands.filter(d => d.status === 'CONCLUIDO');
                    const onTime = completed.filter(d => d.slaSpentHours <= d.slaLimitHours).length;
                    const userIdeas = ideas.filter(i => i.collaboratorId === u.id);
                    const approvedIdeas = userIdeas.filter(i => i.status === 'APROVADO').length;
                    const ideasPointsBonus = approvedIdeas * 15;
                    
                    const baseScore = completed.length * 10;
                    const finalScore = baseScore + ideasPointsBonus;
                    const slaRate = completed.length > 0 ? Math.round((onTime / completed.length) * 100) : 100;

                    let badgeColor = 'bg-slate-100 text-slate-700';
                    let label = 'Conforme';
                    if (finalScore >= 50) {
                      badgeColor = 'bg-emerald-100 text-emerald-800 font-extrabold border border-emerald-250';
                      label = 'Destacado ⭐';
                    } else if (finalScore >= 25) {
                      badgeColor = 'bg-indigo-100 text-indigo-800 font-bold';
                      label = 'Altamente Produtivo';
                    }

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] font-black flex items-center justify-center border border-slate-200">
                              {u.name.substring(0,2).toUpperCase()}
                            </span>
                            <span className="font-bold text-slate-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {u.role === 'GESTOR' ? 'Gestor de Departamento' : u.role === 'APROVADOR' ? 'Diretor Executivo' : 'Analista Especialista'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-600">{userDemands.length}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">{completed.length}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono font-black ${slaRate < 80 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {slaRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-600 font-bold">{userIdeas.length} ideas</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-150 font-bold">
                            {approvedIdeas} aprovadas
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-indigo-600 font-mono font-bold">
                          +{ideasPointsBonus} pts
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900 text-sm">
                          {finalScore} pts
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black tracking-wider ${badgeColor}`}>
                            {label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
            <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1">
              <Lightbulb className="w-4 h-4 text-yellow-500 inline shrink-0" />
              Critérios de Bonificação do Canal de Engajamento
            </h5>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Cada analista ganha 10 pontos de avaliação por atividade cumprida em conformidade com as regras do POP original. Se propuser uma melhoria de processos pelo canal e ela for aprovada pela Gestão Geral, recebe um adicional fixo de +15 pontos que é incorporado imediatamente neste Boletim e consolidado nas avaliações anuais de PDI.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
