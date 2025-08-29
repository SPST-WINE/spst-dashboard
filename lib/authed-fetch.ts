// lib/authed-fetch.ts
"use client";
import { authClient } from "./firebase-client";

export async function authedJson(input: RequestInfo | URL, init: RequestInit = {}) {
  const user = authClient().currentUser;
  const idToken = user ? await user.getIdToken() : null;
  const headers = new Headers(init.headers || {});
  if (idToken) headers.set("Authorization", "Bearer " + idToken);
  const res = await fetch(input, { ...init, headers, cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
