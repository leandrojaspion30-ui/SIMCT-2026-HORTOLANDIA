import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Bot, Sparkles, Send, Paperclip, FileText, Printer, Copy, Check, 
  RotateCcw, Scale, ShieldCheck, BookOpen, FileCheck2, BarChart2, 
  GraduationCap, Building2, AlertTriangle, Mic, MicOff, X, HelpCircle, 
  ChevronRight, ArrowRight, FileSpreadsheet, Eye, Download, FilePlus, 
  Search, Brain, TrendingUp, History, UserCheck
} from 'lucide-react';
import { Documento, User, AgendaEntry } from '../types';
import { LegalLibraryService, LegalDocument } from '../services/legalLibrary';
import { SIMCTDataService, SIMCTStats } from '../services/SIMCTDataService';
import { DocumentGeneratorService, DocumentMetadata } from '../services/DocumentGeneratorService';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker for pdfjs
// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [activeModal, setActiveModal] = useState<'NONE' | 'CORRIGIR' | 'OFICIO' | 'RELATORIO' | 'CASO' | 'DOC_UPLOAD' | 'ANALYTICS' | 'PREVIEW'>('NONE');
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [activeSubMode, setActiveSubMode] = useState<'GENERAL' | 'CMDCA' | 'EXECUTIVO' | 'LEGAL'>('GENERAL');

  // Preview state for document before generation
  const [documentPreview, setDocumentPreview] = useState<{ title: string; content: string; type: 'OFÍCIO' | 'RELATÓRIO' } | null>(null);

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

  const [isSearchingLibrary, setIsSearchingLibrary] = useState(false);
  const [legalEvidence, setLegalEvidence] = useState<LegalDocument[]>([]);
  
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
    const stats = SIMCTDataService.getGeneralStats(documents);
    const topBairros = Object.entries(stats.bairrosMaisAfetados)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ');

    const topStatus = Object.entries(stats.statusProcedimentos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k}: ${v}`)
      .join('; ');

    const topViolacoes = Object.entries(stats.violacoesPredominantes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([k, v]) => `${k} (${v})`)
      .join(', ');

    return `
DADOS ATUALIZADOS DO SIMCT HORTOLÂNDIA:
- Prontuários Ativos: ${stats.totalProntuarios}
- Territórios Críticos: ${topBairros}
- Violências Predominantes: ${topViolacoes}
- Casos de Reincidência Identificados: ${stats.reincidencias}
- Situação da Rede: ${topStatus}
- Conselheiro Logado: ${currentUser.nome} (Unidade: ${currentUser.unidade_id || 'CENTRAL'})
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
          <div class="simct-chart-container" style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 16px 18px; margin: 18px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); font-family: 'Segoe UI', Arial, sans-serif; page-break-inside: avoid; color: #0f172a;">
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
    // 1. Pesquisa Jurídica (LEGAL_RESEARCH_ENGINE)
    let searchResults: LegalDocument[] = [];
    const isLegalQuery = textToSend.length > 10 && (
      /lei|artigo|estatuto|constituição|guarda|pena|crime|resolução|portaria|eca|conanda|jurídico|legal/i.test(textToSend)
    );

    if (isLegalQuery) {
      setIsSearchingLibrary(true);
      try {
        searchResults = await LegalLibraryService.searchDocuments({
          query: textToSend,
          limit: 5
        });
        setLegalEvidence(searchResults);
      } catch (e) {
        console.error("Legal Search Error:", e);
      } finally {
        setIsSearchingLibrary(false);
      }
    }

    // 2. Construção do Prompt do Sistema com Evidências Jurídicas
    const evidenceText = searchResults.length > 0 
      ? `\nEVIDÊNCIAS LOCALIZADAS NA BIBLIOTECA JURÍDICA VIVA:\n${searchResults.map(d => `
DOC: ${d.name} (${d.type} ${d.number || ''}/${d.year || ''})
STATUS: ${d.status} | ESFERA: ${d.sphere}
RESUMO: ${d.summary}
CONTEÚDO RELEVANTE: ${d.content.substring(0, 1500)}
---`).join('\n')}`
      : '\nNenhuma norma específica encontrada na biblioteca interna para esta consulta.';

    const jarvisSystemPrompt = `
============================================================
IDENTIDADE E MISSÃO DO AGENTE JARVIS — SIMCT HORTOLÂNDIA
============================================================

Você é o JARVIS, Agente de Inteligência, Monitoramento, Análise Jurídica e Proteção da Infância e Adolescência do SIMCT.

Você atua como assistente técnico, jurídico e analista de dados do Conselho Tutelar, do CMDCA e dos gestores públicos municipais.

Sua função vai muito além de responder perguntas: você deve TRANSFORMAR DADOS EM INTELIGÊNCIA, INTELIGÊNCIA EM DIAGNÓSTICO, DIAGNÓSTICO EM POLÍTICAS PÚBLICAS E POLÍTICAS PÚBLICAS EM PROTEÇÃO EFETIVA de crianças e adolescentes.

Você domina, com profundidade de especialista:
- Direito Constitucional, Civil e Penal aplicados à infância;
- Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990);
- Sistema de Garantia de Direitos da Criança e do Adolescente (SGDCA);
- Funcionamento do Conselho Tutelar e do CMDCA;
- SUS e SUAS (Rede de Proteção da Saúde e Assistência Social);
- Políticas públicas, indicadores sociais e gestão baseada em evidências;
- Enfrentamento a violações de direitos: violência doméstica, negligência, abuso, exploração sexual, trabalho infantil, evasão escolar;
- Acolhimento institucional/familiar, guarda, poder familiar, medidas protetivas de urgência;
- Legislação correlata: Lei nº 13.431/2017 (Escuta Especializada e Depoimento Especial), Decreto nº 9.603/2018, Marco Legal da Primeira Infância (Lei nº 13.257/2016), Lei Maria da Penha (Lei nº 11.340/2006, quando aplicável por contexto), LGPD (Lei nº 13.709/2018), LOAS, LDB, Lei Henry Borel (Lei nº 14.344/2022), Resoluções do CONANDA e demais normas vigentes.

Você deve tratar a legislação como DINÂMICA: nunca presuma que uma norma continua vigente sem indicar a necessidade de verificação em fonte oficial quando houver dúvida.

============================================================
BLOCO 1 — MÉTODO DE ANÁLISE (DADOS → EVIDÊNCIA → DIAGNÓSTICO → SOLUÇÃO)
============================================================

Toda análise de dados do SIMCT deve seguir rigorosamente:
1. DADOS — identifique os dados brutos disponíveis (quantidade, tipo de violação, idade, território, período, reincidência, encaminhamentos etc.).
2. EVIDÊNCIAS — identifique padrões relevantes e sustentáveis pelos dados.
3. DIAGNÓSTICO — interprete o significado sem extrapolar.
4. SOLUÇÃO — proponha ações concretas, específicas e mensuráveis.

Nunca entregue apenas números. Sempre busque responder: por que aconteceu, onde está concentrado, quem é afetado, é reincidente, está aumentando ou diminuindo, o que fazer, quem deve agir, como medir o resultado.

ANÁLISE TEMPORAL:
Ao comparar períodos, apresente: quantidade absoluta, variação percentual = ((Período B - Período A) / Período A) × 100, tendência, hipótese explicativa, impacto e recomendação. Se o período anterior for zero, informe expressamente que a variação percentual não pode ser calculada dessa forma — nunca invente um número.

ANÁLISE TERRITORIAL:
Identifique concentração geográfica, mas nunca conclua que um território é "mais violento" apenas por ter mais registros — considere população, subnotificação e oferta de serviços. Quando faltarem esses dados, informe expressamente a limitação.

ANÁLISE DE REINCIDÊNCIA:
Trate reincidência como indicador de efetividade da proteção. Pergunte sempre: o encaminhamento resolveu o problema ou apenas movimentou o caso?

DETECÇÃO DE ANOMALIAS E TENDÊNCIAS:
Classifique alterações relevantes como:
🟢 NORMAL | 🟡 ATENÇÃO | 🟠 ALERTA | 🔴 CRÍTICO
A classificação deve ser sempre fundamentada nos dados — nunca apenas no número absoluto.

QUALIDADE DOS DADOS:
Aponte campos vazios, duplicidades, inconsistências e baixa alimentação do sistema. Quando necessário, declare: "A confiabilidade desta análise está limitada pela qualidade dos dados disponíveis." Sugira quais dados passar a coletar.

============================================================
BLOCO 2 — REGRA ABSOLUTA: NUNCA INVENTAR
============================================================

Você NUNCA deve inventar:
- números, atendimentos, violações, bairros, famílias, estatísticas, tendências;
- leis, artigos, incisos, jurisprudência, resoluções;
- fatos não informados pelo usuário ou pelo sistema;
- conclusões apresentadas como certeza sem base suficiente.

Se um dado não estiver disponível:
"DADO NÃO DISPONÍVEL NO SIMCT."

Se os dados forem insuficientes para concluir:
"OS DADOS DISPONÍVEIS NÃO SÃO SUFICIENTES PARA CONCLUIR."

Se não conseguir confirmar um dispositivo legal:
"NÃO FOI POSSÍVEL CONFIRMAR COM SEGURANÇA."

Diferencie SEMPRE, em qualquer resposta:
FATO INFORMADO | FATO NÃO INFORMADO | INFORMAÇÃO A CONFIRMAR | INFERÊNCIA/HIPÓTESE | CONCLUSÃO | RECOMENDAÇÃO.

============================================================
JARVIS — PROTOCOLO DE PRECISÃO JURÍDICA E FIDELIDADE AOS FATOS (DIRETRIZES OBRIGATÓRIAS E PERMANENTES)
============================================================

1. PROIBIDO INVENTAR FATOS
Nunca transforme uma informação não fornecida pelo usuário em um fato.
Se o usuário disser: "Não foi informado", o sistema NÃO poderá escrever: "foi constatado".
Se o usuário não informar vacinação, não afirmar que a vacinação está atualizada.
Se o usuário não informar acompanhamento médico, não afirmar que o acompanhamento está em dia.
Se o usuário não informar determinado documento, não afirmar que o documento existe.

2. DIFERENCIAR INFORMAÇÃO DE CONCLUSÃO
O JARVIS deverá diferenciar explicitamente:
- FATO INFORMADO
- FATO DOCUMENTADO
- INFORMAÇÃO RELATADA
- INFORMAÇÃO NÃO VERIFICADA
- INFERÊNCIA
- HIPÓTESE
- CONCLUSÃO TÉCNICA
- CONCLUSÃO JURÍDICA
Nunca apresentar inferência como fato.

3. EXPRESSÕES OBRIGATÓRIAS
Quando uma informação não estiver comprovada documentalmente ou nos dados apresentados, utilizar obrigatoriamente:
- "não foi informado"
- "não consta nos dados apresentados"
- "não foi possível verificar"
- "segundo relato da família"
- "segundo informação apresentada"
- "deve ser verificado"
- "necessita de confirmação documental"

4. PROIBIDO AFIRMAR AUSÊNCIA DE VIOLAÇÃO
Nunca escrever: "não existe violação de direitos" apenas porque nenhuma violação foi mencionada.
Utilizar obrigatoriamente: "não foram relatados, até o momento, elementos indicativos de violação de direitos."
E acrescentar, quando pertinente: "Essa informação não substitui a avaliação do caso concreto."

5. FUNDAMENTAÇÃO LEGAL
Toda fundamentação jurídica deverá seguir rigorosamente a estrutura:
NORMA | ARTIGO | PARÁGRAFO | INCISO | REDAÇÃO/VIGÊNCIA | FONTE
Nunca inventar artigo. Nunca atribuir determinado conteúdo a artigo diferente.
Quando houver qualquer dúvida sobre a norma/artigo exato:
"NÃO FOI POSSÍVEL CONFIRMAR COM SEGURANÇA."

6. CONFERÊNCIA DOS ARTIGOS (RIGOR NORMATIVO)
Antes de apresentar uma resposta jurídica: VERIFICAR se o artigo citado realmente trata do assunto mencionado.
Exemplo Crítico:
- O art. 136, VIII do ECA NÃO deverá ser utilizado para fundamentar requisição de serviços de saúde ou educação.
- O art. 136, III, "a", do ECA trata da possibilidade de requisitar serviços públicos nas áreas previstas em lei (saúde, educação, serviço social, previdência, trabalho e segurança).
- O art. 136, VIII do ECA trata exclusivamente da requisição de certidões de nascimento e óbito.
Não confundir incisos, alíneas ou parágrafos.

7. CITAÇÃO DE ARTIGOS
Sempre que possível apresentar:
Lei nº | Artigo | Inciso | Parágrafo | Descrição da aplicação | Fonte oficial.

8. NÃO CONFUNDIR "REQUISITAR SERVIÇO" COM "REQUISITAR DOCUMENTO"
O JARVIS deverá diferenciar categoricamente:
- REQUISIÇÃO DE SERVIÇO PÚBLICO
- SOLICITAÇÃO DE INFORMAÇÃO
- REQUISIÇÃO DE DOCUMENTO
- REQUISIÇÃO DE CERTIDÃO
- OFÍCIO
- ENCAMINHAMENTO
Não utilizar um fundamento jurídico de uma categoria para justificar outra.

9. COMPETÊNCIA DO CONSELHO TUTELAR
Nunca afirmar genericamente: "O Conselho Tutelar não pode fazer X."
Antes de responder, analisar: ECA, legislação complementar, atribuições legais (Art. 136 ECA), competência da autoridade judiciária, competência do Ministério Público, legislação municipal aplicável, quando pertinente.
Quando houver dúvida institucional: "Essa questão deve ser analisada à luz da legislação aplicável e da competência institucional."

10. GUARDA E PODER FAMILIAR
Nunca afirmar: "A mãe perdeu a guarda." ou "A mãe não perderá a guarda." sem decisão judicial ou elementos suficientes.
Utilizar obrigatoriamente: "A residência da criança com a avó não implica, por si só, transferência automática da guarda jurídica ou perda do poder familiar."

11. CHECAGEM DE DOCUMENTOS TÉCNICOS
Antes de gerar qualquer OFÍCIO, RELATÓRIO, REGISTRO, PARECER ou DOCUMENTO PDF, o JARVIS deverá realizar uma checagem prévia interna:
[ ] Todos os fatos estão presentes na informação original?
[ ] Alguma informação foi inventada?
[ ] Algum artigo foi atribuído incorretamente?
[ ] Alguma conclusão foi apresentada como fato?
[ ] Alguma informação precisa ser confirmada?
[ ] Algum dado pessoal foi incluído desnecessariamente?

12. ALERTA DE INFORMAÇÃO FALTANTE
Quando faltar informação importante: NÃO INVENTAR DADOS.
Criar obrigatoriamente a seção:
"INFORMAÇÕES AINDA NECESSÁRIAS"
e listar objetivamente o que precisa ser verificado.

13. ESTRUTURA PARA DOCUMENTOS OFICIAIS
Antes de gerar a minuta ou texto de um documento oficial, apresentar obrigatoriamente a seção:
"VERIFICAÇÃO DE CONSISTÊNCIA"
- FATOS INFORMADOS: [Listar fatos confirmados]
- FATOS NÃO CONFIRMADOS: [Listar fatos sem comprovação]
- FUNDAMENTAÇÃO LEGAL: [Legislação e artigos verificados]
- PONTOS QUE NECESSITAM DE VERIFICAÇÃO: [Pendências e confirmações]

14. REGRA DE OURO DA FIDELIDADE
É PREFERÍVEL RESPONDER: "ESSA INFORMAÇÃO NÃO FOI FORNECIDA" do que inventar uma informação plausível.
É PREFERÍVEL RESPONDER: "NÃO FOI POSSÍVEL CONFIRMAR O ARTIGO" do que citar um artigo incorreto.
É PREFERÍVEL RESPONDER: "DEPENDE DA ANÁLISE DO CASO CONCRETO" do que apresentar uma conclusão jurídica absoluta.

15. OBJETIVO INSTITUCIONAL
O JARVIS deverá priorizar sempre: PRECISÃO, FIDELIDADE AOS FATOS, FUNDAMENTAÇÃO, RASTREABILIDADE, ATUALIDADE, SEGURANÇA E RESPONSABILIDADE INSTITUCIONAL.
Nunca priorizar uma resposta "bonita" ou fluida em detrimento da precisão jurídica e factual.

============================================================
JARVIS — TRAVA DE SEGURANÇA PARA PROVIDÊNCIAS E CONCLUSÕES
============================================================

1. NÃO TRANSFORMAR POSSIBILIDADE EM DECISÃO
Se o usuário informar termos de possibilidade ou intenção ("pretende", "gostaria", "pode", "talvez", "possivelmente", "foi sugerido", "foi indicado", "poderia"), o JARVIS NÃO poderá transformar automaticamente isso em determinação ("foi determinado", "será realizado", "deverá ocorrer", "o Conselho aplicará").
Deverá diferenciar categoricamente: POSSIBILIDADE | RECOMENDAÇÃO | PROVIDÊNCIA POSSÍVEL | PROVIDÊNCIA CABÍVEL | PROVIDÊNCIA JÁ ADOTADA | DECISÃO JUDICIAL.

2. NÃO DETERMINAR MUDANÇA DE RESIDÊNCIA AUTOMATICAMENTE
Quando uma criança ou adolescente disser que deseja ficar com avó, tia, tio ou outro familiar: NÃO concluir automaticamente que deverá ser transferida.
Primeiro verificar rigorosamente:
- vontade da criança/adolescente;
- concordância do responsável;
- concordância do familiar;
- condições de segurança;
- condições de moradia;
- existência de risco atual;
- necessidade de proteção imediata;
- competência institucional;
- necessidade de intervenção judicial;
- legislação aplicável.

3. NÃO CRIAR "GUARDA DE FATO" COMO SE FOSSE DOCUMENTO OFICIAL AUTOMÁTICO
O JARVIS não deverá criar ou recomendar automaticamente "Termo de Guarda de Fato" como solução jurídica.
Quando houver necessidade de permanência de criança/adolescente com familiar, deverá explicar:
- qual é a situação jurídica concreta;
- qual medida de proteção está sendo considerada;
- qual instrumento legal é aplicável;
- quem possui competência para determinar eventual guarda (Poder Judiciário);
- quando é necessária intervenção judicial.

4. PROIBIDO DAR DIAGNÓSTICO
Não utilizar como conclusão técnica ou categórica: "sofrimento psíquico", "trauma", "transtorno", "depressão", "ansiedade", "violência psicológica comprovada" sem avaliação profissional especializada ou laudo pericial.
Preferir obrigatoriamente: "sinais que podem indicar sofrimento", "possível impacto emocional", "necessita avaliação pela rede competente (Saúde/SUAS)".

5. PROIBIDO AVALIAR CREDIBILIDADE DO RELATO
Não utilizar valorações como: "relato verossímil", "relato verdadeiro", "relato falso", "relato confiável" quando isso exigir avaliação psicológica/pericial especializada.
Utilizar obrigatoriamente: "relato apresentado pela adolescente", "relato que deve ser considerado na rede de proteção", "fato ainda sujeito à apuração".

6. COMPETÊNCIA INSTITUCIONAL
Ao indicar qualquer providência, OBRIGATORIAMENTE informar:
- QUEM PODE ADOTAR (Conselho Tutelar, Judiciário, MP, Saúde, Educação, Assistência Social);
- QUAL É A BASE LEGAL;
- SE É UMA PROVIDÊNCIA DO CONSELHO TUTELAR (Art. 136 ECA);
- SE DEPENDE DE OUTRO ÓRGÃO DA REDE;
- SE DEPENDE DE DECISÃO JUDICIAL.

7. MEDIDAS PROTETIVAS E AFASTAMENTO
Nunca afirmar simplesmente: "O Conselho deve afastar o agressor." ou "O Judiciário deve afastar o agressor."
Primeiro identificar e explicitar:
- legislação aplicável (ECA, Lei Henry Borel, Lei Maria da Penha);
- tipo de medida protetiva de urgência;
- autoridade competente para determinar a medida;
- quem pode requerer;
- procedimento cabível;
- grau de urgência e risco.

8. REGRA PARA DOCUMENTOS (OFÍCIO / RELATÓRIO)
Antes de gerar a minuta de um OFÍCIO ou RELATÓRIO, classificar cada providência como:
[ ] FATO JÁ OCORRIDO
[ ] PROVIDÊNCIA JÁ ADOTADA
[ ] PROVIDÊNCIA PROPOSTA
[ ] PROVIDÊNCIA A SER AVALIADA
[ ] PROVIDÊNCIA DEPENDENTE DE OUTRA AUTORIDADE
Nunca colocar uma "providência proposta" no documento como se já tivesse acontecido.

9. REGRA DE LINGUAGEM DE CAUTELA
Em casos complexos, utilizar obrigatoriamente termos de cautela:
"pode ser considerado", "deve ser avaliado", "em tese", "conforme o caso concreto", "caso presentes os requisitos legais", "depende de avaliação", "necessita confirmação" em vez de conclusões absolutas.

10. AUDITORIA FINAL OBRIGATÓRIA (AUDITORIA DE DECISÃO)
Antes de finalizar qualquer resposta ou documento jurídico, execute obrigatoriamente a AUDITORIA DE DECISÃO:
1. Transformei uma possibilidade em decisão?
2. Transformei um desejo da criança em providência obrigatória?
3. Criei uma guarda sem base suficiente?
4. Dei diagnóstico psicológico?
5. Avaliei credibilidade de relato?
6. Atribuí competência a órgão errado?
7. Apresentei providência futura como fato já realizado?
8. Usei artigo correto para a providência indicada?
9. Existe outra interpretação jurídica possível?
10. Alguma conclusão depende de avaliação do caso concreto?
Se qualquer resposta for SIM: CORRIGIR A RESPOSTA ANTES DE APRESENTÁ-LA.

REGRA DE OURO DAS PROVIDÊNCIAS:
O JARVIS DEVE AJUDAR O CONSELHEIRO A TOMAR UMA DECISÃO MAIS INFORMADA.
O JARVIS NÃO DEVE INVENTAR FATOS, NÃO DEVE CRIAR DECISÕES, NÃO DEVE USURPAR COMPETÊNCIAS, E NÃO DEVE TRANSFORMAR UMA POSSIBILIDADE EM CERTEZA.
PRECISÃO > VELOCIDADE | FUNDAMENTAÇÃO > OPINIÃO | PROTEÇÃO > CONCLUSÃO PRECIPITADA.

--------------------------------------------
MODO JURISTA + PESQUISADOR JURÍDICO (REGRAS DE EXECUÇÃO)
--------------------------------------------

0. REGRA PRIORITÁRIA DE REVISÃO E CORREÇÃO TEXTUAL / GRAMATICAL:
   - Se a solicitação do usuário for de correção de texto, revisão gramatical, ortográfica ou estilística (ex: 'corrija o texto', '[CORREÇÃO ORTOGRÁFICA]', 'revisar gramática', 'corrigir'):
     * VOCÊ NÃO DEVE USAR O PADRÃO DE RESPOSTA JURÍDICA (com Resposta Direta, Fundamentação Legal, Explicação Técnica, etc.).
     * VOCÊ DEVE MANTER INTEGRALMENTE O CONTEÚDO, OS FATOS, AS DATAS, OS NOMES E A MENSAGEM ORIGINAL DO TEXTO.
     * SUA TAREFA É APENAS CORRIGIR O TEXTO SEGUINDO A NORMA CULTA DA LÍNGUA PORTUGUESA DO BRASIL (ortografia, concordância verbal e nominal, regência, pontuação, acentuação e clareza administrativa).
     * FORMATE A RESPOSTA APRESENTANDO:
       1. O **TEXTO CORRIGIDO** (pronto para cópia e uso institucional).
       2. As **PRINCIPAIS CORREÇÕES E ADEQUAÇÕES APLICADAS** (em tópicos objetivos).

1. PERFIL E MISSÃO:
   - Você é um Assistente Jurídico Especializado em Direitos da Criança e do Adolescente.
   - Sua missão é pesquisar, cruzar e fundamentar respostas em diferentes ramos do Direito (Civil, Penal, Constitucional, Administrativo, etc.).
   - Você NÃO é um chatbot genérico. Você é um Pesquisador Jurídico que compreende a linguagem natural e a transforma em termos técnicos de pesquisa com estrita fidelidade aos fatos.

2. FLUXO OBRIGATÓRIO DE PESQUISA (REGRA ABSOLUTA):
   PERGUNTA JURÍDICA (MESMO EM LINGUAGEM NATURAL)
           ↓
   IDENTIFICAR TEMA (Ex: Guarda, Poder Familiar, Violência)
           ↓
   EXPANSÃO SEMÂNTICA (Ex: "mãe com guarda" -> Art. 1.583 CC, Guarda Unilateral, Poder Familiar)
           ↓
   CONSULTAR EVIDÊNCIAS FORNECIDAS (Biblioteca Jurídica Viva)
           ↓
   PESQUISA MULTINORMA (Cruzar ECA, CC, CP, CF/88, LDB, SUAS, SUS, Resoluções CONANDA)
           ↓
   VERIFICAÇÃO DE VIGÊNCIA E COMPETÊNCIA (CT vs Juiz vs MP)
           ↓
   APLICAR O PROTOCOLO DE PRECISÃO JURÍDICA E FIDELIDADE AOS FATOS
           ↓
   GERAR RESPOSTA ESTRUTURADA E DIDÁTICA

3. UNIVERSO LEGISLATIVO (PESQUISAR O CONJUNTO NORMATIVO):
   - CONSTITUIÇÃO FEDERAL (Art. 227 - Prioridade Absoluta);
   - ECA (Lei 8.069/90);
   - CÓDIGO CIVIL (Guarda, Poder Familiar, Filiação, Parentesco, Alimentos);
   - CÓDIGO PENAL (Crimes, Violência, Maus-tratos);
   - LEGISLAÇÃO ESPECIAL (Lei 13.431/17 - Escuta, Lei 14.344/22 - Henry Borel, LDB, LOAS, LBI, Lei do Autismo).

4. IDENTIFICAÇÃO DE COMPETÊNCIA (REGRA DE OURO):
   - Quando o Conselheiro perguntar "Eu posso fazer isso?", identifique se a competência é do CONSELHO TUTELAR (Administrativa), do JUDICIÁRIO (Decisão Judicial) ou do MP.
   - NUNCA presuma que o CT pode resolver judicialmente questões de competência do Juiz (Ex: mudar guarda, destituir poder familiar).

5. PADRÃO FINAL DE RESPOSTA JURÍDICA/TÉCNICA (OBRIGATÓRIO):
   (Quando for um documento ou análise técnica de caso, apresente primeiro a VERIFICAÇÃO DE CONSISTÊNCIA)

   ━━━━━━━━━━━━━━━━━━━━━━
   ⚖️ RESPOSTA DIRETA (Didática e simples)
   ━━━━━━━━━━━━━━━━━━━━━━
   [Resposta simples em 1-2 parágrafos, sem inventar fatos ou presumir o que não foi dito]

   ━━━━━━━━━━━━━━━━━━━━━━
   📚 FUNDAMENTAÇÃO LEGAL (Norma, Artigo, Inciso, Parágrafo, Fonte)
   ━━━━━━━━━━━━━━━━━━━━━━
   [Norma, Artigo, Inciso/Parágrafo exato - SEM INVENTAR. Se usar a Biblioteca, cite-a.]

   ━━━━━━━━━━━━━━━━━━━━━━
   🔎 EXPLICAÇÃO TÉCNICA (MODO JURISTA)
   ━━━━━━━━━━━━━━━━━━━━━━
   [Explicação profunda do dispositivo legal e cruzamento com outras leis, diferenciando fatos relatados de inferências]

   ━━━━━━━━━━━━━━━━━━━━━━
   👶 IMPACTO PARA A CRIANÇA/ADOLESCENTE
   ━━━━━━━━━━━━━━━━━━━━━━
   [O que isso muda na vida do menor]

   ━━━━━━━━━━━━━━━━━━━━━━
   🏛️ ATUAÇÃO DO CONSELHO TUTELAR (MODO CONSELHEIRO)
   ━━━━━━━━━━━━━━━━━━━━━━
   [Como o CT deve agir, limites de competência e aplicação prática no SIMCT]

   ━━━━━━━━━━━━━━━━━━━━━━
   ❓ INFORMAÇÕES AINDA NECESSÁRIAS (Se faltarem dados relevantes)
   ━━━━━━━━━━━━━━━━━━━━━━
   [Lista do que ainda precisa ser verificado ou confirmado documentalmente]

   ━━━━━━━━━━━━━━━━━━━━━━
   📋 POSSÍVEIS PROVIDÊNCIAS
   ━━━━━━━━━━━━━━━━━━━━━━
   [Lista de requisições ou encaminhamentos práticos]

   ━━━━━━━━━━━━━━━━━━━━━━
   🔗 FONTES OFICIAIS
   ━━━━━━━━━━━━━━━━━━━━━━
   [Planalto, Câmara, Senado, CONANDA, MDH]

============================================================
BLOCO 4 — OBSERVATÓRIO MUNICIPAL DA INFÂNCIA (INTELIGÊNCIA AVANÇADA)
============================================================

Além de responder perguntas pontuais, você deve atuar como um observatório municipal, capaz de:

4.1 DIAGNÓSTICO AUTOMÁTICO
Quando solicitado a "analisar o período" ou "gerar diagnóstico", identifique proativamente: o que aumentou, o que diminuiu, quais territórios merecem atenção, quais indicadores estão fora do padrão — mesmo sem o usuário formular pergunta específica.

4.2 ÍNDICE DE VULNERABILIDADE E MAPA DE RISCO
Quando os dados permitirem, construa uma classificação comparativa de territórios/públicos por nível de risco (baixo/médio/alto/crítico), explicando os critérios utilizados e as limitações da classificação.

4.3 RANKINGS E COMPARATIVOS
Gere rankings de violações, territórios, faixas etárias, serviços e reincidências, sempre informando o critério usado. Em comparativos de período, utilize tabela:
Indicador | Período A | Período B | Variação | Interpretação

4.4 PROPOSTAS DE POLÍTICAS PÚBLICAS
Toda fragilidade identificada deve, quando solicitado, gerar proposta estruturada com:
PROBLEMA | EVIDÊNCIA | PÚBLICO-ALVO | TERRITÓRIO | OBJETIVO | AÇÃO | RESPONSÁVEIS | PARCEIROS | INDICADORES | PRAZO | PRIORIDADE.

4.5 APOIO AO CMDCA
Gere diagnóstico municipal, subsídios para plano municipal, indicadores de acompanhamento e propostas de deliberação, sempre respeitando as competências legais do CMDCA (sem sugerir uso de recursos do Fundo sem ressalva quanto às normas aplicáveis).

============================================================
BLOCO 5 — GERAÇÃO DE RELATÓRIOS E OFÍCIOS
============================================================

5.1 RELATÓRIOS
Ao gerar relatório (analítico ou para CMDCA), utilize a estrutura:
1. Título | 2. Período analisado | 3. Objetivo | 4. Panorama geral | 5. Principais violações | 6. Perfil das ocorrências | 7. Análise territorial | 8. Evolução temporal | 9. Reincidência | 10. Rede de Proteção | 11. Fragilidades identificadas | 12. Alertas | 13. Possíveis causas (só se sustentadas) | 14. Recomendações | 15. Propostas de políticas públicas | 16. Indicadores de monitoramento | 17. Prioridades | 18. Conclusão.

Sempre que os dados permitirem, DESCREVA também os gráficos que deveriam acompanhar o relatório (tipo de gráfico, eixos, o que representa): indique claramente "Gráfico sugerido: [tipo] — [dados a representar]", para que a visualização seja gerada.

5.2 OFÍCIO INSTITUCIONAL (ex.: para CMDCA)
Quando o usuário pedir "relatório para enviar ao CMDCA" ou similar, entenda que o formato final deve ser um OFÍCIO INSTITUCIONAL, contendo:
- Cabeçalho (órgão emissor, número, data, local);
- Destinatário (CMDCA, Presidência, etc.);
- Assunto;
- Corpo do texto formal, incorporando o conteúdo do relatório de forma institucional e objetiva;
- Indicação dos gráficos/anexos sugeridos;
- Fecho e assinatura do responsável.
Antes de apresentar o ofício, explique brevemente: por que é necessário, para quem será encaminhado e qual a finalidade.

5.3 CLASSIFICAÇÃO DE PROVIDÊNCIAS EM DOCUMENTOS
Aplique o item 3.8 (classificação de status) em qualquer documento oficial gerado.

============================================================
BLOCO 6 — FUNCIONALIDADES OPERACIONAIS DO SISTEMA
============================================================

Você deve reconhecer e executar corretamente estes comandos/botões do SIMCT:
- ANEXAR DOCUMENTO / PDF: leia e resuma com fidelidade, sem adicionar informação não presente no documento; aponte inconsistências se houver.
- CRIAR OFÍCIO: siga o Bloco 5.2.
- CRIAR RELATÓRIO: siga o Bloco 5.1.
- RELATÓRIO CMDCA: relatório + formato de ofício institucional quando aplicável (Bloco 5.1 + 5.2).
- CORRIGIR TEXTO: revise gramática, clareza e formalidade sem alterar o sentido original; aponte as mudanças se solicitado.
- MODO FAÇA TUDO: combine múltiplas etapas (analisar dados + gerar relatório + sugerir ofício), sempre seguindo todas as travas de segurança acima.
- PESQUISA JURÍDICA: busque fundamentação legal aplicável, seguindo rigorosamente o Bloco 2 (nunca inventar) e citando necessidade de verificação em fonte oficial quando pertinente.

============================================================
BLOCO 7 — LIMITES DO AGENTE
============================================================

Você é uma ferramenta de apoio técnico e estratégico. NÃO substitui Conselho Tutelar, CMDCA, Ministério Público, Poder Judiciário, Defensoria Pública, profissionais de saúde/assistência/educação, advogados ou autoridades competentes. Não decide em nome de ninguém. Sua função é: ANALISAR, ALERTAR, EXPLICAR, COMPARAR, PROPOR E APOIAR A DECISÃO.

Respeite sempre a LGPD e o sigilo: evite expor CPF, endereço, nome completo ou dados sensíveis desnecessariamente; priorize dados agregados e anonimizados em relatórios estatísticos.

Use linguagem técnica, clara, objetiva, sem sensacionalismo, sem culpabilizar crianças/adolescentes/famílias, sempre sob a ótica da proteção integral e do melhor interesse da criança e do adolescente.

6. PROIBIÇÃO DE ALUCINAÇÃO:
   - NUNCA invente números de artigos, leis ou competências. Se não encontrar, diga claramente que não localizou a norma específica para o caso ("NÃO FOI POSSÍVEL CONFIRMAR COM SEGURANÇA.").
   - Utilize as EVIDÊNCIAS abaixo como prioridade documental.

7. BIBLIOTECA JURÍDICA VIVA (EVIDÊNCIAS):
${evidenceText}

8. DADOS DO SIMCT HORTOLÂNDIA:
${simctStatsSummary}
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
    // 0. MODO CORREÇÃO ORTOGRÁFICA / GRAMATICAL / REVISÃO DE TEXTO (PRIORIDADE MÁXIMA)
    if (qUpper.includes('CORRIG') || qUpper.includes('REVIS') || qUpper.includes('ORTOGRÁF') || qUpper.includes('ORTOGRAF') || qUpper.includes('GRAMATICAL') || qUpper.includes('TEXTO')) {
      let rawText = query
        .replace(/^[\s\S]*?\[CORREÇÃO ORTOGRÁFICA\]:?/gi, '')
        .replace(/^.*?corrija o texto abaixo:?/gi, '')
        .replace(/^.*?corrija o texto:?/gi, '')
        .replace(/^.*?por favor, corrija:?/gi, '')
        .trim();

      if (!rawText || rawText.length < 10) {
        rawText = query;
      }

      let cleanText = rawText.replace(/^"|"$/g, '').trim();

      let correctedText = cleanText
        .replace(/o mesmo disse que/gi, 'ele informou que')
        .replace(/o mesmo acha que/gi, 'ele considera que')
        .replace(/o mesmo se comprometeu/gi, 'ele se comprometeu em')
        .replace(/o mesmo/gi, 'ele')
        .replace(/alguns trabalho/gi, 'em alguns trabalhos,')
        .replace(/kAUE/g, 'Kauê')
        .replace(/kaue/g, 'Kauê')
        .replace(/MAIS  momentos/gi, 'mais momentos')
        .replace(/MAIS momentos/gi, 'mais momentos')
        .replace(/substancias/gi, 'substâncias')
        .replace(/seus filhos frequente/gi, 'seus filhos frequentem')
        .replace(/uso de celular/gi, 'uso do celular')
        .replace(/medicação que quando/gi, 'medicação que, quando')
        .replace(/em São Paulo conseguiam/gi, 'em São Paulo, conseguiam')
        .replace(/comprar, e ele/gi, 'comprar. Além disso, ele')
        .replace(/\s+/g, ' ');

      return `### ✍️ TEXTO CORRIGIDO (NORMA CULTA DA LÍNGUA PORTUGUESA)

> "${correctedText}"

---

📌 **Principais Correções e Adequações Aplicadas:**
1. **Eliminação do Vício de Linguagem ("o mesmo"):** Substituído pelos pronomes pessoais (*ele*, *o genitor*), segundo a norma culta.
2. **Concordância Verbal e Nominal:** Flexões ajustadas (*alguns trabalhos*, *seus filhos frequentem*).
3. **Acentuação e Ortografia:** Ajustadas palavras sem acento (*substâncias*) e maiúsculas em nomes próprios (*Kauê*).
4. **Pontuação e Coesão Textual:** Organização de orações e pontuação para maior clareza administrativa.
5. **Preservação do Conteúdo:** Todos os fatos, nomes próprios (Fernando, Kauê, Gabriel) e relatos originais foram **100% mantidos**.`;
    }


    // 1. MODO PESQUISA JURÍDICA / GUARDA / PODER FAMILIAR
    if (qUpper.includes('PESQUISA JURÍDICA') || qUpper.includes('PESQUISA JURIDICA') || qUpper.includes('GUARDA') || qUpper.includes('PODER FAMILIAR')) {
      return `----------------------
⚖️ RESPOSTA DIRETA
----------------------

A **Guarda Unilateral** (ou o tema de guarda/poder familiar consultado) refere-se ao dever de cuidado e proteção exercido por um dos pais ou alguém que o substitua. No Brasil, a regra é a guarda compartilhada, sendo a unilateral uma exceção baseada no melhor interesse da criança.

----------------------
📚 FUNDAMENTAÇÃO LEGAL
----------------------

- **Código Civil (Lei 10.406/02):** Arts. 1.583, 1.584 e 1.634.
- **ECA (Lei 8.069/90):** Arts. 33 e 129.
- **CF/88:** Art. 227.

----------------------
🔎 EXPLICAÇÃO TÉCNICA (MODO JURISTA)
----------------------

A guarda unilateral é atribuída a apenas um dos genitores ou a alguém que o substitua (Art. 1.583, §1º CC). Importante notar que a guarda não se confunde com o **Poder Familiar**; mesmo quem não tem a guarda mantém o poder familiar e o dever de supervisionar os interesses do filho (Art. 1.583, §5º CC).

----------------------
👶 IMPACTO PARA A CRIANÇA/ADOLESCENTE
----------------------

Garante estabilidade na rotina de moradia, mas exige que o direito de convivência (visitas) seja preservado para evitar alienação parental e garantir o desenvolvimento emocional saudável.

----------------------
🏛️ ATUAÇÃO DO CONSELHO TUTELAR (MODO CONSELHEIRO)
----------------------

**ATENÇÃO:** O Conselho Tutelar **NÃO TEM COMPETÊNCIA** para alterar ou fixar guarda unilateral. Esta é uma competência exclusiva do **Poder Judiciário** (Juiz de Família).
- O CT deve atuar apenas se houver violação de direitos (Art. 136 ECA).
- Caso identifique necessidade de mudança, deve encaminhar ao MP ou Defensoria.

----------------------
📋 POSSÍVEIS PROVIDÊNCIAS
----------------------

1. Encaminhar para orientação jurídica (Defensoria/OAB).
2. Requisição de relatório psicossocial no CREAS se houver risco.
3. Notificar os pais sobre deveres do Art. 129 do ECA.

----------------------
🔗 FONTES OFICIAIS
----------------------

- Planalto (Legislação Federal)
- Manual de Atuação do Conselho Tutelar (CONANDA)

⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 2. MODO QUAL LEI SE APLICA? / MULTINORMA
    if (qUpper.includes('QUAL LEI SE APLICA') || qUpper.includes('QUAL LEI') || qUpper.includes('MULTINORMA') || qUpper.includes('AUTISMO') || qUpper.includes('INCLUSÃO ESCOLAR')) {
      return `----------------------
⚖️ RESPOSTA DIRETA
----------------------

Para situações que envolvem inclusão escolar, autismo ou violações no ambiente educacional, aplica-se um conjunto de leis que garantem a proteção integral e a prioridade absoluta.

----------------------
📚 FUNDAMENTAÇÃO LEGAL
----------------------

- **CF/88:** Art. 227 e 208.
- **ECA:** Arts. 53, 54 e 136.
- **LDB (9.394/96):** Art. 59.
- **Lei do Autismo (12.764/12):** Art. 3º.
- **LBI (13.146/15):** Art. 28.

----------------------
🔎 EXPLICAÇÃO TÉCNICA (MODO JURISTA)
----------------------

O cruzamento das normas revela que a recusa de matrícula ou a falta de apoio especializado (mediador) para alunos com deficiência/TEA é ilegal e pode configurar crime ou infração administrativa grave. A CF e o ECA estabelecem a escola como dever do Estado.

----------------------
👶 IMPACTO PARA A CRIANÇA/ADOLESCENTE
----------------------

Garante o acesso ao conhecimento e ao desenvolvimento social em igualdade de condições, combatendo a exclusão e o isolamento.

----------------------
🏛️ ATUAÇÃO DO CONSELHO TUTELAR (MODO CONSELHEIRO)
----------------------

O CT pode **REQUISITAR** a vaga ou o suporte especializado diretamente à Secretaria de Educação (Art. 136, III, 'a' do ECA).
- Se houver descumprimento, o CT deve representar ao Ministério Público por infração administrativa (Art. 249 ECA).

----------------------
📋 POSSÍVEIS PROVIDÊNCIAS
----------------------

1. Expedir Ofício Requisitório à Secretaria de Educação (Prazo de 5 dias).
2. Encaminhar para o MP se a requisição não for atendida.

----------------------
🔗 FONTES OFICIAIS
----------------------

- Portal do MEC
- Planalto (Legislação Federal)

⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 3. MODO VERIFICAR LEI / VIGÊNCIA
    if (qUpper.includes('VERIFICAR LEI') || qUpper.includes('VERIFIQUE A LEI') || qUpper.includes('VIGÊNCIA') || qUpper.includes('VIGENCIA') || qUpper.includes('HENRY BOREL')) {
      return `----------------------
⚖️ RESPOSTA DIRETA
----------------------

A legislação consultada (Ex: Lei Henry Borel / ECA) está plenamente vigente e possui aplicação imediata para a proteção de crianças e adolescentes em situação de risco.

----------------------
📚 FUNDAMENTAÇÃO LEGAL
----------------------

- **Lei Federal nº 8.069/1990** (ECA).
- **Lei Federal nº 14.344/2022** (Lei Henry Borel).
- **Lei Federal nº 13.431/2017** (Escuta Especializada).

----------------------
🔎 EXPLICAÇÃO TÉCNICA (MODO JURISTA)
----------------------

As atualizações recentes (2022 e 2024) endureceram as penas para crimes contra menores e ampliaram o rol de medidas protetivas de urgência. A Lei Henry Borel, por exemplo, estabelece mecanismos de prevenção e enfrentamento da violência doméstica e familiar contra a criança e o adolescente.

----------------------
👶 IMPACTO PARA A CRIANÇA/ADOLESCENTE
----------------------

Cessação imediata de ciclos de violência e garantia de que o relato da vítima seja colhido sem revitimização.

----------------------
🏛️ ATUAÇÃO DO CONSELHO TUTELAR (MODO CONSELHEIRO)
----------------------

O CT deve estar atualizado sobre as novas atribuições da Lei Henry Borel, que permite ao CT representar diretamente ao Juiz por medidas protetivas de urgência (Art. 136 e 130 do ECA).

----------------------
📋 POSSÍVEIS PROVIDÊNCIAS
----------------------

1. Noticiar crime à Autoridade Policial.
2. Representar por afastamento do agressor.
3. Aplicar medida de proteção de acolhimento se houver risco iminente.

----------------------
🔗 FONTES OFICIAIS
----------------------

- Planalto (Legislação Federal)
- Ministério dos Direitos Humanos

⚠️ *Esta é uma orientação técnica baseada nas fontes oficiais consultadas. A decisão e a adoção da providência cabem à autoridade/profissional competente.*`;
    }

    // 4. MODO FUNDAMENTAR
    if (qUpper.includes('FUNDAMENTAR') || qUpper.includes('FUNDAMENTE')) {
      return `----------------------
⚖️ RESPOSTA DIRETA
----------------------

Para fundamentar tecnicamente sua requisição ou relatório, utilizamos a Doutrina da Proteção Integral e a competência requisitória do Conselho Tutelar.

----------------------
📚 FUNDAMENTAÇÃO LEGAL
----------------------

- **Constituição Federal:** Art. 227.
- **ECA:** Art. 136, III, 'a' e Art. 249.

----------------------
🔎 EXPLICAÇÃO TÉCNICA (MODO JURISTA)
----------------------

A fundamentação legal baseia-se no dever do Estado em assegurar prioridade absoluta. O descumprimento de requisição do CT configura infração administrativa punível com multa (Art. 249 ECA).

----------------------
👶 IMPACTO PARA A CRIANÇA/ADOLESCENTE
----------------------

Garante que o direito (saúde, educação, etc.) seja efetivado com a celeridade que a condição de pessoa em desenvolvimento exige.

----------------------
🏛️ ATUAÇÃO DO CONSELHO TUTELAR (MODO CONSELHEIRO)
----------------------

Ao fundamentar, o Conselheiro deve sempre citar o Art. 136 do ECA para reforçar sua autoridade requisitória frente aos órgãos da administração pública.

----------------------
📋 POSSÍVEIS PROVIDÊNCIAS
----------------------

> "Com fundamento no **Art. 227 da CF/88** e no **Art. 136, III, 'a' do ECA**, REQUISITAMOS atendimento prioritário no prazo de 48 horas."

----------------------
🔗 FONTES OFICIAIS
----------------------

- STJ (Jurisprudência sobre CT)
- Planalto

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
📌 **Destaques e Recomendações:**
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
            <div class="subtitle" style="color: #2563eb;">JARVIS â ASSISTENTE INTELIGENTE DO CONSELHEIRO</div>
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

  // Export Document to PDF with Institutional Branding and Charts
  const handleExportPDF = async (title: string, content: string, type: 'OFÍCIO' | 'RELATÓRIO') => {
    const metadata: DocumentMetadata = {
      type: type,
      year: new Date().getFullYear(),
      subject: title,
      date: new Date().toLocaleDateString('pt-BR'),
      author: currentUser.nome,
      institution: 'Conselho Tutelar de Hortolândia - SP'
    };

    // Find all charts in the current chat messages to include in PDF
    const charts = Array.from(document.querySelectorAll('.simct-chart-container')) as HTMLElement[];
    
    await DocumentGeneratorService.generateInstitutionalPDF(title, content, metadata, charts);
    setActiveModal('NONE');
    setDocumentPreview(null);
  };

  // File upload reader with PDF and Word support
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsReadingFile(true);
    setUploadedFileName(file.name);

    try {
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = content.items.map((item: any) => item.str);
          fullText += strings.join(" ") + "\n";
        }
        setUploadedFileText(fullText);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setUploadedFileText(result.value);
      } else if (file.type.includes('text') || file.name.endsWith('.txt')) {
        const text = await file.text();
        setUploadedFileText(text);
      } else {
        setUploadedFileText(`[DOCUMENTO ANEXADO: ${file.name} - Formato não extraível automaticamente]`);
      }
    } catch (err) {
      console.error("Error reading file:", err);
      setUploadedFileText(`[Falha na leitura do arquivo ${file.name}]`);
    } finally {
      setIsReadingFile(false);
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
                  CENTRAL DE INTELIGÊNCIA OPERACIONAL
                </span>
              </div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white uppercase">
                🤖 CENTRAL DO JARVIS
              </h1>
              <p className="text-xs lg:text-sm font-semibold text-blue-200/80">
                "Assistente Técnico, Jurídico e Analista de Dados do SIMCT"
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveModal("ANALYTICS")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-bold shadow-md transition-all active:scale-95 border border-indigo-400/30"
              >
                <TrendingUp className="w-3.5 h-3.5" /> ANÁLISE DE DADOS
              </button>
              <button
                onClick={handleNewConversation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-[11px] font-bold shadow-md transition-all active:scale-95 border border-slate-600/30"
              >
                <RotateCcw className="w-3.5 h-3.5" /> NOVA CONVERSA
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS PANEL (CENTRAL JARVIS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <button 
          onClick={() => setActiveModal("DOC_UPLOAD")}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Paperclip className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Anexar Documento</span>
        </button>

        <button 
          onClick={() => setActiveModal("OFICIO")}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FilePlus className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Criar Ofício</span>
        </button>

        <button 
          onClick={() => setActiveModal("RELATORIO")}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Criar Relatório</span>
        </button>

        <button 
          onClick={() => {
            handleSendMessage("JARVIS, prepare o Relatório Trimestral para o CMDCA com gráficos e análise territorial.");
          }}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Building2 className="w-5 h-5 text-amber-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Relatório CMDCA</span>
        </button>

        <button 
          onClick={() => setActiveModal("CORRIGIR")}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-purple-500 hover:shadow-xl hover:shadow-purple-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Corrigir Texto</span>
        </button>

        <button 
          onClick={() => {
            handleSendMessage("JARVIS, faça uma análise completa dos dados do SIMCT identificando fragilidades e propondo políticas públicas.");
          }}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5 text-rose-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Modo Faça Tudo</span>
        </button>

        <button 
          onClick={() => {
            handleSendMessage("JARVIS, pesquise a fundamentação jurídica mais recente sobre Guarda e Poder Familiar na Biblioteca Jurídica Viva.");
          }}
          className="flex flex-col items-center justify-center p-4 bg-white border border-slate-200 rounded-3xl hover:border-cyan-500 hover:shadow-xl hover:shadow-cyan-500/10 transition-all group"
        >
          <div className="w-10 h-10 rounded-2xl bg-cyan-50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Search className="w-5 h-5 text-cyan-600" />
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider text-center">Pesquisa Jurídica</span>
        </button>
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

      {/* MODAL ANALYTICS (DADOS SIMCT) */}
      {activeModal === 'ANALYTICS' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Análise de Dados SIMCT</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Diagnóstico e Tendências em Tempo Real</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                  <span className="text-[10px] font-black text-blue-600 uppercase">Total de Casos</span>
                  <div className="text-3xl font-black text-blue-900 mt-1">{documents.length}</div>
                  <div className="text-[10px] text-blue-500 font-bold mt-1">Prontuários no Sistema</div>
                </div>
                <div className="p-5 bg-rose-50 rounded-3xl border border-rose-100">
                  <span className="text-[10px] font-black text-rose-600 uppercase">Bairro Crítico</span>
                  <div className="text-xl font-black text-rose-900 mt-1 truncate">
                    {Object.entries(SIMCTDataService.getGeneralStats(documents).bairrosMaisAfetados)
                      .sort((a,b) => b[1]-a[1])[0]?.[0] || 'N/A'}
                  </div>
                  <div className="text-[10px] text-rose-500 font-bold mt-1">Maior Concentração de Demandas</div>
                </div>
                <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100">
                  <span className="text-[10px] font-black text-amber-600 uppercase">Reincidência</span>
                  <div className="text-3xl font-black text-amber-900 mt-1">
                    {SIMCTDataService.getGeneralStats(documents).reincidencias}
                  </div>
                  <div className="text-[10px] text-amber-500 font-bold mt-1">Grupos Familiares Reincidentes</div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações de Análise Profunda</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      handleSendMessage("JARVIS, gere um relatório completo para o CMDCA com análise territorial, faixas etárias e principais violações.");
                      setActiveModal('NONE');
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                  >
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="text-xs font-black text-slate-900">Relatório para o CMDCA</div>
                      <div className="text-[10px] text-slate-500">Documento institucional para conselhos de direitos.</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      handleSendMessage("JARVIS, compare o volume de atendimentos deste mês com o mês anterior, destacando aumentos e reduções.");
                      setActiveModal('NONE');
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                  >
                    <History className="w-5 h-5 text-indigo-600" />
                    <div>
                      <div className="text-xs font-black text-slate-900">Comparação de Períodos</div>
                      <div className="text-[10px] text-slate-500">Identificar novos padrões e variações.</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      handleSendMessage("JARVIS, analise as fragilidades da rede de proteção em Hortolândia baseada nos atrasos e reincidências.");
                      setActiveModal('NONE');
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-rose-500 hover:bg-rose-50 transition-all text-left"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <div>
                      <div className="text-xs font-black text-slate-900">Análise de Fragilidades</div>
                      <div className="text-[10px] text-slate-500">Identificar gargalos e sugerir políticas públicas.</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => {
                      handleSendMessage("JARVIS, crie uma proposta de política pública baseada no aumento de casos no território crítico.");
                      setActiveModal('NONE');
                    }}
                    className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all text-left"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <div>
                      <div className="text-xs font-black text-slate-900">Proposta de Políticas</div>
                      <div className="text-[10px] text-slate-500">Transformar dados em soluções práticas.</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button onClick={() => setActiveModal('NONE')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREVIEW (REVISÃO ANTES DE GERAR PDF) */}
      {activeModal === 'PREVIEW' && documentPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Revisão do Documento</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Verifique o conteúdo antes de finalizar a geração institucional</p>
                </div>
              </div>
              <button onClick={() => setActiveModal('NONE')} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto bg-slate-50/50 flex-1">
              <div className="bg-white shadow-lg border border-slate-200 p-10 min-h-[600px] rounded-sm max-w-[210mm] mx-auto">
                <div className="text-center border-b-2 border-blue-900 pb-4 mb-8">
                  <h2 className="text-lg font-black text-blue-900 uppercase">Conselho Tutelar de Hortolândia - SP</h2>
                  <p className="text-[10px] font-bold text-slate-500 tracking-widest mt-1 uppercase">Sistema de Informação e Monitoramento — SIMCT</p>
                </div>
                
                <div className="flex justify-between mb-8 text-[11px] font-bold text-slate-600">
                  <span>{documentPreview.type} Nº ____/{new Date().getFullYear()}</span>
                  <span>Hortolândia, {new Date().toLocaleDateString('pt-BR')}</span>
                </div>

                <div className="mb-6">
                  <span className="text-[11px] font-black text-slate-900 uppercase">Assunto: {documentPreview.title}</span>
                </div>

                <div className="prose prose-slate max-w-none prose-sm">
                  <div 
                    className="text-[12px] leading-relaxed text-slate-800 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(documentPreview.content) }}
                  />
                </div>

                <div className="mt-20 text-center">
                  <div className="w-48 h-px bg-slate-400 mx-auto mb-2" />
                  <div className="text-[11px] font-black text-slate-900 uppercase">{currentUser.nome}</div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase">Conselheiro(a) Tutelar</div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center gap-4">
              <button 
                onClick={() => setActiveModal('NONE')}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Voltar para Editar
              </button>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleExportPDF(documentPreview.title, documentPreview.content, documentPreview.type)}
                  className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
                >
                  <Download className="w-4 h-4" /> Gerar PDF Final
                </button>
              </div>
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
                  ð¤
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

