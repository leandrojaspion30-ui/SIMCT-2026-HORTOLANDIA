// ============================================================================
// JARVIS · CLIENTE GEMINI — sem fallback silencioso, erro sempre visível
// ============================================================================
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.API_KEY;

if (!API_KEY) {
  console.error("[JARVIS] GEMINI_API_KEY ausente no ambiente.");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY ?? "" });

export const MODELO_RAPIDO = "gemini-3.7-flash";
export const MODELO_PROFUNDO = "gemini-3.1-pro-preview";

let genAIClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY ?? process.env.API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY não configurada no ambiente do servidor.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "simct-jarvis-hortolandia",
        },
      },
    });
  }
  return genAIClient;
}

/** Traduz erro da API em mensagem acionável — nunca esconder falha. */
export function erroLegivel(e: any): { status: number; mensagem: string; dica: string; detalhe?: string } {
  const raw = String(e?.message ?? e ?? "");
  const code = e?.status ?? e?.code ?? (raw.match(/\b(4\d\d|5\d\d)\b/)?.[1] ?? 0);
  const n = Number(code);

  const currentKey = process.env.GEMINI_API_KEY ?? process.env.API_KEY;
  if (!currentKey) {
    return {
      status: 500,
      mensagem: "GEMINI_API_KEY não configurada.",
      dica: "Configure GEMINI_API_KEY nas variáveis de ambiente do projeto.",
      detalhe: raw,
    };
  }

  if (n === 400 && /api.?key/i.test(raw)) {
    return {
      status: 401,
      mensagem: "Chave de API inválida.",
      dica: "Gere outra em aistudio.google.com/apikey e atualize as configurações.",
      detalhe: raw,
    };
  }

  if (n === 403 || /API_KEY_INVALID|permission/i.test(raw)) {
    return {
      status: 403,
      mensagem: "Acesso negado à API.",
      dica: "A chave pode ter restrição de referrer/IP, ou a Generative Language API está desativada no projeto.",
      detalhe: raw,
    };
  }

  if (n === 404) {
    return {
      status: 404,
      mensagem: "Modelo inexistente.",
      dica: "Use 'gemini-3.7-flash' ou 'gemini-3.1-pro-preview'.",
      detalhe: raw,
    };
  }

  if (n === 429 || /RESOURCE_EXHAUSTED|quota/i.test(raw)) {
    return {
      status: 429,
      mensagem: "Cota excedida.",
      dica: "Aguarde ou verifique a cota no Google AI Studio.",
      detalhe: raw,
    };
  }

  if (n >= 500) {
    return {
      status: 503,
      mensagem: "Instabilidade no serviço do Gemini.",
      dica: "Tente novamente em alguns segundos.",
      detalhe: raw,
    };
  }

  return {
    status: 500,
    mensagem: raw || "Erro desconhecido.",
    dica: "Verifique os logs de execução do servidor.",
    detalhe: raw,
  };
}

export function traduzirErroGenAI(error: any): { status: number; mensagem: string; detalhe?: string; dica?: string } {
  return erroLegivel(error);
}

/** Chamada com 1 retry para erro transitório. */
export async function gerar(params: any, tentativas = 2): Promise<string> {
  let ultimo: any;
  for (let i = 0; i < tentativas; i++) {
    try {
      const client = getGenAIClient();
      const r = await client.models.generateContent(params);
      const t = r.text;
      if (!t) throw new Error("Resposta vazia (possível bloqueio por filtro de segurança).");
      return t;
    } catch (e: any) {
      ultimo = e;
      const n = Number(e?.status ?? 0);
      if (n && n < 500 && n !== 429) break; // erro definitivo, não adianta repetir
      await new Promise(r => setTimeout(r, 900 * (i + 1)));
    }
  }
  throw ultimo;
}

export function json<T = any>(txt: string): T {
  const limpo = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(limpo);
}
