import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from '../types';
import { syncCollection, SyncMetadata } from '../lib/db';

export interface UseUsersRealtimeOptions {
  unidadeId?: number;
  statusFilter?: string;
}

export interface UseUsersRealtimeResult {
  users: User[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useUsersRealtime(options?: UseUsersRealtimeOptions): UseUsersRealtimeResult {
  const [users, setUsers] = useState<User[]>([]);
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

    const unsubscribe = syncCollection<User & { senha?: string }>(
      'users',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // SEGURANÇA: Remove qualquer campo sensível de senha antes de expor aos consumidores
        const sanitizedUsers: User[] = data.map(rawUser => {
          const { senha, ...safeUser } = rawUser;
          return safeUser as User;
        });

        // Ordena por nome
        let sorted = sanitizedUsers.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        if (options?.unidadeId && options.unidadeId !== 0) {
          sorted = sorted.filter(u => u.unidade_id === options.unidadeId);
        }

        if (options?.statusFilter) {
          sorted = sorted.filter(u => u.status === options.statusFilter);
        }

        setUsers(sorted);
        setLoading(false);
        setError(null);
        if (meta) {
          setFromCache(meta.fromCache);
          setUltimaAtualizacao(meta.timestamp.toLocaleTimeString('pt-BR'));
        } else {
          setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [options?.unidadeId, options?.statusFilter, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    users,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
