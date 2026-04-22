
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
  Save,
  UserRound,
  ClipboardCheck,
  Edit3
} from 'lucide-react';
import { AgendaEntry, User, Documento } from '../types';
import { INITIAL_USERS } from '../constants';
import { saveAgenda, deleteAgenda } from '../lib/db';

interface AgendaViewProps {
  agenda: AgendaEntry[];
  setAgenda: (agenda: AgendaEntry[]) => void;
  allDocuments: Documento[];
  currentUser: User;
  effectiveUserId: string;
  isReadOnly?: boolean;
  onAddLog: (action: string) => void;
}

const AgendaView: React.FC<AgendaViewProps> = ({ agenda, setAgenda, allDocuments, currentUser, effectiveUserId, isReadOnly, onAddLog }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const isAdmin = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
  const [filterType, setFilterType] = useState<'MY' | 'UNIT'>(isAdmin ? 'UNIT' : 'MY');
  const todayStr = new Date().toISOString().split('T')[0];
  const councilors = INITIAL_USERS.filter(u => {
    if (u.perfil !== 'CONSELHEIRO' && u.perfil !== 'SUPLENTE') return false;
    // Se for ADM, vê apenas os da sua unidade
    if (isAdmin) return u.unidade_id === currentUser.unidade_id;
    return true;
  });
  
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

    if (hasConflict && !editingId) {
      alert("CONFLITO DE AGENDA: Já existe um compromisso agendado para este conselheiro em um intervalo inferior a 30 minutos neste mesmo dia.");
      return;
    }

    if (editingId) {
      await saveAgenda({ ...newEntry, id: editingId, unidade_id: currentUser.unidade_id });
      onAddLog(`AGENDA: Compromisso atualizado: ${newEntry.descricao}.`);
    } else {
      const entry: AgendaEntry = { ...newEntry, id: `agenda-${Date.now()}`, unidade_id: currentUser.unidade_id } as AgendaEntry;
      await saveAgenda(entry);
      
      const assignedUser = INITIAL_USERS.find(u => u.id === entry.conselheiro_id);
      onAddLog(`AGENDA: Novo compromisso agendado para ${assignedUser?.nome}: ${entry.descricao} em ${entry.data} às ${entry.hora}.`);
    }
    
    setShowAddModal(false);
    setEditingId(null);
    setNewEntry({
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
  };

  const visibleEvents = agenda
    .filter(item => {
      if (filterType === 'MY') {
        return item.conselheiro_id === effectiveUserId;
      }
      // Filtra pela unidade do usuário logado ou itens sem unidade (legado)
      return !item.unidade_id || item.unidade_id === currentUser.unidade_id;
    })
    .sort((a, b) => {
      const dateCompare = new Date(a.data).getTime() - new Date(b.data).getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.hora.localeCompare(b.hora);
    });

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
      await deleteAgenda(itemToDelete.id);
      onAddLog(`AGENDA: Compromisso removido: ${itemToDelete.desc}.`);
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
          await saveAgenda({ ...entry, id, status: 'REAGENDADO' });
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

      await saveAgenda({ ...entry, id, status: outcome });
      onAddLog(`AGENDA: Status do compromisso "${entry.descricao}" alterado para ${outcome}.`);
      
    } catch (error) {
      console.error("Error updating agenda status:", error);
      alert("Erro ao atualizar status. Tente novamente.");
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[2.5rem] border shadow-sm gap-6">
        <div className="flex items-center gap-4">
           <div className="p-3 bg-blue-600 rounded-2xl shadow-lg"><Calendar className="w-6 h-6 text-white" /></div>
           <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Agenda do Conselho</h2>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestão de Compromissos e Prazos Processuais</p>
           </div>
        </div>

        {(currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE') && (
          <div className="flex bg-slate-100 p-1.5 rounded-2xl">
            <button 
              onClick={() => setFilterType('MY')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'MY' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Meus Compromissos
            </button>
            <button 
              onClick={() => setFilterType('UNIT')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'UNIT' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Agenda da Unidade
            </button>
          </div>
        )}

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
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      item.status === 'COMPARECEU' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      item.status === 'REAGENDADO' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {item.tipo} {item.status && item.status !== 'PENDENTE' && `(${item.status})`}
                    </span>
                    <div className="text-[12px] font-black text-slate-400 flex items-center gap-1 uppercase"><Clock className="w-3.5 h-3.5 text-blue-500" /> {item.hora}</div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase border border-blue-100">
                      Conselheiro: {assignedUser?.nome || 'N/A'} (CT {assignedUser?.unidade_id || '?'})
                    </span>
                  </div>
                  <h3 className="text-[18px] font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-all">{item.descricao}</h3>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mt-4 flex flex-wrap gap-6">
                     <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-blue-500" /> {item.local}</div>
                     <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-blue-500" /> {item.participantes}</div>
                     {item.genitores_responsavel && (
                       <div className="flex items-center gap-2"><UserRound className="w-3.5 h-3.5 text-blue-500" /> {item.genitores_responsavel}</div>
                     )}
                  </div>
               </div>
                {!isReadOnly && (
                  <div className="shrink-0 flex items-center gap-2 justify-end">
                    {/* Botões de Status: Sempre visíveis para gestão se não estiver em visualização apenas leitura */}
                    <button 
                      onClick={() => handleOutcome(item.id, 'COMPARECEU')}
                      className={`p-4 rounded-2xl transition-all shadow-sm ${item.status === 'COMPARECEU' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                      title="Compareceu"
                    >
                      <ClipboardCheck className="w-6 h-6" />
                    </button>
                    <button 
                      onClick={() => handleOutcome(item.id, 'NAO_COMPARECEU')}
                      className={`p-4 rounded-2xl transition-all shadow-sm ${item.status === 'NAO_COMPARECEU' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'}`}
                      title="Não Compareceu"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(item.id, item.descricao)} 
                      disabled={deletingId === item.id}
                      className={`p-4 rounded-2xl transition-all shadow-sm ${deletingId === item.id ? 'bg-slate-100 text-slate-300 animate-pulse' : 'bg-red-50 text-red-400 hover:bg-red-600 hover:text-white'}`} 
                      title="Excluir"
                    >
                      {deletingId === item.id ? (
                        <div className="w-6 h-6 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-6 h-6" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-4 bg-blue-50 text-blue-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                      title="Editar"
                    >
                      <Edit3 className="w-6 h-6" />
                    </button>
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

      {/* Modal de Confirmação de Exclusão */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-sm w-full p-10 border border-slate-100 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertCircle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-black uppercase text-slate-800 mb-2">Excluir Compromisso?</h3>
            <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed mb-8">
              Tem certeza que deseja remover permanentemente o compromisso:<br/> 
              <span className="text-red-500">"{itemToDelete?.desc}"</span>?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDeleteAction}
                disabled={deletingId !== null}
                className="w-full py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {deletingId ? 'Processando...' : 'Sim, Excluir Agora'}
              </button>
              <button 
                onClick={() => { setShowConfirmDelete(false); setItemToDelete(null); }}
                className="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <header className="p-8 bg-[#111827] text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl">{editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}</div>
                  <h3 className="font-black uppercase tracking-tight text-lg">{editingId ? 'Editar Compromisso' : 'Novo Compromisso'}</h3>
               </div>
               <button onClick={() => { setShowAddModal(false); setEditingId(null); }} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleAddEntry} className="p-10 space-y-6 overflow-y-auto">
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
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Compromisso</label>
                   <select 
                      required 
                      className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 transition-all"
                      value={newEntry.tipo}
                      onChange={e => setNewEntry({...newEntry, tipo: e.target.value as any})}
                   >
                     <option value="REUNIAO">REUNIÃO</option>
                     <option value="VISITA">VISITA</option>
                     <option value="AUDIENCIA">AUDIÊNCIA</option>
                     <option value="NOTIFICACAO 1">NOTIFICAÇÃO 1</option>
                     <option value="NOTIFICACAO 2">NOTIFICAÇÃO 2</option>
                     <option value="NOTIFICACAO 3">NOTIFICAÇÃO 3</option>
                     <option value="REUNIAO DE REDE">REUNIÃO DE REDE</option>
                     <option value="OUTROS">OUTROS</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                   <input required type="time" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[13px] outline-none focus:border-blue-500" value={newEntry.hora} onChange={e => setNewEntry({...newEntry, hora: e.target.value})} />
                 </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vincular Prontuário / Família (Opcional)</label>
                  <select 
                     className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:border-blue-500 transition-all"
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
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Genitores / Responsável Legal</label>
                 <input placeholder="NOME DOS GENITORES OU RESPONSÁVEL" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[12px] uppercase outline-none focus:border-blue-500" value={newEntry.genitores_responsavel} onChange={e => setNewEntry({...newEntry, genitores_responsavel: e.target.value.toUpperCase()})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Evento</label>
                   <input required type="date" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[13px] uppercase outline-none focus:border-blue-500" value={newEntry.data} onChange={e => setNewEntry({...newEntry, data: e.target.value})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Local</label>
                   <input required placeholder="LOCAL DO COMPROMISSO" className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[12px] uppercase outline-none focus:border-blue-500" value={newEntry.local} onChange={e => setNewEntry({...newEntry, local: e.target.value.toUpperCase()})} />
                 </div>
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
