export type UserRole = 'ADMIN' | 'CONSELHEIRO' | 'ADMINISTRATIVO' | 'SUPLENTE';
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'INATIVO' | 'AFASTADO';
export type ViolenceType = 'FÍSICA' | 'PSICOLÓGICA' | 'SEXUAL' | 'NEGLIGÊNCIA' | 'OUTROS';
export type SuspectType = 'PAI' | 'MAE' | 'PADRASTO' | 'MADRASTA' | 'TIOS' | 'TERCEIROS' | 'DESCONHECIDO';

export interface User {
  id: string;
  nome: string;
  perfil: UserRole;
  cargo: string;
  unidade_id: number;
  status?: UserStatus;
  tentativas_login?: number;
  substituicao_ativa?: boolean;
  substituindo_id?: string;
  data_inicio_substituicao?: string;
  data_fim_prevista?: string;
}

export type DocumentStatus = 
  | 'NAO_LIDO' 
  | 'EM_PREENCHIMENTO'
  | 'AGUARDANDO_VALIDACAO'
  | 'OFICIALIZADO'
  | 'CONCLUIDO'
  | 'TIPIFICACAO_INCOMPLETA'
  | 'AGUARDANDO_ANALISE'
  | 'ARQUIVADO'
  | 'MONITORAMENTO'
  | 'AGENDAR_REUNIAO_REDE'
  | 'AGUARDAR_RESPOSTA_EMAIL'
  | 'EMAIL_RESPONDIDO'
  | 'ENCAMINHAR_NOTICIA_FATO'
  | 'NOTIFICAR'
  | 'OFICIO_RESPONDIDO'
  | 'RESPONDER_EMAIL'
  | 'SOLICITAR_REUNIAO_REDE'
  | 'MEDIDA_APLICADA'
  | 'NOTIFICACAO_LEANDRO'
  | 'NOTIFICACAO_LUIZA'
  | 'NOTIFICACAO_MILENA'
  | 'NOTIFICACAO_MIRIAN'
  | 'NOTIFICACAO_SANDRA'
  | 'NOTIFICACAO_ROSILDA'
  | 'DIREITO_NAO_VIOLADO'
  | 'NENHUMA'
  | 'AGUARDANDO_AVALIACAO';

export interface MedidaConfirmacao {
  usuario_id: string;
  usuario_nome: string;
  data_hora: string;
}

export interface MedidaAplicada {
  id: string;
  artigo_inciso: string;
  texto: string;
  autor_id: string;
  autor_nome: string;
  data_lancamento: string;
  conselheiros_requeridos: string[]; 
  confirmacoes: MedidaConfirmacao[];
}

export interface HistoricoPrazo {
  data_anterior: string;
  data_nova: string;
  justificativa: string;
  usuario_nome: string;
  data_registro: string;
}

export interface RequisicaoServico {
  id: string;
  area: string;
  servico: string;
  prazo: string;
  prazo_custom?: string;
  servico_custom?: string;
  dataFinal: string;
  observacao?: string;
  concluido?: boolean;
  isForaDaRede?: boolean;
  excluidoDoMonitoramento?: boolean;
}

export interface MonitoringInfo {
  concluido: boolean;
  prazoEsperado: string;
  historicoPrazos?: HistoricoPrazo[];
  requisicoes?: RequisicaoServico[];
}

export interface HistoricoMonitoramento {
  id: string;
  texto: string;
  data_hora: string;
  usuario_nome: string;
}

export interface SnapshotComparativo {
  violacoesSipia: SipiaViolation[];
  agentesVioladores: AgenteVioladorEntry[];
  medidas_detalhadas: MedidaAplicada[];
  atribuicoes_136: string[];
  observacao_monitoramento: string;
}

export interface Documento {
  id: string;
  unidade_id: number;
  origem: string;
  canal_comunicado: string; 
  notificacao?: string;
  data_recebimento: string;
  hora_rece_bimento?: string;
  data_aporte: string;
  hora_aporte: string;
  periodo_rece_bimento?: 'COMERCIAL' | 'PLANTAO';
  crianca_nome: string; 
  criancas: ChildData[]; 
  genitora_nome: string;
  genitora_nao_informado?: boolean;
  cpf_genitora?: string; 
  cpf_crianca?: string;
  bairro: string; 
  endereco?: string;
  telefone?: string;
  informacoes_documento: string; 
  violacoesSipia: SipiaViolation[];
  agentesVioladores: AgenteVioladorEntry[];
  violencias?: ViolenceType[];
  medidas_detalhadas?: MedidaAplicada[];
  atribuicoes_136?: string[];
  atribuicoes_136_detalhadas?: Atribuicao136Entry[];
  fundamentacao_tecnica?: string; 
  relato_providencias?: string; 
  observacoes_iniciais: string;
  status: DocumentStatus[];
  conselheiro_referencia_id: string;
  conselheiro_referencia_nome?: string;
  conselheiro_providencia_id: string; 
  conselheiro_providencia_nome?: string;
  conselheiros_providencia_nomes: string[];
  criado_em: string;
  is_improcedente?: boolean;
  justificativa_improcedencia?: string;
  despacho_situacao?: string;
  observacao_monitoramento?: string; 
  monitoramento?: MonitoringInfo;
  historico_monitoramento?: HistoricoMonitoramento[];
  criado_por_id?: string;
  ciência_registrada_por?: string[];
  distribuicao_automatica?: boolean;
  is_manual_override?: boolean;
  snapshot_validado?: SnapshotComparativo;
  justificativa_distribuicao?: string;
  historico_versoes?: any[];
  notificacoes_trio?: string[];
}

export interface Atribuicao136Entry {
  id: string;
  inciso: string;
  texto: string;
  servicos?: RequisicaoServico[];
}

export type LogType = 'SEGURANÇA' | 'DOCUMENTO' | 'SISTEMA' | 'VALIDAÇÃO' | 'MONITORAMENTO';

export interface Log {
  id: string;
  unidade_id: number;
  documento_id: string;
  usuario_id: string;
  usuario_nome: string;
  acao: string;
  tipo: LogType;
  data_hora: string;
}

export interface ChildData {
  nome: string;
  nao_informado?: boolean;
  data_nascimento: string;
  cpf?: string;
  genero_identidade: string;
  idade_calculada?: number;
  categoria_idade?: string;
}

export interface SipiaViolation {
  fundamental: string;
  grupo: string;
  especifico: string;
}

export interface AgenteVioladorEntry {
  principal: string; 
  categoria: string; 
  tipo: 'PRINCIPAL' | 'SECUNDARIO';
}

export interface DocumentFile {
  id: string;
  unidade_id: number;
  nome: string;
  tamanho: number;
  tipo: string;
  url: string;
  data_upload: string;
}

export interface AgendaEntry {
  id: string;
  unidade_id: number;
  conselheiro_id: string;
  data: string;
  hora: string;
  local: string;
  participantes: string;
  descricao: string;
  tipo: 'REUNIAO' | 'VISITA' | 'AUDIENCIA' | 'OUTROS';
}
