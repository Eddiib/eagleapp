import { useEffect, useState } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Shield, UserCheck, X, Save, Eye, EyeOff,
} from 'lucide-react';
import { api } from '../services/client';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';

type UserRole = 'admin' | 'manager' | 'sales' | 'operations' | 'accounting' | 'viewer';

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  is_active: number | boolean;
  last_login?: string;
  created_at?: string;
  first_name?: string;
  surname?: string;
}

const ROLES: UserRole[] = ['admin', 'manager', 'sales', 'operations', 'accounting', 'viewer'];

const ROLE_COLORS: Record<UserRole, string> = {
  admin:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  manager:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  sales:      'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  operations: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  accounting: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  viewer:     'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

const inputClass = (err?: boolean) =>
  `w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
    err ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
  } focus:outline-none focus:ring-2 focus:ring-blue-500/30`;

interface UserFormProps {
  user?: AppUser | null;
  mode: 'create' | 'edit';
  onSaved: () => void;
  onCancel: () => void;
}

function UserForm({ user, mode, onSaved, onCancel }: UserFormProps) {
  const [form, setForm] = useState({
    username:  user?.username || '',
    email:     user?.email    || '',
    role:      (user?.role    || 'viewer') as UserRole,
    password:  '',
    is_active: user ? Boolean(user.is_active) : true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.username)  next.username = 'Username is required';
    if (!form.email)     next.email    = 'Email is required';
    if (mode === 'create' && !form.password) next.password = 'Password is required';
    if (form.password && form.password.length < 8) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSubmitError(null);
    const body: Record<string, unknown> = {
      email: form.email,
      role: form.role,
      is_active: form.is_active,
    };
    if (mode === 'create') {
      body.username = form.username;
      body.password = form.password;
    }
    if (mode === 'edit' && form.password) {
      body.password = form.password;
    }
    try {
      if (mode === 'create') {
        await api.post('/auth/users', body);
      } else {
        await api.put(`/auth/users/${user!.id}`, body);
      }
      onSaved();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create User' : `Edit User — ${user?.username}`}
          </h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'create' && (
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                value={form.username}
                onChange={(e) => set('username', e.target.value)}
                placeholder="e.g. john.smith"
                className={inputClass(!!errors.username)}
              />
              {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="e.g. john@example.com"
              className={inputClass(!!errors.email)}
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value as UserRole)}
              className={inputClass()}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Password {mode === 'create' ? <span className="text-red-500">*</span> : <span className="text-gray-400 text-xs">(leave blank to keep current)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={mode === 'edit' ? 'Leave blank to keep current' : 'Min. 8 characters'}
                className={`${inputClass(!!errors.password)} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          {mode === 'edit' && (
            <div className="flex items-center gap-3">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
            </div>
          )}

          {submitError && (
            <div className="text-sm text-red-600 dark:text-red-400">{submitError}</div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserManagement() {
  const { user: currentUser } = useAuth();
  const confirmDialog = useConfirm();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const load = () => {
    setLoading(true);
    setError(null);
    api.get<AppUser[]>('/auth/users')
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (u: AppUser) => {
    const ok = await confirmDialog({
      title: 'Delete user?',
      message: `User "${u.username}" will be permanently removed. This cannot be undone.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeleting(u.id);
    try {
      await api.delete(`/auth/users/${u.id}`);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
    } catch (err: any) {
      alert(err.message || 'Delete failed');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading users…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} user{users.length !== 1 ? 's' : ''} · Admin access only
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setEditingUser(null); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New User
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          You have read-only access. Only admins can create, edit, or delete users.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs shrink-0">
                      {(u.first_name?.[0] || u.username[0]).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        {u.username}
                        {u.id === currentUser?.id && (
                          <span className="text-xs text-blue-500 dark:text-blue-400">(you)</span>
                        )}
                      </div>
                      {(u.first_name || u.surname) && (
                        <div className="text-xs text-gray-400">{[u.first_name, u.surname].filter(Boolean).join(' ')}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${ROLE_COLORS[u.role]}`}>
                    {u.role === 'admin' && <Shield className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {Boolean(u.is_active) ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <XCircle className="w-3.5 h-3.5" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                  {u.last_login ? new Date(u.last_login).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3">
                  {isAdmin && (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingUser(u); setFormOpen(true); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u)}
                          disabled={deleting === u.id}
                          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                          title="Delete"
                        >
                          {deleting === u.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center">
            <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        )}
      </div>

      {formOpen && (
        <UserForm
          user={editingUser}
          mode={editingUser ? 'edit' : 'create'}
          onSaved={() => { setFormOpen(false); setEditingUser(null); load(); }}
          onCancel={() => { setFormOpen(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}
