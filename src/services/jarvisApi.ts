// ============================================================================
// JARVIS API CLIENT (FRONTEND SERVICE)
// ============================================================================

export interface CorrecaoItem {
  original: string;
  corrigido: string;
  categoria: string;
  gravidade: 'ERRO' | 'INADEQUACAO' | 'ESTILO';
  explicacao: string;
  regra: string;
}

export interface ResultadoCorrecao {
  texto_corrigido: string;
  resumo: string;
  nivel_formalidade: 'INFORMAL' | 'NEUTRO' | 'FORMAL' | 'OFICIAL';
  correcoes: CorrecaoItem[];
  alertas_juridicos?: string[];
  alertas_sigilo?: string[];
  sugestoes_estrutura?: string[];
  meta?: {
    modo: string;
    caracteres_original: number;
    caracteres_corrigido: number;
    total_correcoes: number;
  };
}

export interface GerarDocumentoParams {
  tipo: 'OFICIO' | 'RELATORIO_TECNICO' | 'RELATORIO_CMDCA' | 'NOTIFICACAO' | 'REQUISICAO_SERVICO' | 'DESPACHO_PROTETIVO';
  destinatario?: string;
  cargoDestinatario?: string;
  orgao?: string;
  assunto: string;
  fatos: string;
  numeroProcedimento?: string;
  conselheiroNome?: string;
  unidade?: number;
}

export interface ResultadoDocumento {
  tipo: string;
  documento: string;
  conselheiro: string;
  unidade: number;
  criado_em: string;
}

export interface RespostaChatJarvis {
  text: string;
  groundingMetadata?: any;
  fontes?: string[];
  buscaExecutada?: boolean;
  timestamp?: string;
}

/**
 * Envia um texto para o módulo especialista de revisão do JARVIS.
 */
export async function corrigirTexto(
  texto: string,
  modo: 'ORTOGRAFICA' | 'COMPLETA' | 'OFICIAL' | 'TECNICA' | 'SIMPLES' = 'COMPLETA',
  tipoDocumento = ''
): Promise<ResultadoCorrecao> {
  const res = await fetch('/api/corrigir-texto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texto, modo, tipoDocumento }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${res.status} ao processar correção de texto.`);
  }

  return await res.json();
}

/**
 * Gera um documento oficial estruturado no padrão do Conselho Tutelar.
 */
export async function gerarDocumento(params: GerarDocumentoParams): Promise<ResultadoDocumento> {
  const res = await fetch('/api/gerar-documento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${res.status} ao gerar documento oficial.`);
  }

  return await res.json();
}

/**
 * Envia mensagem conversacional com busca ativa e grounding para o JARVIS.
 */
export async function enviarMensagemJarvis(
  prompt: string,
  messages: any[] = [],
  contextData: any = {},
  systemPromptExtra = ''
): Promise<RespostaChatJarvis> {
  const res = await fetch('/api/jarvis-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, messages, contextData, systemPromptExtra }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${res.status} ao consultar o assistente.`);
  }

  return await res.json();
}

/**
 * Verifica se o backend e os serviços do JARVIS estão operacionais.
 */
export async function verificarSaudeBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
