import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); // Database específica
export const auth = getAuth(app);

// Enable offline persistence - DISABLED TEMPORARILY TO FIX CACHE DELETION ISSUES
/*
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    ...
  });
}
*/

export const ensureAuthenticated = async () => {
  try {
    if (!auth.currentUser) {
      // Tentativa silenciosa. Se falhar, o app continua via regras abertas (if true)
      await signInAnonymously(auth);
    }
  } catch (error) {
    // Apenas um log informativo para evitar o erro "bloqueante" no console
    console.info("Aguardando ativação do provedor Anônimo no Console do Firebase. O sistema seguirá operando via regras temporárias.");
  }
};
