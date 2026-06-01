import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit2, Trash2, Loader2, AlertCircle,
  CheckCircle, XCircle, Shield, UserCheck, X, Save, Eye, EyeOff, KeyRound,
} from 'lucide-react';
import { api } from '../services/client';
import { authAdminApi, AppModule, AppRole, EmployeeOption } from '../services/authAdmin';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';
import { Permission } from '../lib/modulePermissions';
import { ColumnHeader } from './ui/ColumnHeader';
import { useTableControls, ColumnDef } from '../hooks/useTableControls';

type UserRole = string;

interface AppUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  role_name?: string;
  employee_id?: string | null;
  is_active: number | boolean;
  last_login?: string;
  created_at?: string;
  first_name?: string;
  surname?: string;
}

const SYSTEM_ROLE_COLORS: Record<string, string> = {
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

function groupModules(modules: AppModule[]) {
  return modules.reduce<Record<string, AppModule[]>>((acc, module) => {
    if (!acc[module.category]) acc[module.category] = [];
    acc[module.category].push(module);
    return acc;
  }, {});
}

interface UserFormProps {
  roles: AppRole[];
  employees: EmployeeOption[];
  user?: AppUser | null;
  mode: 'create' | 'edit';
  onSaved: () => void;
  onCancel: () => void;
}

function UserForm({ roles, employees, user, mode, onSaved, onCancel }: UserFormProps) {
  const defaultRole = roles[0]?.key || 'viewer';
  const [form, setForm] = useState({
    username:  user?.username || '',
    email:     user?.email    || '',
    role:      user?.role     || defaultRole,
    employee_id: user?.employee_id || '',
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

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((item) => item.id === employeeId);
    setForm((prev) => ({
      ...prev,
      employee_id: employeeId,
      email: employee?.email && !prev.email ? employee.email : prev.email,
      username: employee && mode === 'create' && !prev.username
        ? `${employee.first_name}.${employee.surname}`.toLowerCase().replace(/[^a-z0-9_.-]+/g, '')
        : prev.username,
    }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.username)  next.username = 'Username is required';
    if (!form.email)     next.email    = 'Email is required';
    if (!form.role)      next.role     = 'Role is required';
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
      employee_id: form.employee_id || null,
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
            {mode === 'create' ? 'Create User' : `Edit User - ${user?.username}`}
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
              onChange={(e) => set('role', e.target.value)}
              className={inputClass(!!errors.role)}
            >
              {roles.filter((r) => r.isActive).map((role) => (
                <option key={role.key} value={role.key}>{role.name}</option>
              ))}
            </select>
            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Employee</label>
            <select
              value={form.employee_id}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className={inputClass()}
            >
              <option value="">No employee link</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.surname}
                  {employee.employee_code ? ` (${employee.employee_code})` : ''}
                  {employee.is_active ? '' : ' - inactive'}
                </option>
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
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)}
                className="rounded border-gray-300"
              />
              Active
            </label>
          )}

          {submitError && <div className="text-sm text-red-600 dark:text-red-400">{submitError}</div>}

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
              {saving ? 'Saving...' : mode === 'create' ? 'Create User' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface RoleFormProps {
  role?: AppRole | null;
  modules: AppModule[];
  onSaved: () => void;
  onCancel: () => void;
}

function RoleForm({ role, modules, onSaved, onCancel }: RoleFormProps) {
  const mode = role ? 'edit' : 'create';
  const [form, setForm] = useState({
    key: role?.key || '',
    name: role?.name || '',
    description: role?.description || '',
    isActive: role ? role.isActive : true,
  });
  const [permissions, setPermissions] = useState<Set<Permission>>(
    () => new Set(role?.permissions || [])
  );
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const groupedModules = useMemo(() => groupModules(modules), [modules]);

  const hasPermission = (permission: Permission) => permissions.has(permission);

  const setModulePermission = (moduleKey: string, action: 'view' | 'edit', checked: boolean) => {
    setPermissions((prev) => {
      const next = new Set(prev);
      const view = `view:${moduleKey}` as Permission;
      const edit = `edit:${moduleKey}` as Permission;
      if (action === 'view') {
        checked ? next.add(view) : (next.delete(view), next.delete(edit));
      } else {
        checked ? (next.add(view), next.add(edit)) : next.delete(edit);
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setSubmitError('Role name is required');
      return;
    }
    setSaving(true);
    setSubmitError(null);
    const payload = {
      key: form.key.trim() || undefined,
      name: form.name.trim(),
      description: form.description.trim(),
      isActive: form.isActive,
      permissions: Array.from(permissions).sort(),
    };
    try {
      if (mode === 'create') {
        await authAdminApi.createRole(payload);
      } else {
        await authAdminApi.updateRole(role!.key, payload);
      }
      onSaved();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg text-gray-900 dark:text-gray-100">
            {mode === 'create' ? 'Create Role' : `Edit Role - ${role?.name}`}
          </h2>
          <button onClick={onCancel} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto">
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Role Key</label>
              <input
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                disabled={mode === 'edit'}
                placeholder="Auto-generated from role name"
                className={inputClass()}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Documentation Clerk"
                className={inputClass()}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className={inputClass()}
              />
            </div>
            {mode === 'edit' && (
              <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={role?.key === 'admin'}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-gray-300"
                />
                Active role
              </label>
            )}
          </div>

          <div className="p-6 space-y-5">
            {Object.entries(groupedModules).map(([category, categoryModules]) => (
              <div key={category} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                  {category}
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {categoryModules.map((module) => {
                    const view = `view:${module.key}` as Permission;
                    const edit = `edit:${module.key}` as Permission;
                    return (
                      <div key={module.key} className="grid grid-cols-[1fr_90px_90px] items-center px-4 py-3 gap-3">
                        <div>
                          <div className="text-sm text-gray-900 dark:text-gray-100">{module.name}</div>
                          <div className="text-xs text-gray-400">{module.key}</div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={hasPermission(view)}
                            onChange={(e) => setModulePermission(module.key, 'view', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          View
                        </label>
                        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={hasPermission(edit)}
                            onChange={(e) => setModulePermission(module.key, 'edit', e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          Edit
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {submitError && <div className="px-6 pb-3 text-sm text-red-600 dark:text-red-400">{submitError}</div>}

          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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
              {saving ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function UserManagement() {
  const { user: currentUser, can } = useAuth();
  const confirmDialog = useConfirm();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [modules, setModules] = useState<AppModule[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editingRole, setEditingRole] = useState<AppRole | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const canEditUsers = can('edit:user-management');
  const roleByKey = useMemo(() => new Map(roles.map((role) => [role.key, role])), [roles]);

  // Column descriptors for the Users table — each `get` returns the displayed cell text.
  const userColumnDefs = useMemo<ColumnDef<AppUser>[]>(() => ([
    { key: 'username', label: 'User', align: 'left', get: (u) => u.username },
    { key: 'email', label: 'Email', align: 'left', get: (u) => u.email },
    { key: 'role', label: 'Role', align: 'left', get: (u) => roleByKey.get(u.role)?.name || u.role_name || u.role },
    { key: 'status', label: 'Status', align: 'left', get: (u) => (Boolean(u.is_active) ? 'Active' : 'Inactive') },
    { key: 'last_login', label: 'Last Login', align: 'left', get: (u) => (u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'), sortValue: (u) => u.last_login || '' },
    { key: 'created_at', label: 'Created', align: 'left', get: (u) => (u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'), sortValue: (u) => u.created_at || '' },
  ]), [roleByKey]);

  // Column-level Excel-style filters + AZ/ZA sorting (shared across all list tables).
  const {
    processed: processedUsers,
    columnValues,
    columnFilters,
    setColumnFilter,
    clearAllColumnFilters,
    activeColumnFilterCount,
    sortDirFor,
    toggleSort,
  } = useTableControls(users, userColumnDefs);

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.get<AppUser[]>('/auth/users'),
      authAdminApi.getRoles(),
      authAdminApi.getModules(),
      authAdminApi.getEmployeeOptions(),
    ])
      .then(([nextUsers, nextRoles, nextModules, nextEmployees]) => {
        setUsers(nextUsers);
        setRoles(nextRoles);
        setModules(nextModules);
        setEmployees(nextEmployees);
      })
      .catch((err) => setError(err.message || 'Failed to load user management data'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDeleteUser = async (u: AppUser) => {
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

  const handleDeleteRole = async (role: AppRole) => {
    const ok = await confirmDialog({
      title: 'Delete role?',
      message: `Role "${role.name}" will be permanently removed. Users cannot be assigned to it afterwards.`,
      tone: 'danger',
      confirmLabel: 'Delete',
    });
    if (!ok) return;
    setDeleting(role.key);
    try {
      await authAdminApi.deleteRole(role.key);
      load();
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
          Loading users and roles...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Users, Roles & Permissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {users.length} user{users.length !== 1 ? 's' : ''} · {roles.length} role{roles.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canEditUsers && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditingRole(null); setRoleFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              <KeyRound className="w-4 h-4" />
              New Role
            </button>
            <button
              onClick={() => { setEditingUser(null); setUserFormOpen(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              New User
            </button>
          </div>
        )}
      </div>

      {!canEditUsers && (
        <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 px-4 py-3 text-sm text-yellow-800 dark:text-yellow-200">
          <Shield className="w-4 h-4 mt-0.5 shrink-0" />
          You have read-only access. Editing users, roles, and permissions requires user-management edit permission.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base text-gray-900 dark:text-gray-100">Roles & Module Permissions</h2>
          <span className="text-xs text-gray-400">{modules.length} modules</span>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Module Access</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {roles.map((role) => {
              const viewCount = role.permissions.filter((p) => p.startsWith('view:')).length;
              const editCount = role.permissions.filter((p) => p.startsWith('edit:')).length;
              return (
                <tr key={role.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${SYSTEM_ROLE_COLORS[role.key] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                        {role.key === 'admin' && <Shield className="w-3 h-3" />}
                        {role.name}
                      </span>
                      {role.isSystem && <span className="text-xs text-gray-400">System</span>}
                      {!role.isActive && <span className="text-xs text-red-500">Inactive</span>}
                    </div>
                    {role.description && <div className="text-xs text-gray-400 mt-1 max-w-xl">{role.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{role.userCount}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {viewCount} view · {editCount} edit
                  </td>
                  <td className="px-4 py-3">
                    {canEditUsers && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingRole(role); setRoleFormOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit role permissions"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!role.isSystem && role.userCount === 0 && (
                          <button
                            onClick={() => handleDeleteRole(role)}
                            disabled={deleting === role.key}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-40"
                            title="Delete role"
                          >
                            {deleting === role.key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-base text-gray-900 dark:text-gray-100">Users</h2>
          {activeColumnFilterCount > 0 && (
            <button
              onClick={clearAllColumnFilters}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              title="Clear all column filters"
            >
              Clear filters ({activeColumnFilterCount})
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {userColumnDefs.map((def) => (
                <th key={def.key} className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <ColumnHeader
                    label={def.label}
                    align={def.align}
                    values={columnValues[def.key] || []}
                    selected={columnFilters[def.key]}
                    onFilterChange={(next) => setColumnFilter(def.key, next)}
                    sortDir={sortDirFor(def.key)}
                    onSortChange={(dir) => toggleSort(def.key, dir)}
                  />
                </th>
              ))}
              <th className="px-4 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {processedUsers.map((u) => {
              const role = roleByKey.get(u.role);
              const roleLabel = role?.name || u.role_name || u.role;
              return (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-xs shrink-0">
                        {(u.first_name?.[0] || u.username[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          {u.username}
                          {u.id === currentUser?.id && <span className="text-xs text-blue-500 dark:text-blue-400">(you)</span>}
                        </div>
                        {(u.first_name || u.surname) && (
                          <div className="text-xs text-gray-400">{[u.first_name, u.surname].filter(Boolean).join(' ')}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${SYSTEM_ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}>
                      {u.role === 'admin' && <Shield className="w-3 h-3" />}
                      {roleLabel}
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
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 dark:text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3">
                    {canEditUsers && (
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingUser(u); setUserFormOpen(true); }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
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
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="py-12 text-center">
            <UserCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        )}
      </div>

      {userFormOpen && (
        <UserForm
          roles={roles}
          employees={employees}
          user={editingUser}
          mode={editingUser ? 'edit' : 'create'}
          onSaved={() => { setUserFormOpen(false); setEditingUser(null); load(); }}
          onCancel={() => { setUserFormOpen(false); setEditingUser(null); }}
        />
      )}

      {roleFormOpen && (
        <RoleForm
          role={editingRole}
          modules={modules}
          onSaved={() => { setRoleFormOpen(false); setEditingRole(null); load(); }}
          onCancel={() => { setRoleFormOpen(false); setEditingRole(null); }}
        />
      )}
    </div>
  );
}
