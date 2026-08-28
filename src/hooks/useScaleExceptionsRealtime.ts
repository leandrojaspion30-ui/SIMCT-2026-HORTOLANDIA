import { useState, useEffect, useCallback, useRef } from 'react';
import { ScaleException } from '../types';
import { syncCollection, SyncMetadata } from '../lib/db';

export interface UseScaleExceptionsRealtimeResult {
  scaleExceptions: ScaleException[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useScaleExceptionsRealtime(unidadeId?: number): UseScaleExceptionsRealtimeResult {
  const [scaleExceptions, setScaleExceptions] = useState<ScaleException[]>([]);
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

    const unsubscribe = syncCollection<ScaleException>(
      'scale_exceptions',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        let filtered = data;
        if (unidadeId && unidadeId !== 0) {
          filtered = data.filter(e => e.unidade_id === unidadeId);
        }

        setScaleExceptions(filtered);
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
  }, [unidadeId, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    scaleExceptions,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
