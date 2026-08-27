// ============================================================================
// JARVIS · ROTA POST /api/gerar-documento
// ============================================================================
import { gerar, erroLegivel, MODELO_PROFUNDO, MODELO_RAPIDO } from "./_lib/genai.js";
import {
  ORGAO,
  IDENTIDADE_INSTITUCIONAL,
  GLOSSARIO_SGDCA,
  REGRAS_REDACAO_OFICIAL,
  REGRAS_GRAMATICA,
  BLINDAGEM,
} from "./_lib/institucional.js";
import { dadosSensiveis, envelopar, validarTexto, numerosPermitidos, numerosSuspeitos } from "./_lib/guard.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido. Utilize POST." });
  }

  try {
    const {
      tipo = "OFICIO",
      instrucao = "",
      destinatario = "",
      cargoDestinatario = "",
      orgao = "",
      assunto = "",
      fatos = "",
      dados = null,
      signatario = null,
      profundo = true,
      numeroProcedimento = "",
      conselheiroNome = "Conselheiro(a) Tutelar",
      unidade = 1,
    } = req.body ?? {};

    const rawInput = instrucao || fatos || assunto || "Elaboração de documento institucional.";
    const inval = validarTexto(rawInput, 3, 30000);
    if (inval) {
      return res.status(400).json({ error: inval });
    }

    const nomeSignatario = signatario?.nome || signatario?.conselheiro || conselheiroNome;
    const destStr = typeof destinatario === "string" 
      ? destinatario 
      : (destinatario?.nome ? `${destinatario.nome}${destinatario.cargo ? ` (${destinatario.cargo})` : ""}` : JSON.stringify(destinatario));

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
9. Campo de assinatura com o nome do conselheiro (${nomeSignatario}).
`.trim();

    const dadosReaisObj: any = {
      tipo,
      destinatario: destStr || "[[PREENCHER: Nome do Destinatário]]",
      cargoDestinatario,
      orgao,
      assunto,
      numeroProcedimento: numeroProcedimento || "[[PREENCHER: Nº Procedimento]]",
      conselheiro: nomeSignatario,
      unidade,
      instrucao: rawInput,
    };

    if (dados && typeof dados === "object") {
      dadosReaisObj.dadosComplementares = dados;
    }

    const dadosReaisStr = JSON.stringify(dadosReaisObj, null, 2);

    const userPrompt = `
${envelopar("DADOS_REAIS", dadosReaisStr)}

Por favor, elabore o documento completo, formatado e pronto para uso oficial.
`.trim();

    const modeloEscolhido = profundo ? MODELO_PROFUNDO : MODELO_RAPIDO;
    const modeloSecundario = profundo ? MODELO_RAPIDO : MODELO_PROFUNDO;

    let documentText = "";
    try {
      documentText = await gerar({
        model: modeloEscolhido,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
    } catch {
      // Fallback de modelo
      documentText = await gerar({
        model: modeloSecundario,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });
    }

    // Verificação de segurança pós-geração
    const permitidos = numerosPermitidos(dadosReaisStr);
    const suspeitos = numerosSuspeitos(documentText, permitidos);
    const alertasSigilo = dadosSensiveis(documentText);

    return res.status(200).json({
      tipo,
      texto: documentText,
      documento: documentText,
      conselheiro: nomeSignatario,
      unidade,
      alertas_sigilo: alertasSigilo,
      numeros_suspeitos: suspeitos,
      criado_em: new Date().toISOString(),
    });
  } catch (e: any) {
    const err = erroLegivel(e);
    console.error("[JARVIS/gerar-documento]", err, e);
    return res.status(err.status).json({
      error: err.mensagem,
      dica: err.dica,
    });
  }
}
