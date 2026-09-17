'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

interface Fundraiser {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  goalAmount?: number;
  raisedAmount?: number;
  category: string;
  status: string;
  views?: number;
  createdAt: string;
}

function MyFundraisersContent() {
  const { isConnected, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isConnected && publicKey) {
      fetchMyFundraisers();
    }
  }, [mounted, isConnected, publicKey]);

  const fetchMyFundraisers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/fundraisers?wallet=${publicKey!.toBase58()}&mine=true`);
      setFundraisers(response.data.fundraisers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your fundraisers');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const getFundedPct = (f: Fundraiser) =>
    Math.min(((f.raisedAmount || 0) / (f.goalAmount || f.price)) * 100, 100);

  return (
    <div className="min-h-screen bg-background py-12 px-4 pb-24">
      <div className="mx-auto max-w-5xl">
        <Breadcrumbs />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Fundraisers</h1>
            <p className="text-muted-foreground mt-1">Manage your campaigns</p>
          </div>
          <Link
            href="/fundraisers/new"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary transition-colors"
          >
            + New Fundraiser
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-lg border border-border bg-muted p-4 h-64" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button onClick={fetchMyFundraisers} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
              Try again
            </button>
          </div>
        ) : fundraisers.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted p-12 text-center">
            <p className="text-4xl mb-4">🚀</p>
            <h2 className="text-xl font-bold text-foreground mb-2">No fundraisers yet</h2>
            <p className="text-muted-foreground mb-6">Create your first campaign and start raising funds.</p>
            <Link
              href="/fundraisers/new"
              className="inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary transition-colors"
            >
              Create Fundraiser
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fundraisers.map((f) => (
              <Link
                key={f._id}
                href={`/fundraisers/${f._id}`}
                className="group rounded-lg border border-border bg-muted overflow-hidden hover:border-border transition-colors"
              >
                <div className="relative h-40 bg-muted">
                  {f.imageUrl ? (
                    <Image src={f.imageUrl} alt={f.title} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-3xl">📷</div>
                  )}
                  <span className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    f.status === 'approved' ? 'bg-green-600 text-foreground' :
                    f.status === 'pending' ? 'bg-yellow-600 text-foreground' :
                    'bg-red-600 text-foreground'
                  }`}>
                    {f.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">{f.category}</p>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">${(f.raisedAmount || 0).toFixed(2)} raised</span>
                      <span className="text-primary">{getFundedPct(f).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${getFundedPct(f)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Goal: ${(f.goalAmount || f.price).toFixed(2)}
                    </p>
                  </div>

                  {f.views !== undefined && (
                    <p className="text-[10px] text-muted-foreground mt-2">{f.views} views</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyFundraisersPage() {
  return (
    <ProtectedContent>
      <MyFundraisersContent />
    </ProtectedContent>
  );
}
