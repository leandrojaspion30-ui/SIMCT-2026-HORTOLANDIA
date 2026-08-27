// ============================================================================
// JARVIS · GUARD DE ANTI-ALUCINAÇÃO & PROTEÇÃO DE SIGILO (ECA / LGPD)
// ============================================================================

export interface AlertaSigilo {
  tipo: "CPF" | "RG" | "ENDERECO" | "NOME_SENSIVEL";
  descricao: string;
  trecho: string;
}

export function verificarSigiloECA(texto: string): AlertaSigilo[] {
  const alertas: AlertaSigilo[] = [];

  // Padrão CPF
  const cpfRegex = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
  const cpfs = texto.match(cpfRegex);
  if (cpfs) {
    cpfs.forEach(cpf => {
      alertas.push({
        tipo: "CPF",
        descricao: "Identificado CPF no texto. Documentos públicos ou ofícios externos devem ocultar documentos de crianças/adolescentes (ECA art. 143).",
        trecho: cpf,
      });
    });
  }

  // Padrão RG
  const rgRegex = /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dX]\b/gi;
  const rgs = texto.match(rgRegex);
  if (rgs) {
    rgs.forEach(rg => {
      alertas.push({
        tipo: "RG",
        descricao: "Identificado número de RG no texto.",
        trecho: rg,
      });
    });
  }

  return alertas;
}

export function validarRespostaAntiAlucinacao(groundingMetadata: any): { buscaExecutada: boolean; fontes: string[] } {
  if (!groundingMetadata) {
    return { buscaExecutada: false, fontes: [] };
  }

  const chunks = groundingMetadata.groundingChunks || [];
  const webChunks = chunks.filter((c: any) => c.web?.uri || c.web?.title);
  const fontes = webChunks.map((c: any) => c.web?.title || c.web?.uri).filter(Boolean);

  return {
    buscaExecutada: webChunks.length > 0 || Boolean(groundingMetadata.webSearchQueries?.length),
    fontes,
  };
}

export function sanitizarEntradaTexto(texto: unknown, maxLen = 35000): string {
  if (typeof texto !== "string") {
    throw new Error("Entrada inválida. O parâmetro 'texto' deve ser uma string.");
  }
  const limpo = texto.trim();
  if (limpo.length < 3) {
    throw new Error("O texto informado deve ter no mínimo 3 caracteres.");
  }
  if (limpo.length > maxLen) {
    throw new Error(`Texto muito longo (${limpo.length} caracteres). O limite máximo por requisição é de ${maxLen} caracteres.`);
  }
  return limpo;
}
