import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Area } from '../types';
import { 
  Lightbulb, 
  Plus, 
  Check, 
  X, 
  Upload, 
  FileText, 
  Sparkles, 
  Award, 
  TrendingUp, 
  CheckCircle,
  ThumbsUp, 
  MessageSquare,
  Search,
  Filter,
  Eye,
  BookmarkCheck
} from 'lucide-react';

export interface ImprovementIdea {
  id: string;
  title: string;
  description: string;
  solutionProposal: string;
  expectedBenefit: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorRole: string;
  collaboratorAvatar: string;
  departmentId: string;
  date: string;
  status: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO';
  attachedFileName?: string;
  attachedFileSize?: string;
  scoreBonus: number; // bônus de produtividade adicionado ao relatório (ex: 15)
  likes: number;
}

interface ContinuousImprovementProps {
  ideas: ImprovementIdea[];
  currentUser: User;
  users: User[];
  areas: Area[];
  onAddIdea: (idea: ImprovementIdea) => void;
  onUpdateIdea?: (idea: ImprovementIdea) => void;
}

export const ContinuousImprovement: React.FC<ContinuousImprovementProps> = ({
  ideas,
  currentUser,
  users,
  areas,
  onAddIdea,
  onUpdateIdea
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('TODOS');
  
  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [solutionProposal, setSolutionProposal] = useState('');
  const [expectedBenefit, setExpectedBenefit] = useState('');
  const [departmentId, setDepartmentId] = useState(currentUser.areaId || areas[0]?.id || 'area-ops');
  
  // File upload simulation
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form error
  const [error, setError] = useState('');

  const getAreaName = (id: string) => {
    return areas.find(a => a.id === id)?.name || id;
  };

  const getUserName = (id: string) => {
    return users.find(u => u.id === id)?.name || id;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      simulateUpload(files[0].name, files[0].size);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      simulateUpload(files[0].name, files[0].size);
    }
  };

  const simulateUpload = (fileName: string, fileSize: number) => {
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress(p => {
        if (p === null) return null;
        if (p >= 100) {
          clearInterval(interval);
          const sizeStr = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
          setAttachedFile({ name: fileName, size: sizeStr });
          return null;
        }
        return p + 30;
      });
    }, 150);
  };

  const handleSubmitIdea = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !solutionProposal.trim() || !expectedBenefit.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios da proposta de melhoria.');
      return;
    }

    const newIdea: ImprovementIdea = {
      id: `idea-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      solutionProposal: solutionProposal.trim(),
      expectedBenefit: expectedBenefit.trim(),
      collaboratorId: currentUser.id,
      collaboratorName: currentUser.name,
      collaboratorRole: currentUser.role,
      collaboratorAvatar: currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      departmentId: departmentId,
      date: new Date().toLocaleDateString('pt-BR'),
      status: 'PENDENTE',
      attachedFileName: attachedFile?.name || undefined,
      attachedFileSize: attachedFile?.size || undefined,
      scoreBonus: 15, // Cada ideia enviada adiciona 15 pontos de produtividade no boletim
      likes: 0
    };

    onAddIdea(newIdea);
    
    // Reset Form
    setTitle('');
    setDescription('');
    setSolutionProposal('');
    setExpectedBenefit('');
    setAttachedFile(null);
    setError('');
    setShowCreateForm(false);
  };

  const handleLike = (id: string) => {
    if (!onUpdateIdea) return;
    const target = ideas.find(i => i.id === id);
    if (target) {
      onUpdateIdea({
        ...target,
        likes: target.likes + 1
      });
    }
  };

  const handleStatusChange = (id: string, newStatus: 'PENDENTE' | 'EM_ANALISE' | 'APROVADO' | 'REJEITADO') => {
    if (!onUpdateIdea) return;
    const target = ideas.find(i => i.id === id);
    if (target) {
      onUpdateIdea({
        ...target,
        status: newStatus
      });
    }
  };

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = 
      idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      idea.collaboratorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = selectedAreaFilter === 'TODOS' || idea.departmentId === selectedAreaFilter;
    
    return matchesSearch && matchesArea;
  });

  // Calculate stats for top section
  const totalApproved = ideas.filter(i => i.status === 'APROVADO').length;
  const myApproved = ideas.filter(i => i.collaboratorId === currentUser.id && i.status === 'APROVADO').length;
  const myTotal = ideas.filter(i => i.collaboratorId === currentUser.id).length;
  const totalScoreBonus = myTotal * 15; // 15 points per proposal

  return (
    <div id="continuous-improvement-wrapper" className="space-y-6 text-left">
      
      {/* 1. Header Hero Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 space-y-2 max-w-2xl">
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-950/70 border border-amber-800 px-2.5 py-0.5 rounded-full">
            Governança Ativa & Inovação
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-sans flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-400 animate-pulse" /> Melhoria Contínua de Processos
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Canal descentralizado para sugestão de inovações, automatização operacional e eliminação de desperdício. Cada ideia submetida conta diretamente para sua avaliação de produtividade (+15 pontos).
          </p>
        </div>

        <button
          id="btn-open-improvement-form"
          onClick={() => setShowCreateForm(true)}
          className="relative z-10 shrink-0 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-5 rounded-xl shadow-lg hover:shadow-amber-500/10 transition duration-150 flex items-center gap-2 cursor-pointer self-start md:self-center"
        >
          <Plus className="w-4 h-4" /> Propor Nova Ideia
        </button>
      </div>

      {/* 2. Quick Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suas Contribuições</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 block">{myTotal}</span>
            <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 px-1.5 py-0.2 rounded">
              +{totalScoreBonus} pts
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block">
            Adicionados ao relatório de produtividade geral
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Suas Ideias Aprovadas</span>
          <span className="text-2xl font-black text-slate-900 block">{myApproved}</span>
          <span className="text-[10px] text-emerald-600 font-semibold block">
            ✨ {myTotal > 0 ? ((myApproved / myTotal) * 100).toFixed(0) : 0}% de taxa de aceitação operacional
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Geral Proposto</span>
          <span className="text-2xl font-black text-slate-900 block">{ideas.length}</span>
          <span className="text-[10px] text-slate-500 font-medium block">
            Ideias de todos os setores e analistas cadastrados
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inovações Implantadas</span>
          <span className="text-2xl font-black text-emerald-600 block">{totalApproved}</span>
          <span className="text-[10px] text-slate-550 font-bold block">
            🏆 Processos revisados de forma inteligente
          </span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Filters & Info cards */}
        <div className="space-y-4 lg:col-span-1">
          
          {/* Filters card */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b pb-2">Filtrar Ideias</h4>
            
            <div className="space-y-3 text-xs">
              
              {/* Search Bar */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar ideia, palavra-chave..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Area select */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400 block">Filtrar por Departamento</label>
                <select
                  value={selectedAreaFilter}
                  onChange={(e) => setSelectedAreaFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:outline-none"
                >
                  <option value="TODOS">Todos os setores</option>
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>

          {/* Gamification scoreboard/rules card */}
          <div className="bg-gradient-to-br from-indigo-700 to-blue-800 text-white p-5 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-300 animate-bounce" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Regras de Engajamento</h4>
            </div>
            
            <p className="text-[11px] text-slate-200 leading-relaxed">
              O Flowta premia a proatividade. Ao propor soluções em POPs (Procedimento de Operação), você melhora o SLA geral e reduz custos do seu departamento.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold bg-white/20 px-1.5 py-0.2 rounded text-[10px]">1</span>
                <span>Proposta enviada = <strong className="text-amber-300 font-extrabold">+15 pontos</strong> no boletim de produtividade.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold bg-white/20 px-1.5 py-0.2 rounded text-[10px]">2</span>
                <span>Ideia aprovada = <strong className="text-amber-300 font-extrabold">+50 pontos</strong> e prêmio institucional trimestral.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-mono font-bold bg-white/20 px-1.5 py-0.2 rounded text-[10px]">3</span>
                <span>Submeter um documento ou vídeo explicativo garante validação prioritária pelo supervisor.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Action Board & Cards lists */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Create form panel modal-box (inline block) */}
          <AnimatePresence>
            {showCreateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white p-5 rounded-xl border-2 border-indigo-200 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Nova Proposta de Melhoria de Processo
                  </span>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
                  >
                    ✕ Fechar
                  </button>
                </div>

                {error && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmitIdea} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Título da Proposta *</label>
                      <input
                        type="text"
                        placeholder="Ex: Automatização da análise de reembolsos no WhatsApp..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-slate-700">Setor/Departamento Afetado *</label>
                      <select
                        value={departmentId}
                        onChange={(e) => setDepartmentId(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                      >
                        {areas.map(area => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Qual é o gargalo ou desperdício observado? *</label>
                    <textarea
                      placeholder="Identifique claramente qual tarefa ou etapa consome muito tempo útil dos analistas..."
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Solução Proposta (Detalhamento do novo fluxo) *</label>
                    <textarea
                      placeholder="Descreva o passo a passo da melhoria ou sugestão para implantar..."
                      rows={3}
                      value={solutionProposal}
                      onChange={(e) => setSolutionProposal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Benefício Esperado (Retorno financeiro/horas poupadas/SLA) *</label>
                    <input
                      type="text"
                      placeholder="Ex: Redução de 4h diárias de esforço e diminuição de 20% no tempo de SLA..."
                      value={expectedBenefit}
                      onChange={(e) => setExpectedBenefit(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>

                  {/* Drag and Drop Documents attachment */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">Anexar Documento de Apoio (Draft, Fluxogramas, Exemplos)</label>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${
                        isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                      }`}
                    >
                      <input
                        type="file"
                        id="improved-doc-attachment-trigger"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                      />
                      <label htmlFor="improved-doc-attachment-trigger" className="cursor-pointer space-y-2 block">
                        <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="text-slate-600 font-bold text-xs">Arraste um documento ou clique para fazer upload</div>
                        <p className="text-[10px] text-slate-400">Formatos aceitos: PDF, Word, Excel, Imagens • Máx: 10MB</p>
                      </label>
                    </div>

                    {uploadProgress !== null && (
                      <div className="pt-2 text-[10.5px] text-indigo-600 flex items-center gap-2">
                        <span className="animate-spin text-indigo-500">⚙️</span>
                        <span>Carregando arquivo... {uploadProgress}%</span>
                      </div>
                    )}

                    {attachedFile && (
                      <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between mt-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-600" />
                          {attachedFile.name} ({attachedFile.size})
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFile(null)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t text-xs">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-lg cursor-pointer transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1.5 shadow transform hover:scale-102 transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Enviar Proposta para Revisão
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ideas catalog list */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                Portfólio de Propostas ({filteredIdeas.length})
              </h3>
            </div>

            {filteredIdeas.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-800 text-sm font-semibold">Nenhuma ideia cadastrada ou encontrada no filtro.</p>
                <p className="text-slate-400 text-xs mt-1">Gostaria de ser o primeiro a propor uma melhoria hoje?</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredIdeas.map((idea) => {
                  const isManagerOrAdmin = currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN' || currentUser.role === 'APROVADOR';
                  
                  return (
                    <div 
                      key={idea.id} 
                      className={`bg-white rounded-xl border hover:border-slate-300 transition-shadow p-5 text-left space-y-4 relative ${
                        idea.status === 'APROVADO' ? 'border-l-4 border-l-emerald-500' :
                        idea.status === 'REJEITADO' ? 'border-l-4 border-l-rose-500' :
                        idea.status === 'EM_ANALISE' ? 'border-l-4 border-l-amber-500' :
                        'border-l-4 border-l-slate-400'
                      }`}
                    >
                      {/* Author & Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img 
                            src={idea.collaboratorAvatar} 
                            alt={idea.collaboratorName} 
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0" 
                          />
                          <div>
                            <span className="font-extrabold text-slate-900 block text-xs">{idea.collaboratorName}</span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              Proposto em {idea.date} • Setor {getAreaName(idea.departmentId)}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                          {idea.status === 'APROVADO' && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-600" /> Implantado / Aprovado
                            </span>
                          )}
                          {idea.status === 'REJEITADO' && (
                            <span className="bg-rose-50 text-rose-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-full border border-rose-200 uppercase">
                              Arquivado
                            </span>
                          )}
                          {idea.status === 'EM_ANALISE' && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold py-0.5 px-2.5 rounded-full border border-amber-200 uppercase">
                              Em Análise Técnica
                            </span>
                          )}
                          {idea.status === 'PENDENTE' && (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold py-0.5 px-2.5 rounded-full border border-slate-200 uppercase">
                              Aguardando Triagem
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-black text-slate-900 leading-snug">{idea.title}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1 text-xs">
                          <div className="p-3 bg-slate-50/80 rounded-lg space-y-1 border border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block font-mono">🔍 Gargalo Identificado:</span>
                            <p className="text-slate-700 leading-snug">{idea.description}</p>
                          </div>

                          <div className="p-3 bg-indigo-50/30 rounded-lg space-y-1 border border-indigo-100/40">
                            <span className="text-[10px] uppercase font-bold text-indigo-400 block font-mono">💡 Inovação Sugerida:</span>
                            <p className="text-indigo-950 leading-snug">{idea.solutionProposal}</p>
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50/25 border border-amber-100 rounded-lg text-xs flex items-start gap-1.5">
                          <TrendingUp className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-amber-900 block text-[11px] uppercase tracking-wide">Retorno e Benefício Estimado:</span>
                            <p className="text-slate-700 font-medium">{idea.expectedBenefit}</p>
                          </div>
                        </div>
                      </div>

                      {/* Attachment Doc link */}
                      {idea.attachedFileName && (
                        <div className="flex items-center gap-1.5 p-2 bg-slate-100/80 border rounded-lg text-xs max-w-max">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-slate-700">{idea.attachedFileName}</span>
                          <span className="text-[10px] text-slate-400">({idea.attachedFileSize || '1 MB'})</span>
                        </div>
                      )}

                      {/* Actions footer bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-150">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => handleLike(idea.id)}
                            className="text-xs text-slate-500 hover:text-blue-600 font-bold transition flex items-center gap-1.5 cursor-pointer bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" /> Apoiar ({idea.likes})
                          </button>
                        </div>

                        {/* Supervisor approval toggles */}
                        {isManagerOrAdmin && (
                          <div className="flex items-center gap-1 text-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Supervisor:</span>
                            
                            <button
                              id={`btn-approve-idea-${idea.id}`}
                              onClick={() => handleStatusChange(idea.id, 'APROVADO')}
                              className={`py-1 px-2.5 rounded font-extrabold text-[10px] uppercase transition cursor-pointer border ${
                                idea.status === 'APROVADO' 
                                  ? 'bg-emerald-600 border-emerald-600 text-white font-bold' 
                                  : 'bg-white hover:bg-slate-100 text-slate-655 border-slate-200 font-bold'
                              }`}
                            >
                              Aprovar
                            </button>

                            <button
                              id={`btn-analyze-idea-${idea.id}`}
                              onClick={() => handleStatusChange(idea.id, 'EM_ANALISE')}
                              className={`py-1 px-2.5 rounded font-extrabold text-[10px] uppercase transition cursor-pointer border ${
                                idea.status === 'EM_ANALISE' 
                                  ? 'bg-amber-500 border-amber-500 text-slate-950 font-bold' 
                                  : 'bg-white hover:bg-slate-100 text-slate-655 border-slate-200 font-bold'
                              }`}
                            >
                              Analisar
                            </button>

                            <button
                              id={`btn-reject-idea-${idea.id}`}
                              onClick={() => handleStatusChange(idea.id, 'REJEITADO')}
                              className={`py-1 px-2.5 rounded font-extrabold text-[10px] uppercase transition cursor-pointer border ${
                                idea.status === 'REJEITADO' 
                                  ? 'bg-rose-600 border-rose-600 text-white font-bold' 
                                  : 'bg-white hover:bg-slate-100 text-red-500 border-slate-200 font-bold'
                              }`}
                            >
                              Arquivar
                            </button>
                          </div>
                        )}

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
