import { useCallback, useEffect, useState } from 'react';
import { Port, portsApi } from '../services/ports';

// Module-level cache so multiple components reuse a single fetch. The list
// changes rarely (admin-managed), so a long-lived cache is fine.
let portsCache: Port[] = [];
let cacheVersion = 0;

export function invalidatePortsCache() {
  portsCache = [];
  cacheVersion++;
}

export function usePorts() {
  const [ports, setPorts] = useState<Port[]>(portsCache);
  const [loading, setLoading] = useState(portsCache.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(cacheVersion);

  const fetchPorts = useCallback(async (force = false) => {
    if (!force && portsCache.length > 0) {
      setPorts(portsCache);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await portsApi.getAll();
      portsCache = data;
      setPorts(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load ports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPorts(); }, [fetchPorts, version]);

  const refresh = useCallback(() => {
    invalidatePortsCache();
    setVersion((v) => v + 1);
  }, []);

  return { ports, loading, error, refresh };
}

// Format a port for display ("Rotterdam (NLRTM)"). Falls back to the raw
// code if it's not in the loaded list yet.
export function getPortLabel(ports: Port[], code: string): string {
  if (!code) return '';
  const port = ports.find((p) => p.code === code);
  return port ? `${port.name} (${port.code})` : code;
}
