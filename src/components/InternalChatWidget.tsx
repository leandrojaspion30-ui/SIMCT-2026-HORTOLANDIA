import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MessageSquare, Send, X, Users, User as UserIcon, Bell, Minimize2, Maximize2, Shield, AlertCircle, CheckCheck, Trash2, Sparkles, ChevronDown, ChevronLeft, Search, Building2, Globe, UserCheck, Check, Smile } from 'lucide-react';
import { User, ChatMessage } from '../types';
import { saveChatMessage, deleteChatMessage, markChatMessageAsRead } from '../lib/db';

interface InternalChatWidgetProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const InternalChatWidget: React.FC<InternalChatWidgetProps> = ({
  currentUser,
  users,
  messages,
  isOpen,
  onToggleOpen
}) => {
  // activeChannel can be 'ALL_U1', 'ALL_U2', 'ALL_SYSTEM', or a specific user.id
  const defaultChannel = currentUser.unidade_id === 2 ? 'ALL_U2' : 'ALL_U1';
  const [activeChannel, setActiveChannel] = useState<string>(defaultChannel);
  
  // OS NOMES FICAM OCULTOS POR PADRÃO!
  // isSelectorOpen controla se o painel de seleção de contatos/destinatário está visível.
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [unitFilter, setUnitFilter] = useState<'U1' | 'U2' | 'ALL'>(
    currentUser.unidade_id === 2 ? 'U2' : 'U1'
  );
  
  const [textInput, setTextInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const QUICK_EMOJIS = ['👍', '😊', '🙏', '✅', '⚠️', '☕', '🚨', '👏'];

  const EMOJI_CATEGORIES = [
    {
      category: 'Expressões & Reações',
      emojis: ['👍', '👎', '😊', '😃', '😄', '🙏', '👏', '❤️', '🔥', '🎉', '🤝', '👋', '💡', '👌', '⭐', '🙌', '🎯', '💯']
    },
    {
      category: 'Trabalho & Atendimento',
      emojis: ['✅', '⚠️', '🚨', '📌', '☕', '📞', '📋', '🖊️', '💼', '📄', '🏢', '🏛️', '⚖️', '🕒', '⏳', '🔔', '💬', '📂']
    }
  ];

  const handleInsertEmoji = (emoji: string) => {
    setTextInput(prev => prev + emoji);
  };

  // Total unread messages count across all channels
  const totalUnreadCount = useMemo(() => {
    return messages.filter(m => {
      if (m.sender_id === currentUser.id) return false;
      const readList = m.read_by || [];
      return !readList.includes(currentUser.id);
    }).length;
  }, [messages, currentUser]);

  // Helper for unread count per specific channel
  const getUnreadForChannel = useCallback((channelKey: string) => {
    return messages.filter(m => {
      if (String(m.sender_id) === String(currentUser.id)) return false;
      const readList = m.read_by || [];
      if (readList.includes(currentUser.id) || readList.includes(String(currentUser.id))) return false;

      if (channelKey === 'ALL_U1') {
        return (m.recipient_id === 'ALL_U1' || (!m.recipient_id && m.unidade_id === 1) || (m.recipient_id === 'ALL' && m.unidade_id === 1));
      }
      if (channelKey === 'ALL_U2') {
        return (m.recipient_id === 'ALL_U2' || (!m.recipient_id && m.unidade_id === 2) || (m.recipient_id === 'ALL' && m.unidade_id === 2));
      }
      if (channelKey === 'ALL_SYSTEM') {
        return m.recipient_id === 'ALL_SYSTEM' || m.recipient_id === 'ALL';
      }
      // Direct 1-on-1
      return String(m.sender_id) === String(channelKey) && String(m.recipient_id) === String(currentUser.id);
    }).length;
  }, [messages, currentUser]);

  // Available users list filtered by unit tab & search query
  const availableUsers = useMemo(() => {
    return users
      .filter(u => String(u.id) !== String(currentUser.id) && u.status !== 'EXCLUIDO' && u.status !== 'INATIVO')
      .filter(u => !u.nome.toUpperCase().includes('LUDIMILA') && u.cargo !== 'ADM GERAL')
      .filter(u => {
        if (unitFilter === 'U1') return u.unidade_id === 1;
        if (unitFilter === 'U2') return u.unidade_id === 2;
        return true; // 'ALL'
      })
      .filter(u => {
        if (!contactSearch.trim()) return true;
        const term = contactSearch.toLowerCase();
        return u.nome.toLowerCase().includes(term) || (u.cargo && u.cargo.toLowerCase().includes(term));
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [users, currentUser, unitFilter, contactSearch]);

  // Messages for active channel
  const channelMessages = useMemo(() => {
    return messages
      .filter(m => {
        if (activeChannel === 'ALL_U1') {
          return (m.recipient_id === 'ALL_U1' || (!m.recipient_id && m.unidade_id === 1) || (m.recipient_id === 'ALL' && m.unidade_id === 1));
        }
        if (activeChannel === 'ALL_U2') {
          return (m.recipient_id === 'ALL_U2' || (!m.recipient_id && m.unidade_id === 2) || (m.recipient_id === 'ALL' && m.unidade_id === 2));
        }
        if (activeChannel === 'ALL_SYSTEM') {
          return m.recipient_id === 'ALL_SYSTEM' || m.recipient_id === 'ALL';
        }
        if (activeChannel === 'ALL') {
          return (!m.recipient_id || m.recipient_id === 'ALL' || m.recipient_id === `ALL_U${currentUser.unidade_id || 1}`);
        }
        // Direct private message between currentUser & recipient
        return (String(m.sender_id) === String(currentUser.id) && String(m.recipient_id) === String(activeChannel)) ||
               (String(m.sender_id) === String(activeChannel) && String(m.recipient_id) === String(currentUser.id));
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [messages, currentUser, activeChannel]);

  // Mark active channel messages as read
  useEffect(() => {
    if (isOpen && !isMinimized && channelMessages.length > 0) {
      channelMessages.forEach(msg => {
        if (msg.sender_id !== currentUser.id) {
          const reads = msg.read_by || [];
          if (!reads.includes(currentUser.id)) {
            markChatMessageAsRead(msg.id, currentUser.id);
          }
        }
      });
    }
  }, [isOpen, isMinimized, channelMessages, currentUser.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized && !isSelectorOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages, isOpen, isMinimized, isSelectorOpen]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || textInput.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    try {
      await saveChatMessage({
        unidade_id: currentUser.unidade_id || 1,
        sender_id: currentUser.id,
        sender_name: currentUser.nome,
        sender_cargo: currentUser.cargo,
        sender_perfil: currentUser.perfil,
        text: textToSend,
        created_at: new Date().toISOString(),
        recipient_id: activeChannel,
        read_by: [currentUser.id]
      });

      if (!customText) {
        setTextInput('');
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem no chat:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (window.confirm("Deseja apagar esta mensagem do chat?")) {
      await deleteChatMessage(msgId);
    }
  };

  // Human readable channel label
  const activeChannelInfo = useMemo(() => {
    if (activeChannel === 'ALL_U1') {
      return { title: 'Geral - Unidade I', sub: 'Todos os conselheiros e equipe da Unidade I', icon: <Building2 className="w-4 h-4 text-amber-400" /> };
    }
    if (activeChannel === 'ALL_U2') {
      return { title: 'Geral - Unidade II', sub: 'Todos os conselheiros e equipe da Unidade II', icon: <Building2 className="w-4 h-4 text-blue-400" /> };
    }
    if (activeChannel === 'ALL_SYSTEM') {
      return { title: 'Geral - Todos os Usuários', sub: 'Comunicação global (Unidades I e II)', icon: <Globe className="w-4 h-4 text-emerald-400" /> };
    }
    const targetUser = users.find(u => u.id === activeChannel);
    if (targetUser) {
      return {
        title: targetUser.nome,
        sub: `${targetUser.cargo || 'Conselheiro'} • Unidade ${targetUser.unidade_id || 1}`,
        icon: <UserIcon className="w-4 h-4 text-indigo-400" />
      };
    }
    return { title: 'Canal de Comunicação', sub: 'Chat interno', icon: <MessageSquare className="w-4 h-4 text-slate-300" /> };
  }, [activeChannel, users]);

  const quickAlerts = [
    { label: '📞 Atender Recepção', text: '🔔 ATENÇÃO: Favor verificar atendimento na Recepção!' },
    { label: '📄 Procedimento Pronto', text: '✅ Procedimento finalizado e liberado para conferência.' },
    { label: '🤝 Chamado de Apoio', text: '⚠️ Solicito apoio de um conselheiro na sala de atendimento.' },
    { label: '☕ Pausa Rápida', text: 'ℹ️ Ausente temporariamente por alguns minutos.' },
  ];

  return (
    <>
      {/* Botão Flutuante de Acesso ao Chat */}
      {!isOpen && (
        <button
          onClick={onToggleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#111827] hover:bg-blue-600 text-white rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer border-2 border-white/20"
          title="Abrir Chat Interno de Comunicação"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-amber-400 group-hover:text-white transition-colors" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-2 -right-2.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-md border-2 border-[#111827]">
                {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
              </span>
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] font-black uppercase tracking-wider leading-none">Chat Interno</span>
            <span className="text-[9px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest mt-0.5">
              {totalUnreadCount > 0 ? `${totalUnreadCount} nova(s) msg` : 'Comunicação Equipe'}
            </span>
          </div>
        </button>
      )}

      {/* Janela Do Chat */}
      {isOpen && (
        <div 
          className={`fixed right-2 sm:right-6 bottom-2 sm:bottom-6 z-50 w-[96vw] sm:w-[480px] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden transition-all duration-300 ${
            isMinimized ? 'h-[70px]' : 'h-[600px] max-h-[88vh]'
          }`}
        >
          {/* Cabeçalho Principal do Chat */}
          <div className="bg-[#111827] text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-blue-600/30 rounded-2xl border border-blue-400/30 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-white truncate">
                    Chat Interno SIMCT
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[9px] font-extrabold uppercase border border-blue-400/30 shrink-0">
                    Unidade {currentUser.unidade_id || 1}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold truncate mt-0.5">
                  Logado como: <strong className="text-slate-200">{currentUser.nome}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                title={isMinimized ? "Expandir Chat" : "Minimizar Chat"}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onToggleOpen}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                title="Fechar Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-white relative">
              
              {/* BARRA SUPERIOR DE SELEÇÃO DE DESTINATÁRIO */}
              <div className="p-3 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-white/10 rounded-xl shrink-0">
                    {activeChannelInfo.icon}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                      Falando com:
                    </span>
                    <h4 className="text-xs font-black uppercase text-amber-300 truncate">
                      {activeChannelInfo.title}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0 border ${
                    isSelectorOpen 
                      ? 'bg-amber-400 text-amber-950 border-amber-300 font-black' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400/40'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isSelectorOpen ? 'Fechar Lista' : 'Escolher Destinatário'}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* PAINEL OCULTO/EXPANSÍVEL DE SELEÇÃO DE CONTATOS (QUANDO CLICADO) */}
              {isSelectorOpen ? (
                <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-md text-white p-4 flex flex-col overflow-hidden animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-amber-400" />
                        Com quem deseja falar?
                      </h4>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        Escolha a Unidade ou clique no nome do usuário para conversa privada.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsSelectorOpen(false)}
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* BOTOES DE FILTRO DE UNIDADE */}
                  <div className="my-3 flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-2xl border border-white/10 shrink-0">
                    <button
                      onClick={() => setUnitFilter('U1')}
                      className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        unitFilter === 'U1'
                          ? 'bg-amber-400 text-amber-950 shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Unidade I</span>
                    </button>

                    <button
                      onClick={() => setUnitFilter('U2')}
                      className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        unitFilter === 'U2'
                          ? 'bg-blue-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Unidade II</span>
                    </button>

                    <button
                      onClick={() => setUnitFilter('ALL')}
                      className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        unitFilter === 'ALL'
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Todos</span>
                    </button>
                  </div>

                  {/* PESQUISA DE CONTATO */}
                  <div className="relative mb-3 shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Pesquisar nome do conselheiro..."
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      className="w-full bg-slate-800 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-amber-400 transition-all"
                    />
                  </div>

                  {/* LISTA VERTICAL DE OPÇÕES */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    
                    {/* CANAIS GERAIS */}
                    <div className="text-[9px] font-black uppercase text-amber-400/80 tracking-widest px-1 pt-1">
                      📢 Grupos Gerais
                    </div>

                    {(unitFilter === 'U1' || unitFilter === 'ALL') && (
                      <button
                        onClick={() => {
                          setActiveChannel('ALL_U1');
                          setIsSelectorOpen(false);
                        }}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                          activeChannel === 'ALL_U1'
                            ? 'bg-amber-400 text-amber-950 border-amber-300 font-bold shadow-lg'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-white border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-black uppercase tracking-wider">
                              Geral - Unidade I
                            </span>
                            <span className="block text-[9px] opacity-80">
                              Equipe da Unidade I
                            </span>
                          </div>
                        </div>
                        {getUnreadForChannel('ALL_U1') > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[9px] rounded-full">
                            {getUnreadForChannel('ALL_U1')} new
                          </span>
                        )}
                      </button>
                    )}

                    {(unitFilter === 'U2' || unitFilter === 'ALL') && (
                      <button
                        onClick={() => {
                          setActiveChannel('ALL_U2');
                          setIsSelectorOpen(false);
                        }}
                        className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                          activeChannel === 'ALL_U2'
                            ? 'bg-blue-600 text-white border-blue-400 font-bold shadow-lg'
                            : 'bg-slate-800/80 hover:bg-slate-800 text-white border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="block text-xs font-black uppercase tracking-wider">
                              Geral - Unidade II
                            </span>
                            <span className="block text-[9px] opacity-80">
                              Equipe da Unidade II
                            </span>
                          </div>
                        </div>
                        {getUnreadForChannel('ALL_U2') > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[9px] rounded-full">
                            {getUnreadForChannel('ALL_U2')} new
                          </span>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveChannel('ALL_SYSTEM');
                        setIsSelectorOpen(false);
                      }}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                        activeChannel === 'ALL_SYSTEM'
                          ? 'bg-emerald-600 text-white border-emerald-400 font-bold shadow-lg'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-white border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-xs font-black uppercase tracking-wider">
                            Geral - Todos os Usuários
                          </span>
                          <span className="block text-[9px] opacity-80">
                            Ambas Unidades (I e II)
                          </span>
                        </div>
                      </div>
                      {getUnreadForChannel('ALL_SYSTEM') > 0 && (
                        <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[9px] rounded-full">
                          {getUnreadForChannel('ALL_SYSTEM')} new
                        </span>
                      )}
                    </button>

                    {/* USUÁRIOS INDIVIDUAIS */}
                    <div className="text-[9px] font-black uppercase text-amber-400/80 tracking-widest px-1 pt-3">
                      👤 Usuários Individuais ({availableUsers.length})
                    </div>

                    {availableUsers.map(u => {
                      const isSelected = activeChannel === u.id;
                      const unread = getUnreadForChannel(u.id);

                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveChannel(u.id);
                            setIsSelectorOpen(false);
                          }}
                          className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md font-bold'
                              : 'bg-slate-800/50 hover:bg-slate-800 text-slate-100 border-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-black text-xs ${
                              isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-700 text-amber-300'
                            }`}>
                              {u.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="block text-xs font-black uppercase tracking-wider truncate">
                                  {u.nome}
                                </span>
                                <span className={`px-1.5 py-0.2 text-[8px] font-extrabold rounded uppercase ${
                                  u.unidade_id === 2 ? 'bg-blue-500/30 text-blue-300' : 'bg-amber-500/30 text-amber-300'
                                }`}>
                                  Un. {u.unidade_id || 1}
                                </span>
                              </div>
                              <span className="block text-[9px] text-slate-400 truncate">
                                {u.cargo || 'Conselheiro'}
                              </span>
                            </div>
                          </div>

                          {unread > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[9px] rounded-full animate-pulse">
                              {unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* BOTOES DE AVISOS RÁPIDOS */}
              <div className="px-3 py-2 bg-amber-50/70 border-b border-amber-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
                <span className="text-[9px] font-black uppercase text-amber-800 tracking-wider shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Avisos Rápidos:
                </span>
                {quickAlerts.map((a, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(a.text)}
                    className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-lg text-[9px] font-black uppercase tracking-wider whitespace-nowrap shadow-2xs transition-all cursor-pointer active:scale-95"
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* FEED DE MENSAGENS */}
              <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50">
                {channelMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <MessageSquare className="w-10 h-10 mb-2 opacity-30 text-blue-600" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Nenhuma mensagem nesta conversa ainda.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Clique em <strong>"Escolher Destinatário"</strong> para trocar de pessoa ou canal, ou digite abaixo para enviar.
                    </p>
                  </div>
                ) : (
                  channelMessages.map(msg => {
                    const isMe = msg.sender_id === currentUser.id;
                    const timeFormatted = new Date(msg.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-700">
                            {isMe ? 'Você' : msg.sender_name}
                          </span>
                          {msg.sender_cargo && (
                            <span className="text-[8px] font-extrabold uppercase text-slate-400">
                              ({msg.sender_cargo})
                            </span>
                          )}
                          <span className="text-[9px] font-medium text-slate-400">
                            • {timeFormatted}
                          </span>
                          {(isMe || currentUser.perfil === 'ADMIN' || currentUser.nome === 'LUDIMILA' || currentUser.nome === 'LEANDRO') && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-0.5 ml-1 cursor-pointer"
                              title="Excluir mensagem"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div
                          className={`max-w-[88%] px-4 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs break-words ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-xs'
                              : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* PAINEL EXPANSÍVEL DE EMOJIS */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-3 right-3 z-30 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 animate-fadeIn flex flex-col max-h-[220px]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                      Escolha um Emoji
                    </span>
                    <button
                      onClick={() => setShowEmojiPicker(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pt-2">
                    {EMOJI_CATEGORIES.map((cat, idx) => (
                      <div key={idx}>
                        <div className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-1">
                          {cat.category}
                        </div>
                        <div className="grid grid-cols-9 gap-1">
                          {cat.emojis.map((e, eIdx) => (
                            <button
                              key={eIdx}
                              onClick={() => handleInsertEmoji(e)}
                              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-slate-100 rounded-xl transition-transform hover:scale-125 cursor-pointer active:scale-95"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INPUT DE ENVIO DE MENSAGEM COM EMOJIS */}
              <div className="p-3 bg-white border-t border-slate-200 shrink-0 flex flex-col gap-2">
                {/* BARRA DE EMOJIS RÁPIDOS */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider shrink-0 mr-1">
                    Emojis:
                  </span>
                  {QUICK_EMOJIS.map((e, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleInsertEmoji(e)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-amber-100 text-sm rounded-lg transition-transform hover:scale-110 active:scale-95 cursor-pointer shrink-0"
                      title="Inserir Emoji"
                    >
                      {e}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                      showEmojiPicker
                        ? 'bg-amber-400 text-amber-950 font-black'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    }`}
                    title="Mais Emojis"
                  >
                    <Smile className="w-3.5 h-3.5 text-amber-600" />
                    <span>+ Mais</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 flex items-center justify-center ${
                      showEmojiPicker
                        ? 'bg-amber-100 border-amber-300 text-amber-700'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
                    }`}
                    title="Seletor de Emojis"
                  >
                    <Smile className="w-5 h-5 text-amber-500" />
                  </button>

                  <input
                    type="text"
                    placeholder={`Enviar para ${activeChannelInfo.title}...`}
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-slate-100 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-2.5 text-xs text-slate-800 outline-none font-medium transition-all"
                  />

                  <button
                    onClick={() => {
                      handleSendMessage();
                      setShowEmojiPicker(false);
                    }}
                    disabled={!textInput.trim() || isSending}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl transition-all cursor-pointer shadow-md shrink-0 active:scale-95 flex items-center justify-center"
                    title="Enviar mensagem"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}
    </>
  );
};
