import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === "string" && value.trim().length > 0,
);

const firebaseApp = firebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

let persistenceEnabled = true;
let firestore: Firestore | null = null;

if (firebaseApp) {
  try {
    firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (error) {
    // Vite HMR may re-evaluate this module after Firestore was initialized.
    // Reuse that instance; if it was initialized without persistence, expose
    // the limitation instead of pretending offline persistence is active.
    try {
      firestore = getFirestore(firebaseApp);
      persistenceEnabled = false;
      console.warn(
        "Firestore ya estaba inicializado; se reutiliza la instancia existente.",
        error,
      );
    } catch (initializationError) {
      console.error("No se pudo inicializar Firestore.", initializationError);
      throw initializationError;
    }
  }
}

export const auth: Auth | null = firebaseApp ? getAuth(firebaseApp) : null;
export const db: Firestore | null = firestore;
export const storage: FirebaseStorage | null = firebaseApp
  ? getStorage(firebaseApp)
  : null;
export const offlinePersistenceEnabled = persistenceEnabled;

export function requireAuth(): Auth {
  if (!auth) {
    throw new Error("Configura Firebase en Replit Secrets para continuar.");
  }
  return auth;
}

export function requireFirestore(): Firestore {
  if (!db) {
    throw new Error("Configura Firebase en Replit Secrets para continuar.");
  }
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error("Configura Firebase en Replit Secrets para continuar.");
  }
  return storage;
}
