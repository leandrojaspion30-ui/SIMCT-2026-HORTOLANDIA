
import React, { useState } from 'react';
import { UserWithPassword } from '../constants';
import { UserCog, Shield, User as UserIcon, Lock, Power, Calendar, UserCheck, Plus, Trash2, Edit3, X, Save, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';

interface UserManagementPanelProps {
  users: UserWithPassword[];
  onUpdateUser: (id: string, update: Partial<UserWithPassword>) => Promise<void> | void;
  onDeleteUser?: (id: string) => Promise<void> | void;
  onAddUser?: (user: UserWithPassword) => Promise<void> | void;
  onAddLog: (action: string) => void;
  setActiveTab?: (tab: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, onUpdateUser, onDeleteUser, onAddUser, onAddLog, setActiveTab }) => {
  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [permanentReplaceId, setPermanentReplaceId] = useState<string | null>(null);
  const [targetReplaceId, setTargetReplaceId] = useState<string>('');
  const [isCreatingNewInReplace, setIsCreatingNewInReplace] = useState(false);
  const [newReplaceUserData, setNewReplaceUserData] = useState({ id: '', nome: '' });
  const [editingUser, setEditingUser] = useState<UserWithPassword | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [tempDates, setTempDates] = useState({ start: '', end: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState<{from: string, to: string} | null>(null);
  const [newUser, setNewUser] = useState<UserWithPassword>({
    id: '',
    nome: '',
    senha: '123',
    perfil: 'CONSELHEIRO',
    cargo: 'CONSELHEIRO(A)',
    unidade_id: 1,
    status: 'ATIVO'
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.nome || !newUser.id) {
      alert("Preencha nome e ID (usuário de login).");
      return;
    }
    if (onAddUser) {
      await onAddUser({ ...newUser, nome: newUser.nome.toUpperCase() });
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      await onUpdateUser(editingUser.id, { 
        nome: editingUser.nome.toUpperCase(), 
        cargo: editingUser.cargo.toUpperCase(),
        perfil: editingUser.perfil,
        unidade_id: editingUser.unidade_id
      });
      setEditingUser(null);
    }
  };

  const handlePermanentReplace = async () => {
    // Buscamos o usuário mais atual no momento do clique
    const currentUsers = users; 
    const source = currentUsers.find(u => u.id === permanentReplaceId);
    if (!source) {
      alert("Erro: Usuário de origem não encontrado.");
      return;
    }

    try {
      setIsProcessing(true);
      let successorId = targetReplaceId;
      let successorName = '';

      if (isCreatingNewInReplace) {
        const newId = newReplaceUserData.id.toUpperCase().trim();
        const newName = newReplaceUserData.nome.toUpperCase().trim();
        
        if (window.confirm(`SICT RH: Confirmar CADASTRO e MIGRAÇÃO de ${source.nome} para o novo usuário ${newName}?`)) {
          successorId = newId;
          successorName = newName;
          
          const newUserObj: UserWithPassword = {
            id: newId,
            nome: newName,
            senha: '123',
            perfil: source.perfil || 'CONSELHEIRO',
            cargo: source.cargo || 'CONSELHEIRO(A)',
            unidade_id: source.unidade_id || 1,
            status: 'ATIVO'
          };
          
          if (onAddUser) await onAddUser(newUserObj);
          await new Promise(resolve => setTimeout(resolve, 1500));

          await onUpdateUser(permanentReplaceId!, { 
            status: 'INATIVO', 
            substituicao_permanente_por: newId,
          });

          onAddLog(`RH: Usuário ${source.nome} marcado como INATIVO. Funções assumidas pelo novo usuário ${newName} (${newId}).`);

          setReplaceSuccess({ from: source.nome, to: newName });
        }
      } else {
        const target = currentUsers.find(u => u.id === targetReplaceId);
        if (target) {
          if (window.confirm(`SICT RH: Confirmar migração de ${source.nome} para ${target.nome}? Todas as funções serão transferidas.`)) {
            await onUpdateUser(permanentReplaceId!, { 
              status: 'INATIVO', 
              substituicao_permanente_por: targetReplaceId,
            });
            onAddLog(`RH: Usuário ${source.nome} marcado como INATIVO. Funções assumidas por ${target.nome} (${targetReplaceId}).`);
            setReplaceSuccess({ from: source.nome, to: target.nome });
          }
        }
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao processar a substituição.");
    } finally {
      setIsProcessing(false);
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.sort((a, b) => a.nome.localeCompare(b.nome)).map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-all min-h-[350px]">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${user.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setPermanentReplaceId(user.id)}
                    className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    title="Substituição Permanente (Migrar Funções)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
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
                {/* Badge de Status */}
                <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                  user.status === 'ATIVO' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {user.status}
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
                      onClick={async () => {
                        if (!tempDates.start || !tempDates.end) {
                          alert("Selecione ambas as datas.");
                          return;
                        }
                        await onUpdateUser(user.id, { 
                          substituicao_ativa: true, 
                          data_inicio_substituicao: tempDates.start, 
                          data_fim_prevista: tempDates.end 
                        });
                        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id);
                        if (suplente) {
                          await onUpdateUser(suplente.id, {
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
                  onClick={async () => {
                    if (window.confirm("Deseja encerrar a substituição agora?")) {
                      await onUpdateUser(user.id, { substituicao_ativa: false, data_inicio_substituicao: undefined, data_fim_prevista: undefined });
                      if (user.perfil === 'SUPLENTE') {
                        await onUpdateUser(user.substituindo_id!, { substituicao_ativa: false, data_inicio_substituicao: undefined, data_fim_prevista: undefined });
                        await onUpdateUser(user.id, { substituicao_ativa: false, substituindo_id: undefined, status: 'INATIVO' });
                      } else {
                        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id);
                        if (suplente) await onUpdateUser(suplente.id, { substituicao_ativa: false, substituindo_id: undefined, status: 'INATIVO' });
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

      {permanentReplaceId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl max-w-xl w-full p-6 sm:p-12 border border-slate-100 animate-in zoom-in-95 relative flex flex-col max-h-[90vh]">
              <button 
                onClick={() => {
                  setPermanentReplaceId(null);
                  setIsCreatingNewInReplace(false);
                }} 
                className="absolute top-8 right-8 p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-4 mb-8 shrink-0">
                <div className="p-4 bg-amber-600 rounded-3xl text-white shadow-lg">
                  <RefreshCw className={`w-8 h-8 ${isProcessing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-tight">Substituição Permanente</h2>
                  <p className="text-[12px] font-bold text-slate-400 uppercase">Substituindo: {users.find(u => u.id === permanentReplaceId)?.nome}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-8">
                {replaceSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in scale-in-95 duration-500">
                    <div className="p-8 bg-emerald-100 rounded-full text-emerald-600 mb-8 shadow-inner">
                      <UserCheck className="w-16 h-16" />
                    </div>
                    <h2 className="text-[28px] font-black text-slate-900 uppercase tracking-tight mb-4">Alteração Concluída</h2>
                    <p className="text-[14px] font-bold text-slate-500 uppercase tracking-wide leading-relaxed max-w-sm mb-10">
                      O usuário <span className="text-red-500">{replaceSuccess.from}</span> foi inativado. 
                      <br />Todas as funções foram migradas para <br />
                      <span className="text-emerald-600 underline">{replaceSuccess.to}</span>.
                    </p>
                    
                    <div className="w-full space-y-4">
                      <button 
                        onClick={() => {
                          if (setActiveTab) setActiveTab('documentos');
                          setPermanentReplaceId(null);
                          setReplaceSuccess(null);
                        }}
                        className="w-full py-6 bg-emerald-600 text-white rounded-3xl font-black uppercase text-[12px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3"
                      >
                        <UserCog className="w-5 h-5" /> Abrir Tela de Prontuários (Conferir Alteração)
                      </button>
                      <button 
                        onClick={() => {
                          setPermanentReplaceId(null);
                          setReplaceSuccess(null);
                          setIsCreatingNewInReplace(false);
                          setNewReplaceUserData({ id: '', nome: '' });
                          setTargetReplaceId('');
                        }}
                        className="w-full py-6 bg-slate-100 text-slate-600 rounded-3xl font-black uppercase text-[12px] hover:bg-slate-200 transition-all"
                      >
                        Continuar no RH
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-3">
                       <div className="flex items-center gap-3 text-amber-700">
                          <AlertCircle className="w-6 h-6" />
                          <span className="text-[13px] font-black uppercase">Ação Crítica de RH</span>
                       </div>
                       <p className="text-[13px] font-bold text-amber-600 leading-relaxed uppercase">
                         Ao confirmar, o usuário antigo será <span className="text-red-600">INATIVADO</span>. 
                         Funções e agendas serão migradas para o sucessor.
                       </p>
                    </div>

                    <div className="space-y-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center block">Selecione o sucessor ou cadastre novo</label>
                          <select 
                            disabled={isProcessing}
                            className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm uppercase outline-none focus:border-blue-500 text-center"
                            value={isCreatingNewInReplace ? "NEW" : targetReplaceId}
                            onChange={e => {
                              if (e.target.value === "NEW") {
                                setIsCreatingNewInReplace(true);
                                setTargetReplaceId('');
                              } else {
                                setIsCreatingNewInReplace(false);
                                setTargetReplaceId(e.target.value);
                              }
                            }}
                          >
                            <option value="">Selecione o sucessor...</option>
                            <option value="NEW" className="text-blue-600 font-bold">+ CADASTRAR NOVO USUÁRIO</option>
                            {users.filter(u => u.id !== permanentReplaceId && u.status === 'ATIVO').map(u => (
                              <option key={u.id} value={u.id}>{u.nome} ({u.cargo})</option>
                            ))}
                          </select>
                       </div>

                       {isCreatingNewInReplace && (
                         <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-4 animate-in zoom-in-95">
                            <div className="flex items-center gap-2 text-blue-700 mb-2">
                              <Plus className="w-5 h-5" />
                              <span className="text-[11px] font-black uppercase tracking-widest">Dados do Novo Substituto</span>
                            </div>
                            <div className="space-y-4">
                              <input 
                                disabled={isProcessing}
                                placeholder="NOME COMPLETO" 
                                className="w-full p-4 bg-white border border-blue-100 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500"
                                value={newReplaceUserData.nome}
                                onChange={e => setNewReplaceUserData({...newReplaceUserData, nome: e.target.value})}
                              />
                              <input 
                                disabled={isProcessing}
                                placeholder="ID DE LOGIN (EX: RENATA.SILVA)" 
                                className="w-full p-4 bg-white border border-blue-100 rounded-xl font-black text-xs uppercase outline-none focus:border-blue-500"
                                value={newReplaceUserData.id}
                                onChange={e => setNewReplaceUserData({...newReplaceUserData, id: e.target.value.toLowerCase()})}
                              />
                            </div>
                         </div>
                       )}
                    </div>
                  </>
                )}
              </div>

              {!replaceSuccess && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 shrink-0">
                   <button 
                     disabled={isProcessing}
                     onClick={() => {
                       setPermanentReplaceId(null);
                       setIsCreatingNewInReplace(false);
                     }}
                     className="flex-1 py-5 bg-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[12px] hover:bg-slate-300 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     disabled={isProcessing || (!targetReplaceId && (!isCreatingNewInReplace || !newReplaceUserData.id || !newReplaceUserData.nome))}
                     onClick={handlePermanentReplace}
                     className="flex-[1.8] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[12px] hover:bg-blue-600 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                   >
                     {isProcessing ? 'Processando...' : 'Finalizar e Substituir'} <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
