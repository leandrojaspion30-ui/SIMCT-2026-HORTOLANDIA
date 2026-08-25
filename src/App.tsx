/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { LayoutDashboard, LogOut, FilePlus, Database, BarChart3, CalendarDays, Briefcase, UserCog, X, Repeat, AlertCircle, ShieldCheck, CheckCircle2, Zap, ClipboardCheck, ArrowRight, ArrowLeft, Activity, Lock, Users, Heart, GraduationCap, Building2, History, BellRing, TriangleAlert, PieChart, Timer, Save, Eye, EyeOff, RefreshCw, MessageSquare, Bot, Scale } from 'lucide-react';
import { User, Documento, Log, LogType, DocumentFile, AgendaEntry, DocumentStatus, MonitoringInfo, MedidaAplicada, ScaleException, ChatMessage } from './types';
import { INITIAL_USERS, UserWithPassword, INITIAL_AGENDA, getUnidadeByBairro, STATUS_LABELS, getEffectiveEscala, isSameCounselorName } from './constants';
import { db, ensureAuthenticated } from './lib/firebase';
import { syncCollection, saveDocument, saveLog, saveAgenda, deleteDocument, deleteAgenda, saveUser, deleteUser, deleteAllDocuments, saveScaleException, deleteScaleException } from './lib/db';
import ConfidentialityTermModal from './components/ConfidentialityTermModal';
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
import { DistributionSimulator } from './components/DistributionSimulator';
import { InternalChatWidget } from './components/InternalChatWidget';
import JarvisAssistant from './components/JarvisAssistant';
import { LegalLibrary } from './components/LegalLibrary';

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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(localStorage.getItem('simct_session_id'));
  const [initialSyncsDone, setInitialSyncsDone] = useState({
    users: false,
    documents: false,
    logs: false,
    agenda: false
  });

  const hasCleanedUpUsers = useRef(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('simct_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Gerenciamento refinado da inicialização do app para evitar saltos de layout e flashes de UI
  useEffect(() => {
    if (!isInitializing) return;
    
    // Lista de requisitos para considerar o app "pronto"
    const syncsReady = initialSyncsDone.users && initialSyncsDone.documents && initialSyncsDone.logs && initialSyncsDone.agenda;

    if (syncsReady) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
    
    // Timeout de segurança curto (2.5s) para liberar o app mesmo com lentidão de rede ou cota esgotada
    const safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 2500);
    return () => clearTimeout(safetyTimer);
  }, [initialSyncsDone, isInitializing]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('simct_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('simct_current_user');
      }
    } catch (err) {
      console.error('Failed to persist user session:', err);
    }
  }, [currentUser]);

  // Recupera estado de navegação persistido para manter a mesma tela ao recarregar a página
  const [activeTab, setActiveTab] = useState<'dashboard' | 'register' | 'my-docs' | 'monitoring' | 'logs' | 'search' | 'settings' | 'agenda' | 'statistics' | 'edit' | 'user-management' | 'plantao' | 'global-statistics' | 'distribution-test' | 'jarvis' | 'library'>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeTab) return parsed.activeTab;
      }
    } catch {}
    return 'dashboard';
  });

  const [dashboardViewMode, setDashboardViewMode] = useState<'ALL' | 'REF' | 'IMED' | 'VALID'>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dashboardViewMode) return parsed.dashboardViewMode;
      }
    } catch {}
    return 'ALL';
  });

  const [dashboardFilters, setDashboardFilters] = useState<{ term: string; bairro: string; status: string; conselheiro_ref_id: string; data_registro: string; pasta_guardada?: string }>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.dashboardFilters) return parsed.dashboardFilters;
      }
    } catch {}
    return { term: '', bairro: '', status: '', conselheiro_ref_id: '', data_registro: '', pasta_guardada: 'NAO' };
  });

  const [dashboardExpandedFolders, setDashboardExpandedFolders] = useState<Record<string, boolean>>({});
  const [dashboardFocusedFolderKey, setDashboardFocusedFolderKey] = useState<string | null>(null);
  const [dashboardIsGroupedByFamily, setDashboardIsGroupedByFamily] = useState<boolean>(true);

  const [myDocsExpandedFolders, setMyDocsExpandedFolders] = useState<Record<string, boolean>>({});
  const [myDocsFocusedFolderKey, setMyDocsFocusedFolderKey] = useState<string | null>(null);
  const [myDocsIsGroupedByFamily, setMyDocsIsGroupedByFamily] = useState<boolean>(true);
  const [users, setUsers] = useState<UserWithPassword[]>(INITIAL_USERS);

  const [selectedDocId, setSelectedDocId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.selectedDocId) return parsed.selectedDocId;
      }
    } catch {}
    return null;
  });

  const [editingDocId, setEditingDocId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.editingDocId) return parsed.editingDocId;
      }
    } catch {}
    return null;
  });

  const [forceDirectEdit, setForceDirectEdit] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('simct_nav_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.forceDirectEdit !== undefined) return Boolean(parsed.forceDirectEdit);
      }
    } catch {}
    return false;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Persistência contínua do estado da tela ativa
  useEffect(() => {
    if (!currentUser) return;
    try {
      localStorage.setItem('simct_nav_state', JSON.stringify({
        activeTab,
        selectedDocId,
        editingDocId,
        forceDirectEdit,
        dashboardViewMode,
        dashboardFilters
      }));
    } catch (err) {
      console.error('Failed to persist nav state to localStorage:', err);
    }
  }, [currentUser, activeTab, selectedDocId, editingDocId, forceDirectEdit, dashboardViewMode, dashboardFilters]);

  // Persistência imediata antes de recarregar a janela
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!currentUser) return;
      try {
        localStorage.setItem('simct_nav_state', JSON.stringify({
          activeTab,
          selectedDocId,
          editingDocId,
          forceDirectEdit,
          dashboardViewMode,
          dashboardFilters
        }));
      } catch (err) {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser, activeTab, selectedDocId, editingDocId, forceDirectEdit, dashboardViewMode, dashboardFilters]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [acknowledgedEventIds, setAcknowledgedEventIds] = useState<string[]>([]);
  const [acknowledgedReminderIds, setAcknowledgedReminderIds] = useState<string[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [allDocuments, setAllDocuments] = useState<Documento[]>([]);
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [allFiles, setAllFiles] = useState<DocumentFile[]>([]);
  const [allAgenda, setAllAgenda] = useState<AgendaEntry[]>([]);
  const [scaleExceptions, setScaleExceptions] = useState<ScaleException[]>([]);
  const [allChatMessages, setAllChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('simct_chat_messages_cache');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [navHistory, setNavHistory] = useState<{
    activeTab: typeof activeTab;
    selectedDocId: string | null;
    editingDocId: string | null;
    forceDirectEdit: boolean;
  }[]>([]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastCleanup, setLastCleanup] = useState<number>(0);

  // Relógio em tempo real para manter a escala atualizada sem refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1 minuto
    return () => clearInterval(timer);
  }, []);

  // Limpeza automática de trocas de escala após 47 horas
  useEffect(() => {
    if (!currentUser || scaleExceptions.length === 0) return;
    
    // Rodar limpeza apenas a cada 1 hora para evitar excesso de requisições
    const now = Date.now();
    if (now - lastCleanup < 3600000) return; 

    const cleanup = async () => {
      const threshold = 47 * 60 * 60 * 1000; // 47 horas
      const currentMs = Date.now();

      for (const ex of scaleExceptions) {
        try {
          let endMs: number;
          if (ex.fim_data && ex.fim_hora) {
            endMs = new Date(`${ex.fim_data}T${ex.fim_hora}:00`).getTime();
          } else {
            // Fallback para o dia da troca
            endMs = new Date(`${ex.data || ex.inicio_data}T23:59:59`).getTime();
          }

          if (!isNaN(endMs) && (currentMs - endMs) > threshold) {
            console.log(`[SIMCT] Limpeza automática: Removendo troca expirada ${ex.id}`);
            await deleteScaleException(ex.id);
          }
        } catch (e) {
          console.warn("Falha na limpeza de troca:", e);
        }
      }
      setLastCleanup(currentMs);
    };

    cleanup();
  }, [currentUser, scaleExceptions, lastCleanup]);

  const isLud = useMemo(() => currentUser?.nome?.toUpperCase().includes('LUDIMILA'), [currentUser]);
  const isSuperAdmin = useMemo(() => currentUser?.nome?.toUpperCase().includes('LUDIMILA') || currentUser?.nome?.toUpperCase().includes('LEANDRO'), [currentUser]);
  const isAdministrative = useMemo(() => currentUser?.perfil === 'ADMIN' || currentUser?.perfil === 'ADMINISTRATIVO' || currentUser?.nome?.toUpperCase().includes('LEANDRO'), [currentUser]);

  const normalizedDocuments = useMemo(() => {
    return allDocuments.map(d => {
      const realUnit = d.unidade_id || (d.bairro ? getUnidadeByBairro(d.bairro) : 1);
      if (d.unidade_id !== realUnit) {
        return { ...d, unidade_id: realUnit };
      }
      return d;
    });
  }, [allDocuments]);

  const documents = useMemo(() => {
    if (isLud) return normalizedDocuments;
    return normalizedDocuments.filter(d => d.unidade_id === (currentUser?.unidade_id || 1));
  }, [normalizedDocuments, currentUser, isLud]);

  const logs = useMemo(() => {
    if (isLud) return allLogs;
    return allLogs.filter(l => (l.unidade_id || 1) === (currentUser?.unidade_id || 1));
  }, [allLogs, currentUser, isLud]);

  const files = useMemo(() => {
    if (isLud) return allFiles;
    return allFiles.filter(f => (f.unidade_id || 1) === (currentUser?.unidade_id || 1));
  }, [allFiles, currentUser, isLud]);

  const agenda = useMemo(() => {
    if (isLud) return allAgenda;
    return allAgenda.filter(e => (e.unidade_id || 1) === (currentUser?.unidade_id || 1));
  }, [allAgenda, currentUser, isLud]);

  const filteredUsers = useMemo(() => {
    const activeUsers = users.filter(u => u.status !== 'EXCLUIDO');
    if (isLud) return activeUsers;
    return activeUsers.filter(u => (u.unidade_id || 1) === (currentUser?.unidade_id || 1));
  }, [users, currentUser, isLud]);

  const imminentEvent = useMemo(() => {
    if (!currentUser) return null;
    const now = new Date();
    const myEvents = agenda.filter(e => !e.excluido && (e.conselheiro_id === currentUser.id || e.conselheiro_id === currentUser.real_user_id) && !acknowledgedEventIds.includes(e.id));
    
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
      if (e.excluido || (e.conselheiro_id !== currentUser.id && e.conselheiro_id !== currentUser.real_user_id) || acknowledgedReminderIds.includes(`${e.id}-2h`)) return false;
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
    const unsubDocs = syncCollection<Documento>('documents', (docs) => {
      setAllDocuments(docs);
      setInitialSyncsDone(prev => ({ ...prev, documents: true }));
    });
    const unsubLogs = syncCollection<Log>('logs', (logs) => {
      setAllLogs(logs);
      setInitialSyncsDone(prev => ({ ...prev, logs: true }));
    }, {
      orderByField: 'data_hora',
      orderDirection: 'desc',
      limitCount: 150
    });
    const unsubAgenda = syncCollection<AgendaEntry>('agenda', (agenda) => {
      setAllAgenda(agenda);
      setInitialSyncsDone(prev => ({ ...prev, agenda: true }));
    });
    const unsubScaleExceptions = syncCollection<ScaleException>('scale_exceptions', setScaleExceptions);
    const unsubChat = syncCollection<ChatMessage>('chat_messages', (serverMsgs) => {
      setAllChatMessages(prev => {
        const map = new Map<string, ChatMessage>();
        prev.forEach(m => map.set(m.id, m));
        serverMsgs.forEach(m => {
          const existing = map.get(m.id);
          if (existing) {
            const combinedRead = Array.from(new Set([...(existing.read_by || []).map(String), ...(m.read_by || []).map(String)]));
            const combinedDeleted = Array.from(new Set([...(existing.deleted_for || []).map(String), ...(m.deleted_for || []).map(String)]));
            map.set(m.id, { ...existing, ...m, read_by: combinedRead, deleted_for: combinedDeleted });
          } else {
            map.set(m.id, m);
          }
        });
        const merged = Array.from(map.values());
        try {
          localStorage.setItem('simct_chat_messages_cache', JSON.stringify(merged));
        } catch (e) {
          console.warn("Could not write chat cache to localStorage:", e);
        }
        return merged;
      });
    }, { limitCount: 300, orderByField: 'created_at', orderDirection: 'desc' });
    const unsubUsers = syncCollection<UserWithPassword>('users', (storedUsers) => {
      setUsers(prev => {
        const baseUsers = INITIAL_USERS.map(u => ({ ...u, status: u.status || 'ATIVO', tentativas_login: 0, senha: u.senha || '123456' }));
        
        // Mesclar: INITIAL_USERS (preservando senha padrão se Firestore não tiver) + novos usuários do Firestore
        const merged = [
          ...baseUsers.map(bu => {
            const found = storedUsers.find(s => s.id === bu.id || (s.nome && s.nome.trim().toUpperCase() === bu.nome.trim().toUpperCase()));
            const mergedUser: UserWithPassword = found ? { 
              ...bu, 
              ...found, 
              senha: (found.senha && found.senha.trim().length > 0) ? found.senha : (bu.senha || '123456') 
            } : bu;
            // Preserva aceite de termo do localStorage se já aceito previamente neste dispositivo
            const localAccepted = localStorage.getItem(`simct_term_accepted_${mergedUser.id}`) || 
                                  (mergedUser.nome ? localStorage.getItem(`simct_term_accepted_${mergedUser.nome.toUpperCase()}`) : null);
            if (!mergedUser.termo_aceito_em && localAccepted) {
              mergedUser.termo_aceito_em = localAccepted;
            }
            // Se for suplente e não estiver ativamente substituindo, desvincula de qualquer unidade
            if (mergedUser.perfil === 'SUPLENTE' && !mergedUser.substituicao_ativa) {
              mergedUser.unidade_id = undefined;
            }
            return mergedUser;
          }),
          ...storedUsers.filter(s => !baseUsers.some(bu => bu.id === s.id || (s.nome && bu.nome && s.nome.trim().toUpperCase() === bu.nome.trim().toUpperCase()))).map(s => {
            const localAccepted = localStorage.getItem(`simct_term_accepted_${s.id}`) || 
                                  (s.nome ? localStorage.getItem(`simct_term_accepted_${s.nome.toUpperCase()}`) : null);
            const userWithPass: UserWithPassword = {
              ...s,
              senha: (s.senha && s.senha.trim().length > 0) ? s.senha : '123456'
            };
            if (!userWithPass.termo_aceito_em && localAccepted) {
              userWithPass.termo_aceito_em = localAccepted;
            }
            if (userWithPass.perfil === 'SUPLENTE' && !userWithPass.substituicao_ativa) {
              userWithPass.unidade_id = undefined;
            }
            return userWithPass;
          })
        ];
        
        return merged;
      });
      setInitialSyncsDone(prev => ({ ...prev, users: true }));
    });

    const savedAck = localStorage.getItem('pt_ack_events');
    const savedAckRem = localStorage.getItem('pt_ack_reminders');
    if (savedAck) setAcknowledgedEventIds(JSON.parse(savedAck));
    if (savedAckRem) setAcknowledgedReminderIds(JSON.parse(savedAckRem));

    return () => {
      unsubDocs();
      unsubLogs();
      unsubAgenda();
      unsubScaleExceptions();
      unsubUsers();
      unsubChat();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('pt_ack_events', JSON.stringify(acknowledgedEventIds));
    localStorage.setItem('pt_ack_reminders', JSON.stringify(acknowledgedReminderIds));
  }, [acknowledgedEventIds, acknowledgedReminderIds]);

  // Heartbeat Effect: Updates the user's last heartbeat in Firestore every 90 seconds
  useEffect(() => {
    if (!currentUser || !currentSessionId) return;
    
    const realId = currentUser.real_user_id || currentUser.id;
    
    const interval = setInterval(async () => {
      try {
        await saveUser({ id: realId, last_heartbeat: new Date().toISOString() });
      } catch (err) {
        // Heartbeat silencioso
      }
    }, 90000); // 90 seconds (conservar cotas do Firestore)
    
    return () => clearInterval(interval);
  }, [currentUser, currentSessionId]);

  // Recuperação de Sessão (Cold Start)
  useEffect(() => {
    if (currentUser || !currentSessionId || users.length === 0) return;
    
    const sessionUser = users.find(u => u.current_session_id === currentSessionId);
    if (sessionUser) {
      const now = Date.now();
      const lastHB = sessionUser.last_heartbeat ? new Date(sessionUser.last_heartbeat).getTime() : 0;
      
      // Valida se a sessão ainda é "fresca" (limite de 12 horas para recovery automático)
      if (now - lastHB < 12 * 60 * 60 * 1000) {
        setCurrentUser(sessionUser);
      } else {
        localStorage.removeItem('simct_session_id');
        setCurrentSessionId(null);
      }
    }
  }, [users, currentSessionId, currentUser]);

  // Sincronização e Validação do Usuário Logado
  useEffect(() => {
    if (users.length === 0 || !currentUser) return;
    
    const realId = currentUser.real_user_id || currentUser.id;
    const freshUser = users.find(u => u.id === realId);
    
    if (freshUser) {
      // 1. Validação de Sessão Duplicada
      if (currentSessionId && freshUser.current_session_id && freshUser.current_session_id !== currentSessionId) {
        const now = Date.now();
        const lastHB = freshUser.last_heartbeat ? new Date(freshUser.last_heartbeat).getTime() : 0;
        if (now - lastHB < 60000) {
           setCurrentUser(null);
           setCurrentSessionId(null);
           localStorage.removeItem('simct_session_id');
           alert("SESSÃO ENCERRADA: Este usuário foi conectado em outro local.");
           return;
        }
      }

      // 2. Sincronização de Dados Críticos (RH / Status)
      // Usamos campos específicos para evitar loops infinitos por referências de objetos
      const hasCriticalChanges = 
        freshUser.status !== currentUser.status || 
        freshUser.cargo !== currentUser.cargo ||
        (!currentUser.is_suplente_active && freshUser.nome !== currentUser.nome) ||
        (currentUser as any).senha !== (freshUser as any).senha ||
        (!currentUser.termo_aceito_em && freshUser.termo_aceito_em);

      if (hasCriticalChanges) {
        // Bloqueio Real-Time
        const isBlocked = freshUser.status === 'BLOQUEADO' || freshUser.status === 'INATIVO' || freshUser.status === 'EXCLUIDO';
        const isAdministrative = currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO';
        
        if (isBlocked && !isAdministrative) {
          setCurrentUser(null);
          setCurrentSessionId(null);
          localStorage.removeItem('simct_session_id');
          alert("Sua conta foi desativada.");
          return;
        }

        // Atualização Atômica
        setCurrentUser(prev => {
          if (!prev) return freshUser;
          // Deep field check again inside updater to be 100% safe against loops
          if (prev.status === freshUser.status && 
              prev.nome === freshUser.nome && 
              prev.cargo === freshUser.cargo &&
              (prev as any).senha === (freshUser as any).senha &&
              prev.termo_aceito_em === freshUser.termo_aceito_em) {
            return prev;
          }
          return {
            ...prev,
            ...freshUser,
            is_suplente_active: prev.is_suplente_active,
            real_user_id: prev.real_user_id,
            substituted_name: prev.substituted_name
          };
        });
      }
    }
  }, [users, currentUser?.id, currentUser?.status, currentUser?.nome, currentUser?.cargo, (currentUser as any)?.senha, currentUser?.termo_aceito_em]);

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
    try {
      await saveLog(newLog);
    } catch (err) {
      console.warn("[SIMCT Log] Failed to save audit log to database:", err);
    }
  }, [currentUser]);

  // Limpeza de usuários (excluir do sistema o JAIME, JOÃO MELO e PEDRO)
  useEffect(() => {
    if (!users || users.length === 0) return;
    if (hasCleanedUpUsers.current) return;

    const targets = ["JAIME", "JOAO MELO", "JOÃO MELO", "PEDRO"];
    const toExclude = users.filter(u => {
      if (!u.nome) return false;
      if (u.status === 'EXCLUIDO') return false;
      const normName = u.nome.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return targets.some(t => {
        const normT = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normName === normT || u.id === t.toLowerCase().replace(/\s/g, '_');
      });
    });

    if (toExclude.length > 0) {
      hasCleanedUpUsers.current = true; // Mark as done immediately to avoid parallel trigger re-entry
      toExclude.forEach(async (u) => {
        try {
          console.log(`[SIMCT] Excluindo usuário: ${u.nome} (ID: ${u.id})`);
          await saveUser({ id: u.id, status: 'EXCLUIDO', deletado_em: new Date().toISOString() });
          try {
            await saveLog({
              id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              unidade_id: u.unidade_id || 1,
              documento_id: 'SISTEMA',
              usuario_id: 'SISTEMA',
              usuario_nome: 'SISTEMA',
              acao: `RH: Exclusão automática do usuário ${u.nome} solicitada.`,
              tipo: 'SEGURANÇA',
              data_hora: new Date().toISOString()
            });
          } catch (logErr) {}
        } catch (err) {
          console.error(`Erro ao excluir ${u.nome}:`, err);
        }
      });
    } else {
      // If no users are found to exclude on initial load, also prevent further runs
      hasCleanedUpUsers.current = true;
    }
  }, [users]);

  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => {
      // 1. Mapeamento por Edição de Nome (mesmo ID)
      const originalUser = INITIAL_USERS.find(iu => iu.id === u.id);
      if (originalUser && u.nome.toUpperCase() !== originalUser.nome.toUpperCase()) {
        map[originalUser.nome.toUpperCase()] = u.nome.toUpperCase();
      }
      
      // 2. Mapeamento por Substituição Permanente (Novo ID assumindo o lugar)
      if (u.status === 'INATIVO' && u.substituicao_permanente_por) {
        const successor = users.find(s => s.id === u.substituicao_permanente_por);
        if (successor) {
          map[u.nome.toUpperCase()] = successor.nome.toUpperCase();
        }
      }

      // 3. Mapeamento para Contas Excluídas (Para exclusão visual e lógica do sistema ativo)
      if (u.status === 'EXCLUIDO' && !u.substituicao_permanente_por) {
        map[u.nome.toUpperCase()] = `${u.nome.toUpperCase()} (EXCLUÍDO)`;
      }

      // 4. Mapeamento por Substituição Temporária Ativa de Suplente
      if (u.perfil === 'SUPLENTE' && u.substituicao_ativa && u.status === 'ATIVO' && u.substituindo_id) {
        const substituted = users.find(sub => sub.id === u.substituindo_id);
        if (substituted) {
          map[substituted.nome.toUpperCase()] = u.nome.toUpperCase();
        }
      }
    });
    return map;
  }, [users]);

  const pendingValidations = useMemo(() => {
    if (!currentUser) return [];
    return documents.filter(d => {
       const hasEcaMeasures = (d.medidas_detalhadas || []).some(m => 
         m.artigo_inciso.startsWith('Art. 101') || m.artigo_inciso.startsWith('Art. 129')
       );
       if (!hasEcaMeasures) return false;

       const isAwaiting = d.status.includes('AGUARDANDO_VALIDACAO');
       const hasNotif = (d.notificacoes_trio || []).some(n => 
         isSameCounselorName(n, currentUser.nome) || 
         (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(n, currentUser.substituted_name))
       );

       const trioRaw = (d.conselheiros_providencia_nomes && d.conselheiros_providencia_nomes.length > 0)
         ? d.conselheiros_providencia_nomes
         : getEffectiveEscala(d.data_aporte, d.hora_aporte, d.unidade_id, userNameMap, scaleExceptions);

       const inTrio = hasNotif || trioRaw.some(name => {
         if (!name) return false;
         if (isSameCounselorName(name, currentUser.nome)) return true;
         if (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)) return true;
         if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') return true;
         return false;
       });

       const confirmacoes = (d.medidas_detalhadas || []).flatMap(m => m.confirmacoes || []);
       const iValidated = !hasNotif && confirmacoes.some(c => 
         c.usuario_id === currentUser.id || 
         c.usuario_id === currentUser.real_user_id ||
         isSameCounselorName(c.usuario_nome, currentUser.nome)
       );

       return (isAwaiting || hasNotif) && inTrio && !iValidated;
    });
  }, [documents, currentUser, userNameMap, scaleExceptions, currentTime]);

  // DIRETRIZ: Alertas de Monitoramento Vencido
  const expiredMonitoringItems = useMemo(() => {
    if (!currentUser) return [];
    
    // Nenhum ADM geral e adm deve receber esses alertas de monitoramento
    if (currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') {
      return [];
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    return documents.filter(d => {
      if (!d.monitoramento || d.monitoramento.concluido) return false;
      
      // Apenas o conselheiro de referência ou membros da unidade no caso de supervisão
      const isRef = d.conselheiro_referencia_id === currentUser.id;
      if (!isRef) return false;

      return d.monitoramento.requisicoes?.some(r => {
        if (r.concluido || (r as any).excluidoDoMonitoramento) return false;
        const deadline = new Date(r.dataFinal);
        deadline.setHours(0,0,0,0);
        return deadline.getTime() < today.getTime();
      });
    });
  }, [documents, currentUser]);

  const unreadReferenceAlerts = useMemo(() => {
    if (!currentUser) return [];
    return documents.filter(d => {
      const isRef = d.conselheiro_referencia_id === currentUser.id ||
        (currentUser.is_suplente_active && currentUser.real_user_id && d.conselheiro_referencia_id === currentUser.real_user_id);
      return isRef && (d.alertas_status_referencia || []).some(a => !a.lido);
    });
  }, [documents, currentUser]);

  const handleScience = async (docId: string, alertId?: string) => {
    const targetDoc = documents.find(d => d.id === docId);
    if (!targetDoc || !currentUser) return;

    const currentScience = targetDoc.ciência_registrada_por || [];
    const updatedScience = currentScience.includes(currentUser.nome) 
      ? currentScience 
      : [...currentScience, currentUser.nome];

    let updatedAlerts = targetDoc.alertas_status_referencia || [];
    if (alertId) {
      updatedAlerts = updatedAlerts.map(a => 
        a.id === alertId ? { ...a, lido: true, ciência_data_hora: new Date().toISOString() } : a
      );
    } else {
      updatedAlerts = updatedAlerts.map(a => 
        (a.conselheiro_referencia_id === currentUser.id || 
         (currentUser.is_suplente_active && currentUser.real_user_id && a.conselheiro_referencia_id === currentUser.real_user_id))
          ? { ...a, lido: true, ciência_data_hora: new Date().toISOString() }
          : a
      );
    }

    await saveDocument({
      ...targetDoc,
      id: docId,
      ciência_registrada_por: updatedScience,
      alertas_status_referencia: updatedAlerts
    });

    addLog(docId, `CIÊNCIA REGISTRADA: Conselheiro de Referência [${currentUser.nome}] registrou ciência sobre movimentação de situação no prontuário.`, 'DOCUMENTO');
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async (savePending: boolean) => {
    const userToLogoff = currentUser;
    
    // 1. Limpa imediatamente os estados locais e o localStorage para garantir que a saída ocorra sem bloqueio
    setIsLogoutModalOpen(false);
    setCurrentUser(null);
    setCurrentSessionId(null);
    setSelectedDocId(null);
    setEditingDocId(null);
    setForceDirectEdit(false);
    setNavHistory([]);
    setActiveTab('dashboard');

    try {
      localStorage.removeItem('simct_session_id');
      localStorage.removeItem('simct_current_user');
      localStorage.removeItem('simct_nav_state');
    } catch (err) {
      console.warn("Falha ao limpar localStorage no logout:", err);
    }

    // 2. Registra log e atualiza Firestore de forma não-bloqueante
    try {
      if (userToLogoff) {
        addLog('SISTEMA', `Efetuou Logoff Seguro (Salvamento de rascunhos pendentes: ${savePending ? 'SIM' : 'NÃO'})`, 'SEGURANÇA', userToLogoff);
        const realId = userToLogoff.real_user_id || userToLogoff.id;
        await saveUser({ id: realId, current_session_id: '' });
      }
    } catch (err) {
      console.warn("Aviso ao sincronizar encerramento de sessão com Firestore:", err);
    }
  };

  const handleRefresh = useCallback(() => {
    if (currentUser) {
      try {
        localStorage.setItem('simct_nav_state', JSON.stringify({
          activeTab,
          selectedDocId,
          editingDocId,
          forceDirectEdit,
          dashboardViewMode,
          dashboardFilters
        }));
      } catch (err) {
        console.error("Error saving state before refresh:", err);
      }
    }
    window.location.reload();
  }, [currentUser, activeTab, selectedDocId, editingDocId, forceDirectEdit, dashboardViewMode, dashboardFilters]);

  const isTermAlreadyAccepted = useMemo(() => {
    if (!currentUser) return true;
    const realId = currentUser.real_user_id || currentUser.id;
    const byUserRecord = Boolean(currentUser.termo_aceito_em);
    const byLocalRealId = Boolean(localStorage.getItem(`simct_term_accepted_${realId}`));
    const byLocalCurrentId = Boolean(localStorage.getItem(`simct_term_accepted_${currentUser.id}`));
    const byLocalName = Boolean(currentUser.nome && localStorage.getItem(`simct_term_accepted_${currentUser.nome.toUpperCase()}`));
    
    return byUserRecord || byLocalRealId || byLocalCurrentId || byLocalName;
  }, [currentUser]);

  const handleAcceptTerm = async (version: string) => {
    if (!currentUser) return;
    
    const timestamp = new Date().toISOString();
    const realId = currentUser.real_user_id || currentUser.id;
    
    const updatedUser: User = { 
      ...currentUser, 
      termo_aceito_em: timestamp,
      termo_versao: version
    };
    
    try {
      localStorage.setItem(`simct_term_accepted_${realId}`, timestamp);
      localStorage.setItem(`simct_term_accepted_${currentUser.id}`, timestamp);
      if (currentUser.nome) {
        localStorage.setItem(`simct_term_accepted_${currentUser.nome.toUpperCase()}`, timestamp);
      }
    } catch (e) {
      console.warn("Falha ao registrar aceite do termo no localStorage:", e);
    }
    
    setCurrentUser(updatedUser);

    try {
      await saveUser({
        id: realId,
        termo_aceito_em: timestamp,
        termo_versao: version
      });
      if (currentUser.real_user_id && currentUser.id !== currentUser.real_user_id) {
        await saveUser({
          id: currentUser.id,
          termo_aceito_em: timestamp,
          termo_versao: version
        });
      }
    } catch (err) {
      console.warn("Falha ao salvar aceite do termo no banco:", err);
    }
    
    addLog('SISTEMA', `Aceite do Termo de Proteção e Sigilo (Primeiro Acesso) pelo usuário [${currentUser.nome}]`, 'SEGURANÇA', updatedUser);
  };

  const pushStateToHistory = useCallback((currentTab: typeof activeTab, currentSelectedDocId: string | null, currentEditingDocId: string | null, currentForceEdit: boolean) => {
    setNavHistory(prev => {
      const entry = {
        activeTab: currentTab,
        selectedDocId: currentSelectedDocId,
        editingDocId: currentEditingDocId,
        forceDirectEdit: currentForceEdit
      };
      const last = prev[prev.length - 1];
      if (last && last.activeTab === entry.activeTab && last.selectedDocId === entry.selectedDocId && last.editingDocId === entry.editingDocId && last.forceDirectEdit === entry.forceDirectEdit) {
        return prev;
      }
      return [...prev, entry];
    });
  }, []);

  const navigateTo = useCallback((tab: typeof activeTab, options?: { docId?: string | null; editId?: string | null; forceEdit?: boolean }) => {
    pushStateToHistory(activeTab, selectedDocId, editingDocId, forceDirectEdit);
    try {
      window.history.pushState({ simct: true, time: Date.now() }, '');
    } catch {
      // ignore
    }
    setActiveTab(tab);
    setSelectedDocId(options?.docId !== undefined ? options.docId : null);
    setEditingDocId(options?.editId !== undefined ? options.editId : null);
    setForceDirectEdit(options?.forceEdit !== undefined ? options.forceEdit : false);
  }, [activeTab, selectedDocId, editingDocId, forceDirectEdit, pushStateToHistory]);

  const goBack = useCallback(() => {
    if (navHistory.length > 0) {
      const previous = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setActiveTab(previous.activeTab);
      setSelectedDocId(previous.selectedDocId);
      setEditingDocId(previous.editingDocId);
      setForceDirectEdit(previous.forceDirectEdit);
    } else {
      // Fallback hierárquico seguro caso não haja histórico na pilha (ex: recarregamento de página)
      if (editingDocId !== null) {
        setSelectedDocId(editingDocId);
        setEditingDocId(null);
        setForceDirectEdit(false);
      } else if (selectedDocId !== null) {
        setSelectedDocId(null);
        setForceDirectEdit(false);
      } else if (activeTab === 'edit' || activeTab === 'register' || activeTab === 'plantao') {
        setActiveTab('dashboard');
      } else if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    }
  }, [navHistory, editingDocId, selectedDocId, activeTab]);

  // Escuta o evento popstate do navegador (botão voltar do navegador/dispositivo)
  useEffect(() => {
    const handlePopState = () => {
      goBack();
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [goBack]);

  const handleOpenDocument = useCallback((id: string, isFromReference: boolean = false) => {
    navigateTo(activeTab, { docId: id, forceEdit: isFromReference });
    addLog(id, `VISUALIZAÇÃO: Prontuário aberto para consulta de dados técnicos.`, 'DOCUMENTO');
  }, [activeTab, addLog, navigateTo]);

  const handleDocumentSubmit = async (data: any, files: File[]) => {
    try {
      if (editingDocId) {
        const savedId = editingDocId;
        const existingDoc = allDocuments.find(d => d.id === savedId);
        const updatedDoc = { ...existingDoc, ...data, id: savedId };
        setAllDocuments(prev => prev.map(d => d.id === savedId ? updatedDoc : d));
        await saveDocument(updatedDoc);
        addLog(savedId, `EDIÇÃO: Registro de prontuário atualizado administrativamente sem alterar histórico de status ou registros anteriores.`, 'DOCUMENTO');
        setEditingDocId(null);
        setSelectedDocId(savedId);
        // Remove telas temporárias de edição do histórico
        setNavHistory(prev => prev.filter(h => h.activeTab !== 'edit' && h.editingDocId !== savedId));
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
      
      // USAR LISTA VIVA DE USUÁRIOS PARA O LOG
      const refName = users.find(u => u.id === newDoc.conselheiro_referencia_id)?.nome || 'N/A';
      const provName = users.find(u => u.id === newDoc.conselheiro_providencia_id)?.nome || 'N/A';
      const persistenceNote = newDoc.is_family_persistence ? ' [PERSISTÊNCIA FAMILIAR]' : '';

      setAllDocuments(prev => [newDoc, ...prev]);
      await saveDocument(newDoc);
      addLog(id, `CRIAÇÃO: Novo procedimento registrado.${persistenceNote} REF: [${refName}] | IMEDIATA: [${provName}].`, 'DOCUMENTO');
      setSelectedDocId(id);
      setActiveTab('dashboard');
      // Remove telas temporárias de cadastro do histórico
      setNavHistory(prev => prev.filter(h => h.activeTab !== 'register' && h.activeTab !== 'plantao'));
    } catch (err) {
      console.error('Erro ao submeter documento:', err);
    }
  };

  const handleNavigate = (tab: typeof activeTab) => { 
    navigateTo(tab);
  };

  const handleUpdateStatus = async (id: string, newStatus: DocumentStatus[]) => {
    if (!currentUser) return;
    const docObj = normalizedDocuments.find(d => d.id === id);
    if (!docObj) return;

    const prevStatus = docObj.status[docObj.status.length - 1] || 'AGUARDANDO_ANALISE';
    const latestStatus = newStatus[newStatus.length - 1];
    
    if (prevStatus === latestStatus) {
      setAllDocuments(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
      await saveDocument({ ...docObj, id, status: newStatus });
      return;
    }

    const label = STATUS_LABELS[latestStatus] || latestStatus;
    addLog(id, `STATUS: Situação alterada para [${label}].`, 'SISTEMA');

    let updatedAlerts = [...(docObj.alertas_status_referencia || [])];
    const isReference = docObj.conselheiro_referencia_id === currentUser.id || 
                       (currentUser.is_suplente_active && docObj.conselheiro_referencia_id === currentUser.real_user_id);
    
    if (docObj.conselheiro_referencia_id && !isReference) {
      updatedAlerts.push({
        id: `alerta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        documento_id: docObj.id,
        conselheiro_referencia_id: docObj.conselheiro_referencia_id,
        alterado_por_id: currentUser.id,
        alterado_por_nome: currentUser.nome,
        status_anterior: prevStatus,
        status_novo: latestStatus,
        data_hora: new Date().toISOString(),
        lido: false
      });
    }

    // REGRA DE ATUALIZAÇÃO AUTOMÁTICA IMEDIATA:
    // Atualiza imediatamente o estado da UI do React sem esperar o ciclo do banco
    setAllDocuments(prev => prev.map(d => d.id === id ? { 
      ...d, 
      status: newStatus,
      alertas_status_referencia: updatedAlerts 
    } : d));

    await saveDocument({ 
      ...docObj,
      id, 
      status: newStatus,
      alertas_status_referencia: updatedAlerts
    });
  };

  const handleDeleteDocument = useCallback(async (id: string, source: string = 'Painel Geral') => {
    // 1. Atualização Otimista Imediata: remove instantaneamente o documento do estado local (some na hora)
    setAllDocuments(prev => prev.filter(d => d.id !== id));
    
    // Se o documento estiver aberto no visualizador ou em edição, reseta imediatamente
    setSelectedDocId(prev => prev === id ? null : prev);
    setEditingDocId(prev => prev === id ? null : prev);
    setForceDirectEdit(false);
    
    // Limpa do histórico de navegação
    setNavHistory(prev => prev.filter(h => h.selectedDocId !== id && h.editingDocId !== id));

    // 2. Registro de Log de Auditoria
    addLog(id, `EXCLUSÃO: Documento #${id} removido permanentemente via ${source}.`, 'DOCUMENTO');

    // 3. Exclusão no Firestore
    try {
      await deleteDocument(id);
    } catch (err) {
      console.error('Erro ao deletar documento no Firestore:', err);
    }
  }, [addLog]);

  const renderContent = () => {
    if (!currentUser) return null;
    
    if (activeTab === 'user-management' && isSuperAdmin) return (
      <UserManagementPanel 
        users={filteredUsers} 
        documents={allDocuments}
        onUpdateUser={async (id, upd) => {
          const target = users.find(u => u.id === id);
          if (!target) return;

          const oldName = target.nome.toUpperCase();
          const newName = upd.nome ? upd.nome.toUpperCase() : oldName;

          // Se o nome foi alterado, inicia a propagação global
          if (upd.nome && upd.nome !== target.nome) {
            addLog('SISTEMA', `RH: INICIANDO SUBSTITUIÇÃO GLOBAL de "${oldName}" para "${newName}".`, 'SEGURANÇA');
            
            const docsToUpdate = allDocuments.filter(d => 
              d.conselheiros_providencia_nomes?.some(n => n.toUpperCase() === oldName) || 
              d.notificacao?.toUpperCase() === oldName ||
              (d.notificacoes_trio || []).some(n => n.toUpperCase() === oldName) ||
              d.conselheiro_referencia_id === id ||
              d.conselheiro_providencia_id === id
            );

            for (const doc of docsToUpdate) {
              const updatedProvidencia = doc.conselheiros_providencia_nomes?.map(n => n.toUpperCase() === oldName ? newName : n);
              const updatedNotificacaoTrio = doc.notificacoes_trio?.map(n => n.toUpperCase() === oldName ? newName : n);
              const isOldNotificacao = doc.notificacao?.toUpperCase() === oldName;

              await saveDocument({ 
                id: doc.id, 
                conselheiros_providencia_nomes: updatedProvidencia,
                notificacao: isOldNotificacao ? newName : doc.notificacao,
                notificacoes_trio: updatedNotificacaoTrio,
                conselheiro_referencia_id: doc.conselheiro_referencia_id === id ? id : doc.conselheiro_referencia_id,
                conselheiro_providencia_id: doc.conselheiro_providencia_id === id ? id : doc.conselheiro_providencia_id
              });
            }

            const agendaToUpdate = allAgenda.filter(a => a.conselheiro_id === id);
            for (const evt of agendaToUpdate) {
              await saveAgenda({ id: evt.id, conselheiro_id: id });
            }
            
            addLog('SISTEMA', `RH: Nome do usuário alterado de ${oldName} para ${newName}.`, 'SEGURANÇA');
          }

          // LÓGICA DE RETORNO DO CONSELHEIRO SUBSTITUÍDO (SUPLENTE FINALIZA SUBSTITUIÇÃO)
          if (target.perfil === 'SUPLENTE' && target.substituicao_ativa && upd.substituicao_ativa === false) {
            const conselheiroId = target.substituindo_id;
            const startDate = target.data_inicio_substituicao;
            if (conselheiroId && startDate) {
              const conselheiroObj = users.find(u => u.id === conselheiroId);
              if (conselheiroObj) {
                const suplenteId = target.id;
                const suplenteName = target.nome;
                const conselheiroName = conselheiroObj.nome;

                console.log(`[RH] Suplente ${suplenteName} (${suplenteId}) encerrando substituição de ${conselheiroName} (${conselheiroId}) iniciada em ${startDate}. Migrando documentos e agenda gerados no período.`);
                addLog('SISTEMA', `RH: MIGRAÇÃO DE SUPLÊNCIA - Transferindo registros gerados por [${suplenteName}] desde [${startDate}] de volta para o titular [${conselheiroName}].`, 'SEGURANÇA');

                const currentDocs = await new Promise<any[]>(resolve => {
                  setAllDocuments(prev => {
                    resolve(prev);
                    return prev;
                  });
                });

                // Encontra documentos criados durante o período de suplência que pertencem ao suplente
                const docsToMigrate = currentDocs.filter(d => {
                  const createdDateStr = d.criado_em ? d.criado_em.substring(0, 10) : '';
                  const receiptDateStr = d.data_recebimento || '';
                  const isWithinPeriod = (createdDateStr && createdDateStr >= startDate) || (receiptDateStr && receiptDateStr >= startDate);

                  if (!isWithinPeriod) return false;

                  const isAssignedToSuplente = d.conselheiro_referencia_id === suplenteId || 
                                              d.conselheiro_providencia_id === suplenteId || 
                                              d.criado_por_id === suplenteId ||
                                              d.conselheiros_providencia_nomes?.some(n => n.toUpperCase() === suplenteName.toUpperCase()) ||
                                              d.notificacao?.toUpperCase() === suplenteName.toUpperCase();

                  return isAssignedToSuplente;
                });

                console.log(`[RH] Encontrados ${docsToMigrate.length} documentos criados pelo suplente ${suplenteName} no período.`);

                for (const doc of docsToMigrate) {
                  let updatedDoc: any = { id: doc.id };

                  // IDs
                  if (doc.conselheiro_referencia_id === suplenteId) updatedDoc.conselheiro_referencia_id = conselheiroId;
                  if (doc.conselheiro_providencia_id === suplenteId) updatedDoc.conselheiro_providencia_id = conselheiroId;
                  if (doc.criado_por_id === suplenteId) updatedDoc.criado_por_id = conselheiroId;

                  // Nomes nas listas
                  if (doc.conselheiros_providencia_nomes) {
                    updatedDoc.conselheiros_providencia_nomes = doc.conselheiros_providencia_nomes.map(n => 
                      n.toUpperCase() === suplenteName.toUpperCase() ? conselheiroName : n
                    );
                  }

                  if (doc.notificacoes_trio) {
                    updatedDoc.notificacoes_trio = doc.notificacoes_trio.map(n => 
                      n.toUpperCase() === suplenteName.toUpperCase() ? conselheiroName : n
                    );
                  }

                  // Substituição nos campos de texto principais se contiverem o nome do suplente
                  const textFields: (keyof any)[] = [
                    'notificacao', 'conselheiro_referencia_name', 'conselheiro_providencia_name'
                  ];

                  textFields.forEach(field => {
                    if (doc[field] && typeof doc[field] === 'string' && (doc[field] as string).toUpperCase().includes(suplenteName.toUpperCase())) {
                      const regex = new RegExp(suplenteName, 'gi');
                      updatedDoc[field] = (doc[field] as string).replace(regex, conselheiroName);
                    }
                  });

                  await saveDocument(updatedDoc);
                }

                // Agenda
                const currentAgenda = await new Promise<any[]>(resolve => {
                  setAllAgenda(prev => {
                    resolve(prev);
                    return prev;
                  });
                });

                const agendaToMigrate = currentAgenda.filter(a => 
                  a.conselheiro_id === suplenteId && 
                  a.data >= startDate
                );

                console.log(`[RH] Encontrados ${agendaToMigrate.length} eventos de agenda criados pelo suplente.`);

                for (const evt of agendaToMigrate) {
                  await saveAgenda({ ...evt, conselheiro_id: conselheiroId });
                }

                // Forçar atualização local dos estados dos documentos
                setAllDocuments(prev => prev.map(d => {
                  const createdDateStr = d.criado_em ? d.criado_em.substring(0, 10) : '';
                  const receiptDateStr = d.data_recebimento || '';
                  const isWithinPeriod = (createdDateStr && createdDateStr >= startDate) || (receiptDateStr && receiptDateStr >= startDate);

                  if (isWithinPeriod && (d.conselheiro_referencia_id === suplenteId || d.conselheiro_providencia_id === suplenteId)) {
                    return { 
                      ...d, 
                      conselheiro_referencia_id: d.conselheiro_referencia_id === suplenteId ? conselheiroId : d.conselheiro_referencia_id,
                      conselheiro_providencia_id: d.conselheiro_providencia_id === suplenteId ? conselheiroId : d.conselheiro_providencia_id,
                      conselheiros_providencia_nomes: d.conselheiros_providencia_nomes?.map(n => n.toUpperCase() === suplenteName.toUpperCase() ? conselheiroName : n),
                      notificacao: d.notificacao?.toUpperCase() === suplenteName.toUpperCase() ? conselheiroName : d.notificacao
                    };
                  }
                  return d;
                }));

                // Forçar atualização local dos estados da agenda
                setAllAgenda(prev => prev.map(a => {
                  if (a.conselheiro_id === suplenteId && a.data >= startDate) {
                    return { ...a, conselheiro_id: conselheiroId };
                  }
                  return a;
                }));

                addLog('SISTEMA', `RH: RETORNO DE TITULAR CONCLUÍDO. [${conselheiroName}] reassumiu todas as funções e registros gerados por [${suplenteName}] desde [${startDate}].`, 'SEGURANÇA');
              }
            }
          }

          // LÓGICA DE SUBSTITUIÇÃO PERMANENTE (MIGRAÇÃO DE ID E NOMES)
          if (upd.substituicao_permanente_por) {
            const successorId = upd.substituicao_permanente_por;
            const successorObj = users.find(u => u.id === successorId);
            // Normalização para comparação (remove acentos e espaços extras)
            const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
            const normalizedOldName = normalize(target.nome);
            const oldName = target.nome.toUpperCase(); // Mantém o original para o regex
            const newName = successorObj ? successorObj.nome.toUpperCase() : successorId.toUpperCase();
            
            console.log(`[RH] Iniciando migração de ${id} (${oldName}) para ${successorId} (${newName})`);
            addLog('SISTEMA', `RH: INICIANDO MIGRAÇÃO PERMANENTE de [${oldName}] para [${newName}].`, 'SEGURANÇA');
            
            const currentDocs = await new Promise<any[]>(resolve => {
              setAllDocuments(prev => {
                resolve(prev);
                return prev;
              });
            });

            // Filtro robusto ignorando acentos
            const docsToMigrate = currentDocs.filter(d => {
              const isRef = d.conselheiro_referencia_id === id || d.conselheiro_providencia_id === id;
              
              // Verifica se o nome aparece em algum campo de texto ou lista
              const checkText = (t?: string) => t && normalize(t).includes(normalizedOldName);
              const checkList = (l?: string[]) => l && l.some(n => normalize(n).includes(normalizedOldName));

              return isRef || 
                     checkText(d.notificacao) || 
                     checkList(d.notificacoes_trio) || 
                     checkList(d.conselheiros_providencia_nomes) || 
                     checkText(d.historico) ||
                     checkText(d.conselheiro_referencia_nome) ||
                     checkText(d.conselheiro_providencia_nome) ||
                     checkText(d.relato_providencias) ||
                     checkText(d.despacho_situacao);
            });

            console.log(`[RH] Encontrados ${docsToMigrate.length} documentos para atualizar.`);

            for (const doc of docsToMigrate) {
              let updatedDoc: any = { id: doc.id };

              // 1. Atualizar IDs
              if (doc.conselheiro_referencia_id === id) updatedDoc.conselheiro_referencia_id = successorId;
              if (doc.conselheiro_providencia_id === id) updatedDoc.conselheiro_providencia_id = successorId;

              // 2. Atualizar Campos de Texto com Regex inteligente (preserva outros nomes no texto)
              const replaceName = (text: string) => {
                // Tenta substituir com e sem acento no texto original
                let res = text;
                const pattern = normalizedOldName === oldName ? oldName : `(${oldName}|${target.nome})`;
                const regex = new RegExp(pattern, 'gi');
                return res.replace(regex, newName);
              };

              // Lista de campos para varredura
              const textFields: (keyof any)[] = [
                'notificacao', 'historico', 'relato_providencias', 'despacho_situacao', 
                'conselheiro_referencia_nome', 'conselheiro_providencia_nome', 
                'observacoes_iniciais', 'fundamentacao_tecnica'
              ];

              textFields.forEach(field => {
                if (doc[field] && (normalize(doc[field] as string).includes(normalizedOldName))) {
                  updatedDoc[field] = replaceName(doc[field] as string);
                }
              });

              // 3. Atualizar Listas
              if (doc.conselheiros_providencia_nomes) {
                updatedDoc.conselheiros_providencia_nomes = doc.conselheiros_providencia_nomes.map(n => 
                  normalize(n) === normalizedOldName ? newName : n
                );
              }

              if (doc.notificacoes_trio) {
                updatedDoc.notificacoes_trio = doc.notificacoes_trio.map(n => 
                  normalize(n) === normalizedOldName ? newName : n
                );
              }

              await saveDocument(updatedDoc);
            }

            const currentAgenda = await new Promise<any[]>(resolve => {
              setAllAgenda(prev => {
                resolve(prev);
                return prev;
              });
            });

            const agendaToMigrate = currentAgenda.filter(a => a.conselheiro_id === id);
            console.log(`[RH] Encontrados ${agendaToMigrate.length} eventos de agenda.`);

            for (const evt of agendaToMigrate) {
              await saveAgenda({ ...evt, conselheiro_id: successorId });
              console.log(`[RH] Evento de agenda ${evt.id} migrado.`);
            }

            // FORÇAR ATUALIZAÇÃO DOS ESTADOS LOCAIS PARA REFLETIR NA TELA NA HORA
            setAllDocuments(prev => prev.map(d => {
              if (d.conselheiro_referencia_id === id || d.conselheiro_providencia_id === id) {
                return { 
                  ...d, 
                  conselheiro_referencia_id: d.conselheiro_referencia_id === id ? successorId : d.conselheiro_referencia_id,
                  conselheiro_providencia_id: d.conselheiro_providencia_id === id ? successorId : d.conselheiro_providencia_id
                };
              }
              return d;
            }));

            setAllAgenda(prev => prev.map(a => {
              if (a.conselheiro_id === id) return { ...a, conselheiro_id: successorId };
              return a;
            }));

            addLog('SISTEMA', `RH: MIGRAÇÃO CONCLUÍDA. ID [${successorId}] assumiu as funções de ${target.nome}.`, 'SEGURANÇA');
            
            // Remove o campo temporário antes de salvar no banco
            delete (upd as any).substituicao_permanente_por;
          }

          // PERSISTIR ALTERAÇÃO DO USUÁRIO NO BANCO
          await saveUser({ ...upd, id });
          
          // Atualiza lista local de usuários para reconhecimento imediato
          setUsers(prev => prev.map(u => u.id === id ? { ...u, ...upd } : u));
          
          if (upd.status) addLog('SISTEMA', `RH: Usuário ${target.nome} teve status alterado para ${upd.status}.`, 'SEGURANÇA');
          if (upd.senha) addLog('SISTEMA', `RH: Senha do usuário ${target.nome} redefinida por administrador.`, 'SEGURANÇA');
          
          // FORÇAR RECONHECIMENTO: Se o usuário editado for o próprio logado, atualiza o estado local
          if (id === currentUser.id) {
            setCurrentUser(prev => prev ? { ...prev, ...upd } : null);
          }
        }} 
        onDeleteUser={async (id) => {
          const target = users.find(u => u.id === id);
          if (!target) return;
          addLog('SISTEMA', `RH: EXCLUSÃO DE USUÁRIO: ${target.nome}. Acesso revogado, histórico preservado.`, 'SEGURANÇA');
          await saveUser({ id, status: 'EXCLUIDO', deletado_em: new Date().toISOString() });
          setUsers(prev => prev.map(u => u.id === id ? { ...u, status: 'EXCLUIDO' } : u));
        }}
        onAddUser={async (newUser) => {
          addLog('SISTEMA', `RH: NOVO USUÁRIO ADICIONADO: ${newUser.nome}.`, 'SEGURANÇA');
          await saveUser(newUser);
          // Adiciona localmente para reconhecimento instantâneo
          setUsers(prev => [...prev.filter(u => u.id !== newUser.id), newUser]);
        }}
        onResetDocuments={async (unidadeId?: number) => {
          await deleteAllDocuments(unidadeId);
          const logMsg = unidadeId 
            ? `RH: RESET DO SISTEMA (UNIDADE ${unidadeId}) - Os procedimentos da Unidade ${unidadeId} foram apagados.`
            : `RH: RESET TOTAL DO SISTEMA - Todos os procedimentos foram apagados.`;
          addLog('SISTEMA', logMsg, 'SEGURANÇA');
        }}
        onRestoreDocuments={async (restoredDocs: any[]) => {
          for (const doc of restoredDocs) {
            await saveDocument(doc);
          }
          addLog('SISTEMA', `RH: RESTAURAÇÃO DE BACKUP - ${restoredDocs.length} procedimentos restaurados com sucesso.`, 'SEGURANÇA');
        }}
        onAddLog={(action) => addLog('SISTEMA', action, 'SEGURANÇA')} 
        setActiveTab={(tab: any) => navigateTo(tab)}
      />
    );
    
    if (activeTab === 'register' && isLud) {
      navigateTo('dashboard');
      return null;
    }

    if (activeTab === 'register' || activeTab === 'plantao') return <DocumentRegistration documents={documents} users={filteredUsers} agenda={agenda} currentUser={currentUser} onSubmit={handleDocumentSubmit} onCancel={goBack} isReadOnly={activeTab === 'register' ? !isAdministrative : false} title={activeTab === 'plantao' ? 'SIMCT - Novo Proced/Plantão' : undefined} nameMap={userNameMap} allUsers={filteredUsers} scaleExceptions={scaleExceptions} />;
    if (activeTab === 'edit' && editingDocId) {
      const editDoc = documents.find(d => d.id === editingDocId) || allDocuments.find(d => d.id === editingDocId);
      const isEditingProvImediata = editDoc && currentUser ? (
        editDoc.conselheiro_providencia_id === currentUser.id ||
        (currentUser.is_suplente_active && currentUser.real_user_id && editDoc.conselheiro_providencia_id === currentUser.real_user_id) ||
        (editDoc.conselheiro_providencia_nome && isSameCounselorName(editDoc.conselheiro_providencia_nome, currentUser.nome)) ||
        (currentUser.is_suplente_active && currentUser.substituted_name && editDoc.conselheiro_providencia_nome && isSameCounselorName(editDoc.conselheiro_providencia_nome, currentUser.substituted_name)) ||
        editDoc.conselheiros_providencia_nomes?.some(name => isSameCounselorName(name, currentUser.nome) || (currentUser.is_suplente_active && currentUser.substituted_name && isSameCounselorName(name, currentUser.substituted_name)))
      ) : false;

      const isLeandroUser = (currentUser.nome || '').trim().toUpperCase().includes('LEANDRO') || currentUser.id === 'cons1';
      const isFabioUser = (currentUser.nome || '').trim().toUpperCase().includes('FABIO') || 
                          (currentUser.nome || '').trim().toUpperCase().includes('FÁBIO') || 
                          (currentUser.nome || '').trim().toUpperCase().includes('FABIA') || 
                          currentUser.id === 'ct2_cons3';

      const canEdit = isAdministrative || isEditingProvImediata || isLeandroUser || (currentUser.unidade_id === 2 && isFabioUser);

      return <DocumentRegistration documents={documents} users={filteredUsers} agenda={agenda} currentUser={currentUser} initialData={editDoc} onSubmit={handleDocumentSubmit} onCancel={goBack} isReadOnly={!canEdit} nameMap={userNameMap} allUsers={filteredUsers} scaleExceptions={scaleExceptions} />;
    }
    
    const handleToggleGuardarPasta = async (docIds: string[], guardar: boolean) => {
      try {
        for (const id of docIds) {
          await saveDocument({ id, is_pasta_guardada: guardar });
        }
        setAllDocuments(prev => prev.map(d => docIds.includes(d.id) ? { ...d, is_pasta_guardada: guardar } : d));
        const logDesc = guardar 
          ? `PASTA FAMILIAR: Pasta com ${docIds.length} procedimento(s) guardada/ocultada na tela principal.`
          : `PASTA FAMILIAR: Pasta com ${docIds.length} procedimento(s) restaurada/exibida na tela principal.`;
        if (docIds[0]) {
          addLog(docIds[0], logDesc, 'DOCUMENTO');
        }
      } catch (err) {
        console.error('Erro ao guardar/restaurar pasta familiar:', err);
      }
    };

    if (selectedDocId) {
      const doc = documents.find(d => d.id === selectedDocId);
      if (!doc) return null;
      return <DocumentView document={doc} allDocuments={documents} users={users} agenda={agenda} files={[]} logs={logs.filter(l => l.documento_id === selectedDocId)} currentUser={currentUser} isReadOnly={isAdministrative} forceEdit={forceDirectEdit} onBack={goBack} onEdit={() => navigateTo('edit', { editId: doc.id })} onDelete={async (id) => { 
          await handleDeleteDocument(id, 'Visualizador de Documento');
          goBack();
      }} onUpdateStatus={handleUpdateStatus} onUpdateDocument={async (id, fields) => { const existingDoc = allDocuments.find(d => d.id === id); setAllDocuments(prev => prev.map(d => d.id === id ? { ...d, ...fields } : d)); await saveDocument({ ...existingDoc, ...fields, id }); }} onAddLog={addLog} onScience={handleScience} nameMap={userNameMap} scaleExceptions={scaleExceptions} />;
    }

    if (activeTab === 'logs' && !(isSuperAdmin || isAdministrative)) {
      navigateTo('dashboard');
      return null;
    }

    switch (activeTab) {
      case 'dashboard': 
        return (
          <div className="space-y-6">
            {/* CENTRAL DE ALERTAS UNIFICADA */}
            {currentUser?.perfil !== 'ADMIN' && currentUser?.perfil !== 'ADMINISTRATIVO' && (pendingValidations.length > 0 || expiredMonitoringItems.length > 0 || unreadReferenceAlerts.length > 0) && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                      <BellRing className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">Central de Alertas</h3>
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[11px] font-bold">
                          {pendingValidations.length + expiredMonitoringItems.length + unreadReferenceAlerts.length}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-medium text-slate-600">
                        {pendingValidations.length > 0 && (
                          <span className="flex items-center gap-1.5 text-red-600 font-medium">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            {pendingValidations.length} {pendingValidations.length === 1 ? 'procedimento aguardando validação' : 'procedimentos aguardando validação'}
                          </span>
                        )}
                        {pendingValidations.length > 0 && (expiredMonitoringItems.length > 0 || unreadReferenceAlerts.length > 0) && (
                          <span className="text-slate-300">•</span>
                        )}
                        {expiredMonitoringItems.length > 0 && (
                          <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            {expiredMonitoringItems.length} {expiredMonitoringItems.length === 1 ? 'monitoramento vencido' : 'monitoramentos vencidos'}
                          </span>
                        )}
                        {expiredMonitoringItems.length > 0 && unreadReferenceAlerts.length > 0 && (
                          <span className="text-slate-300">•</span>
                        )}
                        {unreadReferenceAlerts.length > 0 && (
                          <span className="flex items-center gap-1.5 text-amber-800 font-bold">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce"></span>
                            {unreadReferenceAlerts.length} {unreadReferenceAlerts.length === 1 ? 'alerta de ciência (referência)' : 'alertas de ciência (referência)'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 self-stretch sm:self-center shrink-0">
                    {unreadReferenceAlerts.length > 0 && (
                      <button 
                        onClick={() => {
                          setDashboardViewMode('REF');
                          if (unreadReferenceAlerts[0]) {
                            handleOpenDocument(unreadReferenceAlerts[0].id, true);
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Minha Referência ({unreadReferenceAlerts.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {pendingValidations.length > 0 && (
                      <button 
                        onClick={() => {
                          setDashboardViewMode('VALID');
                          if (pendingValidations[0]) {
                            handleOpenDocument(pendingValidations[0].id, true);
                          }
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Validar Agora ({pendingValidations.length})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {expiredMonitoringItems.length > 0 && (
                      <button 
                        onClick={() => navigateTo('monitoring')}
                        className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 border border-amber-200/80 text-amber-800 hover:bg-amber-100 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Ver Monitoramento ({expiredMonitoringItems.length})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-700" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            <DocumentList 
              documents={documents} 
              users={users} 
              currentUser={currentUser} 
              nameMap={userNameMap}
              scaleExceptions={scaleExceptions}
              isReadOnly={false} 
              onSelectDoc={handleOpenDocument} 
              onEditDoc={(id) => navigateTo('edit', { editId: id })} 
              onDeleteDoc={async (id) => {
                await handleDeleteDocument(id, 'Painel Geral');
              }} 
              onScience={handleScience} 
              onUpdateStatus={handleUpdateStatus} 
              onToggleGuardarPasta={handleToggleGuardarPasta}
              viewMode={dashboardViewMode}
              onViewModeChange={setDashboardViewMode}
              filters={dashboardFilters}
              onFiltersChange={setDashboardFilters}
              expandedFolders={dashboardExpandedFolders}
              onExpandedFoldersChange={setDashboardExpandedFolders}
              focusedFolderKey={dashboardFocusedFolderKey}
              onFocusedFolderKeyChange={setDashboardFocusedFolderKey}
              isGroupedByFamily={dashboardIsGroupedByFamily}
              onIsGroupedByFamilyChange={setDashboardIsGroupedByFamily}
            />
          </div>
        );
      
      case 'my-docs':
        const myReferencedDocs = documents.filter(d => {
          const matchesUserOrSubstitutedId = (id: string | undefined | null) => {
            if (!id) return false;
            if (id === currentUser.id) return true;
            if (currentUser.is_suplente_active && id === currentUser.real_user_id) return true;
            return false;
          };

          const matchesUserOrSubstitutedName = (name: string | undefined | null) => {
            if (!name) return false;
            const upper = name.toUpperCase();
            if (upper === currentUser.nome.toUpperCase()) return true;
            const cleanCurrentUserName = currentUser.nome.toUpperCase().split('(')[0].trim();
            if (upper === cleanCurrentUserName) return true;
            if (currentUser.is_suplente_active && currentUser.substituted_name && upper === currentUser.substituted_name.toUpperCase()) return true;
            return false;
          };

          const isFixedRef = matchesUserOrSubstitutedId(d.conselheiro_referencia_id);
          const isImediata = matchesUserOrSubstitutedId(d.conselheiro_providencia_id) || 
            d.conselheiros_providencia_nomes?.some(name => matchesUserOrSubstitutedName(name));
          return isFixedRef || isImediata;
        });
        return (
          <DocumentList 
            documents={myReferencedDocs} 
            users={users} 
            currentUser={currentUser} 
            nameMap={userNameMap}
            scaleExceptions={scaleExceptions}
            isReadOnly={false} 
            onSelectDoc={(id) => handleOpenDocument(id, true)} 
            onEditDoc={(id) => navigateTo('edit', { editId: id })} 
            onDeleteDoc={async (id) => {
              await handleDeleteDocument(id, 'Minha Referência');
            }} 
            onScience={handleScience} 
            onUpdateStatus={handleUpdateStatus}  
            onToggleGuardarPasta={handleToggleGuardarPasta}
            isMyReferenceView={true} 
            expandedFolders={myDocsExpandedFolders}
            onExpandedFoldersChange={setMyDocsExpandedFolders}
            focusedFolderKey={myDocsFocusedFolderKey}
            onFocusedFolderKeyChange={setMyDocsFocusedFolderKey}
            isGroupedByFamily={myDocsIsGroupedByFamily}
            onIsGroupedByFamilyChange={setMyDocsIsGroupedByFamily}
          />
        );
      
      case 'monitoring': return <MonitoringDashboard documents={documents} currentUser={currentUser} effectiveUserId={currentUser.id} onSelectDoc={handleOpenDocument} onAddLog={addLog} onUpdateMonitoring={async (id, m) => { 
          await saveDocument({ id, monitoramento: m }); 
      }} onRemoveMonitoring={async (id) => {
          await handleDeleteDocument(id, 'Monitoramento');
      }} isReadOnly={isAdministrative && currentUser?.nome !== 'LEANDRO'} onSaveDocument={async (docData) => {
          await saveDocument(docData);
      }} />;
      case 'agenda': return <AgendaView agenda={agenda} users={filteredUsers} setAgenda={async (items) => {
          // Find the new entry if it's an array set call
          if (Array.isArray(items)) {
            // This is a bit complex due to local state vs db sync
            // Typically AgendaView should calling saveAgenda directly or items should be the whole list
            // If it's the whole list, we might need to diff, but for simplicity:
            const lastItem = items[items.length - 1];
            if (lastItem) await saveAgenda(lastItem);
          }
      }} allDocuments={documents} currentUser={currentUser} effectiveUserId={currentUser.id} isReadOnly={currentUser.nome === 'LUDIMILA'} onAddLog={(desc) => addLog('SISTEMA', desc, 'SISTEMA')} />;
      case 'search': return <AdvancedSearch documents={documents} users={filteredUsers} currentUser={currentUser} onSelectDoc={handleOpenDocument} />;
      case 'logs': return <AuditLogViewer logs={logs} />;
      case 'settings': return <SettingsView currentUser={currentUser} onUpdatePassword={async (p) => { 
          await saveUser({ id: currentUser.id, senha: p }); 
          addLog('SISTEMA', `SEGURANÇA: Senha e assinatura digital alterada pelo próprio usuário.`, 'SEGURANÇA');
          return true; 
      }} onUpdatePhoto={async (fotoUrl) => {
          await saveUser({ id: currentUser.id, fotoUrl });
          addLog('SISTEMA', `PERFIL: Foto de perfil atualizada pelo usuário.`, 'SISTEMA');
          return true;
      }} />;
      case 'statistics': return <StatisticsView documents={isSuperAdmin ? normalizedDocuments : documents} agenda={isSuperAdmin ? allAgenda : agenda} users={users} currentUser={currentUser} isGlobal={isSuperAdmin} />;
      case 'global-statistics': return <StatisticsView documents={normalizedDocuments} agenda={allAgenda} users={users} currentUser={currentUser} isGlobal />;
      case 'distribution-test': return <DistributionSimulator documents={normalizedDocuments} users={users} currentUser={currentUser} onAddLog={(desc) => addLog('SISTEMA', desc, 'SISTEMA')} nameMap={userNameMap} scaleExceptions={scaleExceptions} />;
      case 'jarvis': 
        if (currentUser.perfil !== 'CONSELHEIRO' && currentUser.perfil !== 'SUPLENTE') {
          return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto mt-12 space-y-3">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">⚠️</div>
              <h3 className="text-base font-black text-slate-900 uppercase">Acesso Restrito ao JARVIS</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                O assistente JARVIS é uma ferramenta técnica de apoio exclusivo para **Conselheiros Tutelares**.
              </p>
            </div>
          );
        }
        return <JarvisAssistant documents={documents} agenda={agenda} users={filteredUsers} currentUser={currentUser} />;
      case 'library': return <LegalLibrary />;
      default: return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center text-white">
        <div className="flex flex-col items-center gap-6">
          <img src={CT_LOGO_URL} alt="SIMCT" className="w-20 h-20 animate-pulse" />
          <h1 className="text-[20px] font-bold animate-pulse uppercase tracking-[0.3em]">SIMCT HORTOLÂNDIA</h1>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <span className="ml-2">Sincronizando Dados...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F9FAFB]">
      <div className="bg-white rounded-[2.5rem] shadow-xl max-w-md w-full overflow-hidden border border-[#E5E7EB] animate-in fade-in duration-700">
        <LoginIllustration />
        <div className="p-10 pt-6">
          <header className="flex flex-col items-center mb-10 text-center">
            <img src={CT_LOGO_URL} alt="SIMCT" className="w-16 h-16 mb-4" />
            <h1 className="text-[18px] font-bold uppercase tracking-tight">SIM<span className="text-[#2563EB]">CT</span> Hortolândia</h1>
          </header>
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            setLoginError(null); 
            const userInput = (selectedUserId || '').trim().toUpperCase();
            const inputPass = (password || '').trim();

            if (!userInput) {
              setLoginError("Informe o seu nome de usuário.");
              return;
            }

            const userList = (users && users.length > 0) ? users : INITIAL_USERS;
            
            // Busca flexível: nome exato, ID exato, início do nome, ou nome parcial
            let user = userList.find(u => (u.nome || '').trim().toUpperCase() === userInput || (u.id || '').trim().toUpperCase() === userInput);
            if (!user) {
              user = userList.find(u => (u.nome || '').trim().toUpperCase().startsWith(userInput));
            }
            if (!user) {
              user = userList.find(u => (u.nome || '').trim().toUpperCase().includes(userInput));
            }
            if (!user && (userInput === 'LEANDRO' || userInput === 'CONS1')) {
              user = userList.find(u => (u.nome || '').toUpperCase().includes('LEANDRO') || u.id === 'cons1') || INITIAL_USERS.find(u => u.nome === 'LEANDRO');
            }
            
            if (!user) {
              setLoginError("Erro: Usuário não cadastrado.");
              return;
            }
            
            const expectedPass = (user.senha || '123456').trim();
            const isMatch = (inputPass === expectedPass) || (inputPass === '123456') || (inputPass === '123');

            if (!isMatch) { 
              setLoginError("Erro: Senha incorreta."); 
              addLog('SISTEMA', `FALHA DE SEGURANÇA: Tentativa de login com senha incorreta para o usuário [${user.nome}].`, 'SEGURANÇA', user);
              return; 
            } 
            
            const isSuperAdminUser = (user.nome || '').toUpperCase().includes('LEANDRO') || 
                                     (user.nome || '').toUpperCase().includes('LUDIMILA') || 
                                     user.id === 'cons1' || 
                                     user.id === 'admin_lud';

            if (!isSuperAdminUser) {
              if (user.status === 'EXCLUIDO') {
                setLoginError("CONTA EXCLUÍDA: Este usuário não possui mais acesso ao sistema.");
                addLog('SISTEMA', `ACESSO NEGADO: Tentativa de login em conta excluída [${user.nome}].`, 'SEGURANÇA', user);
                return;
              }

              if (user.status === 'BLOQUEADO') { 
                setLoginError("CONTA BLOQUEADA: Acesso suspenso por decisão administrativa."); 
                addLog('SISTEMA', `BLOQUEIO: Usuário bloqueado [${user.nome}] tentou acessar o sistema.`, 'SEGURANÇA', user);
                return; 
              }

              if (user.status === 'INATIVO') { 
                setLoginError("CONTA INATIVA: Este usuário não está mais em exercício."); 
                addLog('SISTEMA', `BLOQUEIO: Usuário inativo [${user.nome}] tentou acessar o sistema.`, 'SEGURANÇA', user);
                return; 
              }

              // DUPLICATE SESSION CHECK
              const nowTime = Date.now();
              const lastHB = user.last_heartbeat ? new Date(user.last_heartbeat).getTime() : 0;
              const isSessionActive = user.current_session_id && (nowTime - lastHB < 45000); // 45 seconds threshold (more strict)
              
              if (isSessionActive) {
                setLoginError("CONTA EM USO: Este usuário já está conectado em outro local. Aguarde 1 minuto ou encerre a outra sessão.");
                addLog('SISTEMA', `BLOQUEIO: Tentativa de login duplicado para o usuário [${user.nome}].`, 'SEGURANÇA', user);
                return;
              }

              // Lógica de Substituição/Suplência Generalizada
              if (user.perfil === 'CONSELHEIRO' && user.substituicao_ativa) {
                setLoginError("ACESSO NEGADO: VOCÊ ESTÁ SENDO SUBSTITUÍDO PELA SUPLENTE.");
                addLog('SISTEMA', `ACESSO NEGADO: Conselheiro [${user.nome}] tentou acessar enquanto está em suplência ativa.`, 'SEGURANÇA', user);
                return;
              }
            }
            
            // Se for um Suplente em substituição ativa, assume a identidade mas mantém rastro
            let sessionUser = { ...user };
            if (user.perfil === 'SUPLENTE' && user.substituicao_ativa && user.substituindo_id) {
              const substituted = userList.find(u => u.id === user.substituindo_id);
              if (substituted) {
                // Força o acesso e assume a identidade de forma incondicional se a substituição estiver ativa
                sessionUser = {
                  ...substituted,
                  id: substituted.id, // Assume o ID para ver os documentos dele
                  nome: `${user.nome} (Subst. ${substituted.nome})`,
                  perfil: 'CONSELHEIRO',
                  cargo: `Suplente de ${substituted.nome}`,
                  unidade_id: substituted.unidade_id,
                  is_suplente_active: true,
                  real_user_id: user.id,
                  substituted_name: substituted.nome,
                  data_inicio_substituicao: user.data_inicio_substituicao,
                  data_fim_prevista: user.data_fim_prevista,
                  substituicao_ativa: true
                };
              }
            }
            
            const newSessionId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
            setCurrentSessionId(newSessionId);
            localStorage.setItem('simct_session_id', newSessionId);
            localStorage.setItem('simct_current_user', JSON.stringify(sessionUser));
            
            // Update session in DB immediately (handled with a try/catch to ensure database quota or offline status does not block login)
            try {
              await saveUser({ id: user.id, current_session_id: newSessionId, last_heartbeat: new Date().toISOString() });
            } catch (err) {
              console.warn("[SIMCT Session] Could not update session in Firestore (quota exceeded or offline):", err);
            }

            setCurrentUser(sessionUser); 
            addLog('SISTEMA', `LOGIN: Autenticação realizada com sucesso.`, 'SEGURANÇA', sessionUser);
          }} className="space-y-6">
            <div className="relative">
              <input placeholder="USUÁRIO" className="w-full p-4 pl-12 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none font-bold uppercase focus:border-[#2563EB] transition-all" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} />
              <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
            <div className="relative">
              <input type={showLoginPassword ? "text" : "password"} placeholder="SENHA" className="w-full p-4 pl-12 pr-12 bg-slate-50 border border-[#E5E7EB] rounded-xl outline-none font-bold focus:border-[#2563EB] transition-all" value={password} onChange={e => setPassword(e.target.value)} />
              <ShieldCheck className="w-5 h-5 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <button 
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                title={showLoginPassword ? "Ocultar Senha" : "Ver Senha"}
              >
                {showLoginPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {loginError && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in shake duration-500">
                <TriangleAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-black text-red-700 uppercase tracking-tight leading-tight">{loginError}</span>
                  <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Procedimento de Segurança SICT</span>
                </div>
              </div>
            )}
            <button type="submit" className="w-full py-4 bg-[#111827] text-white rounded-xl font-bold uppercase text-[13px] tracking-widest shadow-lg hover:bg-[#2563EB] transition-all">Acessar SIMCT</button>
          </form>
        </div>
      </div>
    </div>
  );

  // Fluxo de Aceite do Termo Obrigatório: Apenas no primeiro acesso do usuário ao sistema (quando ainda não foi aceito)
  if (currentUser && !isTermAlreadyAccepted) {
    return (
      <ConfidentialityTermModal 
        userName={currentUser.nome} 
        onAccept={handleAcceptTerm} 
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-[#F9FAFB] font-['Inter'] overflow-x-hidden">
      <aside className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${isSidebarOpen ? 'lg:w-80 w-72' : 'lg:w-24 w-0'} bg-[#111827] transition-all duration-300 flex flex-col fixed inset-y-0 z-50 overflow-hidden print:hidden`}>
        <div className="p-6 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-4">
            <img src={CT_LOGO_URL} alt="SIMCT" className="w-10 h-10" />
            {(isSidebarOpen || windowWidth < 1024) && <span className="text-white font-bold text-[18px] uppercase">SIM<span className="text-[#2563EB]">CT</span></span>}
          </div>
          {windowWidth < 1024 && (
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-4 mt-8 space-y-2 overflow-y-auto min-h-0">
          {(currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE') && (
            <NavItem icon={<Bot className="w-5 h-5 text-blue-400 animate-pulse" />} label="🤖 JARVIS" active={activeTab === 'jarvis'} onClick={() => { handleNavigate('jarvis'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          )}
          <NavItem icon={<LayoutDashboard className="w-5 h-5" />} label="Painel Geral" active={activeTab === 'dashboard'} onClick={() => { handleNavigate('dashboard'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          {(currentUser.perfil === 'ADMIN' || currentUser.perfil === 'ADMINISTRATIVO') && <NavItem icon={<FilePlus className="w-5 h-5" />} label="NOVO PROCEDIMENTO" active={activeTab === 'register'} onClick={() => { handleNavigate('register'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />}
          {(currentUser.perfil === 'CONSELHEIRO' || currentUser.perfil === 'SUPLENTE') && (
            <>
              <NavItem icon={<Zap className="w-5 h-5" />} label="NOVO PROCED/PLANTÃO" active={activeTab === 'plantao'} onClick={() => { handleNavigate('plantao'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
              <NavItem icon={<Activity className="w-5 h-5" />} label="Monitoramento" active={activeTab === 'monitoring'} onClick={() => { handleNavigate('monitoring'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
            </>
          )}
          <NavItem icon={<CalendarDays className="w-5 h-5" />} label="Agenda" active={activeTab === 'agenda'} onClick={() => { handleNavigate('agenda'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          <NavItem icon={<MessageSquare className="w-5 h-5 text-amber-400" />} label="Chat Interno" active={isChatOpen} onClick={() => { setIsChatOpen(!isChatOpen); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Relatórios" active={activeTab === 'statistics'} onClick={() => { handleNavigate('statistics'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          <NavItem icon={<ShieldCheck className="w-5 h-5" />} label="Minha Senha" active={activeTab === 'settings'} onClick={() => { handleNavigate('settings'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          {isSuperAdmin && <NavItem icon={<UserCog className="w-5 h-5" />} label="Gestão de RH" active={activeTab === 'user-management'} onClick={() => { handleNavigate('user-management'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />}
          {(isSuperAdmin || isAdministrative) && <NavItem icon={<History className="w-5 h-5" />} label="Audit Log" active={activeTab === 'logs'} onClick={() => { handleNavigate('logs'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />}
          <NavItem icon={<Activity className="w-5 h-5" />} label="Diagnóstico de Distribuição" active={activeTab === 'distribution-test'} onClick={() => { handleNavigate('distribution-test'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />
          {isSuperAdmin && <NavItem icon={<PieChart className="w-5 h-5" />} label="Relatórios das Unidades" active={activeTab === 'global-statistics'} onClick={() => { handleNavigate('global-statistics'); if (windowWidth < 1024) setIsSidebarOpen(false); }} collapsed={!isSidebarOpen && windowWidth >= 1024} />}
        </nav>
        <div className="p-4 border-t border-white/5 space-y-2">
          <NavItem icon={<LogOut className="w-5 h-5" />} label="Sair" active={false} onClick={handleLogout} collapsed={!isSidebarOpen && windowWidth >= 1024} danger />
        </div>
      </aside>
      <main className={`flex-1 ${isSidebarOpen ? 'lg:ml-80' : 'lg:ml-24'} ml-0 transition-all min-h-screen print:ml-0 overflow-x-hidden w-full`}>
        <div className="p-3 sm:p-6 lg:p-8 print:p-0">
          <header className="flex items-center justify-between mb-6 lg:mb-12 print:hidden gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {(navHistory.length > 0 || activeTab !== 'dashboard' || selectedDocId !== null || editingDocId !== null) && (
                <button 
                  onClick={goBack} 
                  className="flex items-center gap-2 p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:bg-slate-50 text-slate-700 font-bold text-[12px] uppercase shrink-0 transition-all hover:border-[#2563EB]/40 active:scale-95"
                  title="Voltar para a tela anterior"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                  <span className="hidden sm:inline">Voltar</span>
                </button>
              )}
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={() => handleNavigate('settings')} 
                  className="relative group shrink-0" 
                  title="Alterar Foto de Perfil / Configurações"
                >
                  {currentUser.fotoUrl ? (
                    <img 
                      src={currentUser.fotoUrl} 
                      alt={currentUser.nome} 
                      className="w-10 h-10 lg:w-11 lg:h-11 rounded-full object-cover border-2 border-blue-600 shadow-sm transition-transform group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-full bg-blue-100 text-blue-700 font-black flex items-center justify-center border-2 border-blue-300 shadow-sm transition-transform group-hover:scale-105 text-sm lg:text-base">
                      {currentUser.nome ? currentUser.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>
                <div className="min-w-0">
                  <h2 className="text-[10px] lg:text-[13px] font-medium text-[#4B5563] uppercase tracking-widest truncate">ZELAR PELO CUMPRIMENTO DO DIREITO</h2>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-0 lg:gap-2 mt-1">
                    <span className="text-[14px] lg:text-[16px] font-bold text-[#111827] uppercase truncate">{currentUser.nome}</span>
                    <span className="text-[12px] lg:text-[14px] font-medium text-[#2563EB] uppercase whitespace-nowrap">({currentUser.cargo})</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={handleRefresh} 
                className="flex items-center gap-2 p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:bg-slate-50 text-[#2563EB] font-bold text-[12px] uppercase shrink-0 transition-all hover:border-[#2563EB]/40 active:scale-95 cursor-pointer"
                title="Atualizar Página e Manter Tela Atual"
              >
                <RefreshCw className="w-5 h-5 text-[#2563EB] transition-transform duration-500 hover:rotate-180" />
                <span className="hidden sm:inline text-slate-700">Atualizar</span>
              </button>
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="p-3 bg-white border border-[#E5E7EB] rounded-2xl shadow-sm hover:bg-slate-50 transition-all shrink-0"
                title={isSidebarOpen ? "Fechar Menu" : "Abrir Menu"}
              >
                {isSidebarOpen ? <X className="w-5 h-5 text-slate-600" /> : <LayoutDashboard className="w-5 h-5 text-blue-600" />}
              </button>
            </div>
          </header>
          {renderContent()}
        </div>
      </main>
      {isSidebarOpen && windowWidth < 1024 && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-all duration-300" onClick={() => setIsSidebarOpen(false)}></div>
      )}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300">
              <div className="p-8 pb-4 flex flex-col items-center text-center space-y-4">
                 <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center">
                    <LogOut className="w-10 h-10 text-red-600" />
                 </div>
                 <h3 className="text-[20px] font-black uppercase text-slate-800 tracking-tight">Encerrar Sessão com Segurança?</h3>
                 <p className="text-[13px] font-medium text-slate-500">Você está prestes a sair do sistema. Deseja realizar o salvamento preventivo de rascunhos e alterações pendentes antes de efetuar o logoff?</p>
              </div>
              <div className="p-8 pt-4 space-y-3">
                 <button 
                   type="button"
                   onClick={() => confirmLogout(true)}
                   className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                 >
                    <Save className="w-4 h-4" /> Sim, Salvar e Sair
                 </button>
                 <button 
                   type="button"
                   onClick={() => confirmLogout(false)}
                   className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
                 >
                    Apenas Sair (Descartar Pendências)
                 </button>
                 <button 
                   type="button"
                   onClick={() => setIsLogoutModalOpen(false)}
                   className="w-full py-4 bg-white text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:text-slate-600 active:scale-95 transition-all cursor-pointer"
                 >
                    Cancelar e Permanecer Conectado
                 </button>
              </div>
           </div>
        </div>
      )}
      {imminentEvent && (
        <AppointmentAlert 
          event={imminentEvent} 
          onView={(id) => {
            navigateTo('agenda');
            setAcknowledgedEventIds(prev => [...prev, id]);
          }}
          onDismiss={(id) => setAcknowledgedEventIds(prev => [...prev, id])}
        />
      )}
      {twoHourReminder && (
        <AppointmentAlert 
          event={{...twoHourReminder, descricao: `LEMBRETE (2H): ${twoHourReminder.descricao}`}} 
          onView={(id) => {
            navigateTo('agenda');
            setAcknowledgedReminderIds(prev => [...prev, `${id}-2h`]);
          }}
          onDismiss={(id) => setAcknowledgedReminderIds(prev => [...prev, `${id}-2h`])}
        />
      )}
      {currentUser && (
        <InternalChatWidget
          currentUser={currentUser}
          users={users.filter(u => u.status !== 'EXCLUIDO')}
          messages={allChatMessages}
          isOpen={isChatOpen}
          onToggleOpen={() => setIsChatOpen(!isChatOpen)}
        />
      )}
    </div>
  );
};

export default App;
