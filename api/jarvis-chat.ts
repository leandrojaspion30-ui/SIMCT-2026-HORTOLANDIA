// ============================================================================
// POST /api/jarvis-chat — conversa geral
// ============================================================================
import { gerar, erroLegivel, MODELO_RAPIDO } from "./_lib/genai.js";
import { ORGAO, ESTRUTURA_PERMITIDA, GLOSSARIO_SGDCA, REGRAS_REDACAO_OFICIAL, BLINDAGEM } from "./_lib/institucional.js";
import { envelopar, validarTexto } from "./_lib/guard.js";

const system = (conselheiro: string, hoje: string, ctx: string) => `
Você é o JARVIS, assistente técnico-jurídico do ${ORGAO.nome}/${ORGAO.uf} (sistema ${ORGAO.sistema}).
Fala com o(a) Conselheiro(a) ${conselheiro}. Hoje é ${hoje}.

DOMÍNIO: ECA (Lei 8.069/90), Lei 13.431/17, Lei 14.344/22, SINASE (Lei 12.594/12),
Marco Legal da Primeira Infância (Lei 13.257/16), resoluções do CONANDA, SUAS e fluxos do SGDCA.

POSTURA
• Objetivo e direto. Resposta curta quando a pergunta é curta.
• Cite o dispositivo legal quando ele existir e você tiver certeza.
• Não sabe? Diga "não tenho essa informação" e indique onde conferir.
• Não decide medida protetiva nem substitui o colegiado — organiza, redige e sugere.
• Português do Brasil.

${BLINDAGEM}

${ESTRUTURA_PERMITIDA}

${GLOSSARIO_SGDCA}

${REGRAS_REDACAO_OFICIAL}

${envelopar("DADOS_REAIS_DO_SIMCT", ctx || "Nenhum dado carregado nesta sessão. NÃO invente estatística; diga que o dado não foi carregado.")}
`.trim();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });

  try {
    const {
      pergunta,
      prompt,
      historico = [],
      messages = [],
      conselheiro = "Conselheiro(a)",
      contextoSistema = "",
      contextData = {},
    } = req.body ?? {};

    const textoPergunta = pergunta ?? prompt ?? "";
    const inval = validarTexto(textoPergunta, 1, 12000);
    if (inval) return res.status(400).json({ error: inval });

    const hoje = new Date().toLocaleDateString("pt-BR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "America/Sao_Paulo",
    });

    const historicoFinal = historico.length > 0 ? historico : messages;
    const ctxString = typeof contextoSistema === "string" && contextoSistema.length > 0
      ? contextoSistema
      : (contextData && Object.keys(contextData).length > 0 ? JSON.stringify(contextData, null, 2) : "");

    const contents = [
      ...historicoFinal.slice(-16).map((m: any) => ({
        role: m.role === "model" || m.autor === "jarvis" ? "model" : "user",
        parts: [{ text: String(m.texto ?? m.parts?.[0]?.text ?? "") }],
      })),
      { role: "user", parts: [{ text: String(textoPergunta) }] },
    ];

    const texto = await gerar({
      model: MODELO_RAPIDO,
      contents,
      config: {
        systemInstruction: system(conselheiro, hoje, ctxString),
        temperature: 0.35,
      },
    });

    return res.status(200).json({
      texto,
      text: texto, // Compatibilidade com callers que leem `res.text`
      timestamp: new Date().toISOString(),
    });
  } catch (e: any) {
    const err = erroLegivel(e);
    console.error("[JARVIS/chat]", err, e);
    return res.status(err.status).json({ error: err.mensagem, dica: err.dica });
  }
}
