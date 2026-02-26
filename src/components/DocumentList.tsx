
import React, { useState, useMemo } from 'react';
import { Search, Clock, UserCheck, Activity, CheckCircle2, FileText, ChevronDown, UserRound, ShieldAlert, Scale, TriangleAlert, Ban, Filter, RefreshCw, Building2, Baby, Users, MapPin, Fingerprint, LayoutGrid, Eye, Bookmark, Zap, ShieldCheck, FileCheck2, Tag, Database } from 'lucide-react';
import { Documento, User as UserType, DocumentStatus } from '../types';
import { STATUS_LABELS, INITIAL_USERS, BAIRROS } from '../constants';

const getStatusStyle = (status: DocumentStatus, isImprocedente?: boolean, validationState?: 'PENDING_SELF' | 'PENDING_OTHERS' | 'COMPLETED' | 'ADMIN_CONCLUDED') => {
  if (isImprocedente) return { color: 'bg-slate-400', border: 'border-l-slate-400', icon: <Ban className="w-4 h-4" /> };
  
  if (validationState === 'ADMIN_CONCLUDED') {
    return { color: 'bg-blue-600', border: 'border-l-blue-600', icon: <FileCheck2 className="w-4 h-4" /> };
  }

  if (validationState === 'PENDING_SELF') {
    return { color: 'bg-red-600', border: 'border-l-red-600', icon: <ShieldAlert className="w-4 h-4" /> };
  }
  if (validationState === 'PENDING_OTHERS') {
    return { color: 'bg-amber-500', border: 'border-l-amber-500', icon: <Clock className="w-4 h-4" /> };
  }
  if (validationState === 'COMPLETED' || status === 'MEDIDA_APLICADA') {
    return { color: 'bg-emerald-600', border: 'border-l-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> };
  }

  switch (status) {
    case 'NAO_LIDO': return { color: 'bg-[#2563EB]', border: 'border-l-[#2563EB]', icon: <Activity className="w-4 h-4" /> };
    case 'EM_PREENCHIMENTO': return { color: 'bg-slate-400', border: 'border-l-slate-400', icon: <FileText className="w-4 h-4" /> };
    default: return { color: 'bg-[#9CA3AF]', border: 'border-l-[#9CA3AF]', icon: <Clock className="w-4 h-4" /> };
  }
};

interface DocumentListProps {
  documents: Documento[];
  currentUser: UserType;
  onSelectDoc: (id: string) => void;
  onEditDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onScience: (id: string) => void;
  onUpdateStatus: (id: string, status: DocumentStatus[]) => void;
  isReadOnly?: boolean;
  isMyReferenceView?: boolean;
}

const DocumentList: React.FC<DocumentListProps> = ({ documents, currentUser, onSelectDoc, onEditDoc, isReadOnly, isMyReferenceView }) => {
  const [myViewMode, setMyViewMode] = useState<'ALL' | 'REF' | 'IMED'>(isMyReferenceView ? 'REF' : 'ALL');
  const initialFilters = { term: '', bairro: '', status: '', conselheiro_ref_id: '' };
  const [filters, setFilters] = useState(initialFilters);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // Regra: Se for modo "Minha Referência", filtra. Se for "Painel Geral", vê tudo.
      if (myViewMode === 'REF' && doc.conselheiro_referencia_id !== currentUser.id) return false;
      if (myViewMode === 'IMED' && doc.conselheiro_providencia_id !== currentUser.id) return false;

      const matchTerm = !filters.term || 
        doc.crianca_nome.toUpperCase().includes(filters.term.toUpperCase()) || 
        doc.id.includes(filters.term) ||
        (doc.despacho_situacao && doc.despacho_situacao.toUpperCase().includes(filters.term.toUpperCase()));
      
      const matchBairro = !filters.bairro || doc.bairro === filters.bairro;
      const matchStatus = !filters.status || doc.status.includes(filters.status as DocumentStatus);
      const matchRef = !filters.conselheiro_ref_id || doc.conselheiro_referencia_id === filters.conselheiro_ref_id;
      
      return matchTerm && matchBairro && matchStatus && matchRef;
    });
  }, [documents, filters, myViewMode, currentUser]);

  const clearFilters = () => setFilters(initialFilters);

  return (
    <div className="space-y-6">
      {/* PAINEL DE BUSCA E FILTRO UNIFICADO */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-[#E5E7EB] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-blue-600" />
              <h3 className="text-[14px] font-black uppercase text-slate-800 tracking-widest">Painel de Busca SICT</h3>
           </div>
           <button onClick={clearFilters} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> Resetar Busca
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="NOME, PROTOCOLO OU CÓDIGO DO COMUNICADO..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] uppercase focus:border-blue-500" value={filters.term} onChange={(e) => setFilters({...filters, term: e.target.value})} />
          </div>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.bairro} onChange={(e) => setFilters({...filters, bairro: e.target.value})}>
            <option value="">Qualquer Bairro</option>
            {BAIRROS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="">Qualquer Status</option>
            {Object.entries(STATUS_LABELS).sort((a,b) => a[1].localeCompare(b[1])).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
          </select>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.conselheiro_ref_id} onChange={(e) => setFilters({...filters, conselheiro_ref_id: e.target.value})}>
            <option value="">Qualquer Conselheiro</option>
            {INITIAL_USERS.filter(u => u.perfil === 'CONSELHEIRO').map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl w-full max-w-lg mt-4 border border-slate-200">
           <button onClick={() => setMyViewMode('ALL')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'ALL' ? 'bg-[#111827] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Visão Geral (Todos)</button>
           <button onClick={() => setMyViewMode('REF')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'REF' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Titularidade</button>
           <button onClick={() => setMyViewMode('IMED')} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'IMED' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Imediata</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.map(doc => {
          const mainStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
          const refCouncilor = INITIAL_USERS.find(u => u.id === doc.conselheiro_referencia_id);
          const provCouncilor = INITIAL_USERS.find(u => u.id === doc.conselheiro_providencia_id);
          const confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
          const iValidated = confirmacoes.some(c => c.usuario_id === currentUser.id);
          const isInTrio = doc.conselheiros_providencia_nomes?.includes(currentUser.nome.toUpperCase());

          let validationState: 'PENDING_SELF' | 'PENDING_OTHERS' | 'COMPLETED' | 'ADMIN_CONCLUDED' | undefined;
          let dynamicLabel = STATUS_LABELS[mainStatus];

          const isAdminDespacho = [
            'ARQUIVADO', 'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
            'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
            'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
            'NOTIFICACAO_LEANDRO', 'NOTIFICACAO_LUIZA', 'NOTIFICACAO_MILENA', 
            'NOTIFICACAO_MIRIAN', 'NOTIFICACAO_SANDRA', 'NOTIFICACAO_ROSILDA'
          ].includes(mainStatus);
          
          if (isAdminDespacho) {
            validationState = 'ADMIN_CONCLUDED';
            dynamicLabel = `✅ DESPACHO: ${STATUS_LABELS[mainStatus]}`;
          } else if (doc.status.includes('MEDIDA_APLICADA')) {
            validationState = 'COMPLETED';
            dynamicLabel = "✅ MEDIDA APLICADA";
          } else if (doc.status.includes('AGUARDANDO_VALIDACAO')) {
            if (!iValidated && isInTrio) {
              validationState = 'PENDING_SELF';
              dynamicLabel = "📋 AGUARDANDO VALIDAÇÃO DO COLEGIADO";
            } else {
              validationState = 'PENDING_OTHERS';
              dynamicLabel = "📋 AGUARDANDO VALIDAÇÃO DO COLEGIADO";
            }
          }

          const isAwaiting = doc.status.includes('AGUARDANDO_VALIDACAO') && !doc.status.includes('MEDIDA_APLICADA');
          const isOficializado = doc.status.includes('MEDIDA_APLICADA');
          const lastDispatch = [...doc.status].reverse().find(s => [
            'ARQUIVADO', 'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
            'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
            'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
            'NOTIFICACAO_LEANDRO', 'NOTIFICACAO_LUIZA', 'NOTIFICACAO_MILENA', 
            'NOTIFICACAO_MIRIAN', 'NOTIFICACAO_SANDRA', 'NOTIFICACAO_ROSILDA'
          ].includes(s));

          const style = getStatusStyle(mainStatus, doc.is_improcedente, validationState);

          return (
            <div key={doc.id} onClick={() => onSelectDoc(doc.id)} className={`bg-white rounded-2xl border border-[#E5E7EB] ${style.border} border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden`}>
               <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 space-y-4">
                     <div className="flex flex-wrap items-center gap-2">
                        {isOficializado && (
                           <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                              <CheckCircle2 className="w-3 h-3" /> Medida Aplicada
                           </span>
                        )}
                        {isAwaiting && (
                           <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest ${(!iValidated && isInTrio) ? 'bg-red-600 animate-pulse' : 'bg-red-500'}`}>
                              <ShieldAlert className="w-3 h-3" /> Aguardando Validação do Colegiado
                           </span>
                        )}
                        {lastDispatch && (
                           <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest shadow-sm ${lastDispatch === 'DIREITO_NAO_VIOLADO' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
                              <Tag className="w-3 h-3" /> DESPACHO: {STATUS_LABELS[lastDispatch]}
                           </span>
                        )}
                        {!isOficializado && !isAwaiting && !lastDispatch && (
                           <span className={`flex items-center gap-2 px-3 py-1 rounded-lg text-white text-[10px] font-black uppercase tracking-widest ${style.color}`}>
                              {style.icon} {dynamicLabel}
                           </span>
                        )}
                        <span className="text-[11px] font-mono font-bold text-slate-300 uppercase">#{doc.id}</span>
                     </div>
                     <div>
                        <h3 className="text-[17px] font-black text-[#111827] uppercase group-hover:text-[#2563EB] transition-colors">{doc.crianca_nome || 'PRONTUÁRIO INCOMPLETO'}</h3>
                        <div className="flex flex-wrap items-center gap-x-6 mt-2">
                           <div className="flex items-center gap-2 text-[11px] text-[#4B5563] font-bold uppercase"><UserRound className="w-3.5 h-3.5" /> MÃE: {doc.genitora_nome}</div>
                           <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold uppercase"><MapPin className="w-3.5 h-3.5" /> {doc.bairro}</div>
                        </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-black text-[#2563EB] uppercase"><UserCheck className="w-3 h-3" /> Titular: {refCouncilor?.nome || 'N/A'}</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase"><ShieldCheck className="w-3 h-3" /> Imediata: {provCouncilor?.nome || 'N/A'}</div>
                     </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                     {!isReadOnly && <button onClick={(e) => { e.stopPropagation(); onEditDoc(doc.id); }} className="p-3 bg-white border border-[#E5E7EB] text-[#4B5563] rounded-xl hover:bg-[#111827] hover:text-white transition-all"><FileText className="w-4 h-4" /></button>}
                     <button className="p-3 bg-[#111827] text-white rounded-xl shadow-lg hover:bg-[#2563EB] transition-all"><Eye className="w-4 h-4" /></button>
                  </div>
               </div>
            </div>
          );
        })}
        {filteredDocs.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border-4 border-dashed border-slate-100 flex flex-col items-center gap-4">
             <Database className="w-12 h-12 text-slate-200" />
             <p className="text-[14px] font-black text-slate-300 uppercase tracking-widest">Nenhum registro localizado no Painel Geral.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;
