
import React from 'react';
import { X, History, Baby, Users, Calendar, FileText, Scale, ShieldCheck, Zap, Info, ShieldAlert } from 'lucide-react';
import { Documento, User } from '../types';
import { INITIAL_USERS } from '../constants';

interface FamilyHistoryModalProps {
  history: Documento[];
  currentUser: User;
  onClose: () => void;
}

const FamilyHistoryModal: React.FC<FamilyHistoryModalProps> = ({ history, currentUser, onClose }) => {
  const isAdministrative = currentUser.perfil === 'ADMINISTRATIVO';
  
  // Ordenar histórico pelo mais recente
  const sortedHistory = [...history].sort((a, b) => new Date(b.data_recebimento).getTime() - new Date(a.data_recebimento).getTime());

  // Dados consolidados
  const totalAtendimentos = history.length;
  const firstDate = new Date(Math.min(...history.map(d => new Date(d.data_recebimento).getTime())));
  const lastDate = new Date(Math.max(...history.map(d => new Date(d.data_recebimento).getTime())));
  
  const uniqueChildren = new Set();
  history.forEach(d => d.criancas.forEach(c => uniqueChildren.add(c.cpf || c.nome.toUpperCase())));

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#E5E7EB] animate-in zoom-in-95">
        <header className="p-8 bg-[#111827] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#2563EB] rounded-2xl shadow-lg">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold uppercase tracking-tight">Histórico do Núcleo Familiar</h3>
              <p className="text-[11px] font-medium opacity-60 uppercase tracking-widest mt-0.5">Consulta de Inteligência Institucional (Art. 100 ECA)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"><X className="w-6 h-6" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* VISÃO CONSOLIDADA */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-[#2563EB] uppercase mb-1 tracking-widest">Total Atendimentos</span>
              <span className="text-[28px] font-black text-[#111827]">{totalAtendimentos}</span>
            </div>
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Período de Atuação</span>
              <span className="text-[14px] font-bold text-[#111827] uppercase">{firstDate.getFullYear()} a {lastDate.getFullYear()}</span>
            </div>
            <div className="p-6 bg-purple-50 border border-purple-100 rounded-2xl flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-purple-600 uppercase mb-1 tracking-widest">Filhos no Sistema</span>
              <span className="text-[28px] font-black text-[#111827]">{uniqueChildren.size}</span>
            </div>
          </section>

          {isAdministrative && (
             <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-[12px] text-amber-900 font-bold uppercase leading-relaxed">
                   Acesso Restrito: Por questões de sigilo profissional (LGPD), seu perfil permite apenas a visualização quantitativa. O detalhamento técnico das violações é reservado aos Conselheiros Tutelares.
                </p>
             </div>
          )}

          {/* LISTA DE REGISTROS */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-black text-[#111827] uppercase tracking-[0.2em] border-b pb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" /> Cronologia de Procedimentos
            </h4>
            
            <div className="space-y-4">
              {sortedHistory.map((doc) => {
                const ref = INITIAL_USERS.find(u => u.id === doc.conselheiro_referencia_id);
                const prov = INITIAL_USERS.find(u => u.id === doc.conselheiro_providencia_id);

                return (
                  <div key={doc.id} className="p-6 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-slate-100 text-[#111827] text-[10px] font-black rounded-lg uppercase tracking-widest">
                            {new Date(doc.data_recebimento).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-300">#{doc.id}</span>
                        </div>
                        <h5 className="text-[15px] font-bold text-[#111827] uppercase">{doc.crianca_nome}</h5>
                        
                        {!isAdministrative && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Violações</span>
                                <div className="flex flex-wrap gap-1">
                                   {doc.violacoesSipia?.map((v, idx) => (
                                     <span key={idx} className="px-2 py-0.5 bg-red-50 text-red-700 text-[9px] font-bold rounded uppercase border border-red-100">{v.especifico}</span>
                                   ))}
                                   {(!doc.violacoesSipia || doc.violacoesSipia.length === 0) && <span className="text-[9px] text-slate-300 italic">SEM DADO TÉCNICO</span>}
                                </div>
                             </div>
                             <div className="space-y-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agentes</span>
                                <div className="flex flex-wrap gap-1">
                                   {doc.agentesVioladores?.map((a, idx) => (
                                     <span key={idx} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded uppercase border border-amber-100">{a.principal}</span>
                                   ))}
                                   {(!doc.agentesVioladores || doc.agentesVioladores.length === 0) && <span className="text-[9px] text-slate-300 italic">NÃO DEFINIDO</span>}
                                </div>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="md:w-64 space-y-3 md:text-right flex flex-col md:items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-4">
                         <div className="flex flex-col md:items-end">
                            <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest">Titular</span>
                            <span className="text-[11px] font-bold text-[#111827] uppercase">{ref?.nome || 'N/A'}</span>
                         </div>
                         <div className="flex flex-col md:items-end">
                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Providência</span>
                            <span className="text-[11px] font-bold text-[#111827] uppercase">{prov?.nome || 'N/A'}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <footer className="p-8 bg-slate-50 border-t border-[#E5E7EB] shrink-0 text-center">
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">SIMCT Hortolândia - Proteção de Dados e Continuidade Técnica</p>
        </footer>
      </div>
    </div>
  );
};

export default FamilyHistoryModal;
