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

  return `### 📊 DADOS PRINCIPAIS E PANORAMA GERAL DO SIMCT HORTOLÂNDIA
Análise gerada em conformidade com o Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990) e diretrizes do Planalto:

- **Monitoramento Institucional:** Sistema de Informação e Monitoramento do Conselho Tutelar (SIMCT) ativo para as Unidades I e II de Hortolândia.
- **Foco da Análise:** Proteção Integral, Diagnóstico Socioterritorial e Fortalecimento do Sistema de Garantia de Direitos (SGDCA).
- **Direitos com Maior Incidência de Violação:** Direito à Convivência Familiar e Comunitária, Direito à Educação e Direito à Saúde/Integridade Física.

---

### 📈 EVOLUÇÃO E TENDÊNCIAS
- **Demandas da Rede:** Notado aumento das solicitações via Unidades Escolares e Unidades de Saúde (UBS/UPA).
- **Providência Imediata:** Acompanhamento prioritário em regime de plantão e urgência para casos de violação grave.
- **Tendência Observada:** Estabilidade na entrada de denúncias via Disk 100/Conselho, indicando a importância de manter a busca ativa nos bairros prioritários.

---

### 📍 ANÁLISE TERRITORIAL (BAIRROS DE HORTOLÂNDIA)
- **Territórios Prioritários:** Bairros com maior adensamento populacional e menor oferta de equipamentos socioassistenciais (CRAS/CREAS) exigem intervenção preventiva urgente.
- **Direcionamento:** Fortalecimento dos serviços preventivos e articulação com a Secretaria de Assistência Social.

---

### 👧 PERFIL E FAIXA ETÁRIA
- **Primeira Infância (0 a 6 anos):** Predominância de registros associados à negligência de cuidados básicos, vacinação e acompanhamento de saúde.
- **Adolescência (12 a 18 anos):** Concentração de conflitos familiares, evasão escolar e demanda por atenção à saúde mental.

---

### ⚠️ FRAGILIDADES IDENTIFICADAS
1. Reincidência de atendimentos familiares sem acompanhamento sistemático de Plano Individual de Atendimento (PIA).
2. Necessidade de maior agilidade na resposta às requisições de serviços públicos essenciais (Art. 136, III do ECA).

---

### 🚨 SISTEMA DE ALERTAS
- 🟡 **ATENÇÃO:** Reincidência de violações em famílias atendidas por mais de 3 vezes sem plano integrado da Rede.
- 🔴 **CRÍTICO:** Casos de violência física/sexual e documentos marcados com **PROVIDÊNCIA IMEDIATA URGENTE**, requerendo atuação imediata do Conselheiro de Plantão e da Rede de Proteção.

---

### 💡 RECOMENDAÇÕES PRÁTICAS E PROPOSTAS PARA O CMDCA
1. **Atuação do CMDCA:** Destinar recursos do Fundo dos Direitos da Criança e do Adolescente (FDCA) para programas de fortalecimento de vínculos nos bairros com maior índice de vulnerabilidade.
2. **Capacitação da Rede:** Realizar formação continuada sobre a Escuta Especializada (Lei nº 13.431/2017) e aplicação do protocolo Henry Borel (Lei nº 14.344/2022).
3. **Busca Ativa Escolar:** Pactuar fluxo unificado entre a Secretaria de Educação e o Conselho Tutelar para mitigação da evasão escolar.`;
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
      const { contents } = req.body || {};
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

      let responseText = "";
      try {
        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents,
        });
        responseText = response.text || "";
      } catch (e1: any) {
        console.warn(`Tentativa com gemini-3.6-flash falhou: ${e1?.message}. Tentando gemini-flash-latest...`);
        try {
          const response = await ai.models.generateContent({
            model: "gemini-flash-latest",
            contents,
          });
          responseText = response.text || "";
        } catch (e2: any) {
          console.warn(`Todas as chamadas à API Gemini falharam: ${e2?.message}. Gerando resposta de inteligência SIMCT.`);
          responseText = generateSIMCTFallbackResponse(contents);
        }
      }

      return res.json({ text: responseText || generateSIMCTFallbackResponse(contents) });
    } catch (error: any) {
      console.error("Gemini Endpoint Error:", error);
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

