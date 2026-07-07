
import { 
  Clock, 
  Search, 
  X,
  Layers,
  Timer,
  Trash2,
  Calendar,
  FileText,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  User,
  Users,
  MapPin,
  Activity,
  FilePlus,
  ChevronDown,
  Check
} from 'lucide-react';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Documento, MonitoringInfo, User as UserType, RequisicaoServico, LogType, DocumentStatus, Oficio } from '../types';
import { REDE_HORTOLANDIA, BAIRROS } from '../constants';
import { formatLocalDateString, parseLocalDate } from '../lib/dateUtils';
import { SearchableServiceSelect } from './SearchableServiceSelect';

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, disabled, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter(opt => opt.toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`${className || ''} w-full text-left flex items-center justify-between cursor-pointer`}
      >
        <span className={value ? "text-slate-800" : "text-slate-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="PESQUISAR..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold uppercase text-slate-800 outline-none placeholder:text-slate-400"
              autoFocus
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                LIMPAR
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-[10px] font-bold uppercase text-slate-400 text-center">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-3 text-[11px] font-bold uppercase hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    value === opt ? 'bg-blue-50/50 text-blue-600' : 'text-slate-700'
                  }`}
                >
                  <span>{opt}</span>
                  {value === opt && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface MonitoringDashboardProps {
  documents: Documento[];
  currentUser: UserType;
  effectiveUserId: string;
  onSelectDoc: (id: string) => void;
  onRemoveMonitoring: (id: string) => void;
  onUpdateMonitoring: (id: string, monitoring: MonitoringInfo) => void;
  onAddLog: (docId: string, acao: string, tipo?: LogType) => void;
  isReadOnly?: boolean;
  onSaveDocument?: (doc: Partial<Documento>) => Promise<void>;
}

const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ 
  documents, 
  currentUser, 
  onSelectDoc, 
  onUpdateMonitoring,
  onRemoveMonitoring,
  onAddLog,
  isReadOnly,
  onSaveDocument
}) => {
  const [filters, setFilters] = useState({ termo: '' });
  const [extendingReq, setExtendingReq] = useState<{ docId: string, req: RequisicaoServico } | null>(null);
  const [docToConfirmDelete, setDocToConfirmDelete] = useState<Documento | null>(null);
  const [extForm, setExtForm] = useState({ nova_data: '' });
  const [collapsedDocs, setCollapsedDocs] = useState<Set<string>>(new Set());
  const [showAddService, setShowAddService] = useState<string | null>(null);
  const [newService, setNewService] = useState({ area: '', servico: '', prazo: '05 DIAS', prazo_custom: '', servico_custom: '', observacao: '' });
  const [expiredItem, setExpiredItem] = useState<{ doc: Documento, req: RequisicaoServico } | null>(null);
  const [showAddOficio, setShowAddOficio] = useState<string | null>(null);
  const [newOficio, setNewOficio] = useState({ numero: '', numero_comunicado: '', numero_sipia: '', prazo: '' });
  const [extendingOficio, setExtendingOficio] = useState<{ docId: string, oficio: Oficio } | null>(null);
  const [expiredOficio, setExpiredOficio] = useState<{ doc: Documento, oficio: Oficio } | null>(null);
  const [oficioToDelete, setOficioToDelete] = useState<{ docId: string, ofId: string, numero: string } | null>(null);
  const [reqToDelete, setReqToDelete] = useState<{ docId: string, reqId: string, servico: string } | null>(null);

  const [showInsertManual, setShowInsertManual] = useState(false);
  const [insertType, setInsertType] = useState<'existing' | 'new'>('existing');
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [newDocData, setNewDocData] = useState({
    criancaNome: '',
    genitoraNome: '',
    bairro: '',
  });
  const [manualService, setManualService] = useState({
    area: '',
    servico: '',
    prazo: '05 DIAS',
    prazo_custom: '',
    servico_custom: '',
    observacao: '',
  });

  const availableDocs = useMemo(() => {
    return documents.filter(d => {
      const isCurrentlyMonitored = d.monitoramento && !d.monitoramento.concluido;
      return !isCurrentlyMonitored;
    });
  }, [documents]);

  const filteredAvailableDocs = useMemo(() => {
    if (!searchDocQuery || searchDocQuery.trim().length < 2) {
      return [];
    }
    const query = searchDocQuery.toUpperCase();
    return availableDocs.filter(d => {
      const childMatch = d.crianca_nome && d.crianca_nome.toUpperCase().includes(query);
      const motherMatch = d.genitora_nome && d.genitora_nome.toUpperCase().includes(query);
      const idMatch = d.id && d.id.toUpperCase().includes(query);
      return childMatch || motherMatch || idMatch;
    });
  }, [availableDocs, searchDocQuery]);

  const filteredMonitoringDocs = useMemo(() => {
    return documents.filter(d => {
      if (!d.monitoramento || d.monitoramento.concluido || d.conselheiro_referencia_id !== currentUser.id) return false;
      
      const termo = filters.termo.toUpperCase();
      const matchTermo = !termo || 
                         d.crianca_nome.toUpperCase().includes(termo) || 
                         d.genitora_nome.toUpperCase().includes(termo);
      
      return matchTermo;
    });
  }, [documents, filters, currentUser]);

  const toggleVisibility = (docId: string) => {
    setCollapsedDocs(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const getStatusStyle = (prazo: string, hasItems: boolean = true) => {
    if (!hasItems) return { bg: 'bg-slate-100 text-slate-400 border-slate-200', text: 'AGUARDANDO REQUISIÇÃO' };
    if (!prazo) return { bg: 'bg-slate-50 text-slate-500 border-slate-200', text: 'SEM PRAZO' };
    
    const today = new Date(); today.setHours(0,0,0,0);
    const deadline = parseLocalDate(prazo); deadline.setHours(0,0,0,0);
    const diffMs = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'PRAZO VENCIDO' };
    if (diffDays <= 1) return { bg: 'bg-red-50 text-red-700 border-red-200', text: 'PRAZO VAI VENCER' };
    if (diffDays <= 5) return { bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', text: 'PERTO DO PRAZO' };
    return { bg: 'bg-green-50 text-green-700 border-green-200', text: 'NO PRAZO' };
  };

  const handleExtendReqDeadline = () => {
    if (!extendingReq || !extForm.nova_data) return;
    const doc = documents.find(d => d.id === extendingReq.docId);
    if (!doc || !doc.monitoramento) return;

    const requisicoesAtualizadas = doc.monitoramento.requisicoes?.map(r => 
      r.id === extendingReq.req.id ? { ...r, dataFinal: extForm.nova_data } : r
    );

    onUpdateMonitoring(extendingReq.docId, {
      ...doc.monitoramento,
      requisicoes: requisicoesAtualizadas
    });

    onAddLog(extendingReq.docId, `MONITORAMENTO: Prazo da requisição [${extendingReq.req.servico}] alterado.`, 'MONITORAMENTO');

    setExtendingReq(null);
    setExtForm({ nova_data: '' });
  };

  const handleExtendOficioDeadline = () => {
    if (!extendingOficio || !extForm.nova_data) return;
    const doc = documents.find(d => d.id === extendingOficio.docId);
    if (!doc || !doc.monitoramento) return;

    const oficiosAtualizados = doc.monitoramento.oficios?.map(o => 
      o.id === extendingOficio.oficio.id ? { ...o, prazo: extForm.nova_data } : o
    );

    onUpdateMonitoring(extendingOficio.docId, {
      ...doc.monitoramento,
      oficios: oficiosAtualizados
    });

    onAddLog(extendingOficio.docId, `MONITORAMENTO: Prazo do ofício [${extendingOficio.oficio.numero}] alterado.`, 'MONITORAMENTO');

    setExtendingOficio(null);
    setExtForm({ nova_data: '' });
  };

  const handleRemoveRequisicao = (docId: string, reqId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.monitoramento) return;

    const requisicoesAtualizadas = doc.monitoramento.requisicoes?.map(r => 
      r.id === reqId ? { ...r, excluidoDoMonitoramento: true } : r
    );

    onUpdateMonitoring(docId, {
      ...doc.monitoramento,
      requisicoes: requisicoesAtualizadas
    });

    onAddLog(docId, `MONITORAMENTO: Item de requisição removido.`, 'MONITORAMENTO');
  };

  const handleRemoveOficio = (docId: string, oficioId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.monitoramento) return;

    const oficiosAtualizados = doc.monitoramento.oficios?.map(o => 
      o.id === oficioId ? { ...o, excluido: true } : o
    );

    onUpdateMonitoring(docId, {
      ...doc.monitoramento,
      oficios: oficiosAtualizados
    });

    onAddLog(docId, `MONITORAMENTO: Ofício removido.`, 'MONITORAMENTO');
  };

  const handleAddService = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !newService.area || !newService.servico) return;

    const today = new Date();
    let daysToAdd = 5;
    
    if (newService.prazo === 'CUSTOM') {
      daysToAdd = parseInt(newService.prazo_custom) || 0;
    } else {
      daysToAdd = parseInt(newService.prazo.split(' ')[0]) || 5;
    }

    const deadline = new Date(today);
    deadline.setDate(today.getDate() + daysToAdd);

    const newReq: RequisicaoServico = {
      id: `req-${Date.now()}`,
      area: newService.area,
      servico: newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' ? (newService.servico_custom || 'OUTRO SERVIÇO') : newService.servico,
      dataFinal: deadline.toISOString(),
      prazo: newService.prazo === 'CUSTOM' ? `${daysToAdd} DIAS` : newService.prazo,
      prazo_custom: newService.prazo === 'CUSTOM' ? newService.prazo_custom : undefined,
      observacao: newService.observacao,
      isForaDaRede: newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE'
    };

    const currentMonitoring = doc.monitoramento || { concluido: false, prazoEsperado: deadline.toISOString(), requisicoes: [] };
    
    onUpdateMonitoring(docId, {
      ...currentMonitoring,
      requisicoes: [...(currentMonitoring.requisicoes || []), newReq]
    });

    onAddLog(docId, `MONITORAMENTO: Novo serviço [${newService.servico}] adicionado para acompanhamento.`, 'MONITORAMENTO');
    setShowAddService(null);
    setNewService({ area: '', servico: '', prazo: '05 DIAS', prazo_custom: '', servico_custom: '', observacao: '' });
  };

  const handleAddOficio = (docId: string) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !newOficio.numero || !newOficio.prazo) return;

    const of: Oficio = {
      id: `of-${Date.now()}`,
      numero: newOficio.numero,
      numero_comunicado: newOficio.numero_comunicado || undefined,
      numero_sipia: newOficio.numero_sipia || undefined,
      prazo: newOficio.prazo,
      data_emissao: new Date().toISOString(),
      concluido: false
    };

    const currentMonitoring = doc.monitoramento || { concluido: false, prazoEsperado: newOficio.prazo, requisicoes: [] };
    
    onUpdateMonitoring(docId, {
      ...currentMonitoring,
      oficios: [...(currentMonitoring.oficios || []), of]
    });

    onAddLog(docId, `MONITORAMENTO: Novo ofício [${newOficio.numero}] adicionado para acompanhamento.`, 'MONITORAMENTO');
    setShowAddOficio(null);
    setNewOficio({ numero: '', numero_comunicado: '', numero_sipia: '', prazo: '' });
  };

  const [modalError, setModalError] = useState<string | null>(null);

  const handleInsertManualMonitoring = async () => {
    if (!onSaveDocument) return;
    setModalError(null);

    // Validate service details first since any monitoring case needs a tracked service
    if (!manualService.area || !manualService.servico) {
      setModalError("Por favor, selecione uma Área e um Serviço.");
      return;
    }

    if (manualService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' && !manualService.servico_custom) {
      setModalError("Por favor, especifique o nome do serviço para 'Outros Serviços'.");
      return;
    }

    const today = new Date();
    let daysToAdd = 5;
    
    if (manualService.prazo === 'CUSTOM') {
      daysToAdd = parseInt(manualService.prazo_custom) || 5;
    } else {
      daysToAdd = parseInt(manualService.prazo.split(' ')[0]) || 5;
    }

    const deadline = new Date(today);
    deadline.setDate(today.getDate() + daysToAdd);

    const newReq: RequisicaoServico = {
      id: `req-${Date.now()}`,
      area: manualService.area,
      servico: manualService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' ? (manualService.servico_custom || 'OUTRO SERVIÇO') : manualService.servico,
      dataFinal: deadline.toISOString(),
      prazo: manualService.prazo === 'CUSTOM' ? `${daysToAdd} DIAS` : manualService.prazo,
      prazo_custom: manualService.prazo === 'CUSTOM' ? manualService.prazo_custom : undefined,
      observacao: manualService.observacao,
      isForaDaRede: manualService.servico === 'OUTROS SERVIÇOS / FORA DA REDE'
    };

    if (insertType === 'existing') {
      if (!selectedDocId) {
        setModalError("Por favor, selecione um procedimento existente.");
        return;
      }

      const existingDoc = documents.find(d => d.id === selectedDocId);
      if (!existingDoc) return;

      const currentMonitoring = existingDoc.monitoramento || { concluido: false, prazoEsperado: deadline.toISOString(), requisicoes: [] };
      const currentStatus = existingDoc.status || [];
      const updatedStatus = currentStatus.includes('MONITORAMENTO') ? currentStatus : [...currentStatus, 'MONITORAMENTO' as DocumentStatus];

      const updatedDoc: Partial<Documento> = {
        id: existingDoc.id,
        status: updatedStatus,
        monitoramento: {
          ...currentMonitoring,
          concluido: false,
          prazoEsperado: deadline.toISOString(),
          requisicoes: [...(currentMonitoring.requisicoes || []).filter(r => !r.excluidoDoMonitoramento), newReq]
        }
      };

      await onSaveDocument(updatedDoc);
      onAddLog(existingDoc.id, `MONITORAMENTO: Iniciado acompanhamento manual via vinculação de procedimento existente. Serviço [${newReq.servico}].`, 'MONITORAMENTO');
    } else {
      // Insert new document
      if (!newDocData.criancaNome || !newDocData.bairro) {
        setModalError("Por favor, preencha o nome da criança e selecione o bairro.");
        return;
      }

      const tempId = `doc-${Math.random().toString(36).substr(2, 9)}`;
      const manualDoc: Partial<Documento> = {
        id: tempId,
        unidade_id: currentUser.unidade_id || 1,
        origem: 'MONITORAMENTO MANUAL',
        canal_comunicado: 'ATENDIMENTO PRESENCIAL',
        data_recebimento: new Date().toISOString().split('T')[0],
        data_aporte: new Date().toISOString().split('T')[0],
        hora_aporte: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        crianca_nome: newDocData.criancaNome.toUpperCase(),
        criancas: [{
          nome: newDocData.criancaNome.toUpperCase(),
          data_nascimento: '',
          genero_identidade: 'NÃO INFORMADO'
        }],
        genitora_nome: (newDocData.genitoraNome || 'NÃO INFORMADO').toUpperCase(),
        bairro: newDocData.bairro,
        informacoes_documento: 'Monitoramento manual inserido diretamente pelo painel.',
        observacoes_iniciais: 'Prontuário gerado automaticamente para monitoramento.',
        status: ['MONITORAMENTO' as DocumentStatus],
        conselheiro_referencia_id: currentUser.id,
        conselheiro_referencia_nome: currentUser.nome,
        conselheiro_providencia_id: currentUser.id,
        conselheiro_providencia_nome: currentUser.nome,
        conselheiros_providencia_nomes: [currentUser.nome],
        criado_em: new Date().toISOString(),
        monitoramento: {
          concluido: false,
          prazoEsperado: deadline.toISOString(),
          requisicoes: [newReq]
        }
      };

      await onSaveDocument(manualDoc);
      onAddLog(tempId, `MONITORAMENTO: Novo prontuário criado para acompanhamento manual. Serviço [${newReq.servico}].`, 'MONITORAMENTO');
    }

    // Reset fields and close
    setShowInsertManual(false);
    setSelectedDocId('');
    setSearchDocQuery('');
    setNewDocData({ criancaNome: '', genitoraNome: '', bairro: '' });
    setManualService({ area: '', servico: '', prazo: '05 DIAS', prazo_custom: '', servico_custom: '', observacao: '' });
  };

  // DIRETRIZ: Alerta de prazo vencido obrigatório
  React.useEffect(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    for (const doc of filteredMonitoringDocs) {
      // Check requisitions
      const expiredReq = doc.monitoramento?.requisicoes?.find(r => {
        if (r.excluidoDoMonitoramento || r.concluido) return false;
        const deadline = parseLocalDate(r.dataFinal);
        deadline.setHours(0,0,0,0);
        return deadline.getTime() < today.getTime();
      });

      if (expiredReq) {
        setExpiredItem({ doc, req: expiredReq });
        break; // Show one at a time
      }

      // Check ofícios
      const expiredOf = doc.monitoramento?.oficios?.find(o => {
        if (o.excluido || o.concluido) return false;
        const deadline = parseLocalDate(o.prazo);
        deadline.setHours(0,0,0,0);
        return deadline.getTime() < today.getTime();
      });

      if (expiredOf) {
        setExpiredOficio({ doc, oficio: expiredOf });
        break;
      }
    }
  }, [filteredMonitoringDocs]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      <div className="bg-[#111827] p-10 rounded-2xl shadow-lg flex items-center gap-6">
        <div className="p-4 bg-[#2563EB] rounded-xl"><Clock className="w-8 h-8 text-white" /></div>
        <div>
          <h2 className="text-[20px] font-bold text-white uppercase tracking-tight">Monitoramento Clássico</h2>
          <p className="text-[13px] text-[#9CA3AF] font-medium uppercase tracking-widest mt-1">Acompanhamento de Requisições Ativas</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4B5563] w-5 h-5" />
          <input 
            type="text" 
            placeholder="LOCALIZAR NO MONITORAMENTO..." 
            className="w-full pl-12 pr-6 py-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl outline-none font-bold text-[13px] uppercase tracking-wider focus:border-[#2563EB]"
            value={filters.termo}
            onChange={e => setFilters({ termo: e.target.value })}
          />
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-6 border-b bg-[#F9FAFB] flex flex-col sm:flex-row items-center justify-between gap-4">
           <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-[#2563EB]" />
              <h2 className="text-[15px] font-bold text-[#111827] uppercase tracking-widest">Controle de Prazos</h2>
           </div>
           <div className="flex items-center gap-3 flex-wrap">
              {!isReadOnly && (
                <button 
                  onClick={() => {
                    setShowInsertManual(true);
                    setModalError(null);
                    setSearchDocQuery('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 text-[11px] font-black uppercase"
                >
                  <Plus className="w-4 h-4" /> Inserir Manualmente
                </button>
              )}
              <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">{filteredMonitoringDocs.length} Atendimentos</span>
           </div>
        </div>
        
        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Prontuário</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest">Requisições</th>
                <th className="px-8 py-5 text-[10px] font-black text-[#4B5563] uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {filteredMonitoringDocs.map(doc => {
                const monitoring = doc.monitoramento!;
                const activeRequisicoes = (monitoring.requisicoes || []).filter(r => !r.excluidoDoMonitoramento);
                const activeOficios = (monitoring.oficios || []).filter(o => !o.excluido);
                const isHidden = collapsedDocs.has(doc.id);
                
                const deadlines = [
                  ...activeRequisicoes.map(r => r.dataFinal),
                  ...activeOficios.map(o => o.prazo)
                ];

                const closestDeadline = deadlines.length > 0 
                  ? deadlines.reduce((min, p) => p < min ? p : min)
                  : monitoring.prazoEsperado;

                const style = getStatusStyle(closestDeadline, (activeRequisicoes.length + activeOficios.length) > 0);

                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border w-fit ${style.bg}`}>
                        {style.text}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[14px] font-bold text-[#111827] uppercase leading-tight">{doc.crianca_nome}</div>
                      <div className="text-[11px] text-[#4B5563] font-medium uppercase mt-1">Ref: {doc.id}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-4">
                        <button onClick={() => toggleVisibility(doc.id)} className="flex items-center gap-2 text-[10px] font-black text-[#2563EB] uppercase hover:underline w-fit">
                          {isHidden ? <><Eye className="w-3.5 h-3.5" /> Ver Detalhes</> : <><EyeOff className="w-3.5 h-3.5" /> Ocultar</>}
                        </button>
                        {!isHidden && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                            {activeRequisicoes.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Requisições de Serviço</div>
                                {activeRequisicoes.map((req) => {
                                  const reqStyle = getStatusStyle(req.dataFinal);
                                  return (
                                    <div key={req.id} className={`p-3 rounded-xl border flex flex-col gap-1 ${reqStyle.bg}`}>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="text-[9px] font-black uppercase opacity-60">{req.area}</div>
                                          <div className="text-[11px] font-bold uppercase">{req.servico}</div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => { setExtendingReq({ docId: doc.id, req }); setExtForm({ nova_data: req.dataFinal }); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Timer className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => setReqToDelete({ docId: doc.id, reqId: req.id, servico: req.servico })} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      </div>
                                      <span className="text-[9px] font-black uppercase flex items-center gap-1 mt-1 border-t border-black/5 pt-1">
                                          <Calendar className="w-2.5 h-2.5" /> Prazo: {formatLocalDateString(req.dataFinal)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {activeOficios.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b pb-1">Ofícios Expedidos</div>
                                {activeOficios.map((of) => {
                                  const ofStyle = getStatusStyle(of.prazo);
                                  return (
                                    <div key={of.id} className={`p-3 rounded-xl border flex flex-col gap-1 ${ofStyle.bg}`}>
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="text-[11px] font-bold uppercase">Ofício Nº: {of.numero}</div>
                                          {of.numero_comunicado && <div className="text-[9px] font-black uppercase text-slate-500 mt-0.5">Com. Violação Nº: {of.numero_comunicado}</div>}
                                          {of.numero_sipia && <div className="text-[9px] font-black uppercase text-slate-500">Proc. / SIPIA Nº: {of.numero_sipia}</div>}
                                        </div>
                                        <div className="flex items-center gap-1">
                                          <button onClick={() => { setExtendingOficio({ docId: doc.id, oficio: of }); setExtForm({ nova_data: of.prazo }); }} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg"><Timer className="w-3.5 h-3.5" /></button>
                                          <button onClick={() => setOficioToDelete({ docId: doc.id, ofId: of.id, numero: of.numero })} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                      </div>
                                      <span className="text-[9px] font-black uppercase flex items-center gap-1 mt-1 border-t border-black/5 pt-1">
                                          <Calendar className="w-2.5 h-2.5" /> Resposta em: {formatLocalDateString(of.prazo)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isReadOnly && (
                          <div className="flex flex-col gap-1.5">
                            <button 
                              onClick={() => setShowAddService(doc.id)}
                              className="p-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                            >
                              <Plus className="w-4 h-4" /> Add Serviço
                            </button>
                            <button 
                              onClick={() => setShowAddOficio(doc.id)}
                              className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase"
                            >
                              <FilePlus className="w-4 h-4" /> Add Ofício
                            </button>
                          </div>
                        )}
                        <button onClick={() => onSelectDoc(doc.id)} className="p-2.5 bg-[#111827] text-white rounded-lg hover:bg-[#2563EB] transition-all shadow-sm"><FileText className="w-4 h-4" /></button>
                        {!isReadOnly && <button onClick={() => setDocToConfirmDelete(doc)} className="p-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"><CheckCircle2 className="w-4 h-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="lg:hidden p-4 space-y-4 bg-slate-50/30">
          {filteredMonitoringDocs.map(doc => {
            const monitoring = doc.monitoramento!;
            const activeRequisicoes = (monitoring.requisicoes || []).filter(r => !r.excluidoDoMonitoramento);
            const activeOficios = (monitoring.oficios || []).filter(o => !o.excluido);
            const isHidden = collapsedDocs.has(doc.id);
            
            const deadlines = [
              ...activeRequisicoes.map(r => r.dataFinal),
              ...activeOficios.map(o => o.prazo)
            ];

            const closestDeadline = deadlines.length > 0 
              ? deadlines.reduce((min, p) => p < min ? p : min)
              : monitoring.prazoEsperado;

            const style = getStatusStyle(closestDeadline, (activeRequisicoes.length + activeOficios.length) > 0);

            return (
              <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[13px] sm:text-[14px] font-bold text-[#111827] uppercase leading-tight truncate">{doc.crianca_nome}</div>
                    <div className="text-[9px] text-[#4B5563] font-medium uppercase mt-0.5">Ref: {doc.id}</div>
                  </div>
                  <span className={`self-start sm:self-center px-2 py-1 rounded-lg text-[8px] font-black uppercase border whitespace-nowrap ${style.bg}`}>
                    {style.text}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <button onClick={() => toggleVisibility(doc.id)} className="flex items-center gap-2 text-[10px] font-black text-[#2563EB] uppercase w-fit">
                    {isHidden ? <><Eye className="w-3.5 h-3.5" /> Ver Detalhes ({activeRequisicoes.length + activeOficios.length})</> : <><EyeOff className="w-3.5 h-3.5" /> Ocultar Detalhes</>}
                  </button>
                  
                  {!isHidden && (
                    <div className="space-y-4 pt-2 border-t border-slate-100">
                      {activeRequisicoes.length > 0 && (
                        <div className="space-y-2">
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serviços</div>
                           {activeRequisicoes.map((req) => {
                            const reqStyle = getStatusStyle(req.dataFinal);
                            return (
                              <div key={req.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${reqStyle.bg}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[8px] font-black uppercase opacity-60 truncate">{req.area}</div>
                                    <div className="text-[10px] font-bold uppercase truncate leading-tight">{req.servico}</div>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => { setExtendingReq({ docId: doc.id, req }); setExtForm({ nova_data: req.dataFinal }); }} className="p-2 text-blue-600 bg-white/50 rounded-lg"><Timer className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setReqToDelete({ docId: doc.id, reqId: req.id, servico: req.servico })} className="p-2 text-red-600 bg-white/50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                                <span className="text-[8px] font-black uppercase flex items-center gap-1 mt-1 border-t border-black/5 pt-1">
                                    <Calendar className="w-2.5 h-2.5" /> Vence em: {formatLocalDateString(req.dataFinal)}
                                </span>
                              </div>
                            );
                           })}
                        </div>
                      )}

                      {activeOficios.length > 0 && (
                        <div className="space-y-2">
                           <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Ofícios</div>
                           {activeOficios.map((of) => {
                            const ofStyle = getStatusStyle(of.prazo);
                            return (
                              <div key={of.id} className={`p-3 rounded-xl border flex flex-col gap-2 ${ofStyle.bg}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] font-bold uppercase truncate leading-tight">Nº {of.numero}</div>
                                    {of.numero_comunicado && <div className="text-[8px] font-black uppercase text-slate-500 mt-0.5 truncate">Com. Nº: {of.numero_comunicado}</div>}
                                    {of.numero_sipia && <div className="text-[8px] font-black uppercase text-slate-500 truncate">SIPIA: {of.numero_sipia}</div>}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => { setExtendingOficio({ docId: doc.id, oficio: of }); setExtForm({ nova_data: of.prazo }); }} className="p-2 text-blue-600 bg-white/50 rounded-lg"><Timer className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => setOficioToDelete({ docId: doc.id, ofId: of.id, numero: of.numero })} className="p-2 text-red-600 bg-white/50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </div>
                                </div>
                                <span className="text-[8px] font-black uppercase flex items-center gap-1 mt-1 border-t border-black/5 pt-1">
                                    <Calendar className="w-2.5 h-2.5" /> Resposta: {formatLocalDateString(of.prazo)}
                                </span>
                              </div>
                            );
                           })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  {!isReadOnly && (
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setShowAddService(doc.id)}
                        className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 text-[9px] font-black uppercase"
                      >
                        <Plus className="w-3.5 h-3.5" /> Serviço
                      </button>
                      <button 
                        onClick={() => setShowAddOficio(doc.id)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 text-[9px] font-black uppercase"
                      >
                        <FilePlus className="w-3.5 h-3.5" /> Ofício
                      </button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => onSelectDoc(doc.id)} className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase">
                      <FileText className="w-3.5 h-3.5" /> Prontuário
                    </button>
                    {!isReadOnly && (
                      <button onClick={() => setDocToConfirmDelete(doc)} className="p-3 bg-red-50 text-red-600 rounded-xl flex items-center justify-center gap-2 text-[9px] font-black uppercase">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {docToConfirmDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-6">
                 <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
                 <h3 className="text-[20px] font-bold text-[#111827] uppercase">Encerrar Monitoramento?</h3>
                 <p className="text-[12px] text-[#4B5563] font-medium uppercase">Confirmar a saída deste caso do painel ativo?</p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setDocToConfirmDelete(null)} className="py-4 bg-slate-100 text-[#4B5563] rounded-2xl font-black uppercase text-[11px]">Cancelar</button>
                    <button onClick={() => { if(docToConfirmDelete) onRemoveMonitoring(docToConfirmDelete.id); setDocToConfirmDelete(null); }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px]">Confirmar</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {oficioToDelete && (
        <div id="delete-oficio-modal" className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-6">
                 <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
                 <h3 className="text-[20px] font-bold text-[#111827] uppercase">Excluir Ofício / Documento?</h3>
                 <p className="text-[12px] text-[#4B5563] font-medium uppercase leading-relaxed">
                   Você tem certeza que deseja excluir o ofício número <span className="font-bold text-red-600">[{oficioToDelete.numero}]</span>? Esta ação não pode ser desfeita.
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setOficioToDelete(null)} className="py-4 bg-slate-100 text-[#4B5563] rounded-2xl font-black uppercase text-[11px]">Cancelar</button>
                    <button onClick={() => {
                      handleRemoveOficio(oficioToDelete.docId, oficioToDelete.ofId);
                      setOficioToDelete(null);
                    }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px]">Confirmar Exclusão</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {reqToDelete && (
        <div id="delete-requisicao-modal" className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 overflow-y-auto animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <div className="text-center space-y-6">
                 <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
                 <h3 className="text-[20px] font-bold text-[#111827] uppercase">Excluir Item de Requisição?</h3>
                 <p className="text-[12px] text-[#4B5563] font-medium uppercase leading-relaxed">
                   Você tem certeza que deseja excluir o serviço <span className="font-bold text-red-600">[{reqToDelete.servico}]</span> do monitoramento? Esta ação não pode ser desfeita.
                 </p>
                 <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => setReqToDelete(null)} className="py-4 bg-slate-100 text-[#4B5563] rounded-2xl font-black uppercase text-[11px]">Cancelar</button>
                    <button onClick={() => {
                      handleRemoveRequisicao(reqToDelete.docId, reqToDelete.reqId);
                      setReqToDelete(null);
                    }} className="py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px]">Confirmar Exclusão</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {extendingReq && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setExtendingReq(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Alterar Prazo de Requisição</h3>
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

      {extendingOficio && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setExtendingOficio(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Prorrogar Prazo do Ofício</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#4B5563] uppercase">Nova Data de Resposta Esperada</label>
                  <input type="date" className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold" value={extForm.nova_data} onChange={e => setExtForm({ nova_data: e.target.value })} />
               </div>
            </div>
            <button onClick={handleExtendOficioDeadline} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all">Prorrogar Prazo</button>
          </div>
        </div>
      )}

      {showAddService && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto space-y-6">
            <button onClick={() => setShowAddService(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Adicionar Novo Serviço</h3>
            <div className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#4B5563] uppercase">Área / Serviço</label>
                    <SearchableServiceSelect
                      className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase focus-within:border-blue-500"
                      value={newService.area && newService.servico ? `${newService.area}|${newService.servico}` : ''}
                      onChange={(val) => {
                        if (!val) return;
                        const [area, servico] = val.split('|');
                        setNewService(prev => ({ ...prev, area, servico }));
                      }}
                    />
                  </div>
                  {newService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' && (
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#4B5563] uppercase">Nome do Serviço / Destinatário</label>
                      <input 
                        type="text"
                        placeholder="ESPECIFIQUE O SERVIÇO..."
                        className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newService.servico_custom || ''}
                        onChange={(e) => setNewService(prev => ({ ...prev, servico_custom: e.target.value }))}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#4B5563] uppercase">Prazo</label>
                    <div className="flex gap-2">
                      <select 
                        className="flex-1 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newService.prazo}
                        onChange={(e) => setNewService(prev => ({ ...prev, prazo: e.target.value }))}
                      >
                        <option value="24H">24 HORAS (URGENTE)</option>
                        <option value="48H">48 HORAS</option>
                        <option value="05 DIAS">05 DIAS</option>
                        <option value="10 DIAS">10 DIAS</option>
                        <option value="15 DIAS">15 DIAS</option>
                        <option value="CUSTOM">PERSONALIZAR...</option>
                      </select>
                      {newService.prazo === 'CUSTOM' && (
                        <input 
                          type="number"
                          placeholder="DIAS"
                          className="w-24 p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                          value={newService.prazo_custom}
                          onChange={(e) => setNewService(prev => ({ ...prev, prazo_custom: e.target.value }))}
                        />
                      )}
                    </div>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[#4B5563] uppercase">Observações Técnicas</label>
                  <textarea 
                    className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase min-h-[100px]"
                    placeholder="DETALHAMENTO DA REQUISIÇÃO..."
                    value={newService.observacao}
                    onChange={(e) => setNewService(prev => ({ ...prev, observacao: e.target.value }))}
                  />
               </div>
            </div>
            <button onClick={() => handleAddService(showAddService)} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all shrink-0">Adicionar ao Monitoramento</button>
          </div>
        </div>
      )}

      {showAddOficio && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 backdrop-blur-md bg-slate-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto space-y-6">
            <button onClick={() => setShowAddOficio(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            <h3 className="text-[20px] font-bold text-[#111827] uppercase">Expedir Novo Ofício</h3>
            <div className="space-y-6">
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#4B5563] uppercase">Nº Ofício / Documento</label>
                      <input 
                        type="text"
                        placeholder="Nº OFÍCIO / DOCUMENTO"
                        className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newOficio.numero}
                        onChange={(e) => setNewOficio(prev => ({ ...prev, numero: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#4B5563] uppercase">Nº Com. de Violação</label>
                      <input 
                        type="text"
                        placeholder="Nº COMUNICADO"
                        className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newOficio.numero_comunicado || ''}
                        onChange={(e) => setNewOficio(prev => ({ ...prev, numero_comunicado: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-[#4B5563] uppercase">Nº Procedimento / SIPIA</label>
                      <input 
                        type="text"
                        placeholder="Nº SIPIA"
                        className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase"
                        value={newOficio.numero_sipia || ''}
                        onChange={(e) => setNewOficio(prev => ({ ...prev, numero_sipia: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-[#4B5563] uppercase">Prazo de Resposta</label>
                    <input 
                      type="date"
                      className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl outline-none font-bold"
                      value={newOficio.prazo}
                      onChange={(e) => setNewOficio(prev => ({ ...prev, prazo: e.target.value }))}
                    />
                  </div>
               </div>
            </div>
            <button onClick={() => handleAddOficio(showAddOficio)} className="w-full py-5 bg-[#111827] text-white rounded-2xl font-black uppercase text-[13px] hover:bg-[#2563EB] transition-all shrink-0">Registrar Ofício</button>
          </div>
        </div>
      )}

      {/* MODAL DE ALERTA DE PRAZO VENCIDO OBRIGATÓRIO */}
      {expiredItem && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-xl bg-red-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 md:p-12 border-4 border-red-600 animate-in zoom-in-95 space-y-6 text-center max-h-[90vh] overflow-y-auto">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[24px] font-black text-red-600 uppercase tracking-tighter">Prazo de Monitoramento Vencido!</h3>
              <p className="text-[14px] text-slate-600 font-bold uppercase leading-relaxed">
                O serviço <span className="text-red-600">[{expiredItem.req.servico}]</span> para a criança <span className="text-red-600">[{expiredItem.doc.crianca_nome}]</span> expirou em {formatLocalDateString(expiredItem.req.dataFinal)}.
              </p>
              <p className="text-[12px] text-slate-400 font-bold uppercase">
                Você deve prorrogar o prazo ou encerrar o monitoramento desta família para prosseguir.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => { setExtendingReq({ docId: expiredItem.doc.id, req: expiredItem.req }); setExtForm({ nova_data: expiredItem.req.dataFinal }); setExpiredItem(null); }}
                className="py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Timer className="w-5 h-5" /> Prorrogar Prazo
              </button>
              <button 
                onClick={() => { onRemoveMonitoring(expiredItem.doc.id); setExpiredItem(null); }}
                className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Encerrar Monitoramento
              </button>
            </div>
          </div>
        </div>
      )}

      {expiredOficio && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 backdrop-blur-xl bg-red-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-xl w-full p-8 md:p-12 border-4 border-red-600 animate-in zoom-in-95 space-y-6 text-center max-h-[90vh] overflow-y-auto">
            <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center animate-bounce">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>
            <div className="space-y-4">
              <h3 className="text-[24px] font-black text-red-600 uppercase tracking-tighter">Resposta de Ofício Vencida!</h3>
              <p className="text-[14px] text-slate-600 font-bold uppercase leading-relaxed">
                O prazo para resposta do Ofício <span className="text-red-600">[{expiredOficio.oficio.numero}]</span> para a criança <span className="text-red-600">[{expiredOficio.doc.crianca_nome}]</span> venceu em {formatLocalDateString(expiredOficio.oficio.prazo)}.
              </p>
              <p className="text-[12px] text-slate-400 font-bold uppercase">
                Você deve prorrogar o prazo ou excluir este ofício do monitoramento para prosseguir.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <button 
                onClick={() => { setExtendingOficio({ docId: expiredOficio.doc.id, oficio: expiredOficio.oficio }); setExtForm({ nova_data: expiredOficio.oficio.prazo }); setExpiredOficio(null); }}
                className="py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Timer className="w-5 h-5" /> Prorrogar Prazo
              </button>
              <button 
                onClick={() => { 
                  setOficioToDelete({ 
                    docId: expiredOficio.doc.id, 
                    ofId: expiredOficio.oficio.id, 
                    numero: expiredOficio.oficio.numero 
                  }); 
                  setExpiredOficio(null); 
                }}
                className="py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-red-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" /> Excluir Ofício
              </button>
            </div>
          </div>
        </div>
      )}

      {showInsertManual && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl w-full p-8 md:p-10 border border-[#E5E7EB] animate-in zoom-in-95 my-8 relative flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowInsertManual(false)} 
              className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 border-b border-slate-100 pb-4 mb-6">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                <FilePlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-[20px] font-bold text-[#111827] uppercase tracking-tight">Iniciar Monitoramento Manual</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Cadastrar acompanhamento de caso</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-start gap-3 text-[11px] font-bold uppercase tracking-wide">
                <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
                <span>{modalError}</span>
              </div>
            )}

            <div className="overflow-y-auto flex-1 pr-1 space-y-6 scrollbar-thin">
              {/* Tipo de Inserção: Segmented Control */}
              <div className="space-y-2">
                <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider">Tipo de Vínculo</label>
                <div className="grid grid-cols-2 gap-2 bg-[#F3F4F6] p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setInsertType('existing');
                      setModalError(null);
                    }}
                    className={`py-3 text-[11px] font-black uppercase rounded-xl transition-all ${
                      insertType === 'existing'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Vincular a Procedimento Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInsertType('new');
                      setModalError(null);
                    }}
                    className={`py-3 text-[11px] font-black uppercase rounded-xl transition-all ${
                      insertType === 'new'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Novo Caso Manual
                  </button>
                </div>
              </div>

              {/* Informações Básicas baseadas no Tipo de Vínculo */}
              {insertType === 'existing' ? (
                <div className="space-y-4 border border-slate-100 p-5 rounded-3xl bg-slate-50/50">
                  <div className="text-[11px] font-black text-[#111827] uppercase tracking-widest border-b pb-2 mb-2 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-600" /> Selecione o Procedimento Encontrado
                  </div>
                  
                  <div className="space-y-4 p-4 bg-white border border-slate-100 rounded-2xl">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Buscar por Criança ou Genitora</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="DIGITE O NOME PARA PESQUISAR..."
                          className="w-full p-4 pl-12 bg-slate-50 border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase tracking-wide focus:border-blue-500 focus:bg-white transition-all"
                          value={searchDocQuery}
                          onChange={(e) => {
                            setSearchDocQuery(e.target.value);
                            setSelectedDocId('');
                            setModalError(null);
                          }}
                        />
                        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Procedimento Correspondente</label>
                      <select
                        value={selectedDocId}
                        onChange={(e) => {
                          setSelectedDocId(e.target.value);
                          setModalError(null);
                        }}
                        className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase tracking-wide focus:border-blue-500"
                        disabled={searchDocQuery.trim().length < 2}
                      >
                        {searchDocQuery.trim().length < 2 ? (
                          <option value="">DIGITE PELO MENOS 2 CARACTERES ACIMA PARA BUSCAR...</option>
                        ) : filteredAvailableDocs.length === 0 ? (
                          <option value="">NENHUM CASO ENCONTRADO PARA "{searchDocQuery.toUpperCase()}"</option>
                        ) : (
                          <>
                            <option value="">SELECIONAR CASO/PRONTUÁRIO ({filteredAvailableDocs.length})...</option>
                            {filteredAvailableDocs.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.crianca_nome} (REF: {d.id}) - MÃE: {d.genitora_nome || 'NÃO INFORMADA'}
                              </option>
                            ))}
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border border-slate-100 p-5 rounded-3xl bg-slate-50/50">
                  <div className="text-[11px] font-black text-slate-800 uppercase tracking-widest border-b pb-2 mb-2 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" /> Identificação do Caso
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Nome da Criança / Adolescente</label>
                      <input
                        type="text"
                        placeholder="NOME COMPLETO..."
                        className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase tracking-wide focus:border-blue-500"
                        value={newDocData.criancaNome}
                        onChange={(e) => {
                          setNewDocData(prev => ({ ...prev, criancaNome: e.target.value }));
                          setModalError(null);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Nome da Mãe / Responsável</label>
                      <input
                        type="text"
                        placeholder="NOME COMPLETO (OPCIONAL)..."
                        className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase tracking-wide focus:border-blue-500"
                        value={newDocData.genitoraNome}
                        onChange={(e) => {
                          setNewDocData(prev => ({ ...prev, genitoraNome: e.target.value }));
                          setModalError(null);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Bairro da Criança *</label>
                    <SearchableSelect
                      className="w-full p-4 bg-[#F9FAFB] border border-[#E5E7EB] rounded-2xl font-bold uppercase text-[11px] tracking-wide focus:border-blue-500"
                      placeholder="SELECIONE O BAIRRO..."
                      options={BAIRROS}
                      value={newDocData.bairro}
                      onChange={(val) => {
                        setNewDocData(prev => ({ ...prev, bairro: val }));
                        setModalError(null);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Informações da Primeira Requisição de Serviço */}
              <div className="space-y-4 border border-slate-100 p-5 rounded-3xl bg-blue-50/20">
                <div className="text-[11px] font-black text-blue-900 uppercase tracking-widest border-b border-blue-100 pb-2 mb-2 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-blue-600" /> Detalhes do Serviço / Requisição Inicial
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Área / Serviço Público</label>
                    <SearchableServiceSelect
                      className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase focus-within:border-blue-500"
                      value={manualService.area ? `${manualService.area}|${manualService.servico}` : ''}
                      onChange={(val) => {
                        if (!val) {
                          setManualService(prev => ({ ...prev, area: '', servico: '' }));
                          return;
                        }
                        const [area, servico] = val.split('|');
                        setManualService(prev => ({ ...prev, area, servico }));
                        setModalError(null);
                      }}
                    />
                  </div>

                  {manualService.servico === 'OUTROS SERVIÇOS / FORA DA REDE' && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Nome Customizado do Serviço</label>
                      <input
                        type="text"
                        placeholder="ESPECIFIQUE O SERVIÇO..."
                        className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase tracking-wide focus:border-blue-500"
                        value={manualService.servico_custom || ''}
                        onChange={(e) => {
                          setManualService(prev => ({ ...prev, servico_custom: e.target.value }));
                          setModalError(null);
                        }}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Prazo de Resposta / Retorno</label>
                    <div className="flex gap-2">
                      <select
                        className="flex-1 p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase focus:border-blue-500"
                        value={manualService.prazo}
                        onChange={(e) => {
                          setManualService(prev => ({ ...prev, prazo: e.target.value }));
                          setModalError(null);
                        }}
                      >
                        <option value="24H">24 HORAS (URGENTE)</option>
                        <option value="48H">48 HORAS</option>
                        <option value="05 DIAS">05 DIAS</option>
                        <option value="10 DIAS">10 DIAS</option>
                        <option value="15 DIAS">15 DIAS</option>
                        <option value="CUSTOM">PERSONALIZAR...</option>
                      </select>
                      {manualService.prazo === 'CUSTOM' && (
                        <input
                          type="number"
                          placeholder="DIAS"
                          className="w-24 p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase focus:border-blue-500"
                          value={manualService.prazo_custom}
                          onChange={(e) => {
                            setManualService(prev => ({ ...prev, prazo_custom: e.target.value }));
                            setModalError(null);
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider">Observações Técnicas</label>
                  <textarea
                    className="w-full p-4 bg-white border border-[#E5E7EB] rounded-2xl outline-none font-bold text-[11px] uppercase min-h-[100px] focus:border-blue-500"
                    placeholder="DETALHAMENTO DA REQUISIÇÃO..."
                    value={manualService.observacao}
                    onChange={(e) => {
                      setManualService(prev => ({ ...prev, observacao: e.target.value }));
                      setModalError(null);
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={() => setShowInsertManual(false)}
                className="flex-1 py-4 bg-slate-100 text-[#4B5563] rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInsertManualMonitoring}
                className="flex-1 py-4 bg-[#111827] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-600 transition-all shadow-md"
              >
                Confirmar Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
