export type UserRole = 'ADMIN' | 'CONSELHEIRO' | 'ADMINISTRATIVO' | 'SUPLENTE';
export type UserStatus = 'ATIVO' | 'BLOQUEADO' | 'INATIVO' | 'AFASTADO' | 'EXCLUIDO';
export type ViolenceType = 'FÍSICA' | 'PSICOLÓGICA' | 'SEXUAL' | 'NEGLIGÊNCIA' | 'OUTROS';
export type SuspectType = 'PAI' | 'MAE' | 'PADRASTO' | 'MADRASTA' | 'TIOS' | 'TERCEIROS' | 'DESCONHECIDO';

export interface User {
  id: string;
  nome: string;
  perfil: UserRole;
  cargo: string;
  unidade_id?: number;
  status?: UserStatus;
  tentativas_login?: number;
  substituicao_ativa?: boolean;
  substituindo_id?: string;
  data_inicio_substituicao?: string;
  data_fim_prevista?: string;
  is_suplente_active?: boolean;
  real_user_id?: string;
  substituted_name?: string;
  substituicao_permanente_por?: string;
  termo_aceito_em?: string;
  termo_versao?: string;
  deletado_em?: string;
  current_session_id?: string;
  last_heartbeat?: string;
}

export type DocumentStatus = 
  | 'NAO_LIDO' 
  | 'EM_PREENCHIMENTO'
  | 'AGUARDANDO_VALIDACAO'
  | 'OFICIALIZADO'
  | 'CONCLUIDO'
  | 'ENCERRADO'
  | 'NOTIFICADO'
  | 'AVALIAR_EM_COLEGIADO'
  | 'TIPIFICACAO_INCOMPLETA'
  | 'AGUARDANDO_ANALISE'
  | 'AGUARDANDO_DOCUMENTO'
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
  | 'SOLICITAR_REUNIAO_DE_REDE'
  | 'MEDIDA_APLICADA'
  | 'MEDIDA_PENDENTE'
  | 'NOTIFICACAO_LEANDRO'
  | 'NOTIFICACAO_LUIZA'
  | 'NOTIFICACAO_MILENA'
  | 'NOTIFICACAO_MIRIAN'
  | 'NOTIFICACAO_SANDRA'
  | 'NOTIFICACAO_ROSILDA'
  | 'NOTIFICACAO_ALINE'
  | 'NOTIFICACAO_EDSON LOPES'
  | 'NOTIFICACAO_FABIO'
  | 'NOTIFICACAO_MARCIA'
  | 'NOTIFICACAO_MATHEUS'
  | 'TODAS_MEDIDAS_APLICADAS'
  | 'MARCAR_REUNIAO_REDE'
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

export interface Oficio {
  id: string;
  numero: string;
  numero_comunicado?: string;
  numero_sipia?: string;
  prazo: string; // Date string
  data_emissao: string;
  concluido?: boolean;
  excluido?: boolean;
}

export interface MonitoringInfo {
  concluido: boolean;
  prazoEsperado: string;
  historicoPrazos?: HistoricoPrazo[];
  requisicoes?: RequisicaoServico[];
  oficios?: Oficio[];
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

export interface AlertaStatusReferencia {
  id: string;
  documento_id: string;
  conselheiro_referencia_id: string;
  alterado_por_id: string;
  alterado_por_nome: string;
  status_anterior: string;
  status_novo: string;
  data_hora: string;
  lido: boolean;
  ciência_data_hora?: string;
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
  outro_membro_nome?: string;
  outro_membro_parentesco?: string;
  outro_membro_cpf?: string;
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
  numero_comunicado_violacao?: string;
  numero_sipia?: string;
  is_family_persistence?: boolean;
  is_manual_providencia?: boolean;
  providencia_imediata_manual?: string;
  local_ocorrencia?: string;
  alertas_status_referencia?: AlertaStatusReferencia[];
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
  error?: string;
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
  genitores_responsavel?: string;
  documento_id?: string;
  descricao: string;
  tipo: string;
  status?: 'PENDENTE' | 'COMPARECEU' | 'NAO_COMPARECEU' | 'REAGENDADO';
  excluido?: boolean;
}

export interface ScaleException {
  id: string;
  data: string; // YYYY-MM-DD (the duty/scale date)
  unidade_id: number;
  conselheiro_original_id: string;
  conselheiro_original_nome: string;
  conselheiro_substituto_id: string;
  conselheiro_substituto_nome: string;
  justificativa?: string;
  criado_em?: string;
  criado_por_id?: string;
  criado_por_nome?: string;
  inicio_data?: string;
  inicio_hora?: string;
  fim_data?: string;
  fim_hora?: string;
}

export interface ChatMessage {
  id: string;
  unidade_id: number;
  sender_id: string;
  sender_name: string;
  sender_cargo?: string;
  sender_perfil?: string;
  text: string;
  created_at: string;
  recipient_id?: string; // 'ALL' or specific user ID
  read_by?: string[];
  deleted_for?: string[];
}

