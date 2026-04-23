import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db, ensureAuthenticated } from './firebase';
import { Documento, Log, AgendaEntry, User } from '../types';

export const syncCollection = <T extends { id: string }>(
  collectionName: string, 
  callback: (data: T[]) => void
) => {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as T));
    callback(items);
  });
};

const cleanData = (obj: any) => {
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
};

export const saveDocument = async (docData: Partial<Documento>) => {
  await ensureAuthenticated();
  const id = docData.id || `doc-${Math.random().toString(36).substr(2, 9)}`;
  const docRef = doc(db, 'documents', id);
  const data = cleanData({ ...docData, id, updated_at: serverTimestamp() });
  await setDoc(docRef, data, { merge: true });
  return id;
};

export const deleteDocument = async (id: string) => {
  await ensureAuthenticated();
  await deleteDoc(doc(db, 'documents', id));
};

export const saveLog = async (logData: Partial<Log>) => {
  await ensureAuthenticated();
  const id = logData.id || `log-${Date.now()}`;
  const data = cleanData({ ...logData, id, created_at: serverTimestamp() });
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
    await deleteDoc(docRef);
    console.log(`Registro ${id} excluído com sucesso do Firestore.`);
  } catch (error) {
    console.error("Erro interno ao deletar no Firestore:", error);
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
