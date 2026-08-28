import { useState, useEffect, useCallback, useRef } from 'react';
import { LegalDocument, LegalLibraryService, BASE_LEGAL_DOCUMENTS } from '../services/legalLibrary';
import { syncCollection, SyncMetadata } from '../lib/db';

export interface UseLegalLibraryRealtimeOptions {
  category?: string;
  sphere?: string;
  searchQuery?: string;
}

export interface UseLegalLibraryRealtimeResult {
  documents: LegalDocument[];
  loading: boolean;
  error: string | null;
  ultimaAtualizacao: string | null;
  fromCache: boolean;
  syncState: 'synced' | 'connecting' | 'offline';
  recarregarManual: () => void;
}

export function useLegalLibraryRealtime(options?: UseLegalLibraryRealtimeOptions): UseLegalLibraryRealtimeResult {
  const [documents, setDocuments] = useState<LegalDocument[]>(BASE_LEGAL_DOCUMENTS);
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

    const unsubscribe = syncCollection<LegalDocument & { id: string }>(
      'legal_library',
      (firestoreDocs, meta?: SyncMetadata) => {
        if (!isMountedRef.current) return;

        // Mesclar documentos base e documentos do Firestore
        const baseMap = new Map<string, LegalDocument>();
        BASE_LEGAL_DOCUMENTS.forEach(d => {
          if (d.id) baseMap.set(d.id, d);
        });

        firestoreDocs.forEach(d => {
          if (d.id) baseMap.set(d.id, d);
        });

        let allDocs = Array.from(baseMap.values());

        // Filtragem por categoria
        if (options?.category) {
          allDocs = allDocs.filter(d => d.category === options.category);
        }

        // Filtragem por esfera
        if (options?.sphere) {
          allDocs = allDocs.filter(d => d.sphere === options.sphere);
        }

        // Filtragem por busca
        if (options?.searchQuery && options.searchQuery.trim()) {
          const q = options.searchQuery.toLowerCase().trim();
          allDocs = allDocs.filter(doc => {
            return (
              doc.name?.toLowerCase().includes(q) ||
              doc.summary?.toLowerCase().includes(q) ||
              doc.number?.toLowerCase().includes(q) ||
              doc.subjects?.some(s => s.toLowerCase().includes(q)) ||
              doc.keywords?.some(k => k.toLowerCase().includes(q)) ||
              doc.content?.toLowerCase().includes(q)
            );
          });
        }

        setDocuments(allDocs);
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
  }, [options?.category, options?.sphere, options?.searchQuery, refreshKey]);

  const syncState = loading ? 'connecting' : (fromCache ? 'offline' : 'synced');

  return {
    documents,
    loading,
    error,
    ultimaAtualizacao,
    fromCache,
    syncState,
    recarregarManual
  };
}
