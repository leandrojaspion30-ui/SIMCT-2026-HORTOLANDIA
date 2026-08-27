// ============================================================================
// POST /api/resumir-documento — MÓDULO EXCLUSIVO DE ANÁLISE E RESUMO DE PDF
// ============================================================================
import { Type } from "@google/genai";
import { PDFDocument } from "pdf-lib";
import { gerar, json, erroLegivel, MODELO_RAPIDO } from "./_lib/genai.js";

const PROMPT_RESUMO_DOCUMENTAL = `Você é um assistente técnico-documental de alta precisão especializado em análise, leitura e síntese fidedigna de documentos oficiais, laudos, relatórios, termos e peças administrativas/judiciais.

Sua missão é extrair, resumir e estruturar estritamente as informações presentes no arquivo PDF enviado.

DIRETRIZES OBRIGATÓRIAS:
1. FIDELIDADE ABSOLUTA AO CONTEÚDO: Resuma apenas o que consta expressamente no PDF. Não acrescente leis, artigos, conclusões ou providências que não estejam literalmente presentes no PDF.
2. ATRIBUIÇÃO AO DOCUMENTO: Toda afirmação legal ou técnica extraída do documento deve ser expressamente atribuída ao documento (ex: "Segundo o documento, a violação do sigilo funcional pode configurar crime", "Conforme consta no documento, ..."). O módulo de resumo não pode apresentar a afirmação do autor como validação jurídica independente.
3. REFERÊNCIA DE PÁGINA OBRIGATÓRIA EM CADA ITEM: Em cada item de "pontos_principais", "datas_e_prazos" e "providencias_mencionadas", preencha obrigatoriamente os campos "conteudo" e "pagina". Não faça referências genéricas apenas no fim do resumo; cada ponto deve ter sua página individual.
4. PÁGINAS FÍSICAS REAIS: Considere como páginas físicas a sequência 1, 2, 3... do arquivo PDF (ex: "Página 1", "Página 2"). Não invente a página. Se ela não puder ser identificada, retorne exatamente: "não identificada".
5. REVISÃO HUMANA: Sinalize sempre que a conferência integral do original é indispensável.
6. IDIOMA: Responda em língua portuguesa (Brasil).`.trim();

const itemComPaginaSchema = {
  type: Type.OBJECT,
  properties: {
    conteudo: {
      type: Type.STRING,
      description: "Texto descritivo do ponto, data/prazo ou providência identificado no PDF."
    },
    pagina: {
      type: Type.STRING,
      description: "Página física do PDF onde a informação se encontra (ex: 'Página 1', 'Página 2') ou exatamente 'não identificada'."
    }
  },
  required: ["conteudo", "pagina"]
};

const schemaResumo = {
  type: Type.OBJECT,
  properties: {
    titulo_identificado: {
      type: Type.STRING,
      description: "Título ou identificação principal localizada no cabeçalho ou corpo do documento."
    },
    tipo_documento: {
      type: Type.STRING,
      description: "Tipo de peça documental (ex: Guia Rápido, Ofício, Relatório Técnico, Laudo, Notificação, Decisão, etc.)."
    },
    resumo: {
      type: Type.STRING,
      description: "Síntese executiva clara, coesa e fidedigna de todo o teor do documento, atribuindo as afirmações ao texto."
    },
    pontos_principais: {
      type: Type.ARRAY,
      items: itemComPaginaSchema,
      description: "Lista dos tópicos ou determinações centrais descritos no documento, com indicação individual obrigatória de página."
    },
    datas_e_prazos: {
      type: Type.ARRAY,
      items: itemComPaginaSchema,
      description: "Datas, cronogramas ou prazos de resposta/cumprimento identificados, com indicação individual obrigatória de página."
    },
    providencias_mencionadas: {
      type: Type.ARRAY,
      items: itemComPaginaSchema,
      description: "Encaminhamentos, ações requeridas ou orientações registradas no texto, com indicação individual obrigatória de página."
    },
    alertas: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Alertas, situações de urgência, observações críticas ou restrições apontadas."
    },
    paginas_processadas: {
      type: Type.INTEGER,
      description: "Total de páginas do PDF processadas."
    },
    exige_revisao_humana: {
      type: Type.BOOLEAN,
      description: "Sempre true para atestar a necessidade de validação técnica do documento original."
    }
  },
  required: [
    "titulo_identificado",
    "tipo_documento",
    "resumo",
    "pontos_principais",
    "datas_e_prazos",
    "providencias_mencionadas",
    "alertas",
    "paginas_processadas",
    "exige_revisao_humana"
  ]
};

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body ?? {};

  const {
    nomeArquivo,
    mimeType,
    tamanho,
    arquivoBase64,
    instrucao,
    modo
  } = body;

  if (!arquivoBase64 || typeof arquivoBase64 !== "string") {
    return res.status(400).json({
      error: "O conteúdo do PDF não foi enviado."
    });
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(arquivoBase64, "base64");
  } catch {
    return res.status(400).json({
      error: "Formato Base64 inválido para o arquivo PDF."
    });
  }

  if (!buffer.length) {
    return res.status(400).json({
      error: "O arquivo PDF está vazio."
    });
  }

  if (buffer.length > 2.5 * 1024 * 1024) {
    return res.status(413).json({
      error: "O PDF excede o limite de 2,5 MB."
    });
  }

  if (buffer.subarray(0, 5).toString("ascii") !== "%PDF-") {
    return res.status(415).json({
      error: "O arquivo enviado não possui uma estrutura válida de PDF."
    });
  }

  // 6. Cálculo real do total de páginas com pdf-lib e verificação de senha/corrupção
  let totalPaginas = 1;
  try {
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: false });
    totalPaginas = pdfDoc.getPageCount();
  } catch (err: any) {
    return res.status(422).json({
      error: "O arquivo PDF não pôde ser aberto ou está protegido por senha.",
      dica: "Verifique se o arquivo está corrompido ou protegido por senha e tente novamente."
    });
  }

  const pdfBase64Validado = buffer.toString("base64");

  try {
    const respostaBruta = await gerar({
      model: MODELO_RAPIDO,
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "application/pdf",
              data: pdfBase64Validado
            }
          },
          {
            text:
              instrucao ||
              "Resuma fielmente o documento e indique as páginas de cada item identificado."
          }
        ]
      }],
      config: {
        systemInstruction: PROMPT_RESUMO_DOCUMENTAL,
        responseMimeType: "application/json",
        responseSchema: schemaResumo,
        temperature: 0.1
      }
    });

    const parsed = json(respostaBruta);
    // Define a contagem real de páginas a partir do totalPaginas calculado pelo pdf-lib
    parsed.paginas_processadas = totalPaginas;
    return res.status(200).json(parsed);
  } catch (erro: any) {
    const formatado = erroLegivel(erro);
    return res.status(formatado.status || 500).json({
      error: formatado.mensagem || "Não foi possível processar o PDF.",
      dica: formatado.dica || "Aguarde alguns instantes e tente novamente.",
      detalhe: formatado.detalhe
    });
  }
}
