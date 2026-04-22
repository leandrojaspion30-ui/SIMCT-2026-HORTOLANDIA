/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LayoutDashboard, LogOut, FilePlus, Database, BarChart3, CalendarDays, Briefcase, UserCog, X, Repeat, AlertCircle, ShieldCheck, CheckCircle2, Zap, ClipboardCheck, ArrowRight, Activity, Lock, Users, Heart, GraduationCap, Building2, History, BellRing, TriangleAlert, PieChart } from 'lucide-react';
import { User, Documento, Log, LogType, DocumentFile, AgendaEntry, DocumentStatus, MonitoringInfo, MedidaAplicada } from './types';
import { INITIAL_USERS, UserWithPassword, INITIAL_AGENDA } from './constants';
import { db, ensureAuthenticated } from './lib/firebase';
import { syncCollection, saveDocument, saveLog, saveAgenda, deleteDocument, deleteAgenda, saveUser, deleteUser } from './lib/db';
import DocumentList from './components/DocumentList';
import DocumentRegistration from './components/DocumentRegistration';
import DocumentView from './components/DocumentView';
import MonitoringDashboard from './components/MonitoringDashboard';
import AuditLogViewer from './components/AuditLogViewer';
import AdvancedSearch from './components/AdvancedSearch';
import SettingsView from './components/SettingsView';
import AgendaView from './components/AgendaView';
import StatisticsView from './components/StatisticsView';
import AppointmentAlert from './components/AppointmentAlert';
import UserManagementPanel from './components/UserManagementPanel';

const CT_LOGO_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6A8u03A307V8A6_vC3B0C77z1u5w8rW6pLg&s";

const LoginIllustration: React.FC = () => (
  <div className="w-full h-64 bg-gradient-to-br from-[#EFF6FF] to-[#ECFDF5] relative overflow-hidden">
    <img 
      src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=1000&auto=format&fit=crop" 
      alt="Rede de Proteção" 
      className="w-full h-full object-cover opacity-20 mix-blend-multiply"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
    <div className="absolute inset-0 flex items-center justify-center p-8">
      <div className="relative w-full max-w-xs flex items-center justify-center">
        <div className="absolute -top-10 -left-4 p-2.5 bg-white rounded-xl shadow-md border border-blue-100 animate-bounce duration-[3000ms]">
          <GraduationCap className="w-5 h-5 text-blue-500" />
        </div>
        <div className="absolute -bottom-8 -right-2 p-2.5 bg-white rounded-xl shadow-md border border-emerald-100 animate-bounce duration-[4000ms]">
          <Heart className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="absolute top-2 -right-8 p-2 bg-white rounded-xl shadow-md border border-amber-100 animate-pulse">
          <Building2 className="w-4 h-4 text-amber-500" />
        </div>
        <div className="flex flex-col items-center text-center space-y-3 z-10">
          <div className="p-4 bg-white/90 backdrop-blur-md rounded-[2rem] shadow-xl border border-blue-50 flex items-center justify-center">
            <Users className="w-10 h-10 text-[#2563EB]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[12px] font-black text-[#111827] uppercase tracking-[0.3em] opacity-80">SIMCT Hortolândia</h3>
            <p className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider">Rede de Garantia de Direitos</p>
          </div>
        </div>
      </div>
    </div>
    <div className="absolute bottom-4 left-6 flex items-center gap-2 px-3 py-1.5 bg-white/50 backdrop-blur-sm rounded-full border border-blue-100/50">
      <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
      <span className="text-[9px] font-black text-[#2563EB] uppercase tracking-widest">Acesso Seguro</span>
    </div>
  </div>
);

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void; collapsed?: boolean; danger?: boolean; }> = ({ icon, label, active, onClick, collapsed, danger }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-[#2563EB] text-white shadow-md' : danger ? 'text-red-400 hover:bg-red-500/10 hover:text-white' : 'text-[#9CA3AF] hover:bg-white/5 hover:text-white'}`}>
    <div className="shrink-0">{icon}</div>
    {!collapsed && <span className="text-[14px] font-semibold uppercase tracking-wide whitespace-nowrap">{label}</span>}
  </button>
);

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'my-docs' | 'monitoring' | 'logs' | 'search' | 'settings' | 'agenda' | 'statistics' | 'edit' | 'user-management' | 'plantao' | 'global-statistics'>('dashboard');
  const [users, setUsers] = useState<UserWithPassword[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [acknowledgedEventIds, setAcknowledgedEventIds] = useState<string[]>([]);
  const [acknowledgedReminderIds, setAcknowledgedReminderIds] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forceDirectEdit, setForceDirectEdit] = useState(false);
  const [allDocuments, setAllDocuments] = useState<Documento[]>([]);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [allFiles, setAllFiles] = useState<DocumentFile[]>([]);
  const [allAgenda, setAllAgenda] = useState<AgendaEntry[]>([]);

  const documents = useMemo(() => allDocuments.filter(d => (d.unidade_id || 1) === currentUser?.unidade_id), [allDocuments, currentUser]);
  const logs = useMemo(() => allLogs.filter(l => (l.unidade_id || 1) === currentUser?.unidade_id), [allLogs, currentUser]);
  const files = useMemo(() => allFiles.filter(f => (f.unidade_id || 1) === currentUser?.unidade_id), [allFiles, currentUser]);
  const agenda = useMemo(() => allAgenda, [allAgenda]);
  const isLud = useMemo(() => currentUser?.nome === 'LUDIMILA' || currentUser?.nome === 'LEANDRO', [currentUser]);

  const filteredUsers = useMemo(() => {
    if (isLud) return users;
    return users.filter(u => (u.unidade_id || 1) === currentUser?.unidade_id);
  }, [users, currentUser, isLud]);

  const imminentEvent = useMemo(() => {
    if (!currentUser) return null;
    const now = new Date();
    const myEvents = agenda.filter(e => (e.conselheiro_id === currentUser.id || e.conselheiro_id === currentUser.real_user_id) && !acknowledgedEventIds.includes(e.id));
    
    return myEvents.find(e => {
      try {
        const eventDate = new Date(`${e.data}T${e.hora}:00`);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        // Mostrar se for hoje e não foi descartado
        const isToday = e.data === now.toISOString().split('T')[0];
        return isToday && !acknowledgedEventIds.includes(e.id);
      } catch {
        return false;
      }
    });
  }, [agenda, currentUser, acknowledgedEventIds]);

  const twoHourReminder = useMemo(() => {
    if (!currentUser || (currentUser.perfil !== 'CONSELHEIRO' && currentUser.perfil !== 'SUPLENTE')) return null;
    const now = new Date();
    
    return agenda.find(e => {
      if ((e.conselheiro_id !== currentUser.id && e.conselheiro_id !== currentUser.real_user_id) || acknowledgedReminderIds.includes(`${e.id}-2h`)) return false;
      try {
        const eventDate = new Date(`${e.data}T${e.hora}:00`);
        const diffMs = eventDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        // Alerta entre 2h e 1h antes do compromisso
        return diffHours > 0 && diffHours <= 2.0;
      } catch { return false; }
    });
  }, [agenda, currentUser, acknowledgedReminderIds]);

  useEffect(() => {
    // Basic Authentication setup for security rules
    ensureAuthenticated();

    // Listeners for real-time synchronization
    const unsubDocs = syncCollection<Documento>('documents', setAllDocuments);
    const unsubLogs = syncCollection<Log>('logs', setAllLogs);
    const unsubAgenda = syncCollection<AgendaEntry>('agenda', setAllAgenda);
    const unsubUsers = syncCollection<UserWithPassword>('users', (storedUsers) => {
      const baseUsers = INITIAL_USERS.map(u => ({ ...u, status: u.status || 'ATIVO', tentativas_login: 0 }));
      if (storedUsers.length > 0) {
        const merged = baseUsers.map(bu => {
          const found = storedUsers.find(s => s.id === bu.id);
          return found ? { ...bu, ...found } : bu;
        });
        setUsers(merged);
      } else {
        setUsers(baseUsers);
      }
    });

    const savedAck = localStorage.getItem('pt_ack_events');
    const savedAckRem = localStorage.getItem('pt_ack_reminders');
    if (savedAck) setAcknowledgedEventIds(JSON.parse(savedAck));
    if (savedAckRem) setAcknowledgedReminderIds(JSON.parse(savedAckRem));

    setTimeout(() => setIsInitializing(false), 1500);

    return () => {
      unsubDocs();
      unsubLogs();
      unsubAgenda();
      unsubUsers();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pt_ack_events', JSON.stringify(acknowledgedEventIds));
    localStorage.setItem('pt_ack_reminders', JSON.stringify(acknowledgedReminderIds));
  }, [acknowledgedEventIds, acknowledgedReminderIds]);

  const addLog = useCallback(async (docId: string, acao: string, tipo: LogType = 'SISTEMA', customUser?: User) => {
    const user = customUser || currentUser;
    if (!user) return;
    const newLog: Log = { 
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, 
      unidade_id: user.unidade_id,
      documento_id: docId, 
      usuario_id: user.id, 
      usuario_nome: user.nome, 
      acao, 
      tipo,
      data_hora: new Date().toISOString() 
    };
    await saveLog(newLog);
  }, [currentUser]);

  const pendingValidations = useMemo(() => {
    if (!currentUser || (currentUser.perfil !== 'CONSELHEIRO' && currentUser.perfil !== 'SUPLENTE')) return [];
    return documents.filter(d => {
       const isAwaiting = d.status.includes('AGUARDANDO_VALIDACAO');
       const inTrio = d.conselheiros_providencia_nomes?.includes(currentUser.nome.toUpperCase()) || 
                      (currentUser.is_suplente_active && currentUser.substituted_name && d.conselheiros_providencia_nomes?.includes(currentUser.substituted_name.toUpperCase()));
       const alreadyValidated = d.medidas_detalhadas?.some(m => 
         m.confirmacoes?.some(c => c.usuario_id === currentUser.id || c.usuario_id === currentUser.real_user_id)
       );
       return isAwaiting && inTrio && !alreadyValidated;
    });
  }, [documents, currentUser]);

  const handleLogout = () => {
    const confirmSave = window.confirm("Deseja salvar as alterações pendentes em rascunho antes de sair?");
    addLog('SISTEMA', `Efetuou Logoff (Salvamento Rascunho: ${confirmSave ? 'SIM' : 'NÃO'})`, 'SEGURANÇA');
    setCurrentUser(null);
    setSelectedDocId(null);
    setActiveTab('dashboard');
  };

  const handleOpenDocument = useCallback((id: string, isFromReference: boolean = false) => {
    setSelectedDocId(id);
    if (isFromReference) setForceDirectEdit(true);
    addLog(id, `VISUALIZAÇÃO: Prontuário aberto para consulta de dados técnicos.`, 'DOCUMENTO');
  }, [addLog]);

  const handleDocumentSubmit = async (data: any, files: File[]) => {
    if (editingDocId) {
      await saveDocument({ ...data, id: editingDocId });
      addLog(editingDocId, `EDIÇÃO: Registro de prontuário atualizado administrativamente.`, 'DOCUMENTO');
      setEditingDocId(null);
      handleNavigate('dashboard');
      return;
    }
    const id = `doc-${Math.random().toString(36).substr(2, 9)}`;
    const newDoc: Documento = { 
      ...data, 
      id, 
      unidade_id: currentUser!.unidade_id,
      criado_em: new Date().toISOString(), 
      status: data.status || ['AGUARDANDO_ANALISE'], 
      criado_por_id: currentUser!.id, 
      ciência_registrada_por: [], 
      distribuicao_automatica: !data.is_manual_override 
    };
    
    const refName = INITIAL_USERS.find(u => u.id === newDoc.conselheiro_referencia_id)?.nome || 'N/A';
    const provName = INITIAL_USERS.find(u => u.id === newDoc.conselheiro_providencia_id)?.nome || 'N/A';

    await saveDocument(newDoc);
    addLog(id, `CRIAÇÃO: Novo procedimento registrado. REF: [${refName}] | IMEDIATA: [${provName}].`, 'DOCUMENTO');
    handleNavigate('dashboard');
  };

  const handleNavigate = (tab: typeof activeTab) => { 
    setSelectedDocId(null); 
    setEditingDocId(null); 
    setForceDirectEdit(false);
    setActiveTab(tab); 
  };

  const renderContent = () => {
    if (!currentUser) return null;
    const isAdministrative = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
    
    if (activeTab === 'user-management' && (isLud || currentUser.nome === 'LEANDRO')) return (
      <UserManagementPanel 
        users={filteredUsers} 
        onUpdateUser={async (id, upd) => {
          const target = users.find(u => u.id === id);
          if (upd.status) addLog('SISTEMA', `RH: Usuário ${target?.nome} teve status alterado para ${upd.status}.`, 'SEGURANÇA');
          if (upd.senha) addLog('SISTEMA', `RH: Senha do usuário ${target?.nome} redefinida por administrador.`, 'SEGURANÇA');
          if (upd.nome && target && upd.nome !== target.nome) addLog('SISTEMA', `RH: Nome do usuário alterado de ${target.nome} para ${upd.nome}.`, 'SEGURANÇA');
          await saveUser({ ...upd, id });
        }} 
        onDeleteUser={async (id) => {
          const target = users.find(u => u.id === id);
          addLog('SISTEMA', `RH: EXCLUSÃO DEFINITIVA de usuário: ${target?.nome || 'ID '+id}.`, 'SEGURANÇA');
          await deleteUser(id);
        }}
        onAddUser={async (newUser) => {
          addLog('SISTEMA', `RH: NOVO USUÁRIO ADICIONADO: ${newUser.nome}.`, 'SEGURANÇA');
          await saveUser(newUser);
        }}
        onAddLog={(action) => addLog('SISTEMA', action, 'SEGURANÇA')} 
      />
    );
    
    if (activeTab === 'register' && isLud) {
      setActiveTab('dashboard');
      return null;
    }

    if (activeTab === 'register' || activeTab === 'plantao') return <DocumentRegistration documents={documents} agenda={agenda} currentUser={currentUser} onSubmit={handleDocumentSubmit} onCancel={() => handleNavigate('dashboard')} isReadOnly={activeTab === 'register' ? !isAdministrative : false} title={activeTab === 'plantao' ? 'SIMCT - Novo Proced/Plantão' : undefined} />;
    if (activeTab === 'edit' && editingDocId) return <DocumentRegistration documents={documents} agenda={agenda} currentUser={currentUser} initialData={documents.find(d => d.id === editingDocId)} onSubmit={handleDocumentSubmit} onCancel={() => handleNavigate('dashboard')} isReadOnly={!isAdministrative} />;
    
    if (selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if (!doc) return null;
      return <DocumentView document={doc} allDocuments={documents} agenda={agenda} files={[]} logs={logs.filter(l => l.documento_id === selectedDocId)} currentUser={currentUser} isReadOnly={isAdministrative} forceEdit={forceDirectEdit} onBack={() => setSelectedDocId(null)} onEdit={() => { setEditingDocId(doc.id); setActiveTab('edit'); }} onDelete={async (id) => { 
          addLog(id, `EXCLUSÃO: Documento removido permanentemente do banco de dados SIMCT.`, 'DOCUMENTO');
          await deleteDocument(id);
          setSelectedDocId(null);
      }} onUpdateStatus={async (id, s) => {
          addLog(id, `STATUS: Documento alterado para a situação [${s[s.length-1]}].`, 'SISTEMA');
          await saveDocument({ id, status: s });
      }} onUpdateDocument={async (id, fields) => await saveDocument({ ...fields, id })} onAddLog={addLog} onScience={() => {}} />;
    }

    switch (activeTab) {
      case 'dashboard': 
        return (
          <div className="space-y-6">
            {pendingValidations.length > 0 && (
              <div 
                className="p-6 bg-red-600 rounded-[2rem] border-4 border-red-500 shadow-2xl animate-pulse flex items-center justify-between group hover:scale-[1.01] transition-all cursor-pointer" 
                onClick={() => handleOpenDocument(pendingValidations[0].id, true)}
              >
                 <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                       <BellRing className="w-8 h-8 text-white" />
                    </div>
                    <div>
                       <h3 className="text-white font-black text-[18px] uppercase tracking-tight">Validação Pendente no Colegiado!</h3>
                       <p className="text-white/80 text-[12px] font-bold uppercase tracking-widest mt-1">Você possui {pendingValidations.length} {pendingValidations.length === 1 ? 'procedimento aguardando' : 'procedimentos aguardando'} sua assinatura técnica.</p>
                    </div>
                 </div>
                 <div className="px-6 py-3 bg-white text-red-600 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2">
                    Validar Agora <ArrowRight className="w-4 h-4" />
                 </div>
              </div>
            )}
            <DocumentList documents={documents} currentUser={currentUser} isReadOnly={false} onSelectDoc={handleOpenDocument} onEditDoc={(id) => { setEditingDocId(id); setActiveTab('edit'); }} onDeleteDoc={async (id) => {
                addLog(id, `EXCLUSÃO: Documento removido permanentemente via Painel Geral.`, 'DOCUMENTO');
                await deleteDocument(id);
            }} onScience={() => {}} onUpdateStatus={() => {}} />
          </div>
        );
      
      case 'my-docs':
        const myReferencedDocs = documents.filter(d => {
          const isFixedRef = d.conselheiro_referencia_id === currentUser.id;
          const isImediata = d.conselheiros_providencia_nomes?.includes(currentUser.nome.toUpperCase());
          return isFixedRef || isImediata;
        });
        return <DocumentList documents={myReferencedDocs} currentUser={currentUser} isReadOnly={false} onSelectDoc={(id) => handleOpenDocument(id, true)} onEditDoc={(id) => { setEditingDocId(id); setActiveTab('edit'); }} onDeleteDoc={async (id) => {
            addLog(id, `EXCLUSÃO: Documento removido permanentemente via Minha Referência.`, 'DOCUMENTO');
            await deleteDocument(id);
        }} onScience={() => {}} onUpdateStatus={() => {}} isMyReferenceView={true} />;
      
      case 'monitoring': return <MonitoringDashboard documents={documents} currentUser={currentUser} effectiveUserId={currentUser.id} onSelectDoc={handleOpenDocument} onAddLog={addLog} onUpdateMonitoring={async (id, m) => { 
          await saveDocument({ id, monitoramento: m }); 
      }} onRemoveMonitoring={async (id) => {
          addLog(id, `MONITORAMENTO: Acompanhamento de caso encerrado com sucesso.`, 'MONITORAMENTO');
          await deleteDocument(id);
      }} isReadOnly={isAdministrative} />;
      case 'agenda': return <AgendaView agenda={agenda} setAgenda={async (items) => {
          // Find the new entry if it's an array set call
          if (Array.isArray(items)) {
            // This is a bit complex due to local state vs db sync
            // Typically AgendaView should calling saveAgenda directly or items should be the whole list
            // If it's the whole list, we might need to diff, but for simplicity:
            const lastItem = items[items.length - 1];
            if (lastItem) await saveAgenda(lastItem);
          }
      }} allDocuments={allDocuments} currentUser={currentUser} effectiveUserId={currentUser.id} isReadOnly={currentUser.nome === 'LUDIMILA'} onAddLog={(desc) => addLog('SISTEMA', desc, 'SISTEMA')} />;
      case 'search': return <AdvancedSearch documents={documents} currentUser={currentUser} onSelectDoc={handleOpenDocument} />;
      case 'logs': return <AuditLogViewer logs={logs} />;
      case 'settings': return <SettingsView currentUser={currentUser} onUpdatePassword={async (p) => { 
          await saveUser({ id: currentUser.id, senha: p }); 
          addLog('SISTEMA', `SEGURANÇA: Senha e assinatura digital alterada pelo próprio usuário.`, 'SEGURANÇA');
          return true; 
      }} />;
      case 'statistics': return <StatisticsView documents={documents} agenda={agenda} currentUser={currentUser} />;
      case 'global-statistics': return <StatisticsView documents={allDocuments} agenda={allAgenda} currentUser={currentUser} isGlobal />;
      default: return null;
    }
  };

  if (isInitializing) return <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center text-white"><h1 className="text-[20px] font-bold animate-pulse uppercase tracking-[0.3em]">SIMCT HORTOLÂNDIA</h1></div>;

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]">
      <div className="bg-white rounded-[2.5rem] shadow-xl max-w-md w-full overflow-hidden border border-[#E5E7EB] animate-in fade-in duration-700">
        <LoginIllustration />
        <div className="p-10 pt-6">
          <header className="flex flex-col items-center mb-10 text-center">
            <img src={CT_LOGO_URL} alt="SIMCT" className="w-16 h-16 mb-4" />
            <h1 className="text-[18px] font-bold uppercase tracking-tight">SIM<span className="text-[#2563EB]">CT</span> Hortolândia</h1>
          </header>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            setLoginError(null); 
            const userInput = (selectedUserId || '').trim().toUpperCase();
            const user = users.find(u => (u.nome || '').toUpperCase() === userInput); 
            
            if (!user || user.senha !== password) { 
              setLoginError("Erro: Credenciais inválidas."); 
              if (user) addLog('SISTEMA', `FALHA DE SEGURANÇA: Tentativa de login com senha incorreta para o usuário [${user.nome}].`, 'SEGURANÇA', user);
              return; 
            } 
            
            if (user.status === 'BLOQUEADO') { 
              setLoginError("ACESSO BLOQUEADO: PROCURE A ADM GERAL."); 
              addLog('SISTEMA', `BLOQUEIO: Usuário bloqueado [${user.nome}] tentou acessar o sistema.`, 'SEGURANÇA', user);
              return; 
            } 

            // Lógica de Substituição/Suplência Generalizada
            const now = new Date().toISOString().split('T')[0];
            if (user.perfil === 'CONSELHEIRO' && user.substituicao_ativa) {
              if (now >= (user.data_inicio_substituicao || '') && now <= (user.data_fim_prevista || '')) {
                setLoginError("ACESSO NEGADO: VOCÊ ESTÁ SENDO SUBSTITUÍDO PELA SUPLENTE.");
                addLog('SISTEMA', `ACESSO NEGADO: Conselheiro [${user.nome}] tentou acessar enquanto está em suplência ativa.`, 'SEGURANÇA', user);
                return;
              }
            }
            
            if (!acceptedTerms) { 
              setLoginError("Obrigatório aceitar termos LGPD."); 
              addLog('SISTEMA', `SEGURANÇA: Acesso negado. Usuário [${user.nome}] recusou termos LGPD.`, 'SEGURANÇA', user);
              return; 
            } 
            
            // Se for um Suplente em substituição ativa, assume a identidade mas mantém rastro
            let sessionUser = { ...user };
            if (user.perfil === 'SUPLENTE' && user.substituicao_ativa && user.substituindo_id) {
              const substituted = users.find(u => u.id === user.substituindo_id);
              if (substituted && now >= (user.data_inicio_substituicao || '') && now <= (user.data_fim_prevista || '')) {
                sessionUser = {
                  ...substituted,
                  id: substituted.id, // Assume o ID para ver os documentos dele
                  nome: `${user.nome} (Subst. ${substituted.nome})`,
                  perfil: 'CONSELHEIRO',
                  cargo: `Suplente de ${substituted.nome}`,
                  unidade_id: substituted.unidade_id,
                  is_suplente_active: true,
                  real_user_id: user.id,
                  substituted_name: substituted.nome
                };
              }
            }
            
            setCurrentUser(sessionUser); 
            addLog('SISTEMA', `LOGIN: Autenticação realizada com sucesso. Termos LGPD aceitos.`, 'SEGURANÇA', sessionUser);
          }} className="space-y-6">
            <div className="relative">
              <input placeholder="USUÁRIO" className="w-full p-4 pl-12 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none font-bold uppercase focus:border-[#2563EB] transition-all" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} />
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <input type="password" placeholder="SENHA" className="w-full p-4 pl-12 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none font-bold focus:border-[#2563EB] transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              <ShieldCheck className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="flex items-center gap-3 p-1">
              <input type="checkbox" className="w-4 h-4 text-[#2563EB] border-[#E5E7EB] rounded" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
              <label className="text-[12px] font-medium uppercase text-[#4B5563]">Aceito LGPD e Sigilo Profissional</label>
            </div>
            {loginError && <div className="p-4 bg-red-50 text-red-700 text-[12px] font-bold uppercase rounded-xl border border-red-100">{loginError}</div>}
            <button type="submit" className="w-full py-4 bg-[#111827] text-white rounded-xl font-bold uppercase text-[13px] tracking-widest shadow-lg hover:bg-[#2563EB] transition-all">Acessar SIMCT</button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] font-['Inter']">
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isSidebarOpen ? 'lg:w-80' : 'lg:w-24 w-80'} bg-[#111827] transition-all duration-300 flex flex-col fixed inset-y-0 z-50 overflow-hidden`}>
        <div className="p-6 flex items-center gap-4 border-b border-white/5"><img src={CT_LOGO_URL} alt="SIMCT" className="w-10 h-10" />{(isSidebarOpen || window.innerWidth < 1024) && <span className="text-white font-bold text-[18px] uppercase">SIM<span className="text-[#2563EB]">CT</span></span>}</div>
        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto min-h-0">
          <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Painel Geral" active={activeTab === 'dashboard'} onClick={() => handleNavigate('dashboard')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          {(currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') && currentUser.nome !== 'LUDIMILA' && <NavItem icon={<FilePlus className="w-5 h-5" />} label="NOVO PROCEDIMENTO" active={activeTab === 'register'} onClick={() => handleNavigate('register')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />}
          {(currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE') && (<><NavItem icon={<Zap className="w-5 h-5" />} label="NOVO PROCED/PLANTÃO" active={activeTab === 'plantao'} onClick={() => handleNavigate('plantao')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} /><NavItem icon={<Briefcase className="w-5 h-5" />} label="Minha Referência" active={activeTab === 'my-docs'} onClick={() => handleNavigate('my-docs')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} /><NavItem icon={<Activity className="w-5 h-5" />} label="Monitoramento" active={activeTab === 'monitoring'} onClick={() => handleNavigate('monitoring')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} /></>)}
          <NavItem icon={<CalendarDays className="w-5 h-5" />} label="Agenda" active={activeTab === 'agenda'} onClick={() => handleNavigate('agenda')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          <NavItem icon={<Database className="w-5 h-5" />} label="Busca Ativa" active={activeTab === 'search'} onClick={() => handleNavigate('search')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Relatórios" active={activeTab === 'statistics'} onClick={() => handleNavigate('statistics')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          <NavItem icon={<ShieldCheck className="w-5 h-5" />} label="Minha Senha" active={activeTab === 'settings'} onClick={() => handleNavigate('settings')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />
          {(currentUser.nome === 'LUDIMILA' || currentUser.nome === 'LEANDRO') && <NavItem icon={<UserCog className="w-5 h-5" />} label="Gestão de RH" active={activeTab === 'user-management'} onClick={() => handleNavigate('user-management')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />}
          {isLud && <NavItem icon={<History className="w-5 h-5" />} label="Audit Log" active={activeTab === 'logs'} onClick={() => handleNavigate('logs')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />}
          {currentUser.nome === 'LEANDRO' && <NavItem icon={<PieChart className="w-5 h-5" />} label="Relatórios das Unidades" active={activeTab === 'global-statistics'} onClick={() => handleNavigate('global-statistics')} collapsed={!isSidebarOpen && window.innerWidth >= 1024} />}
        </nav>
        <div className="p-4 border-t border-white/5">
          <NavItem icon={<LogOut className="w-5 h-5" />} label="Sair" active={false} onClick={handleLogout} collapsed={!isSidebarOpen && window.innerWidth >= 1024} danger />
        </div>
      </aside>
      <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24 ml-0'} transition-all min-h-screen`}>
        <div className="p-4 lg:p-8">
          <header className="flex items-center justify-between mb-8 lg:mb-12">
            <div><h2 className="text-[10px] lg:text-[13px] font-medium text-[#4B5563] uppercase tracking-widest text-wrap max-w-[200px] lg:max-w-none">ZELAR PELO CUMPRIMENTO DO DIREITO</h2><div className="flex flex-col lg:flex-row lg:items-center gap-1 lg:gap-2 mt-1"><span className="text-[14px] lg:text-[16px] font-semibold text-[#111827] uppercase">{currentUser.nome}</span><span className="text-[12px] lg:text-[14px] font-medium text-[#2563EB] uppercase">({currentUser.cargo})</span></div></div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-white border border-[#E5E7EB] rounded-xl shadow-sm hover:bg-slate-50">{isSidebarOpen ? <X className="w-5 h-5" /> : <LayoutDashboard className="w-5 h-5" />}</button>
          </header>
          {renderContent()}
        </div>
      </main>
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {imminentEvent && (
        <AppointmentAlert 
          event={imminentEvent} 
          onView={(id) => {
            setActiveTab('agenda');
            setAcknowledgedEventIds(prev => [...prev, id]);
          }}
          onDismiss={(id) => setAcknowledgedEventIds(prev => [...prev, id])}
        />
      )}
      {twoHourReminder && (
        <AppointmentAlert 
          event={{...twoHourReminder, descricao: `LEMBRETE (2H): ${twoHourReminder.descricao}`}} 
          onView={(id) => {
            setActiveTab('agenda');
            setAcknowledgedReminderIds(prev => [...prev, `${id}-2h`]);
          }}
          onDismiss={(id) => setAcknowledgedReminderIds(prev => [...prev, `${id}-2h`])}
        />
      )}
    </div>
  );
};

export default App;
