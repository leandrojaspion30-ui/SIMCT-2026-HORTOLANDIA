import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Scale, X, Check, Clock, AlertCircle, Info, 
  Save, ShieldAlert, History, ClipboardList, CheckSquare, Square, 
  SendHorizontal, Activity, Ban, Calendar, UserRound, Plus,
  CheckCircle, CheckCircle2, ChevronDown, Play, Users, Tag, FileCheck2,
  Database, Fingerprint, MapPin, Building2, UserCog, Search, LayoutList,
  ChevronRight, Timer, ArrowUpRight, ShieldCheck, Box, FileText, Baby,
  AlertTriangle, Trash2, Zap, Bell, BellRing, RotateCcw
} from 'lucide-react';
import { 
  Documento, Log, User as UserType, DocumentStatus, 
  MedidaAplicada, SipiaViolation, AgenteVioladorEntry, LogType, AgendaEntry, ScaleException,
  AlertaStatusReferencia
} from '../types';
import { 
  STATUS_LABELS, INITIAL_USERS, 
  SIPIA_HIERARCHY, AGENTES_VIOLADORES_ESTRUTURA, 
  MEDIDAS_101_ECA, MEDIDAS_129_ECA,
  ATRIBUICOES_136_ECA, REDE_HORTOLANDIA, getEffectiveEscala, isSameCounselorName,
  LOCAL_OCORRENCIA_OPTIONS, ORIGENS_HIERARQUICAS, getOrigensHierarquicasByUnidade, CANAIS_COMUNICADO_LIST
} from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';
import { formatLocalDateString } from '../lib/dateUtils';
import { SearchableServiceSelect } from './SearchableServiceSelect';
import { SearchableSelect } from './SearchableSelect';

interface DocumentViewProps {
  document: Documento;
  allDocuments: Documento[]; 
  users: UserType[];
  agenda: AgendaEntry[];
  currentUser: UserType;
  files: any[];
  logs: Log[];
  isReadOnly?: boolean;
  forceEdit?: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: DocumentStatus[]) => void;
  onUpdateDocument: (id: string, fields: Partial<Documento>) => void;
  onAddLog: (docId: string, acao: string, tipo?: LogType) => void;
  onScience: (id: string, alertId?: string) => void;
  nameMap?: Record<string, string>;
  scaleExceptions?: ScaleException[];
}

const DocumentView: React.FC<DocumentViewProps> = ({ 
  document: doc, 
  allDocuments,
  users,
  agenda,
  currentUser, 
  logs,
  onBack, 
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateDocument,
  onAddLog,
  onScience,
  nameMap,
  scaleExceptions = []
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [tempViolacoes, setTempViolacoes] = useState<SipiaViolation[]>(doc.violacoesSipia || []);
  const [tempAgentes, setTempAgentes] = useState<AgenteVioladorEntry[]>(doc.agentesVioladores || []);
  const [selectedMedidas101, setSelectedMedidas101] = useState<string[]>((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 101')).map(m => m.artigo_inciso.replace('Art. 101, ', '')));
  const [selectedMedidas129, setSelectedMedidas129] = useState<string[]>((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 129')).map(m => m.artigo_inciso.replace('Art. 129, ', '')));
  const [selectedAtribuicoes, setSelectedAtribuicoes] = useState<string[]>(doc.atribuicoes_136 || []);
  const [atribuicoesDetalhadas, setAtribuicoesDetalhadas] = useState<any[]>(doc.atribuicoes_136_detalhadas || []);
  const [relatoProvidencias, setRelatoProvidencias] = useState(doc.relato_providencias || '');
  const [despachoSituacao, setDespachoSituacao] = useState(doc.despacho_situacao || '');
  const [isImprocedente, setIsImprocedente] = useState(doc.is_improcedente || false);
  const [informacoesDocumento, setInformacoesDocumento] = useState(doc.informacoes_documento || '');
  const [numeroComunicadoViolacao, setNumeroComunicadoViolacao] = useState(doc.numero_comunicado_violacao || '');
  const [numeroSipia, setNumeroSipia] = useState(doc.numero_sipia || '');
  const [localOcorrencia, setLocalOcorrencia] = useState(doc.local_ocorrencia || '');

  const parseCustomLocalText = (val?: string) => {
    if (!val) return '';
    if (val === 'OUTRO') return '';
    if (val.startsWith('OUTRO:')) return val.replace(/^OUTRO:\s*/i, '').trim();
    if (val.startsWith('OUTRO -')) return val.replace(/^OUTRO\s*-\s*/i, '').trim();
    if (!LOCAL_OCORRENCIA_OPTIONS.includes(val)) return val;
    return '';
  };

  const [customLocalText, setCustomLocalText] = useState<string>(parseCustomLocalText(doc.local_ocorrencia));

  const parseOrigem = (origemStr?: string, categoriaStr?: string) => {
    let cat = categoriaStr || '';
    let inst = origemStr || '';
    if (origemStr && origemStr.includes(' - ')) {
      const parts = origemStr.split(' - ');
      cat = cat || parts[0].trim();
      inst = parts.slice(1).join(' - ').trim();
    }
    return { cat, inst };
  };

  const initialOrigemParsed = parseOrigem(doc.origem, doc.origem_categoria);
  const [origemCategoria, setOrigemCategoria] = useState<string>(initialOrigemParsed.cat);
  const [origemInstituicao, setOrigemInstituicao] = useState<string>(initialOrigemParsed.inst);
  const [canalComunicado, setCanalComunicado] = useState<string>(doc.canal_comunicado || '');
  const [customOrigem, setCustomOrigem] = useState<string>('');
  const [quemComunicouClassificado, setQuemComunicouClassificado] = useState<boolean>(Boolean(doc.quem_comunicou_classificado));

  const unitOrigensHierarquicas = useMemo(() => {
    return getOrigensHierarquicasByUnidade(doc.unidade_id || 1);
  }, [doc.unidade_id]);

  const currentInstitutions = useMemo(() => {
    if (!origemCategoria || origemCategoria === 'SOCIEDADE') return [];
    const base = unitOrigensHierarquicas.find(h => h.label === origemCategoria)?.options || [];
    if (origemCategoria && !base.includes('OUTRO') && !base.includes('OUTROS')) {
      return [...base, 'OUTRO'];
    }
    return base;
  }, [unitOrigensHierarquicas, origemCategoria]);

  const handleUpdateOrigem = (newCat: string, newInst: string, newCanal: string, isManualAction: boolean = true) => {
    let fullOrigem = '';
    if (newCat === 'SOCIEDADE') {
      fullOrigem = 'SOCIEDADE';
    } else if (newCat && newInst) {
      fullOrigem = `${newCat} - ${newInst}`;
    } else {
      fullOrigem = newInst || newCat || '';
    }
    const isClassificado = Boolean(newCat || newInst) && isManualAction;
    setQuemComunicouClassificado(isClassificado);
    onUpdateDocument(doc.id, {
      origem_categoria: newCat,
      origem: fullOrigem,
      canal_comunicado: newCanal,
      quem_comunicou_classificado: isClassificado
    });
    onAddLog(doc.id, `IDENTIFICAÇÃO: "Quem Comunicou a Violação" atualizado para [${fullOrigem || 'N/A'}] via [${newCanal || 'N/A'}] por ${currentUser.nome}.`, 'DOCUMENTO');
  };

  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expiredItem, setExpiredItem] = useState<any | null>(null);
  const [extendingReq, setExtendingReq] = useState<any | null>(null);
  const [extForm, setExtForm] = useState({ nova_data: '' });

  const draftKey = `simct_draft_docview_${doc.id}_${currentUser.id}`;

  // Sincronização de estado local com as props do documento ou rascunho salvo localmente
  React.useEffect(() => {
    let draft: any = null;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        draft = JSON.parse(saved);
      }
    } catch {}

    if (draft) {
      setTempViolacoes(draft.tempViolacoes !== undefined ? draft.tempViolacoes : (doc.violacoesSipia || []));
      setTempAgentes(draft.tempAgentes !== undefined ? draft.tempAgentes : (doc.agentesVioladores || []));
      setSelectedMedidas101(draft.selectedMedidas101 !== undefined ? draft.selectedMedidas101 : ((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 101')).map(m => m.artigo_inciso.replace('Art. 101, ', ''))));
      setSelectedMedidas129(draft.selectedMedidas129 !== undefined ? draft.selectedMedidas129 : ((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 129')).map(m => m.artigo_inciso.replace('Art. 129, ', ''))));
      setSelectedAtribuicoes(draft.selectedAtribuicoes !== undefined ? draft.selectedAtribuicoes : (doc.atribuicoes_136 || []));
      setAtribuicoesDetalhadas(draft.atribuicoesDetalhadas !== undefined ? draft.atribuicoesDetalhadas : (doc.atribuicoes_136_detalhadas || []));
      setRelatoProvidencias(draft.relatoProvidencias !== undefined ? draft.relatoProvidencias : (doc.relato_providencias || ''));
      setDespachoSituacao(draft.despachoSituacao !== undefined ? draft.despachoSituacao : (doc.despacho_situacao || ''));
      setIsImprocedente(draft.isImprocedente !== undefined ? draft.isImprocedente : (doc.is_improcedente || false));
      setInformacoesDocumento(draft.informacoesDocumento !== undefined ? draft.informacoesDocumento : (doc.informacoes_documento || ''));
      setNumeroComunicadoViolacao(draft.numeroComunicadoViolacao !== undefined ? draft.numeroComunicadoViolacao : (doc.numero_comunicado_violacao || ''));
      setNumeroSipia(draft.numeroSipia !== undefined ? draft.numeroSipia : (doc.numero_sipia || ''));
      setLocalOcorrencia(draft.localOcorrencia !== undefined ? draft.localOcorrencia : (doc.local_ocorrencia || ''));
      setCustomLocalText(draft.customLocalText !== undefined ? draft.customLocalText : parseCustomLocalText(doc.local_ocorrencia));
      
      if (draft.origemCategoria !== undefined) {
        setOrigemCategoria(draft.origemCategoria);
        setOrigemInstituicao(draft.origemInstituicao || '');
      } else {
        const parsed = parseOrigem(doc.origem, doc.origem_categoria);
        setOrigemCategoria(parsed.cat);
        setOrigemInstituicao(parsed.inst);
      }
      setCanalComunicado(draft.canalComunicado !== undefined ? draft.canalComunicado : (doc.canal_comunicado || ''));
      setQuemComunicouClassificado(draft.quemComunicouClassificado !== undefined ? draft.quemComunicouClassificado : Boolean(doc.quem_comunicou_classificado));
    } else {
      setTempViolacoes(doc.violacoesSipia || []);
      setTempAgentes(doc.agentesVioladores || []);
      setSelectedMedidas101((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 101')).map(m => m.artigo_inciso.replace('Art. 101, ', '')));
      setSelectedMedidas129((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 129')).map(m => m.artigo_inciso.replace('Art. 129, ', '')));
      setSelectedAtribuicoes(doc.atribuicoes_136 || []);
      setAtribuicoesDetalhadas(doc.atribuicoes_136_detalhadas || []);
      setRelatoProvidencias(doc.relato_providencias || '');
      setDespachoSituacao(doc.despacho_situacao || '');
      setIsImprocedente(doc.is_improcedente || false);
      setInformacoesDocumento(doc.informacoes_documento || '');
      setNumeroComunicadoViolacao(doc.numero_comunicado_violacao || '');
      setNumeroSipia(doc.numero_sipia || '');
      setLocalOcorrencia(doc.local_ocorrencia || '');
      setCustomLocalText(parseCustomLocalText(doc.local_ocorrencia));
      const parsed = parseOrigem(doc.origem, doc.origem_categoria);
      setOrigemCategoria(parsed.cat);
      setOrigemInstituicao(parsed.inst);
      setCanalComunicado(doc.canal_comunicado || '');
      setQuemComunicouClassificado(Boolean(doc.quem_comunicou_classificado));
    }
  }, [doc.id, doc.informacoes_documento, doc.numero_comunicado_violacao, doc.numero_sipia, doc.local_ocorrencia, doc.origem, doc.origem_categoria, doc.canal_comunicado, doc.quem_comunicou_classificado, draftKey]);

  // Salva alterações em rascunho local enquanto o usuário preenche/edita
  React.useEffect(() => {
    try {
      const isModified = 
        despachoSituacao !== (doc.despacho_situacao || '') ||
        relatoProvidencias !== (doc.relato_providencias || '') ||
        informacoesDocumento !== (doc.informacoes_documento || '') ||
        numeroComunicadoViolacao !== (doc.numero_comunicado_violacao || '') ||
        numeroSipia !== (doc.numero_sipia || '') ||
        localOcorrencia !== (doc.local_ocorrencia || '') ||
        isImprocedente !== (doc.is_improcedente || false) ||
        JSON.stringify(tempViolacoes) !== JSON.stringify(doc.violacoesSipia || []) ||
        JSON.stringify(tempAgentes) !== JSON.stringify(doc.agentesVioladores || []) ||
        JSON.stringify(selectedAtribuicoes) !== JSON.stringify(doc.atribuicoes_136 || []);

      if (isModified) {
        const draftData = {
          despachoSituacao,
          relatoProvidencias,
          tempViolacoes,
          tempAgentes,
          selectedMedidas101,
          selectedMedidas129,
          selectedAtribuicoes,
          atribuicoesDetalhadas,
          isImprocedente,
          informacoesDocumento,
          numeroComunicadoViolacao,
          numeroSipia,
          localOcorrencia,
          customLocalText,
          origemCategoria,
          origemInstituicao,
          canalComunicado,
          quemComunicouClassificado,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
      }
    } catch (e) {}
  }, [despachoSituacao, relatoProvidencias, tempViolacoes, tempAgentes, selectedMedidas101, selectedMedidas129, selectedAtribuicoes, atribuicoesDetalhadas, isImprocedente, informacoesDocumento, numeroComunicadoViolacao, numeroSipia, localOcorrencia, customLocalText, origemCategoria, origemInstituicao, canalComunicado, quemComunicouClassificado, draftKey, doc]);

  const isUserInTrio = (nome: string) => {
    if (!nome) return false;
    if (isSameCounselorName(nome, currentUser.nome)) return true;
    if (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(nome, currentUser.substituted_name)) return true;
    return false;
  };

  const isResponsible = 
    doc.conselheiro_providencia_id === currentUser.id || 
    doc.conselheiro_referencia_id === currentUser.id ||
    (currentUser.is_suplente_active && (
      doc.conselheiro_providencia_id === currentUser.real_user_id ||
      doc.conselheiro_referencia_id === currentUser.real_user_id
    )) ||
    (doc.conselheiro_providencia_nome && isUserInTrio(doc.conselheiro_providencia_nome)) ||
    (doc.conselheiro_referencia_nome && isUserInTrio(doc.conselheiro_referencia_nome)) ||
    doc.conselheiros_providencia_nomes?.some(nome => isUserInTrio(nome)) ||
    false;

  const isActualProvidenciaImediata = 
    doc.conselheiro_providencia_id === currentUser.id || 
    (currentUser.is_suplente_active && currentUser.real_user_id && doc.conselheiro_providencia_id === currentUser.real_user_id) ||
    (doc.conselheiro_providencia_nome && isUserInTrio(doc.conselheiro_providencia_nome)) ||
    (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.some(nome => isUserInTrio(nome))) ||
    false;

  const isImediata = 
    isActualProvidenciaImediata ||
    doc.conselheiros_providencia_nomes?.some(nome => isUserInTrio(nome)) ||
    false;

  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  const isConselheiro = currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE';
  const canEditTechnicalFields = isActualProvidenciaImediata || isImediata || isADM;
  const canEditIdentifiers = isResponsible || isActualProvidenciaImediata || isADM;
  const canEditViolationOrSipia = isConselheiro || isADM || isResponsible || isActualProvidenciaImediata;

  const isReferenceCounselor = doc.conselheiro_referencia_id === currentUser.id ||
    (currentUser.is_suplente_active && currentUser.real_user_id && doc.conselheiro_referencia_id === currentUser.real_user_id);

  const unreadRefAlerts = useMemo(() => {
    if (!isReferenceCounselor) return [];
    return (doc.alertas_status_referencia || []).filter(a => !a.lido);
  }, [isReferenceCounselor, doc.alertas_status_referencia]);

  // INTELIGÊNCIA SIMCT: Dossiê Familiar Cruzado
  const familyDossier = useMemo(() => {
    const history = allDocuments.filter(d => 
      d.id !== doc.id && (
        (doc.cpf_genitora && d.cpf_genitora === doc.cpf_genitora) || 
        (d.genitora_nome.toUpperCase() === doc.genitora_nome.toUpperCase())
      )
    );

    const childrenNames = new Set<string>();
    const agencies = new Set<string>();
    
    // Inclui dados do prontuário atual
    doc.criancas?.forEach(c => childrenNames.add(c.nome.toUpperCase()));
    agencies.add(doc.origem.toUpperCase());

    // Agrega dados históricos
    history.forEach(h => {
      h.criancas?.forEach(c => childrenNames.add(c.nome.toUpperCase()));
      agencies.add(h.origem.toUpperCase());
    });

    return {
      history,
      totalChildren: childrenNames.size,
      allAgencies: Array.from(agencies).sort(),
      isRecurrent: history.length > 0
    };
  }, [allDocuments, doc]);

  // DIRETRIZ: Alerta de prazo vencido obrigatório
  React.useEffect(() => {
    if (!doc.monitoramento || doc.monitoramento.concluido) return;
    if (doc.conselheiro_referencia_id !== currentUser.id) return;

    const today = new Date();
    today.setHours(0,0,0,0);

    const expired = doc.monitoramento.requisicoes?.find(r => {
      if (r.excluidoDoMonitoramento || r.concluido) return false;
      const deadline = new Date(r.dataFinal);
      deadline.setHours(0,0,0,0);
      return deadline.getTime() < today.getTime();
    });

    if (expired) {
      setExpiredItem(expired);
    } else {
      setExpiredItem(null);
    }
  }, [doc, currentUser]);

  const handleExtendReqDeadline = () => {
    if (!extendingReq || !extForm.nova_data) return;
    
    const requisicoesAtualizadas = doc.monitoramento?.requisicoes?.map(r => 
      r.id === extendingReq.id ? { ...r, dataFinal: extForm.nova_data } : r
    );

    onUpdateDocument(doc.id, {
      monitoramento: {
        ...doc.monitoramento!,
        requisicoes: requisicoesAtualizadas
      }
    });

    onAddLog(doc.id, `MONITORAMENTO: Prazo da requisição [${extendingReq.servico}] alterado.`, 'MONITORAMENTO');
    setExtendingReq(null);
    setExtForm({ nova_data: '' });
  };

  const handleRemoveMonitoring = () => {
    onUpdateDocument(doc.id, {
      monitoramento: {
        ...doc.monitoramento!,
        concluido: true
      }
    });
    onAddLog(doc.id, `MONITORAMENTO: Acompanhamento encerrado para esta família.`, 'MONITORAMENTO');
    setExpiredItem(null);
  };

  const informativeStatusOptions = useMemo(() => {
    const baseKeys: DocumentStatus[] = [
      'REUNIAO_REDE_AGENDADA', 'AGUARDANDO_DOCUMENTO', 'AGUARDAR_RESPOSTA_EMAIL', 'EMAIL_RESPONDIDO',
      'ENCAMINHAR_NOTICIA_FATO', 'NOTIFICAR', 'NOTIFICADO', 'OFICIO_RESPONDIDO',
      'RESPONDER_EMAIL', 'RESPONDER_OFICIO_JUDICIARIO_MP', 'SOLICITAR_REUNIAO_REDE', 'SOLICITAR_REUNIAO_DE_REDE',
      'CONCLUIDO', 'AVALIAR_EM_COLEGIADO', 'MEDIDA_PENDENTE',
      'TIPIFICACAO_INCOMPLETA', 'DIREITO_NAO_VIOLADO', 'NENHUMA', 'AGUARDANDO_AVALIACAO',
      'TODAS_MEDIDAS_APLICADAS', 'MARCAR_REUNIAO_REDE'
    ];

    const counselorsOfUnit = users.filter(u => 
      (u.perfil === 'CONSELHEIRO' || u.perfil === 'SUPLENTE') && 
      u.unidade_id === doc.unidade_id && 
      u.status === 'ATIVO'
    );

    const notificationKeys = counselorsOfUnit.map(
      u => `NOTIFICACAO_${u.nome.toUpperCase()}` as DocumentStatus
    );

    const allKeys = [...baseKeys, ...notificationKeys];
    const uniqueKeys = Array.from(new Set(allKeys));
    return uniqueKeys.sort((a, b) => (STATUS_LABELS[a] || a).localeCompare(STATUS_LABELS[b] || b));
  }, [doc.unidade_id, users]);

  const handleQuickStatusChange = (newStatus: DocumentStatus) => {
    // DIRETRIZ: Apenas o Conselheiro de Providência Imediata possui autonomia para despacho sem validação
    if (!isImediata) return;
    
    const hasTechnical = (doc.violacoesSipia?.length || 0) > 0 || 
                         (doc.medidas_detalhadas?.length || 0) > 0 || 
                         (doc.atribuicoes_136?.length || 0) > 0 ||
                         ((doc.agentesVioladores?.length || 0) > 0 && doc.agentesVioladores?.[0]?.categoria !== 'INEXISTENTE');

    // REGRA: Quando um despacho é selecionado, a validação colegiada não deve aparecer
    let nextStatus: DocumentStatus[] = doc.status.filter(s => s !== 'AGUARDANDO_VALIDACAO');
    
    // Se o novo status já estiver no array, removemos para reinserir no final (tornando-o o atual)
    nextStatus = nextStatus.filter(s => s !== newStatus);
    nextStatus.push(newStatus);

    let updatedAlerts = [...(doc.alertas_status_referencia || [])];
    if (doc.conselheiro_referencia_id && currentUser.id !== doc.conselheiro_referencia_id) {
      const prevStatus = doc.status[doc.status.length - 1] || 'AGUARDANDO_ANALISE';
      const newAlert: AlertaStatusReferencia = {
        id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        documento_id: doc.id,
        conselheiro_referencia_id: doc.conselheiro_referencia_id,
        alterado_por_id: currentUser.id,
        alterado_por_nome: currentUser.nome,
        status_anterior: prevStatus,
        status_novo: newStatus,
        data_hora: new Date().toISOString(),
        lido: false
      };
      updatedAlerts.push(newAlert);
    }

    onUpdateDocument(doc.id, { 
      status: nextStatus,
      alertas_status_referencia: updatedAlerts,
      medidas_detalhadas: (newStatus === 'ARQUIVADO' || newStatus === 'CONCLUIDO') ? [] : doc.medidas_detalhadas
    });
    onAddLog(doc.id, `MOVIMENTAÇÃO ADMINISTRATIVA: Situação alterada para [${STATUS_LABELS[newStatus] || newStatus}]. Alerta enviado ao Conselheiro de Referência.`, 'DOCUMENTO');
  };

  const hasEcaMeasuresInDoc = (doc.medidas_detalhadas || []).some(m => 
    m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
  );
  const hasEcaMeasuresInEdit = selectedMedidas101.length > 0 || selectedMedidas129.length > 0;
  const showCollegiateValidation = hasEcaMeasuresInDoc || (canEditTechnicalFields && hasEcaMeasuresInEdit);

  const validationTracker = useMemo(() => {
    const docDate = doc.data_aporte || doc.data_recebimento || (doc.criado_em ? doc.criado_em.split('T')[0] : '');
    const docTime = doc.hora_aporte || doc.hora_rece_bimento || '12:00';
    const trioRaw = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
      ? doc.conselheiros_providencia_nomes
      : getEffectiveEscala(docDate, docTime, doc.unidade_id, nameMap, scaleExceptions);
    const trio = trioRaw.map(n => (nameMap && nameMap[n.toUpperCase()]) ? nameMap[n.toUpperCase()] : n);
    
    const confirmacoes = (doc.medidas_detalhadas || []).flatMap(m => m.confirmacoes || []);
    const notificacoes = doc.notificacoes_trio || [];

    return trio.map(name => {
      const isNotified = notificacoes.some(n => isSameCounselorName(n, name));
      const match = !isNotified && confirmacoes.find(c => {
        const signatureName = c.usuario_nome.toUpperCase();
        const upperName = name.toUpperCase();
        if (signatureName.includes(upperName)) return true;
        if (INITIAL_USERS.some(iu => iu.id === c.usuario_id && iu.nome.toUpperCase() === upperName)) return true;
        const signingUser = users.find(u => u.id === c.usuario_id);
        if (signingUser && isSameCounselorName(signingUser.nome, name)) return true;
        return isSameCounselorName(c.usuario_nome, name);
      });
      return { 
        name, 
        validated: !!match, 
        timestamp: match ? (match.usuario_nome.split(' - ')[1] || match.data_hora || null) : null,
        needsRevalidation: isNotified || (!match)
      };
    });
  }, [doc.conselheiros_providencia_nomes, doc.medidas_detalhadas, doc.status, doc.data_aporte, doc.hora_aporte, doc.unidade_id, doc.notificacoes_trio, nameMap, scaleExceptions, users]);

  const handleSave = (finalize: boolean) => {
    if (!canEditTechnicalFields) return;

    // VALIDAÇÃO: Local da Ocorrência obrigatório se houver Direito Violado AND Agente Violador
    if (finalize) {
      const hasViolations = tempViolacoes.length > 0;
      const hasAgents = tempAgentes.length > 0 && !tempAgentes.some(a => a.categoria === 'INEXISTENTE');
      
      if (hasViolations && hasAgents && !localOcorrencia) {
        alert("⚠️ O preenchimento do LOCAL DA OCORRÊNCIA é obrigatório quando há Direito Violado e Agente Violador identificados.");
        const section = document.getElementById('local');
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          setActiveSection('local');
        }
        return;
      }
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
    
    // Verificação de alteração técnica para revalidação (Diretriz: Apenas se houver edição ou nova aplicação)
    const currentMedidasInciso = (doc.medidas_detalhadas || []).map(m => m.artigo_inciso).sort();
    const newMedidasInciso = [...selectedMedidas101.map(id => `Art. 101, ${id}`), ...selectedMedidas129.map(id => `Art. 129, ${id}`)].sort();
    const hasMedidasChanged = JSON.stringify(currentMedidasInciso) !== JSON.stringify(newMedidasInciso);
    
    const hasAtribuicoesChanged = JSON.stringify(selectedAtribuicoes.sort()) !== JSON.stringify((doc.atribuicoes_136 || []).sort()) ||
                                  JSON.stringify(atribuicoesDetalhadas) !== JSON.stringify(doc.atribuicoes_136_detalhadas || []);

    const hasViolacoesChanged = JSON.stringify([...tempViolacoes].sort((a, b) => a.especifico.localeCompare(b.especifico))) !== 
                                JSON.stringify([...(doc.violacoesSipia || [])].sort((a, b) => a.especifico.localeCompare(b.especifico)));

    const hasAgentesChanged = JSON.stringify([...tempAgentes].sort((a, b) => a.principal.localeCompare(b.principal))) !== 
                              JSON.stringify([...(doc.agentesVioladores || [])].sort((a, b) => a.principal.localeCompare(b.principal)));

    const wasMedidaAplicadaOrValidated = doc.status.includes('MEDIDA_APLICADA') || (doc.medidas_detalhadas?.[0]?.confirmacoes || []).length > 0;

    const isTechnicalChange = hasMedidasChanged || hasAtribuicoesChanged || hasViolacoesChanged || hasAgentesChanged || (wasMedidaAplicadaOrValidated && isActualProvidenciaImediata);

    // Se houver mudança técnica ou edição de medida, resetamos as validações dos outros para forçar revalidação colegiada
    let confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
    let notificacoesTrio = doc.notificacoes_trio || [];

    const docDate = doc.data_aporte || doc.data_recebimento || (doc.criado_em ? doc.criado_em.split('T')[0] : '');
    const docTime = doc.hora_aporte || doc.hora_rece_bimento || '12:00';
    const preservedTrio = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
      ? doc.conselheiros_providencia_nomes
      : getEffectiveEscala(docDate, docTime, doc.unidade_id, nameMap, scaleExceptions);

    if (isTechnicalChange && isActualProvidenciaImediata) {
      // REFORÇO: Se houver mudança técnica / edição da Medida Aplicada, invalidamos assinaturas anteriores dos outros e notificamos o trio original
      confirmacoes = confirmacoes.filter(c => c.usuario_id === currentUser.id);
      notificacoesTrio = preservedTrio.filter(nome => !isUserInTrio(nome));
    }
    
    const mySignature = { usuario_id: currentUser.id, usuario_nome: `${currentUser.nome} - ${formattedDate}`, data_hora: now.toISOString() };
    if (!confirmacoes.some(c => c.usuario_id === currentUser.id)) {
      confirmacoes.push(mySignature);
      // Ao assinar, remove o próprio nome das notificações pendentes
      notificacoesTrio = notificacoesTrio.filter(nome => !isUserInTrio(nome));
    }

    let combinedMedidas: MedidaAplicada[] = [
      ...selectedMedidas101.map(id => ({ 
        id: `med-101-${id}-${Date.now()}`, 
        artigo_inciso: `Art. 101, ${id}`, 
        texto: MEDIDAS_101_ECA.find(m => m.id === id)?.label || '', 
        autor_id: currentUser.id, 
        autor_nome: currentUser.nome, 
        data_lancamento: now.toISOString(), 
        conselheiros_requeridos: preservedTrio, 
        confirmacoes 
      })),
      ...selectedMedidas129.map(id => ({ 
        id: `med-129-${id}-${Date.now()}`, 
        artigo_inciso: `Art. 129, ${id}`, 
        texto: MEDIDAS_129_ECA.find(m => m.id === id)?.label || '', 
        autor_id: currentUser.id, 
        autor_nome: currentUser.nome, 
        data_lancamento: now.toISOString(), 
        conselheiros_requeridos: preservedTrio, 
        confirmacoes 
      }))
    ];

    // DIRETRIZ 93: Sincronização automática com Monitoramento
    const novasRequisicoesMonitoramento = atribuicoesDetalhadas.flatMap(attr => 
      (attr.servicos || []).map(s => {
        let prazoLabel = s.prazo;
        let dias = 0;
        if (s.prazo === '24H') dias = 1;
        else if (s.prazo === '48H') dias = 2;
        else if (s.prazo === '05 DIAS') dias = 5;
        else if (s.prazo === '10 DIAS') dias = 10;
        else if (s.prazo === '15 DIAS') dias = 15;
        else if (s.prazo === 'CUSTOM') {
          dias = parseInt(s.prazo_custom || '0');
          prazoLabel = `${dias} DIAS`;
        }

        const dataFinal = new Date();
        dataFinal.setDate(dataFinal.getDate() + dias);

        return {
          id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          area: attr.area || attr.inciso,
          servico: s.servico === 'OUTROS SERVIÇOS / FORA DA REDE' ? (s.servico_custom || 'OUTRO SERVIÇO') : s.servico,
          prazo: prazoLabel,
          dataFinal: dataFinal.toISOString(),
          concluido: false,
          observacao: s.observacao,
          isForaDaRede: s.servico === 'OUTROS SERVIÇOS / FORA DA REDE'
        };
      })
    );

    const monitoramentoAtualizado = {
      ...doc.monitoramento,
      concluido: false,
      requisicoes: [...(doc.monitoramento?.requisicoes || []), ...novasRequisicoesMonitoramento]
    };

    const currentStatus = doc.status[doc.status.length - 1];
    const isInformative = informativeStatusOptions.includes(currentStatus);
    
    const hasEcaMeasuresInCombined = combinedMedidas.some(m => 
      m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
    );

    let statusFinal: DocumentStatus[] = [...doc.status];
    
    if (!hasEcaMeasuresInCombined) {
      // REGRA EXPLICITA: A validação do colegiado só deve APLICAR/APARECER se houver MEDIDA ECA selecionada e confirmada.
      statusFinal = statusFinal.filter(s => s !== 'AGUARDANDO_VALIDACAO' && s !== 'MEDIDA_APLICADA');
      if (finalize && !isInformative && !statusFinal.includes('CONCLUIDO')) {
        statusFinal.push('CONCLUIDO');
      }
      notificacoesTrio = [];
    } else if (finalize) {
      if (isImprocedente) {
        statusFinal = [...doc.status.filter(s => s !== 'AGUARDANDO_VALIDACAO' && s !== 'MEDIDA_APLICADA'), 'DIREITO_NAO_VIOLADO'];
      } else if (isTechnicalChange) {
        // REGRA: Edições técnicas em Medidas ECA obrigam revalidação pelo MESMO trio original
        statusFinal = statusFinal.filter(s => s !== 'MEDIDA_APLICADA');
        if (!statusFinal.includes('AGUARDANDO_VALIDACAO')) {
          statusFinal.push('AGUARDANDO_VALIDACAO');
        }

        // Notificar automaticamente os outros membros do trio original
        const outrosDoTrio = preservedTrio.filter(nome => !isUserInTrio(nome));
        const novasNotificacoes = [...notificacoesTrio];
        outrosDoTrio.forEach(nome => {
          if (!novasNotificacoes.includes(nome)) novasNotificacoes.push(nome);
        });
        notificacoesTrio = novasNotificacoes;

      } else if (isInformative) {
        statusFinal = statusFinal.filter(s => s !== 'AGUARDANDO_VALIDACAO');
      } else {
        if (!statusFinal.includes('AGUARDANDO_VALIDACAO') && !statusFinal.includes('MEDIDA_APLICADA')) {
          statusFinal.push('AGUARDANDO_VALIDACAO');
        }
      }
    } else {
      if (!isInformative && currentStatus !== 'EM_PREENCHIMENTO') {
        statusFinal = [...doc.status, 'EM_PREENCHIMENTO'];
      }
    }

    const prevLatest = doc.status[doc.status.length - 1];
    const newLatest = statusFinal[statusFinal.length - 1];
    let updatedAlerts = [...(doc.alertas_status_referencia || [])];
    if (newLatest && prevLatest !== newLatest && doc.conselheiro_referencia_id && currentUser.id !== doc.conselheiro_referencia_id) {
      updatedAlerts.push({
        id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        documento_id: doc.id,
        conselheiro_referencia_id: doc.conselheiro_referencia_id,
        alterado_por_id: currentUser.id,
        alterado_por_nome: currentUser.nome,
        status_anterior: prevLatest || 'AGUARDANDO_ANALISE',
        status_novo: newLatest,
        data_hora: new Date().toISOString(),
        lido: false
      });
    }

    onUpdateDocument(doc.id, { 
      violacoesSipia: isImprocedente ? [] : tempViolacoes, 
      agentesVioladores: isImprocedente ? [{ categoria: 'INEXISTENTE', principal: 'FATO NÃO COMPROVADO', tipo: 'PRINCIPAL' }] : tempAgentes, 
      medidas_detalhadas: combinedMedidas, 
      atribuicoes_136: selectedAtribuicoes,
      atribuicoes_136_detalhadas: atribuicoesDetalhadas,
      status: statusFinal,
      alertas_status_referencia: updatedAlerts,
      relato_providencias: relatoProvidencias,
      despacho_situacao: despachoSituacao,
      is_improcedente: isImprocedente,
      monitoramento: monitoramentoAtualizado,
      notificacoes_trio: notificacoesTrio,
      conselheiros_providencia_nomes: preservedTrio,
      local_ocorrencia: localOcorrencia,
      numero_comunicado_violacao: numeroComunicadoViolacao,
      numero_sipia: numeroSipia,
      informacoes_documento: informacoesDocumento
    });
    
    try {
      localStorage.removeItem(draftKey);
    } catch {}

    onAddLog(doc.id, finalize ? `EDIÇÃO TÉCNICA: Medidas/Atribuições alteradas. REVALIDAÇÃO COLEGIADA OBRIGATÓRIA.` : `RASCUNHO TÉCNICO: Prontuário atualizado.`, 'DOCUMENTO');
    onBack();
  };

  const handleValidate = (targetSlotName?: string | React.MouseEvent) => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    
    const docDate = doc.data_aporte || doc.data_recebimento || (doc.criado_em ? doc.criado_em.split('T')[0] : '');
    const docTime = doc.hora_aporte || doc.hora_rece_bimento || '12:00';
    const trioRaw = (doc.conselheiros_providencia_nomes && doc.conselheiros_providencia_nomes.length > 0)
      ? doc.conselheiros_providencia_nomes
      : getEffectiveEscala(docDate, docTime, doc.unidade_id, nameMap, scaleExceptions);
    const trio = trioRaw.map(n => (nameMap && nameMap[n.toUpperCase()]) ? nameMap[n.toUpperCase()] : n);

    let slotsToValidate: string[] = [];
    if (typeof targetSlotName === 'string' && targetSlotName.trim()) {
      slotsToValidate = [targetSlotName.trim()];
    } else {
      const pendingInTrio = validationTracker.filter(v => !v.validated || v.needsRevalidation).map(v => v.name);
      const mySlot = pendingInTrio.find(name => isUserInTrio(name));
      if (mySlot) {
        slotsToValidate = [mySlot];
      } else if (pendingInTrio.length > 0) {
        slotsToValidate = pendingInTrio;
      }
    }

    if (slotsToValidate.length === 0) return;

    const existingMedidas = (doc.medidas_detalhadas && doc.medidas_detalhadas.length > 0)
      ? doc.medidas_detalhadas
      : [{ artigo_inciso: 'Medida Aplicada / Providência Registrada', confirmacoes: [] }];

    const updated = existingMedidas.map(m => {
      let currentConfirmations = [...(m.confirmacoes || [])];

      slotsToValidate.forEach(slotName => {
        const isSelf = isSameCounselorName(slotName, currentUser.nome);
        const signatureText = isSelf
          ? `${currentUser.nome} - ${formattedDate}`
          : `${slotName} (por ${currentUser.nome}) - ${formattedDate}`;

        currentConfirmations = currentConfirmations.filter(c => {
          if (c.usuario_id === currentUser.id && isSelf) return false;
          if (isSameCounselorName(c.usuario_nome, slotName)) return false;
          if (c.usuario_nome.toUpperCase().includes(slotName.toUpperCase())) return false;
          return true;
        });

        currentConfirmations.push({
          usuario_id: currentUser.id,
          usuario_nome: signatureText,
          data_hora: now.toISOString()
        });
      });

      return {
        ...m,
        confirmacoes: currentConfirmations
      };
    });

    const newConfirmacoes = updated[0]?.confirmacoes || [];

    const validatedCount = trio.filter(trioMemberName => {
      return newConfirmacoes.some(c => {
        const signatureName = c.usuario_nome.toUpperCase();
        const upperTrioMember = trioMemberName.toUpperCase();
        if (signatureName.includes(upperTrioMember)) return true;
        if (isSameCounselorName(c.usuario_nome, trioMemberName)) return true;
        const signingUser = users.find(u => u.id === c.usuario_id);
        if (signingUser && isSameCounselorName(signingUser.nome, trioMemberName)) return true;
        return false;
      });
    }).length;

    const trioSize = trio.length > 0 ? trio.length : 3;
    let nextStatus = [...doc.status];

    if (validatedCount >= trioSize) { 
      nextStatus = nextStatus.filter(s => s !== 'AGUARDANDO_VALIDACAO'); 
      if (!nextStatus.includes('MEDIDA_APLICADA')) {
        nextStatus.push('MEDIDA_APLICADA');
      }
    } else {
      if (!nextStatus.includes('AGUARDANDO_VALIDACAO')) {
        nextStatus.push('AGUARDANDO_VALIDACAO');
      }
    }
    
    const nextNotificacoes = (doc.notificacoes_trio || []).filter(nome => 
      !slotsToValidate.some(slotName => isSameCounselorName(nome, slotName) || isSameCounselorName(nome, currentUser.nome))
    );

    const prevLatest = doc.status[doc.status.length - 1];
    const newLatest = nextStatus[nextStatus.length - 1];
    let updatedAlerts = [...(doc.alertas_status_referencia || [])];
    if (newLatest && prevLatest !== newLatest && doc.conselheiro_referencia_id && currentUser.id !== doc.conselheiro_referencia_id) {
      updatedAlerts.push({
        id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        documento_id: doc.id,
        conselheiro_referencia_id: doc.conselheiro_referencia_id,
        alterado_por_id: currentUser.id,
        alterado_por_nome: currentUser.nome,
        status_anterior: prevLatest || 'AGUARDANDO_ANALISE',
        status_novo: newLatest,
        data_hora: new Date().toISOString(),
        lido: false
      });
    }

    onUpdateDocument(doc.id, { 
      medidas_detalhadas: updated, 
      status: nextStatus,
      alertas_status_referencia: updatedAlerts,
      notificacoes_trio: nextNotificacoes
    });

    onAddLog(
      doc.id, 
      validatedCount >= trioSize 
        ? `VALIDAÇÃO TÉCNICA CONCLUÍDA: Todos os ${trioSize} conselheiros do trio de imediata validaram. Status atualizado automaticamente para [Medida Aplicada] por ${currentUser.nome}.`
        : `VALIDAÇÃO TÉCNICA: Assinatura confirmada por ${currentUser.nome} para [${slotsToValidate.join(', ')}] (${validatedCount}/${trioSize} validações).`, 
      'VALIDAÇÃO'
    );
  };

  const rawProvName = users.find(u => u.id === doc.conselheiro_providencia_id)?.nome || doc.conselheiro_providencia_nome || 'Não Encontrado';
  const provName = (rawProvName && nameMap && nameMap[rawProvName.toUpperCase()]) ? nameMap[rawProvName.toUpperCase()] : rawProvName;

  const rawRefName = users.find(u => u.id === doc.conselheiro_referencia_id)?.nome || doc.conselheiro_referencia_nome || 'Não Encontrado';
  const refName = (rawRefName && nameMap && nameMap[rawRefName.toUpperCase()]) ? nameMap[rawRefName.toUpperCase()] : rawRefName;

  const isLocalMandatory = tempViolacoes.length > 0 && tempAgentes.length > 0 && !tempAgentes.some(a => a.categoria === 'INEXISTENTE');

  return (
    <>
      <div className="max-w-6xl mx-auto pb-40 animate-in fade-in flex flex-col gap-10">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <header className="p-8 bg-[#111827] text-white flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[12px] uppercase tracking-wider transition-all" title="Voltar para a tela anterior"><ArrowLeft className="w-5 h-5" /> <span>Voltar</span></button>
          <div className="text-center"><h2 className="text-[20px] font-black uppercase">{doc.crianca_nome}</h2><p className="text-[10px] opacity-60 uppercase">SIMCT #{doc.id}</p></div>
          <div className="flex items-center gap-3">
            {(isADM || isResponsible) && (
              <button 
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-wider transition-all shadow-md cursor-pointer"
                title="Editar Informações do Documento"
              >
                <FileText className="w-4 h-4" />
                <span>Editar Documento</span>
              </button>
            )}
            {(hasCounselorActions => {
               const isLeandroOrSuperAdmin = (currentUser.nome?.toUpperCase() === 'LEANDRO' || currentUser.perfil === 'ADMIN');
               const isCreatorAdmin = 
                 (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO' || currentUser.nome?.toUpperCase() === 'LEANDRO');
               
               return isLeandroOrSuperAdmin || (isCreatorAdmin && !hasCounselorActions);
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
                onClick={() => setShowDeleteConfirm(true)}
                className="p-3 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-2xl transition-all"
                title="Excluir Prontuário"
              >
                <Trash2 className="w-6 h-6" />
              </button>
            )}
          </div>
        </header>

        {/* INFO CARDS (Diretriz: Hierarquia Visual de Identidade) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8 bg-slate-50 border-b border-slate-200">
           <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><UserCog className="w-5 h-5" /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referência Fixa</p>
                 <p className="text-[13px] font-black text-slate-800 uppercase">{refName}</p>
              </div>
           </div>
           <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><Zap className="w-5 h-5" /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Atendimento Imediato</p>
                 <p className="text-[13px] font-black text-slate-800 uppercase">{provName}</p>
              </div>
           </div>
        </div>

        {/* ALERTA DE CIÊNCIA AO CONSELHEIRO DE REFERÊNCIA */}
        {unreadRefAlerts.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-300 p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4 text-amber-950">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <BellRing className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black uppercase tracking-tight text-amber-950">
                    Alerta para o Conselheiro de Referência
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-200 border border-amber-300 text-amber-900 text-[10px] font-bold uppercase">
                    Ciência Pendente
                  </span>
                </div>
                <div className="space-y-1 mt-1 text-xs text-amber-900 font-medium">
                  {unreadRefAlerts.map(a => (
                    <p key={a.id}>
                      O conselheiro de providência imediata <strong>{a.alterado_por_nome}</strong> alterou a situação deste prontuário de <span className="underline font-bold">[{STATUS_LABELS[a.status_anterior as DocumentStatus] || a.status_anterior}]</span> para <strong className="text-amber-950 bg-amber-200/80 px-1.5 py-0.5 rounded font-bold">[{STATUS_LABELS[a.status_novo as DocumentStatus] || a.status_novo}]</strong> em {new Date(a.data_hora).toLocaleString('pt-BR')}.
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                unreadRefAlerts.forEach(a => onScience(doc.id, a.id));
              }}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer self-end md:self-center"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Registrar Ciência</span>
            </button>
          </div>
        )}

        {/* ALERTA DE DOCUMENTO URGENTE PARA PROVIDÊNCIA IMEDIATA */}
        {doc.is_urgente && (
          <div className="bg-rose-600 text-white p-5 px-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg border-b-2 border-rose-700 animate-pulse">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 shrink-0 text-white animate-bounce" />
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-wider">
                  🚨 DOCUMENTO URGENTE - PROVIDÊNCIA IMEDIATA REQUERIDA
                </h4>
                <p className="text-[11px] font-bold uppercase opacity-95">
                  Este prontuário exige providência imediata sob responsabilidade do Conselheiro:{' '}
                  <span className="underline font-black bg-rose-800/80 px-2 py-0.5 rounded ml-1">
                    {doc.conselheiro_providencia_nome || 'Designado pelo Sistema'}
                  </span>
                </p>
              </div>
            </div>
            {isActualProvidenciaImediata && (
              <div className="px-4 py-2 bg-white text-rose-700 rounded-xl font-black text-[11px] uppercase shadow-md shrink-0 border border-rose-200 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>VOCÊ É O CONSELHEIRO DE PROVIDÊNCIA IMEDIATA</span>
              </div>
            )}
          </div>
        )}

        {/* ALERTA DE REVALIDAÇÃO OBRIGATÓRIA OU VALIDAÇÃO PENDENTE */}
        {showCollegiateValidation && (((doc.notificacoes_trio || []).some(n => isUserInTrio(n) || (nameMap && isUserInTrio(nameMap[n.toUpperCase()]))) || doc.status.includes('AGUARDANDO_VALIDACAO'))) && (
          <div className="bg-gradient-to-r from-amber-600 to-red-600 p-6 flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse">
            <div className="flex items-center gap-4 text-white">
              <ShieldAlert className="w-8 h-8 shrink-0" />
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-tighter">Atenção: Validação / Revalidação Pendente</h4>
                <p className="text-[11px] font-bold uppercase opacity-90">Este prontuário possui medidas/atribuições aguardando validação do colegiado.</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleValidate()}
                className="px-6 py-3 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-[11px] font-black uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Validar & Assinar Agora</span>
              </button>
              <button 
                onClick={() => {
                  const section = document.getElementById('validacao-trio');
                  if (section) section.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-3 bg-black/20 hover:bg-black/30 text-white rounded-xl text-[10px] font-black uppercase transition-all border border-white/20 cursor-pointer shrink-0"
              >
                Ver Detalhes
              </button>
            </div>
          </div>
        )}

        <div className="p-10 space-y-10">
          {/* IDENTIFICAÇÃO DO PROCEDIMENTO */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <Fingerprint className="w-5 h-5 text-slate-400" />
              <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">Dados de Identificação do Procedimento</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº Ofício / Documento</span>
                {canEditIdentifiers ? (
                  <input
                    type="text"
                    className="w-full mt-1 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] font-black text-slate-800 uppercase outline-none focus:border-blue-500 shadow-sm"
                    value={informacoesDocumento}
                    onChange={(e) => setInformacoesDocumento(e.target.value.toUpperCase())}
                    onBlur={() => onUpdateDocument(doc.id, { informacoes_documento: informacoesDocumento })}
                    placeholder="DIGITE..."
                  />
                ) : (
                  <span className="text-[12px] font-black text-slate-800 uppercase">{doc.informacoes_documento || 'N/A'}</span>
                )}
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº Com. de Violação</span>
                {canEditViolationOrSipia ? (
                  <input
                    type="text"
                    className="w-full mt-1 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] font-black text-slate-800 uppercase outline-none focus:border-blue-500 shadow-sm"
                    value={numeroComunicadoViolacao}
                    onChange={(e) => setNumeroComunicadoViolacao(e.target.value.toUpperCase())}
                    onBlur={() => {
                      if (numeroComunicadoViolacao !== (doc.numero_comunicado_violacao || '')) {
                        onUpdateDocument(doc.id, { numero_comunicado_violacao: numeroComunicadoViolacao });
                        onAddLog(doc.id, `IDENTIFICAÇÃO: Nº Com. de Violação atualizado para "${numeroComunicadoViolacao}" por ${currentUser.nome}.`, 'DOCUMENTO');
                      }
                    }}
                    placeholder="DIGITE..."
                  />
                ) : (
                  <span className="text-[12px] font-black text-slate-800 uppercase">{doc.numero_comunicado_violacao || 'N/A'}</span>
                )}
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nº Procedimento / SIPIA</span>
                {canEditViolationOrSipia ? (
                  <input
                    type="text"
                    className="w-full mt-1 bg-white px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] font-black text-slate-800 uppercase outline-none focus:border-blue-500 shadow-sm"
                    value={numeroSipia}
                    onChange={(e) => setNumeroSipia(e.target.value.toUpperCase())}
                    onBlur={() => {
                      if (numeroSipia !== (doc.numero_sipia || '')) {
                        onUpdateDocument(doc.id, { numero_sipia: numeroSipia });
                        onAddLog(doc.id, `IDENTIFICAÇÃO: Nº Procedimento / SIPIA atualizado para "${numeroSipia}" por ${currentUser.nome}.`, 'DOCUMENTO');
                      }
                    }}
                    placeholder="DIGITE..."
                  />
                ) : (
                  <span className="text-[12px] font-black text-slate-800 uppercase">{doc.numero_sipia || 'N/A'}</span>
                )}
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origem do Caso</span>
                <span className="text-[12px] font-black text-slate-800 uppercase">{doc.origem || 'N/A'}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Aporte</span>
                <span className="text-[12px] font-black text-slate-800 uppercase">{doc.data_aporte ? formatLocalDateString(doc.data_aporte) : 'N/A'}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora de Aporte</span>
                <span className="text-[12px] font-black text-slate-800 uppercase">{doc.hora_aporte || 'N/A'}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Canal de Comunicado</span>
                <span className="text-[12px] font-black text-slate-800 uppercase">{doc.canal_comunicado || 'N/A'}</span>
              </div>
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-1 hover:border-slate-300 transition-all">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Notificação</span>
                <span className="text-[12px] font-black text-slate-800 uppercase">{doc.notificacao || 'NENHUMA'}</span>
              </div>
            </div>

            {/* IDENTIFICAÇÃO FAMILIAR */}
            <div className="p-6 bg-slate-50/80 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">Identificação do Núcleo Familiar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Genitora / Genitor / Responsável</span>
                  <span className="text-[12px] font-black text-slate-800 uppercase">{doc.genitora_nome || 'NÃO INFORMADO'}</span>
                  {doc.cpf_genitora && <span className="text-[10px] font-bold text-slate-500 font-mono">CPF: {doc.cpf_genitora}</span>}
                </div>

                {doc.outro_membro_nome && (
                  <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-200/60 flex flex-col gap-1">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">
                      Outro Membro da Família ({doc.outro_membro_parentesco || 'FAMILIAR'})
                    </span>
                    <span className="text-[12px] font-black text-slate-800 uppercase">{doc.outro_membro_nome}</span>
                    {doc.outro_membro_cpf && <span className="text-[10px] font-bold text-slate-600 font-mono">CPF: {doc.outro_membro_cpf}</span>}
                  </div>
                )}

                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 flex flex-col gap-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bairro de Residência</span>
                  <span className="text-[12px] font-black text-slate-800 uppercase">{doc.bairro || 'NÃO INFORMADO'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-2">
              <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                <LayoutList className="w-4 h-4" /> Relato Inicial / Objeto da Demanda
              </label>
              <div className="p-4 bg-white rounded-2xl border border-blue-100 text-[13px] font-bold text-slate-700 uppercase leading-relaxed whitespace-pre-wrap">
                {doc.observacoes_iniciais || 'NÃO INFORMADO'}
              </div>
            </div>
          </section>

          {/* PROVIDÊNCIA DA SITUAÇÃO */}
          <section className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
               <Tag className="w-5 h-5 text-indigo-600" />
               <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">PROVIDÊNCIA DA SITUAÇÃO</h3>
            </div>
            <div className="space-y-2">
               <textarea 
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-500 shadow-sm min-h-[140px]"
                  placeholder="DIGITE A SUA PROVIDÊNCIA DA SITUAÇÃO DE FORMA MANUAL..."
                  value={despachoSituacao}
                  onChange={(e) => setDespachoSituacao(e.target.value)}
                  onBlur={() => onUpdateDocument(doc.id, { despacho_situacao: despachoSituacao })}
                  disabled={!isConselheiro}
               />
               <span className="text-[9px] text-slate-400 font-bold block ml-1 uppercase">
                  * Este é um campo de preenchimento manual personalizado de uso exclusivo dos Conselheiros Tutelares.
               </span>
            </div>
          </section>

          {isImediata && !isActualProvidenciaImediata && (
            <div id="visualizacao-plantao-alerta" className="p-6 bg-blue-50 border border-blue-100 rounded-[2rem] flex items-center gap-4 text-blue-800 mb-4 shadow-sm animate-in fade-in duration-300">
              <Users className="w-6 h-6 flex-shrink-0 text-blue-600" />
              <div className="text-[11px] font-bold uppercase">
                Modo de Visualização (Colega de Plantão): Apenas o Conselheiro de Providência Imediata (<span className="text-blue-900 font-black">{doc.conselheiro_providencia_nome || 'designado'}</span>) possui autonomia para alterar as medidas. Seu papel é analisar e validar/assinar no final da página.
              </div>
            </div>
          )}

          {/* ACORDEÕES TÉCNICOS */}
          <div className="space-y-4">
            <div 
              onClick={() => {
                if (!canEditTechnicalFields) return;
                const next = !isImprocedente;
                setIsImprocedente(next);
                if (next) {
                  setTempViolacoes([]);
                  setTempAgentes([]);
                  onUpdateDocument(doc.id, { is_improcedente: true, violacoesSipia: [], agentesVioladores: [] });
                } else {
                  onUpdateDocument(doc.id, { is_improcedente: false });
                }
              }}
              className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-center justify-between ${isImprocedente ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}
            >
              <div className="flex items-center gap-4">
                {isImprocedente ? <Ban className="w-6 h-6 text-red-500" /> : <ShieldAlert className="w-6 h-6 opacity-30" />}
                <span className="text-[14px] font-black uppercase tracking-widest">Direito não Violado / Improcedente</span>
              </div>
              {isImprocedente && <CheckCircle2 className="w-6 h-6 text-emerald-500" />}
            </div>

            {!isImprocedente && (
              <>
                <AccordionSection id="direito" title="Direito Violado" color="bg-blue-600" active={activeSection} onToggle={setActiveSection} saved={tempViolacoes.length > 0}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(SIPIA_HIERARCHY).map(([fund, grps]) => (
                      <div key={fund} className="space-y-2">
                        <div className="text-[10px] font-black text-blue-800 uppercase border-b border-blue-100 pb-1">{fund}</div>
                        {Object.entries(grps).map(([grp, items]) => (
                          <div key={grp} className="pl-2 space-y-1">
                            <div className="text-[9px] font-bold text-slate-400 uppercase">{grp}</div>
                             {items.map(item => (
                               <div 
                                 key={item} 
                                 onClick={() => {
                                   if (!canEditTechnicalFields) return;
                                   const nextViolacoes = tempViolacoes.some(v => v.especifico === item) 
                                     ? tempViolacoes.filter(v => v.especifico !== item) 
                                     : [...tempViolacoes, { fundamental: fund, grupo: grp, especifico: item }];
                                   setTempViolacoes(nextViolacoes);
                                   onUpdateDocument(doc.id, { violacoesSipia: nextViolacoes });
                                 }} 
                                 className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[10px] uppercase font-bold transition-all ${tempViolacoes.some(v => v.especifico === item) ? 'bg-blue-600 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}
                               >
                                 {tempViolacoes.some(v => v.especifico === item) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-20" />} 
                                 {item}
                               </div>
                             ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection id="agente" title="Agente Violador" color="bg-orange-500" active={activeSection} onToggle={setActiveSection} saved={tempAgentes.length > 0}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(AGENTES_VIOLADORES_ESTRUTURA).map(([cat, info]) => (
                      <div key={cat} className="space-y-2">
                        <div className="text-[10px] font-black text-orange-800 uppercase border-b border-orange-100 pb-1">{cat}</div>
                        {info.options.map(opt => (
                          <div 
                            key={opt} 
                            onClick={() => {
                              if (!canEditTechnicalFields) return;
                              const nextAgentes: AgenteVioladorEntry[] = tempAgentes.some(a => a.principal === opt) 
                                ? tempAgentes.filter(a => a.principal !== opt) 
                                : [...tempAgentes, {categoria: cat, principal: opt, tipo: 'PRINCIPAL' as const}];
                              setTempAgentes(nextAgentes);
                              onUpdateDocument(doc.id, { agentesVioladores: nextAgentes });
                            }} 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[10px] uppercase font-bold transition-all ${tempAgentes.some(a => a.principal === opt) ? 'bg-orange-500 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            {tempAgentes.some(a => a.principal === opt) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-20" />} 
                            {opt}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </AccordionSection>

                <AccordionSection 
                  id="quem_comunicou" 
                  title="Quem Comunicou a Violação" 
                  color="bg-sky-600" 
                  active={activeSection} 
                  onToggle={setActiveSection} 
                  saved={Boolean(quemComunicouClassificado || doc.quem_comunicou_classificado)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1 border-b border-sky-100/60">
                      <span className="text-[10px] font-black text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-sky-600" />
                        Identificação da Origem do Comunicado
                      </span>
                      {(origemCategoria || origemInstituicao || canalComunicado || customOrigem) && (
                        <button
                          type="button"
                          disabled={!canEditTechnicalFields}
                          onClick={() => {
                            setOrigemCategoria('');
                            setOrigemInstituicao('');
                            setCanalComunicado('');
                            setCustomOrigem('');
                            setQuemComunicouClassificado(false);
                            handleUpdateOrigem('', '', '', false);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs active:scale-95"
                          title="Resetar e limpar todos os campos"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Resetar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* COLUNA 1: CATEGORIA */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                        <select 
                          disabled={!canEditTechnicalFields}
                          className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-[1.25rem] font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-sky-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          value={origemCategoria}
                          onChange={e => {
                            const nextCat = e.target.value;
                            setOrigemCategoria(nextCat);
                            setOrigemInstituicao('');
                            setCustomOrigem('');
                            handleUpdateOrigem(nextCat, '', canalComunicado);
                          }}
                        >
                          <option value="">SELECIONE CATEGORIA...</option>
                          {unitOrigensHierarquicas.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                        </select>
                      </div>

                      {/* COLUNA 2: INSTITUIÇÃO */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instituição</label>
                        <SearchableSelect
                          disabled={!canEditTechnicalFields || !origemCategoria || origemCategoria === 'SOCIEDADE'}
                          className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-[1.25rem] font-bold uppercase text-[10px] sm:text-[11px] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                          placeholder={origemCategoria === 'SOCIEDADE' ? "NÃO SE APLICA (SOCIEDADE)" : "SELECIONE INSTITUIÇÃO..."}
                          options={[...currentInstitutions].sort((a, b) => a.localeCompare(b))}
                          value={origemCategoria === 'SOCIEDADE' ? '' : origemInstituicao}
                          onChange={val => {
                            setOrigemInstituicao(val);
                            if (val === 'OUTRO' || val === 'OUTROS') {
                              handleUpdateOrigem(origemCategoria, customOrigem || val, canalComunicado);
                            } else {
                              setCustomOrigem('');
                              handleUpdateOrigem(origemCategoria, val, canalComunicado);
                            }
                          }}
                        />
                      </div>

                      {/* COLUNA 3: CANAL */}
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal</label>
                        <select 
                          disabled={!canEditTechnicalFields}
                          className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl sm:rounded-[1.25rem] font-bold uppercase text-[10px] sm:text-[11px] outline-none focus:border-sky-500 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          value={canalComunicado}
                          onChange={e => {
                            const nextCanal = e.target.value;
                            setCanalComunicado(nextCanal);
                            handleUpdateOrigem(origemCategoria, origemCategoria === 'SOCIEDADE' ? '' : (origemInstituicao === 'OUTRO' || origemInstituicao === 'OUTROS' ? customOrigem : origemInstituicao), nextCanal);
                          }}
                        >
                          <option value="">SELECIONE CANAL...</option>
                          {CANAIS_COMUNICADO_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    {origemCategoria !== 'SOCIEDADE' && (origemInstituicao === 'OUTRO' || origemInstituicao === 'OUTROS' || (origemInstituicao && !currentInstitutions.includes(origemInstituicao))) && (
                      <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                        <div className="p-4 bg-white rounded-2xl border border-sky-100 space-y-2">
                          <label className="text-[10px] font-black text-sky-600 uppercase tracking-widest leading-none">Descreva a Instituição / Escola não cadastrada</label>
                          <input 
                            disabled={!canEditTechnicalFields}
                            type="text"
                            placeholder="DIGITE O NOME OU DESCRIÇÃO DA INSTITUIÇÃO..."
                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-sky-500 shadow-inner disabled:opacity-50"
                            value={customOrigem || (origemInstituicao !== 'OUTRO' && origemInstituicao !== 'OUTROS' && !currentInstitutions.includes(origemInstituicao) ? origemInstituicao : '')}
                            onChange={e => {
                              const val = e.target.value.toUpperCase();
                              setCustomOrigem(val);
                              handleUpdateOrigem(origemCategoria, val, canalComunicado);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionSection>

                <AccordionSection id="local" title={isLocalMandatory ? "Local da Ocorrência (Obrigatório)" : "Local da Ocorrência"} color="bg-slate-700" active={activeSection} onToggle={setActiveSection} saved={!!localOcorrencia}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {LOCAL_OCORRENCIA_OPTIONS.map(opt => {
                        const isOutro = opt === 'OUTRO';
                        const isSelected = isOutro 
                          ? Boolean(localOcorrencia && (localOcorrencia === 'OUTRO' || localOcorrencia.startsWith('OUTRO:') || localOcorrencia.startsWith('OUTRO -') || !LOCAL_OCORRENCIA_OPTIONS.filter(o => o !== 'OUTRO').includes(localOcorrencia)))
                          : localOcorrencia === opt;

                        return (
                          <div 
                            key={opt} 
                            onClick={() => {
                              if (!canEditTechnicalFields) return;
                              if (isSelected) {
                                setLocalOcorrencia('');
                                setCustomLocalText('');
                                onUpdateDocument(doc.id, { local_ocorrencia: '' });
                              } else {
                                if (isOutro) {
                                  const nextVal = customLocalText.trim() ? `OUTRO: ${customLocalText.trim().toUpperCase()}` : 'OUTRO';
                                  setLocalOcorrencia(nextVal);
                                  onUpdateDocument(doc.id, { local_ocorrencia: nextVal });
                                } else {
                                  setLocalOcorrencia(opt);
                                  onUpdateDocument(doc.id, { local_ocorrencia: opt });
                                }
                              }
                            }} 
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-[10px] uppercase font-bold transition-all ${isSelected ? 'bg-slate-700 text-white shadow-sm' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 opacity-20" />} 
                            {opt}
                          </div>
                        );
                      })}
                    </div>

                    {/* Campo de preenchimento para especificar o local exato quando a opção OUTRO estiver acionada */}
                    {Boolean(localOcorrencia && (localOcorrencia === 'OUTRO' || localOcorrencia.startsWith('OUTRO:') || localOcorrencia.startsWith('OUTRO -') || !LOCAL_OCORRENCIA_OPTIONS.filter(o => o !== 'OUTRO').includes(localOcorrencia))) && (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-fadeIn">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          Especifique o Local Exato da Ocorrência:
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            disabled={!canEditTechnicalFields}
                            placeholder="Digite o local exato (ex: Terreno baldio, Estação rodoviária, Praça central, etc.)..."
                            value={customLocalText}
                            onChange={e => {
                              const val = e.target.value;
                              setCustomLocalText(val);
                              const nextVal = val.trim() ? `OUTRO: ${val.trim().toUpperCase()}` : 'OUTRO';
                              setLocalOcorrencia(nextVal);
                            }}
                            onBlur={() => {
                              if (!canEditTechnicalFields) return;
                              const nextVal = customLocalText.trim() ? `OUTRO: ${customLocalText.trim().toUpperCase()}` : 'OUTRO';
                              setLocalOcorrencia(nextVal);
                              onUpdateDocument(doc.id, { local_ocorrencia: nextVal });
                            }}
                            className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:ring-2 focus:ring-slate-500 focus:outline-none placeholder:text-slate-400 placeholder:normal-case shadow-sm"
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium italic block">
                          O local especificado será gravado no prontuário e integrado às estatísticas do caso.
                        </span>
                      </div>
                    )}
                  </div>
                </AccordionSection>

                <AccordionSection id="medidas" title="Medidas ECA (Art. 101/129)" color="bg-emerald-600" active={activeSection} onToggle={setActiveSection} saved={selectedMedidas101.length > 0 || selectedMedidas129.length > 0}>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-emerald-800 uppercase border-b border-emerald-100 pb-1">Art. 101 - Medidas à Criança/Adolescente</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {MEDIDAS_101_ECA.map(m => (
                          <div key={m.id} onClick={() => canEditTechnicalFields && setSelectedMedidas101(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-bold uppercase transition-all ${selectedMedidas101.includes(m.id) ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 hover:bg-emerald-50 text-slate-600'}`}>
                            {selectedMedidas101.includes(m.id) ? <CheckSquare className="w-4 h-4 mt-0.5" /> : <Square className="w-4 h-4 mt-0.5 opacity-20" />}
                            <span>{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black text-emerald-800 uppercase border-b border-emerald-100 pb-1">Art. 129 - Medidas aos Pais/Responsáveis</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {MEDIDAS_129_ECA.map(m => (
                          <div key={m.id} onClick={() => canEditTechnicalFields && setSelectedMedidas129(p => p.includes(m.id) ? p.filter(x => x !== m.id) : [...p, m.id])} className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-bold uppercase transition-all ${selectedMedidas129.includes(m.id) ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-50 hover:bg-emerald-50 text-slate-600'}`}>
                            {selectedMedidas129.includes(m.id) ? <CheckSquare className="w-4 h-4 mt-0.5" /> : <Square className="w-4 h-4 mt-0.5 opacity-20" />}
                            <span>{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionSection>

                <AccordionSection id="atribuicoes" title="Atribuições (Art. 136)" color="bg-purple-600" active={activeSection} onToggle={setActiveSection} saved={selectedAtribuicoes.length > 0}>
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 gap-2">
                      {ATRIBUICOES_136_ECA.map(a => {
                        const isSelected = selectedAtribuicoes.includes(a.id);
                        const is136IIIa = a.id === 'III-a';
                        return (
                          <div key={a.id} className="space-y-3">
                            <div 
                              onClick={() => {
                                if (!canEditTechnicalFields) return;
                                const nextAtribuicoes = selectedAtribuicoes.includes(a.id) 
                                  ? selectedAtribuicoes.filter(x => x !== a.id) 
                                  : [...selectedAtribuicoes, a.id];
                                setSelectedAtribuicoes(nextAtribuicoes);
                                onUpdateDocument(doc.id, { atribuicoes_136: nextAtribuicoes });
                              }} 
                              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer text-[10px] font-bold uppercase transition-all ${isSelected ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-50 hover:bg-purple-50 text-slate-600'}`}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 mt-0.5" /> : <Square className="w-4 h-4 mt-0.5 opacity-20" />}
                              <span>{a.label}</span>
                            </div>
                            
                            {isSelected && is136IIIa && (
                              <div className="ml-8 p-6 bg-purple-50 rounded-[2rem] border border-purple-100 space-y-6 animate-in slide-in-from-top-2 shadow-inner">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] font-black text-purple-800 uppercase tracking-widest">Requisição de Serviços (Rede Hortolândia)</h5>
                                  <button 
                                    onClick={() => setAtribuicoesDetalhadas(prev => [...prev, { id: Date.now().toString(), inciso: 'III-a', texto: 'REQUISIÇÃO DE SERVIÇO', servicos: [] }])}
                                    disabled={!canEditTechnicalFields}
                                    className={`px-4 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-md ${!canEditTechnicalFields ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-700'}`}
                                  >
                                    <Plus className="w-4 h-4" /> Adicionar Serviço
                                  </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {atribuicoesDetalhadas.filter(ad => ad.inciso === 'III-a').map((ad, idx) => (
                                    <div key={ad.id} className="p-6 bg-white rounded-2xl border border-purple-100 space-y-4 shadow-sm relative group">
                                      <button 
                                        onClick={() => setAtribuicoesDetalhadas(prev => prev.filter(p => p.id !== ad.id))} 
                                        disabled={!canEditTechnicalFields}
                                        className={`absolute top-4 right-4 p-2 text-slate-300 transition-all ${!canEditTechnicalFields ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-500 hover:bg-red-50 rounded-lg'}`}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Área / Serviço</label>
                                          <SearchableServiceSelect
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus-within:border-purple-500"
                                            value={ad.servicos?.[0] ? `${ad.servicos[0].area}|${ad.servicos[0].servico}` : ''}
                                            disabled={!canEditTechnicalFields}
                                            onChange={(val) => {
                                              if (!val) return;
                                              const [area, servico] = val.split('|');
                                              setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ area, servico, prazo: p.servicos?.[0]?.prazo || '48H', observacao: p.servicos?.[0]?.observacao || '', servico_custom: p.servicos?.[0]?.servico_custom || '' }] } : p));
                                            }}
                                          />
                                        </div>
                                        {ad.servicos?.[0]?.servico === 'OUTROS SERVIÇOS / FORA DA REDE' && (
                                          <div className="space-y-1 md:col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Serviço / Destinatário</label>
                                            <input 
                                              type="text"
                                              placeholder="ESPECIFIQUE O SERVIÇO..."
                                              className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 disabled:opacity-50"
                                              value={ad.servicos?.[0]?.servico_custom || ''}
                                              disabled={!canEditTechnicalFields}
                                              onChange={(e) => setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ ...p.servicos?.[0], servico_custom: e.target.value }] } : p))}
                                            />
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Prazo</label>
                                          <div className="flex gap-2">
                                            <select 
                                              className="flex-1 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 disabled:opacity-50"
                                              value={ad.servicos?.[0]?.prazo || '48H'}
                                              disabled={!canEditTechnicalFields}
                                              onChange={(e) => setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ ...p.servicos?.[0], prazo: e.target.value }] } : p))}
                                            >
                                              <option value="24H">24 HORAS (URGENTE)</option>
                                              <option value="48H">48 HORAS</option>
                                              <option value="05 DIAS">05 DIAS</option>
                                              <option value="10 DIAS">10 DIAS</option>
                                              <option value="15 DIAS">15 DIAS</option>
                                              <option value="CUSTOM">PERSONALIZAR...</option>
                                            </select>
                                            {ad.servicos?.[0]?.prazo === 'CUSTOM' && (
                                              <input 
                                                type="number"
                                                placeholder="DIAS"
                                                className="w-20 p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 disabled:opacity-50"
                                                value={ad.servicos?.[0]?.prazo_custom || ''}
                                                disabled={!canEditTechnicalFields}
                                                onChange={(e) => setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ ...p.servicos?.[0], prazo_custom: e.target.value }] } : p))}
                                              />
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações Técnicas</label>
                                        <textarea 
                                          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 min-h-[80px] disabled:opacity-50"
                                          placeholder="DETALHAMENTO DA REQUISIÇÃO..."
                                          value={ad.servicos?.[0]?.observacao || ''}
                                          disabled={!canEditTechnicalFields}
                                          onChange={(e) => setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ ...p.servicos?.[0], observacao: e.target.value }] } : p))}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                       <label className="text-[11px] font-black text-purple-800 uppercase tracking-widest ml-1 flex items-center gap-2">
                         <ClipboardList className="w-4 h-4" /> Relato de Providências (Opcional)
                       </label>
                       <textarea 
                          className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-[12px] font-bold uppercase outline-none focus:border-purple-500 min-h-[150px] shadow-inner disabled:opacity-50"
                          placeholder="DESCREVA AS AÇÕES PRÁTICAS REALIZADAS (CONTATOS, VISITAS, ORIENTAÇÕES)..."
                          value={relatoProvidencias}
                          disabled={!canEditTechnicalFields}
                          onChange={(e) => setRelatoProvidencias(e.target.value)}
                       />
                    </div>
                  </div>
                </AccordionSection>
              </>
            )}
          </div>

          {(isActualProvidenciaImediata || isADM) ? (
            <div className="pt-6">
              <button 
                id="btn-finalize-doc" 
                onClick={() => handleSave(true)} 
                className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[13px] tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
              >
                <Save className="w-5 h-5" /> Salvar
              </button>
            </div>
          ) : (
            isImediata && (
              <div id="plantao-colaborador-banner" className="p-6 bg-amber-50 border border-amber-200 rounded-3xl flex items-center gap-4 text-amber-800 pt-6 mt-6">
                <ShieldAlert className="w-6 h-6 flex-shrink-0 text-amber-600" />
                <div className="text-[11px] font-bold uppercase">
                  Apenas o conselheiro de providência imediata ({doc.conselheiro_providencia_nome || 'responsável'}) pode salvar ou concluir as alterações nas medidas técnico-colegiadas deste prontuário. Como colega de plantão, você pode revisar as informações e realizar a validação colegiada abaixo.
                </div>
              </div>
            )
          )}
          {showCollegiateValidation && (
            <div id="validacao-trio" className="mt-8 pt-8 border-t bg-slate-50/50 rounded-[2.5rem] p-8 space-y-6 border border-slate-100 shadow-inner">
               <h4 className="text-[12px] font-black text-slate-800 uppercase flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Assinaturas Colegiadas (Trio de Imediata)</h4>
                 
                 {validationTracker.some(v => v.needsRevalidation) && (
                   <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 shadow-sm animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                         <span className="text-[11px] font-black uppercase block">⚠️ Medida Aplicada Editada - Revalidação Pendente</span>
                         <span className="text-[10px] font-bold uppercase text-amber-800">
                            A Medida Aplicada / conteúdo técnico deste procedimento foi editado pelo Conselheiro de Providência Imediata ({doc.conselheiro_providencia_nome || 'responsável'}). Os demais membros do Colegiado que já haviam validado precisam analisar e validar novamente.
                         </span>
                      </div>
                   </div>
                 )}
                 
                 {/* RESUMO TÉCNICO PARA VALIDAÇÃO */}
                 <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                       <ClipboardList className="w-4 h-4 text-indigo-600" />
                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Resumo Técnico do Prontuário</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Direitos e Agentes */}
                       <div className="space-y-4">
                          <div>
                             <span className="text-[8px] font-black text-blue-600 uppercase block mb-1 tracking-tighter">Direitos Violados</span>
                             <div className="flex flex-wrap gap-1">
                                {doc.violacoesSipia && doc.violacoesSipia.length > 0 ? doc.violacoesSipia.map((v, i) => (
                                   <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-bold rounded-lg border border-blue-100 uppercase leading-none">{v.especifico}</span>
                                )) : <span className="text-[9px] text-slate-400 italic">Nenhum direito selecionado</span>}
                             </div>
                          </div>
                          <div>
                             <span className="text-[8px] font-black text-orange-600 uppercase block mb-1 tracking-tighter">Agentes Violadores</span>
                             <div className="flex flex-wrap gap-1">
                                {doc.agentesVioladores && doc.agentesVioladores.length > 0 ? doc.agentesVioladores.map((a, i) => (
                                   <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 text-[9px] font-bold rounded-lg border border-orange-100 uppercase leading-none">{a.principal}</span>
                                )) : <span className="text-[9px] text-slate-400 italic">Nenhum agente selecionado</span>}
                             </div>
                          </div>
                          <div>
                             <span className="text-[8px] font-black text-rose-600 uppercase block mb-1 tracking-tighter">Local da Ocorrência</span>
                             <div className="flex flex-wrap gap-1">
                                {(localOcorrencia || doc.local_ocorrencia) ? (
                                   <span className="px-2 py-1 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-lg border border-rose-100 uppercase leading-none">
                                      {localOcorrencia || doc.local_ocorrencia}
                                   </span>
                                ) : <span className="text-[9px] text-slate-400 italic">Nenhum local selecionado</span>}
                             </div>
                          </div>
                       </div>

                       {/* Medidas e Atribuições */}
                       <div className="space-y-4">
                          <div>
                             <span className="text-[8px] font-black text-emerald-600 uppercase block mb-1 tracking-tighter">Medidas Aplicadas (Art. 101/129)</span>
                             <div className="flex flex-wrap gap-1">
                                {doc.medidas_detalhadas && doc.medidas_detalhadas.length > 0 ? doc.medidas_detalhadas.filter(m => m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')).map((m, i) => (
                                   <span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-[9px] font-bold rounded-lg border border-emerald-100 uppercase leading-none">{m.artigo_inciso}</span>
                                )) : <span className="text-[9px] text-slate-400 italic">Nenhuma medida selecionada</span>}
                             </div>
                          </div>
                          <div>
                             <span className="text-[8px] font-black text-purple-600 uppercase block mb-1 tracking-tighter">Atribuições e Serviços (Art. 136)</span>
                             <div className="flex flex-col gap-1">
                                {doc.atribuicoes_136_detalhadas && doc.atribuicoes_136_detalhadas.length > 0 ? doc.atribuicoes_136_detalhadas.map((a, i) => (
                                   <div key={i} className="p-2 bg-purple-50 rounded-lg border border-purple-100">
                                      <span className="text-[9px] font-bold text-purple-700 uppercase block leading-tight">{a.inciso}: {a.servicos?.[0]?.servico || a.texto}</span>
                                      {a.servicos?.[0]?.area && <span className="text-[8px] text-purple-400 uppercase font-black">Área: {a.servicos[0].area}</span>}
                                   </div>
                                )) : <span className="text-[9px] text-slate-400 italic">Nenhuma atribuição selecionada</span>}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="validacao-trio">
                    {validationTracker.map((status, idx) => {
                      const isUserNotified = (doc.notificacoes_trio || []).some(n => isSameCounselorName(n, status.name));
                      const isValidated = status.validated && !isUserNotified;

                      return (
                        <div key={idx} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${isValidated ? 'bg-white border-emerald-500 shadow-md' : 'bg-red-50 border-red-300 animate-pulse'}`}>
                           <span className="text-[12px] font-black uppercase text-slate-700">{status.name}</span>
                           <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${isValidated ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                              {isValidated ? 'VALIDADO' : (isUserNotified ? 'REVALIDAÇÃO NECESSÁRIA' : 'AGUARDANDO VALIDAÇÃO')}
                           </div>
                           {isValidated && status.timestamp && (
                             <span className="text-[8px] font-bold text-slate-400 uppercase">{status.timestamp}</span>
                           )}
                           {!isValidated && (
                             <button 
                               onClick={() => handleValidate(status.name)} 
                               className="mt-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                             >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Validar & Assinar</span>
                             </button>
                           )}
                        </div>
                      );
                    })}
                 </div>
              </div>
          )}
         </div>
      </div>

      {/* PAINEL DE INTELIGÊNCIA E AUDITORIA (OCULTO/INFERIOR) */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden">
         <button 
           onClick={() => setShowIntelligence(!showIntelligence)}
           className="w-full p-10 flex items-center justify-between bg-slate-900 text-white hover:bg-slate-800 transition-all border-b border-white/5"
         >
            <div className="flex items-center gap-6">
               <div className="p-4 bg-blue-600 rounded-2xl shadow-xl">
                  <Database className="w-8 h-8" />
               </div>
               <div className="text-left">
                  <h3 className="text-[18px] font-black uppercase tracking-tight">Centro de Inteligência SIMCT</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Dossiê Familiar & Histórico de Auditoria Institucional</p>
               </div>
            </div>
            <div className="flex items-center gap-4">
               {familyDossier.isRecurrent && <span className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase animate-pulse">🚩 Família Reincidente</span>}
               {showIntelligence ? <X className="w-8 h-8 text-slate-400" /> : <ChevronDown className="w-8 h-8 text-slate-400" />}
            </div>
         </button>

         {showIntelligence && (
            <div className="p-12 space-y-16 animate-in slide-in-from-bottom-5 duration-500">
               
               {/* 1. DOSSIÊ FAMILIAR COMPLETO */}
               <section className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                     <UserRound className="w-6 h-6 text-blue-600" />
                     <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Dossiê de Atendimento Familiar (Inteligência Institucional)</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase mb-3">Histórico Total</span>
                        <div className="flex flex-col items-center gap-2">
                           <span className="text-3xl font-black text-slate-900">{familyDossier.history.length + 1} Prontuários</span>
                           <button 
                             onClick={() => setShowHistoryModal(true)}
                             className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase flex items-center gap-1"
                           >
                             <History className="w-3 h-3" /> Ver Histórico Completo
                           </button>
                        </div>
                     </div>
                     <div className="p-8 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-blue-400 uppercase mb-3">Vítimas Identificadas</span>
                        <span className="text-3xl font-black text-blue-900">{familyDossier.totalChildren} Filhos</span>
                     </div>
                     <div className="p-8 bg-purple-50 rounded-3xl border border-purple-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-purple-400 uppercase mb-3">Órgãos Envolvidos</span>
                        <span className="text-3xl font-black text-purple-900">{familyDossier.allAgencies.length} Serviços</span>
                     </div>
                     <div className="p-8 bg-emerald-50 rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                        <span className="text-[10px] font-black text-emerald-400 uppercase mb-3">Status na Rede</span>
                        <span className="text-3xl font-black text-emerald-900">{familyDossier.isRecurrent ? 'Recorrente' : 'Novo'}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><LayoutList className="w-3.5 h-3.5" /> Cronologia de Entradas</label>
                        <div className="space-y-3">
                           {familyDossier.history.length > 0 ? familyDossier.history.map(h => (
                              <div key={h.id} className="p-5 bg-white border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-50 transition-all shadow-sm">
                                 <div className="flex items-center gap-4">
                                    <div className="p-3 bg-slate-50 rounded-xl"><FileText className="w-4 h-4 text-slate-400" /></div>
                                    <div>
                                       <div className="text-[12px] font-black text-slate-800 uppercase">{h.origem}</div>
                                       <div className="text-[10px] font-bold text-slate-400 uppercase">{formatLocalDateString(h.data_recebimento)} • {h.canal_comunicado}</div>
                                    </div>
                                 </div>
                                 <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase">#{h.id}</span>
                              </div>
                           )) : (
                              <div className="p-10 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-300 font-bold uppercase text-[11px]">Nenhum registro anterior para esta família.</div>
                           )}
                        </div>
                     </div>
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Building2 className="w-3.5 h-3.5" /> Órgãos Comunicantes no Histórico</label>
                        <div className="flex flex-wrap gap-2">
                           {familyDossier.allAgencies.map(agency => (
                              <span key={agency} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase border border-slate-200">{agency}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               </section>

               {/* 2. LINHA DO TEMPO DE AUDITORIA (MOVIMENTAÇÕES) */}
               <section className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                     <History className="w-6 h-6 text-emerald-600" />
                     <h4 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Trilha de Auditoria Institucional (Movimentações de ADM e Conselheiros)</h4>
                  </div>
                  
                  <div className="space-y-8 relative pl-10 before:content-[''] before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                     {logs.length > 0 ? logs.map((log, idx) => {
                        const isSystem = log.tipo === 'SISTEMA' || log.tipo === 'SEGURANÇA';
                        const isTech = log.tipo === 'VALIDAÇÃO';
                        return (
                           <div key={log.id} className="relative animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className={`absolute -left-10 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-md z-10 ${isSystem ? 'bg-red-500' : isTech ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                              <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-slate-300 transition-all shadow-sm">
                                 <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm"><UserCog className="w-5 h-5 text-slate-400" /></div>
                                       <div>
                                          <span className="text-[13px] font-black text-slate-900 uppercase">{log.usuario_nome}</span>
                                          <div className="flex items-center gap-2 mt-0.5">
                                             <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isSystem ? 'bg-red-100 text-red-600' : isTech ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {log.tipo}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="text-right">
                                       <span className="text-[11px] font-bold text-slate-400 uppercase block tracking-tighter">{new Date(log.data_hora).toLocaleDateString('pt-BR')}</span>
                                       <span className="text-[13px] font-black text-slate-800">{new Date(log.data_hora).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                                    </div>
                                 </div>
                                 <p className="text-[14px] font-bold text-slate-600 uppercase leading-relaxed bg-white/50 p-4 rounded-xl border border-slate-100/50">{log.acao}</p>
                              </div>
                           </div>
                        );
                     }) : (
                        <div className="p-20 text-center flex flex-col items-center">
                           <History className="w-12 h-12 text-slate-100 mb-4" />
                           <p className="text-[14px] font-bold text-slate-300 uppercase tracking-widest">Iniciando rastreamento de auditoria para este procedimento...</p>
                        </div>
                     )}
                  </div>
               </section>

               <footer className="pt-10 border-t border-slate-100 flex items-center justify-center gap-3 opacity-40">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Registros Imutáveis SICT - Segurança Jurídica Institucional</p>
               </footer>
            </div>
         )}
      </div>
    </div>

    {/* MODAL DE ALERTA DE PRAZO VENCIDO OBRIGATÓRIO */}
    {expiredItem && (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-xl bg-red-900/40 animate-in fade-in">
        <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-12 border-4 border-red-600 animate-in zoom-in-95 space-y-8 text-center">
          <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <div className="space-y-4">
            <h3 className="text-[24px] font-black text-red-600 uppercase tracking-tighter">Prazo de Monitoramento Vencido!</h3>
            <p className="text-[14px] text-slate-600 font-bold uppercase leading-relaxed">
              O serviço <span className="text-red-600">[{expiredItem.servico}]</span> para este prontuário expirou em {formatLocalDateString(expiredItem.dataFinal)}.
            </p>
            <p className="text-[12px] text-slate-400 font-bold uppercase">
              Você deve prorrogar o prazo ou encerrar o monitoramento desta família para prosseguir.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <button 
              onClick={() => { setExtendingReq(expiredItem); setExtForm({ nova_data: expiredItem.dataFinal }); setExpiredItem(null); }}
              className="py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Timer className="w-5 h-5" /> Prorrogar Prazo
            </button>
            <button 
              onClick={handleRemoveMonitoring}
              className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" /> Encerrar Monitoramento
            </button>
          </div>
        </div>
      </div>
    )}

    {extendingReq && (
      <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-10 border border-[#E5E7EB] animate-in zoom-in-95 space-y-8 relative">
          <button onClick={() => setExtendingReq(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
          <h3 className="text-[20px] font-bold text-[#111827] uppercase">Alterar Prazo</h3>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[11px] font-black text-[#4B5563] uppercase">Nova Data Limite</label>
                <input type="date" className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold" value={extForm.nova_data} onChange={e => setExtForm({ nova_data: e.target.value })} />
             </div>
          </div>
          <button onClick={handleExtendReqDeadline} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all">Salvar Alteração</button>
        </div>
      </div>
    )}
      {showHistoryModal && (
        <FamilyHistoryModal 
          history={[...familyDossier.history, doc]} 
          agenda={agenda}
          users={users}
          currentUser={currentUser} 
          onClose={() => setShowHistoryModal(false)} 
        />
      )}

      {showDeleteConfirm && (
        <div id="delete-confirm-modal-view" className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-[20px] font-black uppercase text-slate-800 text-center tracking-tight mb-2">Excluir Prontuário?</h3>
            <p className="text-[13px] font-medium text-slate-500 text-center mb-6 leading-relaxed">
              Você está prestes a excluir permanentemente o prontuário <span className="font-bold text-slate-900">#{doc.id}</span>. 
              O sistema reverterá a escala e a distribuição de providência imediata para o estado anterior. Esta ação é <span className="font-bold text-red-600">irreversível</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete(doc.id);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all text-center cursor-pointer"
              >
                Sim, Excluir Agora
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-4 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all text-center cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

interface AccordionSectionProps {
  id: string; title: string; color: string; active: string | null; onToggle: (id: string) => void;
  saved: boolean; children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ 
  id, title, color, active, onToggle, saved, children 
}) => {
  const isOpen = active === id;
  return (
    <div className={`border-2 rounded-[2rem] overflow-hidden transition-all ${isOpen ? 'border-slate-300 shadow-xl scale-[1.01]' : 'border-slate-100 shadow-sm'}`}>
      <button onClick={() => onToggle(isOpen ? null : id)} className={`w-full flex items-center justify-between p-7 ${isOpen ? `${color} text-white` : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
        <div className="flex items-center gap-5">
          {isOpen ? <ChevronDown className="w-6 h-6" /> : <Play className={`w-5 h-5 ${saved ? 'text-emerald-500' : 'opacity-40'}`} />}
          <span className="text-[15px] font-black uppercase tracking-widest">{title}</span>
        </div>
        {saved && <CheckCircle className={`w-7 h-7 ${isOpen ? 'text-white' : 'text-emerald-500'}`} />}
      </button>
      {isOpen && <div className="p-10 bg-white animate-in slide-in-from-top-2 duration-300">{children}</div>}
    </div>
  );
};

export default DocumentView;
