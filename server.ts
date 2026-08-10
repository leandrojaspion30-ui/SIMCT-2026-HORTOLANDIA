import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Gemini Proxy
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { contents, model = "gemini-2.5-flash" } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "Chave GEMINI_API_KEY não configurada no servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      let response;
      try {
        response = await ai.models.generateContent({
          model,
          contents,
        });
      } catch (e1: any) {
        console.warn(`Tentativa com ${model} falhou: ${e1?.message}. Tentando gemini-2.5-flash...`);
        try {
          response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents,
          });
        } catch (e2: any) {
          console.warn(`Tentativa com gemini-2.5-flash falhou. Tentando gemini-1.5-flash...`);
          response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents,
          });
        }
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error?.message || "Falha ao gerar resposta do Analista Digital." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
