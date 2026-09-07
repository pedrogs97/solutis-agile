export interface PurchaseIdentification {
  data?: string | null
  categoria: 'Normal' | 'Urgência' | 'Prioridade' | string
  modalidade: 'Serviço' | 'Produto' | string
  centroCusto: string
  objeto: string
  tipoContratacao: 'Compra nova' | 'Renovação' | 'Substituição' | 'Emergencial' | string
  risco: 'Baixo' | 'Médio' | 'Alto' | 'Crítico' | string
  solicitante: string
  compradorResponsavel: string
}

export interface PurchaseSupplier {
  id: string
  nome: string
  cnpj: string
  desconto: number
  impostos: number
  frete: number
  outros: number
  valorBrutoManual?: number | null
  orcado?: number | null
  condPagamento: string
  prazoEntrega: string
  validadeProposta: string
  garantia: string
  obs: string
}

export interface PurchaseItem {
  id: string
  descricao: string
  qtd: number
  unidade: string
  precos: Record<string, number | null | undefined>
}

export interface PurchaseDecision {
  fornecedorRecomendadoId: string
  minimoAtingido: 'sim' | 'nao' | string
  motivoKey: string
  justificativa: string
  recomendacao: string
  observacoes: string
}

export interface PurchaseApproval {
  status: 'Pendente' | 'Em análise' | 'Aprovado' | 'Reprovado' | 'Dispensado' | string
  aprovadoPor: string
  dataDecisao: string
  comentario: string
}

export interface EvaluationCriterionValue {
  status?: 'Sim' | 'Não' | 'Razoável' | string
  nivel?: 'Muito Satisfeito' | 'Satisfeito' | 'Regularmente Satisfeito' | 'Insatisfatório' | string
  obs?: string
}

export interface PurchaseEvaluation {
  preenchida: boolean
  razaoSocial: string
  cnpj: string
  descritivoCompra: string
  nfNumero: string
  dataCompra: string
  criterios: Record<string, EvaluationCriterionValue>
  avaliador: string
  dataAvaliacao: string
}

export interface PurchaseProcessComputed {
  valorProcesso: number
  menorCta?: number | null
  maiorCta?: number | null
  economiaEstimada: number
  indiceAvaliacao?: number | null
  classificacaoDesempenho?: 'Excelente' | 'Satisfatório' | 'Atenção' | 'Insatisfatório' | string | null
  fornecedorRecomendadoNome?: string | null
}

export interface PurchaseProcess {
  id: string
  schemaVersion: number
  criadoEm: string
  atualizadoEm: string
  identificacao: PurchaseIdentification
  fornecedores: PurchaseSupplier[]
  itens: PurchaseItem[]
  decisao: PurchaseDecision
  aprovacao: PurchaseApproval
  avaliacao: PurchaseEvaluation
  computed?: PurchaseProcessComputed
}

export interface PurchaseProcessSummary {
  id: string
  data?: string | null
  objeto: string
  categoria: string
  solicitante: string
  compradorResponsavel: string
  fornecedorRecomendadoNome?: string | null
  valorProcesso: number
  status: string
  criadoEm: string
  atualizadoEm: string
}

export interface PaginatedPurchaseProcessList {
  count: number
  items: PurchaseProcessSummary[]
  page: number
  pageSize: number
  totalPages: number
}

export interface MetricDistributionItem {
  label: string
  value: number
  display: string
  color?: string
}

export interface MonthlyTrendItem {
  key: string
  label: string
  value: number
}

export interface AgingQueueItem {
  id: string
  objeto: string
  compradorResponsavel: string
  status: string
  diasAguardando: number
}

export interface PurchaseProcessMetrics {
  totalProcessos: number
  valorTotalAprovado: number
  ticketMedio: number
  economiaIdentificada: number
  tempoMedioDecisaoDias?: number | null
  taxaConformidadeCotacao?: number | null
  statusDistribution: MetricDistributionItem[]
  monthlyTrend: MonthlyTrendItem[]
  categoryDistribution: MetricDistributionItem[]
  agingQueue: AgingQueueItem[]
  topBuyers: MetricDistributionItem[]
  supplierEvaluationDistribution: MetricDistributionItem[]
}

export interface MotivoCotacao {
  key: string
  label: string
  texto: string
}

export const MOTIVOS_COTACAO: MotivoCotacao[] = [
  { key: 'fornecedor_exclusivo', label: 'Fornecedor exclusivo', texto: 'Contratação realizada com fornecedor exclusivo para o objeto, não sendo aplicável a realização de cotação comparativa.' },
  { key: 'produto_exclusivo', label: 'Produto/serviço exclusivo', texto: 'Item/serviço de fornecimento exclusivo, sem alternativa equivalente aplicável à necessidade da Solutis.' },
  { key: 'unico_fornecedor', label: 'Único fornecedor disponível', texto: 'Identificado único fornecedor apto a atender aos requisitos e condições necessários para a contratação.' },
  { key: 'ingressos', label: 'Compra de ingressos/inscrições', texto: 'Aquisição realizada diretamente junto ao organizador ou canal oficial do evento, não sendo aplicável a cotação entre fornecedores.' },
  { key: 'inscricao_curso', label: 'Inscrição em curso/evento', texto: 'Contratação vinculada a curso/evento específico e realizada junto ao organizador ou representante autorizado.' },
  { key: 'renovacao_licenca', label: 'Renovação de licença/assinatura', texto: 'Renovação de solução já utilizada pela Solutis, realizada com o fornecedor/fabricante responsável pela continuidade do serviço.' },
  { key: 'canal_autorizado', label: 'Fabricante/canal autorizado', texto: 'Aquisição realizada diretamente com fabricante ou canal autorizado, em razão das características específicas do objeto.' },
  { key: 'compatibilidade', label: 'Compatibilidade/padronização', texto: 'Aquisição necessária para garantir compatibilidade ou padronização com solução, equipamento ou ambiente já existente.' },
  { key: 'continuidade', label: 'Continuidade do serviço', texto: 'Manutenção do fornecedor necessária para assegurar a continuidade do serviço e evitar impactos operacionais decorrentes da substituição.' },
  { key: 'emergencial', label: 'Emergencial', texto: 'Contratação necessária para atendimento de demanda emergencial, cujo prazo inviabiliza o processo regular de cotação.' },
  { key: 'mercado_restrito', label: 'Mercado restrito', texto: 'Mercado com quantidade limitada de fornecedores aptos ao atendimento dos requisitos definidos, impossibilitando a obtenção do número regular de cotações.' },
  { key: 'preco_tabelado', label: 'Preço tabelado/oficial', texto: 'Aquisição com preço oficial ou tabelado, sem possibilidade de competição comercial relevante entre fornecedores.' },
  { key: 'demanda_cliente', label: 'Demanda específica do cliente', texto: 'Fornecedor/produto definido em função de requisito específico do cliente ou do projeto, não sendo aplicável a comparação com alternativas.' },
  { key: 'baixo_valor', label: 'Baixo valor', texto: 'Aquisição de baixo valor, enquadrada nos critérios internos aplicáveis para simplificação do processo de cotação.' },
  { key: 'outros', label: 'Outros', texto: 'Cotação comparativa não aplicável em razão das características específicas da contratação, conforme justificativa registrada.' }
]

export const CATEGORIAS = ['Normal', 'Urgência', 'Prioridade'] as const
export const MODALIDADES = ['Serviço', 'Produto'] as const
export const TIPOS_CONTRATACAO = ['Compra nova', 'Renovação', 'Substituição', 'Emergencial'] as const
export const RISCOS = ['Baixo', 'Médio', 'Alto', 'Crítico'] as const
export const STATUS_LIST = ['Pendente', 'Em análise', 'Aprovado', 'Reprovado', 'Dispensado'] as const
export const UNIDADES = ['UN', 'CX', 'KG', 'L', 'M', 'M²', 'M³', 'H', 'PC', 'SV', 'KIT', 'PAR', 'RESMA'] as const

export interface NivelSatisfacao {
  label: 'Muito Satisfeito' | 'Satisfeito' | 'Regularmente Satisfeito' | 'Insatisfatório'
  valor: number
}

export const NIVEIS_SATISFACAO: NivelSatisfacao[] = [
  { label: 'Muito Satisfeito', valor: 1 },
  { label: 'Satisfeito', valor: 0.9 },
  { label: 'Regularmente Satisfeito', valor: 0.6 },
  { label: 'Insatisfatório', valor: 0.3 }
]

export interface CriterioAvaliacao {
  key: string
  num: string
  label: string
  pergunta: string
}

export const CRITERIOS_AVALIACAO: CriterioAvaliacao[] = [
  { key: 'qualidade', num: '1', label: 'Qualidade do Produto/Serviço', pergunta: 'Conforme solicitado?' },
  { key: 'prazo', num: '2', label: 'Prazo', pergunta: 'Atendimento aos prazos estabelecidos?' },
  { key: 'pagamento', num: '3', label: 'Condição de Pagamento', pergunta: 'Conforme requisitado?' },
  { key: 'custo', num: '4', label: 'Custo', pergunta: 'Conforme estabelecido?' },
  { key: 'atendimento', num: '5', label: 'Atendimento', pergunta: 'Cortesia / cordialidade?' },
  { key: 'logistica', num: '6', label: 'Logística', pergunta: 'Conforme estabelecido?' }
]
