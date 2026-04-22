
import React, { useState } from 'react';
import { UserWithPassword } from '../constants';
import { UserCog, Shield, User as UserIcon, Lock, Power, Calendar, UserCheck, Plus, Trash2, Edit3, X, Save, AlertCircle } from 'lucide-react';

interface UserManagementPanelProps {
  users: UserWithPassword[];
  onUpdateUser: (id: string, update: Partial<UserWithPassword>) => void;
  onDeleteUser?: (id: string) => void;
  onAddUser?: (user: UserWithPassword) => void;
  onAddLog: (action: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, onUpdateUser, onDeleteUser, onAddUser }) => {
  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserWithPassword | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [tempDates, setTempDates] = useState({ start: '', end: '' });
  const [newUser, setNewUser] = useState<UserWithPassword>({
    id: '',
    nome: '',
    senha: '123',
    perfil: 'CONSELHEIRO',
    cargo: 'CONSELHEIRO(A)',
    unidade_id: 1,
    status: 'ATIVO'
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.id) {
      alert("Preencha nome e ID (usuário de login).");
      return;
    }
    if (onAddUser) {
      onAddUser({ ...newUser, nome: newUser.nome.toUpperCase() });
      setIsAddingNew(false);
      setNewUser({
        id: '',
        nome: '',
        senha: '123',
        perfil: 'CONSELHEIRO',
        cargo: 'CONSELHEIRO(A)',
        unidade_id: 1,
        status: 'ATIVO'
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      onUpdateUser(editingUser.id, { 
        nome: editingUser.nome.toUpperCase(), 
        cargo: editingUser.cargo.toUpperCase(),
        perfil: editingUser.perfil,
        unidade_id: editingUser.unidade_id
      });
      setEditingUser(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-red-600 rounded-3xl text-white shadow-lg">
            <UserCog className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight text-center md:text-left">Gestão de RH</h1>
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Administração de usuários e permissões</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAddingNew(true)}
          className="px-8 py-4 bg-[#111827] text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl active:scale-95"
        >
          <Plus className="w-5 h-5" /> Novo Usuário
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.sort((a, b) => a.nome.localeCompare(b.nome)).map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${user.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingUser(user)}
                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Editar Nome/Cargo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(`SICT RH: Deseja EXCLUIR DEFINITIVAMENTE o usuário ${user.nome}? Esta ação não pode ser desfeita.`)) {
                        onDeleteUser && onDeleteUser(user.id);
                      }
                    }}
                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir Usuário"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-[17px] font-black text-slate-900 uppercase tracking-tight leading-none">{user.nome}</h3>
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  user.perfil === 'ADMIN' ? 'bg-red-600 text-white' :
                  (user.perfil === 'CONSELHEIRO' || user.perfil === 'SUPLENTE') ? 'bg-blue-600 text-white' :
                  'bg-slate-500 text-white'
                }`}>
                  {user.perfil}
                </div>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">CT {user.unidade_id} • {user.cargo}</p>
              
              {user.substituicao_ativa && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sendo Substituído</span>
                  </div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Período: {user.data_inicio_substituicao} até {user.data_fim_prevista}</p>
                </div>
              )}

              {user.perfil === 'SUPLENTE' && user.substituicao_ativa && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Em Substituição Ativa</span>
                  </div>
                  <p className="text-[11px] font-bold text-blue-600 uppercase">Substituindo: {users.find(u => u.id === user.substituindo_id)?.nome || 'Desconhecido'}</p>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {substitutingId === user.id ? (
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-2 animate-in zoom-in-95">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Início</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:border-blue-500 shadow-sm"
                      value={tempDates.start}
                      onChange={e => setTempDates(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Término</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[11px] font-bold outline-none focus:border-blue-500 shadow-sm"
                      value={tempDates.end}
                      onChange={e => setTempDates(prev => ({ ...prev, end: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={() => {
                        if (!tempDates.start || !tempDates.end) {
                          alert("Selecione ambas as datas.");
                          return;
                        }
                        onUpdateUser(user.id, { 
                          substituicao_ativa: true, 
                          data_inicio_substituicao: tempDates.start, 
                          data_fim_prevista: tempDates.end 
                        });
                        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id);
                        if (suplente) {
                          onUpdateUser(suplente.id, {
                            substituicao_ativa: true,
                            substituindo_id: user.id,
                            data_inicio_substituicao: tempDates.start,
                            data_fim_prevista: tempDates.end,
                            status: 'ATIVO'
                          });
                        }
                        setSubstitutingId(null);
                      }}
                      className="flex-1 py-3 bg-emerald-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md"
                    >
                      Confirmar
                    </button>
                    <button onClick={() => setSubstitutingId(null)} className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all">Cancelar</button>
                  </div>
                </div>
              ) : (
                (user.perfil === 'CONSELHEIRO' || user.perfil === 'ADMIN' || user.perfil === 'ADMINISTRATIVO') && (
                  <button 
                    onClick={() => {
                      setSubstitutingId(user.id);
                      setTempDates({ start: user.data_inicio_substituicao || new Date().toISOString().split('T')[0], end: user.data_fim_prevista || '' });
                    }}
                    className="w-full py-4 bg-slate-900/5 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {user.substituicao_ativa ? 'Atualizar Suplência' : 'Designar Suplente'}
                  </button>
                )
              )}

              {user.substituicao_ativa && !substitutingId && (
                <button 
                  onClick={() => {
                    if (window.confirm("Deseja encerrar a substituição agora?")) {
                      onUpdateUser(user.id, { substituicao_ativa: false, data_inicio_substituicao: undefined, data_fim_prevista: undefined });
                      if (user.perfil === 'SUPLENTE') {
                        onUpdateUser(user.substituindo_id!, { substituicao_ativa: false, data_inicio_substituicao: undefined, data_fim_prevista: undefined });
                        onUpdateUser(user.id, { substituicao_ativa: false, substituindo_id: undefined, status: 'INATIVO' });
                      } else {
                        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id);
                        if (suplente) onUpdateUser(suplente.id, { substituicao_ativa: false, substituindo_id: undefined, status: 'INATIVO' });
                      }
                    }
                  }}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100"
                >
                  <Power className="w-3.5 h-3.5" /> Encerrar Suplência
                </button>
              )}

              <div className="flex gap-3">
                <button 
                  onClick={() => onUpdateUser(user.id, { status: user.status === 'ATIVO' ? 'BLOQUEADO' : 'ATIVO' })}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm ${
                    user.status === 'ATIVO' ? 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700' : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" /> {user.status === 'ATIVO' ? 'Bloquear' : 'Liberar'}
                </button>
                <button 
                  onClick={() => {
                    const newPass = prompt("SISTEMA RH: Digite a nova SENHA de acesso para " + user.nome);
                    if (newPass) onUpdateUser(user.id, { senha: newPass });
                  }}
                  className="p-4 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-900 hover:text-white transition-all border border-slate-100"
                  title="Alterar Senha"
                >
                  <Lock className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Adicionar Novo Usuário */}
      {isAddingNew && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <header className="p-8 bg-[#111827] text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-xl"><Plus className="w-5 h-5" /></div>
                  <h3 className="font-black uppercase tracking-tight text-lg">Novo Usuário</h3>
               </div>
               <button onClick={() => setIsAddingNew(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleAddSubmit} className="p-10 space-y-6 overflow-y-auto">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                 <input autoFocus required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-red-500" value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value.toUpperCase()})} />
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário (Login)</label>
                   <input required placeholder="ex: admin_joao" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm lowercase outline-none focus:border-red-500" value={newUser.id} onChange={e => setNewUser({...newUser, id: e.target.value.toLowerCase().replace(/\s/g, '_')})} />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Inicial</label>
                   <input required type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-red-500" value={newUser.senha} onChange={e => setNewUser({...newUser, senha: e.target.value})} />
                 </div>
               </div>
               <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:border-red-500"
                     value={newUser.perfil}
                     onChange={e => setNewUser({...newUser, perfil: e.target.value as any})}
                   >
                     <option value="CONSELHEIRO">CONSELHEIRO(A)</option>
                     <option value="SUPLENTE">CONSELHEIRO(A) SUPLENTE</option>
                     <option value="ADMINISTRATIVO">AUXILIAR ADMINISTRATIVO</option>
                     <option value="ADMIN">ADMINISTRADOR GERAL</option>
                   </select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / CT</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none focus:border-red-500"
                     value={newUser.unidade_id}
                     onChange={e => setNewUser({...newUser, unidade_id: parseInt(e.target.value)})}
                   >
                     <option value={1}>CONSELHO TUTELAR 1</option>
                     <option value={2}>CONSELHO TUTELAR 2</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                   <input placeholder="CONSELHEIRO(A)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none" value={newUser.cargo} onChange={e => setNewUser({...newUser, cargo: e.target.value.toUpperCase()})} />
                 </div>
               </div>
               <button type="submit" className="w-full py-6 bg-red-600 text-white rounded-[1.5rem] font-black uppercase text-[13px] tracking-widest shadow-2xl shadow-red-100 hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                  <Save className="w-6 h-6" /> Cadastrar Usuário
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <header className="p-8 bg-blue-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><Edit3 className="w-5 h-5" /></div>
                  <h3 className="font-black uppercase tracking-tight text-lg">Editar Dados</h3>
               </div>
               <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </header>
            <form onSubmit={handleEditSubmit} className="p-10 space-y-6 overflow-y-auto">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                 <input autoFocus required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500" value={editingUser.nome} onChange={e => setEditingUser({...editingUser, nome: e.target.value.toUpperCase()})} />
               </div>
               <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                   <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500" value={editingUser.cargo} onChange={e => setEditingUser({...editingUser, cargo: e.target.value.toUpperCase()})} />
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none"
                     value={editingUser.perfil}
                     onChange={e => setEditingUser({...editingUser, perfil: e.target.value as any})}
                   >
                     <option value="CONSELHEIRO">CONSELHEIRO</option>
                     <option value="SUPLENTE">SUPLENTE</option>
                     <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                     <option value="ADMIN">ADMIN</option>
                   </select>
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade/CT</label>
                   <select 
                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black text-xs uppercase outline-none"
                     value={editingUser.unidade_id}
                     onChange={e => setEditingUser({...editingUser, unidade_id: parseInt(e.target.value)})}
                   >
                     <option value={1}>CT 1</option>
                     <option value={2}>CT 2</option>
                   </select>
                 </div>
               </div>
               <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[13px] tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  <Save className="w-6 h-6" /> Atualizar Cadastro
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;

