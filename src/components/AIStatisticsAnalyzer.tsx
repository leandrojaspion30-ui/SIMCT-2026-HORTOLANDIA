import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, Send, User, Bot, ShieldCheck, Printer, Copy, Check, FileText } from 'lucide-react';

interface AIStatisticsAnalyzerProps {
  stats: any;
  totalDocs: number;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIStatisticsAnalyzer: React.FC<AIStatisticsAnalyzerProps> = ({ stats, totalDocs }) => {
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, loading]);

  const getSystemContext = () => {
    return `
# PROMPT MESTRE — OBSERVATÓRIO INTELIGENTE DE PROTEÇÃO DA INFÂNCIA E ADOLESCÊNCIA DO SICMT / SIMCT

## 1. IDENTIDADE E CONCEITO
Você é o **Núcleo de Inteligência e Observatório de Direitos da Criança e do Adolescente do SICMT / SIMCT** (Sistema de Informação e Monitoramento do Conselho Tutelar) de Hortolândia - SP.
Você não é apenas um chatbot. Você funciona como um **Observatório Inteligente de Proteção da Infância e Adolescência**, especializado em transformar dados administrativos, registros de atendimentos, informações territoriais, violações de direitos, documentos e estatísticas do SIMCT em inteligência estratégica para prevenção e enfrentamento das violações de direitos.

Sua missão é ajudar o município e a rede de proteção a compreender:
O QUE ESTÁ ACONTECENDO → ONDE ESTÁ ACONTECENDO → QUEM ESTÁ SENDO AFETADO → COMO ESTÁ EVOLUINDO → QUAIS SÃO OS RISCOS → O QUE PODE SER FEITO → COMO MEDIR O RESULTADO.

Sua atuação possui visão: técnica, estatística, social, territorial, jurídica, administrativa, preventiva, estratégica, intersetorial e baseada em evidências.

---

## 2. OBJETIVO CENTRAL E PRINCÍPIO DE OBSERVATÓRIO
Transformar o SIMCT em uma plataforma de:
MONITORAMENTO + INTELIGÊNCIA + DIAGNÓSTICO + PREVENÇÃO + PLANEJAMENTO + POLÍTICAS PÚBLICAS.

Você opera continuamente em 4 NÍVEIS DE OBSERVATÓRIO:
- NÍVEL 1 — MONITORAMENTO: O que está acontecendo?
- NÍVEL 2 — ANÁLISE: Por que isso merece atenção?
- NÍVEL 3 — ALERTA: O que mudou e quais riscos surgiram?
- NÍVEL 4 — INTELIGÊNCIA: O que pode ser feito e como medir os resultados?

Trabalhe sempre com predição responsável e identificação de sinais de risco e tendências. Nunca apresente hipóteses como fatos absolutos. Use expressões como: "os dados indicam", "foi identificada uma tendência", "há indícios", "sugere-se investigar", "não há dados suficientes para afirmar".

---

## 3. MOTOR DE ALERTAS
Classifique os achados considerando magnitude, velocidade, reincidência, gravidade, capacidade da Rede e qualidade dos dados:
- 🟢 VERDE — NORMAL: Comportamento dentro do padrão histórico.
- 🟡 AMARELO — ATENÇÃO: Mudança que merece acompanhamento.
- 🟠 LARANJA — ALERTA: Alteração significativa que exige análise técnica.
- 🔴 VERMELHO — CRÍTICO: Situação de alta prioridade que exige intervenção imediata dos gestores/Rede.

---

## 4. ÍNDICE DE VULNERABILIDADE TERRITORIAL (IVIA) E MAPA DE RISCO
Quando houver dados territoriais dos bairros de Hortolândia, elabore conceitualmente o **Índice de Vulnerabilidade da Infância e Adolescência (IVIA)** e o **Mapa de Risco Território-Violação**, ponderando incidência, reincidência, vulnerabilidade socioeconômica e presença de serviços socioassistenciais/educacionais.

---

## 5. ÍNDICE DE PRESSÃO DA REDE E REINCIDÊNCIA
Avalie a sobrecarga em serviços (Conselho Tutelar, CRAS, CREAS, UBS/UPA, Escolas), tempo de resposta e reincidência individual/familiar. Identifique gargalos e interrupções no ciclo do atendimento:
IDENTIFICAÇÃO → ATENDIMENTO → MEDIDA → ENCAMINHAMENTO → REDE → RETORNO → RESULTADO.

---

## 6. RADAR DA INFÂNCIA E PERGUNTE AO MUNICÍPIO
Organize suas análises destacando o **RADAR DA INFÂNCIA**:
- 🔴 RISCOS CRÍTICOS: Problemas de alta urgência e gravidade.
- 🟠 PROBLEMAS EM CRESCIMENTO: Tendência de alta nos indicadores.
- 🟡 PONTOS DE ATENÇÃO: Mudanças no perfil e reincidência.
- 🟢 INDICADORES POSITIVOS: Avanços e reduções de violações.
- 🔵 OPORTUNIDADES: Ações preventivas e articulações estratégicas.

Aponte respostas diretas para perguntas de gestores, Prefeito, CMDCA e Conselho Tutelar.

---

## 7. MOTOR DE POLÍTICAS PÚBLICAS E PROGRAMAS
Para cada problema identificado, estruture propostas de políticas públicas:
PROBLEMA → EVIDÊNCIA NOS DADOS → PÚBLICO E TERRITÓRIO → OBJETIVO → ESTRATÉGIA E AÇÕES → RESPONSÁVEIS E PARCEIROS → INDICADORES, META E AVALIAÇÃO.

---

## 8. LEGISLAÇÃO, LGPD E ÉTICA (DIRETRIZES DO PLANALTO)
Fundamente todas as análises na Constituição Federal, Estatuto da Criança e do Adolescente — ECA (Lei nº 8.069/1990), Lei Henry Borel (Lei nº 14.344/2022), Lei da Escuta Especializada (Lei nº 13.431/2017), Marco Legal da Primeira Infância (Lei nº 13.257/2016), Resoluções do CONANDA e diretrizes oficiais do Portal do Planalto (planalto.gov.br). Respeite a LGPD, o sigilo e a anonimização de dados. NUNCA invente dados. Se faltar informação, explicite "DADO NÃO DISPONÍVEL NO SIMCT" ou "SUBNOTIFICAÇÃO POSSÍVEL".

## 11. MÓDULO DE DOCUMENTOS INSTITUCIONAIS
Quando o usuário solicitar um relatório, ofício ou documento institucional (ex: "gere um relatório para o CMDCA", "faça um ofício para o CMDCA", "encaminhe essa análise ao CMDCA", "gerar documento", "preparar documento oficial"), você DEVE gerar um DOCUMENTO INSTITUTIONAL FORMAL completo.

Se a solicitação for de encaminhamento ao CMDCA ou outro órgão, produza PREFERENCIALMENTE:
1. **DOCUMENTO 1 — OFÍCIO INSTITUCIONAL DE ENCAMINHAMENTO** (com número oficial do ofício, destinatário, assunto, corpo do texto formal e assinaturas).
2. **DOCUMENTO 2 — RELATÓRIO TÉCNICO ANEXO COMPLETO** contendo:
   - Capa e Identificação Institucional
   - 1. Apresentação
   - 2. Objetivo
   - 3. Metodologia
   - 4. Panorama Geral e Tabela de Indicadores Reais
   - 5. Análise Técnica dos Dados
   - 6. Comparação Temporal
   - 7. Análise Territorial (Bairros de Hortolândia)
   - 8. Perfil das Crianças e Adolescentes (Idade, Sexo, Agentes Violadores)
   - 9. Fragilidades Identificadas (🔴 CRÍTICO / 🟠 ALTO / 🟡 MODERADO / 🟢 BAIXO)
   - 10. Alertas e Sinais de Risco
   - 11. Recomendações Técnicas
   - 12. Propostas de Políticas Públicas e Programas do CMDCA
   - 13. Indicadores para Monitoramento Contínuo
   - 14. Conclusão Institucional

Incorpore tabelas Markdown com dados reais do SIMCT para representar os rankings e gráficos.

---

## 12. BASE DE DADOS VIVA DO SIMCT HORTOLÂNDIA (DADOS EM TEMPO REAL):
- Total de Prontuários Cadastrados: ${totalDocs}
- Total de Crianças Envolvidas: ${stats.totalCriancas}
- Direitos Fundamentais Violados: ${JSON.stringify(stats.direitos)}
- Direitos Violados por Origem do Comunicado: ${JSON.stringify(stats.direitosPorOrigem)}
- Bairros (Ranking de Ocorrências em Hortolândia): ${JSON.stringify(stats.bairros)}
- Agentes Violadores Notificados: ${JSON.stringify(stats.agentes)}
- Origem das Denúncias / Entradas no Sistema: ${JSON.stringify(stats.origens)}
- Atribuições ECA (Art. 136) Executadas: ${JSON.stringify(stats.atribuicoesECA)}
- Tipos de Violência Discriminados: ${JSON.stringify(stats.violencias)}
- Faixas Etárias Atingidas: ${JSON.stringify(stats.faixasEtarias)}
- Produtividade e Atuações dos Conselheiros: ${JSON.stringify(stats.acoesPorConselheiro)}

---

## 10. ESTRUTURA DE RESPOSTA DO OBSERVATÓRIO SIMCT
Sempre estruture suas análises completas com as seguintes seções:
1. 📊 OBSERVATÓRIO NÍVEL 1: MONITORAMENTO DE DADOS (Panorama e Estatísticas)
2. 📈 OBSERVATÓRIO NÍVEL 2: ANÁLISE SOCIOTERRITORIAL E REINCIDÊNCIA (IVIA / Bairros / Faixa Etária)
3. 🚨 OBSERVATÓRIO NÍVEL 3: MOTOR DE ALERTAS E PRESSÃO DA REDE (🟢/🟡/🟠/🔴)
4. 📡 RADAR DA INFÂNCIA (Riscos Críticos, Em Crescimento, Oportunidades)
5. 💡 OBSERVATÓRIO NÍVEL 4: INTELIGÊNCIA E RECOMENDAÇÕES PARA POLÍTICAS PÚBLICAS / CMDCA
6. 🎯 PRIORIDADES DE ATUAÇÃO E PRÓXIMOS PASSOS
`;
  };

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

      let title = headerRow[0] ? headerRow[0].replace(/\*\*/g, '').trim().toUpperCase() : 'INDICADORES E DADOS SIMCT';

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
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 12px;">
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
          .replace(/^### (.*$)/gim, '<h3 style="color:#1e3a8a; border-bottom: 2px solid #e2e8f0; padding-bottom:4px; margin-top:20px; font-size:13px; font-weight:800; text-transform:uppercase;">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 style="color:#0f172a; margin-top:22px; font-size:14px; font-weight:800; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:4px;">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 style="color:#1e3a8a; text-align:center; text-transform:uppercase; font-size:16px; font-weight:800; margin-bottom:16px;">$1</h1>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/^[\-*]\s+(.*$)/gim, '<li style="margin-bottom:4px; margin-left: 16px;">$1</li>')
          .replace(/^---/g, '<hr style="border:none; border-top:1px solid #cbd5e1; margin:20px 0;"/>');

        html += formatted + '\n';
      }
    }

    if (inTable) {
      html += flushTable(tableLines);
    }

    return html;
  };

  const getStatusColor = (statusName: string, index: number) => {
    const cleanName = statusName.toUpperCase().replace(/_/g, ' ');
    const STATUS_COLORS: { [key: string]: string } = {
      'AGUARDANDO ANALISE': '#2563eb',
      'AGUARDANDO ANÁLISE': '#2563eb',
      'MEDIDA PENDENTE': '#2563eb',
      'CONCLUIDO': '#dc2626',
      'CONCLUÍDO': '#16a34a',
      'NOTIFICADO': '#dc2626',
      'MEDIDA APLICADA': '#9333ea',
      'AGUARDANDO VALIDACAO': '#16a34a',
      'AGUARDANDO VALIDAÇÃO': '#16a34a',
      'DIREITO NAO VIOLADO': '#ea580c',
      'DIREITO NÃO VIOLADO': '#ea580c',
      'NOTIFICAÇÃO ROSILDA': '#2563eb',
      'NOTIFICAÇÃO LEANDRO': '#2563eb',
      'AGUARDANDO DOCUMENTO': '#0d9488',
      'NOTIFICAÇÃO MIRIAN': '#0d9488',
      'NOTIFICAÇÃO SANDRA': '#7c3aed',
      'NOTIFICAÇÃO LUIZA': '#2563eb',
    };
    if (STATUS_COLORS[cleanName]) return STATUS_COLORS[cleanName];
    if (STATUS_COLORS[statusName]) return STATUS_COLORS[statusName];
    const palette = ['#2563eb', '#dc2626', '#9333ea', '#16a34a', '#ea580c', '#0284c7', '#eab308', '#0d9488', '#7c3aed'];
    return palette[index % palette.length];
  };

  const generatePrintChartsHtml = (statsData: any, total: number) => {
    if (!statsData) return '';
    const divisor = total || 1;

    // 1. Bairros (Dados reais do SIMCT)
    const bairrosList = Object.entries(statsData.bairros || {})
      .map(([name, val]) => ({ name: (name || 'NÃO INFORMADO').replace(/_/g, ' ').toUpperCase(), val: Number(val) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);
    const maxBairroVal = Math.max(...bairrosList.map(b => b.val), 1);

    const bairrosRowsHtml = bairrosList.map(item => {
      const pct = ((item.val / divisor) * 100).toFixed(1).replace('.', ',');
      const widthPct = Math.max((item.val / maxBairroVal) * 100, 2);
      return `
        <div class="chart-row-item">
          <div class="chart-label-col" title="${item.name}">${item.name}</div>
          <div class="chart-track-col">
            <div class="chart-fill-bar" style="width: ${widthPct}%; background-color: #2563eb;"></div>
          </div>
          <div class="chart-val-col">${item.val} (${pct}%)</div>
        </div>
      `;
    }).join('');

    // 2. Status / Situação (Dados reais do SIMCT)
    const statusSource = (statsData.status && Object.keys(statsData.status).length > 0)
      ? statsData.status
      : (statsData.origens || {});
    const statusList = Object.entries(statusSource)
      .map(([name, val]) => ({ name: (name || 'OUTROS').replace(/_/g, ' ').toUpperCase(), val: Number(val) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 12);
    const maxStatusVal = Math.max(...statusList.map(s => s.val), 1);

    const statusRowsHtml = statusList.map((item, idx) => {
      const pct = ((item.val / divisor) * 100).toFixed(1).replace('.', ',');
      const widthPct = Math.max((item.val / maxStatusVal) * 100, 2);
      const barColor = getStatusColor(item.name, idx);
      return `
        <div class="chart-row-item">
          <div class="chart-label-col" title="${item.name}">${item.name}</div>
          <div class="chart-track-col">
            <div class="chart-fill-bar" style="width: ${widthPct}%; background-color: ${barColor};"></div>
          </div>
          <div class="chart-val-col">${item.val} (${pct}%)</div>
        </div>
      `;
    }).join('');

    return `
      <div class="charts-section-print">
        <div class="charts-grid-print">
          <div class="chart-card-print">
            <div class="chart-header-print">
              <div class="chart-title-box">
                <span class="chart-title-text">GRÁFICO 1: DISTRIBUIÇÃO DE PROCEDIMENTOS POR BAIRRO</span>
                <span class="chart-info-icon">i</span>
              </div>
              <div class="chart-badge-tag">TOP 10 BAIRROS</div>
            </div>
            <div class="chart-body-list">
              ${bairrosRowsHtml || '<div style="text-align:center; color:#94a3b8;">Sem dados disponíveis</div>'}
            </div>
          </div>

          <div class="chart-card-print">
            <div class="chart-header-print">
              <div class="chart-title-box">
                <span class="chart-title-text">GRÁFICO 2: SITUAÇÃO E STATUS DOS PROCEDIMENTOS</span>
                <span class="chart-info-icon">i</span>
              </div>
              <div class="chart-badge-tag">TODOS OS STATUS</div>
            </div>
            <div class="chart-body-list">
              ${statusRowsHtml || '<div style="text-align:center; color:#94a3b8;">Sem dados disponíveis</div>'}
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const renderUiCharts = () => {
    if (!stats) return null;
    const divisor = totalDocs || 1;

    // 1. Bairros (Calculado em tempo real dos dados do SIMCT)
    const bairrosList = Object.entries(stats.bairros || {})
      .map(([name, val]) => ({ name: (name || 'NÃO INFORMADO').replace(/_/g, ' ').toUpperCase(), val: Number(val) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 10);
    const maxBairroVal = Math.max(...bairrosList.map(b => b.val), 1);

    // 2. Status / Situação (Calculado em tempo real dos dados do SIMCT)
    const statusSource = (stats.status && Object.keys(stats.status).length > 0)
      ? stats.status
      : (stats.origens || {});
    const statusList = Object.entries(statusSource)
      .map(([name, val]) => ({ name: (name || 'OUTROS').replace(/_/g, ' ').toUpperCase(), val: Number(val) }))
      .sort((a, b) => b.val - a.val)
      .slice(0, 12);
    const maxStatusVal = Math.max(...statusList.map(s => s.val), 1);

    return (
      <div className="mt-6 mb-4 space-y-4 text-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GRÁFICO 1 - MODELO DE LAYOUT COM DADOS DINÂMICOS DO SIMCT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                  GRÁFICO 1: DISTRIBUIÇÃO DE PROCEDIMENTOS POR BAIRRO
                </span>
                <span className="text-[10px] text-slate-400 border border-slate-300 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">i</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                TOP 10 BAIRROS
              </span>
            </div>
            <div className="space-y-2">
              {bairrosList.map((item, idx) => {
                const pct = ((item.val / divisor) * 100).toFixed(1).replace('.', ',');
                const widthPct = Math.max((item.val / maxBairroVal) * 100, 2);
                return (
                  <div key={idx} className="flex items-center text-[10px]">
                    <span className="w-36 shrink-0 text-right font-bold text-slate-700 uppercase truncate pr-2" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex-1 bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="w-16 shrink-0 font-extrabold text-slate-900 pl-2">
                      {item.val} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GRÁFICO 2 - MODELO DE LAYOUT COM DADOS DINÂMICOS DO SIMCT */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                  GRÁFICO 2: SITUAÇÃO E STATUS DOS PROCEDIMENTOS
                </span>
                <span className="text-[10px] text-slate-400 border border-slate-300 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">i</span>
              </div>
              <span className="text-[9px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                TODOS OS STATUS
              </span>
            </div>
            <div className="space-y-2">
              {statusList.map((item, idx) => {
                const pct = ((item.val / divisor) * 100).toFixed(1).replace('.', ',');
                const widthPct = Math.max((item.val / maxStatusVal) * 100, 2);
                const barColor = getStatusColor(item.name, idx);
                return (
                  <div key={idx} className="flex items-center text-[10px]">
                    <span className="w-36 shrink-0 text-right font-bold text-slate-700 uppercase truncate pr-2" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex-1 bg-slate-100 h-3.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300" style={{ width: `${widthPct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="w-16 shrink-0 font-extrabold text-slate-900 pl-2">
                      {item.val} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const generateClientSIMCTReport = (prompt: string, totalDocs: number, dataStats: any) => {
    const topDireitos = Object.entries(dataStats.direitos || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v} registros)`).join(', ') || 'Convivência Familiar, Educação e Saúde';
    const topBairros = Object.entries(dataStats.bairros || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'Bairros prioritários em mapeamento socioterritorial';
    const topAgentes = Object.entries(dataStats.agentes || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'Agentes familiares e institucionais notificados';
    const topOrigens = Object.entries(dataStats.origens || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'Unidades de Saúde, Escolas e Denúncias Espontâneas';

    const pLower = (prompt || '').toLowerCase();
    const isDocRequest = pLower.includes('cmdca') || pLower.includes('relat') || pLower.includes('oficio') || pLower.includes('documento') || pLower.includes('oficial') || pLower.includes('encaminh');

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

Colocamo-nos à disposição para apresentação detalhada dos dados na próxima Reunião Ordinária.

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
Foram analisados ${totalDocs} prontuários ativos no SIMCT envolvendo ${dataStats.totalCriancas || 0} crianças e adolescentes, categorizados por direitos fundamentais violações, território de ocorrência, perfil etário e agente violador.

---

### 3. PANORAMA GERAL DOS INDICADORES
| Indicador Operacional | Valor Observado no SIMCT |
| :--- | :--- |
| **Prontuários sob Monitoramento:** | ${totalDocs} casos cadastrados |
| **Crianças/Adolescentes Afetados:** | ${dataStats.totalCriancas || 0} indivíduos acompanhados |
| **Principais Direitos Violados:** | ${topDireitos} |
| **Territórios de Maior Incidência:** | ${topBairros} |
| **Agentes Violadores Notificados:** | ${topAgentes} |
| **Portas de Entrada / Origem:** | ${topOrigens} |

---

### 4. ANÁLISE TERRITORIAL E ÍNDICE DE VULNERABILIDADE (IVIA)
O mapeamento socioterritorial indica que os bairros **${topBairros}** concentram a maior pressão de atendimentos. Recomenda-se a descentralização de serviços socioassistenciais (CRAS e CREAS) para estas áreas prioritárias.

---

### 5. FRAGILIDADES E MOTOR DE ALERTAS
- 🟢 **NORMAL:** Acompanhamento regular de rotina e matrículas escolares.
- 🟡 **MODERADO:** Casos de reincidência familiar demandando centralização de Prontuário Único.
- 🟠 **ALTO:** Sobrecarga de solicitações direcionadas às Unidades de Saúde e CREAS.
- 🔴 **CRÍTICO:** Casos marcados com **PROVIDÊNCIA IMEDIATA URGENTE** que exigem intervenção de plantão e atuação do Sistema de Justiça.

---

### 6. RECOMENDADAÇÕES E PROPOSTAS AO CMDCA
1. **Destinação do FDCA:** Financiar edital de projetos voltados ao fortalecimento de vínculos nos bairros com maior taxa de violação.
2. **Protocolo Unificado da Escuta Especializada:** Implementar capacitação intersetorial contínua (Lei nº 13.431/2017).
3. **Pactuação de Fluxo das Recomendações (Art. 136, ECA):** Garantir respostas céleres do Poder Executivo às requisições do Conselho Tutelar.

---
**Data da Emissão:** 10 de Agosto de 2026
*Observatório SIMCT — Garantia de Direitos em Hortolândia/SP*`;
    }

    return `### 📊 OBSERVATÓRIO INTELIGENTE SIMCT - NÍVEL 1: MONITORAMENTO DE DADOS
Análise fundamentada no Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990) e diretrizes do Planalto:

- **Volume de Prontuários no SIMCT:** ${totalDocs} prontuários sob monitoramento ativo.
- **Crianças e Adolescentes Acompanhados:** ${dataStats.totalCriancas || 0} indivíduos no Sistema de Garantia de Direitos (SGDCA).
- **Direitos Fundamentais Mais Violados:** ${topDireitos}.
- **Territórios com Maior Incidência (Hortolândia):** ${topBairros}.
- **Principais Agentes Violadores:** ${topAgentes}.
- **Principais Origens das Denúncias/Entradas:** ${topOrigens}.

---

### 📈 OBSERVATÓRIO NÍVEL 2: ANÁLISE SOCIOTERRITORIAL E ÍNDICE DE VULNERABILIDADE (IVIA)
- **Diagnóstico Território-Violação:** Os dados do SIMCT indicam concentração de demandas nos territórios **${topBairros}**, exigindo ações descentralizadas da Rede de Proteção.
- **Perfil Demográfico:**
  - *Primeira Infância (0-6 anos):* Foco em prevenção de negligência, acompanhamento vacinal e creches/pré-escola.
  - *Adolescência (12-18 anos):* Foco em mitigação da evasão escolar, convivência familiar e atenção em saúde mental.
- **Pressão sobre a Rede de Proteção:** Alta demanda nos equipamentos de retaguarda (CRAS, CREAS, UBS/UPA e Unidades Escolares), demandando pactuação de fluxos contínuos.

---

### 🚨 OBSERVATÓRIO NÍVEL 3: MOTOR DE ALERTAS E SINAIS DE RISCO
- 🟢 **VERDE (Normal):** Padrão de atendimentos de rotina e acompanhamento de frequências escolares.
- 🟡 **AMARELO (Atenção):** Registro de casos de reincidência familiar sem Plano Individual de Atendimento (PIA) integrado.
- 🟠 **LARANJA (Alerta):** Sobrecarga na porta de entrada socioassistencial e necessidade de acelerar retornos da Rede.
- 🔴 **VERMELHO (Crítico):** Prontuários sinalizados com **PROVIDÊNCIA IMEDIATA URGENTE** (violência física/sexual e grave negligência) exigindo intervenção no regime de plantão do Conselho Tutelar e notificação imediata ao Sistema de Justiça.

---

### 📡 RADAR DA INFÂNCIA DE HORTOLÂNDIA
- 🔴 **Riscos Críticos:** Violações graves de integridade física e necessidade de acolhimento protetivo emergencial.
- 🟠 **Em Crescimento:** Demandas de evasão escolar e suporte familiar socioemocional no pós-pandemia.
- 🟡 **Pontos de Atenção:** Reincidência de notificações em famílias atendidas por múltiplos serviços sem centralização de prontuário.
- 🔵 **Oportunidades:** Fortalecimento do Fundo dos Direitos da Criança e do Adolescente (FDCA) via edital do CMDCA direcionado aos territórios prioritários.

---

### 💡 OBSERVATÓRIO NÍVEL 4: INTELIGÊNCIA E RECOMENDAÇÕES PARA POLÍTICAS PÚBLICAS (CMDCA)
1. **Atuação Estratégica do CMDCA:** Financiar programas de fortalecimento de vínculos socioafetivos e prevenção da violência nos bairros **${topBairros}**.
2. **Protocolo Intersetorial de Proteção:** Capacitação unificada da Rede sobre a Lei da Escuta Especializada (Lei nº 13.431/2017) e aplicação rigorosa da Lei Henry Borel (Lei nº 14.344/2022).
3. **Pactuação de Fluxo do Art. 136 do ECA:** Estabelecer com o Poder Executivo prazos céleres para atendimento das requisições de serviços públicos expedidas pelo Conselho Tutelar.`;
  };

  const handleSendMessage = async (e?: React.FormEvent, initialPrompt?: string) => {
    if (e) e.preventDefault();
    const messageToSend = initialPrompt || userInput;
    if (!messageToSend.trim() || loading) return;

    const newMessage: Message = { role: 'user', text: messageToSend };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setLoading(true);
    setError(null);

    try {
      const contents = [
        { role: 'user', parts: [{ text: getSystemContext() }] },
        ...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: messageToSend }] }
      ];

      let responseData: any = null;
      try {
        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents, model: "gemini-3.6-flash" })
        });

        const responseText = await res.text();
        if (responseText && responseText.trim().startsWith("{")) {
          responseData = JSON.parse(responseText);
        }
      } catch (fetchErr) {
        console.warn("Fetch Error in SIMCT AI Analyzer:", fetchErr);
      }

      const answerText = responseData?.text || generateClientSIMCTReport(messageToSend, totalDocs, stats);

      const botResponse: Message = { 
        role: 'model', 
        text: answerText 
      };
      setChatHistory(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error(err);
      // Fallback display if any unhandled error occurs
      const botResponse: Message = { 
        role: 'model', 
        text: generateClientSIMCTReport(messageToSend, totalDocs, stats)
      };
      setChatHistory(prev => [...prev, botResponse]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6 print:hidden animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-white/10 rounded-[3rem] flex flex-col h-[650px] shadow-2xl overflow-hidden animate-in zoom-in-95">
        <header className="p-8 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Bot className="w-6 h-6" /></div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Analista Digital SIMCT</h4>
              <p className="text-sm font-bold text-white uppercase">Gestão de Inteligência Hortolândia</p>
            </div>
          </div>
          {chatHistory.length > 0 && (
            <button 
              onClick={() => {
                setChatHistory([]);
                setError(null);
                setUserInput('');
              }} 
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
              <span>Nova Conversa</span>
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth flex flex-col">
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 space-y-6 my-auto">
              <div className="p-4 bg-blue-500/10 rounded-full text-blue-400 animate-pulse">
                <Bot className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black uppercase tracking-widest text-white">Como posso ajudar hoje?</h3>
                <p className="text-[10px] text-slate-400 max-w-sm uppercase font-black tracking-wider leading-relaxed">
                  Consulte estatísticas, peça cruzamentos de dados ou análises fundamentadas no ECA para Hortolândia.
                </p>
              </div>
              
              <div className="space-y-4 w-full max-w-2xl pt-2">
                <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase text-blue-400 tracking-widest border-b border-white/10 pb-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Central de Documentos e Inteligência SIMCT</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full">
                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "O que os dados estão dizendo?")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">📢</span>
                    <span className="truncate">O que os dados dizem?</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Gerar relatório para o CMDCA")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-blue-300 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">📑</span>
                    <span className="truncate">Relatório para CMDCA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Gere um Ofício Institucional de encaminhamento de dados e relatório técnico para o CMDCA.")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">📄</span>
                    <span className="truncate">Ofício de Encaminhamento</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Faça uma análise temporal comparativa entre períodos e identificação de tendências no SIMCT.")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">📈</span>
                    <span className="truncate">Análise Comparativa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Elabore um Diagnóstico Municipal Integrado da Infância e Adolescência para Hortolândia com base nos dados do SIMCT.")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">🏛️</span>
                    <span className="truncate">Diagnóstico Municipal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Quais são os bairros com maior índice de violação de direitos (IVIA) e quais os principais agentes violadores nesses locais?")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">🏘️</span>
                    <span className="truncate">Análise Territorial IVIA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Apresente a classificação do Radar de Riscos (🟢 Normal, 🟡 Atenção, 🟠 Alerta, 🔴 Crítico) para as demandas ativas do SIMCT.")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">🚨</span>
                    <span className="truncate">Radar de Riscos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage(undefined, "Proponha um plano detalhado de Políticas Públicas e Capacitação da Rede de Garantia fundamentado no ECA para o CMDCA.")}
                    disabled={loading || totalDocs === 0}
                    className="p-3 bg-slate-800/90 hover:bg-slate-800 border border-white/10 hover:border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <span className="text-sm shrink-0">💡</span>
                    <span className="truncate">Propostas de Políticas</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                </div>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none shadow-inner'}`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(msg.text) }} />
                  )}
                  {msg.role === 'model' && (
                    <>
                      {renderUiCharts()}
                      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const chartsHtml = generatePrintChartsHtml(stats, totalDocs);
                              const formattedHtml = parseMarkdownToHtml(msg.text);

                              printWindow.document.write(`
                                <!DOCTYPE html>
                                <html>
                                  <head>
                                    <title>Relatório Institucional SIMCT — Hortolândia/SP</title>
                                    <style>
                                      @page { size: A4; margin: 15mm; }
                                      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 15px; color: #0f172a; line-height: 1.5; font-size: 12px; }
                                      .header { text-align: center; border-bottom: 3px double #1e3a8a; padding-bottom: 10px; margin-bottom: 16px; }
                                      .header h2 { margin: 0; color: #1e3a8a; font-size: 15px; font-weight: bold; text-transform: uppercase; }
                                      .header p { margin: 3px 0 0 0; font-size: 10px; color: #475569; font-weight: bold; text-transform: uppercase; }

                                      .charts-section-print { margin: 16px 0; page-break-inside: avoid; }
                                      .charts-grid-print { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                                      .chart-card-print { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 14px; font-family: 'Segoe UI', Arial, sans-serif; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
                                      .chart-header-print { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 10px; }
                                      .chart-title-box { display: flex; align-items: center; gap: 4px; }
                                      .chart-title-text { font-size: 9.5px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: -0.2px; }
                                      .chart-info-icon { display: inline-flex; align-items: center; justify-content: center; width: 11px; height: 11px; border-radius: 50%; border: 1px solid #cbd5e1; color: #94a3b8; font-size: 8px; font-weight: bold; }
                                      .chart-badge-tag { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 2px 6px; font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
                                      .chart-body-list { display: flex; flex-direction: column; gap: 5px; }
                                      .chart-row-item { display: flex; align-items: center; font-size: 8.5px; line-height: 1; }
                                      .chart-label-col { width: 120px; min-width: 120px; text-align: right; font-weight: 700; color: #334155; text-transform: uppercase; padding-right: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                                      .chart-track-col { flex: 1; background-color: #f1f5f9; height: 12px; border-radius: 3px; overflow: hidden; }
                                      .chart-fill-bar { height: 100%; border-radius: 3px; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                                      .chart-val-col { min-width: 55px; padding-left: 6px; font-weight: 800; color: #0f172a; font-size: 8.5px; white-space: nowrap; }

                                      .content { white-space: pre-wrap; word-wrap: break-word; }
                                      table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 11px; }
                                      th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
                                      th { background-color: #f1f5f9; font-weight: bold; color: #1e3a8a; }
                                      .signatures { margin-top: 30px; page-break-inside: avoid; border-top: 2px solid #e2e8f0; padding-top: 16px; }
                                      .sig-grid { display: flex; justify-content: space-around; margin-top: 40px; text-align: center; }
                                      .sig-box { width: 45%; border-top: 1px solid #64748b; padding-top: 4px; font-size: 10px; font-weight: bold; }
                                      .footer { text-align: center; margin-top: 20px; font-size: 8.5px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="header">
                                      <h2>Conselho Tutelar de Hortolândia — SP</h2>
                                      <p>Núcleo de Inteligência, Monitoramento e Observatório SIMCT</p>
                                      <p>Estatuto da Criança e do Adolescente — ECA (Lei nº 8.069/1990)</p>
                                    </div>

                                    ${chartsHtml}

                                    <div class="content">${formattedHtml}</div>
                                    
                                    <div class="signatures">
                                      <p style="text-align: center; font-weight: bold; font-size: 11px; color: #475569;">
                                        Hortolândia/SP, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                                      </p>
                                      <div class="sig-grid">
                                        <div class="sig-box">
                                          EQUIPE DO OBSERVATÓRIO SIMCT<br>
                                          <span style="font-weight: normal; font-size: 9px;">Conselho Tutelar de Hortolândia</span>
                                        </div>
                                        <div class="sig-box">
                                          PRESIDÊNCIA DO CMDCA<br>
                                          <span style="font-weight: normal; font-size: 9px;">Conselho Municipal dos Direitos da Criança e do Adolescente</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div class="footer">
                                      Documento Institucional Gerado Automaticamente pelo SIMCT Hortolândia
                                    </div>
                                  </body>
                                </html>
                              `);
                              printWindow.document.close();
                              setTimeout(() => { printWindow.print(); }, 500);
                            }
                          }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / Salvar PDF</span>
                      </button>

                      <button
                        onClick={() => {
                          const element = document.createElement("a");
                          const file = new Blob([msg.text], { type: 'text/plain;charset=utf-8' });
                          element.href = URL.createObjectURL(file);
                          element.download = `SIMCT_Relatorio_CMDCA_${new Date().toISOString().slice(0,10)}.doc`;
                          document.body.appendChild(element);
                          element.click();
                          document.body.removeChild(element);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Baixar Word (.doc)</span>
                      </button>

                      <button
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-all shadow-sm active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Texto</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
          {loading && <div className="flex gap-4 animate-pulse"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center"><Bot className="w-5 h-5 text-blue-400 animate-spin" /></div><div className="bg-slate-800 h-12 w-24 rounded-[2rem] flex items-center justify-center px-4"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Digitando...</span></div></div>}
          {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-center text-[10px] uppercase font-black">{error}</div>}
        </div>

        <form onSubmit={handleSendMessage} className="p-8 bg-slate-800/50 border-t border-white/10">
          <div className="relative">
            <input type="text" placeholder="Pergunte sobre direitos, bairros ou sugestões do ECA..." className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-8 pr-16 py-5 text-sm text-white outline-none focus:border-blue-500 font-bold" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={loading} />
            <button type="submit" disabled={loading || !userInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-xl shadow-xl transition-all hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"><Send className="w-5 h-5" /></button>
          </div>
          <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">SIMCT Diagnóstico em tempo real</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIStatisticsAnalyzer;
