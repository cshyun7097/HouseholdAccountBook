import { useSyncExternalStore } from 'react';

import { clearToken, getToken } from '@/api/token';

// The login token, shared app-wide so the router can guard screens.
// undefined = storage not read yet (don't route until it is); null = logged out.
let token: string | null | undefined;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

// When the JWT expires (ms since epoch), or 0 if it can't be read. Only used to log out on time;
// the backend still verifies the signature on every request.
function expiresAt(jwt: string) {
  try {
    const payload = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === 'number' ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function setSessionToken(value: string | null) {
  clearTimeout(expiryTimer);
  const msLeft = value ? expiresAt(value) - Date.now() : 0;
  if (value && msLeft <= 0) {
    clearToken(); // expired or unreadable: treat as logged out
    value = null;
  }
  if (value) {
    // setTimeout overflows past ~24.8 days; a token that long-lived just re-arms on the next app start
    expiryTimer = setTimeout(() => {
      clearToken();
      setSessionToken(null);
    }, Math.min(msLeft, 2 ** 31 - 1));
  }
  token = value;
  listeners.forEach((notify) => notify());
}

export const loadSession = async () => setSessionToken(await getToken());

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

export const useSessionToken = () =>
  useSyncExternalStore(
    subscribe,
    () => token,
    () => undefined, // static web render: nothing is known about the session yet
  );
