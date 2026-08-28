import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage } from '../types';
import { syncCollection, SyncMetadata } from '../lib/db';

export interface UseChatRealtimeOptions {
  limitCount?: number;
}

export interface UseChatRealtimeResult {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useChatRealtime(options?: UseChatRealtimeOptions): UseChatRealtimeResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const isMountedRef = useRef<boolean>(true);

  const recarregarManual = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    setLoading(true);

    const unsubscribe = syncCollection<ChatMessage>(
      'chat_messages',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // Ordenar por data crescente para histórico de chat cronológico
        const sorted = [...data].sort((a, b) => {
          const tA = new Date(a.created_at || 0).getTime();
          const tB = new Date(b.created_at || 0).getTime();
          return tA - tB;
        });

        setMessages(sorted);
        setLoading(false);
        setError(null);
        if (meta) {
          setFromCache(meta.fromCache);
          setUltimaAtualizacao(meta.timestamp.toLocaleTimeString('pt-BR'));
        } else {
          setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
        }
      },
      {
        limitCount: options?.limitCount || 300,
        includeMetadataChanges: true
      }
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [options?.limitCount, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    messages,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
