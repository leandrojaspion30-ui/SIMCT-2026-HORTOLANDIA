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
  serverTimestamp 
} from 'firebase/firestore';
import { db, ensureAuthenticated } from './firebase';
import { Documento, Log, AgendaEntry, User, ScaleException } from '../types';

export const syncCollection = <T extends { id: string }>(
  collectionName: string, 
  callback: (data: T[]) => void,
  options?: { limitCount?: number; orderByField?: string; orderDirection?: 'asc' | 'desc' }
) => {
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
      callback(items);
    },
    (error) => {
      console.warn(`[SIMCT Firestore] Error syncing collection "${collectionName}":`, error.message || error);
    }
  );
};

const cleanData = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj
      .map(item => cleanData(item))
      .filter(item => item !== undefined);
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    // Preservar objetos especiais do Firestore (FieldValue, Timestamp, etc)
    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) {
      return obj;
    }

    const newObj: any = {};
    Object.keys(obj).forEach(key => {
      if (obj[key] !== undefined) {
        newObj[key] = cleanData(obj[key]);
      }
    });
    return newObj;
  }
  return obj;
};

export const saveDocument = async (docData: Partial<Documento>) => {
  await ensureAuthenticated();
  const id = docData.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
  const docRef = doc(db, 'documents', id);
  const data = cleanData({ ...docData, id, updated_at: new Date().toISOString() });
  await setDoc(docRef, data, { merge: true });
  return id;
};

export const deleteDocument = async (id: string) => {
  await ensureAuthenticated();
  await deleteDoc(doc(db, 'documents', id));
};

export const deleteAllDocuments = async (unidadeId?: number) => {
  await ensureAuthenticated();
  
  const collectionsToClear = ['documents', 'monitoring'];
  
  for (const collName of collectionsToClear) {
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
  }
};

export const saveLog = async (logData: Partial<Log>) => {
  await ensureAuthenticated();
  const id = logData.id || `log-${Date.now()}`;
  const data = cleanData({ ...logData, id, created_at: new Date().toISOString() });
  await setDoc(doc(db, 'logs', id), data);
};

export const saveAgenda = async (agendaData: Partial<AgendaEntry>) => {
  const id = agendaData.id || `evt-${Date.now()}`;
  const docRef = doc(db, 'agenda', id);
  const data = cleanData({ ...agendaData, id });
  await setDoc(docRef, data, { merge: true });
};

export const deleteAgenda = async (id: string) => {
  try {
    const docRef = doc(db, 'agenda', id);
    await updateDoc(docRef, { excluido: true });
    console.log(`Registro ${id} marcado como excluído com sucesso no Firestore.`);
  } catch (error) {
    console.error("Erro interno ao deletar (soft-delete) no Firestore:", error);
    throw error;
  }
};

export const saveUser = async (userData: Partial<User & { senha?: string }>) => {
  await ensureAuthenticated();
  if (!userData.id) throw new Error('User ID required');
  const data = cleanData(userData);
  await setDoc(doc(db, 'users', userData.id), data, { merge: true });
};

export const deleteUser = async (id: string) => {
  await ensureAuthenticated();
  await deleteDoc(doc(db, 'users', id));
};

export const saveScaleException = async (exceptionData: Partial<ScaleException>) => {
  await ensureAuthenticated();
  const id = exceptionData.id || `swap-${Date.now()}`;
  const data = cleanData({ ...exceptionData, id });
  await setDoc(doc(db, 'scale_exceptions', id), data, { merge: true });
};

export const deleteScaleException = async (id: string) => {
  await ensureAuthenticated();
  await deleteDoc(doc(db, 'scale_exceptions', id));
};

