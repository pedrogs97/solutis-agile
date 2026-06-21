/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Demand, User, DemandType, CostCenter, Area, Attachment } from '../types';
import { Plus, CheckCircle2, AlertTriangle, HelpCircle, FilePlus, Sparkles, Send, Eye, FileText, ClipboardList } from 'lucide-react';

interface PortalProps {
  demands: Demand[];
  users: User[];
  costCenters: CostCenter[];
  areas: Area[];
  currentUser: User;
  onAddDemand: (demand: Demand) => void;
  onSelectDemand: (id: string) => void;
}

export const Portal: React.FC<PortalProps> = ({
  demands,
  users,
  costCenters,
  areas,
  currentUser,
  onAddDemand,
  onSelectDemand
}) => {
  const [activePortalTab, setActivePortalTab] = useState<'MY_REQUESTS' | 'NEW_REQUEST'>('MY_REQUESTS');
  
  // New Demand Form states
  const [title, setTitle] = useState('');
  const [type, setType] = useState<DemandType>('COMPRAS');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [costCenterId, setCostCenterId] = useState('cc-101');
  const [areaId, setAreaId] = useState('area-ops');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  // Filter demands opened by CURRENT USER
  const myDemands = demands.filter(d => d.solicitorId === currentUser.id);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return <span className="bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 px-2 py-0.5 rounded-full">🔴 Pendente</span>;
      case 'EM_ANDAMENTO':
        return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 px-2 py-0.5 rounded-full">🟠 Em Andamento</span>;
      default:
        return <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 px-2 py-0.5 rounded-full">🟢 Concluído</span>;
    }
  };

  const handleSimulateAttachment = () => {
    const names = ['Proposta_Comercial_Zebra_CD.pdf', 'Orcamento_FogoDeChao.jpg', 'Contract_Draft_V2_Corrigido.docx'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    if (!uploadedFileNames.includes(randomName)) {
      setUploadedFileNames([...uploadedFileNames, randomName]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setFormError('ERRO: Título e Descrição Detalhada são campos obrigatórios.');
      return;
    }

    const valueNum = Number(estimatedValue) || 0;

    // Simulate standard attachments
    const simulatedAttachments: Attachment[] = uploadedFileNames.map((name, i) => ({
      id: `att-port-${Date.now()}-${i}`,
      name,
      size: '1.2 MB',
      url: '#',
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }));

    // Generate New Demand
    const newDemand: Demand = {
      id: `DEM-${Math.floor(1000 + Math.random() * 9000)}`,
      type,
      title,
      description: `${description} [Fornecedor: ${vendorName || 'N/D'} | Valor Estimado: R$ ${valueNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}]`,
      solicitorId: currentUser.id,
      assigneeId: null, // Unassigned originally to trigger triage or automation
      managerId: 'usr-gestor', // Mapped to general Area manager
      observerIds: [],
      priority,
      status: 'PENDENTE',
      approvalStatus: 'NENHUMA',
      slaLimitHours: type === 'COMPRAS' ? 48 : type === 'REEMBOLSO' ? 24 : 72,
      slaSpentHours: 0,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      costCenterId,
      areaId,
      attachments: simulatedAttachments,
      timeEstimatedHours: type === 'COMPRAS' ? 4 : type === 'REEMBOLSO' ? 2 : 8,
      timeSpentHours: 0,
      comments: [],
      currentStageIndex: 0,
      history: [
        {
          id: `hst-${Date.now()}`,
          userId: currentUser.id,
          action: 'Demanda aberta através do Portal do Solicitante',
          date: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    onAddDemand(newDemand);
    
    // Reset form states
    setTitle('');
    setDescription('');
    setVendorName('');
    setEstimatedValue('');
    setUploadedFileNames([]);
    setFormError('');
    setFormSuccess('🎉 Demanda aberta com sucesso! O sistema acionou a governança operacional e notificou o Gestor.');
    
    setTimeout(() => {
      setFormSuccess('');
      setActivePortalTab('MY_REQUESTS');
    }, 3000);
  };

  return (
    <div id="portal-root" className="space-y-6">
      
       {/* Portal hero banner */}
      <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight text-blue-400 font-display">Portal do Solicitante Flowta</h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Abra cotações de compras, solicite termos de comodato, declare reembolsos de despesas ou proponha contratos de fornecedores de forma ágil e segura.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActivePortalTab('MY_REQUESTS')}
            className={`text-xs font-bold py-2 px-4 rounded-md border transition ${
              activePortalTab === 'MY_REQUESTS'
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
          >
            Minhas Solicitações ({myDemands.length})
          </button>

          <button
            onClick={() => setActivePortalTab('NEW_REQUEST')}
            className={`text-xs font-bold py-2 px-4 rounded-md border transition ${
              activePortalTab === 'NEW_REQUEST'
                ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-700'
            }`}
          >
            Abrir Solicitação
          </button>
        </div>
      </div>

      {activePortalTab === 'MY_REQUESTS' ? (
        /* My Requests list view */
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3.5">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 uppercase">
              <ClipboardList className="w-4 h-4 text-slate-500" /> Acompanhamento de Demandas de {currentUser.name.split(' ')[0]}
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-600 font-mono py-0.5 px-2 rounded border border-slate-200">
              {myDemands.length} Totais
            </span>
          </div>

          <div className="space-y-3.5">
            {myDemands.length > 0 ? (
              myDemands.map((demand) => (
                <div 
                  key={demand.id} 
                  onClick={() => onSelectDemand(demand.id)}
                  className="p-4 rounded-xl border border-slate-150 hover:bg-slate-50 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded uppercase border">
                        {demand.id}
                      </span>
                      <span className="text-[10px] font-mono text-red-600 font-extrabold bg-red-50 border border-red-100 px-1 rounded">
                        {demand.type}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 leading-tight tracking-tight line-clamp-1">{demand.title}</h4>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2">{demand.description}</p>
                    
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 pt-1">
                      <span>CC: <strong className="font-mono text-slate-500">{demand.costCenterId}</strong></span>
                      <span>•</span>
                      <span>Anexos: <strong className="text-slate-500">{demand.attachments.length}</strong></span>
                      <span>•</span>
                      <span>Comentários: <strong className="text-slate-500">{demand.comments.length}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div className="space-y-0.5">
                      <span className="block text-[8px] text-slate-400 uppercase font-semibold">SLA Status</span>
                      <span className="text-[10px] font-mono text-slate-700 block">{demand.slaSpentHours}h / {demand.slaLimitHours}h</span>
                    </div>

                    <div className="text-right">
                      {getStatusBadge(demand.status)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-xs text-slate-400 space-y-2 select-none dialog">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p>Nenhuma solicitação aberta no seu histórico.</p>
                <p className="text-[10px] text-slate-400">Clique em "Abrir Solicitação" acima para iniciar seu primeiro formulário.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* New Request form wizard */
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b pb-2">
            <h3 className="text-base font-bold text-slate-900">Nova Solicitação de Processo</h3>
            <p className="text-xs text-slate-500">Insira as informações técnicas para triagem e automação de SLAs.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
            
            {formSuccess && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-green-700 font-bold">
                {formSuccess}
              </div>
            )}

            {formError && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-700 font-bold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Título da Solicitação</label>
                <input
                  id="portal-title-input"
                  type="text"
                  placeholder="Ex: Licença Enterprise Photoshop para Design"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Processo</label>
                <select
                  id="portal-type-input"
                  value={type}
                  onChange={(e) => setType(e.target.value as DemandType)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                >
                  <option value="COMPRAS">Compras / Orçamento</option>
                  <option value="REEMBOLSO">Reembolso de Despesas</option>
                  <option value="CONTRATOS">Minuta Contratual / Legal</option>
                  <option value="INVENTARIO">Kit Comodato / Tecnologia</option>
                  <option value="ESPORADICA">Outros Administrativos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Centro de Custo Provedor</label>
                <select
                  id="portal-cc-input"
                  value={costCenterId}
                  onChange={(e) => setCostCenterId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                >
                  {costCenters.map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.code} - {cc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Área Destino</label>
                <select
                  id="portal-area-input"
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                >
                  {areas.map(area => (
                    <option key={area.id} value={area.id}>{area.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Urgência / Prioridade</label>
                <select
                  id="portal-priority-input"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border rounded-lg"
                >
                  <option value="BAIXA">Baixa (Até 5 dias)</option>
                  <option value="MEDIA">Média (Até 3 dias)</option>
                  <option value="ALTA">Alta Urgência (Solucionar Já)</option>
                </select>
              </div>
            </div>

            {/* Procurement metadata helper if compras OR reembolso selected */}
            {(type === 'COMPRAS' || type === 'REEMBOLSO') && (
              <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-blue-700 uppercase mb-1">Fornecedor / Emitente Proposto</label>
                  <input
                    id="portal-vendor-input"
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="Nome da empresa ou parceiro..."
                    className="w-full p-2 bg-white border border-blue-200 rounded"
                  />
                </div>

                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-blue-700 uppercase mb-1">Valor Estimado (R$)</label>
                  <input
                    id="portal-value-input"
                    type="number"
                    value={estimatedValue}
                    onChange={(e) => setEstimatedValue(e.target.value)}
                    placeholder="Ex: 11200.00"
                    className="w-full p-2 bg-white border border-blue-200 rounded font-mono"
                  />
                  {type === 'COMPRAS' && Number(estimatedValue) > 10000 && (
                    <span className="text-[9px] text-blue-600 font-bold block mt-1 animate-pulse">
                      {"🔥 Alerta: Valor > R$ 10k aciona aprovação automática da Diretoria Executiva!"}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Descrição Detalhada do Pedido</label>
              <textarea
                id="portal-desc-input"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Declare especificações técnicas, quantitativos e datas limite cruciais..."
                className="w-full p-2.5 bg-slate-50 border rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Document Checklists Attachments mockup */}
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-205 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Comprovantes e Propostas Comerciais</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Telas, PDFs das cotações comerciais recomendadas (Mínimo de 3 requisitado corporativamente no POP Compras).</p>
                
                {uploadedFileNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {uploadedFileNames.map((name) => (
                      <span key={name} className="bg-white border rounded text-[10px] px-2 py-0.5 font-medium text-slate-600 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" /> {name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                id="btn-portal-attach"
                type="button"
                onClick={handleSimulateAttachment}
                className="bg-slate-800 hover:bg-slate-950 text-white font-bold py-1.5 px-3.5 rounded-lg inline-flex items-center gap-1 transition whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Simular Anexar Proposta
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t">
              <button
                id="btn-portal-reset"
                type="button"
                onClick={() => {
                  setTitle('');
                  setDescription('');
                  setUploadedFileNames([]);
                  setFormError('');
                }}
                className="text-slate-600 hover:text-slate-800 text-xs font-semibold"
              >
                Limpar Formulário
              </button>
              
              <button
                id="btn-portal-submit"
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-6 rounded-md transition shadow-xs"
              >
                Submeter Solicitação Oficial
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
};
