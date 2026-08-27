// ============================================================================
// Camada de acesso do front. NENHUMA chave de API aqui.
// ============================================================================

async function post<T>(rota: string, body: unknown): Promise<T> {
  const r = await fetch(`/api/${rota}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error([data.error, data.dica].filter(Boolean).join(" — ") || `Erro ${r.status}`);
  return data as T;
}

/** Monte com dados REAIS do seu banco. Agregado e anonimizado. */
export function montarContextoSIMCT(s: any): string {
  if (!s) return "";
  return `
DATA: ${new Date().toLocaleDateString("pt-BR")}
CONSELHEIROS: Leandro, Luiza, Milena, Mirian, Sandra, Rosilda
PROCEDIMENTOS ABERTOS: ${s.abertos ?? "n/d"}
PRAZOS VENCENDO EM 7 DIAS: ${s.prazos ?? "n/d"}
MONITORAMENTOS PENDENTES: ${s.monitoramentos ?? "n/d"}
AGENDA DE HOJE: ${s.agendaHoje ?? "n/d"}
POR TIPO DE VIOLAÇÃO (mês): ${JSON.stringify(s.porTipo ?? {})}
POR BAIRRO (mês): ${JSON.stringify(s.porBairro ?? {})}
`.trim();
}

export const jarvis = {
  chat: (p: { pergunta: string; historico?: any[]; conselheiro?: string; contextoSistema?: string }) =>
    post<{ texto: string }>("jarvis-chat", p),

  corrigir: (p: { texto: string; modo?: "ORTOGRAFICA" | "COMPLETA" | "OFICIAL" | "TECNICA" | "SIMPLES"; tipoDocumento?: string }) =>
    post<any>("corrigir-texto", p),

  documento: (p: { tipo: "OFICIO" | "REQUISICAO" | "RELATORIO_CMDCA"; instrucao: string; destinatario?: any; dados?: any; signatario?: any; profundo?: boolean }) =>
    post<any>("gerar-documento", p),
};

// Aliases para compatibilidade com outros módulos do SIMCT
export const corrigirTexto = (texto: string, modo: any = "COMPLETA", tipoDocumento = "") =>
  jarvis.corrigir({ texto, modo, tipoDocumento });

export const gerarDocumento = (params: any) =>
  jarvis.documento(params);

export const enviarMensagemJarvis = (pergunta: string, historico: any[] = [], contextoSistema = "") =>
  jarvis.chat({ pergunta, historico, contextoSistema });

export async function verificarSaudeBackend(): Promise<boolean> {
  try {
    const res = await fetch('/api/health');
    return res.ok;
  } catch {
    return false;
  }
}
