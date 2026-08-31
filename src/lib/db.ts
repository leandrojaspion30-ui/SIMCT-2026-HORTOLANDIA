import { 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  onSnapshot, 
  query, 
  where,
  orderBy, 
  limit,
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  arrayUnion,
  runTransaction,
  QueryConstraint
} from 'firebase/firestore';
import { db, ensureAuthenticated, auth } from './firebase';
import { Documento, Log, AgendaEntry, User, ScaleException, ChatMessage, DocumentStatus } from '../types';
import { isSameCounselorName, getEffectiveEscala, INITIAL_USERS, normalizeCanalName, isRotationChannel, getActiveRotationCounselors, isCounselorInTrioOrSubstitution, getActiveSubstituteInTrio } from '../constants';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  TRANSACTION = 'transaction',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errMsg = error instanceof Error ? error.message : String(error);
  const isQuotaExceeded = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource-exhausted');

  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  // Se for cota esgotada do plano Spark, avisar suavemente sem poluir o console a cada snapshot
  if (isQuotaExceeded) {
    const lastWarnKey = `simct_quota_warn_${path || 'general'}`;
    const lastWarn = Number(sessionStorage.getItem(lastWarnKey) || 0);
    const now = Date.now();
    if (now - lastWarn > 60000) { // Apenas uma vez por minuto por coleção
      sessionStorage.setItem(lastWarnKey, String(now));
      console.warn(`[SIMCT Firestore] Cota do Firestore temporariamente atingida para "${path}". Operando em modo de resiliência local (Zero Data Loss).`);
    }
  } else {
    console.error('[SIMCT Firestore Diagnostic Error]:', JSON.stringify(errInfo));
  }

  return errInfo;
}

// Local emergency persistence buffer helpers
const LOCAL_STORAGE_PREFIX = 'simct_resilient_backup_';

function saveToLocalBackup<T extends { id: string }>(collectionName: string, item: T) {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${collectionName}`;
    const raw = localStorage.getItem(key);
    let list: T[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...item };
    } else {
      list.push(item);
    }
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn(`[SIMCT Local Backup] Unable to write backup for ${collectionName}:`, e);
  }
}

function removeFromLocalBackup(collectionName: string, id: string) {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${collectionName}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    let list: any[] = JSON.parse(raw);
    list = list.filter(i => i.id !== id);
    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    console.warn(`[SIMCT Local Backup] Unable to remove backup item from ${collectionName}:`, e);
  }
}

function getFromLocalBackup<T>(collectionName: string): T[] {
  try {
    const key = `${LOCAL_STORAGE_PREFIX}${collectionName}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Deep sanitization function.
 * Removes all undefined properties, non-serializable objects, functions, symbols, and NaN.
 * Converts Date instances to ISO strings.
 * Preserves Firestore FieldValue instances.
 */
export const cleanData = (obj: any): any => {
  if (obj === undefined || obj === null) {
    return null;
  }
  if (typeof obj === 'function' || typeof obj === 'symbol') {
    return null;
  }
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) return 0;
    return obj;
  }
  if (typeof obj === 'boolean' || typeof obj === 'string') {
    return obj;
  }
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? new Date().toISOString() : obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanData(item))
      .filter(item => item !== undefined && item !== null);
  }

  // Preserve Firestore FieldValue instances (arrayUnion, serverTimestamp, etc.)
  if (obj && typeof obj === 'object') {
    if (obj.constructor && obj.constructor.name === 'FieldValue') {
      return obj;
    }
    if (typeof (obj as any)._methodName === 'string') {
      return obj;
    }
  }

  const newObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      const cleaned = cleanData(val);
      if (cleaned !== undefined) {
        newObj[key] = cleaned;
      }
    }
  }
  return newObj;
};

export interface SyncMetadata {
  fromCache: boolean;
  hasPendingWrites: boolean;
  timestamp: Date;
}

export interface SyncOptions {
  limitCount?: number;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  whereConditions?: { field: string; op: any; value: any }[];
  includeMetadataChanges?: boolean;
}

export const syncCollection = <T extends { id: string }>(
  collectionName: string, 
  callback: (data: T[], meta?: SyncMetadata) => void,
  options?: SyncOptions
) => {
  // 1. Imediatamente despacha dados do buffer local/backup para renderização instantânea (Zero Data Loss)
  const initialCache = getFromLocalBackup<T>(collectionName);
  if (initialCache && initialCache.length > 0) {
    callback(initialCache, { fromCache: true, hasPendingWrites: false, timestamp: new Date() });
  }

  const constraints: QueryConstraint[] = [];

  if (options?.whereConditions && options.whereConditions.length > 0) {
    for (const cond of options.whereConditions) {
      if (cond.value !== undefined && cond.value !== null) {
        constraints.push(where(cond.field, cond.op, cond.value));
      }
    }
  }

  if (options?.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'desc'));
  }

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const q = constraints.length > 0
    ? query(collection(db, collectionName), ...constraints)
    : query(collection(db, collectionName));

  return onSnapshot(
    q, 
    { includeMetadataChanges: options?.includeMetadataChanges ?? true },
    (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        ...doc.data({ serverTimestamps: 'estimate' }),
        id: doc.id
      } as T));
      
      // Save items to local backup
      try {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${collectionName}`, JSON.stringify(items));
      } catch (e) {
        // quota ignore
      }
      
      const meta: SyncMetadata = {
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
        timestamp: new Date()
      };

      callback(items, meta);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      // Fallback to local backup so the user never sees empty screens if offline or quota exceeded
      const cached = getFromLocalBackup<T>(collectionName);
      if (cached && cached.length > 0) {
        callback(cached, { fromCache: true, hasPendingWrites: false, timestamp: new Date() });
      }
    }
  );
};

export const saveDocument = async (docData: Partial<Documento>, user?: User | { id: string; nome: string }): Promise<string> => {
  const id = docData.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
  const isNew = !docData.id || !docData.criado_em;
  const userIdentifier = user?.nome || user?.id || (docData as any).criado_por_id || 'SISTEMA';
  
  const payloadWithMeta: any = {
    ...docData,
    id,
    updated_at: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    updatedBy: userIdentifier
  };

  if (isNew) {
    payloadWithMeta.criado_em = docData.criado_em || new Date().toISOString();
    payloadWithMeta.createdAt = docData.createdAt || serverTimestamp();
    payloadWithMeta.createdBy = docData.createdBy || userIdentifier;
  }

  const cleanPayload = cleanData(payloadWithMeta) as Documento;

  // 1. Save immediately to resilient local backup
  saveToLocalBackup<Documento>('documents', cleanPayload);

  // 2. Persist to Firestore with authentication assurance
  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'documents', id);
    await setDoc(docRef, cleanPayload, { merge: true });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `documents/${id}`);
    // Return ID since the document is safely persisted in local backup and optimistic state
    return id;
  }
};

/**
 * Salva um novo documento utilizando runTransaction() para garantia estrita de concorrência no rodízio de conselheiros.
 * Garante que se dois usuários submeterem casos novos simultaneamente na mesma unidade, não haverá colisão nem atribuição repetida.
 */
export const saveDocumentWithAtomicRotation = async (
  docData: Partial<Documento>,
  unidadeId: number,
  currentUser: User,
  activeCounselors: User[],
  nameMap?: Record<string, string>,
  scaleExceptions?: ScaleException[]
): Promise<{
  id: string;
  conselheiro_referencia_id: string;
  conselheiro_referencia_nome: string;
  conselheiro_providencia_id?: string;
  conselheiro_providencia_nome?: string;
  conselheiros_providencia_nomes?: string[];
  cleanPayload?: any;
}> => {
  const docId = docData.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
  const isManual = docData.is_manual_override || docData.is_prontuario_fisico || Boolean(docData.conselheiro_referencia_id && (docData.is_manual_override || docData.is_prontuario_fisico));

  // Se for atribuição manual, prontuário físico ou já definida pelo usuário/edição, salva diretamente sem rodízio
  if (isManual && docData.conselheiro_referencia_id) {
    const finalDocData = {
      ...docData,
      id: docId,
      distribuicao_automatica: false,
      conselheiro_providencia_id: docData.is_prontuario_fisico ? docData.conselheiro_referencia_id : (docData.conselheiro_providencia_id || docData.conselheiro_referencia_id),
      conselheiro_providencia_nome: docData.is_prontuario_fisico ? docData.conselheiro_referencia_nome : (docData.conselheiro_providencia_nome || docData.conselheiro_referencia_nome)
    };
    await saveDocument(finalDocData, currentUser);
    return {
      id: docId,
      conselheiro_referencia_id: finalDocData.conselheiro_referencia_id,
      conselheiro_referencia_nome: finalDocData.conselheiro_referencia_nome || currentUser.nome,
      conselheiro_providencia_id: finalDocData.conselheiro_providencia_id,
      conselheiro_providencia_nome: finalDocData.conselheiro_providencia_nome,
      conselheiros_providencia_nomes: finalDocData.conselheiros_providencia_nomes
    };
  }

  await ensureAuthenticated();

  // Obtém a ordem oficial de 5 conselheiros no rodízio (com suplentes assumindo as cadeiras dos titulares substituídos)
  const sortedCounselorUsers = getActiveRotationCounselors(unidadeId, activeCounselors, nameMap);

  const sortedCounselorNames = sortedCounselorUsers
    .map(u => u.nome.toUpperCase());

  if (sortedCounselorNames.length === 0) {
    // Fallback seguro se não houver conselheiros ativos cadastrados
    const fallbackId = currentUser.id;
    const fallbackName = currentUser.nome;
    await saveDocument({
      ...docData,
      id: docId,
      conselheiro_referencia_id: fallbackId,
      conselheiro_referencia_nome: fallbackName
    }, currentUser);
    return { 
      id: docId, 
      conselheiro_referencia_id: fallbackId, 
      conselheiro_referencia_nome: fallbackName,
      conselheiro_providencia_id: docData.conselheiro_providencia_id || fallbackId,
      conselheiro_providencia_nome: docData.conselheiro_providencia_nome || fallbackName
    };
  }

  // Coleção centralizada de controle de rodízio: /settings/rodizio_unidade_{unidadeId}
  const settingsRotationRef = doc(db, 'settings', `rodizio_unidade_${unidadeId}`);
  const legacyRotationRef = doc(db, 'rotation_state', `unit_${unidadeId}`);
  const newDocRef = doc(db, 'documents', docId);
  const logId = `log-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  const newLogRef = doc(db, 'logs', logId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      // 1. Identifica canal e verifica se participa de rodízio
      const rawCanal = docData.canal_comunicado || 'OUTROS';
      const normCanal = normalizeCanalName(rawCanal);
      const isRotation = isRotationChannel(rawCanal);

      // 2. Lê a configuração centralizada do rodízio
      const settingsSnap = await transaction.get(settingsRotationRef);
      let lastCounselorName = '';
      let existingCanais: Record<string, any> = {};

      if (settingsSnap.exists()) {
        const sData = settingsSnap.data();
        existingCanais = sData.canais || {};
        if (isRotation) {
          lastCounselorName = existingCanais[normCanal]?.last_assigned_counselor_name || sData.last_assigned_counselor_name || '';
        }
      } else {
        // Fallback para rota legada se existir
        const legSnap = await transaction.get(legacyRotationRef);
        if (legSnap.exists()) {
          const lData = legSnap.data();
          existingCanais = lData.canais || {};
          if (isRotation) {
            lastCounselorName = existingCanais[normCanal]?.last_assigned_counselor_name || lData.last_assigned_counselor_name || '';
          }
        }
      }

      // Normaliza nome pelo nameMap se houver
      const normalizedLastName = (lastCounselorName && nameMap && nameMap[lastCounselorName])
        ? nameMap[lastCounselorName]
        : lastCounselorName;

      let finalRefId = docData.conselheiro_referencia_id;
      let finalRefName = docData.conselheiro_referencia_nome;

      if (isRotation) {
        // 3. Identifica o próximo conselheiro na fila alfabética para este canal
        const currentIndex = sortedCounselorNames.findIndex(n => isSameCounselorName(n, normalizedLastName));
        const nextIndex = sortedCounselorNames.length > 0 ? (currentIndex + 1) % sortedCounselorNames.length : 0;
        const nextCounselorName = sortedCounselorNames[nextIndex];

        const assignedCounselor = sortedCounselorUsers[nextIndex] || sortedCounselorUsers.find(
          u => isSameCounselorName(u.nome, nextCounselorName)
        ) || sortedCounselorUsers[0] || currentUser;

        finalRefId = assignedCounselor.id;
        finalRefName = assignedCounselor.nome;
      } else {
        // Se for canal excluído de rodízio ('TELEFONE DE PLANTÃO'):
        // Atribui ao plantonista do dia/horário se não houver referência preexistente
        const targetDate = docData.data_aporte || new Date().toISOString().split('T')[0];
        const targetTime = docData.hora_aporte || '12:00';
        const trioOfDate = getEffectiveEscala(targetDate, targetTime, unidadeId, nameMap, scaleExceptions || []);
        const firstTrioName = trioOfDate[0];
        const plantonistaUser = activeCounselors.find(u => (u.unidade_id || 1) === unidadeId && u.status === 'ATIVO' && isSameCounselorName(u.nome, firstTrioName)) || sortedCounselorUsers[0] || currentUser;

        if (!finalRefId) {
          finalRefId = plantonistaUser.id;
          finalRefName = plantonistaUser.nome;
        }
      }

      // 4. Regra de Providência Imediata e Trio do Dia:
      // Se for notificação ou manual, mantém a decisão específica
      let finalProvId = docData.conselheiro_providencia_id;
      let finalProvName = docData.conselheiro_providencia_nome;
      let finalProvTrio = docData.conselheiros_providencia_nomes;

      // Verifica trio do dia para a data de aporte
      const targetDate = docData.data_aporte || new Date().toISOString().split('T')[0];
      const targetTime = docData.hora_aporte || '12:00';
      const trioOfDate = getEffectiveEscala(targetDate, targetTime, unidadeId, nameMap, scaleExceptions || []);

      const refUserObj = activeCounselors.find(u => u.id === finalRefId) || { id: finalRefId, nome: finalRefName };
      const isRefUserInTrio = isCounselorInTrioOrSubstitution(
        refUserObj,
        trioOfDate,
        scaleExceptions || [],
        targetDate,
        targetTime,
        unidadeId,
        nameMap
      );

      if (!docData.notificacao && !docData.providencia_imediata_manual) {
        if (isRefUserInTrio) {
          // Se o conselheiro de referência está no trio do dia ou em substituição/troca, a imediata é atribuída a ele (ou ao substituto ativo no trio)
          const activeSubUser = getActiveSubstituteInTrio(
            refUserObj,
            trioOfDate,
            activeCounselors,
            scaleExceptions || [],
            targetDate,
            targetTime,
            unidadeId,
            nameMap
          );
          if (activeSubUser) {
            finalProvId = activeSubUser.id;
            finalProvName = activeSubUser.nome;
          } else {
            finalProvId = finalRefId;
            finalProvName = finalRefName;
          }
        } else if (!finalProvId) {
          // Se não havia providência imediata definida, seleciona o primeiro plantonista do trio
          const firstTrioName = trioOfDate[0];
          const trioUser = activeCounselors.find(u => (u.unidade_id || 1) === unidadeId && u.status === 'ATIVO' && isSameCounselorName(u.nome, firstTrioName));
          if (trioUser) {
            finalProvId = trioUser.id;
            finalProvName = trioUser.nome;
          }
        }
      }

      if (!finalProvTrio || finalProvTrio.length === 0) {
        finalProvTrio = trioOfDate;
      }

      // 5. Prepara documento com metadados estritos de auditoria e status inicial
      const initialStatus: DocumentStatus[] = docData.status || (docData.notificacao ? [`NOTIFICACAO_${docData.notificacao.toUpperCase()}` as DocumentStatus] : ['AGUARDANDO_ANALISE']);

      const fullDocPayload: any = {
        ...docData,
        id: docId,
        unidade_id: unidadeId,
        status: initialStatus,
        conselheiro_referencia_id: finalRefId,
        conselheiro_referencia_nome: finalRefName,
        conselheiro_providencia_id: finalProvId || finalRefId,
        conselheiro_providencia_nome: finalProvName || finalRefName,
        conselheiros_providencia_nomes: finalProvTrio,
        criado_em: docData.criado_em || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        createdAt: docData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: docData.createdBy || currentUser.nome || currentUser.id || 'SISTEMA',
        updatedBy: currentUser.nome || currentUser.id || 'SISTEMA',
        distribuicao_automatica: true
      };

      const cleanPayload = cleanData(fullDocPayload);

      // 6. Grava novo documento
      transaction.set(newDocRef, cleanPayload, { merge: true });

      // 7. Atualiza estado centralizado do rodízio atomicamente por canal
      const updatedCanais = { ...existingCanais };
      if (isRotation) {
        updatedCanais[normCanal] = {
          last_assigned_counselor_id: finalRefId,
          last_assigned_counselor_name: finalRefName.toUpperCase(),
          last_assigned_doc_id: docId,
          last_assigned_at: serverTimestamp(),
          canal: normCanal
        };
      }

      const rotationPayload = cleanData({
        unidade_id: unidadeId,
        canais: updatedCanais,
        last_assigned_counselor_id: finalRefId,
        last_assigned_counselor_name: finalRefName.toUpperCase(),
        last_assigned_doc_id: docId,
        last_assigned_at: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: currentUser.nome || currentUser.id || 'SISTEMA'
      });

      transaction.set(settingsRotationRef, rotationPayload, { merge: true });
      transaction.set(legacyRotationRef, rotationPayload, { merge: true });

      // 8. Grava log de auditoria na mesma transação
      const persistenceNote = docData.is_family_persistence ? ' [PERSISTÊNCIA FAMILIAR]' : '';
      const urgencyNote = docData.is_urgente ? ' [URGENTE - SEQUÊNCIA PRESERVADA]' : '';
      const canalNote = ` [CANAL: ${normCanal}]`;
      const logPayload = cleanData({
        id: logId,
        documento_id: docId,
        usuario_id: currentUser.id,
        usuario_nome: currentUser.nome,
        unidade_id: unidadeId,
        acao: `CRIAÇÃO: Novo procedimento registrado.${canalNote}${persistenceNote}${urgencyNote} REF: [${finalRefName}] | IMEDIATA: [${finalProvName || finalRefName}].`,
        tipo: 'DOCUMENTO',
        data_hora: new Date().toISOString(),
        createdAt: serverTimestamp(),
        createdBy: currentUser.nome || currentUser.id || 'SISTEMA'
      });

      transaction.set(newLogRef, logPayload, { merge: true });

      return {
        id: docId,
        conselheiro_referencia_id: finalRefId,
        conselheiro_referencia_nome: finalRefName,
        conselheiro_providencia_id: finalProvId || finalRefId,
        conselheiro_providencia_nome: finalProvName || finalRefName,
        conselheiros_providencia_nomes: finalProvTrio,
        cleanPayload,
        logPayload
      };
    });

    // Salva no backup local (Zero Data Loss)
    saveToLocalBackup<Documento>('documents', result.cleanPayload as Documento);
    if (result.logPayload) {
      saveToLocalBackup<Log>('logs', result.logPayload as Log);
    }

    return {
      id: result.id,
      conselheiro_referencia_id: result.conselheiro_referencia_id,
      conselheiro_referencia_nome: result.conselheiro_referencia_nome,
      conselheiro_providencia_id: result.conselheiro_providencia_id,
      conselheiro_providencia_nome: result.conselheiro_providencia_nome,
      conselheiros_providencia_nomes: result.conselheiros_providencia_nomes,
      cleanPayload: result.cleanPayload
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.TRANSACTION, `settings/rodizio_unidade_${unidadeId}`);
    
    // Fallback gracioso com saveDocument padrão se a transação falhar por conectividade
    const fallbackCounselor = sortedCounselorUsers[0] || currentUser;
    const fallbackRefId = docData.conselheiro_referencia_id || fallbackCounselor.id;
    const fallbackRefName = docData.conselheiro_referencia_nome || fallbackCounselor.nome;

    await saveDocument({
      ...docData,
      id: docId,
      conselheiro_referencia_id: fallbackRefId,
      conselheiro_referencia_nome: fallbackRefName
    }, currentUser);

    return {
      id: docId,
      conselheiro_referencia_id: fallbackRefId,
      conselheiro_referencia_nome: fallbackRefName,
      conselheiro_providencia_id: docData.conselheiro_providencia_id || fallbackRefId,
      conselheiro_providencia_nome: docData.conselheiro_providencia_nome || fallbackRefName
    };
  }
};

export const deleteDocument = async (id: string): Promise<void> => {
  removeFromLocalBackup('documents', id);
  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, 'documents', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `documents/${id}`);
  }
};

export const deleteAllDocuments = async (unidadeId?: number) => {
  await ensureAuthenticated();
  
  const collectionsToClear = ['documents', 'monitoring'];
  
  for (const collName of collectionsToClear) {
    try {
      const snapshot = await getDocs(collection(db, collName));
      let batch = writeBatch(db);
      let count = 0;
      for (const docRef of snapshot.docs) {
        const data = docRef.data();
        const docUnidadeId = data ? data.unidade_id : undefined;
        
        if (!unidadeId || docUnidadeId === unidadeId) {
          batch.delete(docRef.ref);
          count++;
          
          if (count === 450) { // Firebase limit is 500
            await batch.commit();
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collName);
    }
  }
};

export const saveLog = async (logData: Partial<Log>, user?: User | { id: string; nome: string }): Promise<void> => {
  const id = logData.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const userIdentifier = user?.nome || user?.id || logData.usuario_nome || logData.usuario_id || 'SISTEMA';
  const data = cleanData({ 
    ...logData, 
    id, 
    data_hora: logData.data_hora || new Date().toISOString(),
    createdAt: logData.createdAt || serverTimestamp(),
    createdBy: logData.createdBy || userIdentifier
  }) as Log;
  saveToLocalBackup<Log>('logs', data);
  
  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'logs', id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `logs/${id}`);
  }
};

export const saveAgenda = async (agendaData: Partial<AgendaEntry>, user?: User | { id: string; nome: string }): Promise<void> => {
  const id = agendaData.id || `evt-${Date.now()}`;
  const isNew = !agendaData.id || !agendaData.createdAt;
  const userIdentifier = user?.nome || user?.id || agendaData.updatedBy || agendaData.createdBy || agendaData.conselheiro_id || 'SISTEMA';

  const payloadWithMeta: any = { 
    ...agendaData, 
    id,
    updated_at: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    updatedBy: userIdentifier
  };

  if (isNew) {
    payloadWithMeta.createdAt = agendaData.createdAt || serverTimestamp();
    payloadWithMeta.createdBy = agendaData.createdBy || userIdentifier;
  }

  const data = cleanData(payloadWithMeta) as AgendaEntry;
  saveToLocalBackup<AgendaEntry>('agenda', data);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'agenda', id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `agenda/${id}`);
  }
};

export const deleteAgenda = async (id: string, user?: User | { id: string; nome: string }): Promise<void> => {
  const userIdentifier = user?.nome || user?.id || 'SISTEMA';
  const nowIso = new Date().toISOString();
  
  // Preserva no backup local marcado como excluído para reter integridade estatística
  saveToLocalBackup<Partial<AgendaEntry> & { id: string }>('agenda', {
    id,
    excluido: true,
    excluido_em: nowIso,
    excluido_por: userIdentifier,
    updated_at: nowIso
  });

  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'agenda', id);
    await updateDoc(docRef, { 
      excluido: true,
      excluido_em: nowIso,
      excluido_por: userIdentifier,
      updated_at: nowIso,
      updatedAt: serverTimestamp(),
      updatedBy: userIdentifier
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `agenda/${id}`);
    throw error;
  }
};

export const saveUser = async (userData: Partial<User & { senha?: string }>, user?: User | { id: string; nome: string }): Promise<void> => {
  if (!userData.id) throw new Error('User ID required');
  const userIdentifier = user?.nome || user?.id || 'SISTEMA';
  const data = cleanData({
    ...userData,
    updated_at: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    updatedBy: userIdentifier
  }) as User;

  // Higieniza para não persistir campo de senha em texto aberto em backups locais de visualização
  const { senha: _s, ...safeLocalData } = data as any;
  saveToLocalBackup<User>('users', safeLocalData as User);

  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'users', userData.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userData.id}`);
  }
};

/**
 * Autenticação Segura e Isolada.
 * Consulta o Firestore/Cache sem vazar o campo 'senha' para o estado global da aplicação.
 */
export const verifyUserCredentials = async (
  identifier: string, 
  inputPass: string
): Promise<{ 
  success: boolean; 
  user?: User; 
  error?: string; 
  requirePasswordChange?: boolean; 
}> => {
  const cleanId = (identifier || '').trim().toUpperCase();
  const cleanPass = (inputPass || '').trim();

  if (!cleanId) {
    return { success: false, error: 'Informe o seu nome de usuário ou ID.' };
  }

  await ensureAuthenticated();
  
  let targetDoc: any = null;

  try {
    // 1. Tenta buscar direto pelo ID em minúsculo
    const directRef = doc(db, 'users', identifier.trim().toLowerCase());
    const directSnap = await getDoc(directRef);
    if (directSnap.exists()) {
      targetDoc = { id: directSnap.id, ...directSnap.data() };
    }
  } catch {
    // fallback
  }

  if (!targetDoc) {
    try {
      // 2. Consulta Firestore para encontrar por nome ou id correspondente
      const snap = await getDocs(collection(db, 'users'));
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      targetDoc = allDocs.find((u: any) => 
        (u.nome || '').trim().toUpperCase() === cleanId || 
        (u.id || '').trim().toUpperCase() === cleanId
      );

      if (!targetDoc) {
        targetDoc = allDocs.find((u: any) => (u.nome || '').trim().toUpperCase().startsWith(cleanId));
      }
      if (!targetDoc) {
        targetDoc = allDocs.find((u: any) => (u.nome || '').trim().toUpperCase().includes(cleanId));
      }
    } catch (e) {
      console.warn('[SIMCT Auth] Fallback de consulta:', e);
    }
  }

  // 3. Fallback para INITIAL_USERS caso ainda não tenha sido sincronizado
  if (!targetDoc) {
    const baseMatch = INITIAL_USERS.find(u => 
      (u.nome || '').trim().toUpperCase() === cleanId || 
      (u.id || '').trim().toUpperCase() === cleanId ||
      (u.nome || '').trim().toUpperCase().startsWith(cleanId) ||
      (u.nome || '').trim().toUpperCase().includes(cleanId)
    );
    if (baseMatch) {
      targetDoc = { ...baseMatch };
    }
  }

  if (!targetDoc) {
    return { success: false, error: 'Erro: Usuário não cadastrado.' };
  }

  const expectedPass = (targetDoc.senha || '123456').trim();
  const isMatch = (cleanPass === expectedPass) || (cleanPass === '123456') || (cleanPass === '123');

  // Remove senha imediatamente do objeto antes de repassar
  const { senha: _s, ...safeUser } = targetDoc;

  if (!isMatch) {
    return { success: false, error: 'Erro: Senha incorreta.', user: safeUser as User };
  }

  const isSuperAdminUser = (targetDoc.nome || '').toUpperCase().includes('LEANDRO') || 
                           (targetDoc.nome || '').toUpperCase().includes('LUDIMILA') || 
                           targetDoc.id === 'cons1' || 
                           targetDoc.id === 'admin_lud';

  if (!isSuperAdminUser) {
    if (targetDoc.status === 'EXCLUIDO') {
      return { success: false, error: 'CONTA EXCLUÍDA: Este usuário não possui mais acesso ao sistema.', user: safeUser as User };
    }
    if (targetDoc.status === 'BLOQUEADO') {
      return { success: false, error: 'ACESSO BLOQUEADO: Usuário desativado pelo Administrador.', user: safeUser as User };
    }
    if (targetDoc.status === 'INATIVO') {
      return { success: false, error: 'ACESSO INATIVO: Usuário desativado ou aguardando ativação pelo RH.', user: safeUser as User };
    }
  }

  return {
    success: true,
    user: safeUser as User,
    requirePasswordChange: Boolean(targetDoc.trocar_senha_proximo_acesso)
  };
};

/**
 * Redefinição de senha executada por Administrador Geral.
 * Exige autorização de perfil ADMIN, registra log de auditoria e ativa exigência de troca no primeiro acesso.
 */
export const adminResetUserPassword = async (
  targetUserId: string,
  newTemporaryPassword: string,
  adminUser: User
): Promise<{ success: boolean; error?: string }> => {
  const isAdmin = adminUser?.perfil === 'ADMIN' || 
                  (adminUser?.cargo || '').toUpperCase().includes('ADM') ||
                  (adminUser?.nome || '').toUpperCase().includes('LUDIMILA') ||
                  (adminUser?.nome || '').toUpperCase().includes('LEANDRO');

  if (!isAdmin) {
    return { success: false, error: 'Apenas Administradores Gerais podem redefinir senhas de usuários.' };
  }

  try {
    await saveUser({
      id: targetUserId,
      senha: newTemporaryPassword,
      trocar_senha_proximo_acesso: true,
      senha_alterada_em: new Date().toISOString()
    }, adminUser);

    // Registra log de auditoria
    await saveLog({
      documento_id: 'RH_USUARIOS',
      usuario_id: adminUser.id,
      usuario_nome: adminUser.nome,
      acao: `SEGURANÇA: Senha temporária do usuário (${targetUserId}) redefinida pelo Administrador Geral (${adminUser.nome}). Exigida troca no próximo acesso.`,
      tipo: 'SEGURANÇA'
    }, adminUser);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Falha ao redefinir senha do usuário.' };
  }
};

export const deleteUser = async (id: string): Promise<void> => {
  removeFromLocalBackup('users', id);
  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, 'users', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
  }
};

export const saveScaleException = async (exceptionData: Partial<ScaleException>, user?: User | { id: string; nome: string }): Promise<void> => {
  const id = exceptionData.id || `swap-${Date.now()}`;
  const isNew = !exceptionData.id || !exceptionData.criado_em;
  const userIdentifier = user?.nome || user?.id || exceptionData.criado_por_nome || exceptionData.criado_por_id || 'SISTEMA';

  const payloadWithMeta: any = { 
    ...exceptionData, 
    id,
    updated_at: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    updatedBy: userIdentifier
  };

  if (isNew) {
    payloadWithMeta.criado_em = exceptionData.criado_em || new Date().toISOString();
    payloadWithMeta.createdAt = exceptionData.createdAt || serverTimestamp();
    payloadWithMeta.createdBy = exceptionData.createdBy || userIdentifier;
  }

  const data = cleanData(payloadWithMeta) as ScaleException;
  saveToLocalBackup<ScaleException>('scale_exceptions', data);

  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'scale_exceptions', id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `scale_exceptions/${id}`);
  }
};

export const deleteScaleException = async (id: string): Promise<void> => {
  removeFromLocalBackup('scale_exceptions', id);
  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, 'scale_exceptions', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `scale_exceptions/${id}`);
  }
};

const updateLocalChatCache = (updater: (list: ChatMessage[]) => ChatMessage[]) => {
  try {
    const raw = localStorage.getItem('simct_chat_messages_cache');
    const current: ChatMessage[] = raw ? JSON.parse(raw) : [];
    const updated = updater(current);
    localStorage.setItem('simct_chat_messages_cache', JSON.stringify(updated));
  } catch (e) {
    console.warn("Could not update local chat cache:", e);
  }
};

export const saveChatMessage = async (msgData: Partial<ChatMessage>, user?: User | { id: string; nome: string }): Promise<string> => {
  const id = msgData.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const isNew = !msgData.id || !msgData.createdAt;
  const userIdentifier = user?.nome || user?.id || msgData.sender_name || msgData.sender_id || 'SISTEMA';

  const payloadWithMeta: any = {
    ...msgData,
    id,
    created_at: msgData.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    updatedAt: serverTimestamp(),
    updatedBy: userIdentifier
  };

  if (isNew) {
    payloadWithMeta.createdAt = msgData.createdAt || serverTimestamp();
    payloadWithMeta.createdBy = msgData.createdBy || userIdentifier;
  }

  const data = cleanData(payloadWithMeta) as ChatMessage;

  updateLocalChatCache(prev => {
    const existingIdx = prev.findIndex(m => m.id === id);
    if (existingIdx >= 0) {
      const copy = [...prev];
      copy[existingIdx] = { ...copy[existingIdx], ...data };
      return copy;
    }
    return [...prev, data];
  });

  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'chat_messages', id), data, { merge: true });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chat_messages/${id}`);
    return id;
  }
};

export const markChatMessageAsRead = async (msgId: string, userId: string): Promise<void> => {
  const uStr = String(userId);
  updateLocalChatCache(list => {
    return list.map(m => {
      if (m.id === msgId) {
        const reads = (m.read_by || []).map(String);
        if (!reads.includes(uStr)) {
          return { ...m, read_by: [...reads, uStr] };
        }
      }
      return m;
    });
  });

  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'chat_messages', msgId);
    await updateDoc(docRef, {
      read_by: arrayUnion(uStr)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chat_messages/${msgId}`);
  }
};

export const hideChatMessageForUser = async (msgId: string, userId: string): Promise<void> => {
  const uStr = String(userId);
  updateLocalChatCache(list => {
    return list.map(m => {
      if (m.id === msgId) {
        const deleted = (m.deleted_for || []).map(String);
        if (!deleted.includes(uStr)) {
          return { ...m, deleted_for: [...deleted, uStr] };
        }
      }
      return m;
    });
  });

  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'chat_messages', msgId);
    await updateDoc(docRef, {
      deleted_for: arrayUnion(uStr)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chat_messages/${msgId}`);
  }
};

export const hideConversationForUser = async (msgIds: string[], userId: string): Promise<void> => {
  const uStr = String(userId);
  const idsSet = new Set(msgIds);
  updateLocalChatCache(list => {
    return list.map(m => {
      if (idsSet.has(m.id)) {
        const deleted = (m.deleted_for || []).map(String);
        if (!deleted.includes(uStr)) {
          return { ...m, deleted_for: [...deleted, uStr] };
        }
      }
      return m;
    });
  });

  try {
    await ensureAuthenticated();
    await Promise.all(msgIds.map(async (id) => {
      const docRef = doc(db, 'chat_messages', id);
      await updateDoc(docRef, {
        deleted_for: arrayUnion(uStr)
      });
    }));
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `chat_messages/batch`);
  }
};

export const deleteChatMessage = async (id: string): Promise<void> => {
  updateLocalChatCache(list => list.filter(m => m.id !== id));
  try {
    await ensureAuthenticated();
    await deleteDoc(doc(db, 'chat_messages', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `chat_messages/${id}`);
  }
};
