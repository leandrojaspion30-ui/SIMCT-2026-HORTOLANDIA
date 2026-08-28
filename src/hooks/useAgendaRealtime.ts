import { useState, useEffect, useCallback, useRef } from 'react';
import { AgendaEntry } from '../types';
import { syncCollection, SyncMetadata, SyncOptions } from '../lib/db';

export interface UseAgendaRealtimeOptions {
  unidadeId?: number;
  conselheiroId?: string;
  dataFilter?: string;
  limitCount?: number;
}

export interface UseAgendaRealtimeResult {
  agenda: AgendaEntry[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useAgendaRealtime(options?: UseAgendaRealtimeOptions): UseAgendaRealtimeResult {
  const [agenda, setAgenda] = useState<AgendaEntry[]>([]);
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

    const syncOpts: SyncOptions = {
      whereConditions: whereConditions.length > 0 ? whereConditions : undefined,
      limitCount: options?.limitCount,
      includeMetadataChanges: true
    };

    const unsubscribe = syncCollection<AgendaEntry>(
      'agenda',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // Filtra excluídos e ordena por data/hora
        const active = data.filter(e => !e.excluido);
        const sorted = [...active].sort((a, b) => {
          const dtA = `${a.data}T${a.hora || '00:00'}`;
          const dtB = `${b.data}T${b.hora || '00:00'}`;
          return dtA.localeCompare(dtB);
        });

        let filtered = sorted;
        if (options?.conselheiroId) {
          filtered = filtered.filter(
            e => e.conselheiro_id === options.conselheiroId || (e.participantes && e.participantes.includes(options.conselheiroId!))
          );
        }
        if (options?.dataFilter) {
          filtered = filtered.filter(e => e.data === options.dataFilter);
        }

        setAgenda(filtered);
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
  }, [options?.unidadeId, options?.conselheiroId, options?.dataFilter, options?.limitCount, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    agenda,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
