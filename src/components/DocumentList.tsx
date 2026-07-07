
import React, { useState, useMemo } from 'react';
import { Search, Clock, UserCheck, Activity, CheckCircle2, FileText, ChevronDown, UserRound, ShieldAlert, Scale, TriangleAlert, Ban, Filter, RefreshCw, Building2, Baby, Users, MapPin, Fingerprint, LayoutGrid, Eye, Bookmark, Zap, ShieldCheck, FileCheck2, Tag, Database, Trash2, Timer, Calendar } from 'lucide-react';
import { Documento, User as UserType, DocumentStatus } from '../types';
import { STATUS_LABELS, INITIAL_USERS, BAIRROS, getBairrosByUnidade } from '../constants';
import { formatLocalDateString, parseLocalDate, formatCadastroDateTime } from '../lib/dateUtils';

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
  users: UserType[];
  currentUser: UserType;
  onSelectDoc: (id: string) => void;
  onEditDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onScience: (id: string) => void;
  onUpdateStatus: (id: string, status: DocumentStatus[]) => void;
  isReadOnly?: boolean;
  isMyReferenceView?: boolean;
  viewMode?: 'ALL' | 'REF' | 'IMED' | 'VALID';
  onViewModeChange?: (mode: 'ALL' | 'REF' | 'IMED' | 'VALID') => void;
  filters?: { term: string; bairro: string; status: string; conselheiro_ref_id: string; data_registro: string };
  onFiltersChange?: (filters: { term: string; bairro: string; status: string; conselheiro_ref_id: string; data_registro: string }) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  users, 
  currentUser, 
  onSelectDoc, 
  onEditDoc, 
  onDeleteDoc, 
  isReadOnly, 
  isMyReferenceView,
  viewMode: propViewMode,
  onViewModeChange,
  filters: propFilters,
  onFiltersChange
}) => {
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  
  const [localViewMode, setLocalViewMode] = useState<'ALL' | 'REF' | 'IMED' | 'VALID'>(isMyReferenceView ? 'REF' : 'ALL');
  const myViewMode = propViewMode !== undefined ? propViewMode : localViewMode;
  const setMyViewMode = (mode: 'ALL' | 'REF' | 'IMED' | 'VALID') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setLocalViewMode(mode);
    }
  };

  const initialFilters = { term: '', bairro: '', status: '', conselheiro_ref_id: '', data_registro: '' };
  const [localFilters, setLocalFilters] = useState(initialFilters);
  const filters = propFilters !== undefined ? propFilters : localFilters;
  const setFilters = (newFilters: typeof initialFilters) => {
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    } else {
      setLocalFilters(newFilters);
    }
  };

  const filteredDocs = useMemo(() => {
    return documents
      .filter(doc => {
        // Regra: Se for modo "Minha Referência", filtra. Se for "Painel Geral", vê tudo.
        const matchesUserOrSubstitutedId = (id: string | undefined | null) => {
          if (!id) return false;
          if (id === currentUser.id) return true;
          if (currentUser.is_suplente_active && id === currentUser.real_user_id) return true;
          return false;
        };

        const matchesUserOrSubstitutedName = (name: string | undefined | null) => {
          if (!name) return false;
          const upper = name.toUpperCase();
          if (upper === currentUser.nome.toUpperCase()) return true;
          if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
          return false;
        };

        if (myViewMode === 'REF' && !matchesUserOrSubstitutedId(doc.conselheiro_referencia_id)) return false;
        if (myViewMode === 'IMED' && !matchesUserOrSubstitutedId(doc.conselheiro_providencia_id)) return false;
        if (myViewMode === 'VALID') {
          const isRef = matchesUserOrSubstitutedId(doc.conselheiro_referencia_id);
          const isInTrio = doc.conselheiros_providencia_nomes?.some(name => matchesUserOrSubstitutedName(name));
          const isPending = doc.status.includes('AGUARDANDO_VALIDACAO');
          if (!isPending || (!isRef && !isInTrio)) return false;
        }

        const termUpper = filters.term.trim().toUpperCase();
        const cleanTermOnlyDigits = termUpper.replace(/\D/g, '');
        const matchCpfInTerm = cleanTermOnlyDigits && (
          (doc.cpf_genitora?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits) ||
          (doc.cpf_crianca?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits) ||
          doc.criancas?.some(c => (c.cpf?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits))
        );

        const checkInText = (text: string | undefined | null) => {
          return text ? text.toUpperCase().includes(termUpper) : false;
        };

        const matchTerm = !termUpper || 
          checkInText(doc.id) ||
          checkInText(doc.crianca_nome) ||
          checkInText(doc.genitora_nome) ||
          checkInText(doc.origem) ||
          checkInText(doc.canal_comunicado) ||
          checkInText(doc.notificacao) ||
          checkInText(doc.bairro) ||
          checkInText(doc.endereco) ||
          checkInText(doc.telefone) ||
          checkInText(doc.informacoes_documento) ||
          checkInText(doc.observacoes_iniciais) ||
          checkInText(doc.relato_providencias) ||
          checkInText(doc.fundamentacao_tecnica) ||
          checkInText(doc.despacho_situacao) ||
          checkInText(doc.observacao_monitoramento) ||
          checkInText(doc.conselheiro_referencia_nome) ||
          checkInText(doc.conselheiro_providencia_nome) ||
          checkInText(doc.numero_comunicado_violacao) ||
          checkInText(doc.numero_sipia) ||
          checkInText(doc.providencia_imediata_manual) ||
          checkInText(doc.justificativa_improcedencia) ||
          checkInText(doc.justificativa_distribuicao) ||
          doc.conselheiros_providencia_nomes?.some(name => checkInText(name)) ||
          doc.criancas?.some(c => checkInText(c.nome) || checkInText(c.cpf) || checkInText(c.genero_identidade) || checkInText(c.data_nascimento)) ||
          doc.violacoesSipia?.some(v => checkInText(v.fundamental) || checkInText(v.grupo) || checkInText(v.especifico)) ||
          doc.agentesVioladores?.some(a => checkInText(a.principal) || checkInText(a.categoria)) ||
          doc.medidas_detalhadas?.some(m => checkInText(m.texto) || checkInText(m.artigo_inciso)) ||
          doc.atribuicoes_136_detalhadas?.some(at => checkInText(at.inciso) || checkInText(at.texto) || at.servicos?.some(s => checkInText(s.area) || checkInText(s.servico) || checkInText(s.servico_custom) || checkInText(s.observacao))) ||
          !!matchCpfInTerm;
        
        const matchBairro = !filters.bairro || doc.bairro === filters.bairro;
        const matchStatus = !filters.status || doc.status.includes(filters.status as DocumentStatus);
        const matchRef = !filters.conselheiro_ref_id || doc.conselheiro_referencia_id === filters.conselheiro_ref_id;
        const matchDate = !filters.data_registro || (() => {
          if (!filters.data_registro) return true;
          
          const normalizeToYYYYMMDD = (dateStr: string | undefined | null): string => {
            if (!dateStr) return '';
            const dateOnly = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
            const parts = dateOnly.split(/[-/]/);
            if (parts.length === 3) {
              if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
              } else {
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              }
            }
            return '';
          };

          const filterNorm = normalizeToYYYYMMDD(filters.data_registro);
          if (!filterNorm) return true;
          
          const aporteNorm = normalizeToYYYYMMDD(doc.data_aporte);
          if (aporteNorm === filterNorm) return true;
          
          if (doc.criado_em) {
            const criadoNorm = normalizeToYYYYMMDD(doc.criado_em);
            if (criadoNorm === filterNorm) return true;
            
            try {
              const dObj = new Date(doc.criado_em);
              const year = dObj.getFullYear();
              const month = String(dObj.getMonth() + 1).padStart(2, '0');
              const day = String(dObj.getDate()).padStart(2, '0');
              const localCreatedNorm = `${year}-${month}-${day}`;
              if (localCreatedNorm === filterNorm) return true;
            } catch (e) {}
          }
          
          return false;
        })();
        
        return matchTerm && matchBairro && matchStatus && matchRef && matchDate;
      })
      .sort((a, b) => {
        const aTime = a.criado_em ? new Date(a.criado_em).getTime() : 0;
        const bTime = b.criado_em ? new Date(b.criado_em).getTime() : 0;
        if (aTime !== bTime) {
          return aTime - bTime; // Oldest first
        }
        if (a.data_aporte !== b.data_aporte) {
          return a.data_aporte.localeCompare(b.data_aporte);
        }
        return a.hora_aporte.localeCompare(b.hora_aporte);
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
              <h3 className="text-[14px] font-black uppercase text-slate-800 tracking-widest">Painel de Busca SIMCT</h3>
           </div>
           <button onClick={clearFilters} className="text-[10px] font-black uppercase text-red-500 hover:text-red-700 flex items-center gap-2">
              <RefreshCw className="w-3 h-3" /> Resetar Busca
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="NOME, PROTOCOLO OU CÓDIGO DO COMUNICADO..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] uppercase focus:border-blue-500" value={filters.term} onChange={(e) => setFilters({...filters, term: e.target.value})} />
          </div>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.bairro} onChange={(e) => setFilters({...filters, bairro: e.target.value})}>
            <option value="">Qualquer Bairro</option>
            {getBairrosByUnidade(currentUser.unidade_id).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="">Qualquer Status</option>
            {Object.entries(STATUS_LABELS).sort((a,b) => a[1].localeCompare(b[1])).map(([val, lab]) => <option key={val} value={val}>{lab}</option>)}
          </select>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.conselheiro_ref_id} onChange={(e) => setFilters({...filters, conselheiro_ref_id: e.target.value})}>
            <option value="">Qualquer Conselheiro</option>
            {users.filter(u => u.status !== 'EXCLUIDO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && u.unidade_id === currentUser.unidade_id).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="date" 
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] uppercase focus:border-blue-500 text-slate-700" 
              value={filters.data_registro} 
              onChange={(e) => setFilters({...filters, data_registro: e.target.value})} 
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl w-full max-w-4xl mt-4 border border-slate-200">
           <button onClick={() => setMyViewMode('ALL')} className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'ALL' ? 'bg-[#111827] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Visão Geral</button>
           <button onClick={() => setMyViewMode('REF')} className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'REF' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Titularidade</button>
           <button onClick={() => setMyViewMode('IMED')} className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'IMED' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Imediata</button>
           <button onClick={() => setMyViewMode('VALID')} className={`flex-1 min-w-[120px] py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'VALID' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Validação Colegiado</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredDocs.map(doc => {
          const mainStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
          const refCouncilor = users.find(u => u.id === doc.conselheiro_referencia_id);
          const provCouncilor = users.find(u => u.id === doc.conselheiro_providencia_id);
          const confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
          const iValidated = confirmacoes.some(c => c.usuario_id === currentUser.id);
          const isInTrio = doc.conselheiros_providencia_nomes?.includes(currentUser.nome.toUpperCase());

          let validationState: 'PENDING_SELF' | 'PENDING_OTHERS' | 'COMPLETED' | 'ADMIN_CONCLUDED' | undefined;
          let dynamicLabel = STATUS_LABELS[mainStatus];

          const isAdminDespacho = [
            'ARQUIVADO', 'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
            'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
            'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
            'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE'
          ].includes(mainStatus) || mainStatus.startsWith('NOTIFICACAO_');
          
          if (isAdminDespacho) {
            validationState = 'ADMIN_CONCLUDED';
            dynamicLabel = `✅ DESPACHO: ${STATUS_LABELS[mainStatus] || mainStatus}`;
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
            'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE',
            'NENHUMA', 'AGUARDANDO_AVALIACAO'
          ].includes(s) || s.startsWith('NOTIFICACAO_'));

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
                        {(doc.notificacoes_trio || []).includes(currentUser.nome.toUpperCase()) && (!lastDispatch || lastDispatch === 'NENHUMA') && (
                           <span className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest border border-red-200 animate-bounce">
                              <Zap className="w-3 h-3" /> Revalidação Obrigatória
                           </span>
                        )}
                        {lastDispatch && lastDispatch !== 'NENHUMA' && (
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
                        {doc.monitoramento && !doc.monitoramento.concluido && doc.monitoramento.requisicoes?.some(r => {
                           if (r.concluido || (r as any).excluidoDoMonitoramento) return false;
                           const deadline = parseLocalDate(r.dataFinal);
                           deadline.setHours(0,0,0,0);
                           return deadline.getTime() < new Date().setHours(0,0,0,0);
                        }) && (
                           <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase rounded-lg w-fit animate-pulse shadow-sm">
                              <Timer className="w-3.5 h-3.5" /> Atenção: Prazo de Monitoramento Expirado
                           </div>
                        )}
                        <div className="flex flex-wrap items-center gap-x-6 mt-2">
                           <div className="flex items-center gap-2 text-[11px] text-[#4B5563] font-bold uppercase"><UserRound className="w-3.5 h-3.5" /> RESPONSÁVEL: {doc.genitora_nome}</div>
                           <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold uppercase"><MapPin className="w-3.5 h-3.5" /> {doc.bairro}</div>
                        </div>
                     </div>
                     <div className="flex flex-wrap items-center gap-4 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-black text-[#2563EB] uppercase"><UserCheck className="w-3 h-3" /> Titular: {refCouncilor?.nome || 'N/A'}</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase"><ShieldCheck className="w-3 h-3" /> Imediata: {provCouncilor?.nome || 'N/A'}</div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                          <Timer className="w-3 h-3" /> Registro: {(() => { const r = formatCadastroDateTime(doc.criado_em, doc.data_aporte, doc.hora_aporte); return `${r.date} às ${r.time}`; })()}
                        </div>
                     </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-3">
                     {!isReadOnly && <button onClick={(e) => { e.stopPropagation(); onEditDoc(doc.id); }} className="p-3 bg-white border border-[#E5E7EB] text-[#4B5563] rounded-xl hover:bg-[#111827] hover:text-white transition-all"><FileText className="w-4 h-4" /></button>}
                     {(hasCounselorActions => {
                        const isCreatorAdmin = 
                          (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO' || currentUser.nome === 'LEANDRO');
                        
                        return isCreatorAdmin && !hasCounselorActions;
                      })(!!(
                        (doc.ciência_registrada_por && doc.ciência_registrada_por.length > 0) ||
                        doc.medidas_detalhadas?.some(m => m.confirmacoes && m.confirmacoes.length > 0) ||
                        doc.status.some(s => s !== 'AGUARDANDO_ANALISE' && s !== 'EM_PREENCHIMENTO' && !s.startsWith('NOTIFICACAO_')) ||
                        (doc.medidas_detalhadas && doc.medidas_detalhadas.length > 0) ||
                        (doc.relato_providencias && doc.relato_providencias.trim() !== '') ||
                        (doc.fundamentacao_tecnica && doc.fundamentacao_tecnica.trim() !== '') ||
                        (doc.monitoramento?.requisicoes && doc.monitoramento.requisicoes.length > 0) ||
                        (doc.historico_monitoramento && doc.historico_monitoramento.length > 0)
                      )) && (
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setDocToDelete(doc.id);
                          }} 
                          className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                     )}
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

      {docToDelete && (
        <div id="delete-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <TriangleAlert className="w-8 h-8" />
            </div>
            <h3 className="text-[20px] font-black uppercase text-slate-800 text-center tracking-tight mb-2">Excluir Prontuário?</h3>
            <p className="text-[13px] font-medium text-slate-500 text-center mb-6 leading-relaxed">
              Você está prestes a excluir permanentemente o prontuário <span className="font-bold text-slate-900">#{docToDelete}</span>. 
              O sistema reverterá a escala e a distribuição de providência imediata para o estado anterior. Esta ação é <span className="font-bold text-red-600">irreversível</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onDeleteDoc(docToDelete);
                  setDocToDelete(null);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all text-center cursor-pointer"
              >
                Sim, Excluir Agora
              </button>
              <button
                onClick={() => setDocToDelete(null)}
                className="w-full py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList;
