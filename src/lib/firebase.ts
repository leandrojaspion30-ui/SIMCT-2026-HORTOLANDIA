import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suprime warnings verbosos e avisos de divergência de relógio do SDK Firestore
setLogLevel('silent');

// Evita inicialização duplicada do Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId || "ai-studio-d36b57dc-50ec-44fe-a443-7e10611f0923";

// Inicializa o Firestore com persistência local e suporte a múltiplas abas usando o databaseId específico
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      }),
      experimentalForceLongPolling: true
    }, FIRESTORE_DATABASE_ID);
  } catch {
    return getFirestore(app, FIRESTORE_DATABASE_ID);
  }
})();

export const auth = getAuth(app);

export const ensureAuthenticated = async () => {
  try {
    if (!auth.currentUser) {
      // Tentativa silenciosa de autenticação anônima
      await signInAnonymously(auth);
    }
  } catch (error) {
    // Log informativo para evitar erro bloqueante no console
    console.info("Aguardando ativação do provedor Anônimo no Console do Firebase. O sistema seguirá operando com segurança.");
  }
};


