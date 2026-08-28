import { useState, useEffect, useCallback, useRef } from 'react';
import { Documento } from '../types';
import { syncCollection, SyncMetadata, SyncOptions } from '../lib/db';

export interface UseDocumentsRealtimeOptions {
  unidadeId?: number;
  statusFilter?: string;
  conselheiroId?: string;
  limitCount?: number;
}

export interface UseDocumentsRealtimeResult {
  documents: Documento[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  hasPendingWrites: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useDocumentsRealtime(options?: UseDocumentsRealtimeOptions): UseDocumentsRealtimeResult {
  const [documents, setDocuments] = useState<Documento[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [hasPendingWrites, setHasPendingWrites] = useState<boolean>(false);
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
    if (options?.conselheiroId) {
      whereConditions.push({ field: 'conselheiro_referencia_id', op: '==', value: options.conselheiroId });
    }

    const syncOpts: SyncOptions = {
      whereConditions: whereConditions.length > 0 ? whereConditions : undefined,
      limitCount: options?.limitCount,
      includeMetadataChanges: true
    };

    const unsubscribe = syncCollection<Documento>(
      'documents',
      (data, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // Ordenação inteligente no cliente (mais recentes primeiro)
        const sorted = [...data].sort((a, b) => {
          const dateA = new Date(a.criado_em || a.data_aporte || 0).getTime();
          const dateB = new Date(b.criado_em || b.data_aporte || 0).getTime();
          return dateB - dateA;
        });

        // Filtragem opcional de status se solicitado (suporta array e string)
        let filtered = sorted;
        if (options?.statusFilter) {
          filtered = sorted.filter(d => {
            if (Array.isArray(d.status)) {
              return d.status.includes(options.statusFilter as any);
            }
            return (d.status as any) === options.statusFilter;
          });
        }

        setDocuments(filtered);
        setLoading(false);
        setError(null);
        if (meta) {
          setFromCache(meta.fromCache);
          setHasPendingWrites(meta.hasPendingWrites);
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
  }, [options?.unidadeId, options?.statusFilter, options?.conselheiroId, options?.limitCount, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    documents,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    hasPendingWrites,
    syncState,
    recarregarManual
  };
}
