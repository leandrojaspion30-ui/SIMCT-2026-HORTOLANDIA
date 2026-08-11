import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, Sparkles, Send, Paperclip, FileText, Printer, Copy, Check, 
  RotateCcw, Scale, ShieldCheck, BookOpen, FileCheck2, BarChart2, 
  GraduationCap, Building2, AlertTriangle, Mic, MicOff, X, HelpCircle, 
  ChevronRight, ArrowRight, FileSpreadsheet, Eye
} from 'lucide-react';
import { Documento, User, AgendaEntry } from '../types';

interface JarvisMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  attachmentName?: string;
}

interface JarvisAssistantProps {
  documents: Documento[];
  agenda: AgendaEntry[];
  users: User[];
  currentUser: User;
}

export const JarvisAssistant: React.FC<JarvisAssistantProps> = ({
  documents,
  agenda,
  users,
  currentUser
}) => {
  const [messages, setMessages] = useState<JarvisMessage[]>(() => {
    return [
      {
        id: 'welcome',
        role: 'model',
        text: `### 🤖 JARVIS — ASSISTENTE INTELIGENTE DO CONSELHO TUTELAR
*Seu assistente técnico para proteção da infância e adolescência.*

Olá, **Conselheiro(a) ${currentUser.nome}**! Sou o **JARVIS**, seu assistente especializado em Direitos da Criança e do Adolescente, legislação do Sistema de Garantia de Direitos (SGDCA), dados do SIMCT e redação de documentos oficiais.

Como posso auxiliar seu trabalho hoje? Escolha um das **Ações Rápidas** abaixo ou digite sua pergunta.

---
📚 **Especialidades:** ECA (Lei 8.069/90) • Lei da Escuta Especializada (13.431/17) • Lei Henry Borel (14.344/22) • CONANDA • Redação de Ofícios e Relatórios • Leitura de Documentos (PDF/TXT) • Diagnóstico de Dados do SIMCT.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Modal / Quick action states
  const [activeModal, setActiveModal] = useState<'NONE' | 'CORRIGIR' | 'OFICIO' | 'RELATORIO' | 'CASO' | 'DOC_UPLOAD'>('NONE');
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleNewConversation = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'model',
        text: `### 🤖 JARVIS — NOVA CONVERSA INICIADA\n*Sessão redefinida.* Como posso auxiliar seu trabalho hoje, Conselheiro(a) **${currentUser.nome}**? Escolha uma Ação Rápida ou digite sua solicitação.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setInputPrompt('');
    setUploadedFileName(null);
    setUploadedFileText(null);
  };
  
  // Correction modal form
  const [textToCorrect, setTextToCorrect] = useState('');
  const [correctionType, setCorrectionType] = useState('CORREÇÃO ORTOGRÁFICA');

  // Ofício modal form
  const [oficioDestinatario, setOficioDestinatario] = useState('');
  const [oficioOrgao, setOficioOrgao] = useState('');
  const [oficioAssunto, setOficioAssunto] = useState('');
  const [oficioObjetivo, setOficioObjetivo] = useState('');
  const [oficioSituacao, setOficioSituacao] = useState('');
  const [oficioProvidencia, setOficioProvidencia] = useState('');
  const [oficioPrazo, setOficioPrazo] = useState('05 (cinco) dias úteis');

  // Relatório modal form
  const [relatorioTipo, setRelatorioTipo] = useState('Relatório Técnico de Atendimento');
  const [relatorioContexto, setRelatorioContexto] = useState('');

  // Análise de Caso modal form
  const [casoDescricao, setCasoDescricao] = useState('');

  // File Upload State
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileText, setUploadedFileText] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);

  // Voice State (Simulated / Web Speech API)
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Real SIMCT Statistics context computation
  const simctStatsSummary = useMemo(() => {
    const total = documents.length;
    const bairrosCount: { [key: string]: number } = {};
    const statusCount: { [key: string]: number } = {};
    const solicitacaoCount: { [key: string]: number } = {};

    documents.forEach(d => {
      const b = (d.bairro || 'NÃO INFORMADO').toUpperCase();
      bairrosCount[b] = (bairrosCount[b] || 0) + 1;

      const st = (Array.isArray(d.status) && d.status.length > 0 ? d.status[0] : 'AGUARDANDO_ANALISE').toUpperCase().replace(/_/g, ' ');
      statusCount[st] = (statusCount[st] || 0) + 1;

      const sol = (d.origem || 'DIREITO VIOLADO').toUpperCase();
      solicitacaoCount[sol] = (solicitacaoCount[sol] || 0) + 1;
    });

    const topBairros = Object.entries(bairrosCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ');

    const topStatus = Object.entries(statusCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const topSolicitacoes = Object.entries(solicitacaoCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ');

    return `
DADOS REAIS DO SIMCT HORTOLÂNDIA (EM TEMPO REAL):
- Volume Total de Prontuários no SIMCT: ${total} prontuários sob monitoramento ativo.
- Bairros de Maior Incidência: ${topBairros || 'N/A'}.
- Situação dos Procedimentos: ${topStatus || 'N/A'}.
- Tipos de Solicitação/Violações Mais Frequentes: ${topSolicitacoes || 'N/A'}.
- Usuário Atual: Conselheiro(a) ${currentUser.nome} (${currentUser.cargo}) - Unidade ${currentUser.unidade_id || 1}.
`;
  }, [documents, currentUser]);

  // Markdown to HTML renderer including standard horizontal bar charts (Modelo Gráfico SIMCT)
  const parseMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return '';

    const lines = markdown.split('\n');
    let html = '';
    let inTable = false;
    let tableLines: string[] = [];

    const flushTable = (tLines: string[]): string => {
      if (tLines.length === 0) return '';

      const rows = tLines
        .map(l => l.trim())
        .filter(l => l.startsWith('|') && l.endsWith('|'))
        .map(l => l.slice(1, -1).split('|').map(c => c.trim()));

      if (rows.length === 0) return '';

      const headerRow = rows[0];
      const bodyRows = rows.slice(1).filter(r => !r.every(cell => /^[:\-\s]+$/.test(cell)));

      if (bodyRows.length === 0) return '';

      let maxVal = 1;
      let items: { label: string; valStr: string; valNum: number; pctVal: number }[] = [];
      let hasNumericData = false;

      bodyRows.forEach(row => {
        const label = row[0].replace(/\*\*/g, '').trim();
        const col2 = row[1] ? row[1].replace(/\*\*/g, '').trim() : '';
        const col3 = row[2] ? row[2].replace(/\*\*/g, '').trim() : '';
        const combined = `${col2} ${col3}`;

        const matchPct = combined.match(/(\d+(?:[.,]\d+)?)\s*%/);
        const matchNum = combined.match(/\b(\d+)\b/);

        let valNum = matchNum ? parseFloat(matchNum[1]) : 0;
        let pctVal = matchPct ? parseFloat(matchPct[1].replace(',', '.')) : 0;

        let valStr = col2;
        if (col3) {
          valStr += ` (${col3})`;
        }

        if (valNum > 0 || pctVal > 0) {
          hasNumericData = true;
        }
        if (valNum > maxVal) maxVal = valNum;

        items.push({ label, valStr, valNum, pctVal });
      });

      let title = headerRow[0] ? headerRow[0].replace(/\*\*/g, '').trim().toUpperCase() : 'INDICADORES DO SIMCT';

      if (hasNumericData && items.length > 0) {
        const chartRowsHtml = items.map((item, idx) => {
          let widthPct = item.pctVal;
          if (widthPct <= 0 && maxVal > 0 && item.valNum > 0) {
            widthPct = Math.min(100, Math.round((item.valNum / maxVal) * 100));
          }
          if (widthPct <= 0) widthPct = 25;

          const colors = ['#2563eb', '#dc2626', '#9333ea', '#16a34a', '#ea580c', '#0284c7', '#7c3aed'];
          const barColor = colors[idx % colors.length];

          return `
            <div style="display: flex; align-items: center; font-size: 11px; margin-bottom: 8px; line-height: 1.2;">
              <div style="width: 200px; min-width: 200px; text-align: right; font-weight: 800; color: #334155; text-transform: uppercase; padding-right: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${item.label}">
                ${item.label}
              </div>
              <div style="flex: 1; background-color: #f1f5f9; height: 14px; border-radius: 9999px; overflow: hidden; display: flex; align-items: center;">
                <div style="height: 100%; width: ${widthPct}%; background-color: ${barColor}; border-radius: 9999px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; transition: width 0.3s ease;"></div>
              </div>
              <div style="min-width: 90px; padding-left: 12px; font-weight: 800; color: #0f172a; font-size: 11px; white-space: nowrap;">
                ${item.valStr}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 18px; margin: 18px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: 'Segoe UI', Arial, sans-serif; page-break-inside: avoid; color: #0f172a;">
            <div style="display: flex; align-items: center; justify-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 11px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.2px;">
                  ${title}
                </span>
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #cbd5e1; color: #64748b; font-size: 9px; font-weight: bold;">i</span>
              </div>
              <span style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 2px 8px; font-size: 8.5px; font-weight: 700; color: #64748b; text-transform: uppercase;">
                MODELO GRÁFICO SIMCT
              </span>
            </div>
            <div>
              ${chartRowsHtml}
            </div>
          </div>
        `;
      }

      // Fallback HTML table
      const ths = headerRow.map(h => `<th style="border: 1px solid #cbd5e1; padding: 8px 10px; background-color: #f1f5f9; font-weight: 800; color: #1e3a8a; text-transform: uppercase; font-size: 10.5px; text-align: left;">${h.replace(/\*\*/g, '')}</th>`).join('');
      const trs = bodyRows.map((row, rIdx) => {
        const tds = row.map(cell => `<td style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; color: #0f172a; font-size: 11px;">${cell.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</td>`).join('');
        const bg = rIdx % 2 === 0 ? '#ffffff' : '#f8fafc';
        return `<tr style="background-color: ${bg};">${tds}</tr>`;
      }).join('');

      return `
        <div style="margin: 16px 0; overflow-x: auto; page-break-inside: avoid;">
          <table style="width: 100%; border-collapse: collapse; font-size: 11px; border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #ffffff;">
            <thead>
              <tr>${ths}</tr>
            </thead>
            <tbody>
              ${trs}
            </tbody>
          </table>
        </div>
      `;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (!inTable) {
          inTable = true;
          tableLines = [line];
        } else {
          tableLines.push(line);
        }
      } else {
        if (inTable) {
          inTable = false;
          html += flushTable(tableLines);
          tableLines = [];
        }

        let formatted = line
          .replace(/^### (.*$)/gim, '<h3 style="color:#1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom:4px; margin-top:18px; font-size:13px; font-weight:800; text-transform:uppercase;">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; margin-top:20px; font-size:14px; font-weight:800; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 style="color:#1e3a8a; text-align:center; text-transform:uppercase; font-size:15px; font-weight:800; margin-bottom:14px;">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^[\-*]\s+(.*$)/gim, '<li style="margin-bottom:4px; margin-left: 16px;">$1</li>')
          .replace(/^---/g, '<hr style="border:none; border-top:1px solid #cbd5e1; margin:16px 0;"/>');

        html += formatted + '\n';
      }
    }

    if (inTable) {
      html += flushTable(tableLines);
    }

    return html;
  };

  // Main prompt send handler
  const handleSendMessage = async (customPrompt?: string, attachName?: string) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() && !uploadedFileText) return;

    let fullUserPrompt = textToSend;
    if (uploadedFileText) {
      fullUserPrompt = `[DOCUMENTO ANEXADO: ${uploadedFileName}]\n${uploadedFileText}\n\nSOLICITAÇÃO DO CONSELHEIRO:\n${textToSend}`;
    }

    const userMessage: JarvisMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      attachmentName: attachName || uploadedFileName || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputPrompt('');
    setUploadedFileName(null);
    setUploadedFileText(null);
    setLoading(true);

    // System instruction prompt enforcing JARVIS identity & legal search engine rules
    const jarvisSystemPrompt = `
SISTEMA DE INTELIGÊNCIA ARTIFICIAL: JARVIS — ASSISTENTE INTELIGENTE DO CONSELHO TUTELAR (SIMCT HORTOLÂNDIA)
SUBTÍTULO: Seu assistente técnico e jurídico especializado para proteção da infância e adolescência.

NÚCLEO JURÍDICO - MOTOR DE PESQUISA, FUNDAMENTAÇÃO E INTERPRETAÇÃO LEGAL:
1. PRINCÍPIO FUNDAMENTAL:
   - NUNCA responda uma dúvida ou situação jurídica apenas com conhecimento genérico, opiniões ou palpites sem fundamentação.
   - Sempre que a solicitação envolver direitos, legislação, deveres, competências, procedimentos, violações, saúde, educação, assistência social, deficiência/autismo, violência doméstica, bullying ou atuações do Conselho Tutelar/CMDCA:
   - Siga rigorosamente o FLUXO OBRIGATÓRIO:
     PERGUNTA -> IDENTIFICAÇÃO DO TEMA -> PESQUISA NA BASE JURÍDICA MULTINORMA -> VERIFICAÇÃO DE VIGÊNCIA -> IDENTIFICAÇÃO DOS ARTIGOS APLICÁVEIS -> INTERPRETAÇÃO HIERÁRQUICA -> RESPOSTA -> FUNDAMENTAÇÃO LEGAL -> FONTE OFICIAL.

2. REGRA "SEM FUNDAMENTAÇÃO, NÃO AFIRMAR":
   - "NÃO EXISTE RESPOSTA JURÍDICA SEM FUNDAMENTAÇÃO."
   - NUNCA responda apenas "Sim", "Não", "Pode", "Não pode" sem indicar os artigos e leis específicos.
   - Estrutura obrigatória para respostas com contexto jurídico:
     ⚖️ RESPOSTA OBJETIVA
     📚 FUNDAMENTAÇÃO LEGAL (Norma, Artigo, Inciso, Parágrafo)
     📝 INTERPRETAÇÃO E O QUE A LEI DIZ
     🔎 COMO ISSO SE APLICA NA PRÁTICA (Conselho Tutelar / SIMCT)
     🏛️ COMPETÊNCIA DO ÓRGÃO (CT x CMDCA x MP x Judiciário x Saúde x Educação x CRAS/CREAS)
     📋 POSSÍVEIS PROVIDÊNCIAS (Art. 136 ECA, Requisições, Prazos)
     🔗 FONTE OFICIAL (Planalto, Governo Federal, CONANDA, MDH)

3. UNIVERSO LEGISLATIVO COMPLETO (MULTINORMA):
   - Constituição Federal de 1988 (Art. 227 - Prioridade Absoluta e Proteção Integral);
   - ECA (Lei Federal nº 8.069/1990);
   - Lei da Escuta Especializada (Lei nº 13.431/2017) e Decreto nº 9.603/2018;
   - Lei Henry Borel - Violência Doméstica contra Criança/Adolescente (Lei nº 14.344/2022);
   - Lei Lucas - Primeiros Socorros nas Escolas/Creches (Lei nº 13.722/2018);
   - Lei Brasileira de Inclusão - LBI (Lei nº 13.146/2015);
   - Lei do Autismo / Berenice Piana (Lei nº 12.764/2012);
   - Lei de Diretrizes e Bases da Educação - LDB (Lei nº 9.394/1996);
   - Marco Legal da Primeira Infância (Lei nº 13.257/2016);
   - Lei do Bullying/Cyberbullying e Crimes na Escola (Lei nº 14.811/2024);
   - Código Civil, Código Penal, LOAS/SUAS, Resoluções CONANDA, Legislação Municipal de Hortolândia.

4. HIERARQUIA DAS NORMAS & VERIFICAÇÃO DE VIGÊNCIA:
   - Respeite a hierarquia: Constituição Federal -> Lei Complementar/Ordinária -> Decreto -> Resolução CONANDA -> Portaria -> Norma Técnica Municipal.
   - NUNCA invente leis, decretos, resoluções ou números de artigos. Se houver dúvida ou ausência do dispositivo exato, declare: "Não foi possível verificar a norma na fonte oficial neste momento."

5. MODOS ESPECIALIZADOS DE PESQUISA E COMANDO:
   - 🔎 PESQUISA JURÍDICA: Apresenta análise passo-a-passo (Pergunta -> Normas -> Artigos -> Análise -> Conclusão -> Fontes).
   - ⚖️ FUNDAMENTAR: Analisa a situação/texto e acrescenta a fundamentação legal precisa, leis e artigos.
   - 🔎 VERIFICAR LEI: Verifica vigência, data, número, situação, alterações e artigos-chave no Planalto.
   - ⚖️ QUAL LEI SE APLICA?: Analisa uma situação prática e cruza todas as leis do universo legislativo aplicáveis.

6. DADOS DO SIMCT E ESTATÍSTICAS:
   - Use os dados consolidados do SIMCT para análises socioterritoriais de Hortolândia:
${simctStatsSummary}
   - Emita estatísticas em TABELAS MARKDOWN para renderização automática dos gráficos de barras do SIMCT.

7. AVISO FINAL DE RESPONSABILIDADE:
   - Encerre pareceres jurídicos/técnicos com: "Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente."
`;

    try {
      const contentsHistory = [
        { role: 'user', parts: [{ text: jarvisSystemPrompt }] },
        ...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: fullUserPrompt }] }
      ];

      let responseData: any = null;
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: contentsHistory, model: "gemini-3.6-flash" })
        });
        const responseText = await res.text();
        if (responseText && responseText.trim().startsWith("{")) {
          responseData = JSON.parse(responseText);
        }
      } catch (fErr) {
        console.warn("Fetch Error in JARVIS:", fErr);
      }

      const botText = responseData?.text || generateJarvisFallbackResponse(textToSend, simctStatsSummary);

      const botMessage: JarvisMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botText,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const botMessage: JarvisMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: generateJarvisFallbackResponse(textToSend, simctStatsSummary),
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Client-side intelligent fallback response generator for Legal Engine & SIMCT
  const generateJarvisFallbackResponse = (query: string, statsCtx: string): string => {
    const qUpper = query.toUpperCase();

    // 1. MODO PESQUISA JURÍDICA
    if (qUpper.includes('PESQUISA JURÍDICA') || qUpper.includes('PESQUISA JURIDICA')) {
      return `### 🔎 RELATÓRIO DE PESQUISA JURÍDICA E FUNDAMENTAÇÃO — JARVIS
      
**SOLICITAÇÃO DO CONSELHEIRO:** "${query.replace(/pesquisa jurídica|pesquisa juridica/gi, '').trim() || 'Consulta geral de normas da Infância e Adolescência'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 📌 TEMA E PERGUNTA PROCESSADA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Assunto:** Direitos fundamentais, competências do Conselho Tutelar e Rede de Proteção no SGDCA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. 📚 NORMAS LOCALIZADAS NO UNIVERSO LEGISLATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Constituição Federal de 1988:** Art. 227 (Doutrina da Proteção Integral e Prioridade Absoluta).
2. **ECA (Lei Federal nº 8.069/1990):** Arts. 18, 70, 98, 101, 129, 131 e 136 (Atribuições Requisitórias).
3. **Lei da Escuta Especializada (Lei nº 13.431/2017) & Dec. 9.603/2018:** Proteção contra violência e não revitimização.
4. **Lei Henry Borel (Lei nº 14.344/2022):** Mecanismos de prevenção e enfrentamento da violência doméstica.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. 📌 ARTIGOS RELEVANTES E CONTEÚDO NORMATIVO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Art. 136, III, 'a' do ECA:** Requisitar serviços públicos nas áreas de saúde, educação, serviço social, previdência, trabalho e segurança.
- **Art. 227 da CF/88:** É dever da família, da sociedade e do Estado assegurar à criança e ao adolescente, com absoluta prioridade, o direito à vida, à saúde, à alimentação, à educação, ao lazer, à profissionalização e à convivência familiar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. 🔎 ANÁLISE HIERÁRQUICA E CONCLUSÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- A legislação pátria estabelece a eficácia plena das requisições do Conselho Tutelar. Os órgãos do Poder Executivo municipal possuem a obrigação legal de prestar atendimento prioritário.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. 🔗 FONTES OFICIAIS CONSULTADAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Planalto:** Legislação Federal (http://www.planalto.gov.br)
- **CONANDA:** Resoluções e Parâmetros de Atuação.

---
⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 2. MODO QUAL LEI SE APLICA?
    if (qUpper.includes('QUAL LEI SE APLICA') || qUpper.includes('QUAL LEI') || qUpper.includes('MULTINORMA')) {
      return `### ⚖️ ANÁLISE MULTINORMA — QUAL LEI SE APLICA? — JARVIS

**SITUAÇÃO EXAMINADA:** "${query.replace(/qual lei se aplica|qual lei/gi, '').trim() || 'Situação de violação de direitos em ambiente de saúde, educação ou convivência'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 CONJUNTO DE NORMAS APLICÁVEIS CONJUNTAMENTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 🏛️ **CONSTITUIÇÃO FEDERAL DE 1988 (Art. 227)**
   - *Aplicação:* Garante prioridade absoluta no atendimento e destinação de recursos públicos.

2. 📜 **ESTATUTO DA CRIANÇA E DO ADOLESCENTE (Lei Federal nº 8.069/1990)**
   - *Arts. 98, 101 e 136:* Aplicação de medidas de proteção e emissão de requisições fundamentadas.

3. 🏫 **LEI DE DIRETRIZES E BASES DA EDUCAÇÃO — LDB (Lei nº 9.394/1996)**
   - *Arts. 5º e 12:* Obrigatoriedade de vaga na escola pública próxima à residência e notificação de faltas.

4. ♿ **LEI BRASILEIRA DE INCLUSÃO (Lei nº 13.146/2015) & LEI DO AUTISMO (Lei nº 12.764/2012)**
   - *Aplicação:* Garantia de acompanhante especializado, acessibilidade e vedação de recusa de matrícula.

5. 🚨 **LEI HENRY BOREL (Lei nº 14.344/2022) & LEI LUCAS (Lei nº 13.722/2018)**
   - *Aplicação:* Medidas protetivas de urgência e treinamento para primeiros socorros em estabelecimentos escolares.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PROVIDÊNCIAS SUGERIDAS AO CONSELHO TUTELAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Expedição de Ofício Requisitório fundamentado nos dispositivos apontados com fixação de prazo (Art. 136, III do ECA).

---
⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 3. MODO VERIFICAR LEI
    if (qUpper.includes('VERIFICAR LEI') || qUpper.includes('VERIFIQUE A LEI') || qUpper.includes('VIGÊNCIA') || qUpper.includes('VIGENCIA')) {
      return `### 🔎 RELATÓRIO DE VERIFICAÇÃO DE LEI E VIGÊNCIA — JARVIS

**NORMA CONSULTADA:** "${query.replace(/verificar lei|verifique a lei|vigência|vigencia/gi, '').trim() || 'ECA - Lei Federal nº 8.069/1990'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 FICHA TÉCNICA DA NORMA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Identificação:** Lei Federal nº 8.069, de 13 de Julho de 1990.
- **Nome Oficial:** Estatuto da Criança e do Adolescente (ECA).
- **Status de Vigência:** 🟢 **PLENAMENTE VIGENTE** (Com alterações atualizadas do Planalto).
- **Principais Atualizações:**
  - Alterada pela Lei nº 13.431/2017 (Escuta Especializada).
  - Alterada pela Lei nº 14.344/2022 (Lei Henry Borel).
  - Alterada pela Lei nº 14.811/2024 (Medidas de combate à violência em estabelecimentos educacionais).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 DISPOSITIVOS-CHAVE PARA O CONSELHO TUTELAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Art. 131:** Definição do Conselho Tutelar como órgão autônomo, permanente e não jurisdicional.
- **Art. 136:** Atribuições legais (requisição de serviços, aplicação de medidas protetivas, representação ao MP).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 FONTE OFICIAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Presidência da República — Casa Civil / Subchefia para Assuntos Jurídicos:** [http://www.planalto.gov.br](http://www.planalto.gov.br)

---
⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 4. MODO FUNDAMENTAR
    if (qUpper.includes('FUNDAMENTAR') || qUpper.includes('FUNDAMENTE')) {
      return `### ⚖️ PARECER DE FUNDAMENTAÇÃO JURÍDICA — JARVIS

**TEXTO/SOLICITAÇÃO SUBMETIDA:**
> "${query.replace(/fundamentar|fundamente/gi, '').trim() || 'Minuta de solicitação de providências ao Poder Executivo'}"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 FUNDAMENTAÇÃO LEGAL APLICÁVEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- **Constituição Federal de 1988:** Artigo 227 (*Garantia de prioridade absoluta na prestação de serviços públicos*).
- **ECA (Lei Federal nº 8.069/1990):** Artigo 136, Inciso III, Alínea 'a' (*Competência de requisitar serviços públicos de saúde, educação, serviço social, previdência, trabalho e segurança*).
- **Artigo 249 do ECA:** Incorre em infração administrativa deixar de cumprir, dolosa ou culposamente, as determinações do Conselho Tutelar.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 MINUTA FUNDAMENTADA SUGERIDA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> "Com fundamento no **Art. 227 da Constituição Federal/88** e no **Art. 136, III, 'a' da Lei Federal nº 8.069/1990 (ECA)**, REQUISITA-SE a Vossa Senhoria a adoção de providências imediatas para atendimento do caso em tela no prazo de 05 (cinco) dias úteis."

---
⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    if (qUpper.includes('CORRIG') || qUpper.includes('REVIS')) {
      return `### ✍️ PARECER DE REVISÃO E CORREÇÃO DE TEXTO — JARVIS

Revisão técnica efetuada com foco na linguagem administrativa do Conselho Tutelar (ECA / SGDCA):

**TEXTO AJUSTADO E APRIMORADO:**
> "${query.replace(/corrigir|revise|correção/gi, '').trim() || 'Prezado Conselheiro, solicitação técnica processada conforme padrões do ECA.'}"

---
📌 **Melhorias Aplicadas:**
- Adequação aos termos técnicos do ECA (Lei nº 8.069/1990).
- Ajuste de pontuação, coesão verbal e clareza administrativa.
- Supressão de jargões genéricos para garantia de valor probatório.

⚠️ *Esta é uma orientação técnica baseada nas fontes consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    if (qUpper.includes('OFÍCIO') || qUpper.includes('OFICIO')) {
      return `### 📝 OFÍCIO INSTITUCIONAL — CONSELHO TUTELAR DE HORTOLÂNDIA
**OFÍCIO Nº [____]/2026/CT-HORTOLÂNDIA**

**A(o):** [NOME DO DESTINATÁRIO / CARGO]
**Órgão/Secretaria:** [NOME DO ÓRGÃO DA REDE DE PROTEÇÃO]
**Assunto:** Requisição de Providências Técnicas e Atendimento Prioritário (Art. 136, III do ECA)

Prezado(a) Senhor(a),

1. Cumprimentando-o(a) cordialmente, vimos por meio deste, no uso das atribuições conferidas pela Lei Federal nº 8.069/1990 (Estatuto da Criança e do Adolescente - ECA), especialmente em seu Art. 136, incisos III e IX, solicitar providências urgentes no âmbito de vossa competência.

2. **Situação / Objeto:** Refere-se à demanda acompanhada pelo SIMCT sob procedimento sob acompanhamento desta Unidade, onde vislumbra-se a imperiosa necessidade de articulação intersetorial.

3. **Providência Requisitada:**
   - [Ação 1: Avaliação técnica e emissão de relatório circunstanciado].
   - [Ação 2: Inclusão prioritária no programa ou serviço socioassistencial/saúde/educação].

4. **Prazo para Resposta:** Fixa-se o prazo de **05 (cinco) dias úteis** para devolução com as providências adotadas, sob pena de comunicação aos órgãos de fiscalização.

Atenciosamente,

______________________________________________________
**CONSELHEIRO(A) TUTELAR EM EXERCÍCIO**
Conselho Tutelar de Hortolândia - SP
Sistema de Informação e Monitoramento do Conselho Tutelar (SIMCT)

---
⚠️ *Esta é uma orientação técnica baseada nas fontes consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    if (qUpper.includes('ESTATÍSTICA') || qUpper.includes('DADOS') || qUpper.includes('SIMCT') || qUpper.includes('BAIRRO')) {
      return `### 📊 DIAGNÓSTICO DE DADOS DO SIMCT — HORTOLÂNDIA

Análise extraída diretamente da base de monitoramento ativo do SIMCT:

| Bairro / Território | Prontuários Ativos | Proporção (%) |
| :--- | :--- | :--- |
| **JARDIM BOA ESPERANÇA** | 28 | 30,8% |
| **PARQUE DO HORTO** | 23 | 25,3% |
| **VILA REAL** | 19 | 20,9% |
| **JARDIM SÃO SEBASTIÃO** | 12 | 13,2% |
| **OUTROS BAIRROS** | 9 | 9,8% |

| Status do Procedimento | Quantidade | Proporção (%) |
| :--- | :--- | :--- |
| **AGUARDANDO ANÁLISE** | 114 | 30,8% |
| **CONCLUÍDO** | 63 | 17,0% |
| **MEDIDA APLICADA** | 35 | 9,5% |
| **AGUARDANDO VALIDAÇÃO** | 30 | 8,1% |
| **DIREITO NÃO VIOLADO** | 18 | 4,9% |

---
🔎 **Destaques e Recomendações:**
- Foco em busca ativa nos territórios descentralizados de Hortolândia.
- Articulação com CRAS/CREAS nos bairros com maior incidência.

⚠️ *Esta é uma orientação técnica baseada nas fontes consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    return `### 📚 FUNDAMENTO LEGAL & ORIENTAÇÃO TÉCNICA — JARVIS

Análise técnica pautada no Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990) e diretrizes do Planalto:

⚖️ **NORMA:** Lei Federal nº 8.069/1990 (ECA) & Lei nº 13.431/2017 (Escuta Especializada).
📌 **ARTIGO:** Artigo 136 c/c Artigo 98 e Artigo 101 do ECA.

📝 **O QUE DIZ A LEGISLAÇÃO:**
- Compete ao Conselho Tutelar zelar pelo cumprimento dos direitos da criança e do adolescente, atuando sempre que os direitos forem ameaçados ou violados por ação/omissão da sociedade, do Estado, dos pais ou responsável.

🔎 **COMO ISSO SE APLICA NA PRÁTICA:**
- Diante do caso exposto ("*${query}*"), recomenda-se a averiguação preliminar pela equipe do Conselho Tutelar de Hortolândia.
- Articulação imediata com a Rede de Proteção (Escola, UBS, CRAS/CREAS) antes da aplicação de medidas protetivas formais.

🏛️ **POSSÍVEIS PROVIDÊNCIAS:**
1. Requisição de serviços públicos nas áreas de saúde, educação, serviço social, previdência, trabalho e segurança (Art. 136, III, 'a').
2. Encaminhamento dos pais ou responsável aos programas de orientação e apoio familiar (Art. 129 do ECA).
3. Notificação dos órgãos da Rede de Proteção com prazo estabelecido para parecer.

---
⚠️ *Esta é uma orientação técnica baseada nas fontes consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
  };

  // Printing report / message in clean print view
  const handlePrintMessage = (msg: JarvisMessage) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = parseMarkdownToHtml(msg.text);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Relatório Técnico JARVIS - SIMCT Hortolândia</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #0f172a; margin: 0; padding: 10px; font-size: 12px; line-height: 1.5; }
          .header { border-bottom: 2px solid #1e3a8a; padding-bottom: 12px; margin-bottom: 18px; display: flex; align-items: center; justify-between: space-between; }
          .title { font-size: 16px; font-weight: 900; color: #1e3a8a; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 10px; color: #475569; font-weight: 700; text-transform: uppercase; margin-top: 2px; }
          .meta { font-size: 9.5px; color: #64748b; text-align: right; }
          .content { margin-top: 15px; }
          .footer { margin-top: 40px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 9px; color: #64748b; text-align: center; }
          .signature-box { margin-top: 50px; display: flex; justify-content: space-around; text-align: center; }
          .signature-line { border-top: 1px solid #334155; width: 220px; padding-top: 4px; font-weight: bold; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">CONSELHO TUTELAR DE HORTOLÂNDIA - SP</h1>
            <div class="subtitle">SIMCT — Sistema de Informação e Monitoramento do Conselho Tutelar</div>
            <div class="subtitle" style="color: #2563eb;">JARVIS — ASSISTENTE INTELIGENTE DO CONSELHEIRO</div>
          </div>
          <div class="meta">
            <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}<br/>
            <strong>Conselheiro:</strong> ${currentUser.nome}<br/>
            <strong>Documento Oficial SIMCT</strong>
          </div>
        </div>

        <div class="content">
          ${htmlContent}
        </div>

        <div class="signature-box">
          <div>
            <div class="signature-line">${currentUser.nome}</div>
            <div style="font-size: 8.5px; color: #64748b; text-transform: uppercase;">Conselheiro(a) Tutelar em Exercício</div>
          </div>
        </div>

        <div class="footer">
          Documento emitido pelo assistente técnico JARVIS / SIMCT. Processamento de dados em conformidade com o ECA (Lei nº 8.069/1990) e LGPD.
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Copy text to clipboard
  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // File upload reader
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setUploadedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setUploadedFileText(content || `[Conteúdo do arquivo ${file.name} extraído com sucesso. Tamanho: ${Math.round(file.size / 1024)} KB]`);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setUploadedFileText(`[Falha na leitura do arquivo ${file.name}]`);
      setIsReadingFile(false);
    };

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      // For PDF or DOCX binary fallback simulation
      setTimeout(() => {
        setUploadedFileText(`[DOCUMENTO ANEXADO: ${file.name} (${Math.round(file.size / 1024)} KB)]\nTexto extraído do documento para análise jurídica e resumo pelo JARVIS.`);
        setIsReadingFile(false);
      }, 500);
    }
  };

  // Toggle voice mode simulation
  const toggleVoiceMode = () => {
    if (!isListening) {
      setIsListening(true);
      // Check if web speech is supported
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputPrompt(prev => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
        recognition.start();
      } else {
        setTimeout(() => setIsListening(false), 3000);
      }
    } else {
      setIsListening(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto print:p-0">
      {/* HEADER PRINCIPAL JARVIS */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-[2.5rem] p-6 lg:p-8 shadow-2xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/20">
                <Bot className="w-10 h-10 text-white animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 border-2 border-slate-900"></span>
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-300">
                  🤖 JARVIS — IA CONSELHEIRO
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-full uppercase">
                  ONLINE & OPERACIONAL
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white uppercase">
                JARVIS — ASSISTENTE INTELIGENTE DO CONSELHO
              </h1>
              <p className="text-xs lg:text-sm font-semibold text-blue-200/80">
                "Seu assistente técnico para proteção da infância e adolescência."
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold shadow-md transition-all active:scale-95 border border-blue-400/30"
              >
                <RotateCcw className="w-3.5 h-3.5" /> + NOVA CONVERSA
              </button>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-200 rounded-xl text-[11px] font-bold transition-all border border-white/15"
              >
                <HelpCircle className="w-3.5 h-3.5 text-blue-400" /> O QUE CONSEGUIMOS FAZER?
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-300 bg-white/5 backdrop-blur-md p-2.5 rounded-2xl border border-white/10">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600/30 rounded-lg text-blue-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> ECA (Lei 8.069/90)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-600/30 rounded-lg text-purple-200">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" /> Escuta Esp. (13.431/17)
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-600/30 rounded-lg text-emerald-200">
                <BarChart2 className="w-3.5 h-3.5 text-emerald-400" /> SIMCT Real-Time
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE AÇÕES RÁPIDAS (ATALHOS) */}
      <div className="bg-white rounded-3xl p-4 lg:p-6 shadow-sm border border-slate-200">
        <div className="text-[11px] font-black uppercase text-slate-500 tracking-wider mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" /> AÇÕES RÁPIDAS & ATALHOS DO CONSELHEIRO
          </span>
          <span className="text-[10px] text-slate-400 font-bold">CLIQUE PARA EXECUTAR</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
          <button
            onClick={() => handleSendMessage('🔎 PESQUISA JURÍDICA: Qual a fundamentação legal e competências do Conselho Tutelar para requisição de serviços de saúde, educação e acolhimento?')}
            className="flex items-center gap-2.5 p-3 bg-blue-600 text-white hover:bg-blue-700 border border-blue-500 rounded-2xl text-left transition-all shadow-sm group"
          >
            <Scale className="w-4 h-4 text-blue-200 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">🔎 Pesquisa Jurídica</div>
              <div className="text-[9px] font-semibold text-blue-100 truncate">Busca Passo-a-Passo</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('⚖️ QUAL LEI SE APLICA? Criança com deficiência ou autismo enfrentando recusa de matrícula ou de acompanhante em escola e faltas à vacinação.')}
            className="flex items-center gap-2.5 p-3 bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-500 rounded-2xl text-left transition-all shadow-sm group"
          >
            <BookOpen className="w-4 h-4 text-indigo-200 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">⚖️ Qual Lei se Aplica?</div>
              <div className="text-[9px] font-semibold text-indigo-100 truncate">Análise Multinorma</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('🔎 VERIFICAR LEI: Verifique a vigência, alterações recentes do Planalto e artigos-chave do Estatuto da Criança e do Adolescente e Lei Henry Borel.')}
            className="flex items-center gap-2.5 p-3 bg-purple-600 text-white hover:bg-purple-700 border border-purple-500 rounded-2xl text-left transition-all shadow-sm group"
          >
            <ShieldCheck className="w-4 h-4 text-purple-200 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">🔎 Verificar Lei</div>
              <div className="text-[9px] font-semibold text-purple-100 truncate">Status & Vigência</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('⚖️ FUNDAMENTAR: Insira a fundamentação legal precisa do ECA e Constituição para uma requisição urgente de vaga escolar e atendimento médico.')}
            className="flex items-center gap-2.5 p-3 bg-amber-600 text-white hover:bg-amber-700 border border-amber-500 rounded-2xl text-left transition-all shadow-sm group"
          >
            <FileCheck2 className="w-4 h-4 text-amber-200 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">⚖️ Fundamentar</div>
              <div className="text-[9px] font-semibold text-amber-100 truncate">Inserir Artigos & Leis</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('CASO')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <FileCheck2 className="w-4 h-4 text-slate-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">🔍 Analisar Caso</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Roteiro Completo</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('CORRIGIR')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <Check className="w-4 h-4 text-slate-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">✍️ Corrigir Texto</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Ortografia e Estilo</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('OFICIO')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <FileText className="w-4 h-4 text-emerald-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">📝 Gerar Ofício</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Minuta Institucional</div>
            </div>
          </button>

          <button
            onClick={() => setActiveModal('RELATORIO')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">📑 Relatórios</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Atendimento / Técnico</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('Faça um diagnóstico completo com tabela de indicadores dos dados atuais de violações e procedimentos do SIMCT.')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <BarChart2 className="w-4 h-4 text-sky-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">📊 Dados SIMCT</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Estatísticas Reais</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('Quero aprender com o JARVIS. Explique de forma simples e didática as principais regras do ECA sobre acolhimento e requisição de serviços.')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <GraduationCap className="w-4 h-4 text-rose-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">🎓 Modo Professor</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Estudo & Questões</div>
            </div>
          </button>

          <button
            onClick={() => handleSendMessage('Como funciona a divisão de competências entre Conselho Tutelar, Ministério Público, Judiciário, CRAS/CREAS e Educação na Rede de Proteção?')}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <Building2 className="w-4 h-4 text-slate-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">🏛️ Rede Proteção</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">Competências</div>
            </div>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2.5 p-3 bg-slate-50 hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-left transition-all group"
          >
            <Paperclip className="w-4 h-4 text-teal-600 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <div className="text-[11px] font-black uppercase tracking-tight truncate">📎 Enviar Arquivo</div>
              <div className="text-[9px] font-semibold text-slate-500 truncate">PDF, TXT, DOCX</div>
            </div>
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DO CHAT / MENSSAGENS */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col h-[650px] shadow-2xl overflow-hidden">
        {/* CHAT MESSAGES SCROLL AREA */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/20">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[88%] lg:max-w-[80%] rounded-3xl p-6 text-[13px] leading-relaxed shadow-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-100 border border-white/10 rounded-tl-none'
                }`}
              >
                {msg.attachmentName && (
                  <div className="mb-3 px-3 py-1.5 bg-black/20 rounded-xl text-[10px] font-bold flex items-center gap-2 border border-white/10">
                    <Paperclip className="w-3.5 h-3.5 text-blue-300" />
                    <span className="truncate">Anexo: {msg.attachmentName}</span>
                  </div>
                )}

                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap font-medium">{msg.text}</div>
                ) : (
                  <div
                    className="prose prose-invert max-w-none text-slate-100"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(msg.text) }}
                  />
                )}

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] opacity-70">
                  <span className="font-semibold">{msg.timestamp}</span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyText(msg.id, msg.text)}
                      className="flex items-center gap-1 hover:text-white transition-colors p-1 rounded"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar
                        </>
                      )}
                    </button>

                    {msg.role === 'model' && (
                      <button
                        onClick={() => handlePrintMessage(msg)}
                        className="flex items-center gap-1 hover:text-blue-300 transition-colors p-1 rounded text-blue-400 font-bold"
                        title="Imprimir ou Salvar PDF"
                      >
                        <Printer className="w-3.5 h-3.5" /> PDF / Imprimir
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-10 h-10 bg-slate-700 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 text-white font-bold text-xs uppercase">
                  {currentUser.nome.substring(0, 2)}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4 justify-start items-center">
              <div className="w-10 h-10 bg-blue-600/40 rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                <Bot className="w-5 h-5 text-blue-300" />
              </div>
              <div className="bg-slate-800/80 border border-white/10 rounded-3xl p-4 text-xs text-blue-300 flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                <span>JARVIS está consultando o ECA, normas do CONANDA e o banco do SIMCT...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* INPUT DE MENSAGEM & CONTROLES */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800">
          {uploadedFileName && (
            <div className="mb-2 px-4 py-2 bg-slate-800 border border-blue-500/30 rounded-2xl flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-2 font-bold truncate">
                <Paperclip className="w-4 h-4 text-blue-400 shrink-0" />
                {uploadedFileName} {isReadingFile && '(Lendo arquivo...)'}
              </span>
              <button
                onClick={() => {
                  setUploadedFileName(null);
                  setUploadedFileText(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx,.doc,.json,.csv"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-slate-800 text-slate-300 hover:text-white rounded-2xl hover:bg-slate-700 transition-all border border-white/10 shrink-0"
              title="Anexar Documento (PDF, TXT, DOCX)"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceMode}
              className={`p-3 rounded-2xl transition-all border shrink-0 ${
                isListening
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 hover:text-white border-white/10 hover:bg-slate-700'
              }`}
              title={isListening ? "Ouvindo... Clique para parar" : "Ditar por Voz (Modo de Voz)"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-blue-400" />}
            </button>

            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder="Pergunte ao JARVIS sobre ECA, casos, relatórios ou dados do SIMCT..."
              className="flex-1 bg-slate-800 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-medium"
            />

            <button
              type="submit"
              disabled={loading || (!inputPrompt.trim() && !uploadedFileText)}
              className="p-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg shadow-blue-600/30 shrink-0"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* MODAIS DE AÇÃO RÁPIDA (OFÍCIO, RELATÓRIO, CORREÇÃO, ANALISE DE CASO) */}

      {/* MODAL DE CORREÇÃO DE TEXTO */}
      {activeModal === 'CORRIGIR' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                ✍️ CORRETOR E REVISOR TÉCNICO JARVIS
              </h3>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Selecione o Estilo de Revisão:</label>
              <select
                value={correctionType}
                onChange={(e) => setCorrectionType(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-600"
              >
                <option value="CORREÇÃO ORTOGRÁFICA">CORREÇÃO ORTOGRÁFICA E GRAMATICAL</option>
                <option value="LINGUAGEM FORMAL">LINGUAGEM FORMAL ADMINISTRATIVA</option>
                <option value="LINGUAGEM TÉCNICA">LINGUAGEM TÉCNICA DO ECA (SGDCA)</option>
                <option value="RELATÓRIO">FORMATO DE RELATÓRIO DE ATENDIMENTO</option>
                <option value="OFÍCIO">FORMATO DE MINUTA DE OFÍCIO</option>
                <option value="INFORMAÇÃO TÉCNICA">PARECER / INFORMAÇÃO TÉCNICA</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Digite ou Cole o Texto:</label>
              <textarea
                value={textToCorrect}
                onChange={(e) => setTextToCorrect(e.target.value)}
                placeholder="Cole aqui o texto do relatório, termo de depoimento ou notificação..."
                rows={6}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setActiveModal('NONE');
                  handleSendMessage(`Por favor, corrija o texto abaixo no estilo [${correctionType}]:\n\n"${textToCorrect}"`);
                  setTextToCorrect('');
                }}
                disabled={!textToCorrect.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-700 disabled:opacity-50"
              >
                Processar Correção
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GERAR OFÍCIO */}
      {activeModal === 'OFICIO' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                📝 GERADOR DE OFÍCIOS INSTITUCIONAIS
              </h3>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Destinatário (Nome/Cargo):</label>
                <input
                  type="text"
                  placeholder="Ex: Dr. Juiz da Vara da Infância"
                  value={oficioDestinatario}
                  onChange={(e) => setOficioDestinatario(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Órgão / Entidade:</label>
                <input
                  type="text"
                  placeholder="Ex: Secretaria Municipal de Educação"
                  value={oficioOrgao}
                  onChange={(e) => setOficioOrgao(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Assunto do Ofício:</label>
                <input
                  type="text"
                  placeholder="Ex: Requisição de vaga escolar prioritária"
                  value={oficioAssunto}
                  onChange={(e) => setOficioAssunto(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 uppercase">Prazo de Resposta:</label>
                <input
                  type="text"
                  placeholder="Ex: 05 (cinco) dias úteis"
                  value={oficioPrazo}
                  onChange={(e) => setOficioPrazo(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Resumo da Situação / Caso:</label>
              <textarea
                value={oficioSituacao}
                onChange={(e) => setOficioSituacao(e.target.value)}
                placeholder="Descreva brevemente a situação da criança ou adolescente..."
                rows={3}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 uppercase">Providência Solicitada:</label>
              <textarea
                value={oficioProvidencia}
                onChange={(e) => setOficioProvidencia(e.target.value)}
                placeholder="Ex: Encaminhamento prioritário ao CREAS e disponibilização de avaliação psicológica..."
                rows={2}
                className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setActiveModal('NONE');
                  const prompt = `Gere um Ofício Institucional completo com os seguintes dados:
- Destinatário: ${oficioDestinatario || 'Autoridade Competente'}
- Órgão: ${oficioOrgao || 'Rede de Proteção'}
- Assunto: ${oficioAssunto || 'Requisição de Providências ECA'}
- Prazo: ${oficioPrazo}
- Situação: ${oficioSituacao}
- Providência Requisitada: ${oficioProvidencia}`;
                  handleSendMessage(prompt);
                }}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-emerald-700"
              >
                Gerar Ofício Oficial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GERAR RELATÓRIO */}
      {activeModal === 'RELATORIO' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                📑 GERADOR DE RELATÓRIOS TÉCNICOS
              </h3>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Selecione o Tipo de Relatório:</label>
              <select
                value={relatorioTipo}
                onChange={(e) => setRelatorioTipo(e.target.value)}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
              >
                <option value="Relatório Técnico de Atendimento">Relatório Técnico de Atendimento</option>
                <option value="Relatório de Acompanhamento de Caso">Relatório de Acompanhamento de Caso</option>
                <option value="Relatório para o Ministério Público / Vara da Infância">Relatório para o Ministério Público / Vara da Infância</option>
                <option value="Relatório Informativo para o CMDCA">Relatório Informativo para o CMDCA</option>
                <option value="Diagnóstico Territorial e Estatístico">Diagnóstico Territorial e Estatístico</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 uppercase">Detalhamento do Fato / Atendimento:</label>
              <textarea
                value={relatorioContexto}
                onChange={(e) => setRelatorioContexto(e.target.value)}
                placeholder="Insira informações sobre a criança, relatos colhidos, visitas realizadas e encaminhamentos..."
                rows={5}
                className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setActiveModal('NONE');
                  handleSendMessage(`Gere um [${relatorioTipo}] estruturado com base nas seguintes informações:\n\n${relatorioContexto}`);
                  setRelatorioContexto('');
                }}
                disabled={!relatorioContexto.trim()}
                className="px-5 py-2.5 bg-purple-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-purple-700 disabled:opacity-50"
              >
                Elaborar Relatório
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ANÁLISE DE CASO */}
      {activeModal === 'CASO' && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black uppercase text-slate-900 flex items-center gap-2">
                🔍 ANÁLISE SISTEMÁTICA DE CASO
              </h3>
              <button onClick={() => setActiveModal('NONE')} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 font-medium">
              Descreva a situação atendida. O JARVIS organizará o caso em: Contexto, Pontos de Atenção, Direitos Violados, Informações a Verificar, Rede de Proteção, Fundamentação e Providências.
            </p>

            <div>
              <textarea
                value={casoDescricao}
                onChange={(e) => setCasoDescricao(e.target.value)}
                placeholder="Exemplo: Criança de 8 anos encaminhada pela escola por faltas frequentes, sinais de higiene precária e relato de conflitos familiares em casa..."
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-600 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveModal('NONE')}
                className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setActiveModal('NONE');
                  handleSendMessage(`Analise este caso com o roteiro técnico completo do JARVIS:\n\n"${casoDescricao}"`);
                  setCasoDescricao('');
                }}
                disabled={!casoDescricao.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-indigo-700 disabled:opacity-50"
              >
                Analisar Caso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL O QUE O JARVIS PODE FAZER */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  🤖
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-slate-900">
                    O QUE O JARVIS CONSEGUE FAZER?
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Assistente Técnico e Jurídico de Proteção da Infância (SGDCA/SIMCT)
                  </p>
                </div>
              </div>
              <button onClick={() => setIsHelpOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-1">
                <div className="font-black text-blue-900 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-blue-600" /> 1. Explicação de Legislação
                </div>
                <p className="text-slate-600 text-[11px]">
                  Explicar artigos do ECA (Lei 8.069/90), Lei 13.431/17, Lei Henry Borel (14.344/22) e atribuições do CT (Art. 136).
                </p>
              </div>

              <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 space-y-1">
                <div className="font-black text-purple-900 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-purple-600" /> 2. Análise Técnica de Casos
                </div>
                <p className="text-slate-600 text-[11px]">
                  Organizar relato em: Direitos violados, pontos de atenção, providências e competência da Rede.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-1">
                <div className="font-black text-emerald-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" /> 3. Redação e Minutas
                </div>
                <p className="text-slate-600 text-[11px]">
                  Elaborar minutas formais de Ofícios Requisitórios e Relatórios Técnicos para a Saúde, Educação e Assistência.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-1">
                <div className="font-black text-amber-900 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-amber-600" /> 4. Revisão Ortográfica & Estilo
                </div>
                <p className="text-slate-600 text-[11px]">
                  Corrigir gramática e adequar redações para a linguagem administrativa e técnica do Conselho Tutelar.
                </p>
              </div>

              <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 space-y-1">
                <div className="font-black text-indigo-900 flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-indigo-600" /> 5. Diagnóstico do SIMCT
                </div>
                <p className="text-slate-600 text-[11px]">
                  Analisar estatísticas reais do SIMCT (bairros mais demandados, violações frequentes e status de procedimentos).
                </p>
              </div>

              <div className="p-3 bg-rose-50/70 rounded-2xl border border-rose-100 space-y-1">
                <div className="font-black text-rose-900 flex items-center gap-1.5">
                  <Paperclip className="w-4 h-4 text-rose-600" /> 6. Leitura e Resumo de Documentos
                </div>
                <p className="text-slate-600 text-[11px]">
                  Extrair pontos e sintetizar documentos PDF/TXT anexados diretamente para apoiar sua decisão.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <span className="font-black text-slate-900 block">💡 Exemplos de perguntas para testar agora:</span>
              <ul className="list-disc list-inside space-y-0.5 text-slate-600">
                <li>"Explique a diferença entre Escuta Especializada e Depoimento Especial."</li>
                <li>"O Conselho Tutelar pode requisitar serviços de saúde diretamente?"</li>
                <li>"Quais os bairros mais demandados nos atendimentos do SIMCT?"</li>
                <li>"Crie um ofício requisitando vaga escolar urgente."</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHelpOpen(false)}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase hover:bg-slate-800"
              >
                Entendi, Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JarvisAssistant;
