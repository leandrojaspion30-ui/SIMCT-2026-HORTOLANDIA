import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, X, Users, User as UserIcon, Bell, Minimize2, Maximize2, Shield, AlertCircle, CheckCheck, Trash2, Sparkles, ChevronDown, ChevronLeft, Search, Building2, Globe, UserCheck, Check, Smile, Lock } from 'lucide-react';
import { User, ChatMessage } from '../types';
import { saveChatMessage, deleteChatMessage, markChatMessageAsRead, hideChatMessageForUser, hideConversationForUser } from '../lib/db';

export interface InternalChatWidgetProps {
  currentUser: User;
  users: User[];
  messages: ChatMessage[];
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const isConselheiroUser = (u: User) => {
  if (!u) return false;
  if (u.perfil === 'CONSELHEIRO') return true;
  if (u.is_suplente_active || u.substituicao_ativa) return true;
  if (u.cargo && u.cargo.toLowerCase().includes('conselhei') && !u.cargo.toLowerCase().includes('adm')) return true;
  return false;
};

export const InternalChatWidget: React.FC<InternalChatWidgetProps> = ({
  currentUser,
  users,
  messages,
  isOpen,
  onToggleOpen
}) => {
  const defaultChannel = currentUser.unidade_id === 2 ? 'ALL_U2' : 'ALL_U1';
  const [viewMode, setViewMode] = useState<'LIST' | 'CHAT'>('LIST');
  const [activeChannel, setActiveChannel] = useState<string>(defaultChannel);
  
  const [unitFilter, setUnitFilter] = useState<'U1' | 'U2' | 'ALL'>(
    currentUser.unidade_id === 2 ? 'U2' : 'U1'
  );
  
  const [textInput, setTextInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [lastNotification, setLastNotification] = useState<{ text: string, sender: string, channelId: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Helper for online status
  const isOnline = (u: User) => {
    if (!u.last_heartbeat) return false;
    const lastHB = new Date(u.last_heartbeat).getTime();
    const now = Date.now();
    return (now - lastHB) < 60000; // 60 seconds threshold
  };

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

  // Helper function to play a distinctive WhatsApp-style notification sound
  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTones = () => {
        const now = ctx.currentTime;
        
        // WhatsApp notification often has a quick "pop" or double high-tone
        // Tone 1: High crisp beep
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now); // A5
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.2, now + 0.01);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.1);

        // Tone 2: Slightly higher second beep
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1046.50, now + 0.08); // C6
        gain2.gain.setValueAtTime(0, now + 0.08);
        gain2.gain.linearRampToValueAtTime(0.25, now + 0.09);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.25);
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playTones);
      } else {
        playTones();
      }
    } catch (e) {
      console.warn('Erro ao tocar som do chat:', e);
    }
  };

  // PRIVACIDADE E FILTRAGEM RIGOROSA DE MENSAGENS DO USUÁRIO
  // O usuário só vê mensagens:
  // 1. Enviadas por ele
  // 2. Enviadas diretamente para ele (1-on-1)
  // 3. Enviadas no canal Geral - Todos os Usuários
  // 4. Enviadas no canal Geral da SUA Unidade (Unidade 1 ou Unidade 2)
  // 5. Enviadas no Colegiado I (SE for Conselheiro da Unidade 1)
  // 6. Enviadas no Colegiado II (SE for Conselheiro da Unidade 2)
  const userVisibleMessages = useMemo(() => {
    const myIdStr = String(currentUser.id);
    const myUnit = currentUser.unidade_id || 1;
    const isCons = isConselheiroUser(currentUser);

    return messages.filter(m => {
      // Se a mensagem foi apagada/ocultada para este usuário específico, não exibe!
      const deletedForList = m.deleted_for || [];
      if (deletedForList.includes(myIdStr) || deletedForList.includes(currentUser.id)) {
        return false;
      }

      const senderIdStr = String(m.sender_id);
      const recipientIdStr = m.recipient_id ? String(m.recipient_id) : '';

      // Eu sou o remetente
      if (senderIdStr === myIdStr) return true;

      // Mensagem direta para mim
      if (recipientIdStr === myIdStr) return true;

      // Grupo Geral do Sistema (Todos os Usuários)
      if (recipientIdStr === 'ALL_SYSTEM' || recipientIdStr === 'ALL') return true;

      // Grupo Geral da Unidade 1
      if (recipientIdStr === 'ALL_U1' || (!m.recipient_id && m.unidade_id === 1)) {
        return myUnit === 1;
      }

      // Grupo Geral da Unidade 2
      if (recipientIdStr === 'ALL_U2' || (!m.recipient_id && m.unidade_id === 2)) {
        return myUnit === 2;
      }

      // Colegiado I (Exclusivo Conselheiros Tutelares Unidade 1)
      if (recipientIdStr === 'COLEGIADO_U1') {
        return myUnit === 1 && isCons;
      }

      // Colegiado II (Exclusivo Conselheiros Tutelares Unidade 2)
      if (recipientIdStr === 'COLEGIADO_U2') {
        return myUnit === 2 && isCons;
      }

      // Nenhuma outra mensagem entre terceiros deve ser vista!
      return false;
    });
  }, [messages, currentUser]);

  // Mensagens não lidas visíveis para este usuário
  const unreadMessages = useMemo(() => {
    const myIdStr = String(currentUser.id);
    return userVisibleMessages.filter(m => {
      if (String(m.sender_id) === myIdStr) return false;
      const readList = m.read_by || [];
      return !readList.includes(currentUser.id) && !readList.includes(myIdStr);
    });
  }, [userVisibleMessages, currentUser]);

  const totalUnreadCount = unreadMessages.length;

  // Monitorar novas mensagens recebidas para emitir SOM e exibir notificação visual
  const prevMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (lastNotification) {
      const timer = setTimeout(() => setLastNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [lastNotification]);

  useEffect(() => {
    const currentIds = new Set(userVisibleMessages.map(m => m.id));

    if (isInitialLoadRef.current) {
      prevMessageIdsRef.current = currentIds;
      isInitialLoadRef.current = false;
      return;
    }

    let hasNewIncoming = false;
    let newestMsg: ChatMessage | null = null;
    let newestSenderChannel: string | null = null;

    userVisibleMessages.forEach(m => {
      if (!prevMessageIdsRef.current.has(m.id)) {
        // Nova mensagem que não foi enviada por mim
        if (String(m.sender_id) !== String(currentUser.id)) {
          hasNewIncoming = true;
          newestMsg = m;
          if (m.recipient_id === 'COLEGIADO_U1') newestSenderChannel = 'COLEGIADO_U1';
          else if (m.recipient_id === 'COLEGIADO_U2') newestSenderChannel = 'COLEGIADO_U2';
          else if (m.recipient_id === 'ALL_U1') newestSenderChannel = 'ALL_U1';
          else if (m.recipient_id === 'ALL_U2') newestSenderChannel = 'ALL_U2';
          else if (m.recipient_id === 'ALL_SYSTEM' || m.recipient_id === 'ALL') newestSenderChannel = 'ALL_SYSTEM';
          else newestSenderChannel = String(m.sender_id);
        }
      }
    });

    if (hasNewIncoming && newestMsg) {
      // Tocar alerta sonoro!
      playNotificationSound();

      // Notificação Visual se o chat não estiver focado nessa conversa
      const isChatFocussed = isOpen && !isMinimized && viewMode === 'CHAT' && String(activeChannel) === String(newestSenderChannel);
      
      if (!isChatFocussed) {
        setLastNotification({
          text: newestMsg.text,
          sender: newestMsg.sender_name,
          channelId: newestSenderChannel || 'ALL_SYSTEM'
        });
      }
    }

    prevMessageIdsRef.current = currentIds;
  }, [userVisibleMessages, currentUser.id, isOpen, isMinimized, viewMode, activeChannel]);

  // Helper para abrir/alternar o chat
  const handleToggleChat = () => {
    onToggleOpen();
    if (!isOpen) {
      setViewMode('LIST');
    }
  };

  // Helper for unread count per specific channel
  const getUnreadForChannel = useCallback((channelKey: string) => {
    return unreadMessages.filter(m => {
      if (channelKey === 'COLEGIADO_U1') {
        return m.recipient_id === 'COLEGIADO_U1';
      }
      if (channelKey === 'COLEGIADO_U2') {
        return m.recipient_id === 'COLEGIADO_U2';
      }
      if (channelKey === 'ALL_U1') {
        return (m.recipient_id === 'ALL_U1' || (!m.recipient_id && m.unidade_id === 1));
      }
      if (channelKey === 'ALL_U2') {
        return (m.recipient_id === 'ALL_U2' || (!m.recipient_id && m.unidade_id === 2));
      }
      if (channelKey === 'ALL_SYSTEM') {
        return m.recipient_id === 'ALL_SYSTEM' || m.recipient_id === 'ALL';
      }
      // Direct 1-on-1
      return String(m.sender_id) === String(channelKey);
    }).length;
  }, [unreadMessages]);

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
    return userVisibleMessages
      .filter(m => {
        if (activeChannel === 'COLEGIADO_U1') {
          return m.recipient_id === 'COLEGIADO_U1';
        }
        if (activeChannel === 'COLEGIADO_U2') {
          return m.recipient_id === 'COLEGIADO_U2';
        }
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
  }, [userVisibleMessages, currentUser, activeChannel]);

  // Mark active channel messages as read
  useEffect(() => {
    if (isOpen && !isMinimized && channelMessages.length > 0) {
      const myIdStr = String(currentUser.id);
      channelMessages.forEach(msg => {
        if (String(msg.sender_id) !== myIdStr) {
          const reads = (msg.read_by || []).map(id => String(id));
          if (!reads.includes(myIdStr)) {
            markChatMessageAsRead(msg.id, myIdStr);
          }
        }
      });
    }
  }, [isOpen, isMinimized, channelMessages, currentUser.id]);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen && !isMinimized && viewMode === 'CHAT') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [channelMessages, isOpen, isMinimized, viewMode]);

  // Map of last messages per channel for the list preview
  const lastMessagesMap = useMemo(() => {
    const map: Record<string, ChatMessage> = {};
    userVisibleMessages.forEach(m => {
      let channelId = '';
      if (m.recipient_id && ['COLEGIADO_U1', 'COLEGIADO_U2', 'ALL_U1', 'ALL_U2', 'ALL_SYSTEM', 'ALL'].includes(m.recipient_id)) {
        channelId = m.recipient_id === 'ALL' ? (m.unidade_id === 1 ? 'ALL_U1' : 'ALL_U2') : m.recipient_id;
      } else {
        // Private chat
        const otherId = String(m.sender_id) === String(currentUser.id) ? String(m.recipient_id) : String(m.sender_id);
        channelId = otherId;
      }

      if (channelId) {
        const existing = map[channelId];
        if (!existing || new Date(m.created_at) > new Date(existing.created_at)) {
          map[channelId] = m;
        }
      }
    });
    return map;
  }, [userVisibleMessages, currentUser.id]);

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
    if (window.confirm("Deseja apagar esta mensagem do SEU chat? (Ela continuará visível para os outros participantes).")) {
      await hideChatMessageForUser(msgId, currentUser.id);
    }
  };

  const handleClearConversation = async () => {
    if (channelMessages.length === 0) return;
    const channelName = activeChannelInfo.title;
    if (window.confirm(`Deseja apagar as mensagens da conversa "${channelName}" APENAS para você?\n\n(Os outros participantes continuarão vendo o histórico de mensagens).`)) {
      try {
        await hideConversationForUser(channelMessages.map(m => m.id), currentUser.id);
      } catch (err) {
        console.error('Erro ao apagar conversa para o usuário:', err);
      }
    }
  };

  // Human readable channel label
  const activeChannelInfo = useMemo(() => {
    if (activeChannel === 'COLEGIADO_U1') {
      return { title: 'Colegiado I', sub: 'Exclusivo Conselheiros Tutelares - Unidade I', icon: <Users className="w-4 h-4 text-amber-400" /> };
    }
    if (activeChannel === 'COLEGIADO_U2') {
      return { title: 'Colegiado II', sub: 'Exclusivo Conselheiros Tutelares - Unidade II', icon: <Users className="w-4 h-4 text-blue-400" /> };
    }
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
      {/* Notificação Toast Flutuante (Visual Alert) */}
      {lastNotification && (
        <div 
          className="fixed bottom-24 right-6 z-[60] w-72 bg-white rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-slideIn cursor-pointer"
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
            if (!isOpen) onToggleOpen();
            setActiveChannel(lastNotification.channelId);
            setViewMode('CHAT');
            setLastNotification(null);
          }}
        >
          <div className="bg-[#075E54] px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-white" />
              <span className="text-[10px] font-black text-white uppercase tracking-wider">Nova Mensagem</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setLastNotification(null); }}>
              <X className="w-3.5 h-3.5 text-white/70 hover:text-white" />
            </button>
          </div>
          <div className="p-3 flex gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
              <UserIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-black text-slate-800 truncate">{lastNotification.sender}</p>
              <p className="text-[11px] text-slate-500 line-clamp-2 leading-snug">{lastNotification.text}</p>
            </div>
          </div>
          <div className="h-1 bg-[#25D366] animate-progress" style={{ animationDuration: '6000ms' }} />
        </div>
      )}

      {/* Botão Flutuante Estilo WhatsApp (Draggable) */}
      {(!isOpen || isMinimized) && (
        <motion.button
          drag
          dragConstraints={{ 
            left: -(window.innerWidth - 80), 
            right: 0, 
            top: -(window.innerHeight - 80), 
            bottom: 0 
          }}
          dragElastic={0.1}
          dragMomentum={false}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (isMinimized) setIsMinimized(false);
            handleToggleChat();
          }}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl transition-shadow duration-300 flex items-center justify-center group cursor-grab active:cursor-grabbing border-2 border-white/20 touch-none"
          title="Segure para arrastar ou clique para abrir"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white fill-white/10 group-hover:scale-105 transition-transform" />
            {totalUnreadCount > 0 && (
              <span className="absolute -top-3 -right-3 min-w-6 h-6 px-1.5 bg-red-600 text-white text-[11px] font-black flex items-center justify-center rounded-full animate-pulse shadow-md border-2 border-white">
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </span>
            )}
          </div>
        </motion.button>
      )}

      {/* Janela Do Chat */}
      {isOpen && !isMinimized && (
        <div 
          className="fixed right-3 sm:right-6 bottom-3 sm:bottom-6 z-50 w-[94vw] sm:w-[420px] h-[640px] max-h-[85vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 animate-fadeIn border border-slate-200"
        >
          {/* Header WhatsApp */}
          <div className="bg-[#075E54] text-white px-4 py-3.5 flex items-center justify-between shadow-lg shrink-0">
            <div className="flex items-center gap-3">
              {viewMode === 'CHAT' && (
                <button 
                  onClick={() => setViewMode('LIST')}
                  className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {viewMode === 'CHAT' ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/10">
                      {activeChannelInfo.icon}
                    </div>
                    {(() => {
                      const targetUser = users.find(u => u.id === activeChannel);
                      return targetUser && isOnline(targetUser) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#25D366] border-2 border-[#075E54] rounded-full" />
                      );
                    })()}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold leading-tight">{activeChannelInfo.title}</h4>
                    <p className="text-[11px] text-emerald-100/80 font-medium">
                      {(() => {
                        const targetUser = users.find(u => u.id === activeChannel);
                        if (targetUser) {
                          if (isOnline(targetUser)) return 'online';
                          if (!targetUser.last_heartbeat) return 'visto por último recentemente';
                          
                          const lastHB = new Date(targetUser.last_heartbeat);
                          const now = new Date();
                          const diffMs = now.getTime() - lastHB.getTime();
                          const diffMin = Math.floor(diffMs / 60000);
                          const diffHrs = Math.floor(diffMin / 60);
                          const diffDays = Math.floor(diffHrs / 24);

                          if (diffMin < 1) return 'visto por último agora mesmo';
                          if (diffMin < 60) return `visto por último há ${diffMin} min`;
                          if (diffHrs < 24) return `visto por último há ${diffHrs} h`;
                          if (diffDays === 1) return 'visto por último ontem';
                          return `visto por último em ${lastHB.toLocaleDateString()}`;
                        }
                        return activeChannelInfo.sub;
                      })()}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h3 className="text-[19px] font-bold tracking-tight">WhatsApp SIMCT</h3>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsMinimized(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={onToggleOpen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-[#EFEAE2] relative overflow-hidden">
            {viewMode === 'LIST' ? (
              /* LISTA DE CONVERSAS (WhatsApp Style) */
              <div className="flex flex-col h-full bg-white animate-slideIn">
                {/* Busca e Filtros */}
                <div className="p-3 border-b border-slate-100 space-y-3 shrink-0">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Pesquisar ou começar uma nova conversa"
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      className="w-full bg-[#F0F2F5] border-none rounded-xl pl-10 pr-4 py-2 text-sm placeholder-slate-500 focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {['ALL', 'U1', 'U2'].map((u) => (
                      <button
                        key={u}
                        onClick={() => setUnitFilter(u as any)}
                        className={`px-4 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap transition-all border ${
                          unitFilter === u 
                            ? 'bg-[#25D366] text-white border-[#25D366] shadow-md' 
                            : 'bg-[#F0F2F5] text-slate-600 border-[#F0F2F5] hover:bg-[#E3E6EA]'
                        }`}
                      >
                        {u === 'ALL' ? 'Todos' : u === 'U1' ? 'Unidade I' : 'Unidade II'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Contatos/Grupos */}
                <div className="flex-1 overflow-y-auto">
                  {/* Canais de Grupo */}
                  <div className="p-4 space-y-1">
                    <h5 className="text-[11px] font-bold text-[#008069] uppercase tracking-wider mb-2">Canais e Grupos</h5>
                    
                    {[
                      { id: 'ALL_SYSTEM', title: 'Geral - Sistema', icon: <Globe className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600' },
                      { id: 'COLEGIADO_U1', title: 'Colegiado I', icon: <Shield className="w-5 h-5" />, color: 'bg-amber-100 text-amber-600', unit: 1, consOnly: true },
                      { id: 'COLEGIADO_U2', title: 'Colegiado II', icon: <Shield className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600', unit: 2, consOnly: true },
                      { id: 'ALL_U1', title: 'Unidade I', icon: <Building2 className="w-5 h-5" />, color: 'bg-amber-50 text-amber-500', unit: 1 },
                      { id: 'ALL_U2', title: 'Unidade II', icon: <Building2 className="w-5 h-5" />, color: 'bg-blue-50 text-blue-500', unit: 2 },
                    ].filter(g => {
                      if (g.unit && unitFilter !== 'ALL' && unitFilter !== `U${g.unit}`) return false;
                      if (g.consOnly && !isConselheiroUser(currentUser)) return false;
                      if (g.unit && g.unit !== currentUser.unidade_id && g.id.startsWith('COLEGIADO')) return false;
                      return true;
                    }).map((group) => {
                      const lastMsg = lastMessagesMap[group.id];
                      const unread = getUnreadForChannel(group.id);
                      return (
                        <button
                          key={group.id}
                          onClick={() => {
                            setActiveChannel(group.id);
                            setViewMode('CHAT');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#F5F6F6] transition-colors rounded-xl group"
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${group.color}`}>
                            {group.icon}
                          </div>
                          <div className="flex-1 min-w-0 border-b border-slate-100 pb-3 group-last:border-none">
                            <div className="flex justify-between items-start">
                              <h4 className="text-[15px] font-bold text-[#111B21] truncate">{group.title}</h4>
                              {lastMsg && (
                                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap ml-2">
                                  {new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <div className="text-[13px] text-slate-500 truncate pr-4">
                                {lastMsg ? (
                                  <>
                                    <span className="font-semibold text-slate-600">{lastMsg.sender_name.split(' ')[0]}: </span>
                                    {lastMsg.text}
                                  </>
                                ) : 'Nenhuma mensagem enviada'}
                              </div>
                              {unread > 0 && (
                                <span className="bg-[#25D366] text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Lista de Usuários */}
                  <div className="p-4 pt-0 space-y-1">
                    <h5 className="text-[11px] font-bold text-[#008069] uppercase tracking-wider mb-2">Contatos ({availableUsers.length})</h5>
                    {availableUsers.map(u => {
                      const lastMsg = lastMessagesMap[u.id];
                      const unread = getUnreadForChannel(u.id);
                      const online = isOnline(u);
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setActiveChannel(u.id);
                            setViewMode('CHAT');
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-[#F5F6F6] transition-colors rounded-xl group"
                        >
                          <div className="relative shrink-0">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-lg border border-indigo-100">
                              {u.nome.charAt(0).toUpperCase()}
                            </div>
                            {online && (
                              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#25D366] border-2 border-white rounded-full shadow-sm" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 border-b border-slate-100 pb-3 group-last:border-none">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 truncate">
                                <h4 className="text-[15px] font-bold text-[#111B21] truncate">{u.nome}</h4>
                                <span className={`px-1.5 py-0.5 text-[9px] font-black rounded uppercase ${
                                  u.unidade_id === 2 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                  Un. {u.unidade_id || 1}
                                </span>
                              </div>
                              {lastMsg && (
                                <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap ml-2">
                                  {new Date(lastMsg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                              <div className="text-[13px] text-slate-500 truncate pr-4">
                                {lastMsg ? (
                                  <span className="flex items-center gap-1">
                                    {String(lastMsg.sender_id) === String(currentUser.id) && (
                                      <CheckCheck className={`w-3.5 h-3.5 ${(lastMsg.read_by || []).length > 1 ? 'text-sky-500' : 'text-slate-400'}`} />
                                    )}
                                    {lastMsg.text}
                                  </span>
                                ) : (u.cargo || 'Funcionário')}
                              </div>
                              {unread > 0 && (
                                <span className="bg-[#25D366] text-white text-[10px] font-black min-w-[20px] h-5 rounded-full flex items-center justify-center px-1 shadow-sm">
                                  {unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* CONVERSA ATIVA (CHAT WhatsApp Style) */
              <div className="flex-1 flex flex-col min-h-0 bg-[#EFEAE2] animate-slideIn">
                <div className="flex-1 p-4 overflow-y-auto space-y-4 scroll-smooth">
                  {channelMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
                      <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                        <Lock className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-1">Criptografia de Ponta a Ponta</p>
                      <p className="text-[11px] text-slate-500 max-w-[200px]">As mensagens internas são protegidas e visíveis apenas para os envolvidos.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between px-2 py-1 mb-2 bg-white/40 backdrop-blur-md border border-slate-200/40 rounded-lg text-[10px] text-slate-600 font-bold shrink-0">
                        <span>Mensagens: <strong>{channelMessages.length}</strong></span>
                        <button
                          onClick={handleClearConversation}
                          className="text-red-600 hover:text-red-700 font-black uppercase text-[9px] flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Limpar Conversa</span>
                        </button>
                      </div>

                      {channelMessages.map((msg, idx) => {
                        const isMe = String(msg.sender_id) === String(currentUser.id);
                        const msgDate = new Date(msg.created_at);
                        const timeStr = msgDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                        
                        const showDateHeader = idx === 0 || 
                          new Date(channelMessages[idx-1].created_at).toDateString() !== msgDate.toDateString();

                        const reads = (msg.read_by || []).map(id => String(id));
                        const isRead = reads.filter(id => id !== String(currentUser.id) && id !== String(msg.sender_id)).length > 0;

                        return (
                          <React.Fragment key={msg.id}>
                            {showDateHeader && (
                              <div className="flex justify-center my-4">
                                <span className="bg-[#FFFFFF]/90 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-slate-500 shadow-sm border border-slate-200/50 tracking-widest">
                                  {msgDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                                </span>
                              </div>
                            )}
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn group relative`}>
                              {!isMe && (
                                <div className="flex items-center gap-1 mb-1 px-2">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-[#075E54]">
                                    {msg.sender_name}
                                  </span>
                                </div>
                              )}
                              <div className={`max-w-[85%] min-w-[70px] relative rounded-xl px-3 py-1.5 shadow-sm text-[14.5px] font-medium leading-normal ${
                                isMe 
                                  ? 'bg-[#D9FDD3] text-[#111B21] rounded-tr-none border border-[#B7E4A9]' 
                                  : 'bg-white text-[#111B21] rounded-tl-none border border-slate-200'
                              }`}>
                                <div className={`absolute top-0 w-3 h-3 ${
                                  isMe 
                                    ? '-right-1.5 bg-[#D9FDD3] [clip-path:polygon(0_0,0_100%,100%_0)]' 
                                    : '-left-1.5 bg-white [clip-path:polygon(100%_0,100%_100%,0_0)]'
                                }`} />
                                
                                <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                                
                                <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-slate-500/80 font-bold uppercase tracking-tighter">
                                  <span>{timeStr}</span>
                                  {isMe && (
                                    <div className="ml-1">
                                      <CheckCheck className={`w-4 h-4 ${isRead ? 'text-sky-500' : 'text-slate-400'}`} />
                                    </div>
                                  )}
                                </div>

                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className={`absolute top-0 ${isMe ? '-left-8' : '-right-8'} p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer`}
                                  title="Apagar para mim"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area WhatsApp style */}
                <div className="bg-[#F0F2F5] p-2.5 flex items-center gap-2 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-slate-200 shrink-0">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`p-2 transition-all rounded-full ${showEmojiPicker ? 'bg-amber-100 text-amber-600' : 'text-slate-500 hover:bg-slate-200'}`}
                  >
                    <Smile className="w-6 h-6" />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Mensagem"
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-white border-none rounded-xl px-4 py-2.5 text-[15px] placeholder-slate-400 shadow-sm outline-none focus:ring-0"
                    />
                    {showEmojiPicker && (
                      <div className="absolute bottom-full left-0 mb-3 w-[280px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slideUp z-50">
                        <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Emojis</span>
                          <button onClick={() => setShowEmojiPicker(false)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2 max-h-[220px] overflow-y-auto space-y-3">
                          {EMOJI_CATEGORIES.map((cat, ci) => (
                            <div key={ci}>
                              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1.5 px-1">{cat.category}</p>
                              <div className="grid grid-cols-6 gap-1">
                                {cat.emojis.map((emoji, ei) => (
                                  <button
                                    key={ei}
                                    onClick={() => handleInsertEmoji(emoji)}
                                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!textInput.trim() || isSending}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                      textInput.trim() ? 'bg-[#00A884] text-white shadow-md active:scale-90' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
