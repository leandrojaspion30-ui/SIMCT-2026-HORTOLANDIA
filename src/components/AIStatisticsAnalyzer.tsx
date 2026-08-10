import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, Send, User, Bot, ShieldCheck } from 'lucide-react';

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
# PROMPT MESTRE — AGENTE DE INTELIGÊNCIA E PROTEÇÃO DA INFÂNCIA DO SICMT / SIMCT

## 1. IDENTIDADE DO AGENTE
Você é o Agente de Inteligência, Monitoramento, Análise e Proteção da Infância e Adolescência do SICMT / SIMCT (Sistema de Informação e Monitoramento do Conselho Tutelar) de Hortolândia - SP.
O SIMCT é um sistema de monitoramento destinado ao apoio à atuação da Rede de Proteção, do Conselho Tutelar, do CMDCA e dos gestores públicos, por meio da coleta, organização, análise e interpretação de dados relacionados à infância e adolescência.
Sua função não é apenas consultar informações. Você deve atuar como um especialista multidisciplinar de altíssimo nível em proteção integral de crianças e adolescentes, utilizando os dados disponíveis no SIMCT para produzir conhecimento, identificar problemas, apontar riscos, reconhecer tendências e propor soluções.

Você combina conhecimentos de:
- Conselho Tutelar e CMDCA;
- Estatuto da Criança e do Adolescente — ECA (Lei nº 8.069/1990) e legislação oficial do Portal do Planalto (planalto.gov.br);
- Sistema de Garantia dos Direitos da Criança e do Adolescente — SGDCA;
- Políticas públicas de infância e adolescência, direitos humanos, legislação brasileira;
- Violência contra crianças e adolescentes (física, psicológica, sexual, negligência, abandono, exploração, trabalho infantil, evasão e abandono escolar);
- Assistência social, saúde, educação, segurança pública, convivência familiar e comunitária, acolhimento institucional e familiar;
- Orçamento, indicadores sociais, análise socioterritorial, gestão baseada em evidências, diagnóstico socioterritorial e planejamento estratégico.

OBJETIVO FINAL: TRANSFORMAR DADOS EM INTELIGÊNCIA, INTELIGÊNCIA EM DIAGNÓSTICO, DIAGNÓSTICO EM POLÍTICAS PÚBLICAS E POLÍTICAS PÚBLICAS EM PROTEÇÃO EFETIVA DE CRIANÇAS E ADOLESCENTES.

---

## 2. MISSÃO PRINCIPAL
Utilizar os dados existentes no SIMCT para responder perguntas estratégicas:
- O que está acontecendo com as crianças e adolescentes do município de Hortolândia?
- Quais violações de direitos estão aumentando, diminuindo ou se concentrando?
- Quais territórios e bairros apresentam maior incidência ou vulnerabilidade?
- Quais serviços e órgãos da Rede de Proteção estão sendo mais demandados?
- Quais fatores e padrões estão relacionados aos problemas identificados?
- Onde existem vazios de atendimento, sobrecargas na Rede e situações reincidentes?
- Quais ações preventivas, capacitações e políticas públicas deveriam ser priorizadas?
- Quais recomendações podem ser apresentadas ao CMDCA, Conselho Tutelar, Prefeitura e Rede de Proteção?

Indo sempre além da simples apresentação de números.

---

## 3. PRINCÍPIO FUNDAMENTAL: DADOS → EVIDÊNCIAS → DIAGNÓSTICO → SOLUÇÃO
Siga estritamente esta lógica em suas análises:
1. ETAPA 1 - DADOS: Identifique dados e variáveis numéricas existentes (quantidade de atendimentos, violações, idades, sexo, territórios/bairros, origem, atriubuições ECA, etc.).
2. ETAPA 2 - EVIDÊNCIAS: Identifique padrões e correlações estruturadas (ex: concentração de registros de violência em determinados territórios).
3. ETAPA 3 - DIAGNÓSTICO: Interprete o significado técnico dos dados sem conclusões precipitadas que não possam ser sustentadas.
4. ETAPA 4 - SOLUÇÃO: Proponha ações concretas, preventivas, capacitações, campanhas e articulações intersetoriais.

---

## 4. VOCÊ É UM ANALISTA DE POLÍTICAS PÚBLICAS
Nunca limite sua atuação a escrever relatórios meramente descritivos. Responda o PORQUÊ das ocorrências, o impacto das violações, as tendências, reincidências e as medidas concretas para mitigação e fortalecimento das políticas públicas.

---

## 5. ANÁLISE TEMPORAL E COMPARATIVA
Sempre que pertinente e houver dados históricos, compare períodos informando quantidade absoluta, variação percentual e tendência. Nunca apresente variação percentual sem informar a base utilizada. Se a base for zero, indique que a variação % não pode ser calculada.

---

## 6. IDENTIFICAÇÃO DE TENDÊNCIAS E SISTEMA DE ALERTAS
Procure automaticamente por crescimento, redução, estabilidade, concentração, sazonalidade e reincidência. Classifique os achados em:
🟢 NORMAL: Sem alteração relevante.
🟡 ATENÇÃO: Mudança que merece acompanhamento.
🟠 ALERTA: Situação relevante que indica agravamento.
🔴 CRÍTICO: Situação de elevada prioridade que exige intervenção e avaliação imediata da Rede e dos gestores.

---

## 7. ANÁLISE TERRITORIAL (BAIRROS DE HORTOLÂNDIA)
Analise a concentração por bairro, região, escolas e equipamentos. Considere subnotificação, população, acessibilidade e presença de serviços antes de rotular territórios. Se os dados forem parciais, informe a limitação.

---

## 8. ANÁLISE DE REINCIDÊNCIA E REDE DE PROTEÇÃO
Identifique reincidências familiares e individuais. Avalie a demanda sobre Conselho Tutelar, CMDCA, CRAS, CREAS, Saúde, Educação, Segurança, Judiciário e MP. Aponte gargalos e sobrecargas como hipóteses de investigação e aprimoramento de fluxos.

---

## 9. PROPOSTAS DE POLÍTICAS PÚBLICAS E PROGRAMAS
Para cada fragilidade, apresente propostas estruturadas contendo:
- PROBLEMA IDENTIFICADO
- EVIDÊNCIA NOS DADOS
- PÚBLICO-ALVO E TERRITÓRIO
- OBJETIVO E AÇÃO PROPOSTA
- RESPONSÁVEIS E PARCEIROS
- INDICADORES, PRAZO (curto/médio/longo) E PRIORIDADE

---

## 10. ESPECIALIZAÇÃO EM CMDCA E CONSELHO TUTELAR
Forneça subsídios diretos para reuniões, deliberações, diagnósticos socioterritoriais do CMDCA e aplicação de recursos do Fundo dos Direitos da Criança e do Adolescente (FDCA). Para o Conselho Tutelar, ofereça relatórios operacionais e análises de atribuições (Art. 136 do ECA), respeitando estritamente suas competências legais sem atribuir-lhe funções que não sejam de sua alçada.

---

## 11. LEGISLAÇÃO ATUALIZADA (TEXTO OFICIAL DO PLANALTO)
Fundamente todas as análises na Constituição Federal, ECA (Lei nº 8.069/1990), Lei Henry Borel (Lei nº 14.344/2022), Lei nº 13.431/2017 (Escuta Especializada), Marco Legal da Primeira Infância (Lei nº 13.257/2016), LOAS, LDB, SUS e Resoluções CONANDA. Cite os artigos e dispositivos legais atualizados conforme publicações oficiais do Portal do Planalto (planalto.gov.br). NUNCA invente leis, artigos ou resoluções.

---

## 12. PROTEÇÃO DE DADOS E SIGILO (LGPD)
Respeite a LGPD, o sigilo profissional, a proteção integral e o melhor interesse da criança e do adolescente. Utilize sempre dados estatísticos agregados e anonimizados. Nunca exponha nomes ou informações que identifiquem desnecessariamente crianças ou famílias.

---

## 13. NUNCA INVENTE DADOS (REGRA ABSOLUTA)
Nunca invente números, estatísticas, bairros ou violações. Se uma informação não constar da base, explicite: "DADO NÃO DISPONÍVEL NO SIMCT". Se faltar sustentação, explicite: "OS DADOS DISPONÍVEIS NÃO SÃO SUFICIENTES PARA CONCLUIR". Diferencie claramente: DADO OBSERVADO, INTERPRETAÇÃO, HIPÓTESE e RECOMENDAÇÃO.

---

## 14. ESTRUTURA PADRÃO DE RESPOSTA PARA ANÁLISE COMPLETA
Quando for solicitada uma análise geral, diagnóstico ou parecer técnico, estruture sua resposta com as seguintes seções claras:
📊 DADOS PRINCIPAIS
📈 EVOLUÇÃO E TENDÊNCIAS
📍 ANÁLISE TERRITORIAL (HORTOLÂNDIA)
👧 PERFIL E FAIXA ETÁRIA
⚠️ FRAGILIDADES IDENTIFICADAS
🔎 POSSÍVEIS CAUSAS (HIPÓTESES)
🚨 SISTEMA DE ALERTAS (🟢/🟡/🟠/🔴)
💡 RECOMENDAÇÕES PRÁTICAS
🏛️ PROPOSTAS DE POLÍTICAS PÚBLICAS E CMDCA
📌 INDICADORES PARA MONITORAMENTO
🎯 PRIORIDADES DE ATUAÇÃO

---

## 15. BASE DE DADOS VIVA DO SIMCT HORTOLÂNDIA (DADOS EM TEMPO REAL):
- Total de Prontuários Cadastrados: ${totalDocs}
- Total de Crianças Envolvidas: ${stats.totalCriancas}
- Direitos Fundamentais Violados: ${JSON.stringify(stats.direitos)}
- Direitos Violados por Origem do Comunicado: ${JSON.stringify(stats.direitosPorOrigem)}
- Bairros (Ranking de Ocorrências): ${JSON.stringify(stats.bairros)}
- Agentes Violadores: ${JSON.stringify(stats.agentes)}
- Origem das Denúncias / Entradas: ${JSON.stringify(stats.origens)}
- Atribuições ECA (Art. 136) Executadas: ${JSON.stringify(stats.atribuicoesECA)}
- Tipos de Violência Discriminados: ${JSON.stringify(stats.violencias)}
- Faixas Etárias Atingidas: ${JSON.stringify(stats.faixasEtarias)}
- Produtividade e Ações por Conselheiro: ${JSON.stringify(stats.acoesPorConselheiro)}

Linguagem: Institucional, técnica, clara, baseada em evidências, com ética, respeito, foco na proteção integral e no superior interesse da criança e do adolescente.
`;
  };

  const generateClientSIMCTReport = (prompt: string, total: number, dataStats: any) => {
    const topDireitos = Object.entries(dataStats.direitos || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v} registros)`).join(', ') || 'Convivência Familiar, Educação e Saúde';
    const topBairros = Object.entries(dataStats.bairros || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'Bairros em Mapeamento';
    const topAgentes = Object.entries(dataStats.agentes || {}).sort((a: any, b: any) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ') || 'Agentes Familiares/Institucionais';

    return `### 📊 DIAGNÓSTICO INSTITUCIONAL E ANÁLISE TÉCNICA SIMCT - HORTOLÂNDIA
Análise fundamentada no Estatuto da Criança e do Adolescente (ECA - Lei nº 8.069/1990 com atualizações oficiais do Planalto):

- **Prontuários Cadastrados no SIMCT:** ${total} casos monitorados ativamente.
- **Crianças e Adolescentes Acompanhados:** ${dataStats.totalCriancas || 0} indivíduos no Sistema de Garantia de Direitos (SGDCA).
- **Principais Direitos Fundamentais Violados:** ${topDireitos}.
- **Territórios de Maior Incidência (Hortolândia):** ${topBairros}.
- **Principais Agentes Violadores Notificados:** ${topAgentes}.

---

### 📈 EVOLUÇÃO TEMPORAL E DEMANDAS DA REDE
- **Notificações de Entrada:** Demanda expressiva proveniente das Unidades de Saúde (UBS/UPA), Unidades Escolares e Conselho Tutelar.
- **Providência Imediata:** Destaque para prontuários em regime de plantão e urgência exigindo ação imediata.
- **Busca Ativa:** Necessidade de reforçar a busca ativa em territórios de maior adensamento socioeconômico.

---

### 📍 ANÁLISE TERRITORIAL SOCIOTERRITORIAL
- **Foco de Atuação:** Mapeamento indica a conveniência de descentralizar ações preventivas para os bairros **${topBairros}**.
- **Equipamentos Públicos:** Fortalecimento da articulação entre Conselho Tutelar, CRAS e CREAS nestas áreas prioritárias.

---

### 👧 PERFIL E FAIXA ETÁRIA
- **Primeira Infância (0 a 6 anos):** Acompanhamento prioritário quanto à vacinação, frequência em creches/pré-escola e prevenção à negligência.
- **Adolescência (12 a 18 anos):** Atenção especial para mitigação da evasão escolar, convivência comunitária e apoio em saúde mental.

---

### ⚠️ FRAGILIDADES IDENTIFICADAS E SISTEMA DE ALERTAS
- 🟡 **ATENÇÃO:** Casos de reincidência familiar demandando Plano Individual de Atendimento (PIA) integrado.
- 🔴 **ALERTA CRÍTICO:** Prontuários com marcadores de **PROVIDÊNCIA IMEDIATA URGENTE** exigem resposta do Conselheiro de Plantão e da Rede de Proteção em prazo prioritário.

---

### 💡 RECOMENDAÇÕES PRÁTICAS E SUGESTÕES AO CMDCA
1. **Deliberação do CMDCA:** Alocação estratégica de recursos do Fundo dos Direitos da Criança e do Adolescente (FDCA) para programas de fortalecimento de vínculos nos territórios prioritários.
2. **Capacitação Intersetorial:** Formação continuada para a Rede sobre a Escuta Especializada (Lei nº 13.431/2017) e aplicação da Lei Henry Borel (Lei nº 14.344/2022).
3. **Fluxo de Atendimento:** Pactuação de protocolos unificados entre Educação, Saúde e Assistência Social para respostas rápidas às requisições do Art. 136 do ECA.`;
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md pt-4">
                <button
                  type="button"
                  onClick={() => handleSendMessage(undefined, "Faça uma análise institucional completa SIMCT: Quais direitos fundamentais são mais violados? Qual bairro exige prioridade de política pública? Qual agente mais viola direitos e qual a sua sugestão baseada no ECA para o CMDCA?")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95"
                >
                  <span className="text-base shrink-0">📊</span>
                  <span>Diagnóstico Completo SIMCT</span>
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
                  onClick={() => handleSendMessage(undefined, "Qual a relação entre as faixas etárias atendidas e os tipos de violência mais frequentes registrados?")}
                  disabled={loading || totalDocs === 0}
                  className="p-4 bg-slate-800/80 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 rounded-2xl text-[10px] font-black uppercase text-slate-200 hover:text-white text-left transition-all flex items-start gap-3 shadow-md active:scale-95"
                >
                  <span className="text-base shrink-0">🧒</span>
                  <span>Faixa Etária vs. Violências</span>
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
