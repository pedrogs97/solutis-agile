/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Area, CostCenter, Project, Demand, Automation, RecurringTask, SLAConfiguration, StandardProcedure } from './types';

export const mockUsers: User[] = [
  { id: 'usr-admin', name: 'Carlos Eduardo (Admin)', role: 'ADMIN', email: 'carlos@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', areaId: 'area-ops' },
  { id: 'usr-gestor', name: 'Beatriz Mello (Gestor)', role: 'GESTOR', email: 'beatriz.mello@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80', areaId: 'area-ops' },
  { id: 'usr-analista', name: 'Rafael Santos (Analista)', role: 'ANALISTA', email: 'rafael.santos@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', areaId: 'area-fin' },
  { id: 'usr-solicitante', name: 'Ana Paula (Solicitante)', role: 'SOLICITANTE', email: 'ana.paula@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80', areaId: 'area-compras' },
  { id: 'usr-aprovador', name: 'Pedro Gustavo (Diretoria)', role: 'APROVADOR', email: 'pedrogustavo@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', areaId: 'area-dir' },
  { id: 'usr-observador', name: 'Mariana Costa (Observador)', role: 'OBSERVADOR', email: 'mariana.costa@flowta.com.br', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80', areaId: 'area-ops' },
];

export const mockAreas: Area[] = [
  { id: 'area-adm', name: 'Administrativo', description: 'Rotinas de governança e apoio institucional' },
  { id: 'area-fin', name: 'Financeiro', description: 'Controle de contas, reembolsos e pagamentos' },
  { id: 'area-ops', name: 'Operações', description: 'Logística, suprimentos e infraestrutura' },
  { id: 'area-compras', name: 'Compras', description: 'Cotações de fornecedores e compras corporativas' },
  { id: 'area-jur', name: 'Jurídico', description: 'Contratos, aprovações de minutas e conformidade' },
  { id: 'area-esg', name: 'ESG', description: 'Sustentabilidade, emissão e governança social' },
  { id: 'area-dir', name: 'Diretoria', description: 'Gestão estratégica e aprovações corporativas' },
];

export const mockCostCenters: CostCenter[] = [
  { id: 'cc-101', code: 'CC-101', name: 'Administrativo Geral' },
  { id: 'cc-102', code: 'CC-102', name: 'Operações e Logística' },
  { id: 'cc-103', code: 'CC-103', name: 'Finanças e Auditoria' },
  { id: 'cc-104', code: 'CC-104', name: 'ESG e Meio Ambiente' },
  { id: 'cc-201', code: 'CC-201', name: 'Diretoria Executiva' },
];

export const mockStandardProcedures: Record<string, StandardProcedure> = {
  COMPRAS: {
    flowsteps: ['Solicitado', 'Triagem', 'Cotação', 'Aprovação', 'Pedido Gerado', 'Recebimento', 'Finalizado'],
    procedureDocument: `### Procedimento Operacional Padrão (POP) - Compras

Este procedimento rege todas as aquisições corporativas efetuadas para garantir a conformidade fiscal e a melhor negociação mercadológica.

**1. Abertura:**
- O solicitante deve cadastrar a demanda informando a quantidade, descrição detalhada do produto/serviço, urgência e Centro de Custo apropriado.

**2. Cotações Obrigatórias:**
- Toda compra exige no mínimo **3 cotações de fornecedores distintos** anexados em PDF.
- Caso o fornecedor seja exclusivo, anexar carta de exclusividade assinada.

**3. Alçada de Aprovação:**
- Compras até **R$ 10.000,00:** Aprovação direta do gestor da área.
- Compras acima de **R$ 10.000,00:** Aprovação obrigatória da Diretoria Executiva (via fluxo automatizado).

**4. Recebimento e Evidência:**
- No recebimento físico ou prestação concluída, o responsável deve anexar a **Nota Fiscal (NF)** digitalizada juntamente com o termo de recebimento ou foto do produto descarregado para que a demanda possa ser movida a **Concluído**.`,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  REEMBOLSO: {
    flowsteps: ['Solicitação', 'Validação De Cupons', 'Aprovação Gestor', 'Agendamento Financeiro', 'Pago'],
    procedureDocument: `### Procedimento Operacional Padrão (POP) - Reembolsos de Despesas

Garante a transparência e rastreabilidade nos reembolsos de viagens, alimentação corporativa, combustível e despesas em campo.

**1. Prazos para Lançamento:**
- Todas as solicitações de reembolso de despesas devem ser cadastradas em até **15 dias corridos** após a ocorrência da despesa.

**2. Comprovação Obrigatória:**
- Inserir imagem legível do cupom fiscal, nota fiscal ou recibo oficial contendo o CNPJ do estabelecimento.
- **Rascunhos ou faturas de cartão de crédito não são válidos como comprovante principal.**

**3. Limites de Gastos:**
- Alimentação (Almoço ou Jantar): Limite máximo de **R$ 80,00 por refeição**.
- Km rodado: Valor fixado em **R$ 1,10 por quilômetro** mediante comprovante de rota (Print do Google Maps).

**4. Evidência Final:**
- O preenchimento do formulário de reembolso deve conter a justificativa do custo e o comprovante fiscal. A ausência de imagem do recibo bloqueia terminantemente a transição para Concluído.`,
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  },
  CONTRATOS: {
    flowsteps: ['Solicitação', 'Análise Preliminar', 'Bate de Minuta', 'Aprovação Jurídico', 'Assinatura Digital', 'Arquivamento'],
    procedureDocument: `### Procedimento de Revisão de Contratos e Atos Jurídicos

Garante a conformidade e mitigação de passivos jurídicos para todos os novos contratos corporativos e renovações.

**1. Documentação Exigida:**
- Minuta em formato editável (.docx), documentos de constituição do parceiro (Contrato Social/CNPJ) e as propostas comerciais originais.

**2. Fluxo de Análise:**
- Triagem jurídica avalia riscos contratuais, cláusulas de rescisão, LGPD e multas rescisórias.
- Mudanças sugeridas ocorrem de forma rastreável por comentários.

**3. Conclusão:**
- Apenas contratos assinados por meio de plataformas certificadas (ex: DocuSign) com certificado de autenticidade anexo são elegíveis a serem marcados como Concluídos.`,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  INVENTARIO: {
    flowsteps: ['Abertura', 'Verificação Estoque', 'Aprovação Comodato', 'Retirada/Logística', 'Termo Assinado'],
    procedureDocument: `### Controle e Cedência de Equipamentos e Comodato

Regulamenta o processo de entrega de computadores, coletores de dados, materiais administrativos e veículos de comodato para colaboradores.

**1. Solicitação:**
- O setor de Gente & Gestão solicita o kit corporativo com no mínimo **3 dias de antecedência** da data de admissão do colaborador.

**2. Verificação de Estoque:**
- O técnico de TI ou Almoxarifado confirma se há o equipamento solicitado, faz a vinculação do número de série do patrimônio no sistema e anexa o Termo de Entrega sob Comodato.

**3. Evidência Obrigatória:**
- Para concluir, deve-se fazer o upload da imagem digitalizada de todas as páginas do **Termo de Responsabilidade** devidamente assinadas e datadas pelo colaborador.`,
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  },
  ESG: {
    flowsteps: ['Levantamento ESG', 'Engajamento/Rotina', 'Ação Corretiva', 'Coleta Evidências', 'Auditoria Co2'],
    procedureDocument: `### Procedimento de Governança e Reporte Ambiental/Social (ESG)

Padroniza a coleta periódica de evidências para o cálculo de pegada de carbono, descarte de resíduos eletrônicos, e relatórios sociais.

**1. Lançamento:**
- Lançar mensalmente o consumo de energia elétrica (kWh, com PDF da conta), consumo de água (m³, com PDF), emissão estimadas de combustível da frota corporativa e relatórios de resíduos.

**2. Evidências Verificadas:**
- Todas as evidências deverão conter o carimbo da concessionária de serviços e estarem salvas como PDFs certificados.
- Emissões de CO2 devem seguir o protocolo GHG Protocol Brasil.`,
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  },
  ESPORADICA: {
    flowsteps: ['Solicitado', 'Em Análise', 'Executando', 'Concluído'],
    procedureDocument: `### Tratamento de Demandas Esporádicas ou Pontuais

Para situações e tarefas emergenciais de qualquer centro de custo que necessitem de rastreabilidade rápida e visibilidade do progresso de execução.

**1. Cadastro Simplificado:**
- Preencha o título claro, descrevendo a demanda, responsável da execução e o prazo limite.
- Defina o Centro de Custo impactado.

**2. Evidência:**
- Descreva detalhadamente o que foi resolvido e coloque ao menos um print do resultado como prova definitiva.`,
    videoUrl: 'https://www.w3schools.com/html/movie.mp4',
  }
};

export const mockInitialDemands: Demand[] = [
  {
    id: 'DEM-1001',
    type: 'COMPRAS',
    title: 'Compra de 5 Coletores de Dados Industriais',
    description: 'Necessitamos de 5 novos coletores de dados rugged Zebra TC21 para reposição do Centro de Distribuição do Centro-Oeste.',
    solicitorId: 'usr-solicitante',
    assigneeId: 'usr-analista',
    managerId: 'usr-gestor',
    observerIds: ['usr-observador'],
    priority: 'ALTA',
    status: 'EM_ANDAMENTO',
    approvalStatus: 'NENHUMA',
    slaLimitHours: 48,
    slaSpentHours: 12,
    dueDate: '2026-06-12T18:00:00Z',
    costCenterId: 'cc-102',
    areaId: 'area-ops',
    projectId: 'prj-1',
    attachments: [
      { id: 'att-1', name: 'Zebra_TC21_Quote_Vendor_A.pdf', size: '1.4 MB', url: '#', uploadedBy: 'Ana Paula', uploadedAt: '10/06/2026 09:00' },
      { id: 'att-2', name: 'Zebra_TC21_Quote_Vendor_B.pdf', size: '980 KB', url: '#', uploadedBy: 'Ana Paula', uploadedAt: '10/06/2026 10:15' }
    ],
    timeEstimatedHours: 8,
    timeSpentHours: 2,
    currentStageIndex: 2, // Cotacao stage
    comments: [
      { id: 'com-1', userId: 'usr-solicitante', text: 'Os coletores antigos estão travando muito e atrasando o embarque nas docas.', date: '10/06/2026 09:05' },
      { id: 'com-2', userId: 'usr-observador', text: 'Estou acompanhando o despacho para o CD-Oeste.', date: '10/06/2026 11:30' }
    ],
    history: [
      { id: 'hst-1', userId: 'usr-solicitante', action: 'Criou a demanda', date: '10/06/2026 09:00' },
      { id: 'hst-2', userId: 'usr-gestor', action: 'Atribuiu a tarefa para Rafael Santos (Analista)', date: '10/06/2026 09:12' },
      { id: 'hst-3', userId: 'usr-analista', action: 'Alterou status para Em Andamento', prevStatus: 'PENDENTE', nextStatus: 'EM_ANDAMENTO', date: '10/06/2026 10:00' }
    ]
  },
  {
    id: 'DEM-1002',
    type: 'REEMBOLSO',
    title: 'Reembolso Viagem de Auditoria em Campo - MG',
    description: 'Solicitação de reembolso de despesas de hotel, alimentação e combustível referentes à auditoria realizada na mina de Itabira - MG de 01 a 04 de Junho.',
    solicitorId: 'usr-analista',
    assigneeId: 'usr-analista',
    managerId: 'usr-gestor',
    observerIds: [],
    priority: 'MEDIA',
    status: 'EM_ANDAMENTO',
    approvalStatus: 'AGUARDANDO_APROVACAO',
    slaLimitHours: 72,
    slaSpentHours: 68, // close to warning!
    dueDate: '2026-06-11T14:30:00Z',
    costCenterId: 'cc-103',
    areaId: 'area-fin',
    attachments: [
      { id: 'att-x1', name: 'Relatorio_Despesas_MG.xlsx', size: '205 KB', url: '#', uploadedBy: 'Rafael Santos', uploadedAt: '08/06/2026 16:00' }
    ],
    timeEstimatedHours: 6,
    timeSpentHours: 4,
    currentStageIndex: 2, // Aprovação gestor
    comments: [
      { id: 'com-3', userId: 'usr-analista', text: 'Todos os cupons originais foram escaneados. Favor analisar urgência, o cartão corporativo já estourou.', date: '08/06/2026 16:15' }
    ],
    history: [
      { id: 'hst-x1', userId: 'usr-analista', action: 'Criou a demanda', date: '08/06/2026 16:00' },
      { id: 'hst-x2', userId: 'usr-analista', action: 'Iniciou a execução', date: '08/06/2026 16:05' },
      { id: 'hst-x3', userId: 'usr-analista', action: 'Submeteu para aprovação', date: '09/06/2026 10:00' }
    ]
  },
  {
    id: 'DEM-1003',
    type: 'ESG',
    title: 'Relatório Mensal de Pegada de Carbono - Maio 2026',
    description: 'Consolidação das emissões de frete terceirizado e consumo de energia em todas as 4 filiais administrativas de acordo com a metodologia GHG Protocol.',
    solicitorId: 'usr-solicitante',
    assigneeId: 'usr-analista',
    managerId: 'usr-gestor',
    observerIds: ['usr-observador', 'usr-admin'],
    priority: 'MEDIA',
    status: 'PENDENTE',
    approvalStatus: 'NENHUMA',
    slaLimitHours: 120,
    slaSpentHours: 5,
    dueDate: '2026-06-15T22:00:00Z',
    costCenterId: 'cc-104',
    areaId: 'area-esg',
    projectId: 'prj-2',
    attachments: [],
    timeEstimatedHours: 16,
    timeSpentHours: 0,
    currentStageIndex: 0,
    comments: [],
    history: [
      { id: 'hst-y1', userId: 'usr-solicitante', action: 'Criada via rotina de automação recorrente mensal', date: '10/06/2026 00:00' }
    ]
  },
  {
    id: 'DEM-1004',
    type: 'CONTRATOS',
    title: 'Revisão Contrato de Outsourcing de Suporte de TI',
    description: 'Análise de cláusula de retenção, SLAs e penalidades contratuais da nova provedora de Services Desk (TechSupport Inc).',
    solicitorId: 'usr-solicitante',
    assigneeId: null, // Unassigned! Test delegation
    managerId: 'usr-gestor',
    observerIds: [],
    priority: 'ALTA',
    status: 'PENDENTE',
    approvalStatus: 'NENHUMA',
    slaLimitHours: 24,
    slaSpentHours: 28, // Overdue SLA !
    dueDate: '2026-06-09T18:00:00Z',
    costCenterId: 'cc-101',
    areaId: 'area-jur',
    projectId: 'prj-3',
    attachments: [
      { id: 'att-z1', name: 'Contract_Draft_V1_TechSupport_Inc.docx', size: '2.1 MB', url: '#', uploadedBy: 'Ana Paula', uploadedAt: '08/06/2026 10:00' }
    ],
    timeEstimatedHours: 4,
    timeSpentHours: 0,
    currentStageIndex: 0,
    comments: [
      { id: 'com-10', userId: 'usr-solicitante', text: 'O contrato antigo expira na próxima semana. Precisamos desse urgente!', date: '08/06/2026 10:02' }
    ],
    history: [
      { id: 'hst-z1', userId: 'usr-solicitante', action: 'Criou o contrato preliminar', date: '08/06/2026 10:00' }
    ]
  },
  {
    id: 'DEM-1005',
    type: 'COMPRAS',
    title: 'Servidor de Armazenamento NAS Executivo',
    description: 'Solicitação de servidor Synology 12-bay NAS para backup frio do Centro de Processamento Central. Orçamento superior a R$ 15.000,00.',
    solicitorId: 'usr-solicitante',
    assigneeId: 'usr-analista',
    managerId: 'usr-gestor',
    observerIds: ['usr-admin'],
    priority: 'MEDIA',
    status: 'CONCLUIDO',
    approvalStatus: 'APROVADO',
    slaLimitHours: 48,
    slaSpentHours: 36,
    dueDate: '2026-06-08T18:00:00Z',
    costCenterId: 'cc-201', // Executive Director CC
    areaId: 'area-ops',
    projectId: 'prj-1',
    attachments: [
      { id: 'att-e1', name: 'Synology_Server_NF-45812.pdf', size: '4.5 MB', url: '#', uploadedBy: 'Rafael Santos', uploadedAt: '08/06/2026 13:00' }
    ],
    evidenceDescription: 'Servidor recebido de forma integrada no almoxarifado no bloco B, testado e montado no rack de backup. Linkando nota e termos assinados.',
    evidenceAttachmentId: 'att-e1',
    feedback: {
      managerId: 'usr-gestor',
      rating: 5,
      comment: 'Execução exemplar e dentro do prazo estimado. Nenhuma inconformidade registrada de patrimônio.',
      isNegative: false,
      date: '08/06/2026 15:00'
    },
    timeEstimatedHours: 6,
    timeSpentHours: 5.5,
    currentStageIndex: 6, // Finalizado stage
    comments: [
      { id: 'com-e1', userId: 'usr-analista', text: 'Tudo pronto. Equipamento cadastrado patrimonialmente.', date: '08/06/2026 13:02' }
    ],
    history: [
      { id: 'hst-e1', userId: 'usr-solicitante', action: 'Cadastrou pedido de servidor', date: '06/06/2026 09:00' },
      { id: 'hst-e2', userId: 'usr-admin', action: 'Aprovação Direção desencadeada por valor > 10K', date: '06/06/2026 10:15' },
      { id: 'hst-e3', userId: 'usr-analista', action: 'Preencheu evidência e concluiu processo', date: '08/06/2026 13:00' },
      { id: 'hst-e4', userId: 'usr-gestor', action: 'Analisou evidência e deu feedback positivo final', date: '08/06/2026 15:00' }
    ]
  },
  {
    id: 'DEM-1006',
    type: 'REEMBOLSO',
    title: 'Despesas Almoço Clientes Consultoria',
    description: 'Almoço de relacionamento comercial com assessores fiscais na churrascaria Fogo de Chão.',
    solicitorId: 'usr-analista',
    assigneeId: 'usr-analista',
    managerId: 'usr-gestor',
    observerIds: [],
    priority: 'BAIXA',
    status: 'CONCLUIDO',
    approvalStatus: 'REJEITADO',
    slaLimitHours: 48,
    slaSpentHours: 14,
    dueDate: '2026-06-08T12:00:00Z',
    costCenterId: 'cc-103',
    areaId: 'area-fin',
    attachments: [
      { id: 'att-f1', name: 'Churrascaria_Recibo.jpg', size: '1.2 MB', url: '#', uploadedBy: 'Rafael Santos', uploadedAt: '07/06/2026 15:00' }
    ],
    evidenceDescription: 'Anexada a conta do Fogo de Chão. Valor total R$ 420.00.',
    evidenceAttachmentId: 'att-f1',
    feedback: {
      managerId: 'usr-gestor',
      rating: 1,
      comment: 'Despesa fora da política! O limite estabelecido por refeição é R$ 80,00. Ultrapassou o limite e será glosada a diferença.',
      isNegative: true,
      boundaryValueExceeded: true, // Custom flag to showcase error feedback
      date: '08/06/2026 10:00'
    } as any,
    timeEstimatedHours: 2,
    timeSpentHours: 1.5,
    currentStageIndex: 4,
    comments: [
      { id: 'com-f1', userId: 'usr-gestor', text: 'Precisamos de justificativa por e-mail para despesas acima do teto de R$ 80 antes da transação.', date: '08/06/2026 09:45' }
    ],
    history: [
      { id: 'hst-f1', userId: 'usr-analista', action: 'Criou reembolso', date: '07/06/2026 14:00' },
      { id: 'hst-f2', userId: 'usr-gestor', action: 'Contestou valor e deu feedback negativo', date: '08/06/2026 10:00' }
    ]
  }
];

export const mockInitialAutomations: Automation[] = [
  {
    id: 'aut-1',
    name: 'Aprovação Executiva Automática (Compras > 10K)',
    trigger: 'AO_CRIAR',
    conditionField: 'value',
    conditionOperator: '>',
    conditionValue: '10000',
    action: 'ENVIAR_APROVACAO_DIRETORIA',
    destinationUserOrRole: 'usr-aprovador',
    isActive: true,
  },
  {
    id: 'aut-2',
    name: 'Alerta de Escalação de SLA Vencido',
    trigger: 'AO_SLA_VENCER',
    action: 'NOTIFICAR_GESTOR',
    destinationUserOrRole: 'usr-gestor',
    isActive: true,
  },
  {
    id: 'aut-3',
    name: 'Triagem Automática de Contratos',
    trigger: 'AO_CRIAR',
    conditionField: 'type',
    conditionOperator: '==',
    conditionValue: 'CONTRATOS',
    action: 'ATRIBUIR_ANALISTA',
    destinationUserOrRole: 'usr-analista',
    isActive: true,
  }
];

export const mockInitialRecurringTasks: RecurringTask[] = [
  {
    id: 'rec-1',
    title: 'Apuração e Fechamento Financeiro Mensal',
    frequency: 'MENSAL',
    areaId: 'area-fin',
    costCenterId: 'cc-103',
    checklist: [
      'Conciliação de saldos das 4 contas correntes',
      'Verificação e consolidação de comprovantes de reembolso no mês',
      'Importação de notas fiscais de fornecedores emitidas',
      'Revisão de faturamento intercompany e envio para a contabilidade externa',
      'DRE estruturada anexada ao comitê de diretoria'
    ],
    lastGenerated: '10/05/2026',
    nextGeneration: '10/06/2026'
  },
  {
    id: 'rec-2',
    title: 'Envio de Evidências Multilaterais ESG',
    frequency: 'QUINZENAL',
    areaId: 'area-esg',
    costCenterId: 'cc-104',
    checklist: [
      'Coleção das contas de energia do centro oeste e sul',
      'Consolidação do manifesto de descarte de resíduos perigosos da oficina',
      'Auditoria de conformidade de equidade em posições de liderança'
    ],
    lastGenerated: '01/06/2026',
    nextGeneration: '15/06/2026'
  },
  {
    id: 'rec-3',
    title: 'Conferência Física de Inventário e Almoxarifado',
    frequency: 'SEMANAL',
    areaId: 'area-ops',
    costCenterId: 'cc-102',
    checklist: [
      'Leitura de QR codes de coletores livres no carregador',
      'Conferência de EPIs em prateleira e lacres de emergência',
      'Assinatura da ata semanal logística'
    ],
    lastGenerated: '08/06/2026',
    nextGeneration: '15/06/2026'
  }
];

export const mockSlaConfigs: SLAConfiguration[] = [
  { id: 'sla-1', demandType: 'COMPRAS', priority: 'ALTA', limitHours: 48 },
  { id: 'sla-2', demandType: 'COMPRAS', priority: 'MEDIA', limitHours: 72 },
  { id: 'sla-3', demandType: 'COMPRAS', priority: 'BAIXA', limitHours: 120 },
  { id: 'sla-4', demandType: 'REEMBOLSO', priority: 'ALTA', limitHours: 24 },
  { id: 'sla-5', demandType: 'REEMBOLSO', priority: 'MEDIA', limitHours: 48 },
  { id: 'sla-6', demandType: 'CONTRATOS', priority: 'ALTA', limitHours: 24 },
  { id: 'sla-7', demandType: 'ESG', priority: 'MEDIA', limitHours: 96 },
];

export const mockInitialProjects: Project[] = [
  {
    id: 'prj-1',
    name: 'Expansão e Modernização CD-Centro-Oeste',
    description: 'Processo integrado de restruturação física, hardware de leitura (coletores) e infraestrutura de TI do Hub de Distribuição logística em Goiás.',
    status: 'EM_ANDAMENTO',
    dueDate: '2026-07-20',
    areaId: 'area-ops',
    creatorId: 'usr-gestor'
  },
  {
    id: 'prj-2',
    name: 'Campanhas de Descarbonização e Reporte de Combustível',
    description: 'Acompanhamento do fechamento de pegadas de Co2 e adequação do consumo logístico de poluentes fósseis.',
    status: 'EM_ANDAMENTO',
    dueDate: '2026-06-30',
    areaId: 'area-esg',
    creatorId: 'usr-aprovador'
  },
  {
    id: 'prj-3',
    name: 'Auditoria e Compliance Jurídico de Terceiros',
    description: 'Garantir que todos os contratos de outsourcing de TI e novos fornecedores de auditoria externa passem pelo fluxo de conformidade regulatória vigente.',
    status: 'PLANEJADO',
    dueDate: '2026-08-15',
    areaId: 'area-jur',
    creatorId: 'usr-admin'
  }
];
