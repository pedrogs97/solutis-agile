/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Project, Demand, Area, User } from '../types';
import { 
  FolderKanban, Plus, Calendar, Pencil, Trash2, CheckCircle, 
  Clock, AlertTriangle, Layers, ArrowRight, X, Link, Link2Off, Eye, Share2,
  User as UserIcon, Users as UsersIcon, ChevronDown, Search, ArrowUpRight, 
  HelpCircle, FileText, Tag, ChevronRight, Check, Sparkles, Building, Briefcase, CheckSquare
} from 'lucide-react';
import { useToast } from './Toast';
import { mockUsers } from '../mockData';

interface ProjectsViewProps {
  projects: Project[];
  demands: Demand[];
  areas: Area[];
  currentUser: User;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onLinkDemand: (demandId: string, projectId: string | null) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  demands,
  areas,
  currentUser,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onLinkDemand,
}) => {
  const isManager = currentUser.role === 'ADMIN' || currentUser.role === 'GESTOR';
  const { success: toastSuccess, error: toastError } = useToast();

  // State for Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Form fields
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectStatus, setProjectStatus] = useState<'PLANEJADO' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'ATRASADO'>('PLANEJADO');
  const [projectDueDate, setProjectDueDate] = useState('');
  const [projectAreaId, setProjectAreaId] = useState('');

  // State for detailed Project info modal (Jira-inspired)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailedProjectId, setDetailedProjectId] = useState<string | null>(null);
  const [taskSearchText, setTaskSearchText] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [expandedTeamMemberId, setExpandedTeamMemberId] = useState<string | null>(null);

  // Selected project for detailed activity listing
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pId = urlParams.get('projectId');
    if (pId && projects.some(p => p.id === pId)) {
      return pId;
    }
    return projects.length > 0 ? projects[0].id : null;
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pId = urlParams.get('projectId');
    if (pId && projects.some(p => p.id === pId)) {
      setDetailedProjectId(pId);
      setIsDetailModalOpen(true);
    }
  }, [projects]);

  useEffect(() => {
    if (!isDetailModalOpen) {
      const url = new URL(window.location.href);
      if (url.searchParams.has('projectId')) {
        url.searchParams.delete('projectId');
        window.history.pushState({}, '', url);
      }
    }
  }, [isDetailModalOpen]);

  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);

  const handleShareProject = (pId: string) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?projectId=${pId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedProjectId(pId);
      toastSuccess('Link do projeto copiado para a área de transferência!');
      setTimeout(() => setCopiedProjectId(null), 2000);
    }).catch(err => {
      console.error('Failed to copy project: ', err);
      toastError('Erro ao copiar o link de compartilhamento.');
    });
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setProjectDescription('');
    setProjectStatus('PLANEJADO');
    setProjectDueDate(new Date().toISOString().split('T')[0]);
    setProjectAreaId(areas[0]?.id || '');
    setIsModalOpen(true);
  };

  const openEditModal = (proj: Project) => {
    setEditingProject(proj);
    setProjectName(proj.name);
    setProjectDescription(proj.description);
    setProjectStatus(proj.status);
    setProjectDueDate(proj.dueDate);
    setProjectAreaId(proj.areaId);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toastError('O nome do projeto é obrigatório.');
      return;
    }
    if (!projectDueDate) {
      toastError('O prazo final/deadline é obrigatório.');
      return;
    }
    if (!projectAreaId) {
      toastError('A área de governança responsável é obrigatória.');
      return;
    }

    if (editingProject) {
      onUpdateProject({
        id: editingProject.id,
        name: projectName.trim(),
        description: projectDescription.trim(),
        status: projectStatus,
        dueDate: projectDueDate,
        areaId: projectAreaId,
      });
      toastSuccess(`Projeto "${projectName.trim()}" atualizado com sucesso!`);
    } else {
      onAddProject({
        name: projectName.trim(),
        description: projectDescription.trim(),
        status: projectStatus,
        dueDate: projectDueDate,
        areaId: projectAreaId,
      });
      toastSuccess(`Projeto "${projectName.trim()}" planejado com sucesso!`);
    }
    setIsModalOpen(false);
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const linkedDemands = activeProject ? demands.filter(d => d.projectId === activeProject.id) : [];
  const unlinkedDemands = demands.filter(d => !d.projectId);

  return (
    <div className="space-y-6" id="projects-view-main">
      
      {/* Header section with Create Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-slate-900 rounded-xl text-white shadow-md gap-4">
        <div>
          <h2 className="text-xl font-bold font-sans tracking-tight flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" /> Gestão de Projetos Estratégicos
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Planejamento corporativo e mapeamento de demandas vinculadas • {projects.length} registros ativos
          </p>
        </div>
        {isManager ? (
          <button
            id="btn-create-project"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Cadastrar Novo Projeto
          </button>
        ) : (
          <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg select-none">
            Apenas Admins/Gestores podem gerenciar
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Projects Cards List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-slate-500" /> Projetos Existentes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => {
              const projDemands = demands.filter(d => d.projectId === proj.id);
              const completedDemands = projDemands.filter(d => d.status === 'CONCLUIDO').length;
              const totalDemands = projDemands.length;
              const progress = totalDemands > 0 ? Math.round((completedDemands / totalDemands) * 100) : 0;
              const areaName = areas.find(a => a.id === proj.areaId)?.name || 'Geral';
              const isSelected = selectedProjectId === proj.id;

              // Deadline maths
              const today = new Date();
              today.setHours(0,0,0,0);
              const [y, m, d] = proj.dueDate.split('-').map(Number);
              const dDate = new Date(y, m - 1, d);
              dDate.setHours(23,59,59,999);
              const daysLeft = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              return (
                <div
                  key={proj.id}
                  id={`project-card-${proj.id}`}
                  onClick={() => {
                    setSelectedProjectId(proj.id);
                    setDetailedProjectId(proj.id);
                    setIsDetailModalOpen(true);
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-indigo-50/50 border-indigo-400 ring-1 ring-indigo-400 hover:shadow-md' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                        {areaName}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        proj.status === 'CONCLUIDO' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                          : daysLeft < 0 
                          ? 'bg-rose-50 text-rose-700 border-rose-250' 
                          : proj.status === 'PLANEJADO'
                          ? 'bg-slate-50 text-slate-500 border-slate-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {proj.status === 'CONCLUIDO' 
                          ? 'Concluído' 
                          : daysLeft < 0 
                          ? `Atrasado ${Math.abs(daysLeft)}d` 
                          : proj.status === 'PLANEJADO'
                          ? 'Planejado'
                          : `Ativo (${daysLeft}d)`
                        }
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-800 mt-2.5 leading-tight">{proj.name}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {proj.description || 'Nenhuma descrição providenciada.'}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> Deadline: {proj.dueDate.split('-').reverse().join('/')}
                      </span>
                      <span className="font-semibold text-slate-700">
                        {completedDemands}/{totalDemands} atividades ({progress}%)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-155 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${progress}%` }} 
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center gap-2 pt-2 animate-fade-in" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleShareProject(proj.id)}
                        className={`p-1 px-2.5 text-[10px] font-bold rounded border transition flex items-center gap-1.5 ${
                          copiedProjectId === proj.id
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                        }`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{copiedProjectId === proj.id ? 'Link Copiado!' : 'Compartilhar Link'}</span>
                      </button>

                      {isManager && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(proj)}
                            className="p-1 px-2 text-[10px] font-bold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded border border-slate-200 transition flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir o projeto "${proj.name}"? As tarefas não serão excluídas, apenas desvinculadas.`)) {
                                onDeleteProject(proj.id);
                                if (selectedProjectId === proj.id) setSelectedProjectId(projects.find(p => p.id !== proj.id)?.id || null);
                                toastSuccess(`Projeto "${proj.name}" excluído. Atividades foram desvinculadas.`);
                              }
                            }}
                            className="p-1 px-2 text-[10px] font-bold text-slate-500 hover:text-red-600 hover:bg-rose-50 rounded border border-slate-200 transition flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {projects.length === 0 && (
              <div className="col-span-2 py-12 text-center bg-white border border-dashed border-slate-300 rounded-xl">
                <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="text-sm font-semibold text-slate-700 mt-2">Nenhum projeto cadastrado</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Utilize o botão acima para criar o primeiro projeto de governança operacional e vincular suas atividades.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Linked Activities Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Atividades Vinculadas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeProject ? `Exibindo demandas de: "${activeProject.name}"` : 'Selecione um projeto para ver suas atividades.'}
            </p>
          </div>

          {activeProject ? (
            <div className="space-y-4">
              
              {/* Linked Demands List */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Atividades Atuais ({linkedDemands.length})
                </span>

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {linkedDemands.map((dem) => (
                    <div 
                      key={dem.id} 
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between hover:bg-slate-100 transition text-xs"
                    >
                      <div className="truncate pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-400 text-[10px]">{dem.id}</span>
                          <span className="font-semibold text-slate-700 truncate">{dem.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                          <span className={`font-semibold ${
                            dem.status === 'CONCLUIDO' 
                              ? 'text-emerald-600' 
                              : dem.status === 'EM_ANDAMENTO' 
                              ? 'text-blue-600' 
                              : 'text-amber-600'
                          }`}>
                            {dem.status}
                          </span>
                          <span>• Est. {dem.timeEstimatedHours}h</span>
                        </div>
                      </div>

                      {isManager && (
                        <button
                          onClick={() => {
                            onLinkDemand(dem.id, null);
                            toastSuccess(`Atividade ${dem.id} desvinculada.`);
                          }}
                          title="Desvincular do projeto"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded-md border border-slate-150 transition"
                        >
                          <Link2Off className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}

                  {linkedDemands.length === 0 && (
                    <p className="text-xs text-slate-450 italic py-4 text-center">
                      Nenhuma atividade vinculada a este projeto no momento.
                    </p>
                  )}
                </div>
              </div>

              {/* Associate activities tool */}
              {isManager && (
                <div className="pt-4 border-t border-slate-100 space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Vincular Atividade Existente
                  </span>

                  {unlinkedDemands.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[11px] text-slate-400">
                        Atividades sem projetos mapeados ({unlinkedDemands.length}):
                      </p>
                      <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                        {unlinkedDemands.map((dem) => (
                          <div 
                            key={dem.id} 
                            className="p-2 bg-slate-50 rounded-md border border-slate-100 flex items-center justify-between text-[11px]"
                          >
                            <span className="truncate font-medium text-slate-700 pr-2">
                              <span className="font-mono font-bold text-slate-400 text-[9px] mr-1">{dem.id}</span> 
                              {dem.title}
                            </span>
                            <button
                              onClick={() => {
                                onLinkDemand(dem.id, activeProject.id);
                                toastSuccess(`Atividade ${dem.id} vinculada ao projeto com sucesso!`);
                              }}
                              className="px-2 py-1 text-[10px] font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700 transition flex items-center gap-0.5 shrink-0"
                            >
                              <Link className="w-3" /> Vincular
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Todas as demandas ativas já estão mapeadas em algum projeto.
                    </p>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 italic">
              Nenhum projeto selecionado ou cadastrado para exibir detalhes.
            </div>
          )}
        </div>

      </div>

      {/* Main Creation/Edition Modal */}
      {isModalOpen && (
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-1.5">
                <FolderKanban className="w-4 h-4 text-indigo-400" />
                {editingProject ? 'Editar Registro de Projeto' : 'Registrar Novo Projeto'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Nome do Projeto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Expansão Logística de TI"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Descrição do Planejamento</label>
                <textarea
                  rows={3}
                  placeholder="Descreva as metas, equipe e objetivos do projeto operacional..."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Departamento/Área *</label>
                  <select
                    required
                    value={projectAreaId}
                    onChange={(e) => setProjectAreaId(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 block">Status do Planejamento *</label>
                  <select
                    required
                    value={projectStatus}
                    onChange={(e) => setProjectStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="PLANEJADO">Planejado</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="CONCLUIDO">Concluído</option>
                    <option value="ATRASADO">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Prazo Final (Due Date) *</label>
                <input
                  type="date"
                  required
                  value={projectDueDate}
                  onChange={(e) => setProjectDueDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-lg text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                >
                  Confirmar e Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Jira-Inspired Project Detail Modal */}
      {isDetailModalOpen && (
        (() => {
          const detailProject = projects.find(p => p.id === detailedProjectId);
          if (!detailProject) return null;

          const detailLinkedDemands = demands.filter(d => d.projectId === detailProject.id);
          
          let filteredDetailLinkedDemands = detailLinkedDemands;
          if (taskSearchText) {
            filteredDetailLinkedDemands = filteredDetailLinkedDemands.filter(d => 
              d.title.toLowerCase().includes(taskSearchText.toLowerCase()) || 
              d.id.toLowerCase().includes(taskSearchText.toLowerCase())
            );
          }
          if (taskStatusFilter !== 'ALL') {
            filteredDetailLinkedDemands = filteredDetailLinkedDemands.filter(d => d.status === taskStatusFilter);
          }

          // Get unique assignee IDs for all demands linked to this project
          const assigneeIds = Array.from(new Set(detailLinkedDemands.map(d => d.assigneeId).filter(Boolean)));
          const detailProjectMembers = assigneeIds.map(uid => mockUsers.find(u => u.id === uid)).filter(Boolean) as User[];

          const projectCreator = mockUsers.find(u => u.id === (detailProject.creatorId || 'usr-gestor')) || mockUsers[1];
          const unlinkedDemandsForModal = demands.filter(d => !d.projectId);

          // Calculate progress percentage
          const totalTasks = detailLinkedDemands.length;
          const completedTasks = detailLinkedDemands.filter(d => d.status === 'CONCLUIDO').length;
          const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Deadline calculation
          const today = new Date();
          today.setHours(0,0,0,0);
          const [y, m, d] = detailProject.dueDate.split('-').map(Number);
          const dDate = new Date(y, m - 1, d);
          dDate.setHours(23,59,59,999);
          const daysLeft = Math.ceil((dDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div 
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsDetailModalOpen(false);
                }
              }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 z-50 animate-fadeIn"
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-slideUp">
                
                {/* Modal Navigation Top Bar */}
                <div className="bg-slate-900 px-5 py-3.5 text-white flex justify-between items-center border-b border-slate-800 shrink-0">
                  <div className="flex items-center gap-2 text-xs">
                    <FolderKanban className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-400 font-medium">Projetos Corporativos</span>
                    <span className="text-slate-550">/</span>
                    <span className="font-mono bg-slate-800 text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px]">
                      PRJ-{detailProject.id.toUpperCase().replace('PRJ-', '')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleShareProject(detailProject.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 border ${
                        copiedProjectId === detailProject.id
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-205 border-slate-700'
                      }`}
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{copiedProjectId === detailProject.id ? 'Copiado!' : 'Compartilhar'}</span>
                    </button>
                    <button 
                      onClick={() => setIsDetailModalOpen(false)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Main scrollable body */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* COLUMN 1: core work item description & issues (8/12 cols) */}
                    <div className="lg:col-span-8 space-y-6 text-left">
                      
                      {/* Title */}
                      <div>
                        <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight font-display mb-1">
                          {detailProject.name}
                        </h2>
                      </div>

                      {/* Description Section with Inline Edit */}
                      <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 relative group">
                        <div className="flex justify-between items-center mb-2.5">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-indigo-600" /> Sobre o Projeto
                          </h4>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                          {detailProject.description || 'Nenhuma descrição detalhada providenciada.'}
                        </p>
                      </div>

                      {/* Linked Issues Panel (Jira board style) */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-2">
                          <div>
                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckSquare className="w-4 h-4 text-emerald-600" /> Atividades Vinculadas ({detailLinkedDemands.length})
                            </h4>
                          </div>

                          {/* Filter Controls */}
                          <div className="flex gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-initial">
                              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Buscar atividades..."
                                value={taskSearchText}
                                onChange={(e) => setTaskSearchText(e.target.value)}
                                className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 text-[11px] rounded-lg focus:outline-none focus:bg-white focus:border-indigo-550 w-full"
                              />
                            </div>
                            <select
                              value={taskStatusFilter}
                              onChange={(e) => setTaskStatusFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2 py-1 outline-none font-medium"
                            >
                              <option value="ALL">Todos status</option>
                              <option value="PENDENTE">Pendente</option>
                              <option value="EM_ANDAMENTO">Em Andamento</option>
                              <option value="CONCLUIDO">Concluído</option>
                            </select>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {detailLinkedDemands.length > 0 && (
                          <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 flex items-center justify-between gap-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Progresso do Projeto</span>
                            <div className="flex-1 flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                  style={{ width: `${progressPercent}%` }}
                                  className="h-full bg-indigo-650 rounded-full"
                                />
                              </div>
                              <span className="text-xs font-bold font-mono text-slate-700">
                                {progressPercent}%
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Task Cards Matrix */}
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                          {filteredDetailLinkedDemands.map((dem) => {
                            const assignee = mockUsers.find(u => u.id === dem.assigneeId);
                            return (
                              <div 
                                key={dem.id}
                                className="p-3 bg-white rounded-xl border border-slate-200 hover:border-slate-350 transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-3 shadow-xs relative overflow-hidden"
                              >
                                {/* Priority visual rail */}
                                <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                                  dem.priority === 'ALTA' ? 'bg-rose-500' : dem.priority === 'MEDIA' ? 'bg-amber-500' : 'bg-slate-400'
                                }`} />

                                <div className="pl-2 space-y-1 truncate sm:max-w-[70%]">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                                      {dem.id}
                                    </span>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                                      dem.priority === 'ALTA' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                      dem.priority === 'MEDIA' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                      'bg-slate-50 border-slate-200 text-slate-605'
                                    }`}>
                                      {dem.priority}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-extrabold text-slate-800 leading-snug truncate">
                                    {dem.title}
                                  </h5>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                  {/* Assignee display */}
                                  <div className="flex items-center gap-1.5 text-[10px]" title={assignee ? assignee.email : 'Sem responsável'}>
                                    {assignee ? (
                                      <>
                                        <img 
                                          src={assignee.avatar} 
                                          alt={assignee.name} 
                                          className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                                          referrerPolicy="no-referrer"
                                        />
                                        <span className="font-medium text-slate-650 truncate max-w-[80px]">
                                          {assignee.name.split(' ')[0]}
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-slate-400 italic">Membro não definido</span>
                                    )}
                                  </div>

                                  {/* Status badge */}
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${
                                    dem.status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' :
                                    dem.status === 'EM_ANDAMENTO' ? 'bg-blue-50 border-blue-250 text-blue-700' :
                                    'bg-amber-50 border-amber-250 text-amber-700'
                                  }`}>
                                    {dem.status}
                                  </span>

                                  {/* Unlink action */}
                                  {isManager && (
                                    <button
                                      onClick={() => {
                                        onLinkDemand(dem.id, null);
                                        toastSuccess(`Atividade "${dem.title}" desvinculada.`);
                                      }}
                                      title="Desvincular do projeto"
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-rose-50 rounded border border-slate-200 transition inline-flex shrink-0 text-slate-400"
                                    >
                                      <Link2Off className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {filteredDetailLinkedDemands.length === 0 && (
                            <div className="py-6 text-center text-xs text-slate-450 bg-slate-50 rounded-xl border border-dashed border-slate-250 my-2 shadow-inner">
                              Nenhuma atividade vinculada corresponde a este filtro de pesquisa.
                            </div>
                          )}
                        </div>

                        {/* Bind unlinked activities directly inside modal */}
                        {isManager && (
                          <div className="pt-3 border-t border-slate-100 space-y-2">
                            <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">
                              Vincular Atividade Existente
                            </span>

                            {unlinkedDemandsForModal.length > 0 ? (
                              <div className="flex gap-2">
                                <select 
                                  id="modal-unlinked-demands-select-box"
                                  className="flex-1 bg-white border border-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                      onLinkDemand(val, detailProject.id);
                                      toastSuccess(`Atividade vinculada com sucesso!`);
                                      e.target.value = "";
                                    }
                                  }}
                                >
                                  <option value="" disabled>Vincular mais demandas ativas a este projeto estratégico...</option>
                                  {unlinkedDemandsForModal.map(ud => (
                                    <option key={ud.id} value={ud.id}>
                                      [{ud.id}] {ud.title} ({ud.type} • Responsável: {mockUsers.find(u => u.id === ud.assigneeId)?.name || 'Nenhum'})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <p className="text-[10px] italic text-slate-400 bg-slate-50 p-2.5 rounded border border-slate-200">
                                Todas as demandas da plataforma já estão vinculadas a algum projeto estratégico corporativo.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Users / Assignees Assigned to the project Section (Atividades por Usuário) */}
                      <div className="space-y-3 pt-2">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <UsersIcon className="w-4 h-4 text-indigo-600" /> Usuários Atrelados ao Projeto ({detailProjectMembers.length})
                        </h4>

                        {detailProjectMembers.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {detailProjectMembers.map((member) => {
                              const memberTasks = detailLinkedDemands.filter(d => d.assigneeId === member.id);
                              const isExpanded = expandedTeamMemberId === member.id;
                              
                              return (
                                <div 
                                  key={member.id}
                                  className="bg-slate-50 border border-slate-205 rounded-xl overflow-hidden transition-all duration-300 shadow-xs"
                                >
                                  <div 
                                    onClick={() => setExpandedTeamMemberId(isExpanded ? null : member.id)}
                                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-all"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <img 
                                        src={member.avatar} 
                                        alt={member.name} 
                                        className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-50"
                                        referrerPolicy="no-referrer"
                                      />
                                      <div className="truncate">
                                        <h5 className="text-xs font-bold text-slate-850 leading-tight">
                                          {member.name}
                                        </h5>
                                        <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                                          {member.role} • {member.email}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[10px] font-bold bg-indigo-50 border border-indigo-150 text-indigo-650 px-2 py-0.5 rounded-full">
                                        {memberTasks.length} {memberTasks.length === 1 ? 'atividade' : 'atividades'}
                                      </span>
                                      <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                  </div>

                                  {isExpanded && (
                                    <div className="bg-white border-t border-slate-150 p-3 space-y-1.5 animate-fadeIn max-h-[160px] overflow-y-auto">
                                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                                        Atividades Atribuídas:
                                      </span>
                                      {memberTasks.map(t => (
                                        <div 
                                          key={t.id}
                                          className="flex items-center justify-between p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-100 text-[10px] gap-2 transition"
                                        >
                                          <span className="font-semibold text-slate-700 truncate">
                                            <span className="font-mono text-slate-400 text-[10px] font-bold mr-1.5">{t.id}</span>
                                            {t.title}
                                          </span>
                                          <span className={`text-[9px] font-bold px-1.5 py-0.1 border rounded shrink-0 font-mono ${
                                            t.status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                            t.status === 'EM_ANDAMENTO' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                            'bg-amber-50 border-amber-200 text-amber-700'
                                          }`}>
                                            {t.status}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-xs text-slate-400 italic bg-slate-50 border border-dashed border-slate-205 rounded-xl">
                            Nenhum usuário ou analista está encarregado das atividades vinculadas deste projeto no momento.
                          </div>
                        )}
                      </div>

                    </div>

                    {/* COLUMN 2: Jira Metadata sidebar panel (4/12 cols) */}
                    <div className="lg:col-span-4 bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-4 text-left flex flex-col justify-between self-start">
                      
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4 text-indigo-600" /> DETALHES COMPLEMENTARES
                        </h3>

                        {/* Status selection in Jira style */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status do Projeto</label>
                          {isManager ? (
                            <div className="relative">
                              <select
                                value={detailProject.status}
                                onChange={(e) => {
                                  onUpdateProject({
                                    ...detailProject,
                                    status: e.target.value as any
                                  });
                                  toastSuccess(`Status do projeto modificado com sucesso.`);
                                }}
                                className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-indigo-500 bg-white shadow-xs cursor-pointer hover:bg-slate-50 transition"
                              >
                                <option value="PLANEJADO">PLANEJADO</option>
                                <option value="EM_ANDAMENTO">EM ANDAMENTO</option>
                                <option value="CONCLUIDO">CONCLUÍDO</option>
                                <option value="ATRASADO">ATRASADO</option>
                              </select>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-xl border uppercase font-mono ${
                              detailProject.status === 'CONCLUIDO' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' :
                              detailProject.status === 'ATRASADO' ? 'bg-rose-50 border-rose-300 text-rose-700' :
                              detailProject.status === 'PLANEJADO' ? 'bg-slate-100 border-slate-300 text-slate-650' :
                              'bg-indigo-50 border-indigo-300 text-indigo-700'
                            }`}>
                              {detailProject.status}
                            </span>
                          )}
                        </div>

                        {/* Department / Area */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Área Gestora / Departamento</label>
                          <div className="flex items-center gap-2 bg-white rounded-xl p-3 border border-slate-200">
                            <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-800">
                                {areas.find(a => a.id === detailProject.areaId)?.name || 'Geral'}
                              </span>
                              <span className="text-[9px] text-slate-400 block mt-0.5 truncate leading-tight">
                                {areas.find(a => a.id === detailProject.areaId)?.description || 'Mapeamento global'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Deadline (Due Date) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Prazo Final (Due Date)</label>
                          <div className="bg-white rounded-xl p-3 border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                              <span className="text-xs font-bold font-mono text-slate-800">
                                {detailProject.dueDate.split('-').reverse().join('/')}
                              </span>
                            </div>
                            
                            <span className={`text-[10px] font-bold block mt-1.5 ${
                              detailProject.status === 'CONCLUIDO' ? 'text-emerald-600' :
                              daysLeft < 0 ? 'text-rose-600' :
                              daysLeft <= 5 ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              {detailProject.status === 'CONCLUIDO' ? '✓ Atividades finalizadas' :
                               daysLeft < 0 ? `🚨 Em atraso por ${Math.abs(daysLeft)} dias` :
                               daysLeft === 0 ? `⚡ Expira hoje!` :
                               `🕒 Faltam ${daysLeft} dias para o prazo`
                              }
                            </span>
                          </div>
                        </div>

                        {/* Reporter / Creator (Quem Criou) */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Quem Criou</label>
                          <div className="flex items-center gap-2.5 bg-white rounded-xl p-3 border border-slate-200">
                            <img 
                              src={projectCreator.avatar} 
                              alt={projectCreator.name} 
                              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-150 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-800 block leading-tight">
                                {projectCreator.name}
                              </span>
                              <span className="text-[9px] text-slate-400 block mt-0.5 truncate leading-tight">
                                {projectCreator.role} • {projectCreator.email}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>

                      <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 shrink-0">
                        <Briefcase className="w-4.5 h-4.5 text-slate-400" />
                        <span>Mapeamento Corporativo Padrão JIRA</span>
                      </div>

                    </div>

                  </div>
                </div>

                {/* Bottom Actions Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 shrink-0 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDetailModalOpen(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
                  >
                    Fechar Detalhes
                  </button>
                </div>

              </div>
            </div>
          );
        })()
      )}

    </div>
  );
};
