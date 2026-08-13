import React, { useState, useMemo } from 'react';
import { Search, Clock, UserCheck, Activity, CheckCircle2, FileText, ChevronDown, ChevronUp, Folder, FolderOpen, UserRound, ShieldAlert, Scale, TriangleAlert, Ban, Filter, RefreshCw, Building2, Baby, Users, MapPin, Fingerprint, LayoutGrid, Eye, Bookmark, Zap, ShieldCheck, FileCheck2, Tag, Database, Trash2, Timer, Calendar, GraduationCap, Stethoscope, HandHeart, Phone, Mail, Siren, PhoneCall, Bell, BellRing, AlertCircle, Archive } from 'lucide-react';
import { Documento, User as UserType, DocumentStatus, ScaleException } from '../types';
import { STATUS_LABELS, INITIAL_USERS, BAIRROS, getBairrosByUnidade, isSameCounselorName, getEffectiveEscala } from '../constants';
import { formatLocalDateString, parseLocalDate, formatCadastroDateTime } from '../lib/dateUtils';

export const getOrigemIconAndStyle = (origemRaw?: string) => {
  const origem = (origemRaw || '').toUpperCase().trim();
  
  if (origem.includes('FAMÍLIA') || origem.includes('FAMILIA') || origem.includes('MÃE') || origem.includes('PAI') || origem.includes('AVÓ') || origem.includes('AVÔ') || origem.includes('PARENTES') || origem.includes('RESPONSÁVEL') || origem.includes('IRMÃO') || origem.includes('TIA') || origem.includes('TIO') || origem.includes('GENITORA') || origem.includes('MADRASTA') || origem.includes('PADRASTO')) {
    return {
      icon: <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'FAMÍLIA'}`,
      style: 'bg-purple-50 border-purple-200/80 text-purple-900',
      category: 'FAMÍLIA'
    };
  }
  if (origem.includes('EDUCAÇÃO') || origem.includes('EDUCACAO') || origem.includes('EMEF') || origem.includes('EMEI') || origem.includes('E.E.') || origem.includes('ESCOLA') || origem.includes('CRECHE')) {
    return {
      icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'EDUCAÇÃO'}`,
      style: 'bg-cyan-50 border-cyan-200/80 text-cyan-900',
      category: 'EDUCAÇÃO'
    };
  }
  if (origem.includes('SAÚDE') || origem.includes('SAUDE') || origem.includes('UBS') || origem.includes('HOSPITAL') || origem.includes('SAMU') || origem.includes('UPA') || origem.includes('AMBULATÓRIO')) {
    return {
      icon: <Stethoscope className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'SAÚDE'}`,
      style: 'bg-rose-50 border-rose-200/80 text-rose-900',
      category: 'SAÚDE'
    };
  }
  if (origem.includes('ASSISTÊNCIA') || origem.includes('ASSISTENCIA') || origem.includes('CRAS') || origem.includes('CREAS') || origem.includes('POP') || origem.includes('ACOLHIMENTO') || origem.includes('DAS')) {
    return {
      icon: <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'ASSISTÊNCIA SOCIAL'}`,
      style: 'bg-amber-50 border-amber-200/80 text-amber-900',
      category: 'ASSISTÊNCIA SOCIAL'
    };
  }
  if (origem.includes('SEGURANÇA') || origem.includes('SEGURANCA') || origem.includes('POLÍCIA') || origem.includes('POLICIA') || origem.includes('GUARDA') || origem.includes('DDM') || origem.includes('PATRULHA') || origem.includes('BOMBEIROS')) {
    return {
      icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-700 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'SEGURANÇA'}`,
      style: 'bg-slate-100 border-slate-300/80 text-slate-900',
      category: 'SEGURANÇA'
    };
  }
  if (origem.includes('JUDICIÁRIO') || origem.includes('JUDICIARIO') || origem.includes('MP') || origem.includes('PROMOTORIA') || origem.includes('VARA') || origem.includes('JUSTIÇA')) {
    return {
      icon: <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'PODER JUDICIÁRIO'}`,
      style: 'bg-indigo-50 border-indigo-200/80 text-indigo-900',
      category: 'JUDICIÁRIO'
    };
  }
  if (origem.includes('DENÚNCIA') || origem.includes('DENUNCIA') || origem.includes('DISQUE') || origem.includes('SIPIA')) {
    return {
      icon: <Siren className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'DENÚNCIA / SIPIA'}`,
      style: 'bg-orange-50 border-orange-200/80 text-orange-900',
      category: 'DENÚNCIA'
    };
  }
  return {
    icon: <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
    label: `ORIGEM: ${origemRaw || 'N/A'}`,
    style: 'bg-slate-50 border-slate-200/80 text-slate-800',
    category: 'OUTROS'
  };
};

export const getCanalIconAndStyle = (canalRaw?: string) => {
  const canal = (canalRaw || '').toUpperCase().trim();
  if (canal.includes('PRESENCIAL')) {
    return {
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-emerald-50 border-emerald-200/80 text-emerald-900'
    };
  }
  if (canal.includes('TELEFÔNICO') || canal.includes('TELEFONICO') || canal.includes('TELEFONE') || canal.includes('PLANTÃO') || canal.includes('PLANTAO') || canal.includes('LIGAÇÃO')) {
    return {
      icon: <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-sky-50 border-sky-200/80 text-sky-900'
    };
  }
  if (canal.includes('EMAIL') || canal.includes('E-MAIL')) {
    return {
      icon: <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-purple-50 border-purple-200/80 text-purple-900'
    };
  }
  if (canal.includes('DISQUE 100') || canal.includes('DISQUE')) {
    return {
      icon: <Siren className="w-3.5 h-3.5 text-red-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-red-50 border-red-200/80 text-red-900'
    };
  }
  if (canal.includes('SIPIA')) {
    return {
      icon: <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-teal-50 border-teal-200/80 text-teal-900'
    };
  }
  if (canal.includes('OFÍCIO') || canal.includes('OFICIO') || canal.includes('RELATÓRIO') || canal.includes('RELATORIO')) {
    return {
      icon: <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-amber-50 border-amber-200/80 text-amber-900'
    };
  }
  return {
    icon: <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
    label: `CANAL: ${canalRaw || 'N/A'}`,
    style: 'bg-slate-50 border-slate-200/80 text-slate-800'
  };
};

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
    case 'NOTIFICAR': return { color: 'bg-cyan-600', border: 'border-l-cyan-600', icon: <Tag className="w-4 h-4" /> };
    case 'NOTIFICADO': return { color: 'bg-indigo-600', border: 'border-l-indigo-600', icon: <ShieldCheck className="w-4 h-4" /> };
    case 'AVALIAR_EM_COLEGIADO': return { color: 'bg-amber-600', border: 'border-l-amber-600', icon: <Users className="w-4 h-4" /> };
    case 'SOLICITAR_REUNIAO_REDE':
    case 'SOLICITAR_REUNIAO_DE_REDE': return { color: 'bg-purple-600', border: 'border-l-purple-600', icon: <Building2 className="w-4 h-4" /> };
    case 'RESPONDER_OFICIO_JUDICIARIO_MP': return { color: 'bg-blue-700', border: 'border-l-blue-700', icon: <FileText className="w-4 h-4" /> };
    case 'CONCLUIDO': return { color: 'bg-emerald-600', border: 'border-l-emerald-600', icon: <CheckCircle2 className="w-4 h-4" /> };
    case 'ENCERRADO': return { color: 'bg-slate-700', border: 'border-l-slate-700', icon: <FileCheck2 className="w-4 h-4" /> };
    case 'NAO_LIDO': return { color: 'bg-[#2563EB]', border: 'border-l-[#2563EB]', icon: <Activity className="w-4 h-4" /> };
    case 'EM_PREENCHIMENTO': return { color: 'bg-slate-400', border: 'border-l-slate-400', icon: <FileText className="w-4 h-4" /> };
    default: return { color: 'bg-[#9CA3AF]', border: 'border-l-[#9CA3AF]', icon: <Clock className="w-4 h-4" /> };
  }
};

interface DocumentListProps {
  documents: Documento[];
  users: UserType[];
  currentUser: UserType;
  nameMap?: Record<string, string>;
  scaleExceptions?: ScaleException[];
  onSelectDoc: (id: string) => void;
  onEditDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onScience: (id: string, alertId?: string) => void;
  onUpdateStatus: (id: string, status: DocumentStatus[]) => void;
  onToggleGuardarPasta?: (docIds: string[], guardar: boolean) => void;
  isReadOnly?: boolean;
  isMyReferenceView?: boolean;
  viewMode?: 'ALL' | 'REF' | 'IMED' | 'VALID';
  onViewModeChange?: (mode: 'ALL' | 'REF' | 'IMED' | 'VALID') => void;
  filters?: { term: string; bairro: string; status: string; conselheiro_ref_id: string; data_registro: string; pasta_guardada?: string };
  onFiltersChange?: (filters: { term: string; bairro: string; status: string; conselheiro_ref_id: string; data_registro: string; pasta_guardada?: string }) => void;
  isGroupedByFamily?: boolean;
  onIsGroupedByFamilyChange?: (grouped: boolean) => void;
  expandedFolders?: Record<string, boolean>;
  onExpandedFoldersChange?: (folders: Record<string, boolean>) => void;
  focusedFolderKey?: string | null;
  onFocusedFolderKeyChange?: (key: string | null) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents, 
  users, 
  currentUser, 
  nameMap,
  scaleExceptions,
  onSelectDoc, 
  onEditDoc, 
  onDeleteDoc, 
  onScience = () => {},
  onUpdateStatus,
  onToggleGuardarPasta,
  isReadOnly, 
  isMyReferenceView,
  viewMode: propViewMode,
  onViewModeChange,
  filters: propFilters,
  onFiltersChange,
  isGroupedByFamily: propIsGroupedByFamily,
  onIsGroupedByFamilyChange,
  expandedFolders: propExpandedFolders,
  onExpandedFoldersChange,
  focusedFolderKey: propFocusedFolderKey,
  onFocusedFolderKeyChange
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

  const initialFilters = { term: '', bairro: '', status: '', conselheiro_ref_id: '', data_registro: '', pasta_guardada: 'NAO' };
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
          const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
          if (upper === cleanCurrentUserName) return true;
          if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
          return false;
        };

        if (myViewMode === 'REF' && !matchesUserOrSubstitutedId(doc.conselheiro_referencia_id)) return false;
        if (myViewMode === 'IMED' && !matchesUserOrSubstitutedId(doc.conselheiro_providencia_id)) return false;
        if (myViewMode === 'VALID') {
          const hasEcaMeasures = (doc.medidas_detalhadas || []).some(m => 
            m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
          );
          if (!hasEcaMeasures) return false;

          const isNotified = (doc.notificacoes_trio || []).some(n => 
            isSameCounselorName(n, currentUser.nome) || 
            (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(n, currentUser.substituted_name))
          );

          const trioRaw = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
            ? doc.conselheiros_providencia_nomes
            : getEffectiveEscala(doc.data_aporte, doc.hora_aporte, doc.unidade_id, nameMap, scaleExceptions);

          const inTrio = isNotified || trioRaw.some(name => {
            if (!name) return false;
            if (isSameCounselorName(name, currentUser.nome)) return true;
            if (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)) return true;
            if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') return true;
            return false;
          });

          if (!inTrio) return false;

          const confirmacoes = (doc.medidas_detalhadas || []).flatMap(m => m.confirmacoes || []);
          const iValidated = !isNotified && confirmacoes.some(c => 
            c.usuario_id === currentUser.id || 
            c.usuario_id === currentUser.real_user_id || 
            isSameCounselorName(c.usuario_nome, currentUser.nome)
          );

          if (iValidated) return false;

          const isPending = doc.status.includes('AGUARDANDO_VALIDACAO') || doc.status.includes('MEDIDA_APLICADA') || isNotified;
          if (!isPending) return false;
        }

        const termUpper = filters.term.trim().toUpperCase();
        const cleanTermOnlyDigits = termUpper.replace(/\D/g, '');
        const matchCpfInTerm = cleanTermOnlyDigits && (
          (doc.cpf_genitora?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits) ||
          (doc.cpf_crianca?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits) ||
          (doc.outro_membro_cpf?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits) ||
          doc.criancas?.some(c => (c.cpf?.replace(/\D/g, '') || '').includes(cleanTermOnlyDigits))
        );

        const checkInText = (text: string | undefined | null) => {
          return text ? text.toUpperCase().includes(termUpper) : false;
        };

        const matchTerm = !termUpper || 
          checkInText(doc.id) ||
          checkInText(doc.crianca_nome) ||
          checkInText(doc.genitora_nome) ||
          checkInText(doc.outro_membro_nome) ||
          checkInText(doc.outro_membro_parentesco) ||
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
        const matchStatus = !filters.status || (
          filters.status === 'SOLICITAR_REUNIAO_REDE'
            ? (doc.status.includes('SOLICITAR_REUNIAO_REDE') || doc.status.includes('SOLICITAR_REUNIAO_DE_REDE'))
            : doc.status.includes(filters.status as DocumentStatus)
        );
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

        const filterPasta = filters.pasta_guardada || 'NAO';
        const matchPasta = (() => {
          if (filterPasta === 'SIM') return !!doc.is_pasta_guardada;
          if (filterPasta === 'NAO') return !doc.is_pasta_guardada;
          return true;
        })();
        
        return matchTerm && matchBairro && matchStatus && matchRef && matchDate && matchPasta;
      })
      .sort((a, b) => {
        const aTime = a.criado_em ? new Date(a.criado_em).getTime() : 0;
        const bTime = b.criado_em ? new Date(b.criado_em).getTime() : 0;
        if (aTime !== bTime) {
          return aTime - bTime;
        }
        if (a.data_aporte !== b.data_aporte) {
          return a.data_aporte.localeCompare(b.data_aporte);
        }
        return a.hora_aporte.localeCompare(b.hora_aporte);
      });
  }, [documents, filters, myViewMode, currentUser, nameMap, scaleExceptions]);

  const [localIsGroupedByFamily, setLocalIsGroupedByFamily] = useState(true);
  const isGroupedByFamily = propIsGroupedByFamily !== undefined ? propIsGroupedByFamily : localIsGroupedByFamily;
  const setIsGroupedByFamily = (val: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof val === 'function' ? val(isGroupedByFamily) : val;
    if (onIsGroupedByFamilyChange) onIsGroupedByFamilyChange(nextVal);
    else setLocalIsGroupedByFamily(nextVal);
  };

  const [localExpandedFolders, setLocalExpandedFolders] = useState<Record<string, boolean>>({});
  const expandedFolders = propExpandedFolders !== undefined ? propExpandedFolders : localExpandedFolders;
  const setExpandedFolders = (val: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    const nextVal = typeof val === 'function' ? val(expandedFolders) : val;
    if (onExpandedFoldersChange) onExpandedFoldersChange(nextVal);
    else setLocalExpandedFolders(nextVal);
  };

  const [localFocusedFolderKey, setLocalFocusedFolderKey] = useState<string | null>(null);
  const focusedFolderKey = propFocusedFolderKey !== undefined ? propFocusedFolderKey : localFocusedFolderKey;
  const setFocusedFolderKey = (val: string | null | ((prev: string | null) => string | null)) => {
    const nextVal = typeof val === 'function' ? val(focusedFolderKey) : val;
    if (onFocusedFolderKeyChange) onFocusedFolderKeyChange(nextVal);
    else setLocalFocusedFolderKey(nextVal);
  };

  const toggleFolder = (folderKey: string) => {
    if (focusedFolderKey === folderKey) {
      setFocusedFolderKey(null);
      setExpandedFolders({});
    } else {
      setFocusedFolderKey(folderKey);
      setExpandedFolders({ [folderKey]: true });
    }
  };

  const familyGroups = useMemo(() => {
    const groups: { [key: string]: { key: string; genitora_nome: string; cpf_genitora?: string; docs: Documento[]; bairro: string } } = {};

    filteredDocs.forEach(doc => {
      const rawName = (doc.genitora_nome || '').trim().toUpperCase();
      const cleanCpf = (doc.cpf_genitora || '').replace(/\D/g, '');
      
      let key = '';
      if (cleanCpf) {
        key = `CPF_${cleanCpf}`;
      } else if (rawName && rawName !== 'NÃO INFORMADO' && rawName !== 'NAO INFORMADO' && rawName !== 'NÃO INFORMADA') {
        key = `NOME_${rawName}`;
      } else {
        key = `DOC_${doc.id}`;
      }

      if (!groups[key]) {
        groups[key] = {
          key,
          genitora_nome: rawName || 'RESPONSÁVEL NÃO INFORMADO',
          cpf_genitora: doc.cpf_genitora,
          bairro: doc.bairro,
          docs: []
        };
      }
      groups[key].docs.push(doc);
    });

    return Object.values(groups);
  }, [filteredDocs]);

  const displayedFamilyGroups = useMemo(() => {
    if (focusedFolderKey) {
      const target = familyGroups.filter(g => g.key === focusedFolderKey);
      if (target.length > 0) return target;
    }
    return familyGroups;
  }, [familyGroups, focusedFolderKey]);

  const clearFilters = () => setFilters(initialFilters);

  const renderDocCard = (doc: Documento, isNested: boolean = false) => {
    const mainStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
    const rawRefCouncilor = users.find(u => u.id === doc.conselheiro_referencia_id);
    const rawRefName = rawRefCouncilor?.nome || doc.conselheiro_referencia_nome;
    const mappedRefName = (rawRefName && nameMap && nameMap[rawRefName.toUpperCase()]) ? nameMap[rawRefName.toUpperCase()] : rawRefName;
    const refCouncilor = (mappedRefName && (users.find(u => u.status === 'ATIVO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && isSameCounselorName(u.nome, mappedRefName)) || users.find(u => u.status === 'ATIVO' && isSameCounselorName(u.nome, mappedRefName)))) || rawRefCouncilor;

    const rawProvCouncilor = users.find(u => u.id === doc.conselheiro_providencia_id);
    const rawProvName = rawProvCouncilor?.nome || doc.conselheiro_providencia_nome;
    const mappedProvName = (rawProvName && nameMap && nameMap[rawProvName.toUpperCase()]) ? nameMap[rawProvName.toUpperCase()] : rawProvName;
    const provCouncilor = (mappedProvName && (users.find(u => u.status === 'ATIVO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && isSameCounselorName(u.nome, mappedProvName)) || users.find(u => u.status === 'ATIVO' && isSameCounselorName(u.nome, mappedProvName)))) || rawProvCouncilor;
    const hasEcaMeasures = (doc.medidas_detalhadas || []).some(m => 
      m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
    );

    const confirmacoes = (doc.medidas_detalhadas || []).flatMap(m => m.confirmacoes || []);
    const isNotified = hasEcaMeasures && (doc.notificacoes_trio || []).some(n => 
      isSameCounselorName(n, currentUser.nome) || 
      (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(n, currentUser.substituted_name))
    );
    const trioRaw = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
      ? doc.conselheiros_providencia_nomes
      : getEffectiveEscala(doc.data_aporte, doc.hora_aporte, doc.unidade_id, nameMap, scaleExceptions);

    const isInTrio = isNotified || trioRaw.some(name => {
      if (!name) return false;
      if (isSameCounselorName(name, currentUser.nome)) return true;
      if (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)) return true;
      if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') return true;
      return false;
    });

    const iValidated = !isNotified && confirmacoes.some(c => 
      c.usuario_id === currentUser.id || 
      c.usuario_id === currentUser.real_user_id || 
      isSameCounselorName(c.usuario_nome, currentUser.nome)
    );

    let validationState: 'PENDING_SELF' | 'PENDING_OTHERS' | 'COMPLETED' | 'ADMIN_CONCLUDED' | undefined;
    let dynamicLabel = STATUS_LABELS[mainStatus];

    const isAdminDespacho = [
      'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
      'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
      'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
      'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE',
      'RESPONDER_OFICIO_JUDICIARIO_MP'
    ].includes(mainStatus) || mainStatus.startsWith('NOTIFICACAO_');
    
    if (isAdminDespacho) {
      validationState = 'ADMIN_CONCLUDED';
      dynamicLabel = `✅ DESPACHO: ${STATUS_LABELS[mainStatus] || mainStatus}`;
    } else if (doc.status.includes('MEDIDA_PENDENTE')) {
      validationState = 'COMPLETED';
      dynamicLabel = "📋 MEDIDA PENDENTE";
    } else if (hasEcaMeasures && doc.status.includes('MEDIDA_APLICADA')) {
      if (!iValidated && isInTrio) {
        validationState = 'PENDING_SELF';
        dynamicLabel = "📋 MEDIDA APLICADA - AGUARDANDO VALIDAÇÃO";
      } else {
        validationState = 'COMPLETED';
        dynamicLabel = "✅ MEDIDA APLICADA";
      }
    } else if (hasEcaMeasures && doc.status.includes('AGUARDANDO_VALIDACAO')) {
      if (!iValidated && isInTrio) {
        validationState = 'PENDING_SELF';
        dynamicLabel = "📋 AGUARDANDO VALIDAÇÃO DO COLEGIADO";
      } else {
        validationState = 'PENDING_OTHERS';
        dynamicLabel = "📋 AGUARDANDO VALIDAÇÃO DO COLEGIADO";
      }
    }

    const isAwaiting = hasEcaMeasures && (doc.status.includes('AGUARDANDO_VALIDACAO') || (doc.status.includes('MEDIDA_APLICADA') && !iValidated && isInTrio)) && !doc.status.includes('MEDIDA_PENDENTE');
    const isMedidaAplicadaConcluded = doc.status.includes('MEDIDA_APLICADA') && (iValidated || !isInTrio);
    const lastDispatch = [...doc.status].reverse().find(s => [
      'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
      'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
      'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
      'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE',
      'RESPONDER_OFICIO_JUDICIARIO_MP',
      'NENHUMA', 'AGUARDANDO_AVALIACAO'
    ].includes(s) || s.startsWith('NOTIFICACAO_'));

    const style = getStatusStyle(mainStatus, doc.is_improcedente, validationState);
    const origemInfo = getOrigemIconAndStyle(doc.origem);
    const canalInfo = getCanalIconAndStyle(doc.canal_comunicado);

    const isReferenceCounselor = doc.conselheiro_referencia_id === currentUser.id ||
      (currentUser.is_suplente_active && currentUser.real_user_id && doc.conselheiro_referencia_id === currentUser.real_user_id);

    const isProvUser = doc.conselheiro_providencia_id === currentUser.id ||
      (currentUser.is_suplente_active && currentUser.real_user_id && doc.conselheiro_providencia_id === currentUser.real_user_id) ||
      (doc.conselheiro_providencia_nome && isSameCounselorName(doc.conselheiro_providencia_nome, currentUser.nome));

    const unreadRefAlerts = isReferenceCounselor 
      ? (doc.alertas_status_referencia || []).filter(a => !a.lido)
      : [];

    return (
      <div 
        key={doc.id} 
        onClick={() => onSelectDoc(doc.id)} 
        className={`bg-white rounded-xl border ${doc.is_urgente ? 'border-2 border-rose-500 bg-rose-50/20 shadow-md ring-2 ring-rose-200/60' : `border-slate-200/80 ${style.border}`} border-l-4 shadow-2xs hover:shadow-md transition-all cursor-pointer group p-4 md:p-5 ${isNested ? 'bg-white' : ''}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2.5 flex-1">
            {/* Status Chips Row */}
            <div className="flex flex-wrap items-center gap-2">
              {doc.is_pasta_guardada && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-300 text-amber-900 text-[12px] font-bold shadow-2xs">
                  <Archive className="w-3.5 h-3.5 text-amber-700" /> Pasta Guardada
                </span>
              )}
              {doc.is_urgente && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 text-white text-[12px] font-black uppercase tracking-wider animate-pulse shadow-sm">
                  <AlertCircle className="w-3.5 h-3.5 text-white" /> URGENTE - PROVIDÊNCIA IMEDIATA
                </span>
              )}
              {doc.status.includes('MEDIDA_PENDENTE') && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Medida Pendente
                </span>
              )}
              {isMedidaAplicadaConcluded && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[12px] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Medida Aplicada
                </span>
              )}
              {isAwaiting && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${(!iValidated && isInTrio) ? 'bg-red-50 border border-red-200/80 text-red-700 animate-pulse' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                  <ShieldAlert className="w-3.5 h-3.5" /> Aguardando Validação do Colegiado
                </span>
              )}
              {hasEcaMeasures && (doc.notificacoes_trio || []).some(n => {
                if (!n) return false;
                const upper = n.toUpperCase();
                if (upper === currentUser.nome.toUpperCase()) return true;
                const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
                if (upper === cleanCurrentUserName) return true;
                if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
                return false;
              }) && (!lastDispatch || lastDispatch === 'NENHUMA') && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 border border-red-200/80 text-red-700 text-[12px] font-medium">
                  <Zap className="w-3.5 h-3.5" /> Revalidação Obrigatória
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-medium ${mainStatus === 'DIREITO_NAO_VIOLADO' ? 'bg-emerald-50 border border-emerald-200/80 text-emerald-700' : 'bg-blue-50 border border-blue-200/80 text-blue-700'}`}>
                <Tag className="w-3.5 h-3.5" /> DESPACHO: {(STATUS_LABELS[mainStatus] || mainStatus)}
              </span>

              <span className="text-[12px] font-mono text-slate-400 font-medium">#{doc.id}</span>
            </div>

            {/* ALERTA DE CIÊNCIA AO CONSELHEIRO DE REFERÊNCIA NO CARD */}
            {unreadRefAlerts.length > 0 && (
              <div 
                onClick={(e) => e.stopPropagation()}
                className="w-full p-2.5 bg-amber-50 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 my-2 shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                  <div>
                    <span className="font-bold text-amber-950">Alerta (Conselheiro de Referência):</span>{' '}
                    {unreadRefAlerts.map((a, idx) => (
                      <span key={a.id}>
                        {idx > 0 && ' | '}
                        O conselheiro de providência imediata <strong>{a.alterado_por_nome}</strong> alterou a situação para <strong className="text-amber-950 font-bold">[{STATUS_LABELS[a.status_novo as DocumentStatus] || a.status_novo}]</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    unreadRefAlerts.forEach(a => onScience(doc.id, a.id));
                  }}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shrink-0 transition-all cursor-pointer shadow-2xs flex items-center gap-1.5 self-end sm:self-center"
                  title="Registrar ciência da alteração de status"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dar Ciência</span>
                </button>
              </div>
            )}

            {/* Child Name (18px, font 600) */}
            <div>
              <h4 className="text-[18px] font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                {doc.crianca_nome || 'PRONTUÁRIO INCOMPLETO'}
              </h4>

              {doc.monitoramento && !doc.monitoramento.concluido && doc.monitoramento.requisicoes?.some(r => {
                 if (r.concluido || (r as any).excluidoDoMonitoramento) return false;
                 const deadline = parseLocalDate(r.dataFinal);
                 deadline.setHours(0,0,0,0);
                 return deadline.getTime() < new Date().setHours(0,0,0,0);
              }) && (
                 <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 text-amber-800 text-[12px] font-medium rounded-lg">
                    <Timer className="w-3.5 h-3.5 text-amber-600" /> Atenção: Prazo de Monitoramento Expirado
                 </div>
              )}

              {/* Informações Secundárias (14px, font 500) */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1.5 text-[14px] font-medium text-slate-600">
                 {!isNested && <div>RESPONSÁVEL: {doc.genitora_nome}</div>}
                 {doc.outro_membro_nome && (
                    <div className="text-blue-700">
                       {doc.outro_membro_parentesco || 'FAMILIAR'}: {doc.outro_membro_nome}
                    </div>
                 )}
                 <div className="text-emerald-700 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 inline" /> {doc.bairro}
                 </div>
              </div>
            </div>

            {/* Bottom Chips (12px, font 500) */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
               <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200/60 rounded-lg text-[12px] font-medium text-blue-700">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Titular: {refCouncilor?.nome || 'N/A'}
               </div>
               <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] ${
                  doc.is_urgente 
                    ? 'bg-rose-600 text-white font-black shadow-sm animate-pulse ring-2 ring-rose-400' 
                    : 'bg-sky-50 border border-sky-200/60 font-medium text-sky-800'
                }`}>
                  <ShieldCheck className={`w-3.5 h-3.5 ${doc.is_urgente ? 'text-white' : 'text-sky-600'}`} /> Imediata: {provCouncilor?.nome || 'N/A'}
               </div>
               {doc.origem && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[12px] font-medium text-slate-700" title="Origem do Caso">
                     {origemInfo.icon}
                     <span>{origemInfo.label}</span>
                  </div>
               )}
               {doc.canal_comunicado && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[12px] font-medium text-slate-700" title="Canal do Comunicado">
                     {canalInfo.icon}
                     <span>{canalInfo.label}</span>
                  </div>
               )}
               <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-lg text-[12px] font-medium text-slate-500">
                 <Timer className="w-3.5 h-3.5 text-slate-400" /> Registro: {(() => { const r = formatCadastroDateTime(doc.criado_em, doc.data_aporte, doc.hora_aporte); return `${r.date} às ${r.time}`; })()}
               </div>
            </div>
          </div>

          {/* Action buttons on right/bottom */}
          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-3 mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 md:border-transparent">
             {!isReadOnly && (
                <div className="flex flex-row items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/80" onClick={(e) => e.stopPropagation()}>
                  <span className="text-[10px] md:text-[11px] font-black uppercase text-slate-400 pl-1 flex items-center gap-1 shrink-0 tracking-wider">
                    Status:
                  </span>
                  <select
                    value={mainStatus}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newS = e.target.value as DocumentStatus;
                      if (newS) {
                        onUpdateStatus(doc.id, [...doc.status.filter(s => s !== newS), newS]);
                      }
                    }}
                    className="flex-1 bg-white text-slate-800 border border-slate-200 text-[11px] font-bold rounded-md px-2 py-1.5 outline-none focus:border-blue-500 cursor-pointer transition-colors"
                  >
                    <option value="AGUARDANDO_ANALISE">⏳ AGUARDANDO ANÁLISE</option>
                    <option value="AGUARDANDO_DOCUMENTO">📄 AGUARDANDO DOCUMENTO</option>
                    <option value="AGUARDANDO_VALIDACAO">⚖️ AGUARDANDO VALIDAÇÃO</option>
                    <option value="MEDIDA_APLICADA">✅ MEDIDA APLICADA</option>
                    <option value="AVALIAR_EM_COLEGIADO">👥 AVALIAR EM COLEGIADO</option>
                    <option value="CONCLUIDO">✅ CONCLUÍDO</option>
                    <option value="MONITORAMENTO">📊 EM MONITORAMENTO</option>
                    <option value="MEDIDA_PENDENTE">📋 MEDIDA PENDENTE</option>
                    <option value="NOTIFICADO">🔕 NOTIFICADO</option>
                    <option value="NOTIFICAR">🔔 NOTIFICAR</option>
                    <option value="RESPONDER_OFICIO_JUDICIARIO_MP">⚖️ RESPONDER OFÍCIO DO JUDICIÁRIO/MP</option>
                    <option value="SOLICITAR_REUNIAO_REDE">🏛️ SOLICITAR REUNIÃO DE REDE</option>
                  </select>
                </div>
             )}

             <div className="flex items-center justify-end gap-2 shrink-0">
                {onToggleGuardarPasta && !isReadOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleGuardarPasta([doc.id], !doc.is_pasta_guardada); }} 
                    className={`p-2.5 md:p-2 border rounded-lg transition-all cursor-pointer ${doc.is_pasta_guardada ? 'bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200' : 'bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-amber-50 hover:text-amber-800'}`} 
                    title={doc.is_pasta_guardada ? "Mostrar Pasta (Restaurar)" : "Guardar Pasta (Ocultar)"}
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                )}
                {!isReadOnly && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditDoc(doc.id); }} 
                    className="p-2.5 md:p-2 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-200/80 text-slate-600 rounded-lg transition-all cursor-pointer" 
                    title="Editar Documento"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                )}
                {(hasCounselorActions => {
                   const isCreatorAdmin = 
                     (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO' || currentUser.nome?.toUpperCase() === 'LEANDRO');
                   
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
                     className="p-2.5 md:p-2 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200/60 text-red-600 rounded-lg transition-all cursor-pointer"
                     title="Excluir Prontuário"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                )}
                <button 
                  className="p-2.5 md:p-2 bg-slate-900 hover:bg-blue-600 text-white rounded-lg transition-all cursor-pointer shadow-2xs"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 2. PAINEL DE BUSCA E FILTRO UNIFICADO */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Painel de Busca SIMCT</h3>
           </div>
           <button onClick={clearFilters} className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1.5 transition-colors cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Resetar Busca
           </button>
        </div>

        {/* 6 Filter inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200/80 rounded-xl outline-none font-medium text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
              value={filters.term} 
              onChange={(e) => setFilters({...filters, term: e.target.value})} 
            />
          </div>
          <select 
            className="h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" 
            value={filters.status} 
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Qualquer Status</option>
            <option value="AGUARDANDO_ANALISE">⏳ AGUARDANDO ANÁLISE</option>
            <option value="AGUARDANDO_DOCUMENTO">📄 AGUARDANDO DOCUMENTO</option>
            <option value="AGUARDANDO_VALIDACAO">⚖️ AGUARDANDO VALIDAÇÃO</option>
            <option value="MEDIDA_APLICADA">✅ MEDIDA APLICADA</option>
            <option value="AVALIAR_EM_COLEGIADO">👥 AVALIAR EM COLEGIADO</option>
            <option value="CONCLUIDO">✅ CONCLUÍDO</option>
            <option value="MONITORAMENTO">📊 EM MONITORAMENTO</option>
            <option value="MEDIDA_PENDENTE">📋 MEDIDA PENDENTE</option>
            <option value="NOTIFICADO">🔕 NOTIFICADO</option>
            <option value="NOTIFICAR">🔔 NOTIFICAR</option>
            <option value="RESPONDER_OFICIO_JUDICIARIO_MP">⚖️ RESPONDER OFÍCIO DO JUDICIÁRIO/MP</option>
            <option value="SOLICITAR_REUNIAO_REDE">🏛️ SOLICITAR REUNIÃO DE REDE</option>
          </select>
          <select 
            className="h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" 
            value={filters.bairro} 
            onChange={(e) => setFilters({...filters, bairro: e.target.value})}
          >
            <option value="">Qualquer Bairro</option>
            {getBairrosByUnidade(currentUser.unidade_id).map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select 
            className="h-10 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" 
            value={filters.conselheiro_ref_id} 
            onChange={(e) => setFilters({...filters, conselheiro_ref_id: e.target.value})}
          >
            <option value="">Qualquer Conselheiro</option>
            {users.filter(u => u.status !== 'EXCLUIDO' && (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && u.unidade_id === currentUser.unidade_id).map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
          </select>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <input 
              type="date" 
              className="w-full h-10 pl-9 pr-3 bg-slate-50 border border-slate-200/80 rounded-xl outline-none font-medium text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
              value={filters.data_registro} 
              onChange={(e) => setFilters({...filters, data_registro: e.target.value})} 
            />
          </div>
          <select 
            className={`h-10 px-3 border rounded-xl text-xs font-bold outline-none transition-all cursor-pointer ${
              (filters.pasta_guardada === 'SIM' || filters.pasta_guardada === 'TODAS') 
                ? 'bg-amber-50 border-amber-300 text-amber-900 focus:ring-2 focus:ring-amber-500/20' 
                : 'bg-slate-50 border-slate-200/80 text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }`} 
            value={filters.pasta_guardada || 'NAO'} 
            onChange={(e) => setFilters({...filters, pasta_guardada: e.target.value})}
          >
            <option value="NAO">📂 Pastas Visíveis (Ativas)</option>
            <option value="SIM">📦 Pastas Guardadas</option>
            <option value="TODAS">📁 Todas (Visíveis + Guardadas)</option>
          </select>
        </div>

        {filters.pasta_guardada === 'SIM' && (
          <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center shrink-0">
                <Archive className="w-4 h-4 text-amber-800" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  Consulta a Pastas Guardadas
                </span>
                <p className="text-xs text-amber-800 font-medium mt-0.5">
                  Exibindo apenas procedimentos de pastas familiares guardadas/ocultas.
                </p>
              </div>
            </div>
            <button 
              onClick={() => setFilters({ ...filters, pasta_guardada: 'NAO' })} 
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0"
            >
              <span>Voltar para Pastas Visíveis</span>
            </button>
          </div>
        )}

        {/* View mode tabs and grouping toggle button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
           <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              <button 
                onClick={() => setMyViewMode('ALL')} 
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${myViewMode === 'ALL' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Visão Geral
              </button>
              <button 
                onClick={() => setMyViewMode('REF')} 
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${myViewMode === 'REF' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Minha Titularidade
              </button>
              <button 
                onClick={() => setMyViewMode('IMED')} 
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${myViewMode === 'IMED' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Minha Imediata
              </button>
              <button 
                onClick={() => setMyViewMode('VALID')} 
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${myViewMode === 'VALID' ? 'bg-red-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                Validação Colegiado
              </button>
           </div>

           <button 
             onClick={() => {
               setIsGroupedByFamily(!isGroupedByFamily);
               setFocusedFolderKey(null);
               setExpandedFolders({});
             }}
             className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${isGroupedByFamily ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
           >
             {isGroupedByFamily ? <FolderOpen className="w-4 h-4 text-amber-300 fill-amber-300 shrink-0" /> : <Folder className="w-4 h-4 text-slate-500 shrink-0" />}
             <span>{isGroupedByFamily ? 'Agrupado por Pasta Familiar' : 'Lista Individual'}</span>
           </button>
        </div>
      </div>

      {/* 3. MODO ISOLADO */}
      {isGroupedByFamily && focusedFolderKey && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 border border-amber-200/80 rounded-xl flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Modo Isolado Ativo
              </span>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                Exibindo apenas a pasta da família selecionada para evitar contaminação visual.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFocusedFolderKey(null);
              setExpandedFolders({});
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span>Ver Todas as Pastas ({familyGroups.length})</span>
          </button>
        </div>
      )}

      {/* 4. LISTA / PASTAS FAMILIARES */}
      <div className="grid grid-cols-1 gap-4">
        {isGroupedByFamily ? (
          displayedFamilyGroups.map(group => {
            const isExpanded = !!expandedFolders[group.key];
            const firstDoc = group.docs[0];
            const refCouncilor = users.find(u => u.id === firstDoc?.conselheiro_referencia_id);

            let pendingValidationCount = 0;
            let myImediataCount = 0;
            let revalidacaoCount = 0;
            let expiredMonitoramentoCount = 0;

            group.docs.forEach(doc => {
              const mainStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
              
              const hasEcaMeasuresVal = (doc.medidas_detalhadas || []).some(m => 
                m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
              );

              const isNotifiedVal = hasEcaMeasuresVal && (doc.notificacoes_trio || []).some(n => 
                isSameCounselorName(n, currentUser.nome) || 
                (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(n, currentUser.substituted_name))
              );

              const trioRawVal = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
                ? doc.conselheiros_providencia_nomes
                : getEffectiveEscala(doc.data_aporte, doc.hora_aporte, doc.unidade_id, nameMap, scaleExceptions);

              const isInTrioVal = isNotifiedVal || trioRawVal.some(name => {
                if (!name) return false;
                if (isSameCounselorName(name, currentUser.nome)) return true;
                if (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)) return true;
                if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') return true;
                return false;
              });

              const confirmacoesVal = (doc.medidas_detalhadas || []).flatMap(m => m.confirmacoes || []);
              const iValidatedVal = !isNotifiedVal && confirmacoesVal.some(c => 
                c.usuario_id === currentUser.id || 
                c.usuario_id === currentUser.real_user_id || 
                isSameCounselorName(c.usuario_nome, currentUser.nome)
              );

              const isMedidaAplicadaOrAwaitingVal = doc.status.includes('MEDIDA_APLICADA') || doc.status.includes('AGUARDANDO_VALIDACAO') || isNotifiedVal;

              if (hasEcaMeasuresVal && isMedidaAplicadaOrAwaitingVal && isInTrioVal && !iValidatedVal) {
                pendingValidationCount++;
              }

              const isImediataUser = doc.conselheiro_providencia_id === currentUser.id ||
                (currentUser.is_suplente_active && doc.conselheiro_providencia_id === currentUser.real_user_id);

              const isInitialStatus = mainStatus === 'AGUARDANDO_ANALISE' || mainStatus === 'EM_PREENCHIMENTO';

              if (isImediataUser && isInitialStatus) {
                myImediataCount++;
              }

              const lastDispatch = [...doc.status].reverse().find(s => [
                'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
                'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
                'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
                'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE',
                'RESPONDER_OFICIO_JUDICIARIO_MP', 'PROMOVER_REUNIAO_REDE',
                'NENHUMA', 'AGUARDANDO_AVALIACAO'
              ].includes(s) || s.startsWith('NOTIFICACAO_'));

              const hasEcaMeasures = (doc.medidas_detalhadas || []).some(m => 
                m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
              );

              if (hasEcaMeasures && (doc.notificacoes_trio || []).some(n => {
                if (!n) return false;
                const upper = n.toUpperCase();
                if (upper === currentUser.nome.toUpperCase()) return true;
                const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
                if (upper === cleanCurrentUserName) return true;
                if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
                return false;
              }) && (!lastDispatch || lastDispatch === 'NENHUMA')) {
                revalidacaoCount++;
              }

              if (doc.monitoramento && !doc.monitoramento.concluido && doc.monitoramento.requisicoes?.some(r => {
                if (r.concluido || (r as any).excluidoDoMonitoramento) return false;
                const deadline = parseLocalDate(r.dataFinal);
                deadline.setHours(0,0,0,0);
                return deadline.getTime() < new Date().setHours(0,0,0,0);
              })) {
                expiredMonitoramentoCount++;
              }

              const isRef = doc.conselheiro_referencia_id === currentUser.id ||
                (currentUser.is_suplente_active && currentUser.real_user_id && doc.conselheiro_referencia_id === currentUser.real_user_id);
              if (isRef && (doc.alertas_status_referencia || []).some(a => !a.lido)) {
                revalidacaoCount++;
              }
            });

            const totalAlerts = pendingValidationCount + myImediataCount + revalidacaoCount + expiredMonitoramentoCount;
            const hasAlert = totalAlerts > 0;

            const childNames = Array.from(
              new Set(
                group.docs.flatMap(d => {
                  const names: string[] = [];
                  if (d.crianca_nome && d.crianca_nome.trim() && d.crianca_nome.trim().toUpperCase() !== 'NÃO INFORMADO' && d.crianca_nome.trim().toUpperCase() !== 'NAO INFORMADO') {
                    names.push(d.crianca_nome.trim().toUpperCase());
                  }
                  if (d.criancas && Array.isArray(d.criancas)) {
                    d.criancas.forEach(c => {
                      if (c.nome && c.nome.trim() && c.nome.trim().toUpperCase() !== 'NÃO INFORMADO' && c.nome.trim().toUpperCase() !== 'NAO INFORMADO') {
                        names.push(c.nome.trim().toUpperCase());
                      }
                    });
                  }
                  return names;
                })
              )
            );

            return (
              <div 
                key={group.key} 
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden relative"
              >
                {/* 8px Colored Left Vertical Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${hasAlert ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

                {/* Header Container */}
                <div className="p-5 md:p-6 pl-6 sm:pl-7 space-y-3">
                  {/* Top Bar: Badges on Left, Guardar Pasta on Top Right */}
                  <div className="flex items-start justify-between gap-3">
                    {/* Badge Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/60">
                        Pasta Familiar
                      </span>
                      {group.docs.some(d => d.is_pasta_guardada) && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-2xs">
                          <Archive className="w-3.5 h-3.5 text-amber-700" />
                          <span>Pasta Guardada</span>
                        </span>
                      )}
                      <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        {group.docs.length} {group.docs.length === 1 ? 'Procedimento' : 'Procedimentos'}
                      </span>
                      
                      {hasAlert && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200/60 flex items-center gap-1.5 animate-pulse">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>
                            {totalAlerts} {totalAlerts === 1 ? 'Ação Pendente' : 'Ações Pendentes'}
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Top Right: Guardar / Mostrar Pasta */}
                    {onToggleGuardarPasta && !isReadOnly && (() => {
                      const isFolderGuardada = group.docs.every(d => d.is_pasta_guardada);
                      if (isFolderGuardada) {
                        return (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleGuardarPasta(group.docs.map(d => d.id), false);
                            }}
                            className="shrink-0 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Mostrar/Restaurar esta Pasta Familiar na lista de visíveis"
                          >
                            <FolderOpen className="w-3.5 h-3.5 text-white" />
                            <span>Mostrar Pasta</span>
                          </button>
                        );
                      } else {
                        return (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleGuardarPasta(group.docs.map(d => d.id), true);
                            }}
                            className="shrink-0 px-3.5 py-1.5 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                            title="Guardar esta pasta para deixar a tela principal mais limpa"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-600" />
                            <span>Guardar Pasta</span>
                          </button>
                        );
                      }
                    })()}
                  </div>

                  {/* Main Header Content & Abrir Pasta Button */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      {/* Responsável - 22px font weight 700 */}
                      <h3 className="text-[22px] font-bold text-slate-900 tracking-tight leading-snug">
                        RESPONSÁVEL: {group.genitora_nome}
                      </h3>

                      {/* Criança - 18px font weight 600 */}
                      {childNames.length > 0 && (
                        <div className="text-[18px] font-semibold text-slate-800 flex items-center gap-2">
                          <Baby className="w-5 h-5 text-indigo-600 shrink-0" />
                          <span>
                            {childNames.length === 1 ? 'Criança / Adolescente:' : 'Crianças / Adolescentes:'}{' '}
                            <span className="text-indigo-900 font-semibold">{childNames.join(', ')}</span>
                          </span>
                        </div>
                      )}

                      {/* CPF • Bairro • Titular - 14px font weight 500 */}
                      <div className="text-[14px] font-medium text-slate-600 flex flex-wrap items-center gap-4">
                        {group.cpf_genitora && <span>CPF: {group.cpf_genitora}</span>}
                        {group.bairro && (
                          <span className="flex items-center gap-1 text-emerald-700">
                            <MapPin className="w-3.5 h-3.5" /> Bairro: {group.bairro}
                          </span>
                        )}
                        {refCouncilor && (
                          <span className="text-blue-700">
                            <UserCheck className="w-3.5 h-3.5 inline mr-1" /> Titular: {refCouncilor.nome}
                          </span>
                        )}
                      </div>

                      {/* Etiquetas / Chips - 12px font weight 500 */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {Array.from(new Set(group.docs.map(d => d.origem).filter(Boolean))).map(orig => {
                          const info = getOrigemIconAndStyle(orig);
                          return (
                            <span key={orig} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-[12px] font-medium" title="Origem do Caso">
                              {info.icon} <span>{info.label}</span>
                            </span>
                          );
                        })}
                        {Array.from(new Set(group.docs.map(d => d.canal_comunicado).filter(Boolean))).map(canal => {
                          const info = getCanalIconAndStyle(canal);
                          return (
                            <span key={canal} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-700 text-[12px] font-medium" title="Canal do Comunicado">
                              {info.icon} <span>{info.label}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Motivos de alerta resumidos (12px) */}
                      {hasAlert && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {myImediataCount > 0 && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 text-[12px] font-medium rounded-lg">
                              ⚠️ Sua Providência Imediata ({myImediataCount})
                            </span>
                          )}
                          {pendingValidationCount > 0 && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 text-[12px] font-medium rounded-lg">
                              📋 Validação Colegiado ({pendingValidationCount})
                            </span>
                          )}
                          {revalidacaoCount > 0 && (
                            <span className="px-2.5 py-1 bg-red-50 text-red-800 border border-red-200/80 text-[12px] font-medium rounded-lg">
                              ⚡ Revalidação ({revalidacaoCount})
                            </span>
                          )}
                          {expiredMonitoramentoCount > 0 && (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/80 text-[12px] font-medium rounded-lg">
                              ⏱️ Prazo Expirado ({expiredMonitoramentoCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Botão Abrir / Recolher Pasta */}
                    <div className="shrink-0 self-start md:self-center">
                      <button 
                        onClick={() => toggleFolder(group.key)}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-medium text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200/60"
                      >
                        <span>{isExpanded ? 'Recolher Pasta' : 'Abrir Pasta'}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conteúdo da Pasta (Procedimentos) */}
                {isExpanded && (
                  <div className="p-4 md:p-5 pl-6 sm:pl-7 bg-slate-50/50 border-t border-slate-100 space-y-3">
                    {group.docs.map(doc => renderDocCard(doc, true))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          filteredDocs.map(doc => renderDocCard(doc, false))
        )}

        {filteredDocs.length === 0 && (
          <div className="py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center gap-3">
             <Database className="w-10 h-10 text-slate-300" />
             <p className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Nenhum registro localizado no Painel Geral.</p>
          </div>
        )}
      </div>

      {docToDelete && (
        <div id="delete-confirm-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center tracking-tight mb-2">Excluir Prontuário?</h3>
            <p className="text-xs font-medium text-slate-500 text-center mb-6 leading-relaxed">
              Você está prestes a excluir permanentemente o prontuário <span className="font-bold text-slate-900">#{docToDelete}</span>. 
              O sistema reverterá a escala e a distribuição de providência imediata para o estado anterior. Esta ação é <span className="font-semibold text-red-600">irreversível</span>.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  onDeleteDoc(docToDelete);
                  setDocToDelete(null);
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs tracking-wide transition-all text-center cursor-pointer shadow-xs"
              >
                Sim, Excluir Agora
              </button>
              <button
                onClick={() => setDocToDelete(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold text-xs transition-all text-center cursor-pointer"
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
