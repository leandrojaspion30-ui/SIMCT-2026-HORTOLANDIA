import { useState, useEffect, useCallback, useRef } from 'react';
import { Log } from '../types';
import { syncCollection, SyncMetadata, SyncOptions } from '../lib/db';

export interface UseLogsRealtimeOptions {
  unidadeId?: number;
  limitCount?: number;
  documentId?: string;
}

export interface UseLogsRealtimeResult {
  logs: Log[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useLogsRealtime(options?: UseLogsRealtimeOptions): UseLogsRealtimeResult {
  const [logs, setLogs] = useState<Log[]>([]);
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

    const whereConditions: { field: string; op: any; value: any }[] = [];
    if (options?.unidadeId && options.unidadeId !== 0) {
      whereConditions.push({ field: 'unidade_id', op: '==', value: options.unidadeId });
    }
    if (options?.documentId) {
      whereConditions.push({ field: 'documento_id', op: '==', value: options.documentId });
    }

    const syncOpts: SyncOptions = {
      whereConditions: whereConditions.length > 0 ? whereConditions : undefined,
      limitCount: options?.limitCount || 200,
      includeMetadataChanges: true
    };

    const unsubscribe = syncCollection<Log>(
      'logs',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // Ordenar por data mais recente
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.data_hora || 0).getTime();
          const dateB = new Date(b.data_hora || 0).getTime();
          return dateB - dateA;
        });

        setLogs(sorted);
        setLoading(false);
        setError(null);
        if (meta) {
          setFromCache(meta.fromCache);
          setUltimaAtualizacao(meta.timestamp.toLocaleTimeString('pt-BR'));
        } else {
          setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR'));
        }
      },
      syncOpts
    );

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, [options?.unidadeId, options?.documentId, options?.limitCount, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    logs,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
