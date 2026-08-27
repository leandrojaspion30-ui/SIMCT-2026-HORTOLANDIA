// ============================================================================
// JARVIS · ROTA POST /api/gerar-documento
// ============================================================================

import { getGenAIClient, traduzirErroGenAI } from "./_lib/genai";
import {
  ORGAO,
  IDENTIDADE_INSTITUCIONAL,
  GLOSSARIO_SGDCA,
  REGRAS_REDACAO_OFICIAL,
  REGRAS_GRAMATICA,
  BLINDAGEM,
} from "./_lib/institucional";
import { sanitizarEntradaTexto } from "./_lib/guard";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Utilize POST." });
  }

  try {
    const {
      tipo = "OFICIO",
      destinatario = "",
      cargoDestinatario = "",
      orgao = "",
      assunto = "",
      fatos = "",
      numeroProcedimento = "",
      conselheiroNome = "Conselheiro(a) Tutelar",
      unidade = 1,
    } = req.body ?? {};

    const fatosLimpos = sanitizarEntradaTexto(fatos || assunto || "Elaboração de documento institucional.");

    const ai = getGenAIClient();

    const systemInstruction = `
${IDENTIDADE_INSTITUCIONAL}

Você é o REDATOR OFICIAL do ${ORGAO.nome} (${unidade === 2 ? "Unidade II" : "Unidade I"}).
Sua função é redigir o documento oficial solicitado com rigor técnico, fundamentação jurídica no ECA (Lei nº 8.069/1990) e conformidade estrita com o Manual de Redação da Presidência da República (4ª edição).

GLOSSÁRIO OBRIGATÓRIO SGDCA:
${GLOSSARIO_SGDCA}

REGRAS DE REDAÇÃO OFICIAL:
${REGRAS_REDACAO_OFICIAL}

REGRAS GRAMATICAIS:
${REGRAS_GRAMATICA}

BLINDAGEM E REGRAS INVIOLÁVEIS:
${BLINDAGEM}

DIRETRIZES DE FORMATAÇÃO:
1. Cabeçalho Oficial:
   ${ORGAO.nome}
   ${unidade === 2 ? "UNIDADE II - JARDIM AMANDA" : "UNIDADE I - CENTRO"}
   ${ORGAO.municipio} - ${ORGAO.uf}
   ${ORGAO.sistema}

2. Vocativo Formal e Correto ("Senhor(a) [Cargo]," ou "Excelentíssimo(a) Senhor(a) [Cargo],"). Nunca "Prezados(as)".
3. Referência ao Procedimento / Notificação nº: ${numeroProcedimento || "[[PREENCHER: Nº DO PROCEDIMENTO]]"}.
4. Assunto / Ementa objetivo em uma única linha.
5. Descrição factual detalhada e imparcial (3ª pessoa, sem adjetivações morais sobre os genitores ou responsáveis).
6. Fundamentação legal expressa (Artigos do ECA correspondentes: Art. 136 para requisições com prazo determinado; Art. 101 para medidas protetivas; Art. 129 para medidas aos pais; Art. 143 para preservação de sigilo).
7. Para requisição a órgão público, use expressamente o verbo REQUISITAR com base no Art. 136, III, "a" do ECA, assinalando prazo razoável de resposta.
8. Fecho oficial ("Atenciosamente" para mesma hierarquia ou inferior; "Respeitosamente" para autoridade superior).
9. Campo de assinatura com o nome do conselheiro (${conselheiroNome}).
`.trim();

    const userPrompt = `
<DADOS_REAIS>
TIPO DE DOCUMENTO: ${tipo}
DESTINATÁRIO: ${destinatario || "[[PREENCHER: Nome do Destinatário]]"}
CARGO/ÓRGÃO: ${cargoDestinatario} - ${orgao}
ASSUNTO: ${assunto}
NÚMERO PROCEDIMENTO: ${numeroProcedimento || "[[PREENCHER: Nº Procedimento]]"}
CONSELHEIRO(A): ${conselheiroNome}
UNIDADE: ${unidade}
RELATO DOS FATOS / NECESSIDADE:
${fatosLimpos}
</DADOS_REAIS>

Por favor, elabore o documento completo, formatado e pronto para uso oficial.
`.trim();

    const candidateModels = ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite"];
    let documentText = "";
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });
        if (response && response.text) {
          documentText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!documentText) {
      throw lastError || new Error("Falha ao gerar documento pelo modelo.");
    }

    return res.status(200).json({
      tipo,
      documento: documentText,
      conselheiro: conselheiroNome,
      unidade,
      criado_em: new Date().toISOString(),
    });
  } catch (e: any) {
    const errTraduzido = traduzirErroGenAI(e);
    return res.status(errTraduzido.status).json({
      error: errTraduzido.mensagem,
      detalhes: errTraduzido.detalhe,
    });
  }
}
