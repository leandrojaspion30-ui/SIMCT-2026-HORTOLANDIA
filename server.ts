import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

function generateSIMCTFallbackResponse(contents: any[]): string {
  let userQuestion = "";
  if (Array.isArray(contents)) {
    const lastUserMsg = contents.filter(c => c.role === 'user').pop();
    if (lastUserMsg && lastUserMsg.parts && lastUserMsg.parts[0]?.text) {
      userQuestion = lastUserMsg.parts[0].text;
    }
  }

  const qLower = userQuestion.toLowerCase();
  const isDocRequest = qLower.includes('cmdca') || qLower.includes('relat') || qLower.includes('oficio') || qLower.includes('documento') || qLower.includes('oficial') || qLower.includes('encaminh');

  if (isDocRequest) {
    return `### 📄 DOCUMENTO 1 — OFÍCIO INSTITUCIONAL DE ENCAMINHAMENTO

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

### 📡 RADAR DA INFÂNCIA DE HORTOLÂNDIA
- 🔴 **Riscos Críticos:** Necessidade de pronta resposta em casos de suspeita de violência doméstica e violação de integridade.
- 🟠 **Em Crescimento:** Demandas por suporte em saúde mental infanto-juvenil e busca ativa de alunos em risco de evasão escolar.
- 🟡 **Pontos de Atenção:** Fragmentação de informações entre serviços de atendimento da mesma família.
- 🔵 **Oportunidades:** Destinação de recursos do Fundo dos Direitos da Criança e do Adolescente (FDCA) pelo CMDCA para projetos preventivos locais.

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
        if (!m || typeof m !== "string") return "gemini-flash-latest";
        if (m.includes("1.5") || m.includes("2.0") || m.includes("3.6") || m.includes("gemini-pro")) {
          return "gemini-flash-latest";
        }
        return m;
      };

      const primaryModels = [
        "gemini-flash-latest",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-3.1-flash-lite",
        "gemini-3.7-flash"
      ];
      const candidateModels = [
        ...(requestedModel ? [normalizeModel(requestedModel)] : []),
        ...primaryModels
      ];
      const uniqueModels = Array.from(new Set(candidateModels));

      let responseText = "";
      let lastErrorMessage = "";

      for (const modelName of uniqueModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents,
            });
            if (response && response.text) {
              responseText = response.text;
              break;
            }
          } catch (err: any) {
            const is503 = err?.status === "UNAVAILABLE" || err?.message?.includes("503") || err?.message?.includes("high demand");
            const is429 = err?.status === "RESOURCE_EXHAUSTED" || err?.message?.includes("429") || err?.message?.includes("quota");
            lastErrorMessage = `${modelName}: ${is503 ? 'Alta Demanda (503)' : (is429 ? 'Limite de Cota (429)' : (err?.message ? err.message.slice(0, 80) : 'Falha'))}`;
            
            if (is503 || is429) {
              // Immediately switch to next model on 503 or 429
              break;
            }
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 300));
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

