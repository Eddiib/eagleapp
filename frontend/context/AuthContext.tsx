import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken, ApiError } from '../services/client';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'sales' | 'operations' | 'accounting' | 'viewer';
  employee_id?: string;
  display_name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: Permission) => boolean;
}

// Permissions map: which roles can access what
export type Permission =
  | 'view:dashboard'
  | 'view:bookings'    | 'edit:bookings'
  | 'view:crm'         | 'edit:crm'
  | 'view:quotations'  | 'edit:quotations'
  | 'view:pricing'
  | 'view:partners'    | 'edit:partners'
  | 'view:employees'   | 'edit:employees'
  | 'view:services'    | 'edit:services'
  | 'view:equipment'   | 'edit:equipment'
  | 'view:cost'        | 'edit:cost'
  | 'manage:users';

const ROLE_PERMISSIONS: Record<AuthUser['role'], Permission[]> = {
  admin: [
    'view:dashboard',
    'view:bookings',   'edit:bookings',
    'view:crm',        'edit:crm',
    'view:quotations', 'edit:quotations',
    'view:pricing',
    'view:partners',   'edit:partners',
    'view:employees',  'edit:employees',
    'view:services',   'edit:services',
    'view:equipment',  'edit:equipment',
    'view:cost',       'edit:cost',
    'manage:users',
  ],
  manager: [
    'view:dashboard',
    'view:bookings',   'edit:bookings',
    'view:crm',        'edit:crm',
    'view:quotations', 'edit:quotations',
    'view:pricing',
    'view:partners',   'edit:partners',
    'view:employees',
    'view:services',   'edit:services',
    'view:equipment',  'edit:equipment',
    'view:cost',       'edit:cost',
  ],
  sales: [
    'view:dashboard',
    'view:bookings',   'edit:bookings',
    'view:crm',        'edit:crm',
    'view:quotations', 'edit:quotations',
    'view:partners',
    'view:equipment',
  ],
  operations: [
    'view:dashboard',
    'view:bookings',   'edit:bookings',
    'view:equipment',  'edit:equipment',
    'view:partners',
    'view:services',
  ],
  accounting: [
    'view:dashboard',
    'view:bookings',
    'view:cost',       'edit:cost',
    'view:partners',
  ],
  viewer: [
    'view:dashboard',
    'view:bookings',
    'view:crm',
    'view:quotations',
    'view:partners',
    'view:employees',
    'view:services',
    'view:equipment',
    'view:cost',
  ],
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    if (!localStorage.getItem('eagle_token')) {
      setLoading(false);
      return;
    }
    api.get<{ user: AuthUser }>('/auth/me')
      .then(({ user }) => { if (!cancelled) setUser(user); })
      .catch((err) => {
        // Any 401 already cleared the token in client.ts; just stay logged out.
        if (!(err instanceof ApiError) || err.status !== 401) clearToken();
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function login(username: string, password: string) {
    const data = await api.post<{ token: string; user: AuthUser }>('/auth/login', { username, password });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    // Best-effort server logout; ignore failures (token is stateless anyway).
    api.post('/auth/logout').catch(() => {});
    clearToken();
    setUser(null);
  }

  function can(permission: Permission): boolean {
    if (!user) return false;
    return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
