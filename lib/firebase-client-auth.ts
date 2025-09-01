// lib/firebase-client-auth.ts
'use client';

import { onAuthStateChanged } from 'firebase/auth';
import { authClient } from '@/lib/firebase-client';

/**
 * Ritorna l'ID token Firebase dell’utente loggato (se presente).
 * Se l’utente non è ancora caricato in memoria, aspetta il primo onAuthStateChanged.
 */
export async function getIdToken(forceRefresh = false): Promise<string | undefined> {
  const auth = authClient();

  // Se già disponibile in memoria
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch {
      return undefined;
    }
  }

  // Attendi il primo stato auth (utile dopo un hard refresh)
  const user = await new Promise<ReturnType<typeof authClient>['currentUser']>((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });

  if (!user) return undefined;

  try {
    return await user.getIdToken(forceRefresh);
  } catch {
    return undefined;
  }
}

/** true se esiste un utente attualmente loggato lato client */
export function isLoggedIn(): boolean {
  return !!authClient().currentUser;
}
