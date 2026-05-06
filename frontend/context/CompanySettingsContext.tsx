import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { companySettingsApi, CompanySettings } from '../services/companySettings';
import { useAuth } from './AuthContext';

interface CompanySettingsContextValue {
  settings: CompanySettings | null;
  logoUrl: string | null;          // object URL if a logo is uploaded, else null
  baseCurrency: string;            // default_currency with fallback 'EUR'
  refresh: () => Promise<void>;
}

const Ctx = createContext<CompanySettingsContextValue | null>(null);

export function CompanySettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user) { setSettings(null); setLogoUrl(null); return; }
    try {
      const s = await companySettingsApi.get();
      setSettings(s);
      if (s.has_logo) {
        const url = await companySettingsApi.fetchLogoObjectUrl();
        setLogoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return url; });
      } else {
        setLogoUrl(prev => { if (prev) URL.revokeObjectURL(prev); return null; });
      }
    } catch {
      setSettings(null);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => () => { if (logoUrl) URL.revokeObjectURL(logoUrl); }, [logoUrl]);

  const baseCurrency = (settings?.default_currency || 'EUR').toUpperCase();

  return (
    <Ctx.Provider value={{ settings, logoUrl, baseCurrency, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCompanySettings(): CompanySettingsContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCompanySettings must be used inside CompanySettingsProvider');
  return v;
}
