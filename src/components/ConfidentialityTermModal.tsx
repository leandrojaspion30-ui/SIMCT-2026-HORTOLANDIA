
import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, Lock, FileText, AlertTriangle, ShieldCheck, ChevronDown } from 'lucide-react';

interface ConfidentialityTermModalProps {
  userName: string;
  onAccept: (version: string) => void;
}

const CURRENT_TERM_VERSION = "2026.1-ECA-LGPD";

const ConfidentialityTermModal: React.FC<ConfidentialityTermModalProps> = ({ userName, onAccept }) => {
  const [hasReadToBottom, setHasReadToBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Tolerância de 5px para garantir que funcione em diferentes zooms
      if (scrollTop + clientHeight >= scrollHeight - 5) {
        setHasReadToBottom(true);
      }
    }
  };

  useEffect(() => {
    // Verificar se o conteúdo cabe na tela sem scroll
    if (contentRef.current) {
      const { scrollHeight, clientHeight } = contentRef.current;
      if (scrollHeight <= clientHeight) {
        setHasReadToBottom(true);
      }
    }
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto">
      <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">
        
        {/* Header Jurídico-Institucional */}
        <header className="p-8 bg-[#111827] text-white shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-900/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-[20px] font-black uppercase tracking-tight leading-none">Termo de Proteção e Sigilo</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conformidade LGPD (Lei 13.709/18) e ECA (Lei 8.069/90)</p>
            </div>
          </div>
        </header>

        {/* Conteúdo do Termo com Scroll Controlado */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-10 space-y-6 text-slate-700 leading-relaxed scroll-smooth"
        >
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4 mb-8">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
            <p className="text-[13px] font-bold text-amber-800 leading-tight uppercase">
              Atenção: Você irá manusear DADOS PESSOAIS SENSÍVEIS de crianças e adolescentes. A proteção é integral e prioritária.
            </p>
          </div>

          <div className="space-y-4 text-[14px]">
            <p className="font-bold text-slate-900">Prezado(a) <span className="text-blue-600">{userName}</span>,</p>
            
            <p>Ao acessar o <strong>Sistema Integrado de Conselhos Tutelares (SIMCT)</strong>, você declara ciência e compromisso irrevogável com as seguintes normas de segurança e sigilo:</p>

            <section className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">01</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1">Finalidade Estrita</h4>
                  <p>Utilizar os dados exclusivamente para o exercício das atribuições legais do Conselho Tutelar, sendo vedado o uso para fins pessoais ou estranhos ao interesse público.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">02</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1">Sigilo Absoluto</h4>
                  <p>Manter sigilo total sobre fatos, depoimentos e informações sensíveis. Esta obrigação de sigilo perdura mesmo após o término de seu mandato ou vínculo institucional.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">03</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1">Responsabilidade pela Credencial</h4>
                  <p>Não compartilhar sua senha e login sob qualquer pretexto. Você é o único responsável por qualquer acesso ou registro realizado sob sua credencial no sistema.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">04</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1">Vedação de Captura de Dados</h4>
                  <p>É expressamente proibido fotografar telas, gravar áudios ou realizar capturas de tela (screenshots) dos dados de vulneráveis sem ordem judicial fundamentada.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-none w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">05</div>
                <div>
                  <h4 className="font-black text-slate-900 uppercase text-[11px] mb-1">Auditagem e Monitoramento</h4>
                  <p>O sistema monitora e registra data, hora, IP, localização e o <strong>exato dado acessado</strong>. Tais registros servem como prova em auditorias e processos administrativo-judiciais.</p>
                </div>
              </div>
            </section>

            <div className="pt-6 border-t border-slate-100">
              <h4 className="font-black text-red-600 uppercase text-[12px] mb-2 tracking-tight">Responsabilidade Legal:</h4>
              <p className="text-[12px] text-slate-500 italic">
                O descumprimento destas normas sujeita o infrator a multas previstas na LGPD, responsabilização por Crime de Quebra de Sigilo Funcional (Art. 325 CP), Improbidade Administrativa e sanções criminais previstas no Estatuto da Criança e do Adolescente (Art. 232).
              </p>
            </div>
          </div>
          
          {!hasReadToBottom && (
            <div className="flex items-center justify-center gap-2 py-4 animate-bounce text-blue-600 font-bold text-[10px] uppercase">
              <ChevronDown className="w-4 h-4" /> Role para ler até o fim e habilitar o aceite
            </div>
          )}
        </div>

        {/* Footer com Aceite */}
        <footer className="p-8 bg-slate-50 border-t border-slate-100 shrink-0 rounded-b-[3rem]">
          <div className="flex flex-col gap-6">
            <label className={`flex items-start gap-4 p-5 rounded-2xl border-2 transition-all cursor-pointer ${
              isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'
            } ${!hasReadToBottom ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <div className="relative flex items-center">
                <input 
                  type="checkbox" 
                  disabled={!hasReadToBottom}
                  className="sr-only peer"
                  checked={isChecked}
                  onChange={(e) => setIsChecked(e.target.checked)}
                />
                <div className="w-6 h-6 border-2 border-slate-300 rounded-lg peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                  {isChecked && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
              </div>
              <span className="text-[12px] font-bold text-slate-600 leading-snug">
                Declaro que li e concordo integralmente com este Termo de Proteção e Sigilo, estando ciente das obrigações legais e das penalidades decorrentes do uso indevido das informações.
              </span>
            </label>

            <button
              disabled={!isChecked || !hasReadToBottom}
              onClick={() => onAccept(CURRENT_TERM_VERSION)}
              className="w-full py-5 bg-[#111827] text-white rounded-[1.5rem] font-black uppercase text-[13px] tracking-widest shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
            >
              <ShieldCheck className="w-6 h-6" /> Confirmar Meu Compromisso de Sigilo
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ConfidentialityTermModal;
