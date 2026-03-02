
import React, { useState } from 'react';
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Trash2, 
  X,
  AlertCircle,
  Save
} from 'lucide-react';
import { AgendaEntry, User } from '../types';
import { INITIAL_USERS } from '../constants';

interface AgendaViewProps {
  agenda: AgendaEntry[];
  setAgenda: React.Dispatch<React.SetStateAction<AgendaEntry[]>>;
  currentUser: User;
  effectiveUserId: string;
  isReadOnly?: boolean;
  onAddLog: (action: string) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ agenda, setAgenda, currentUser, effectiveUserId, isReadOnly, onAddLog }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const todayStr = new Date().toISOString().split('T')[0];
  const isAdmin = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  const councilors = INITIAL_USERS.filter(u => u.perfil === 'CONSELHEIRO' && u.unidade_id === currentUser.unidade_id);
  
  const [newEntry, setNewEntry] = useState<Omit<AgendaEntry, 'id' | 'unidade_id'>>({
    conselheiro_id: isAdmin ? '' : effectiveUserId,
    data: todayStr,
    hora: '09:00',
    local: '',
    participantes: '',
    descricao: '',
    tipo: 'REUNIAO'
  });

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.conselheiro_id) {
      alert("ERRO: Selecione um conselheiro para este compromisso.");
      return;
    }

    const now = new Date();
    const todayStrLocal = now.toISOString().split('T')[0];
    const currentTimeStrLocal = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

    if (newEntry.data < todayStrLocal) {
      alert("ERRO DE SEGURANÇA: Não é permitido realizar agendamentos em datas retroativas.");
      return;
    }

    if (newEntry.data === todayStrLocal && newEntry.hora < currentTimeStrLocal) {
      alert("ERRO DE SEGURANÇA: O horário selecionado já passou. Não é permitido agendamento retroativo para o dia de hoje.");
      return;
    }

    const hasConflict = agenda.some(entry => {
      if (entry.conselheiro_id !== newEntry.conselheiro_id || entry.data !== newEntry.data) return false;
      const [h1, m1] = entry.hora.split(':').map(Number);
      const [h2, m2] = newEntry.hora.split(':').map(Number);
      const totalMinutes1 = h1 * 60 + m1;
      const totalMinutes2 = h2 * 60 + m2;
      return Math.abs(totalMinutes1 - totalMinutes2) < 30;
    });

    if (hasConflict) {
      alert("CONFLITO DE AGENDA: Já existe um compromisso agendado para este conselheiro em um intervalo inferior a 30 minutos neste mesmo dia.");
      return;
    }

    const entry: AgendaEntry = { ...newEntry, id: `agenda-${Date.now()}`, unidade_id: currentUser.unidade_id };
    setAgenda(prev => [...prev, entry]);
    
    const assignedUser = INITIAL_USERS.find(u => u.id === entry.conselheiro_id);
    onAddLog(`AGENDA: Novo compromisso agendado para ${assignedUser?.nome}: ${entry.descricao} em ${entry.data} às ${entry.hora}.`);
    
    setShowAddModal(false);
    setNewEntry({
      conselheiro_id: isAdmin ? '' : effectiveUserId,
      data: todayStr,
      hora: '09:00',
      local: '',
      participantes: '',
      descricao: '',
      tipo: 'REUNIAO'
    });
  };

  const visibleEvents = agenda
    .filter(a => isAdmin ? true : a.conselheiro_id === effectiveUserId)
    .sort((a, b) => {
      const dateCompare = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });

  const handleDelete = (id: string, desc: string) => {
    if (window.confirm(`SICT: Tem certeza que deseja remover o compromisso: "${desc}"?`)) {
      setAgenda(prev => prev.filter(a => a.id !== id));
      onAddLog(`AGENDA: Compromisso removido: ${desc}.`);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex justify-between items-center bg-white p-10 rounded-[2.5rem] border shadow-sm">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><Calendar className="w-6 h-6 text-white" /></div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Agenda do Conselho</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de Compromissos e Prazos Processuais</p>
           </div>
        </div>
        {!isReadOnly && (
          <button onClick={() => setShowAddModal(true)} className="px-8 py-4 bg-[#111827] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
            <Plus className="w-5 h-5" /> Novo Compromisso
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {visibleEvents.map((item) => {
          const assignedUser = INITIAL_USERS.find(u => u.id === item.conselheiro_id);
          return (
            <div key={item.id} className="bg-white p-8 rounded-[2rem] border-2 border-slate-50 flex flex-col md:flex-row gap-8 shadow-sm group hover:border-blue-100 transition-all">
               <div className="w-24 h-24 shrink-0 flex flex-col items-center justify-center bg-slate-50 rounded-[1.5rem] border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
                  <span className="text-3xl font-black text-slate-800 group-hover:text-blue-600 transition-all">{new Date(item.data + 'T12:00:00').getDate()}</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-400 transition-all">{new Date(item.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
               </div>
               <div className="flex-1 text-left">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">{item.tipo}</span>
                    <div className="text-[12px] font-black text-slate-400 flex items-center gap-1 uppercase"><Clock className="w-3.5 h-3.5 text-blue-500" /> {item.hora}</div>
                    {isAdmin && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                        Agenda de: {assignedUser?.nome || 'N/A'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-all">{item.descricao}</h3>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mt-4 flex flex-wrap gap-6">
                     <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {item.local}</div>
                     <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-500" /> {item.participantes}</div>
                  </div>
               </div>
               {!isReadOnly && (
                 <div className="shrink-0 flex items-center justify-end">
                    <button onClick={() => handleDelete(item.id, item.descricao)} className="p-4 bg-red-50 text-red-400 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100"><Trash2 className="w-6 h-6" /></button>
                 </div>
               )}
            </div>
          );
        })}
        {visibleEvents.length === 0 && (
          <div className="py-32 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
            <Calendar className="w-16 h-16 text-slate-100 mx-auto mb-6" />
            <p className="text-[16px] font-black text-slate-300 uppercase tracking-widest">Nenhum compromisso localizado na agenda.</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <header className="p-8 bg-[#111827] text-white flex justify-between items-center">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl"><Plus className="w-5 h-5" /></div>
                  <h3 className="font-black uppercase tracking-tight text-lg">Novo Compromisso</h3>
               </div>
               <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleAddEntry} className="p-10 space-y-6">
               {isAdmin && (
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conselheiro Destinatário</label>
                   <select 
                      required 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 transition-all"
                      value={newEntry.conselheiro_id}
                      onChange={e => setNewEntry({...newEntry, conselheiro_id: e.target.value})}
                   >
                     <option value="">Selecione o Conselheiro...</option>
                     {councilors.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                   </select>
                 </div>
               )}
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Evento</label>
                   <input required type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[13px] uppercase outline-none focus:border-blue-500" value={newEntry.data} onChange={e => setNewEntry({...newEntry, data: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                   <input required type="time" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[13px] outline-none focus:border-blue-500" value={newEntry.hora} onChange={e => setNewEntry({...newEntry, hora: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local</label>
                 <input required placeholder="LOCAL DO COMPROMISSO" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[12px] uppercase outline-none focus:border-blue-500" value={newEntry.local} onChange={e => setNewEntry({...newEntry, local: e.target.value.toUpperCase()})} />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assunto / Descrição</label>
                 <textarea required placeholder="DESCRITIVO DO EVENTO..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[12px] uppercase outline-none focus:border-blue-500 min-h-[100px]" value={newEntry.descricao} onChange={e => setNewEntry({...newEntry, descricao: e.target.value.toUpperCase()})} />
               </div>
               <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[13px] tracking-widest shadow-2xl shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                  <Save className="w-6 h-6" /> Salvar Agendamento
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgendaView;
