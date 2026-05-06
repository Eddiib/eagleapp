import { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, Loader2, AlertCircle, Save, Building2, CheckCircle2 } from 'lucide-react';
import { companySettingsApi, CompanySettings as CompanySettingsModel, CompanySettingsUpdate } from '../services/companySettings';
import { useAuth } from '../context/AuthContext';
import { useConfirm } from '../context/ConfirmDialog';

type FormState = Record<string, string>;

const TEXT_FIELDS: Array<{ key: keyof CompanySettingsUpdate; label: string; section: 'company' | 'contact' | 'invoice' | 'tax'; type?: 'text' | 'textarea'; maxLength?: number; placeholder?: string }> = [
  { key: 'legal_name',           label: 'Legal name',           section: 'company' },
  { key: 'trading_name',         label: 'Trading name',         section: 'company' },
  { key: 'registration_number',  label: 'Registration number',  section: 'tax' },
  { key: 'tax_number',           label: 'Tax number',           section: 'tax' },
  { key: 'vat_number',           label: 'VAT number',           section: 'tax' },
  { key: 'eori_number',          label: 'EORI number',          section: 'tax' },
  { key: 'address_line',         label: 'Street address',       section: 'contact' },
  { key: 'city',                 label: 'City',                 section: 'contact' },
  { key: 'country',              label: 'Country',              section: 'contact' },
  { key: 'zip_code',             label: 'Zip / postal code',    section: 'contact' },
  { key: 'phone',                label: 'Phone',                section: 'contact' },
  { key: 'email',                label: 'Email',                section: 'contact' },
  { key: 'website',              label: 'Website',              section: 'contact' },
  { key: 'default_currency',     label: 'Default currency',     section: 'invoice', placeholder: 'EUR', maxLength: 3 },
  { key: 'invoice_prefix',       label: 'Invoice prefix',       section: 'invoice', placeholder: 'INV',  maxLength: 20 },
  { key: 'payment_terms',        label: 'Default payment terms',section: 'invoice' },
  { key: 'bank_details',         label: 'Bank details (invoice footer)', section: 'invoice', type: 'textarea' },
  { key: 'invoice_footer',       label: 'Invoice footer notes',          section: 'invoice', type: 'textarea' },
];

function toFormState(s: CompanySettingsModel | null): FormState {
  const base: FormState = {};
  for (const f of TEXT_FIELDS) {
    base[f.key as string] = (s?.[f.key] as string | null | undefined) ?? '';
  }
  return base;
}

export function CompanySettings() {
  const { user } = useAuth();
  const confirmDialog = useConfirm();
  const isAdmin = user?.role === 'admin';

  const [settings, setSettings] = useState<CompanySettingsModel | null>(null);
  const [form, setForm] = useState<FormState>(toFormState(null));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk,    setSaveOk]    = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshLogo = async (s: CompanySettingsModel | null) => {
    if (logoUrl) URL.revokeObjectURL(logoUrl);
    if (s?.has_logo) {
      const url = await companySettingsApi.fetchLogoObjectUrl();
      setLogoUrl(url);
    } else {
      setLogoUrl(null);
    }
  };

  const load = async () => {
    setLoading(true); setLoadError(null);
    try {
      const s = await companySettingsApi.get();
      setSettings(s);
      setForm(toFormState(s));
      await refreshLogo(s);
    } catch (err: any) {
      setLoadError(err?.message ?? 'Failed to load settings');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    return () => { if (logoUrl) URL.revokeObjectURL(logoUrl); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFieldChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setSaveOk(false);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setSaving(true); setSaveError(null); setSaveOk(false);
    try {
      const patch: CompanySettingsUpdate = {};
      for (const f of TEXT_FIELDS) {
        const current = (settings?.[f.key] as string | null | undefined) ?? '';
        const next    = form[f.key as string] ?? '';
        if (current !== next) (patch as any)[f.key] = next || null;
      }
      const updated = await companySettingsApi.update(patch);
      setSettings(updated);
      setForm(toFormState(updated));
      setSaveOk(true);
    } catch (err: any) {
      setSaveError(err?.message ?? 'Save failed');
    } finally { setSaving(false); }
  };

  const handleLogoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;
    setUploading(true); setUploadError(null);
    try {
      const updated = await companySettingsApi.uploadLogo(file);
      setSettings(updated);
      await refreshLogo(updated);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogoDelete = async () => {
    if (!isAdmin || !settings?.has_logo) return;
    const ok = await confirmDialog({
      title: 'Remove logo?',
      message: 'The current company logo will be deleted. You can upload a new one anytime.',
      tone: 'danger',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    try {
      const updated = await companySettingsApi.deleteLogo();
      setSettings(updated);
      await refreshLogo(updated);
    } catch (err: any) {
      setUploadError(err?.message ?? 'Delete failed');
    }
  };

  const inputClass = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 disabled:bg-gray-50 disabled:text-gray-500 dark:disabled:bg-gray-800';

  const renderField = (f: typeof TEXT_FIELDS[number]) => {
    const commonProps = {
      value: form[f.key as string] ?? '',
      onChange: (e: any) => handleFieldChange(f.key as string, e.target.value),
      disabled: !isAdmin || saving,
      placeholder: f.placeholder,
      maxLength: f.maxLength,
      className: inputClass + ' w-full',
    };
    return (
      <div key={f.key as string}>
        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{f.label}</label>
        {f.type === 'textarea'
          ? <textarea rows={3} {...commonProps} />
          : <input type="text" {...commonProps} />}
      </div>
    );
  };

  const sectionFields = (section: typeof TEXT_FIELDS[number]['section']) =>
    TEXT_FIELDS.filter(f => f.section === section);

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        Loading settings…
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="py-12 flex items-center justify-center text-sm text-red-600">
        <AlertCircle className="w-4 h-4 mr-2" />
        {loadError}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-gray-100">Company Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Branding, contact details and invoice defaults used across the app. {!isAdmin && <span className="italic">Read-only — ask an admin to make changes.</span>}
        </p>
      </div>

      {/* Logo */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm text-gray-900 dark:text-gray-100">Company logo</h2>
        </div>
        <div className="flex items-start gap-6">
          <div className="w-40 h-40 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
            {logoUrl
              ? <img src={logoUrl} alt="Company logo" className="max-w-full max-h-full object-contain" />
              : <span className="text-xs text-gray-400">No logo</span>}
          </div>
          <div className="flex-1 text-sm">
            <p className="text-gray-600 dark:text-gray-400">
              PNG, JPEG, SVG or WebP. Max 512 KB. Transparent backgrounds look best in the sidebar and on invoices.
            </p>
            {uploadError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                {uploadError}
              </div>
            )}
            <div className="mt-3 flex gap-2">
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden" onChange={handleLogoPick} disabled={!isAdmin || uploading} />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                disabled={!isAdmin || uploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {settings?.has_logo ? 'Replace logo' : 'Upload logo'}
              </button>
              {settings?.has_logo && (
                <button type="button" onClick={handleLogoDelete}
                  disabled={!isAdmin || uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-red-600 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 text-sm">
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm text-gray-900 dark:text-gray-100 mb-3">Company</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionFields('company').map(renderField)}
        </div>
      </div>

      {/* Tax / registration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm text-gray-900 dark:text-gray-100 mb-3">Tax &amp; registration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionFields('tax').map(renderField)}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm text-gray-900 dark:text-gray-100 mb-3">Contact &amp; address</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionFields('contact').map(renderField)}
        </div>
      </div>

      {/* Invoice defaults */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm text-gray-900 dark:text-gray-100 mb-3">Invoice defaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sectionFields('invoice').map(renderField)}
        </div>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          Default currency is the base used by Dashboard and P&amp;L aggregations. Changing it re-normalizes all multi-currency totals.
        </p>
      </div>

      {/* Save footer */}
      <div className="sticky bottom-4 flex items-center gap-3">
        <button type="button" onClick={handleSave}
          disabled={!isAdmin || saving}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm shadow-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
        {saveError && (
          <span className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4" /> {saveError}
          </span>
        )}
        {saveOk && (
          <span className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4" /> Saved
          </span>
        )}
      </div>
    </div>
  );
}
