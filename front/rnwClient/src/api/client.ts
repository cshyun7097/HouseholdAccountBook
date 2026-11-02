import { getToken } from '@/api/token';

// Kept in .env (git-ignored), e.g. EXPO_PUBLIC_API_URL=http://<lan-ip>:8080/api for a local backend.
export const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error('EXPO_PUBLIC_API_URL is not set — add it to front/rnwClient/.env');

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
