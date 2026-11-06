import { useCallback, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, firebaseConfigured, requireAuth } from "@/lib/firebase";

function readableAuthError(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String(error.code)
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-email": "El correo electrónico no es válido.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/user-not-found": "No encontramos una cuenta con ese correo.",
    "auth/wrong-password": "La contraseña es incorrecta.",
    "auth/invalid-credential": "El correo o la contraseña no son correctos.",
    "auth/email-already-in-use": "Ese correo ya tiene una cuenta.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/operation-not-allowed":
      "Activa el acceso con correo y contraseña en Firebase Authentication.",
    "auth/too-many-requests":
      "Hubo varios intentos. Espera un momento e inténtalo de nuevo.",
    "auth/network-request-failed":
      "No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.",
  };
  return messages[code] ?? "No se pudo completar la solicitud de acceso.";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!firebaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(
      auth,
      (nextUser) => {
        setUser(nextUser);
        setReady(true);
        setError(null);
      },
      () => {
        setReady(true);
        setError("No se pudo comprobar la sesión. Vuelve a intentarlo.");
      },
    );
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      return await signInWithEmailAndPassword(
        requireAuth(),
        email.trim(),
        password,
      );
    } catch (cause) {
      const message = readableAuthError(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      setError(null);
      try {
        const credential = await createUserWithEmailAndPassword(
          requireAuth(),
          email.trim(),
          password,
        );
        await updateProfile(credential.user, { displayName: name.trim() });
        setUser(credential.user);
        return credential;
      } catch (cause) {
        const message = readableAuthError(cause);
        setError(message);
        throw new Error(message);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(requireAuth());
      setUser(null);
    } catch (cause) {
      const message = readableAuthError(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(requireAuth(), email.trim());
    } catch (cause) {
      const message = readableAuthError(cause);
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    user,
    ready,
    configured: firebaseConfigured,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };
}
