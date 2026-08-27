// ============================================================================
// JARVIS · ROTA POST /api/jarvis-chat
// ============================================================================

import { getGenAIClient, traduzirErroGenAI } from "./_lib/genai";
import {
  ORGAO,
  IDENTIDADE_INSTITUCIONAL,
  ESTRUTURA_PERMITIDA,
  GLOSSARIO_SGDCA,
  REGRAS_REDACAO_OFICIAL,
  REGRAS_GRAMATICA,
  BLINDAGEM,
} from "./_lib/institucional";
import { sanitizarEntradaTexto, validarRespostaAntiAlucinacao } from "./_lib/guard";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Utilize POST." });
  }

  try {
    const {
      prompt,
      messages = [],
      contextData = {},
      systemPromptExtra = "",
    } = req.body ?? {};

    const userMessage = sanitizarEntradaTexto(prompt || (messages[messages.length - 1]?.parts?.[0]?.text) || "");

    const ai = getGenAIClient();

    const systemInstruction = `
${IDENTIDADE_INSTITUCIONAL}

ESTRUTURA PERMITIDA:
${ESTRUTURA_PERMITIDA}

GLOSSÁRIO OBRIGATÓRIO SGDCA:
${GLOSSARIO_SGDCA}

REGRAS DE REDAÇÃO OFICIAL:
${REGRAS_REDACAO_OFICIAL}

REGRAS GRAMATICAIS:
${REGRAS_GRAMATICA}

BLINDAGEM E REGRAS INVIOLÁVEIS:
${BLINDAGEM}

${systemPromptExtra ? `DIRETRIZES ESPECÍFICAS DA CONSULTA:\n${systemPromptExtra}\n` : ""}

PROTOCOLO OBRIGATÓRIO DE PESQUISA E CONSULTA:
1. Ao responder dúvidas sobre leis, decretos, súmulas e jurisprudência, utilize a ferramenta de busca (Google Search) para verificar vigência e decisões recentes dos Tribunais Superiores (STF/STJ).
2. Não simule ter pesquisado caso a ferramenta de busca não retorne dados de fundamentação.
3. Mantenha tom profissional, solene, empático e resolutivo.
4. Responda em Português do Brasil com formatação Markdown limpa e estruturada.
`.trim();

    // Monta o array de conteúdos para o modelo
    const contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      messages.forEach((m: any) => {
        if (m.role && m.parts) {
          contents.push(m);
        }
      });
    } else {
      contents.push({
        role: "user",
        parts: [{ text: userMessage }],
      });
    }

    // Se houver dados de contexto do SIMCT, anexa no bloco <DADOS_REAIS>
    if (contextData && Object.keys(contextData).length > 0) {
      contents[0].parts[0].text = `<DADOS_REAIS>\n${JSON.stringify(contextData, null, 2)}\n</DADOS_REAIS>\n\n${contents[0].parts[0].text}`;
    }

    const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
    let responseResult: any = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        // Tenta com busca ativa pelo Google Search
        const resp = await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
            temperature: 0.3,
          },
        });

        if (resp && resp.text) {
          responseResult = resp;
          break;
        }
      } catch (err: any) {
        lastError = err;
        // Fallback para execução sem tool caso necessário
        try {
          const respNoTool = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });
          if (respNoTool && respNoTool.text) {
            responseResult = respNoTool;
            break;
          }
        } catch (innerErr) {
          lastError = innerErr;
        }
      }
    }

    if (!responseResult) {
      throw lastError || new Error("Falha ao obter resposta do assistente.");
    }

    const rawText = responseResult.text || "";
    const groundingMetadata = responseResult.candidates?.[0]?.groundingMetadata || null;
    const { buscaExecutada, fontes } = validarRespostaAntiAlucinacao(groundingMetadata);

    return res.status(200).json({
      text: rawText,
      groundingMetadata,
      fontes,
      buscaExecutada,
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    const errTraduzido = traduzirErroGenAI(e);
    return res.status(errTraduzido.status).json({
      error: errTraduzido.mensagem,
      detalhes: errTraduzido.detalhe,
    });
  }
}
