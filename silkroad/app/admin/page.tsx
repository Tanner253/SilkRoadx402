'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { CONFIG } from '@/config/constants';

export default function AdminLoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Block if admin is disabled
  useEffect(() => {
    if (CONFIG.DISABLE_ADMIN) {
      router.push('/');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError('Admin code is required');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('/api/admin/login', { code });
      
      if (response.data.success) {
        // Set localStorage flag (TEMPORARY MVP solution)
        localStorage.setItem('admin_authenticated', 'true');
        console.log('✅ Admin session started (localStorage)');
        
        // Redirect to dashboard
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid admin code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-background   px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground  mb-2">
            Admin Login
          </h1>
          <p className="text-muted-foreground ">
            Enter your admin code to access the dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-8 shadow-sm  ">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4  ">
              <p className="text-sm text-red-600 ">⚠️ {error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground ">
              Admin Code
            </label>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter admin code"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-foreground placeholder-zinc-400 focus:border-green-200 focus:outline-none focus:ring-2 focus:ring-green-600    "
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-green-600 py-3 text-sm font-medium text-primary-foreground hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            🔒 Admin access only. Unauthorized access is logged.
          </p>
        </form>
      </div>
    </div>
  );
}

