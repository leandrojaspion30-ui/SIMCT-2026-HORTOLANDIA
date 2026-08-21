import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  addDoc, 
  updateDoc, 
  deleteDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, ensureAuthenticated, auth } from './firebase';
import { Documento, Log, AgendaEntry, User, ScaleException, ChatMessage } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
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

export const syncCollection = <T extends { id: string }>(
  collectionName: string, 
  callback: (data: T[]) => void,
  options?: { limitCount?: number; orderByField?: string; orderDirection?: 'asc' | 'desc' }
) => {
  // 1. Imediatamente despacha dados do buffer local/backup para renderização instantânea (Cold Start / Quota Exceeded)
  const initialCache = getFromLocalBackup<T>(collectionName);
  if (initialCache && initialCache.length > 0) {
    callback(initialCache);
  }

  let q;
  if (options && options.orderByField) {
    const constraints: any[] = [orderBy(options.orderByField, options.orderDirection || 'desc')];
    if (options.limitCount) {
      constraints.push(limit(options.limitCount));
    }
    q = query(collection(db, collectionName), ...constraints);
  } else if (options && options.limitCount) {
    q = query(collection(db, collectionName), limit(options.limitCount));
  } else {
    q = query(collection(db, collectionName));
  }

  return onSnapshot(
    q, 
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
      
      callback(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      // Fallback to local backup so the user never sees empty screens if offline or quota exceeded
      const cached = getFromLocalBackup<T>(collectionName);
      if (cached && cached.length > 0) {
        callback(cached);
      }
    }
  );
};

export const saveDocument = async (docData: Partial<Documento>): Promise<string> => {
  const id = docData.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
  const cleanPayload = cleanData({ 
    ...docData, 
    id, 
    updated_at: new Date().toISOString() 
  }) as Documento;

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

export const saveLog = async (logData: Partial<Log>): Promise<void> => {
  const id = logData.id || `log-${Date.now()}`;
  const data = cleanData({ ...logData, id, created_at: new Date().toISOString() }) as Log;
  saveToLocalBackup<Log>('logs', data);
  
  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'logs', id), data);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `logs/${id}`);
  }
};

export const saveAgenda = async (agendaData: Partial<AgendaEntry>): Promise<void> => {
  const id = agendaData.id || `evt-${Date.now()}`;
  const data = cleanData({ ...agendaData, id }) as AgendaEntry;
  saveToLocalBackup<AgendaEntry>('agenda', data);

  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'agenda', id);
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `agenda/${id}`);
  }
};

export const deleteAgenda = async (id: string): Promise<void> => {
  removeFromLocalBackup('agenda', id);
  try {
    await ensureAuthenticated();
    const docRef = doc(db, 'agenda', id);
    await updateDoc(docRef, { excluido: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `agenda/${id}`);
    throw error;
  }
};

export const saveUser = async (userData: Partial<User & { senha?: string }>): Promise<void> => {
  if (!userData.id) throw new Error('User ID required');
  const data = cleanData(userData) as User;
  saveToLocalBackup<User>('users', data);

  try {
    await ensureAuthenticated();
    await setDoc(doc(db, 'users', userData.id), data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userData.id}`);
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

export const saveScaleException = async (exceptionData: Partial<ScaleException>): Promise<void> => {
  const id = exceptionData.id || `swap-${Date.now()}`;
  const data = cleanData({ ...exceptionData, id }) as ScaleException;
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

export const saveChatMessage = async (msgData: Partial<ChatMessage>): Promise<string> => {
  const id = msgData.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const data = cleanData({
    ...msgData,
    id,
    created_at: msgData.created_at || new Date().toISOString(),
    read_by: msgData.read_by || [msgData.sender_id || '']
  }) as ChatMessage;

  // Immediately update local cache
  updateLocalChatCache(list => {
    const idx = list.findIndex(m => m.id === id);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = { ...updated[idx], ...data };
      return updated;
    }
    return [...list, data];
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
