import { useState, FormEvent, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchPublicBranding, fetchPublicLogoObjectUrl } from '../services/companySettings';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [brandName, setBrandName] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    (async () => {
      const branding = await fetchPublicBranding();
      if (!branding) return;
      setBrandName(branding.trading_name || branding.legal_name || null);
      if (branding.has_logo) {
        const url = await fetchPublicLogoObjectUrl();
        if (url) {
          setLogoUrl(url);
          revoked = url;
        }
      }
    })();
    return () => { if (revoked) URL.revokeObjectURL(revoked); };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1E1E1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={brandName || 'Company logo'}
              className="mx-auto max-h-20 w-auto object-contain"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#030213] rounded-xl">
              <span className="text-white text-2xl font-bold">E</span>
            </div>
          )}
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#262626] rounded-xl shadow-sm border border-gray-200 dark:border-[#374151] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Username or Email
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="admin"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#030213] dark:focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-[#374151] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#030213] dark:focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#030213] hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Eagle Logistics Management System
        </p>
      </div>
    </div>
  );
}
