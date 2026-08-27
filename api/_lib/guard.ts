// ============================================================================
// JARVIS · BARREIRAS DE SEGURANÇA (2ª camada, determinística)
// ============================================================================

/** Números que o modelo PODE usar sem estar nos dados (leis, artigos, anos). */
const WHITELIST = new Set([
  "1988","1990","2017","2022","2023","2024","2025","2026","2027","2028",
  "8.069","8069","13.431","13431","14.344","14344","12.594","12594","13.257","13257",
  "2","4","7","8","13","18","19","70","86","88","98","101","103","105","112",
  "129","131","132","133","134","135","136","137","143","191","201","260",
  "0","1","3","5","6","10","11","12","17","30","60","90",
]);

export function numerosPermitidos(dadosJson: string): Set<string> {
  const s = new Set(WHITELIST);
  for (const n of dadosJson.match(/\d+(?:[.,]\d+)*/g) ?? []) s.add(n);
  return s;
}

/** Retorna números presentes no texto que NÃO vieram dos dados reais. */
export function numerosSuspeitos(texto: string, permitidos: Set<string>): string[] {
  const fora = new Set<string>();
  const semMarcadores = texto.replace(/\[\[[^\]]*\]\]/g, "");
  for (const m of semMarcadores.match(/\d+(?:[.,]\d+)*\s?%?/g) ?? []) {
    const limpo = m.replace(/\s?%$/, "").trim();
    if (!permitidos.has(limpo)) fora.add(m.trim());
  }
  return [...fora];
}

/** Órgãos/índices inventados — casa com o Achado nº3. */
const TERMOS_PROIBIDOS = [
  /n[úu]cleo de intelig[êe]ncia/i,
  /observat[óo]rio\s+simct/i,
  /equipe do (observat[óo]rio|simct)/i,
  /departamento de an[áa]lise/i,
  /\bIVIA\b/,
  /\b[íi]ndice de vulnerabilidade da inf[âa]ncia\b/i,
  /setor de dados/i,
];

export function orgaosInventados(texto: string): string[] {
  return TERMOS_PROIBIDOS.filter(r => r.test(texto)).map(r => String(r));
}

/** Dados pessoais sensíveis — ECA art. 143 / LGPD. */
export function dadosSensiveis(texto: string): string[] {
  const a: string[] = [];
  if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(texto)) a.push("CPF detectado — remover (LGPD art. 11).");
  if (/\b\d{5}-?\d{3}\b/.test(texto)) a.push("CEP detectado — evitar endereço de criança/adolescente.");
  if (/\b(?:rua|av\.?|avenida|travessa|alameda)\s+[A-ZÁÉÍÓÚ][\wÀ-ú\s]{3,},?\s*n?º?\s*\d+/i.test(texto))
    a.push("Endereço com número — usar apenas o bairro (ECA art. 143).");
  if (/\(?\d{2}\)?\s?9?\d{4}-?\d{4}\b/.test(texto)) a.push("Telefone detectado — verificar necessidade.");
  if (/\b[A-ZÁÉÍÓÚ][a-zà-ú]{2,}\s+(?:da|de|do|dos|das)\s+[A-ZÁÉÍÓÚ][a-zà-ú]{2,}\s+[A-ZÁÉÍÓÚ][a-zà-ú]{2,}/.test(texto))
    a.push("Possível nome completo — substituir por iniciais.");
  return a;
}

/** Envelopa entrada do usuário contra prompt injection. */
export function envelopar(rotulo: string, conteudo: string): string {
  const limpo = String(conteudo).replace(/<{3,}|>{3,}/g, "");
  return `<${rotulo}>\n${limpo}\n</${rotulo}>`;
}

export function validarTexto(t: any, min = 3, max = 30000): string | null {
  if (typeof t !== "string" || t.trim().length < min) return `Envie um texto com pelo menos ${min} caracteres.`;
  if (t.length > max) return `Texto muito longo (${t.length}). Limite: ${max} caracteres.`;
  return null;
}

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
  const erro = validarTexto(texto, 3, maxLen);
  if (erro) {
    throw new Error(erro);
  }
  return String(texto).trim();
}
