// ============================================================================
// JARVIS · CLIENTE GENAI & TRADUTOR DE ERROS
// ============================================================================

import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada no ambiente do servidor.");
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "simct-jarvis-hortolandia",
        },
      },
    });
  }
  return genAIClient;
}

export function traduzirErroGenAI(error: any): { status: number; mensagem: string; detalhe?: string } {
  const errorMsg = error?.message || String(error);
  const status = error?.status || error?.statusCode || 500;

  if (errorMsg.includes("API_KEY_INVALID") || errorMsg.includes("API key not valid") || errorMsg.includes("403")) {
    return {
      status: 403,
      mensagem: "Chave da API Gemini inválida ou sem permissão de acesso.",
      detalhe: errorMsg,
    };
  }

  if (errorMsg.includes("RESOURCE_EXHAUSTED") || errorMsg.includes("429") || errorMsg.includes("quota")) {
    return {
      status: 429,
      mensagem: "Limite de requisições da IA atingido temporariamente. Tente novamente em alguns instantes.",
      detalhe: errorMsg,
    };
  }

  if (errorMsg.includes("DEADLINE_EXCEEDED") || errorMsg.includes("504") || errorMsg.includes("timeout")) {
    return {
      status: 504,
      mensagem: "O tempo limite de resposta do modelo foi excedido. Envie um texto menor ou tente novamente.",
      detalhe: errorMsg,
    };
  }

  if (errorMsg.includes("SAFETY") || errorMsg.includes("blocked")) {
    return {
      status: 422,
      mensagem: "O conteúdo acionou os filtros de segurança do modelo e não pôde ser processado.",
      detalhe: errorMsg,
    };
  }

  return {
    status: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
    mensagem: "Erro ao processar requisição de inteligência artificial.",
    detalhe: errorMsg,
  };
}
