import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { handleCorrigirTexto } from "./src/server/corrigirTexto";

function generateSIMCTFallbackResponse(contents: any[]): string {
  let userQuestion = "";
  if (Array.isArray(contents)) {
    const lastUserMsg = contents.filter(c => c.role === 'user').pop();
    if (lastUserMsg && lastUserMsg.parts && lastUserMsg.parts[0]?.text) {
      userQuestion = lastUserMsg.parts[0].text;
    }
  }

  const qLower = userQuestion.toLowerCase();

  // Detecção de casos urgentes / violência / abuso / proteção imediata
  const isAbuseOrUrgent = qLower.includes('sexual') || qLower.includes('abuso') || qLower.includes('viol') ||
    qLower.includes('desenho') || qLower.includes('urgên') || qLower.includes('morte') ||
    qLower.includes('plantão') || qLower.includes('escola') || qLower.includes('escuta');

  if (isAbuseOrUrgent) {
    return `### 🚨 ORIENTAÇÃO OPERACIONAL E JURÍDICA IMEDIATA (ECA / LEI Nº 13.431/2017 / LEI HENRY BOREL)

⚠️ **AVISO:** Não foi possível confirmar via busca em tempo real nesta consulta (modo de contingência/fallback ativo). Informação baseada em conhecimento pré-treinado, sujeita a desatualização. Recomenda-se confirmação em fonte oficial antes de uso jurídico formal.

1. **Acolhimento e Não Revitimização (Princípio da Não Invasão):**
   - A escola e os profissionais da rede **NÃO DEVEM** questionar a criança sobre detalhes do ocorrido (vedação de inquirição repetida, conforme Lei nº 13.431/2017, art. 4º, § 1º).
   - O relato espontâneo colhido deve ser formalizado e encaminhado imediatamente ao Conselho Tutelar e à Autoridade Policial competente.

2. **Medidas Protetivas de Urgência pelo Conselho Tutelar (Art. 136 c/c Art. 101 do ECA):**
   - Aplicação imediata de medidas de proteção para afastar a criança de situações de risco ou contato com o suposto agressor.
   - Encaminhamento da criança e de seus responsáveis protetivos para atendimento médico/psicológico de retaguarda imediata (Rede de Saúde e CREAS/PAEFI).

3. **Comunicação à Autoridade Policial e Ministério Público:**
   - Notificação formal de notícia de fato criminoso à Delegacia de Polícia (preferencialmente DDM/DP especializada) e à Promotoria da Infância e Juventude para instauração de inquérito e requisição de **Depoimento Especial** em juízo.
   - Comunicação imediata para medidas cautelares protetivas (Lei Henry Borel - Lei nº 14.344/2022).

4. **Orientações à Família / Responsáveis:**
   - Orientar o responsável protetivo a zelar pela integridade da criança e não permitir contato ou permanência no mesmo ambiente que o suposto autor dos fatos até decisão judicial.`;
  }

  const isDocRequest = qLower.includes('cmdca') || qLower.includes('relat') || qLower.includes('oficio') || qLower.includes('documento') || qLower.includes('oficial') || qLower.includes('encaminh');

  if (isDocRequest) {
    return `### 📄 DOCUMENTO 1 — OFÍCIO INSTITUCIONAL DE ENCAMINHAMENTO

⚠️ **AVISO:** Modo de contingência ativo (sem busca em tempo real). Este é um modelo/template padrão, não uma consulta jurídica atualizada.

**CONSELHO TUTELAR DE HORTOLÂNDIA - SP**
*Núcleo de Inteligência e Observatório SIMCT*

**OFÍCIO Nº 084/2026/SIMCT-HORTOLÂNDIA**
Hortolândia - SP, 10 de Agosto de 2026

**À Presidência e Plenária do Conselho Municipal dos Direitos da Criança e do Adolescente — CMDCA**
Município de Hortolândia - SP

**Assunto:** Encaminhamento do Relatório Técnico e Diagnóstico do Observatório SIMCT para Deliberações e Planejamento de Políticas Públicas.

Prezados(as) Conselheiros(as),

Cumprimentando-os cordialmente, encaminhamos a Vossa Senhoria o **Relatório Técnico e Diagnóstico do Observatório SIMCT**, relativo ao acompanhamento dos prontuários e violações de direitos da infância e adolescência registrados nas Unidades I e II do Conselho Tutelar de Hortolândia.

O presente documento consolida os dados operacionais, a análise do Índice de Vulnerabilidade da Infância e Adolescência (IVIA), o mapa de pressão territorial sobre a Rede socioassistencial e as recomendações prioritárias para subsidiar as deliberações deste Egrégio Conselho e a destinação de recursos do Fundo dos Direitos da Criança e do Adolescente (FDCA).

Atenciosamente,

**EQUIPE DO OBSERVATÓRIO SIMCT**
Conselho Tutelar de Hortolândia / SP
*Sistema de Garantia dos Direitos da Criança e do Adolescente — SGDCA*

---

### 📑 DOCUMENTO 2 — RELATÓRIO TÉCNICO ANEXO

# DIAGNÓSTICO INSTITUCIONAL E RELATÓRIO TÉCNICO DO OBSERVATÓRIO SIMCT
**ÓRGÃO DESTINATÁRIO:** Conselho Municipal dos Direitos da Criança e do Adolescente (CMDCA - Hortolândia/SP)
**PERÍODO DE ANÁLISE:** Dados Ativos em Tempo Real | Base SIMCT
**FUNDAMENTAÇÃO JURÍDICA:** CF/88, ECA (Lei nº 8.069/1990), Lei Henry Borel (Lei nº 14.344/2022) e Lei nº 13.431/2017.

---

### 1. APRESENTAÇÃO E OBJETIVO
Este Relatório Técnico tem por finalidade apresentar a análise consolidada dos prontuários em acompanhamento pelo Conselho Tutelar no SIMCT, oferecendo subsídios baseados em evidências para o fortalecimento do Sistema de Garantia de Direitos e a formulação de políticas públicas preventivas pelo CMDCA.

---

### 2. METODOLOGIA
Análise dos prontuários ativos no SIMCT em Hortolândia, categorizados por direitos fundamentais, território de ocorrência (bairros), perfil etário e agentes violadores notificados.

---

### 3. PANORAMA GERAL DOS INDICADORES
| Indicador Operacional | Descrição / Observação no SIMCT |
| :--- | :--- |
| **Plataforma Ativa:** | SIMCT Hortolândia (Unidades I e II) |
| **Principais Direitos Violados:** | Convivência Familiar, Educação e Saúde |
| **Territórios Prioritários:** | Bairros com maior adensamento socioeconômico |
| **Portas de Entrada:** | Unidades de Saúde (UBS/UPA), Escolas e Conselho Tutelar |

---

### 4. ANÁLISE TERRITORIAL E ÍNDICE DE VULNERABILIDADE (IVIA)
Concentração de demandas em territórios descentralizados demandando maior suporte dos equipamentos socioassistenciais (CRAS/CREAS).

---

### 5. FRAGILIDADES E MOTOR DE ALERTAS
- 🟢 **NORMAL:** Atendimentos de rotina e matrículas escolares.
- 🟡 **MODERADO:** Reincidência familiar exigindo Plano Individual de Atendimento (PIA).
- 🟠 **ALTO:** Sobrecarga nas solicitações da rede de retaguarda.
- 🔴 **CRÍTICO:** Casos com **PROVIDÊNCIA IMEDIATA URGENTE** exigindo atuação imediata do plantão.

---

### 6. RECOMENDAÇÕES E PROPOSTAS AO CMDCA
1. **Atuação Estratégica:** Destinar recursos do FDCA para prevenção nos territórios de alta vulnerabilidade.
2. **Capacitação da Rede:** Formação contínua sobre a Escuta Especializada (Lei nº 13.431/2017) e protocolo Henry Borel.
3. **Pactuação de Fluxo:** Garantir respostas tempestivas do Executivo às requisições do Art. 136 do ECA.

---
**Data da Emissão:** 10 de Agosto de 2026
*Observatório SIMCT — Garantia de Direitos em Hortolândia/SP*`;
  }

  return `### 📊 OBSERVATÓRIO INTELIGENTE SIMCT - NÍVEL 1: MONITORAMENTO DE DADOS

⚠️ **AVISO:** Modo de contingência ativo (sem busca em tempo real ou IA externa disponível nesta consulta). Este conteúdo é um modelo institucional padrão, não uma análise jurídica atualizada.

Análise técnica do Núcleo de Inteligência e Observatório de Direitos da Criança e do Adolescente de Hortolândia - SP (ECA - Lei nº 8.069/1990):

- **Plataforma Ativa:** Sistema de Informação e Monitoramento do Conselho Tutelar (SIMCT) - Unidades I e II.
- **Foco Analítico:** Proteção Integral, Diagnóstico Socioterritorial, Gestão por Evidências e Fortalecimento do SGDCA.
- **Principais Direitos Monitorados:** Direito à Convivência Familiar e Comunitária, Direito à Educação e Direito à Integridade Física/Saúde.

---

### 📈 OBSERVATÓRIO NÍVEL 2: ANÁLISE SOCIOTERRITORIAL E ÍNDICE DE VULNERABILIDADE (IVIA)
- **Análise Socioterritorial (Bairros):** Concentração de vulnerabilidades observada em territórios com menor cobertura de equipamentos socioassistenciais (CRAS/CREAS), demandando atenção preventiva descentralizada.
- **Perfil Demográfico da Infância:**
  - *Primeira Infância (0 a 6 anos):* Foco na prevenção de negligência de cuidados primários, acompanhamento vacinal e vacância em creches.
  - *Adolescência (12 a 18 anos):* Monitoramento da evasão/abandono escolar, acolhimento socioemocional e mediação de conflitos familiares.
- **Pressão sobre a Rede:** Alta demanda sobre as portas de entrada de Saúde (UBS/UPA), Educação e Conselho Tutelar.

---

### 🚨 OBSERVATÓRIO NÍVEL 3: MOTOR DE ALERTAS E SINAIS DE RISCO
- 🟢 **VERDE (Normal):** Acompanhamento sistemático de rotina de frequências escolares e programas preventivos.
- 🟡 **AMARELO (Atenção):** Famílias com reincidência de notificações sem Plano Individual de Atendimento (PIA) articulado.
- 🟠 **LARANJA (Alerta):** Sobrecarga de solicitações na rede de retaguarda socioassistencial e atrasos na devolução de retornos.
- 🔴 **VERMELHO (Crítico):** Prontuários sinalizados com **PROVIDÊNCIA IMEDIATA URGENTE** (violência física, sexual e negligência grave), exigindo intervenção imediata do Conselheiro de Plantão e comunicação ao Ministério Público/Poder Judiciário.

---

### 💡 OBSERVATÓRIO NÍVEL 4: INTELIGÊNCIA E RECOMENDAÇÕES PARA POLÍTICAS PÚBLICAS (CMDCA / GESTÃO)
1. **Atuação do CMDCA:** Financiar programas e projetos focados na convivência comunitária nos bairros com maior vulnerabilidade apontada pelo IVIA.
2. **Capacitação da Rede de Proteção:** Formação continuada intersetorial sobre a Lei da Escuta Especializada (Lei nº 13.431/2017) e aplicação do protocolo Henry Borel (Lei nº 14.344/2022).
3. **Fluxo Unificado de Atendimento:** Pactuação de protocolos claros de acolhimento e resposta rápida às requisições do Art. 136 do ECA.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Gemini Proxy
  app.post("/api/ai/analyze", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    try {
      const { contents, model: requestedModel } = req.body || {};
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        console.warn("GEMINI_API_KEY não configurada. Usando gerador analítico SIMCT de fallback.");
        return res.json({ text: generateSIMCTFallbackResponse(contents) });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const normalizeModel = (m: string) => {
        if (!m || typeof m !== "string") return "gemini-3.7-flash";
        if (m.includes("1.5") || m.includes("2.0") || m.includes("2.5") || m.includes("3.6") || m.includes("gemini-pro")) {
          return "gemini-3.7-flash";
        }
        return m;
      };

      const primaryModels = [
        "gemini-3.7-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview"
      ];
      const candidateModels = [
        ...(requestedModel ? [normalizeModel(requestedModel)] : []),
        ...primaryModels
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      let responseText = "";
      let lastErrorMessage = "";
      let usedGrounding = false;

      for (const modelName of uniqueModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            // ✅ CORREÇÃO: ativa Google Search Grounding (busca real na web)
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
              config: {
                tools: [{ googleSearch: {} }],
              },
            });

            if (response && response.text) {
              responseText = response.text;

              // Verifica se a busca de fato retornou metadados de grounding
              const groundingMeta = (response as any)?.candidates?.[0]?.groundingMetadata;
              usedGrounding = !!(groundingMeta && (groundingMeta.groundingChunks?.length || groundingMeta.webSearchQueries?.length));

              // Se o modelo não usou grounding de fato, alerta no texto (evita alucinação de "busca realizada")
              if (!usedGrounding) {
                responseText = `⚠️ **Aviso de Integridade:** Não foi possível confirmar execução de busca em tempo real (grounding) nesta consulta. A resposta abaixo pode estar baseada em conhecimento pré-treinado e sujeita a desatualização.\n\n---\n\n${responseText}`;
              }

              break;
            }
          } catch (err: any) {
            const is503 = err?.status === "UNAVAILABLE" || err?.message?.includes("503") || err?.message?.includes("high demand");
            const is429 = err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("429") || err?.message?.includes("quota");
            lastErrorMessage = `${modelName}: ${is503 ? 'Alta Demanda (503)' : (is429 ? 'Limite de Cota (429)' : (err?.message ? err.message.slice(0, 150) : 'Falha'))}`;

            // Transient switch to fallback models
            if (is503 || is429) {
              break;
            }
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 400));
            }
          }
        }
        if (responseText) break;
      }

      if (!responseText) {
        console.info(`Acionando gerador analítico SIMCT após indisponibilidade externa (${lastErrorMessage}).`);
        responseText = generateSIMCTFallbackResponse(contents);
      }

      return res.json({ text: responseText });
    } catch (error: any) {
      console.info("Acionando fallback SIMCT por captura global.");
      return res.json({ text: generateSIMCTFallbackResponse(req.body?.contents) });
    }
  });

  // Módulo de Correção de Texto SGDCA (JARVIS)
  app.post("/api/corrigir-texto", (req, res, next) => {
    handleCorrigirTexto(req, res).catch(next);
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.json({ status: "ok" });
  });

  // Express error handler for /api
  app.use("/api", (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("API Express Error:", err);
    res.setHeader("Content-Type", "application/json");
    res.status(err.status || 500).json({ error: err.message || "Erro no servidor da API SIMCT." });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
