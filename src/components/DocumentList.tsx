
import React, { useState, useMemo } from 'react';
import { Search, Clock, UserCheck, Activity, CheckCircle2, FileText, ChevronDown, ChevronUp, Folder, FolderOpen, UserRound, ShieldAlert, Scale, TriangleAlert, Ban, Filter, RefreshCw, Building2, Baby, Users, MapPin, Fingerprint, LayoutGrid, Eye, Bookmark, Zap, ShieldCheck, FileCheck2, Tag, Database, Trash2, Timer, Calendar, GraduationCap, Stethoscope, HandHeart, Phone, Mail, Siren, PhoneCall } from 'lucide-react';
import { Documento, User as UserType, DocumentStatus } from '../types';
import { STATUS_LABELS, INITIAL_USERS, BAIRROS, getBairrosByUnidade } from '../constants';
import { formatLocalDateString, parseLocalDate, formatCadastroDateTime } from '../lib/dateUtils';

export const getOrigemIconAndStyle = (origemRaw?: string) => {
  const origem = (origemRaw || '').toUpperCase().trim();
  
  if (origem.includes('FAMÍLIA') || origem.includes('FAMILIA') || origem.includes('MÃE') || origem.includes('PAI') || origem.includes('AVÓ') || origem.includes('AVÔ') || origem.includes('PARENTES') || origem.includes('RESPONSÁVEL') || origem.includes('IRMÃO') || origem.includes('TIA') || origem.includes('TIO') || origem.includes('GENITORA') || origem.includes('MADRASTA') || origem.includes('PADRASTO')) {
    return {
      icon: <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'FAMÍLIA'}`,
      style: 'bg-purple-50 border-purple-200 text-purple-900',
      category: 'FAMÍLIA'
    };
  }
  if (origem.includes('EDUCAÇÃO') || origem.includes('EDUCACAO') || origem.includes('EMEF') || origem.includes('EMEI') || origem.includes('E.E.') || origem.includes('ESCOLA') || origem.includes('CRECHE')) {
    return {
      icon: <GraduationCap className="w-3.5 h-3.5 text-cyan-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'EDUCAÇÃO'}`,
      style: 'bg-cyan-50 border-cyan-200 text-cyan-900',
      category: 'EDUCAÇÃO'
    };
  }
  if (origem.includes('SAÚDE') || origem.includes('SAUDE') || origem.includes('UBS') || origem.includes('HOSPITAL') || origem.includes('SAMU') || origem.includes('UPA') || origem.includes('AMBULATÓRIO')) {
    return {
      icon: <Stethoscope className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'SAÚDE'}`,
      style: 'bg-rose-50 border-rose-200 text-rose-900',
      category: 'SAÚDE'
    };
  }
  if (origem.includes('ASSISTÊNCIA') || origem.includes('ASSISTENCIA') || origem.includes('CRAS') || origem.includes('CREAS') || origem.includes('POP') || origem.includes('ACOLHIMENTO') || origem.includes('DAS')) {
    return {
      icon: <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'ASSISTÊNCIA SOCIAL'}`,
      style: 'bg-amber-50 border-amber-200 text-amber-900',
      category: 'ASSISTÊNCIA SOCIAL'
    };
  }
  if (origem.includes('SEGURANÇA') || origem.includes('SEGURANCA') || origem.includes('POLÍCIA') || origem.includes('POLICIA') || origem.includes('GUARDA') || origem.includes('DDM') || origem.includes('PATRULHA') || origem.includes('BOMBEIROS')) {
    return {
      icon: <ShieldAlert className="w-3.5 h-3.5 text-slate-700 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'SEGURANÇA'}`,
      style: 'bg-slate-100 border-slate-300 text-slate-900',
      category: 'SEGURANÇA'
    };
  }
  if (origem.includes('JUDICIÁRIO') || origem.includes('JUDICIARIO') || origem.includes('MP') || origem.includes('PROMOTORIA') || origem.includes('VARA') || origem.includes('JUSTIÇA')) {
    return {
      icon: <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'PODER JUDICIÁRIO'}`,
      style: 'bg-indigo-50 border-indigo-200 text-indigo-900',
      category: 'JUDICIÁRIO'
    };
  }
  if (origem.includes('DENÚNCIA') || origem.includes('DENUNCIA') || origem.includes('DISQUE') || origem.includes('SIPIA')) {
    return {
      icon: <Siren className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
      label: `ORIGEM: ${origemRaw || 'DENÚNCIA / SIPIA'}`,
      style: 'bg-orange-50 border-orange-200 text-orange-900',
      category: 'DENÚNCIA'
    };
  }
  return {
    icon: <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
    label: `ORIGEM: ${origemRaw || 'N/A'}`,
    style: 'bg-slate-50 border-slate-200 text-slate-800',
    category: 'OUTROS'
  };
};

export const getCanalIconAndStyle = (canalRaw?: string) => {
  const canal = (canalRaw || '').toUpperCase().trim();
  if (canal.includes('PRESENCIAL')) {
    return {
      icon: <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-emerald-50 border-emerald-200 text-emerald-900'
    };
  }
  if (canal.includes('TELEFÔNICO') || canal.includes('TELEFONICO') || canal.includes('TELEFONE') || canal.includes('PLANTÃO') || canal.includes('PLANTAO') || canal.includes('LIGAÇÃO')) {
    return {
      icon: <Phone className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-sky-50 border-sky-200 text-sky-900'
    };
  }
  if (canal.includes('EMAIL') || canal.includes('E-MAIL')) {
    return {
      icon: <Mail className="w-3.5 h-3.5 text-purple-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-purple-50 border-purple-200 text-purple-900'
    };
  }
  if (canal.includes('DISQUE 100') || canal.includes('DISQUE')) {
    return {
      icon: <Siren className="w-3.5 h-3.5 text-red-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-red-50 border-red-200 text-red-900'
    };
  }
  if (canal.includes('SIPIA')) {
    return {
      icon: <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-teal-50 border-teal-200 text-teal-900'
    };
  }
  if (canal.includes('OFÍCIO') || canal.includes('OFICIO') || canal.includes('RELATÓRIO') || canal.includes('RELATORIO')) {
    return {
      icon: <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0" />,
      label: `CANAL: ${canalRaw}`,
      style: 'bg-amber-50 border-amber-200 text-amber-900'
    };
  }
  return {
    icon: <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />,
    label: `CANAL: ${canalRaw || 'N/A'}`,
    style: 'bg-slate-50 border-slate-200 text-slate-800'
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
  onSelectDoc, 
  onEditDoc, 
  onDeleteDoc, 
  onUpdateStatus,
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
          const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
          if (upper === cleanCurrentUserName) return true;
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
      // Se a pasta já está em foco, ao clicar em recolher, volta a mostrar todas as pastas
      setFocusedFolderKey(null);
      setExpandedFolders({});
    } else {
      // Ao clicar na pasta, isola ela na tela (foco) e expande
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
    const refCouncilor = users.find(u => u.id === doc.conselheiro_referencia_id);
    const provCouncilor = users.find(u => u.id === doc.conselheiro_providencia_id);
    const confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
    const iValidated = confirmacoes.some(c => c.usuario_id === currentUser.id);
    const isInTrio = doc.conselheiros_providencia_nomes?.some(name => {
      if (!name) return false;
      const upper = name.toUpperCase();
      if (upper === currentUser.nome.toUpperCase()) return true;
      const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
      if (upper === cleanCurrentUserName) return true;
      if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
      return false;
    }) || false;

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
    const origemInfo = getOrigemIconAndStyle(doc.origem);
    const canalInfo = getCanalIconAndStyle(doc.canal_comunicado);

    return (
      <div key={doc.id} onClick={() => onSelectDoc(doc.id)} className={`bg-white rounded-2xl border border-[#E5E7EB] ${style.border} border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer group overflow-hidden ${isNested ? 'bg-slate-50/50' : ''}`}>
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
                  {(doc.notificacoes_trio || []).some(n => {
                    if (!n) return false;
                    const upper = n.toUpperCase();
                    if (upper === currentUser.nome.toUpperCase()) return true;
                    const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
                    if (upper === cleanCurrentUserName) return true;
                    if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
                    return false;
                  }) && (!lastDispatch || lastDispatch === 'NENHUMA') && (
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
                     {!isNested && <div className="flex items-center gap-2 text-[11px] text-[#4B5563] font-bold uppercase"><UserRound className="w-3.5 h-3.5" /> RESPONSÁVEL: {doc.genitora_nome}</div>}
                     {doc.outro_membro_nome && (
                        <div className="flex items-center gap-2 text-[11px] text-blue-700 font-bold uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                           <Users className="w-3.5 h-3.5 text-blue-600" /> {doc.outro_membro_parentesco || 'FAMILIAR'}: {doc.outro_membro_nome}
                        </div>
                     )}
                     <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-bold uppercase"><MapPin className="w-3.5 h-3.5" /> {doc.bairro}</div>
                  </div>
               </div>
               <div className="flex flex-wrap items-center gap-2 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-lg text-[10px] font-black text-[#2563EB] uppercase"><UserCheck className="w-3 h-3" /> Titular: {refCouncilor?.nome || 'N/A'}</div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase"><ShieldCheck className="w-3 h-3" /> Imediata: {provCouncilor?.nome || 'N/A'}</div>
                  {doc.origem && (
                     <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase ${origemInfo.style}`} title="Origem do Caso">
                        {origemInfo.icon}
                        <span>{origemInfo.label}</span>
                     </div>
                  )}
                  {doc.canal_comunicado && (
                     <div className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-[10px] font-black uppercase ${canalInfo.style}`} title="Canal do Comunicado">
                        {canalInfo.icon}
                        <span>{canalInfo.label}</span>
                     </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-500 uppercase">
                    <Timer className="w-3 h-3" /> Registro: {(() => { const r = formatCadastroDateTime(doc.criado_em, doc.data_aporte, doc.hora_aporte); return `${r.date} às ${r.time}`; })()}
                  </div>
               </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-3 self-start md:self-center">
               {!isReadOnly && (
                  <div className="flex items-center gap-1.5 bg-slate-100/90 p-1.5 rounded-xl border border-slate-200 shadow-inner" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] font-black uppercase text-slate-600 pl-1 flex items-center gap-1 shrink-0">
                      <Tag className="w-3 h-3 text-indigo-600 shrink-0" /> Status:
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
                      className="bg-white text-slate-800 border border-slate-300 text-[10px] font-black uppercase rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
                    >
                      <option value="NOTIFICAR">🔔 NOTIFICAR</option>
                      <option value="NOTIFICADO">🔕 NOTIFICADO</option>
                      <option value="AVALIAR_EM_COLEGIADO">👥 AVALIAR EM COLEGIADO</option>
                      <option value="SOLICITAR_REUNIAO_REDE">🏛️ SOLICITAR REUNIÃO DE REDE</option>
                      <option value="CONCLUIDO">✅ CONCLUÍDO</option>
                      <option value="ENCERRADO">🔒 ENCERRADO</option>
                      <option value="AGUARDANDO_ANALISE">⏳ AGUARDANDO ANÁLISE</option>
                      <option value="MONITORAMENTO">📊 EM MONITORAMENTO</option>
                      <option value="ARQUIVADO">📁 ARQUIVADO</option>
                    </select>
                  </div>
               )}

               <div className="flex items-center gap-3">
                  {!isReadOnly && <button onClick={(e) => { e.stopPropagation(); onEditDoc(doc.id); }} className="p-3 bg-white border border-[#E5E7EB] text-[#4B5563] rounded-xl hover:bg-[#111827] hover:text-white transition-all" title="Editar Documento"><FileText className="w-4 h-4" /></button>}
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
      </div>
    );
  };

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

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" placeholder="NOME, PROTOCOLO OU CÓDIGO DO COMUNICADO..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-[11px] uppercase focus:border-blue-500" value={filters.term} onChange={(e) => setFilters({...filters, term: e.target.value})} />
          </div>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
            <option value="">Qualquer Status</option>
            <option value="NOTIFICAR">🔔 NOTIFICAR</option>
            <option value="NOTIFICADO">🔕 NOTIFICADO</option>
            <option value="AVALIAR_EM_COLEGIADO">👥 AVALIAR EM COLEGIADO</option>
            <option value="SOLICITAR_REUNIAO_REDE">🏛️ SOLICITAR REUNIÃO DE REDE</option>
            <option value="CONCLUIDO">✅ CONCLUÍDO</option>
            <option value="ENCERRADO">🔒 ENCERRADO</option>
            <option value="AGUARDANDO_ANALISE">⏳ AGUARDANDO ANÁLISE</option>
            <option value="AGUARDANDO_VALIDACAO">⚖️ AGUARDANDO VALIDAÇÃO</option>
            <option value="MONITORAMENTO">📊 EM MONITORAMENTO</option>
            <option value="MEDIDA_APLICADA">📋 MEDIDA APLICADA</option>
            <option value="ARQUIVADO">📁 ARQUIVADO</option>
          </select>
          <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-blue-500" value={filters.bairro} onChange={(e) => setFilters({...filters, bairro: e.target.value})}>
            <option value="">Qualquer Bairro</option>
            {getBairrosByUnidade(currentUser.unidade_id).map(b => <option key={b} value={b}>{b}</option>)}
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

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
           <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 rounded-2xl max-w-4xl border border-slate-200">
              <button onClick={() => setMyViewMode('ALL')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'ALL' ? 'bg-[#111827] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Visão Geral</button>
              <button onClick={() => setMyViewMode('REF')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'REF' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Titularidade</button>
              <button onClick={() => setMyViewMode('IMED')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'IMED' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Minha Imediata</button>
              <button onClick={() => setMyViewMode('VALID')} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${myViewMode === 'VALID' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>Validação Colegiado</button>
           </div>

           <div className="flex items-center gap-3">
             <button 
               onClick={() => {
                 setIsGroupedByFamily(!isGroupedByFamily);
                 setFocusedFolderKey(null);
                 setExpandedFolders({});
               }}
               className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm ${isGroupedByFamily ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'}`}
             >
               {isGroupedByFamily ? <FolderOpen className="w-4 h-4 text-amber-300 fill-amber-300" /> : <Folder className="w-4 h-4 text-slate-500" />}
               <span>{isGroupedByFamily ? '📁 Agrupado por Pasta Familiar' : '📄 Lista Individual'}</span>
             </button>
           </div>
        </div>
      </div>

      {isGroupedByFamily && focusedFolderKey && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-amber-500/10 border-2 border-amber-400 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
              <FolderOpen className="w-5 h-5 text-amber-950 fill-amber-100" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 block">
                Modo Isolado Ativo
              </span>
              <p className="text-xs font-bold text-slate-800 uppercase">
                Exibindo apenas a pasta da família selecionada para evitar contaminação visual.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setFocusedFolderKey(null);
              setExpandedFolders({});
            }}
            className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-md shrink-0 self-stretch sm:self-auto justify-center"
          >
            <span>⬅️ Ver Todas as Pastas ({familyGroups.length})</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {isGroupedByFamily ? (
          displayedFamilyGroups.map(group => {
            const isExpanded = !!expandedFolders[group.key];
            const firstDoc = group.docs[0];
            const refCouncilor = users.find(u => u.id === firstDoc?.conselheiro_referencia_id);

            // Análise de alertas e providências pendentes na pasta
            let pendingValidationCount = 0;
            let myImediataCount = 0;
            let revalidacaoCount = 0;
            let expiredMonitoramentoCount = 0;

            group.docs.forEach(doc => {
              const mainStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
              const confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
              const iValidated = confirmacoes.some(c => c.usuario_id === currentUser.id);

              const isInTrio = doc.conselheiros_providencia_nomes?.some(name => {
                if (!name) return false;
                const upper = name.toUpperCase();
                if (upper === currentUser.nome.toUpperCase()) return true;
                const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
                if (upper === cleanCurrentUserName) return true;
                if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
                return false;
              }) || false;

              const isAwaitingValidation = doc.status.includes('AGUARDANDO_VALIDACAO') && !doc.status.includes('MEDIDA_APLICADA');
              
              const isAdminDespacho = [
                'ARQUIVADO', 'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
                'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
                'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
                'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE'
              ].includes(mainStatus) || mainStatus.startsWith('NOTIFICACAO_');

              const isOficializado = doc.status.includes('MEDIDA_APLICADA');

              if (isAwaitingValidation) {
                pendingValidationCount++;
              }

              if (doc.conselheiro_providencia_id === currentUser.id && !isOficializado && !isAdminDespacho) {
                myImediataCount++;
              }

              const lastDispatch = [...doc.status].reverse().find(s => [
                'ARQUIVADO', 'CONCLUIDO', 'EMAIL_RESPONDIDO', 'OFICIO_RESPONDIDO', 'NOTIFICAR',
                'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'ENCAMINHAR_NOTICIA_FATO',
                'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'DIREITO_NAO_VIOLADO',
                'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE',
                'NENHUMA', 'AGUARDANDO_AVALIACAO'
              ].includes(s) || s.startsWith('NOTIFICACAO_'));

              if ((doc.notificacoes_trio || []).some(n => {
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
                className={`rounded-[2rem] p-4 sm:p-5 space-y-3 transition-all ${
                  hasAlert 
                    ? 'bg-rose-50/70 border-2 border-rose-300 shadow-sm' 
                    : 'bg-slate-50/80 border border-slate-200/90 shadow-sm'
                }`}
              >
                {/* Header da Pasta Familiar */}
                <div 
                  onClick={() => toggleFolder(group.key)}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl cursor-pointer transition-all group ${
                    hasAlert 
                      ? 'bg-white text-slate-800 border-2 border-rose-300 hover:border-rose-400 hover:shadow-md' 
                      : 'bg-white text-slate-800 border border-slate-200 hover:border-indigo-400 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-all ${
                      hasAlert ? 'bg-rose-500 text-white shadow-rose-200' : 'bg-amber-400 group-hover:bg-amber-500 text-amber-950 shadow-amber-200/60'
                    }`}>
                      {isExpanded ? (
                        <FolderOpen className="w-6 h-6 text-amber-950 fill-amber-100" />
                      ) : (
                        <Folder className="w-6 h-6 text-amber-950 fill-amber-100" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${hasAlert ? 'text-rose-600' : 'text-amber-700'}`}>
                          PASTA FAMILIAR
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase ${
                          hasAlert ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {group.docs.length} {group.docs.length === 1 ? 'Procedimento' : 'Procedimentos'}
                        </span>
                        
                        {hasAlert && (
                          <span className="px-3 py-0.5 bg-rose-600 text-white font-black text-[10px] rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm animate-pulse">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>
                              {totalAlerts} {totalAlerts === 1 ? 'AÇÃO PENDENTE' : 'AÇÕES PENDENTES'}
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className={`text-[16px] font-black uppercase tracking-wide mt-1 transition-colors ${
                        hasAlert ? 'text-slate-900 group-hover:text-rose-600' : 'text-slate-800 group-hover:text-indigo-600'
                      }`}>
                        RESPONSÁVEL: {group.genitora_nome}
                      </h3>

                      {childNames.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1 text-[12px] font-black uppercase tracking-wide text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100/80 w-fit">
                          <Baby className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>
                            {childNames.length === 1 ? 'CRIANÇA / ADOLESCENTE:' : 'CRIANÇAS / ADOLESCENTES:'}{' '}
                            <span className="text-indigo-950 font-black">{childNames.join(', ')}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-slate-500 mt-1">
                        {group.cpf_genitora && <span>CPF: {group.cpf_genitora}</span>}
                        {group.bairro && (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <MapPin className="w-3.5 h-3.5" /> {group.bairro}
                          </span>
                        )}
                        {refCouncilor && (
                          <span className="text-blue-600">
                            <UserCheck className="w-3.5 h-3.5 inline mr-1" /> Titular: {refCouncilor.nome}
                          </span>
                        )}
                      </div>

                      {/* Origens e Canais presentes na Pasta Familiar */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-1 border-t border-slate-100">
                        {Array.from(new Set(group.docs.map(d => d.origem).filter(Boolean))).map(orig => {
                          const info = getOrigemIconAndStyle(orig);
                          return (
                            <span key={orig} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase ${info.style}`} title="Origem do Caso">
                              {info.icon} <span>{info.label}</span>
                            </span>
                          );
                        })}
                        {Array.from(new Set(group.docs.map(d => d.canal_comunicado).filter(Boolean))).map(canal => {
                          const info = getCanalIconAndStyle(canal);
                          return (
                            <span key={canal} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[9px] font-black uppercase ${info.style}`} title="Canal do Comunicado">
                              {info.icon} <span>{info.label}</span>
                            </span>
                          );
                        })}
                      </div>

                      {/* Motivos de alerta resumidos */}
                      {hasAlert && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-rose-200">
                          {myImediataCount > 0 && (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black rounded-md uppercase">
                              ⚠️ Sua Providência Imediata ({myImediataCount})
                            </span>
                          )}
                          {pendingValidationCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 text-[9px] font-black rounded-md uppercase">
                              📋 Validação Colegiado ({pendingValidationCount})
                            </span>
                          )}
                          {revalidacaoCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[9px] font-black rounded-md uppercase">
                              ⚡ Revalidação ({revalidacaoCount})
                            </span>
                          )}
                          {expiredMonitoramentoCount > 0 && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-black rounded-md uppercase">
                              ⏱️ Prazo Expirado ({expiredMonitoramentoCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(group.key);
                    }}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all shrink-0 cursor-pointer ${
                      hasAlert 
                        ? 'bg-rose-100 text-rose-800 font-black hover:bg-rose-200' 
                        : 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}
                  >
                    <span>{isExpanded ? 'Recolher Pasta' : 'Expandir Pasta'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                {/* Conteúdo da Pasta */}
                {isExpanded && (
                  <div className={`pl-1 sm:pl-3 space-y-3 pt-1 ${
                    hasAlert ? 'border-l-2 border-rose-300' : 'border-l-2 border-indigo-200/80'
                  }`}>
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
