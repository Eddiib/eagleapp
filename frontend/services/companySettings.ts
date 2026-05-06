import { api, authHeader, API_BASE_URL } from './client';

export interface CompanySettings {
  id: string;
  legal_name: string | null;
  trading_name: string | null;
  registration_number: string | null;
  tax_number: string | null;
  vat_number: string | null;
  eori_number: string | null;
  address_line: string | null;
  city: string | null;
  country: string | null;
  zip_code: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  default_currency: string | null;
  invoice_prefix: string | null;
  payment_terms: string | null;
  bank_details: string | null;
  invoice_footer: string | null;
  logo_mime_type: string | null;
  logo_size_bytes: number | null;
  updated_at: string | null;
  updated_by: string | null;
  has_logo: boolean;
  logo_url: string | null;
}

export type CompanySettingsUpdate = Partial<Omit<CompanySettings, 'id' | 'has_logo' | 'logo_url' | 'logo_mime_type' | 'logo_size_bytes' | 'updated_at' | 'updated_by'>>;

// Logo is served via a protected GET. The <img> tag can't send auth headers,
// so when we want to render it we fetch as a Blob and convert to an object URL.
async function fetchLogoObjectUrl(): Promise<string | null> {
  const res = await fetch(`${API_BASE_URL}/company-settings/logo`, { headers: authHeader() });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export interface PublicBranding {
  trading_name: string | null;
  legal_name: string | null;
  has_logo: boolean;
  logo_url: string | null;
}

export async function fetchPublicBranding(): Promise<PublicBranding | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/branding`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPublicLogoObjectUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/branding/logo`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export const companySettingsApi = {
  get: () => api.get<CompanySettings>('/company-settings'),
  update: (patch: CompanySettingsUpdate) => api.put<CompanySettings>('/company-settings', patch),
  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('logo', file);
    return api.postForm<CompanySettings>('/company-settings/logo', form);
  },
  deleteLogo: () => api.delete<CompanySettings>('/company-settings/logo'),
  fetchLogoObjectUrl,
};
