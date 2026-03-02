import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, Scale, X, Check, Clock, AlertCircle, Info, 
  Save, ShieldAlert, History, ClipboardList, CheckSquare, Square, 
  SendHorizontal, Activity, Ban, Calendar, UserRound, Plus,
  CheckCircle, CheckCircle2, ChevronDown, Play, Users, Tag, FileCheck2,
  Database, Fingerprint, MapPin, Building2, UserCog, Search, LayoutList,
  ChevronRight, Timer, ArrowUpRight, ShieldCheck, Box, FileText, Baby,
  AlertTriangle, Trash2
} from 'lucide-react';
import { 
  Documento, Log, User as UserType, DocumentStatus, 
  MedidaAplicada, SipiaViolation, AgenteVioladorEntry, LogType
} from '../types';
import { 
  STATUS_LABELS, INITIAL_USERS, 
  SIPIA_HIERARCHY, AGENTES_VIOLADORES_ESTRUTURA, 
  MEDIDAS_101_ECA, MEDIDAS_129_ECA,
  ATRIBUICOES_136_ECA, REDE_HORTOLANDIA, getEffectiveEscala
} from '../constants';
import FamilyHistoryModal from './FamilyHistoryModal';

interface DocumentViewProps {
  document: Documento;
  allDocuments: Documento[]; 
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
  onScience: (id: string) => void;
}

const DocumentView: React.FC<DocumentViewProps> = ({ 
  document: doc, 
  allDocuments,
  currentUser, 
  logs,
  onBack, 
  onUpdateDocument,
  onAddLog
}) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [tempViolacoes, setTempViolacoes] = useState<SipiaViolation[]>(doc.violacoesSipia || []);
  const [tempAgentes, setTempAgentes] = useState<AgenteVioladorEntry[]>(doc.agentesVioladores || []);
  const [selectedMedidas101, setSelectedMedidas101] = useState<string[]>((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 101')).map(m => m.artigo_inciso.replace('Art. 101, ', '')));
  const [selectedMedidas129, setSelectedMedidas129] = useState<string[]>((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 129')).map(m => m.artigo_inciso.replace('Art. 129, ', '')));
  const [selectedAtribuicoes, setSelectedAtribuicoes] = useState<string[]>(doc.atribuicoes_136 || []);
  const [atribuicoesDetalhadas, setAtribuicoesDetalhadas] = useState<any[]>(doc.atribuicoes_136_detalhadas || []);
  const [relatoProvidencias, setRelatoProvidencias] = useState(doc.relato_providencias || '');
  const [isImprocedente, setIsImprocedente] = useState(doc.is_improcedente || false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [expiredItem, setExpiredItem] = useState<any | null>(null);
  const [extendingReq, setExtendingReq] = useState<any | null>(null);
  const [extForm, setExtForm] = useState({ nova_data: '' });

  // Sincronização de estado local com as props do documento para garantir que as atualizações sejam sempre exibidas
  React.useEffect(() => {
    setTempViolacoes(doc.violacoesSipia || []);
    setTempAgentes(doc.agentesVioladores || []);
    setSelectedMedidas101((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 101')).map(m => m.artigo_inciso.replace('Art. 101, ', '')));
    setSelectedMedidas129((doc.medidas_detalhadas || []).filter(m => m.artigo_inciso.startsWith('Art. 129')).map(m => m.artigo_inciso.replace('Art. 129, ', '')));
    setSelectedAtribuicoes(doc.atribuicoes_136 || []);
    setAtribuicoesDetalhadas(doc.atribuicoes_136_detalhadas || []);
    setRelatoProvidencias(doc.relato_providencias || '');
    setIsImprocedente(doc.is_improcedente || false);
  }, [doc.id, doc.violacoesSipia, doc.agentesVioladores, doc.medidas_detalhadas, doc.atribuicoes_136, doc.atribuicoes_136_detalhadas, doc.relato_providencias, doc.is_improcedente]);

  const isResponsible = doc.conselheiro_providencia_id === currentUser.id || 
    doc.conselheiro_referencia_id === currentUser.id;
  const isImediata = doc.conselheiro_providencia_id === currentUser.id;
  const isADM = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  const canEditTechnicalFields = isImediata && !isADM;

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
    const informativeKeys: DocumentStatus[] = [
      'AGENDAR_REUNIAO_REDE', 'AGUARDAR_RESPOSTA_EMAIL', 'EMAIL_RESPONDIDO',
      'ENCAMINHAR_NOTICIA_FATO', 'NOTIFICAR', 'OFICIO_RESPONDIDO',
      'RESPONDER_EMAIL', 'SOLICITAR_REUNIAO_REDE', 'ARQUIVADO', 'CONCLUIDO',
      'TIPIFICACAO_INCOMPLETA',
      'NOTIFICACAO_LEANDRO', 'NOTIFICACAO_LUIZA', 'NOTIFICACAO_MILENA', 
      'NOTIFICACAO_MIRIAN', 'NOTIFICACAO_SANDRA', 'NOTIFICACAO_ROSILDA',
      'DIREITO_NAO_VIOLADO', 'NENHUMA', 'AGUARDANDO_AVALIACAO'
    ];
    return informativeKeys.sort((a, b) => STATUS_LABELS[a].localeCompare(STATUS_LABELS[b]));
  }, []);

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

    onUpdateDocument(doc.id, { 
      status: nextStatus,
      medidas_detalhadas: (newStatus === 'ARQUIVADO' || newStatus === 'CONCLUIDO') ? [] : doc.medidas_detalhadas
    });
    onAddLog(doc.id, `MOVIMENTAÇÃO ADMINISTRATIVA: Situação alterada para [${STATUS_LABELS[newStatus]}]. Validação automática por autonomia.`, 'DOCUMENTO');
  };

  const validationTracker = useMemo(() => {
    const trio = doc.conselheiros_providencia_nomes || [];
    const confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
    return trio.map(name => {
      const match = confirmacoes.find(c => c.usuario_nome.toUpperCase().includes(name.toUpperCase()));
      return { 
        name, 
        validated: !!match, 
        timestamp: match?.usuario_nome.split(' - ')[1] || null,
        needsRevalidation: doc.status.includes('AGUARDANDO_VALIDACAO') && !match && confirmacoes.length > 0
      };
    });
  }, [doc.conselheiros_providencia_nomes, doc.medidas_detalhadas, doc.status]);

  const handleSave = (finalize: boolean) => {
    if (!canEditTechnicalFields) return;
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

    const isTechnicalChange = hasMedidasChanged || hasAtribuicoesChanged || hasViolacoesChanged || hasAgentesChanged;

    // Se houver mudança técnica, resetamos as validações dos outros para forçar revalidação colegiada
    let confirmacoes = doc.medidas_detalhadas?.[0]?.confirmacoes || [];
    let notificacoesTrio = doc.notificacoes_trio || [];

    if (isTechnicalChange && isImediata) {
      // REFORÇO: Se houver mudança técnica, invalidamos assinaturas anteriores e notificamos o trio
      confirmacoes = confirmacoes.filter(c => c.usuario_id === currentUser.id);
      const escala = getEffectiveEscala(doc.data_aporte, doc.hora_aporte, currentUser.unidade_id);
      notificacoesTrio = escala.filter(nome => nome !== currentUser.nome.toUpperCase());
    }
    
    const mySignature = { usuario_id: currentUser.id, usuario_nome: `${currentUser.nome} - ${formattedDate}`, data_hora: now.toISOString() };
    if (!confirmacoes.some(c => c.usuario_id === currentUser.id)) {
      confirmacoes.push(mySignature);
      // Ao assinar, remove o próprio nome das notificações pendentes
      notificacoesTrio = notificacoesTrio.filter(nome => nome.toUpperCase() !== currentUser.nome.toUpperCase());
    }

    let combinedMedidas: MedidaAplicada[] = [
      ...selectedMedidas101.map(id => ({ 
        id: `med-101-${id}-${Date.now()}`, 
        artigo_inciso: `Art. 101, ${id}`, 
        texto: MEDIDAS_101_ECA.find(m => m.id === id)?.label || '', 
        autor_id: currentUser.id, 
        autor_nome: currentUser.nome, 
        data_lancamento: now.toISOString(), 
        conselheiros_requeridos: doc.conselheiros_providencia_nomes, 
        confirmacoes 
      })),
      ...selectedMedidas129.map(id => ({ 
        id: `med-129-${id}-${Date.now()}`, 
        artigo_inciso: `Art. 129, ${id}`, 
        texto: MEDIDAS_129_ECA.find(m => m.id === id)?.label || '', 
        autor_id: currentUser.id, 
        autor_nome: currentUser.nome, 
        data_lancamento: now.toISOString(), 
        conselheiros_requeridos: doc.conselheiros_providencia_nomes, 
        confirmacoes 
      }))
    ];

    // Se houver violação ou atribuição mas nenhuma medida selecionada, criamos uma entrada de controle para as assinaturas
    if (combinedMedidas.length === 0 && (tempViolacoes.length > 0 || selectedAtribuicoes.length > 0)) {
      combinedMedidas = [{
        id: `val-tech-${Date.now()}`,
        artigo_inciso: 'CONTROLE_VALIDACAO',
        texto: 'Validação Técnica de Direitos/Atribuições',
        autor_id: currentUser.id,
        autor_nome: currentUser.nome,
        data_lancamento: now.toISOString(),
        conselheiros_requeridos: doc.conselheiros_providencia_nomes,
        confirmacoes
      }];
    }

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
    
    const hasTechnicalContent = tempViolacoes.length > 0 || combinedMedidas.length > 0 || selectedAtribuicoes.length > 0 || (tempAgentes.length > 0 && tempAgentes[0]?.categoria !== 'INEXISTENTE');

    let statusFinal: DocumentStatus[] = [...doc.status];
    
    if (finalize) {
      if (isImprocedente) {
        statusFinal = [...doc.status.filter(s => s !== 'AGUARDANDO_VALIDACAO' && s !== 'MEDIDA_APLICADA'), 'DIREITO_NAO_VIOLADO'];
      } else if (hasTechnicalContent) {
        // REGRA 1º: Conteúdo técnico (Direito, Medida, Atribuição) OBRIGA a validação colegiada
        // Isso gera o alerta para os outros conselheiros de providência imediata
        if (isTechnicalChange || isImediata) {
          statusFinal = statusFinal.filter(s => s !== 'MEDIDA_APLICADA');
        }
        if (!statusFinal.includes('AGUARDANDO_VALIDACAO') && !statusFinal.includes('MEDIDA_APLICADA')) {
          statusFinal.push('AGUARDANDO_VALIDACAO');
        }

        // Notificar automaticamente os outros membros do trio de imediata
        const escala = getEffectiveEscala(doc.data_aporte, doc.hora_aporte, currentUser.unidade_id);
        const outrosDoTrio = escala.filter(nome => nome !== currentUser.nome.toUpperCase());
        
        const novasNotificacoes = [...notificacoesTrio];
        outrosDoTrio.forEach(nome => {
          if (!novasNotificacoes.includes(nome)) novasNotificacoes.push(nome);
        });
        notificacoesTrio = novasNotificacoes;

      } else if (isInformative) {
        // Se houver apenas despacho administrativo SEM conteúdo técnico, removemos a pendência de validação
        statusFinal = statusFinal.filter(s => s !== 'AGUARDANDO_VALIDACAO');
      } else {
        // Se não houver conteúdo técnico nem despacho, conclui
        statusFinal = statusFinal.filter(s => s !== 'AGUARDANDO_VALIDACAO' && s !== 'MEDIDA_APLICADA');
        if (!isInformative && !statusFinal.includes('CONCLUIDO')) {
          statusFinal.push('CONCLUIDO');
        }
      }
    } else {
      if (!isInformative && currentStatus !== 'EM_PREENCHIMENTO') {
        statusFinal = [...doc.status, 'EM_PREENCHIMENTO'];
      }
    }

    onUpdateDocument(doc.id, { 
      violacoesSipia: isImprocedente ? [] : tempViolacoes, 
      agentesVioladores: isImprocedente ? [{ categoria: 'INEXISTENTE', principal: 'FATO NÃO COMPROVADO', tipo: 'PRINCIPAL' }] : tempAgentes, 
      medidas_detalhadas: combinedMedidas, 
      atribuicoes_136: selectedAtribuicoes,
      atribuicoes_136_detalhadas: atribuicoesDetalhadas,
      status: statusFinal,
      relato_providencias: relatoProvidencias,
      is_improcedente: isImprocedente,
      monitoramento: monitoramentoAtualizado,
      notificacoes_trio: notificacoesTrio
    });
    
    onAddLog(doc.id, finalize ? `EDIÇÃO TÉCNICA: Medidas/Atribuições alteradas. REVALIDAÇÃO COLEGIADA OBRIGATÓRIA.` : `RASCUNHO TÉCNICO: Prontuário atualizado.`, 'DOCUMENTO');
    onBack();
  };

  const handleValidate = () => {
    const now = new Date();
    const formatted = `${currentUser.nome} - ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}`;
    const updated = (doc.medidas_detalhadas || []).map(m => ({ ...m, confirmacoes: [...m.confirmacoes, { usuario_id: currentUser.id, usuario_nome: formatted, data_hora: now.toISOString() }] }));
    const validatedCount = validationTracker.filter(v => v.validated).length + 1;
    const trioSize = doc.conselheiros_providencia_nomes?.length || 3;
    let nextStatus = [...doc.status];
    if (validatedCount >= trioSize) { 
      nextStatus = nextStatus.filter(s => s !== 'AGUARDANDO_VALIDACAO'); 
      nextStatus.push('MEDIDA_APLICADA'); 
    }
    
    // Remove o próprio nome das notificações ao validar
    const nextNotificacoes = (doc.notificacoes_trio || []).filter(nome => nome.toUpperCase() !== currentUser.nome.toUpperCase());

    onUpdateDocument(doc.id, { 
      medidas_detalhadas: updated, 
      status: nextStatus,
      notificacoes_trio: nextNotificacoes
    });
    onAddLog(doc.id, `VALIDAÇÃO TÉCNICA: Assinatura confirmada pelo trio.`, 'VALIDAÇÃO');
  };

  return (
    <>
      <div className="max-w-6xl mx-auto pb-40 animate-in fade-in flex flex-col gap-10">
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden">
        <header className="p-8 bg-[#111827] text-white flex items-center justify-between">
          <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ArrowLeft className="w-6 h-6" /></button>
          <div className="text-center"><h2 className="text-[20px] font-black uppercase">{doc.crianca_nome}</h2><p className="text-[10px] opacity-60 uppercase">SIMCT #{doc.id}</p></div>
          <div className="w-12 h-12"></div>
        </header>

        {/* ALERTA DE REVALIDAÇÃO OBRIGATÓRIA */}
        {(doc.notificacoes_trio || []).includes(currentUser.nome.toUpperCase()) && (
          <div className="bg-red-600 p-6 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4 text-white">
              <ShieldAlert className="w-8 h-8" />
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-tighter">Atenção: Revalidação Obrigatória</h4>
                <p className="text-[11px] font-bold uppercase opacity-90">Houve uma edição técnica neste prontuário. Você precisa validar as novas medidas/atribuições.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const section = document.getElementById('validacao-trio');
                if (section) section.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-white text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-slate-100 transition-all shadow-lg"
            >
              Ir para Validação
            </button>
          </div>
        )}

        <div className="p-10 space-y-10">
          {/* DESPACHO RÁPIDO */}
          <section className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 space-y-6">
            <div className="flex items-center gap-3">
               <Tag className="w-5 h-5 text-indigo-600" />
               <h3 className="text-[12px] font-black uppercase text-slate-800 tracking-widest">Despacho de Situação (Autonomia Imediata)</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <select 
                  className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold uppercase text-[11px] outline-none focus:border-indigo-500 shadow-sm cursor-pointer"
                  value={doc.status[doc.status.length - 1]}
                  onChange={(e) => handleQuickStatusChange(e.target.value as DocumentStatus)}
                  disabled={!isImediata && !isADM}
               >
                  <option value="">DEFINIR NOVA SITUAÇÃO...</option>
                  {informativeStatusOptions.map(status => (
                    <option 
                      key={status} 
                      value={status}
                      disabled={status === 'DIREITO_NAO_VIOLADO' && (tempViolacoes.length > 0 || tempAgentes.length > 0)}
                    >
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
               </select>
               {/* LEGENDA DE CORES PARA STATUS */}
               <div className="flex flex-wrap gap-4 px-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Despacho Administrativo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Medida Validada</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Pendente Validação</span>
                  </div>
               </div>

                {doc.status[doc.status.length - 1] !== 'NENHUMA' && (
                  <div className="p-4 bg-white border border-slate-100 rounded-xl flex items-center gap-4">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase block">Situação Vigente</span>
                        <div className="flex flex-wrap gap-2 items-center">
                          {doc.status.includes('MEDIDA_APLICADA') && doc.status[doc.status.length - 1] !== 'MEDIDA_APLICADA' && (
                            <span className="text-[11px] font-black uppercase text-emerald-600 flex items-center gap-1">
                              {STATUS_LABELS['MEDIDA_APLICADA']} <span className="text-slate-300">+</span>
                            </span>
                          )}
                          <span className={`text-[11px] font-black uppercase ${doc.status[doc.status.length - 1] === 'DIREITO_NAO_VIOLADO' ? 'text-emerald-600' : 'text-indigo-700'}`}>
                            {STATUS_LABELS[doc.status[doc.status.length - 1]]}
                          </span>
                        </div>
                    </div>
                  </div>
                )}
            </div>

            {!isADM && (
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <FileText className="w-4 h-4 text-indigo-600" /> Código do Comunicado (Opcional)
                 </label>
                 <textarea 
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-indigo-500 shadow-sm min-h-[80px]"
                    placeholder="INFORME O CÓDIGO DO COMUNICADO OU OBSERVAÇÃO ADMINISTRATIVA..."
                    value={doc.despacho_situacao || ''}
                    onChange={(e) => onUpdateDocument(doc.id, { despacho_situacao: e.target.value })}
                    disabled={!isImediata}
                 />
              </div>
            )}
          </section>

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
                                          <select 
                                            className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold uppercase outline-none focus:border-purple-500 disabled:opacity-50"
                                            value={`${ad.servicos?.[0]?.area}|${ad.servicos?.[0]?.servico}`}
                                            disabled={!canEditTechnicalFields}
                                            onChange={(e) => {
                                              const [area, servico] = e.target.value.split('|');
                                              setAtribuicoesDetalhadas(prev => prev.map(p => p.id === ad.id ? { ...p, servicos: [{ area, servico, prazo: p.servicos?.[0]?.prazo || '48H', observacao: p.servicos?.[0]?.observacao || '', servico_custom: p.servicos?.[0]?.servico_custom || '' }] } : p));
                                            }}
                                          >
                                            <option value="">SELECIONAR...</option>
                                            <optgroup label="OUTROS">
                                              <option value="OUTROS|OUTROS SERVIÇOS / FORA DA REDE">OUTROS SERVIÇOS / FORA DA REDE</option>
                                            </optgroup>
                                            {Object.entries(REDE_HORTOLANDIA).map(([area, servicos]) => (
                                              <optgroup key={area} label={area}>
                                                {servicos.map(s => <option key={s} value={`${area}|${s}`}>{s}</option>)}
                                              </optgroup>
                                            ))}
                                          </select>
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

          {(isImediata || isADM) && (
            <div className="grid grid-cols-2 gap-6 pt-6">
              <button onClick={() => handleSave(false)} className="py-6 bg-slate-600 text-white rounded-3xl font-black uppercase text-[12px] shadow-xl hover:bg-slate-700 transition-all flex items-center justify-center gap-3"><Save className="w-5 h-5" /> [Salvar Rascunho]</button>
              <button onClick={() => handleSave(true)} className="py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[12px] shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3"><CheckCircle2 className="w-5 h-5" /> [Concluir Prontuário]</button>
            </div>
          )}
          {(doc.status.includes('AGUARDANDO_VALIDACAO') || doc.status.includes('MEDIDA_APLICADA')) && 
           (!informativeStatusOptions.includes(doc.status[doc.status.length - 1]) || (doc.notificacoes_trio || []).length > 0) && (
            <div id="validacao-trio" className="mt-8 pt-8 border-t bg-slate-50/50 rounded-[2.5rem] p-8 space-y-6 border border-slate-100 shadow-inner">
               <h4 className="text-[12px] font-black text-slate-800 uppercase flex items-center gap-2"><Users className="w-5 h-5 text-blue-600" /> Assinaturas Colegiadas (Trio de Imediata)</h4>
               
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

               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {validationTracker.map((status, idx) => {
                    const isMe = status.name.toUpperCase() === currentUser.nome.toUpperCase();
                    return (
                      <div key={idx} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${status.validated ? 'bg-white border-emerald-500 shadow-md' : status.needsRevalidation ? 'bg-red-50 border-red-300 animate-pulse' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
                         <span className="text-[12px] font-black uppercase text-slate-700">{status.name}</span>
                         <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${status.validated ? 'bg-emerald-500 text-white' : status.needsRevalidation ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                            {status.validated ? `VALIDADO` : status.needsRevalidation ? 'REVALIDAÇÃO NECESSÁRIA' : 'AGUARDANDO'}
                         </div>
                         {status.validated && status.timestamp && (
                           <span className="text-[8px] font-bold text-slate-400 uppercase">{status.timestamp}</span>
                         )}
                         {!status.validated && isMe && doc.status.includes('AGUARDANDO_VALIDACAO') && (
                           <button onClick={handleValidate} className="mt-2 py-2 px-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-emerald-700 transition-all">Validar & Assinar</button>
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
                                       <div className="text-[10px] font-bold text-slate-400 uppercase">{new Date(h.data_recebimento).toLocaleDateString('pt-BR')} • {h.canal_comunicado}</div>
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
              O serviço <span className="text-red-600">[{expiredItem.servico}]</span> para este prontuário expirou em {new Date(expiredItem.dataFinal).toLocaleDateString('pt-BR')}.
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
          currentUser={currentUser} 
          onClose={() => setShowHistoryModal(false)} 
        />
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
