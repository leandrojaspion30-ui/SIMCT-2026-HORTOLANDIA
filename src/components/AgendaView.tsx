import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Trash2, 
  X,
  AlertCircle,
  Save,
  UserRound,
  ClipboardCheck,
  Edit3,
  ArrowLeft,
  RotateCw,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Home,
  CheckCircle2,
  TrendingUp,
  Activity,
  FileText
} from 'lucide-react';
import { AgendaEntry, User, Documento } from '../types';
import { INITIAL_USERS, AGENDA_TIPOS } from '../constants';
import { saveAgenda, deleteAgenda } from '../lib/db';

interface AgendaViewProps {
  agenda: AgendaEntry[];
  users: User[];
  setAgenda: (agenda: AgendaEntry[]) => void;
  allDocuments: Documento[];
  currentUser: User;
  effectiveUserId: string;
  isReadOnly?: boolean;
  onAddLog: (action: string) => void;
}

const COUNCILOR_AVATAR_COLORS = [
  { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', dotBg: 'bg-emerald-500' },
  { bg: 'bg-teal-600', text: 'text-teal-600', border: 'border-teal-500', dotBg: 'bg-teal-500' },
  { bg: 'bg-rose-600', text: 'text-rose-600', border: 'border-rose-500', dotBg: 'bg-rose-500' },
  { bg: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-500', dotBg: 'bg-amber-500' },
  { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', dotBg: 'bg-purple-500' },
  { bg: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-500', dotBg: 'bg-blue-500' },
];

const getEventCardStyle = (tipo: string) => {
  const t = (tipo || '').toUpperCase();
  if (t.includes('VISITA')) {
    return {
      bg: 'bg-emerald-50/90 hover:bg-emerald-100/90',
      borderLeft: 'border-l-4 border-emerald-500',
      titleColor: 'text-emerald-900',
      bodyColor: 'text-emerald-800',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800',
      Icon: Home
    };
  }
  if (t.includes('MONITORAMENTO')) {
    return {
      bg: 'bg-amber-50/90 hover:bg-amber-100/90',
      borderLeft: 'border-l-4 border-amber-500',
      titleColor: 'text-amber-900',
      bodyColor: 'text-amber-800',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800',
      Icon: TrendingUp
    };
  }
  if (t.includes('REUNIÃO') || t.includes('REUNIAO') || t.includes('ARTICULAÇÃO')) {
    return {
      bg: 'bg-purple-50/90 hover:bg-purple-100/90',
      borderLeft: 'border-l-4 border-purple-500',
      titleColor: 'text-purple-900',
      bodyColor: 'text-purple-800',
      iconColor: 'text-purple-600',
      badge: 'bg-purple-100 text-purple-800',
      Icon: Users
    };
  }
  if (t.includes('URGÊNCIA') || t.includes('URGENCIA') || t.includes('PRAZO') || t.includes('DENÚNCIA')) {
    return {
      bg: 'bg-rose-50/90 hover:bg-rose-100/90',
      borderLeft: 'border-l-4 border-rose-500',
      titleColor: 'text-rose-900',
      bodyColor: 'text-rose-800',
      iconColor: 'text-rose-600',
      badge: 'bg-rose-100 text-rose-800',
      Icon: AlertCircle
    };
  }
  return {
    bg: 'bg-blue-50/90 hover:bg-blue-100/90',
    borderLeft: 'border-l-4 border-blue-500',
    titleColor: 'text-blue-900',
    bodyColor: 'text-blue-800',
    iconColor: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-800',
    Icon: UserRound
  };
};

const AgendaView: React.FC<AgendaViewProps> = ({ agenda, users, setAgenda, allDocuments, currentUser, effectiveUserId, isReadOnly, onAddLog }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isAdmin = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  const [filterType, setFilterType] = useState<'MY' | 'UNIT'>(isAdmin ? 'UNIT' : 'MY');
  
  const localNow = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000));
  const todayStr = localNow.toISOString().split('T')[0];

  // Calendar State
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<'DIA' | 'SEMANA' | 'MES' | 'LISTA'>('SEMANA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCouncilorFilter, setSelectedCouncilorFilter] = useState<string>('ALL');

  const councilors = useMemo(() => {
    return users.filter(u => {
      if (u.status === 'EXCLUIDO') return false;
      if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
      if (currentUser.unidade_id && u.unidade_id !== currentUser.unidade_id) return false;
      return true;
    });
  }, [users, currentUser]);

  const [visibleCouncilorIds, setVisibleCouncilorIds] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    councilors.forEach(c => { map[c.id] = true; });
    return map;
  });

  const toggleCouncilorVisibility = (id: string) => {
    setVisibleCouncilorIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const [newEntry, setNewEntry] = useState<Omit<AgendaEntry, 'id' | 'unidade_id'>>({
    conselheiro_id: isAdmin ? '' : effectiveUserId,
    data: todayStr,
    hora: '09:00',
    local: '',
    participantes: '',
    genitores_responsavel: '',
    documento_id: '',
    descricao: '',
    tipo: 'REUNIAO',
    status: 'PENDENTE'
  });

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.conselheiro_id) {
      alert("ERRO: Selecione um conselheiro para este compromisso.");
      return;
    }

    const now = new Date();
    const localNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    const todayStrLocal = localNow.toISOString().split('T')[0];
    const currentTimeStrLocal = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    if (newEntry.data < todayStrLocal) {
      alert("BLOQUEIO DE SEGURANÇA: Não é permitido realizar agendamentos em datas retroativas. O SIMCT exige conformidade com o cronograma atual.");
      return;
    }

    if (newEntry.data === todayStrLocal && newEntry.hora < currentTimeStrLocal && !editingId) {
      alert("BLOQUEIO DE SEGURANÇA: O horário selecionado já passou. Novos agendamentos ou reagendamentos devem ser para horários futuros.");
      return;
    }

    const hasConflict = agenda.some(entry => {
      if (entry.id === editingId) return false;
      if (entry.conselheiro_id !== newEntry.conselheiro_id || entry.data !== newEntry.data) return false;
      if (entry.status === 'REAGENDADO') return false;

      const [h1, m1] = entry.hora.split(':').map(Number);
      const [h2, m2] = newEntry.hora.split(':').map(Number);
      const totalMinutes1 = h1 * 60 + m1;
      const totalMinutes2 = h2 * 60 + m2;
      return Math.abs(totalMinutes1 - totalMinutes2) < 30;
    });

    if (hasConflict) {
      alert("CONFLITO DE AGENDA: Já existe um compromisso agendado para este conselheiro em um intervalo inferior a 30 minutos. Por favor, ajuste o horário para evitar sobreposições.");
      return;
    }

    if (editingId) {
      await saveAgenda({ ...newEntry, id: editingId, unidade_id: currentUser.unidade_id }, currentUser);
      onAddLog(`AGENDA: Compromisso atualizado: ${newEntry.descricao}.`);
    } else {
      const entry: AgendaEntry = { ...newEntry, id: `agenda-${Date.now()}`, unidade_id: currentUser.unidade_id } as AgendaEntry;
      await saveAgenda(entry, currentUser);
      
      const assignedUser = users.find(u => u.id === entry.conselheiro_id);
      onAddLog(`AGENDA: Novo compromisso agendado para ${assignedUser?.nome}: ${entry.descricao} em ${entry.data} às ${entry.hora}.`);
    }
    
    setShowAddModal(false);
    setEditingId(null);
    setNewEntry({
      conselheiro_id: isAdmin ? '' : effectiveUserId,
      data: selectedDateStr || todayStr,
      hora: '09:00',
      local: '',
      participantes: '',
      genitores_responsavel: '',
      documento_id: '',
      descricao: '',
      tipo: 'REUNIAO',
      status: 'PENDENTE'
    });
  };

  const visibleEvents = useMemo(() => {
    return agenda
      .filter(item => {
        if (item.excluido) return false;
        if (filterType === 'MY' && item.conselheiro_id !== effectiveUserId) {
          return false;
        }
        if (item.unidade_id && item.unidade_id !== currentUser.unidade_id) {
          return false;
        }
        if (selectedCouncilorFilter !== 'ALL' && item.conselheiro_id !== selectedCouncilorFilter) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matches = 
            item.descricao?.toLowerCase().includes(q) ||
            item.local?.toLowerCase().includes(q) ||
            item.participantes?.toLowerCase().includes(q) ||
            item.genitores_responsavel?.toLowerCase().includes(q) ||
            item.tipo?.toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.data).getTime() - new Date(b.data).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.hora.localeCompare(b.hora);
      });
  }, [agenda, filterType, effectiveUserId, currentUser, selectedCouncilorFilter, searchQuery]);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, desc: string} | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = (id: string, desc: string) => {
    setItemToDelete({ id, desc });
    setShowConfirmDelete(true);
  };

  const confirmDeleteAction = async () => {
    if (!itemToDelete || deletingId) return;
    
    setDeletingId(itemToDelete.id);
    try {
      await deleteAgenda(itemToDelete.id, currentUser);
      onAddLog(`AGENDA: Compromisso "${itemToDelete.desc}" removido da agenda ativa (registro preservado para fins estatísticos).`);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Critical Delete Error:", error);
      alert("ERRO DE CONEXÃO: Não foi possível excluir agora. Tente novamente.");
    } finally {
      setDeletingId(null);
      setItemToDelete(null);
    }
  };

  const handleEdit = (item: AgendaEntry) => {
    setEditingId(item.id);
    setNewEntry({
      conselheiro_id: item.conselheiro_id,
      data: item.data,
      hora: item.hora,
      local: item.local,
      participantes: item.participantes,
      genitores_responsavel: item.genitores_responsavel || '',
      documento_id: item.documento_id || '',
      descricao: item.descricao,
      tipo: item.tipo,
      status: item.status || 'PENDENTE'
    });
    setShowAddModal(true);
  };

  const handleOutcome = async (id: string, outcome: 'COMPARECEU' | 'NAO_COMPARECEU' | 'PENDENTE') => {
    try {
      const entry = agenda.find(a => a.id === id);
      if (!entry) return;

      if (outcome === 'NAO_COMPARECEU') {
        let nextTipo = '';
        let message = '';

        if (entry.tipo === 'NOTIFICACAO 1') {
          nextTipo = 'NOTIFICACAO 2';
          message = 'A família não compareceu. Deseja notificar pela segunda vez?';
        } else if (entry.tipo === 'NOTIFICACAO 2') {
          nextTipo = 'NOTIFICACAO 3';
          message = 'A família não compareceu. Deseja notificar pela terceira vez?';
        } else {
          message = 'A família não compareceu. Deseja agendar um novo compromisso ou apenas registrar como não compareceu?';
        }

        const choice = window.confirm(message);
        onAddLog(`AGENDA: Família não compareceu ao compromisso: ${entry.tipo} - ${entry.descricao}.`);

        if (choice) {
          await saveAgenda({ ...entry, id, status: 'REAGENDADO' }, currentUser);
          setNewEntry({
            ...entry,
            tipo: (nextTipo || entry.tipo) as any,
            data: todayStr,
            status: 'PENDENTE'
          });
          setShowAddModal(true);
          return;
        }
      }

      await saveAgenda({ ...entry, id, status: outcome }, currentUser);
      onAddLog(`AGENDA: Status do compromisso "${entry.descricao}" alterado para ${outcome}.`);
      
    } catch (error) {
      console.error("Error updating agenda status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  // Mini Calendar Calculations
  const [miniCalDate, setMiniCalDate] = useState<Date>(() => new Date());

  const miniCalGrid = useMemo(() => {
    const year = miniCalDate.getFullYear();
    const month = miniCalDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; isCurrentMonth: boolean; fullDate: string }> = [];

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthTotalDays - i;
      const pDate = new Date(year, month - 1, d);
      const localStr = new Date(pDate.getTime() - (pDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      days.push({ day: d, isCurrentMonth: false, fullDate: localStr });
    }

    for (let i = 1; i <= totalDays; i++) {
      const cDate = new Date(year, month, i);
      const localStr = new Date(cDate.getTime() - (cDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      days.push({ day: i, isCurrentMonth: true, fullDate: localStr });
    }

    const remaining = 35 - days.length > 0 ? 35 - days.length : (42 - days.length);
    for (let i = 1; i <= remaining; i++) {
      const nDate = new Date(year, month + 1, i);
      const localStr = new Date(nDate.getTime() - (nDate.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      days.push({ day: i, isCurrentMonth: false, fullDate: localStr });
    }

    return days;
  }, [miniCalDate]);

  // Formatted selected date text
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    return `${d} de ${months[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
  }, [selectedDateStr]);

  const selectedDateDayAbbrev = useMemo(() => {
    if (!selectedDateStr) return '';
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const abbrevs = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÁB.'];
    return abbrevs[dateObj.getDay()];
  }, [selectedDateStr]);

  const changeDateByDays = (delta: number) => {
    const [y, m, d] = selectedDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + delta);
    const localStr = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
    setSelectedDateStr(localStr);
  };

  // Visible councilors in calendar grid columns
  const activeCouncilorsInGrid = useMemo(() => {
    return councilors.filter(c => visibleCouncilorIds[c.id] !== false);
  }, [councilors, visibleCouncilorIds]);

  // Hours list for calendar grid
  const HOURS = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

  const nowHours = new Date().getHours();
  const nowMins = new Date().getMinutes();
  const nowTimeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMins).padStart(2, '0')}`;
  const isTodaySelected = selectedDateStr === todayStr;

  return (
    <div className="space-y-5 pb-16 max-w-[1600px] mx-auto animate-in fade-in duration-500 font-sans text-slate-800">
      
      {/* 1. CABEÇALHO */}
      <header className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-black uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> VOLTAR
          </button>
          <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-xs shrink-0">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
              Agenda do Conselho
            </h1>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
              Gestão de compromissos e prazos institucionais
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase text-slate-700 transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-500" /> ATUALIZAR
          </button>
          
          {(currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE') && (
            <div className="relative">
              <select 
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-3.5 py-2 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-xl text-xs font-extrabold uppercase text-slate-700 transition-all shadow-2xs cursor-pointer outline-none"
              >
                <option value="MY">Meus Compromissos</option>
                <option value="UNIT">Agenda da Unidade</option>
              </select>
            </div>
          )}

          {!isReadOnly && (
            <button 
              onClick={() => {
                setEditingId(null);
                setNewEntry({
                  conselheiro_id: isAdmin ? '' : effectiveUserId,
                  data: selectedDateStr || todayStr,
                  hora: '09:00',
                  local: '',
                  participantes: '',
                  genitores_responsavel: '',
                  documento_id: '',
                  descricao: '',
                  tipo: 'REUNIAO',
                  status: 'PENDENTE'
                });
                setShowAddModal(true);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> NOVO COMPROMISSO
            </button>
          )}
        </div>
      </header>

      {/* 2. BARRA SUPERIOR (Single White Card) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-3 px-4 flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Date Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-start">
          <button 
            onClick={() => setSelectedDateStr(todayStr)}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase transition-all cursor-pointer"
          >
            Hoje
          </button>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => changeDateByDays(-1)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all cursor-pointer"
              title="Dia anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => changeDateByDays(1)}
              className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 transition-all cursor-pointer"
              title="Próximo dia"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50/80 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs font-black text-slate-800">
            <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
            <input 
              type="date" 
              value={selectedDateStr}
              onChange={e => setSelectedDateStr(e.target.value)}
              className="bg-transparent font-black text-xs text-slate-800 outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Search, Councilor Filter & View Mode */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar compromisso..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <select 
            value={selectedCouncilorFilter}
            onChange={e => setSelectedCouncilorFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="ALL">Todos os conselheiros</option>
            {councilors.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <div className="flex bg-slate-100/80 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('DIA')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                viewMode === 'DIA' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Dia
            </button>
            <button 
              onClick={() => setViewMode('SEMANA')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                viewMode === 'SEMANA' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Semana
            </button>
            <button 
              onClick={() => setViewMode('MES')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                viewMode === 'MES' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Mês
            </button>
            <button 
              onClick={() => setViewMode('LISTA')}
              className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase transition-all cursor-pointer ${
                viewMode === 'LISTA' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* 3 & 4. MAIN CONTENT GRID (Sidebar + Schedule Matrix) */}
      <div className="flex flex-col lg:flex-row items-start gap-5">
        
        {/* SIDEBAR ESQUERDA */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          
          {/* Mini Calendário */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                {miniCalDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMiniCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setMiniCalDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase mb-2">
              <span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
              {miniCalGrid.map((item, idx) => {
                const isSelected = item.fullDate === selectedDateStr;
                const isToday = item.fullDate === todayStr;

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDateStr(item.fullDate)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600 text-white font-black shadow-2xs' 
                        : isToday 
                        ? 'bg-blue-100 text-blue-700 font-black'
                        : item.isCurrentMonth 
                        ? 'text-slate-700 hover:bg-slate-100' 
                        : 'text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conselheiros Lista */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Conselheiros
            </h3>
            <div className="space-y-2">
              {councilors.map((c, idx) => {
                const colorScheme = COUNCILOR_AVATAR_COLORS[idx % COUNCILOR_AVATAR_COLORS.length];
                const isChecked = visibleCouncilorIds[c.id] !== false;

                return (
                  <label 
                    key={c.id} 
                    className="flex items-center gap-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none"
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleCouncilorVisibility(c.id)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className={`w-2.5 h-2.5 rounded-full ${colorScheme.dotBg}`} />
                    <span className="truncate">{c.nome}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Legenda de Compromissos */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Legenda de compromissos
            </h3>
            <div className="space-y-2 text-xs font-bold text-slate-600">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Atendimento / Notificação</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Visita Domiciliar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Monitoramento</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Reunião / Articulação</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Urgência / Prazo</span>
              </div>
            </div>
          </div>

        </aside>

        {/* SCHEDULE MATRIX / GRID */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden flex flex-col">
          
          {viewMode === 'LISTA' ? (
            /* LIST VIEW */
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Compromissos Cadastrados ({visibleEvents.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {visibleEvents.map((item) => {
                  const assignedUser = users.find(u => u.id === item.conselheiro_id);
                  const cardStyle = getEventCardStyle(item.tipo);
                  const IconComp = cardStyle.Icon;

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border border-slate-100 ${cardStyle.bg} ${cardStyle.borderLeft} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-2xs hover:shadow-xs`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase ${cardStyle.badge}`}>
                            {item.tipo}
                          </span>
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> {item.data} às {item.hora}
                          </span>
                          <span className="text-xs font-bold text-slate-500">
                            • {assignedUser?.nome || 'N/A'}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 uppercase">
                          {item.descricao}
                        </h4>
                        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                          {item.local && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {item.local}</span>}
                          {item.participantes && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-blue-500" /> {item.participantes}</span>}
                          {item.genitores_responsavel && <span className="flex items-center gap-1"><UserRound className="w-3.5 h-3.5 text-blue-500" /> {item.genitores_responsavel}</span>}
                        </div>
                      </div>

                      {!isReadOnly && (
                        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                          <button 
                            onClick={() => handleOutcome(item.id, 'COMPARECEU')}
                            className={`p-2 rounded-xl transition-all ${item.status === 'COMPARECEU' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50'}`}
                            title="Compareceu"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleOutcome(item.id, 'NAO_COMPARECEU')}
                            className={`p-2 rounded-xl transition-all ${item.status === 'NAO_COMPARECEU' ? 'bg-amber-600 text-white' : 'bg-white text-amber-600 border border-amber-200 hover:bg-amber-50'}`}
                            title="Não Compareceu"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-xl transition-all"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, item.descricao)} 
                            disabled={deletingId === item.id}
                            className="p-2 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-xl transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {visibleEvents.length === 0 && (
                  <div className="py-20 text-center text-slate-400 space-y-2">
                    <CalendarIcon className="w-12 h-12 mx-auto text-slate-300" />
                    <p className="text-xs font-black uppercase tracking-wider">
                      Nenhum compromisso encontrado na busca/filtro.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CALENDAR MATRIX GRID (Dia / Semana / Mês) */
            <div className="overflow-x-auto relative">
              <table className="w-full border-collapse text-left min-w-[800px]">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/50 text-xs font-black uppercase text-slate-500">
                    <th className="p-3 w-28 text-center border-r border-slate-200/80 font-mono text-[11px]">
                      <div className="text-[10px] text-slate-400 font-bold">GMT-03</div>
                      <div className="text-blue-600 text-xs font-black mt-0.5">
                        {selectedDateDayAbbrev} <span className="p-1 px-1.5 bg-blue-600 text-white rounded-full text-[10px]">{selectedDateStr.split('-')[2]}</span>
                      </div>
                    </th>
                    {activeCouncilorsInGrid.map((c, idx) => {
                      const colorScheme = COUNCILOR_AVATAR_COLORS[idx % COUNCILOR_AVATAR_COLORS.length];
                      const initial = (c.nome || 'C').charAt(0).toUpperCase();

                      return (
                        <th key={c.id} className="p-3 border-r border-slate-200/80 text-center font-extrabold text-slate-800">
                          <div className="flex items-center justify-center gap-2">
                            <span className={`w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center ${colorScheme.bg}`}>
                              {initial}
                            </span>
                            <span className="truncate max-w-[140px]">{c.nome}</span>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-xs">
                  {HOURS.map((hourStr) => {
                    return (
                      <tr key={hourStr} className="min-h-[80px] hover:bg-slate-50/30 transition-colors">
                        {/* Hour Label */}
                        <td className="p-3 align-top text-center border-r border-slate-200/80 font-mono font-bold text-slate-400 text-[11px] bg-slate-50/30 select-none">
                          {hourStr}
                        </td>

                        {/* Councilor Cells */}
                        {activeCouncilorsInGrid.map((c) => {
                          const hourPrefix = hourStr.split(':')[0]; // e.g. "09"
                          
                          // Events for this councilor on selected date and this hour
                          const eventsForCell = visibleEvents.filter(item => {
                            if (item.conselheiro_id !== c.id) return false;
                            if (item.data !== selectedDateStr) return false;
                            const itemHour = (item.hora || '').split(':')[0];
                            return itemHour === hourPrefix;
                          });

                          return (
                            <td key={c.id} className="p-2 align-top border-r border-slate-100 min-h-[80px] relative">
                              {eventsForCell.map(item => {
                                const cardStyle = getEventCardStyle(item.tipo);
                                const IconComp = cardStyle.Icon;

                                return (
                                  <div 
                                    key={item.id}
                                    onClick={() => handleEdit(item)}
                                    className={`p-2.5 rounded-xl border border-slate-100/80 ${cardStyle.bg} ${cardStyle.borderLeft} shadow-2xs hover:shadow-md transition-all cursor-pointer space-y-1 group mb-2`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className={`font-black text-[10px] uppercase truncate ${cardStyle.titleColor}`}>
                                        {item.tipo}
                                      </span>
                                      <IconComp className={`w-3.5 h-3.5 shrink-0 ${cardStyle.iconColor}`} />
                                    </div>

                                    {item.participantes && (
                                      <p className="text-xs font-black text-slate-900 truncate">
                                        {item.participantes}
                                      </p>
                                    )}

                                    {item.descricao && !item.participantes && (
                                      <p className="text-xs font-black text-slate-900 truncate">
                                        {item.descricao}
                                      </p>
                                    )}

                                    <div className="text-[10px] font-bold text-slate-600 flex items-center justify-between pt-0.5">
                                      <span className="font-mono">{item.hora}</span>
                                      {item.local && <span className="truncate max-w-[90px]">{item.local}</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* CURRENT TIME RED LINE (if today is selected) */}
              {isTodaySelected && nowHours >= 7 && nowHours <= 18 && (
                <div 
                  className="absolute left-0 right-0 border-t-2 border-rose-500 z-10 pointer-events-none flex items-center"
                  style={{
                    top: `${((nowHours - 7) + nowMins / 60) * 80 + 45}px`
                  }}
                >
                  <span className="bg-rose-500 text-white text-[9px] font-mono font-black px-1.5 py-0.5 rounded-r-md">
                    {nowTimeStr}
                  </span>
                </div>
              )}

              {/* Matrix Footer */}
              <div className="p-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400">
                <span>GMT-03 | Horário de Brasília</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Última atualização: agora há pouco
                </span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* CONFIRM DELETE MODAL */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 border border-slate-100 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase text-slate-800">Excluir Compromisso?</h3>
              <p className="text-xs font-bold text-slate-400 uppercase mt-1">
                Remover da agenda ativa:<br/> 
                <span className="text-rose-600">"{itemToDelete?.desc}"</span>?
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                O evento sairá da grade visual, mas será contabilizado no relatório estatístico institucional.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button 
                onClick={confirmDeleteAction}
                disabled={deletingId !== null}
                className="w-full py-3 bg-rose-600 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md hover:bg-rose-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {deletingId ? 'Processando...' : 'Sim, Excluir Agora'}
              </button>
              <button 
                onClick={() => { setShowConfirmDelete(false); setItemToDelete(null); }}
                className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs tracking-wider hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT COMPROMISSO MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]">
            <header className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl">
                    {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <h3 className="font-black uppercase tracking-tight text-base">
                    {editingId ? 'Editar Compromisso' : 'Novo Compromisso'}
                  </h3>
               </div>
               <button 
                onClick={() => { setShowAddModal(false); setEditingId(null); }} 
                className="p-1.5 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white cursor-pointer"
               >
                <X className="w-5 h-5" />
               </button>
            </header>

            <form onSubmit={handleAddEntry} className="p-6 sm:p-8 space-y-5 overflow-y-auto">
               {isAdmin && (
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conselheiro Destinatário</label>
                   <select 
                      required 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={newEntry.conselheiro_id}
                      onChange={e => setNewEntry({...newEntry, conselheiro_id: e.target.value})}
                   >
                     <option value="">Selecione o Conselheiro...</option>
                     {councilors.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </select>
                 </div>
               )}

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Compromisso</label>
                   <select 
                      required 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                      value={newEntry.tipo}
                      onChange={e => setNewEntry({...newEntry, tipo: e.target.value})}
                   >
                     <option value="">Selecione o tipo...</option>
                     {AGENDA_TIPOS.map(group => (
                       <optgroup key={group.category} label={group.category}>
                         {group.options.map(opt => (
                           <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                         ))}
                       </optgroup>
                     ))}
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horário</label>
                   <input 
                    required 
                    type="time" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-blue-500 transition-all" 
                    value={newEntry.hora} 
                    onChange={e => setNewEntry({...newEntry, hora: e.target.value})} 
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vincular Prontuário / Família (Opcional)</label>
                  <select 
                     className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all cursor-pointer"
                     value={newEntry.documento_id}
                     onChange={e => {
                       const docId = e.target.value;
                       const doc = allDocuments.find(d => d.id === docId);
                       setNewEntry({
                         ...newEntry, 
                         documento_id: docId,
                         genitores_responsavel: doc ? doc.genitora_nome.toUpperCase() : newEntry.genitores_responsavel,
                         participantes: doc ? doc.crianca_nome.toUpperCase() : newEntry.participantes
                       });
                     }}
                  >
                    <option value="">Selecione um Prontuário...</option>
                    {allDocuments.sort((a, b) => a.crianca_nome.localeCompare(b.crianca_nome)).map(d => (
                      <option key={d.id} value={d.id}>{d.crianca_nome} (Mãe: {d.genitora_nome})</option>
                    ))}
                  </select>
                </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genitores / Responsável Legal</label>
                 <input 
                  placeholder="NOME DOS GENITORES OU RESPONSÁVEL" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all" 
                  value={newEntry.genitores_responsavel} 
                  onChange={e => setNewEntry({...newEntry, genitores_responsavel: e.target.value.toUpperCase()})} 
                 />
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data do Evento</label>
                   <input 
                    required 
                    type="date" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all" 
                    value={newEntry.data} 
                    onChange={e => setNewEntry({...newEntry, data: e.target.value})} 
                   />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local</label>
                   <input 
                    required 
                    placeholder="LOCAL DO COMPROMISSO" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all" 
                    value={newEntry.local} 
                    onChange={e => setNewEntry({...newEntry, local: e.target.value.toUpperCase()})} 
                   />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assunto / Descrição</label>
                 <textarea 
                  required 
                  placeholder="DESCRITIVO DO EVENTO..." 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs uppercase outline-none focus:border-blue-500 transition-all min-h-[90px]" 
                  value={newEntry.descricao} 
                  onChange={e => setNewEntry({...newEntry, descricao: e.target.value.toUpperCase()})} 
                 />
               </div>

               <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                 {editingId && (
                   <button 
                    type="button" 
                    onClick={() => {
                      const desc = newEntry.descricao || 'Compromisso';
                      const targetId = editingId;
                      setShowAddModal(false);
                      setEditingId(null);
                      handleDelete(targetId, desc);
                    }}
                    className="w-full sm:w-auto py-4 px-6 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                   >
                     <Trash2 className="w-4 h-4" /> Excluir Compromisso
                   </button>
                 )}
                 <button 
                  type="submit" 
                  className="flex-1 w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                 >
                    <Save className="w-5 h-5" /> {editingId ? 'Salvar Alterações' : 'Salvar Agendamento'}
                 </button>
               </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AgendaView;
