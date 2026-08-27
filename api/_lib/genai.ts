// ============================================================================
// JARVIS · CLIENTE GEMINI — sem fallback silencioso, erro sempre visível
// ============================================================================
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.API_KEY;

if (!API_KEY) {
  console.error("[JARVIS] GEMINI_API_KEY ausente no ambiente.");
}

export const ai = new GoogleGenAI({ apiKey: API_KEY ?? "" });

const rawPrimary = process.env.GEMINI_MODEL_PRIMARY || "gemini-3.6-flash";
export const MODELO_RAPIDO = rawPrimary.includes("preview") ? "gemini-3.6-flash" : rawPrimary;

const rawFallback = process.env.GEMINI_MODEL_FALLBACK || "gemini-3.1-flash-lite";
export const MODELO_FALLBACK = rawFallback.includes("preview") ? "gemini-3.1-flash-lite" : rawFallback;

export const MODELO_PROFUNDO = process.env.GEMINI_MODEL_DEEP || "gemini-3.6-flash";

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
      dica: "Verifique os modelos configurados.",
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

  if (n >= 500 || e?.status === 503 || /temporariamente ocupado|UNAVAILABLE|high demand|spikes in demand/i.test(raw)) {
    return {
      status: 503,
      mensagem: "O serviço de inteligência artificial está temporariamente ocupado.",
      dica: "Aguarde alguns instantes e tente novamente.",
      detalhe: raw,
    };
  }

  return {
    status: 500,
    mensagem: e?.mensagem || raw || "Erro desconhecido.",
    dica: e?.dica || "Verifique os logs de execução do servidor.",
    detalhe: raw,
  };
}

export function traduzirErroGenAI(error: any): { status: number; mensagem: string; detalhe?: string; dica?: string } {
  return erroLegivel(error);
}

const RETRY_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const NO_RETRY_STATUSES = new Set([400, 401, 403]);

function extrairStatus(e: any): number {
  if (typeof e?.status === "number" && e.status > 0) return e.status;
  if (typeof e?.code === "number" && e.code >= 100 && e.code <= 599) return e.code;
  const raw = String(e?.message ?? e ?? "");
  const jsonMatch = raw.match(/"code"\s*:\s*(\d{3})/);
  if (jsonMatch) return Number(jsonMatch[1]);
  const statusMatch = raw.match(/\b(4\d\d|5\d\d)\b/);
  if (statusMatch) return Number(statusMatch[1]);
  if (/UNAVAILABLE|high demand|spikes in demand|overloaded/i.test(raw)) return 503;
  if (/RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)) return 429;
  if (/NOT_FOUND/i.test(raw)) return 404;
  return 500;
}

function calcularEspera(tentativaIndex: number): number {
  // tentativa 1 falhou -> espera ~1s
  // tentativa 2 falhou -> espera ~2.5s
  const base = tentativaIndex === 0 ? 1000 : 2500;
  const jitter = Math.floor(Math.random() * 150) + 50; // pequeno atraso aleatório 50ms - 200ms
  return base + jitter;
}

/**
 * Executa chamada ao Gemini com até 3 tentativas no modelo principal,
 * espera progressiva e fallback para modelo estável em erros temporários (503, 429, etc.) ou 404.
 */
export async function gerar(params: any): Promise<string> {
  const client = getGenAIClient();
  const modeloPrincipal = params?.model || MODELO_RAPIDO;
  const modeloFallback = modeloPrincipal === MODELO_FALLBACK ? MODELO_RAPIDO : MODELO_FALLBACK;

  let ultimoErro: any = null;
  let deveTentarFallback = false;

  // 1. Até 3 tentativas no modelo principal
  const MAX_TENTATIVAS_PRINCIPAL = 3;
  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_PRINCIPAL; tentativa++) {
    try {
      const callParams = { ...params, model: modeloPrincipal };
      const r = await client.models.generateContent(callParams);
      const t = r.text;
      if (!t) throw new Error("Resposta vazia (possível bloqueio por filtro de segurança).");
      return t;
    } catch (e: any) {
      ultimoErro = e;
      const status = extrairStatus(e);

      console.warn(
        `[Gemini] status ${status}; modelo ${modeloPrincipal}; tentativa ${tentativa}/${MAX_TENTATIVAS_PRINCIPAL}`
      );

      // Não repetir erros de autenticação / requisição inválida
      if (NO_RETRY_STATUSES.has(status)) {
        throw e;
      }

      // Se for 404 no modelo principal, passar imediatamente para o fallback
      if (status === 404) {
        deveTentarFallback = true;
        break;
      }

      // Se for erro temporário elegível para retry (408, 429, 500, 502, 503, 504)
      if (RETRY_STATUSES.has(status)) {
        if (tentativa < MAX_TENTATIVAS_PRINCIPAL) {
          await new Promise(r => setTimeout(r, calcularEspera(tentativa - 1)));
        } else {
          // Após 3 tentativas com erro temporário, passa para fallback
          deveTentarFallback = true;
        }
      } else {
        deveTentarFallback = true;
        break;
      }
    }
  }

  // 2. Se o modelo principal falhou, tenta os modelos de fallback (até 2 tentativas por modelo)
  if (deveTentarFallback) {
    const listaFallback = [
      modeloFallback,
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash-lite"
    ].filter((m, idx, arr) => m && m !== modeloPrincipal && arr.indexOf(m) === idx);

    for (const fbModel of listaFallback) {
      console.warn(
        `[Gemini] modelo principal indisponível; tentando modelo alternativo ${fbModel}`
      );

      const MAX_TENTATIVAS_FALLBACK = 2;
      for (let tentativa = 1; tentativa <= MAX_TENTATIVAS_FALLBACK; tentativa++) {
        try {
          const callParams = { ...params, model: fbModel };
          const r = await client.models.generateContent(callParams);
          const t = r.text;
          if (!t) throw new Error("Resposta vazia (possível bloqueio por filtro de segurança).");
          return t;
        } catch (e: any) {
          ultimoErro = e;
          const status = extrairStatus(e);

          console.warn(
            `[Gemini] status ${status}; modelo ${fbModel}; tentativa ${tentativa}/${MAX_TENTATIVAS_FALLBACK}`
          );

          if (NO_RETRY_STATUSES.has(status)) {
            throw e;
          }

          if (status === 404) {
            break; // passa imediatamente para o próximo modelo da lista
          }

          if (RETRY_STATUSES.has(status) && tentativa < MAX_TENTATIVAS_FALLBACK) {
            await new Promise(r => setTimeout(r, calcularEspera(tentativa - 1)));
          }
        }
      }
    }
  }

  // 3. Se todos os modelos falharem, lança erro honesto com status 503
  const errFinal: any = new Error("O serviço de inteligência artificial está temporariamente ocupado.");
  errFinal.status = 503;
  errFinal.dica = "Aguarde alguns instantes e tente novamente.";
  errFinal.detalhe = ultimoErro?.message || String(ultimoErro);
  throw errFinal;
}

export function json<T = any>(txt: string): T {
  const limpo = txt.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(limpo);
}

