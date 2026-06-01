import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { bookingStatusesApi, BookingStatusConfig } from '../services/bookingStatuses';
import { useAuth } from './AuthContext';

interface BookingStatusesContextValue {
  statuses: BookingStatusConfig[];        // every status (for the settings screen)
  activeStatuses: BookingStatusConfig[];  // is_active only, in display order
  loading: boolean;
  refresh: () => Promise<void>;
  /** Hex colour for a status name, or null when the status isn't configured. */
  colorFor: (name: string | null | undefined) => string | null;
}

const Ctx = createContext<BookingStatusesContextValue | null>(null);

function isActive(s: BookingStatusConfig): boolean {
  return s.is_active === 1 || s.is_active === true;
}

export function BookingStatusesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<BookingStatusConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setStatuses([]); setLoading(false); return; }
    try {
      const rows = await bookingStatusesApi.getAll();
      setStatuses(rows);
    } catch {
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const colorMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of statuses) m.set(s.name, s.color);
    return m;
  }, [statuses]);

  const value = useMemo<BookingStatusesContextValue>(() => ({
    statuses,
    activeStatuses: statuses.filter(isActive),
    loading,
    refresh,
    colorFor: (name) => (name ? colorMap.get(name) ?? null : null),
  }), [statuses, loading, refresh, colorMap]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBookingStatuses(): BookingStatusesContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBookingStatuses must be used inside BookingStatusesProvider');
  return v;
}
