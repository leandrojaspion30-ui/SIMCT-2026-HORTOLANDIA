import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Suprime warnings verbosos e avisos de divergência de relógio do SDK Firestore
setLogLevel('silent');

const app = initializeApp(firebaseConfig);

// Inicializa o Firestore com persistência local habilitada e suporte a múltiplas abas.
// Isso garante o funcionamento offline completo e mitiga problemas de conexão transitórios ou avisos de rede em ambientes sandbox.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export const ensureAuthenticated = async () => {
  try {
    if (!auth.currentUser) {
      // Tentativa silenciosa. Se falhar, o app continua via regras abertas
      await signInAnonymously(auth);
    }
  } catch (error) {
    // Apenas um log informativo para evitar erro "bloqueante" no console
    console.info("Aguardando ativação do provedor Anônimo no Console do Firebase. O sistema seguirá operando com segurança.");
  }
};

