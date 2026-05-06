// Centralised API client. All service modules go through this so that
// auth headers, error parsing, and unauthorized redirects are consistent.

const BASE_URL = '/api';
const TOKEN_KEY = 'eagle_token';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Routes where a 401 should NOT trigger a global redirect (the caller handles it).
const AUTH_PATHS = ['/auth/login', '/auth/me'];

async function request<T>(path: string, options: RequestInit = {}, isMultipart = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return undefined as T;

  let data: any = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => null);
  }

  if (!res.ok) {
    const message = (data && data.error) || res.statusText || 'Request failed';
    const code = (data && data.code) || 'ERROR';

    if (res.status === 401 && !AUTH_PATHS.some(p => path.startsWith(p))) {
      // stale/expired token on a protected call — clear and bounce to login
      clearToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    throw new ApiError(res.status, message, code);
  }
  return (data as T);
}

export const api = {
  get:    <T>(path: string)                => request<T>(path),
  post:   <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST',   body: JSON.stringify(body ?? {}) }),
  put:    <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT',    body: JSON.stringify(body ?? {}) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string)                => request<T>(path, { method: 'DELETE' }),
  postForm: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }, true),
};

export function authHeader(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export const API_BASE_URL = BASE_URL;
