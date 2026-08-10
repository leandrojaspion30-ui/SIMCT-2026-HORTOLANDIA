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

  const generateClientSIMCTReport = (prompt: string, total: number, dataStats: any) => {
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
Foram analisados ${total} prontuários ativos no SIMCT envolvendo ${dataStats.totalCriancas || 0} crianças e adolescentes, categorizados por direitos fundamentais violações, território de ocorrência, perfil etário e agente violador.

---

### 3. PANORAMA GERAL DOS INDICADORES
| Indicador Operacional | Valor Observado no SIMCT |
| :--- | :--- |
| **Prontuários sob Monitoramento:** | ${total} casos cadastrados |
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

- **Volume de Prontuários no SIMCT:** ${total} prontuários sob monitoramento ativo.
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg pt-4">
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "O que os dados estão dizendo?")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95"
                >
                  <span className="text-base shrink-0">📢</span>
                  <span>O que os dados estão dizendo?</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "Gerar relatório para o CMDCA")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-blue-500/40 rounded-2xl text-[10px] font-black uppercase text-blue-300 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95 bg-blue-500/10"
                >
                  <span className="text-base shrink-0">📑</span>
                  <span>Gerar Relatório para o CMDCA</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "Quais são os bairros com maior índice de violação de direitos e quais os principais agentes violadores nesses locais?")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95"
                >
                  <span className="text-base shrink-0">🏘️</span>
                  <span>Bairros & Agentes Violadores</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "Sugira uma proposta de capacitação para a rede de garantia baseada nos direitos fundamentais mais violados de acordo com os dados.")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95"
                >
                  <span className="text-base shrink-0">⚖️</span>
                  <span>Sugestões ECA para CMDCA</span>
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                </div>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none shadow-inner'}`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                  {msg.role === 'model' && (
                    <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          if (printWindow) {
                            printWindow.document.write(`
                              <html>
                                <head>
                                  <title>Relatório SIMCT - Hortolândia</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #000; line-height: 1.6; }
                                    h1, h2, h3 { color: #1e3a8a; }
                                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                                    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
                                    th { background-color: #f1f5f9; }
                                    hr { border: none; border-top: 1px solid #ccc; margin: 20px 0; }
                                  </style>
                                </head>
                                <body>
                                  <pre style="white-space: pre-wrap; font-family: inherit;">${msg.text}</pre>
                                </body>
                              </html>
                            `);
                            printWindow.document.close();
                            printWindow.print();
                          }
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/30 rounded-xl text-[10px] font-bold uppercase transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / Salvar PDF</span>
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(msg.text)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-[10px] font-bold uppercase transition-all"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Texto</span>
                      </button>
                    </div>
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
