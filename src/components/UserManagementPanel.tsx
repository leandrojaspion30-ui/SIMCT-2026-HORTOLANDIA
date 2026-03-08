
import React, { useState } from 'react';
import { UserWithPassword } from '../constants';
import { UserCog, Shield, User as UserIcon, Lock, Power, Calendar, UserCheck } from 'lucide-react';

interface UserManagementPanelProps {
  users: UserWithPassword[];
  onUpdateUser: (id: string, update: Partial<UserWithPassword>) => void;
  onAddLog: (action: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ users, onUpdateUser }) => {
  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [tempDates, setTempDates] = useState({ start: '', end: '' });

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
                  (user.perfil === 'CONSELHEIRO' || user.perfil === 'SUPLENTE') ? 'bg-blue-50 text-blue-600' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {user.perfil}
                </div>
              </div>

              <h3 className="text-[18px] font-black text-slate-900 uppercase tracking-tight mb-1">{user.nome}</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">{user.cargo}</p>
              
              {user.substituicao_ativa && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-700 mb-1">
                    <UserCheck className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Sendo Substituído</span>
                  </div>
                  <p className="text-[11px] font-bold text-amber-600 uppercase">Período: {user.data_inicio_substituicao} até {user.data_fim_prevista}</p>
                </div>
              )}

              {user.perfil === 'SUPLENTE' && user.substituicao_ativa && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
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
                <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Início</label>
                    <input 
                      type="date" 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-blue-500"
                      value={tempDates.start}
                      onChange={e => setTempDates(prev => ({ ...prev, start: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Término</label>
                    <input 
                      type="date" 
                      className="w-full p-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold outline-none focus:border-blue-500"
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
                        
                        // Ativa substituição para o conselheiro
                        onUpdateUser(user.id, { 
                          substituicao_ativa: true, 
                          data_inicio_substituicao: tempDates.start, 
                          data_fim_prevista: tempDates.end 
                        });
                        
                        // Ativa substituição para o suplente da unidade
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
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setSubstitutingId(null)}
                      className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-300 transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                (user.perfil === 'CONSELHEIRO' || user.perfil === 'ADMIN' || user.perfil === 'ADMINISTRATIVO') && (
                  <button 
                    onClick={() => {
                      setSubstitutingId(user.id);
                      setTempDates({ 
                        start: user.data_inicio_substituicao || new Date().toISOString().split('T')[0], 
                        end: user.data_fim_prevista || '' 
                      });
                    }}
                    className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {user.substituicao_ativa ? 'Atualizar Suplência' : 'Designar Suplente'}
                  </button>
                )
              )}

              {user.substituicao_ativa && !substitutingId && (
                <button 
                  onClick={() => {
                    if (window.confirm("Deseja encerrar a substituição agora?")) {
                      onUpdateUser(user.id, { 
                        substituicao_ativa: false, 
                        data_inicio_substituicao: undefined, 
                        data_fim_prevista: undefined 
                      });
                      
                      if (user.perfil === 'SUPLENTE') {
                        onUpdateUser(user.substituindo_id!, { 
                          substituicao_ativa: false, 
                          data_inicio_substituicao: undefined, 
                          data_fim_prevista: undefined 
                        });
                        onUpdateUser(user.id, { 
                          substituicao_ativa: false, 
                          substituindo_id: undefined,
                          status: 'INATIVO'
                        });
                      } else {
                        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id);
                        if (suplente) {
                          onUpdateUser(suplente.id, { 
                            substituicao_ativa: false, 
                            substituindo_id: undefined,
                            status: 'INATIVO'
                          });
                        }
                      }
                    }
                  }}
                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Power className="w-3.5 h-3.5" /> Encerrar Suplência
                </button>
              )}

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
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserManagementPanel;
