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
      Você é o "Analista SIMCT de Hortolândia", assistente de IA especialista em dados do Conselho Tutelar e ECA.
      
      BASE DE DADOS ATUALIZADA:
      - Total de Prontuários: ${totalDocs}
      - Total de Crianças: ${stats.totalCriancas}
      - Direitos Fundamentais Violados: ${JSON.stringify(stats.direitos)}
      - Direitos Violados Ligados a Quem Comunicou (Origem): ${JSON.stringify(stats.direitosPorOrigem)}
      - Bairros (Ranking): ${JSON.stringify(stats.bairros)}
      - Agentes Violadores: ${JSON.stringify(stats.agentes)}
      - Origem das Denúncias: ${JSON.stringify(stats.origens)}
      - Atribuições ECA (Art. 136) aplicadas: ${JSON.stringify(stats.atribuicoesECA)}
      - Tipos de Violência: ${JSON.stringify(stats.violencias)}
      - Faixas Etárias: ${JSON.stringify(stats.faixasEtarias)}
      - Ações por Conselheiro: ${JSON.stringify(stats.acoesPorConselheiro)}

      OBJETIVOS E REGRAS:
      1. ANALISAR PADRÕES: Cruze dados de bairros com tipos de violência e agentes.
      2. PRIORIDADES: Identifique qual bairro exige prioridade de política pública urgente.
      3. ÓRGÃOS: Indique qual órgão mais recebe requisições do Conselho Tutelar (Art. 136).
      4. LEGISLAÇÃO E FONTE PLANALTO: Fundamente suas análises e sugestões na Lei nº 8.069/1990 (Estatuto da Criança e do Adolescente - ECA) e demais normas de garantia de direitos em suas versões mais atualizadas, tendo como referência as publicações oficiais do Portal do Planalto (planalto.gov.br).
      5. DIREITOS FUNDAMENTAIS: Sempre correlacione as violações com os direitos fundamentais expressos no ECA e na Constituição (Vida, Saúde, Alimentação, Educação, Esporte, Lazer, Profissionalização, Cultura, Dignidade, Respeito, Liberdade, Convivência Familiar e Comunitária), citando as seções e artigos corretos com base no texto oficial do Planalto.
      6. TOM: Institucional, técnico, propositivo e estritamente legalista.
      7. RESPOSTAS CURTAS: Se o usuário pedir um dado específico, seja direto. Se pedir análise, seja profundo.
      8. REINCIDÊNCIA: Se os dados sugerirem padrões de negligência por agente familiar ou institucional, destaque.
      9. FAIXAS ETÁRIAS: Analise se há correlação entre a faixa etária (ex: Primeira Infância) e tipos específicos de negligência ou violência.
      10. RESPEITO À REDAÇÃO VIGENTE: Ao citar qualquer artigo do ECA, assegure-se de que está se referindo à redação atualizada do Planalto, observando inclusive alterações recentes ocorridas na legislação (como a Lei Henry Borel nº 14.344/2022 ou atualizações no Art. 136 e atribuições correlatas).
    `;
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

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, model: "gemini-1.5-flash" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro na análise de dados");
      }

      const response = await res.json();

      const botResponse: Message = { 
        role: 'model', 
        text: response.text || "Não foi possível gerar a análise técnica SIMCT." 
      };
      setChatHistory(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Erro de conexão com o servidor de Inteligência de Dados SIMCT.");
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
