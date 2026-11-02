import Constants from 'expo-constants';

import { getToken } from '@/api/token';

// In dev, reach the backend on the same machine that serves the app, so emulators and real devices both work.
// Web has no hostUri: use the host the page was opened from (a phone browser's "localhost" is the phone itself).
// `location` is undefined during static web rendering, where no request is made anyway.
const devHost =
  Constants.expoConfig?.hostUri?.split(':')[0] ??
  (typeof location !== 'undefined' ? location.hostname : 'localhost');
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? `http://${devHost}:8080/api`;

// Mirrors the backend GlobalExceptionHandler body: { status, error, message }
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  });

  // Some endpoints return plain strings (e.g. "회원가입 완료핑"), others JSON.
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    throw new ApiError(res.status, (isJson && body?.message) || body || res.statusText);
  }
  return body as T;
}

export const get = <T>(path: string) => api<T>(path);
export const post = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(data) });
export const patch = <T>(path: string, data?: unknown) =>
  api<T>(path, { method: 'PATCH', body: JSON.stringify(data) });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });
