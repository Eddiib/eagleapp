import { api } from './client';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditEntry {
  id: string;
  table_name: string;
  row_id: string;
  action: AuditAction;
  actor_id: string | null;
  actor_name: string | null;
  changed_at: string;
  before_data: Record<string, unknown> | null;
  after_data:  Record<string, unknown> | null;
}

interface AuditQuery {
  table?: string;
  row_id?: string;
  actor_id?: string;
  action?: AuditAction;
  from?: string;
  to?: string;
  limit?: number;
}

function toQuery(q: AuditQuery): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
}

// The backend returns before_data / after_data as JSON text on some MySQL
// configurations and as parsed objects on others; normalize here.
function parseJsonField(value: unknown): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return null; }
  }
  return null;
}

export const auditLogApi = {
  list: async (q: AuditQuery = {}): Promise<AuditEntry[]> => {
    const rows = await api.get<AuditEntry[]>(`/audit-log${toQuery(q)}`);
    return rows.map(r => ({
      ...r,
      before_data: parseJsonField(r.before_data),
      after_data:  parseJsonField(r.after_data),
    }));
  },
};
