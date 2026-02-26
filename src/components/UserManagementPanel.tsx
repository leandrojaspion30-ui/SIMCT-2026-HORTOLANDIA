
import React from 'react';
import { UserWithPassword } from '../constants';
import { UserCog, Shield, User as UserIcon, Lock, Power } from 'lucide-react';

interface UserManagementPanelProps {
  users: UserWithPassword[];
  onUpdateUser: (id: string, update: Partial<UserWithPassword>) => void;
  onAddLog: (action: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, onUpdateUser }) => {
  return (
    <div className="space-y-8">
      <header className="flex items-center gap-4">
        <div className="p-4 bg-red-600 rounded-3xl text-white">
          <UserCog className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-[24px] font-black text-slate-900 uppercase tracking-tight">Gestão de RH</h1>
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Administração de usuários e permissões</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-red-200 transition-all">
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${user.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  user.perfil === 'ADMIN' ? 'bg-red-50 text-red-600' :
                  user.perfil === 'CONSELHEIRO' ? 'bg-blue-50 text-blue-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {user.perfil}
                </div>
              </div>

              <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight mb-1">{user.nome}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-8">{user.cargo}</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => onUpdateUser(user.id, { status: user.status === 'ATIVO' ? 'BLOQUEADO' : 'ATIVO' })}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  user.status === 'ATIVO' ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" /> {user.status === 'ATIVO' ? 'Bloquear' : 'Ativar'}
              </button>
              <button 
                onClick={() => {
                  const newPass = prompt("Digite a nova senha para " + user.nome);
                  if (newPass) onUpdateUser(user.id, { senha: newPass });
                }}
                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagementPanel;
