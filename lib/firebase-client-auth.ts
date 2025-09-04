// lib/firebase-client-auth.ts
'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
} from 'firebase/auth';
import { authClient } from '@/lib/firebase-client';

// --- util: rileva Safari/iOS Safari (esclude Chrome/Chromium su iOS) ---
function isSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /^((?!chrome|crios|android).)*safari/i.test(ua);
}

// --- LOGIN: popup dove possibile, redirect su Safari o se il popup viene bloccato ---
export async function loginWithGoogle(): Promise<void> {
  const auth = authClient();
  auth.useDeviceLanguage();
  const provider = new GoogleAuthProvider();

  // Safari & iOS → redirect diretto
  if (isSafari()) {
    await signInWithRedirect(auth, provider);
    return;
  }

  // Altri browser → prova popup, fallback a redirect se bloccato
  try {
    try {
      await setPersistence(auth, browserLocalPersistence);
    } catch {
      await setPersistence(auth, inMemoryPersistence);
    }
    await signInWithPopup(auth, provider);
  } catch (e: any) {
    const fallbackCodes = new Set([
      'auth/popup-blocked',
      'auth/popup-closed-by-user',
      'auth/cancelled-popup-request',
      'auth/operation-not-supported-in-this-environment',
    ]);
    if (fallbackCodes.has(e?.code)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    if (e?.code === 'auth/unauthorized-domain') {
      alert('Dominio non autorizzato in Firebase (Authentication → Settings → Authorized domains).');
      return;
    }
    console.error('loginWithGoogle error:', e);
    alert('Accesso non riuscito. Riprova.');
  }
}

// --- Da chiamare una sola volta al mount della pagina di login/dashboard ---
export async function completeRedirectIfNeeded(): Promise<void> {
  const auth = authClient();
  try {
    await getRedirectResult(auth);
    // se il redirect è andato a buon fine, l’utente è già autenticato
  } catch (e: any) {
    if (e?.code === 'auth/unauthorized-domain') {
      alert('Dominio non autorizzato in Firebase.');
    } else {
      console.warn('getRedirectResult warning:', e);
    }
  }
}

/**
 * Ritorna l'ID token Firebase dell’utente loggato (se presente).
 * Se l’utente non è ancora caricato in memoria, aspetta il primo onAuthStateChanged.
 */
export async function getIdToken(forceRefresh = false): Promise<string | undefined> {
  const auth = authClient();

  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken(forceRefresh);
    } catch {
      return undefined;
    }
  }

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

/** Logout + redirect al sito pubblico */
export async function logoutAndGoHome() {
  const auth = authClient();
  try {
    await auth.signOut();
  } finally {
    window.location.href = 'https://spst.it';
  }
}
