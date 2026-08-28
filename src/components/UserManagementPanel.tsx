
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { UserCog, Shield, User as UserIcon, Lock, Power, Calendar, UserCheck, Plus, Trash2, Edit3, X, Save, AlertCircle, RefreshCw, ArrowRight, Download, Upload, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface UserManagementPanelProps {
  users: User[];
  documents: any[];
  currentUser?: User;
  onUpdateUser: (id: string, update: Partial<User & { senha?: string }>) => Promise<void> | void;
  onDeleteUser?: (id: string) => Promise<void> | void;
  onAddUser?: (user: Partial<User & { senha?: string }>) => Promise<void> | void;
  onResetDocuments?: (unidadeId?: number) => Promise<void> | void;
  onRestoreDocuments?: (documents: any[]) => Promise<void> | void;
  onAddLog: (action: string) => void;
  setActiveTab?: (tab: string) => void;
}

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({ 
  users, 
  documents,
  currentUser,
  onUpdateUser, 
  onDeleteUser, 
  onAddUser, 
  onResetDocuments,
  onRestoreDocuments,
  onAddLog, 
  setActiveTab 
}) => {
  const [substitutingId, setSubstitutingId] = useState<string | null>(null);
  const [selectedSuplenteId, setSelectedSuplenteId] = useState<string>('');
  const [permanentReplaceId, setPermanentReplaceId] = useState<string | null>(null);
  const [targetReplaceId, setTargetReplaceId] = useState<string>('');
  const [isCreatingNewInReplace, setIsCreatingNewInReplace] = useState(false);
  const [newReplaceUserData, setNewReplaceUserData] = useState({ id: '', nome: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editNewPassword, setEditNewPassword] = useState<string>('');
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [resettingUserForAdmin, setResettingUserForAdmin] = useState<User | null>(null);
  const [adminTempPassword, setAdminTempPassword] = useState<string>('123456');
  const [showAdminTempPassword, setShowAdminTempPassword] = useState<boolean>(false);
  const [adminResetSuccess, setAdminResetSuccess] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [tempDates, setTempDates] = useState({ start: '', end: '' });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');
  const [pendingResetAction, setPendingResetAction] = useState<'ONLY_RESET' | 'BACKUP_AND_RESET'>('ONLY_RESET');
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userToStopSubstituicao, setUserToStopSubstituicao] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replaceSuccess, setReplaceSuccess] = useState<{from: string, to: string} | null>(null);
  const [resetTargetUnit, setResetTargetUnit] = useState<number | 'ALL'>('ALL');
  const [newUser, setNewUser] = useState<Partial<User> & { senha?: string }>({
    id: '',
    nome: '',
    senha: '',
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
      const initialPassword = newUser.senha && newUser.senha.trim() ? newUser.senha.trim() : '123456';
      await onAddUser({ 
        ...newUser, 
        nome: newUser.nome.toUpperCase(),
        senha: initialPassword,
        trocar_senha_proximo_acesso: true,
        senha_alterada_em: new Date().toISOString()
      });
      onAddLog(`RH: Novo usuário cadastrado: ${newUser.nome.toUpperCase()} (${newUser.id}). Exigida troca de senha no primeiro acesso.`);
      setIsAddingNew(false);
      setNewUser({
        id: '',
        nome: '',
        senha: '',
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
      const updateData: Partial<User & { senha?: string }> = { 
        nome: editingUser.nome.toUpperCase(), 
        cargo: editingUser.cargo.toUpperCase(),
        perfil: editingUser.perfil,
        unidade_id: editingUser.unidade_id,
        fotoUrl: editingUser.fotoUrl
      };

      // Apenas define senha se o administrador digitou uma nova senha
      if (editNewPassword && editNewPassword.trim().length > 0) {
        updateData.senha = editNewPassword.trim();
        updateData.trocar_senha_proximo_acesso = true;
        updateData.senha_alterada_em = new Date().toISOString();
        onAddLog(`RH: Senha do usuário ${editingUser.nome} alterada pelo Administrador Geral. Exigida troca no próximo acesso.`);
      }

      await onUpdateUser(editingUser.id, updateData);
      setEditingUser(null);
      setEditNewPassword('');
    }
  };

  const handleAdminResetPassword = async () => {
    if (!resettingUserForAdmin) return;
    const tempPass = adminTempPassword.trim() || '123456';
    
    await onUpdateUser(resettingUserForAdmin.id, {
      senha: tempPass,
      trocar_senha_proximo_acesso: true,
      senha_alterada_em: new Date().toISOString()
    });

    onAddLog(`RH: Senha temporária do usuário ${resettingUserForAdmin.nome} redefinida pelo Administrador Geral (${currentUser?.nome || 'ADM GERAL'}). Exigida troca no próximo login.`);
    setAdminResetSuccess(true);
    setTimeout(() => {
      setAdminResetSuccess(false);
      setResettingUserForAdmin(null);
      setAdminTempPassword('123456');
    }, 2000);
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
          
          const newUserObj: Partial<User & { senha?: string }> = {
            id: newId,
            nome: newName,
            senha: '123456',
            trocar_senha_proximo_acesso: true,
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

  const handleConfirmEndSubstitution = async () => {
    if (!userToStopSubstituicao) return;
    const targetUser = userToStopSubstituicao;
    setIsProcessing(true);
    try {
      if (targetUser.perfil === 'SUPLENTE') {
        const conselheiroId = targetUser.substituindo_id;
        if (conselheiroId) {
          await onUpdateUser(conselheiroId, { 
            substituicao_ativa: false, 
            data_inicio_substituicao: '', 
            data_fim_prevista: '' 
          });
        }
        await onUpdateUser(targetUser.id, { 
          substituicao_ativa: false, 
          substituindo_id: '', 
          data_inicio_substituicao: '', 
          data_fim_prevista: '',
          status: 'INATIVO' 
        });
        onAddLog(`RH: Suplência de ${targetUser.nome} foi encerrada manualmente de forma segura.`);
      } else {
        const suplente = users.find(u => u.perfil === 'SUPLENTE' && u.substituindo_id === targetUser.id);
        await onUpdateUser(targetUser.id, { 
          substituicao_ativa: false, 
          data_inicio_substituicao: '', 
          data_fim_prevista: '' 
        });
        if (suplente) {
          await onUpdateUser(suplente.id, { 
            substituicao_ativa: false, 
            substituindo_id: '', 
            data_inicio_substituicao: '', 
            data_fim_prevista: '',
            status: 'INATIVO' 
          });
        }
        onAddLog(`RH: Suplência do conselheiro titular ${targetUser.nome} foi encerrada manualmente de forma segura.`);
      }
      setUserToStopSubstituicao(null);
    } catch (error) {
      console.error(error);
      alert("Houve um erro ao encerrar a suplência.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = () => {
    try {
      const dataStr = JSON.stringify({
        exportDate: new Date().toISOString(),
        documents: documents,
        userCount: users.length,
        version: "SICT-BACKUP-1.0"
      }, null, 2);
      
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SIMCT_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onAddLog('SISTEMA: Backup de dados exportado com sucesso.');
      return true;
    } catch (error) {
      console.error(error);
      alert("Erro ao exportar backup.");
      return false;
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsRestoring(true);
      const text = await file.text();
      const data = JSON.parse(text);

      let docsToRestore: any[] = [];
      if (Array.isArray(data)) {
        docsToRestore = data;
      } else if (data.documents && Array.isArray(data.documents)) {
        docsToRestore = data.documents;
      } else {
        alert("Formato de arquivo de backup não reconhecido.");
        return;
      }

      if (docsToRestore.length === 0) {
        alert("Nenhum procedimento encontrado no arquivo JSON de backup.");
        return;
      }

      if (!confirm(`Confirmar a restauração de ${docsToRestore.length} procedimento(s) do backup? Os procedimentos existentes serão mantidos ou atualizados.`)) {
        return;
      }

      if (onRestoreDocuments) {
        await onRestoreDocuments(docsToRestore);
        alert(`Restauração concluída! ${docsToRestore.length} procedimento(s) foram restaurados com sucesso.`);
        onAddLog(`SISTEMA: Backup restaurado com sucesso (${docsToRestore.length} procedimentos).`);
      }
    } catch (err) {
      console.error("Erro ao importar backup:", err);
      alert("Erro ao ler ou restaurar o arquivo JSON de backup. Verifique se o arquivo está correto.");
    } finally {
      setIsRestoring(false);
      if (e.target) e.target.value = '';
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
                <div className={`p-1 rounded-2xl ${user.status === 'ATIVO' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {user.fotoUrl ? (
                    <img src={user.fotoUrl} alt={user.nome} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center">
                      <UserIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setResettingUserForAdmin(user);
                      setAdminTempPassword('123456');
                      setShowAdminTempPassword(false);
                    }}
                    className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                    title="Redefinir Senha de Acesso (ADM Geral)"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setPermanentReplaceId(user.id)}
                    className="p-2 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                    title="Substituição Permanente (Migrar Funções)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setEditNewPassword('');
                      setShowEditPassword(false);
                    }}
                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Editar Nome/Cargo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setUserToDelete(user)}
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
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                {user.unidade_id ? `CT ${user.unidade_id}` : (user.perfil === 'SUPLENTE' ? 'SUPLENTE GERAL (SEM CT)' : 'SEM CT DEFINIDO')} • {user.cargo}
              </p>
              
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
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecionar Suplente</label>
                    <select 
                      className="w-full p-3 bg-white border border-slate-100 rounded-xl text-[11.5px] font-black uppercase outline-none focus:border-blue-500 shadow-sm"
                      value={selectedSuplenteId}
                      onChange={e => setSelectedSuplenteId(e.target.value)}
                    >
                      <option value="">Selecione o Suplente...</option>
                      {users.filter(u => u.perfil === 'SUPLENTE' && u.status !== 'EXCLUIDO').map(supl => (
                        <option key={supl.id} value={supl.id}>
                          {supl.nome.toUpperCase()} {supl.substituicao_ativa ? `(EM USO - DA CT ${supl.unidade_id})` : (supl.unidade_id ? `(DISPONÍVEL - DA CT ${supl.unidade_id})` : '(DISPONÍVEL - GERAL)')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button 
                      onClick={async () => {
                        if (!tempDates.start || !tempDates.end) {
                          alert("Selecione ambas as datas.");
                          return;
                        }
                        if (!selectedSuplenteId) {
                          alert("Selecione um suplente na lista.");
                          return;
                        }
                        const suplente = users.find(u => u.id === selectedSuplenteId);
                        if (!suplente) {
                          alert("Suplente não encontrado.");
                          return;
                        }
                        await onUpdateUser(user.id, { 
                          substituicao_ativa: true, 
                          data_inicio_substituicao: tempDates.start, 
                          data_fim_prevista: tempDates.end 
                        });
                        await onUpdateUser(suplente.id, {
                          substituicao_ativa: true,
                          substituindo_id: user.id,
                          data_inicio_substituicao: tempDates.start,
                          data_fim_prevista: tempDates.end,
                          unidade_id: user.unidade_id, // Assume a unidade do conselheiro substituído!
                          status: 'ATIVO'
                        });
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
                      const defaultSuplente = users.find(u => u.perfil === 'SUPLENTE' && u.unidade_id === user.unidade_id && u.status !== 'EXCLUIDO');
                      setSelectedSuplenteId(defaultSuplente?.id || '');
                    }}
                    className="w-full py-4 bg-slate-900/5 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-slate-100"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {user.substituicao_ativa ? 'Atualizar Suplência' : 'Designar Suplente'}
                  </button>
                )
              )}

              {user.substituicao_ativa && !substitutingId && (
                <button 
                  onClick={() => setUserToStopSubstituicao(user)}
                  className="w-full py-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 border border-red-100"
                >
                  <Power className="w-3.5 h-3.5" /> Encerrar Suplência
                </button>
              )}

              <button 
                onClick={() => onUpdateUser(user.id, { status: user.status === 'ATIVO' ? 'BLOQUEADO' : 'ATIVO' })}
                className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border shadow-sm ${
                  user.status === 'ATIVO' ? 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700' : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
                }`}
              >
                <Power className="w-3.5 h-3.5" /> {user.status === 'ATIVO' ? 'Bloquear' : 'Liberar'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {onResetDocuments && (
        <section className="mt-16 p-10 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-xl"><RefreshCw className="w-5 h-5" /></div>
                <h2 className="text-[20px] font-black text-slate-800 uppercase tracking-tight">Manutenção do Sistema</h2>
              </div>
              <p className="text-[12px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                Esta ação apagará <span className="text-red-500 font-black">TODOS OS PROCEDIMENTOS</span> registrados no banco de dados.
                <br />Recomendamos <span className="text-blue-500 font-black">SALVAR UM BACKUP</span> antes de resetar.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImportFile} 
                  accept=".json" 
                  className="hidden" 
                />
                <button 
                   onClick={handleExportData}
                   className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Salvar Backup (JSON)
                </button>
                <button 
                   onClick={() => fileInputRef.current?.click()}
                   disabled={isRestoring || isProcessing}
                   className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg cursor-pointer disabled:opacity-50"
                >
                  <Upload className={`w-4 h-4 ${isRestoring ? 'animate-bounce' : ''}`} /> {isRestoring ? 'Restaurando...' : 'Restaurar Backup (JSON)'}
                </button>
                <button 
                   onClick={() => {
                     setPendingResetAction('BACKUP_AND_RESET');
                     setResetConfirmText('');
                     setIsResetModalOpen(true);
                   }}
                   disabled={isProcessing || isRestoring}
                   className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-black transition-all shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} /> Salvar e Resetar Agora
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                setPendingResetAction('ONLY_RESET');
                setResetConfirmText('');
                setIsResetModalOpen(true);
              }}
              disabled={isProcessing}
              className="px-10 py-5 bg-red-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-xl shadow-red-100 active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-5 h-5" /> Resetar Todos os Procedimentos
            </button>
          </div>
        </section>
      )}

      {/* Modal: Confirmação de Reset Total (SEGURANÇA) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/80 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border-4 border-red-600 animate-in zoom-in-95">
            <div className="p-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                <RefreshCw className="w-12 h-12 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[24px] font-black uppercase text-slate-900 tracking-tight">Confirmação Crítica</h3>
                <p className="text-[14px] font-bold text-red-600 uppercase tracking-widest">Ação Irreversível de Segurança</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 w-full space-y-4">
                <p className="text-[12px] font-bold text-slate-500 uppercase leading-relaxed text-left">
                  {pendingResetAction === 'BACKUP_AND_RESET' 
                    ? "O sistema realizará o BACKUP e depois apagará os registros selecionados." 
                    : "O sistema apagará os registros selecionados sem backup automático."}
                </p>

                {/* Seletor de Unidades para Reset */}
                <div className="text-left space-y-2 pt-2 border-t border-slate-200">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Selecione o Escopo do Reset</label>
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => setResetTargetUnit('ALL')}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all text-left flex items-center justify-between ${
                        resetTargetUnit === 'ALL'
                          ? 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Ambas as Unidades (Geral)</span>
                      {resetTargetUnit === 'ALL' && <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetTargetUnit(1)}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all text-left flex items-center justify-between ${
                        resetTargetUnit === 1
                          ? 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Conselho Tutelar 1 (Unidade 1)</span>
                      {resetTargetUnit === 1 && <UserCheck className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setResetTargetUnit(2)}
                      className={`p-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all text-left flex items-center justify-between ${
                        resetTargetUnit === 2
                          ? 'bg-red-600 text-white border-red-600 shadow-md'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>Conselho Tutelar 2 (Unidade 2)</span>
                      {resetTargetUnit === 2 && <UserCheck className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <p className="text-[11px] font-black text-slate-800 uppercase text-left">
                    Para confirmar, digite a palavra <span className="text-red-600">RESET</span> abaixo:
                  </p>
                  <input 
                    autoFocus
                    type="text" 
                    className="w-full mt-3 p-4 bg-white border-2 border-red-100 rounded-2xl font-black text-center text-lg uppercase outline-none focus:border-red-600 transition-all"
                    value={resetConfirmText}
                    placeholder="DIGITE AQUI..."
                    onChange={e => setResetConfirmText(e.target.value.toUpperCase())}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full pt-4">
                <button 
                  disabled={resetConfirmText !== 'RESET' || isProcessing}
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      if (pendingResetAction === 'BACKUP_AND_RESET') {
                        const backupOk = handleExportData();
                        if (!backupOk) throw new Error("Erro no backup");
                      }
                      
                      const targetUnitId = resetTargetUnit === 'ALL' ? undefined : resetTargetUnit;
                      if (onResetDocuments) await onResetDocuments(targetUnitId);
                      
                      const successMsg = resetTargetUnit === 'ALL'
                        ? "SISTEMA REINICIALIZADO: Banco de dados geral limpo com sucesso."
                        : `SISTEMA REINICIALIZADO: Dados do Conselho Tutelar ${resetTargetUnit} limpos com sucesso.`;
                      
                      alert(successMsg);
                      setIsResetModalOpen(false);
                    } catch (error: any) {
                      const msg = error?.message || String(error);
                      alert(`FALHA NO RESET: ${msg}`);
                    } finally {
                      setIsProcessing(false);
                      setResetConfirmText('');
                    }
                  }}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-slate-900 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  {resetTargetUnit === 'ALL'
                    ? "Confirmar Reset Total"
                    : `Confirmar Reset (Unidade ${resetTargetUnit})`}
                </button>
                <button 
                  onClick={() => setIsResetModalOpen(false)}
                  className="w-full py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                  Cancelar Operação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão */}
      {userToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-8 pb-4 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                <Trash2 className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-[20px] font-black uppercase text-slate-800 tracking-tight">Confirmar Exclusão?</h3>
              <p className="text-[13px] font-medium text-slate-500">
                Você está prestes a excluir <span className="font-bold text-slate-900">{userToDelete.nome}</span>. 
                O acesso será revogado imediatamente e ele será removido da distribuição, mas o histórico de ações será preservado.
              </p>
            </div>
            <div className="p-8 pt-6 flex flex-col gap-3">
              <button 
                onClick={async () => {
                  if (onDeleteUser) await onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-red-700 transition-all"
              >
                Sim, Confirmar Exclusão
              </button>
              <button 
                onClick={() => setUserToDelete(null)}
                className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 transition-all font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
                   <div className="relative">
                     <input 
                       type={showNewPassword ? "text" : "password"} 
                       placeholder="Padrão: 123456" 
                       className="w-full p-4 pr-11 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-red-500" 
                       value={newUser.senha || ''} 
                       onChange={e => setNewUser({...newUser, senha: e.target.value})} 
                     />
                     <button 
                       type="button" 
                       onClick={() => setShowNewPassword(!showNewPassword)}
                       className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                     >
                       {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                     </button>
                   </div>
                 </div>
               </div>
               <p className="text-[11px] font-bold text-slate-400 leading-tight">
                 ℹ️ O usuário será cadastrado com exigência de troca de senha no primeiro acesso por motivos de segurança.
               </p>
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
               <div className="space-y-2 pt-2 border-t border-slate-100">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Redefinir Nova Senha (Opcional)</label>
                 <div className="relative">
                   <input 
                     type={showEditPassword ? "text" : "password"}
                     placeholder="Deixar em branco para manter a atual" 
                     className="w-full p-4 pr-11 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-blue-500" 
                     value={editNewPassword} 
                     onChange={e => setEditNewPassword(e.target.value)} 
                   />
                   <button 
                     type="button" 
                     onClick={() => setShowEditPassword(!showEditPassword)}
                     className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                   >
                     {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                   </button>
                 </div>
                 <p className="text-[10px] text-slate-400 font-bold ml-1">
                   Por segurança, a senha atual não é exibida. Se informada uma nova senha, o usuário deverá alterá-la no próximo acesso.
                 </p>
               </div>
               <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[1.5rem] font-black uppercase text-[13px] tracking-widest shadow-2xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3">
                  <Save className="w-6 h-6" /> Atualizar Cadastro
               </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redefinição Rápida de Senha pelo ADM Geral */}
      {resettingUserForAdmin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col">
            <header className="p-8 bg-emerald-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-xl"><KeyRound className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-black uppercase tracking-tight text-lg">Redefinir Senha</h3>
                    <p className="text-[11px] font-bold text-emerald-100 uppercase">{resettingUserForAdmin.nome}</p>
                  </div>
               </div>
               <button onClick={() => setResettingUserForAdmin(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
            </header>
            <div className="p-8 space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-[11px] font-bold text-amber-800 uppercase leading-relaxed">
                  ⚠️ Ação Administrativa: A senha será redefinida temporariamente. O usuário será orientado a cadastrar uma nova senha pessoal no próximo acesso.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Temporária</label>
                <div className="relative">
                  <input 
                    type={showAdminTempPassword ? "text" : "password"}
                    className="w-full p-4 pr-11 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-emerald-500 font-mono"
                    value={adminTempPassword}
                    onChange={e => setAdminTempPassword(e.target.value)}
                    placeholder="123456"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminTempPassword(!showAdminTempPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminTempPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {adminResetSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Senha temporária redefinida com sucesso!
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={handleAdminResetPassword}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" /> Confirmar
                </button>
                <button 
                  type="button"
                  onClick={() => setResettingUserForAdmin(null)}
                  className="px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
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
                          if (setActiveTab) setActiveTab('dashboard');
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
      {/* Modal: Confirmação de Encerramento de Suplência */}
      {userToStopSubstituicao && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/80 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full overflow-hidden border-4 border-red-500 animate-in zoom-in-95">
            <div className="p-10 flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center animate-pulse">
                <Power className="w-12 h-12 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-[24px] font-black uppercase text-slate-900 tracking-tight">Confirmar Encerramento?</h3>
                <p className="text-[14px] font-bold text-red-600 uppercase tracking-widest">Encerramento de Suplência Ativa</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 w-full text-left">
                <p className="text-[12px] font-bold text-slate-500 uppercase leading-relaxed mb-4">
                  Você está solicitando o encerramento manual da suplência ativa. O sistema removerá as restrições e reestabelecerá os acessos originais.
                </p>
                <div className="space-y-2 text-[11px] font-black uppercase text-slate-700">
                  <div>
                    <span className="text-slate-400 font-bold">Usuário Selecionado:</span>{' '}
                    <span className="text-slate-900">{userToStopSubstituicao.nome}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Unidade (CT):</span>{' '}
                    <span className="text-slate-900">
                      {userToStopSubstituicao.unidade_id ? `CT ${userToStopSubstituicao.unidade_id}` : 'Suplente Geral / Sem CT'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 w-full pt-4 shrink-0">
                <button 
                  disabled={isProcessing}
                  onClick={handleConfirmEndSubstitution}
                  className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-[13px] uppercase tracking-widest shadow-xl shadow-red-100 hover:bg-slate-900 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Processando...' : 'Confirmar Encerramento'}
                </button>
                <button 
                  onClick={() => setUserToStopSubstituicao(null)}
                  className="w-full py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-900 transition-all"
                >
                  Cancelar Operação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPanel;
