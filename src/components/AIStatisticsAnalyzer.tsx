import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
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
      4. LEGISLAÇÃO: Fundamente suas sugestões nos Artigos 86, 88, 131 e 136 do ECA e na Resolução CONANDA 231/2022.
      5. TOM: Institucional, técnico e propositivo.
      6. RESPOSTAS CURTAS: Se o usuário pedir um dado específico, seja direto. Se pedir análise, seja profundo.
      7. REINCIDÊNCIA: Se os dados sugerirem padrões de negligência por agente familiar ou institucional, destaque.
      8. FAIXAS ETÁRIAS: Analise se há correlação entre a faixa etária (ex: Primeira Infância) e tipos específicos de negligência ou violência.
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contents = [
        { role: 'user', parts: [{ text: getSystemContext() }] },
        ...chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        { role: 'user', parts: [{ text: messageToSend }] }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: contents as any,
      });

      const botResponse: Message = { 
        role: 'model', 
        text: response.text || "Não foi possível gerar a análise técnica SIMCT." 
      };
      setChatHistory(prev => [...prev, botResponse]);
    } catch (err: any) {
      console.error(err);
      setError("Erro de conexão com o servidor de Inteligência de Dados SIMCT.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 space-y-6">
      {chatHistory.length === 0 ? (
        <button 
          onClick={() => handleSendMessage(undefined, "Faça uma análise institucional completa SIMCT: Quais direitos fundamentais são mais violados? Qual bairro exige prioridade de política pública? Qual agente mais viola direitos e qual a sua sugestão baseada no ECA para o CMDCA?")}
          disabled={loading || totalDocs === 0}
          className="w-full py-8 bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:scale-[1.01] active:scale-[0.99] transition-all shadow-xl flex items-center justify-center gap-4"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-amber-300 fill-amber-300" />}
          {loading ? 'Sincronizando Banco de Dados SIMCT...' : 'Iniciar Diagnóstico de Políticas Públicas com IA SIMCT'}
        </button>
      ) : (
        <div className="bg-slate-900 border border-white/10 rounded-[3rem] flex flex-col h-[650px] shadow-2xl overflow-hidden animate-in zoom-in-95">
          <header className="p-8 border-b border-white/10 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl text-blue-400"><Bot className="w-6 h-6" /></div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400">Analista Digital SIMCT</h4>
                <p className="text-sm font-bold text-white uppercase">Gestão de Inteligência Hortolândia</p>
              </div>
            </div>
            <button onClick={() => setChatHistory([])} className="p-3 hover:bg-white/5 rounded-xl text-slate-500"><RefreshCw className="w-5 h-5" /></button>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-in slide-in-from-bottom-2`}>
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-800 border border-white/10'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-blue-400" />}
                </div>
                <div className={`max-w-[85%] p-6 rounded-[2rem] text-[13px] leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-white/5 rounded-tl-none shadow-inner'}`}>
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                </div>
              </div>
            ))}
            {loading && <div className="flex gap-4 animate-pulse"><div className="w-10 h-10 bg-slate-800 rounded-xl" /><div className="bg-slate-800 h-12 w-24 rounded-[2rem]" /></div>}
            {error && <div className="p-4 bg-red-500/10 text-red-400 rounded-2xl text-center text-[10px] uppercase font-black">{error}</div>}
          </div>

          <form onSubmit={handleSendMessage} className="p-8 bg-slate-800/50 border-t border-white/10">
            <div className="relative">
              <input type="text" placeholder="Pergunte sobre direitos, bairros ou sugestões do ECA..." className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-8 pr-16 py-5 text-sm text-white outline-none focus:border-blue-500 font-bold" value={userInput} onChange={e => setUserInput(e.target.value)} disabled={loading} />
              <button type="submit" disabled={loading || !userInput.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-4 bg-blue-600 text-white rounded-xl shadow-xl"><Send className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center justify-center gap-2 mt-4 opacity-40">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">SIMCT Diagnóstico em tempo real</p>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AIStatisticsAnalyzer;
