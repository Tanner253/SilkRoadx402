'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { ProtectedContent } from '@/components/auth/ProtectedContent';

interface Listing {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: 'in_review' | 'on_market' | 'pulled';
  approved: boolean;
  createdAt: Date;
  updatedAt: Date;
  revenue?: number;
  salesCount?: number;
}

function MyListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (mounted && isConnected && hasAcceptedTOS && publicKey) {
      fetchMyListings();
    }
  }, [mounted, isConnected, hasAcceptedTOS, publicKey]);

  const fetchMyListings = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/listings?wallet=${publicKey.toBase58()}`);
      setListings(response.data.listings || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`/api/listings/${id}`);
      setListings(prev => prev.filter(l => l._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete listing');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Take this listing off the market? You can reactivate it later.')) {
      return;
    }

    try {
      setUpdatingId(id);
      await axios.patch(`/api/listings/${id}`, { state: 'pulled' });
      await fetchMyListings(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to deactivate listing');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReactivate = async (id: string) => {
    if (!confirm('Reactivate this listing? It will need admin approval again.')) {
      return;
    }

    try {
      setUpdatingId(id);
      await axios.patch(`/api/listings/${id}`, { 
        state: 'in_review',
        approved: false 
      });
      await fetchMyListings(); // Refresh list
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reactivate listing');
    } finally {
      setUpdatingId(null);
    }
  };

  if (!mounted) {
    return null;
  }

  if (!isConnected || !hasAcceptedTOS) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            You need to connect your wallet and accept TOS to view your listings
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const getStateColor = (state: string, approved: boolean) => {
    if (state === 'in_review' && !approved) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    if (state === 'on_market' && approved) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (state === 'pulled') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200';
  };

  const getStateText = (state: string, approved: boolean) => {
    if (state === 'in_review' && !approved) return 'In Review';
    if (state === 'on_market' && approved) return 'Live';
    if (state === 'pulled') return 'Pulled';
    return 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
              My Listings
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Manage your software listings
            </p>
          </div>
          <Link
            href="/listings/new"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Create Listing
          </Link>
        </div>

        {/* Token Gating Warning */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You don't have enough $SRx402 tokens. Some features may be restricted.
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && listings.length === 0 && (
          <div className="rounded-lg border border-zinc-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 text-5xl">📦</div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-2">
              No listings yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Create your first listing to start selling on SilkRoadx402
            </p>
            <Link
              href="/listings/new"
              className="inline-flex items-center justify-center rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        )}

        {/* Listings Table */}
        {!loading && !error && listings.length > 0 && (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Listing
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Created
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium uppercase text-zinc-600 dark:text-zinc-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {listings.map((listing) => (
                  <tr key={listing._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg">
                          <Image
                            src={listing.imageUrl}
                            alt={listing.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-zinc-900 dark:text-zinc-50">
                            {listing.title}
                          </div>
                          <div className="text-sm text-zinc-500 dark:text-zinc-400">
                            {listing.category}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                        ${listing.price.toFixed(2)} USDC
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        ${(listing.revenue || 0).toFixed(2)} USDC
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        {listing.salesCount || 0} {listing.salesCount === 1 ? 'sale' : 'sales'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStateColor(listing.state, listing.approved)}`}>
                        {getStateText(listing.state, listing.approved)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {new Date(listing.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          href={`/listings/${listing._id}`}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View
                        </Link>
                        {listing.state === 'on_market' && listing.approved && (
                          <button
                            onClick={() => handleDeactivate(listing._id)}
                            disabled={updatingId === listing._id}
                            className="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50 dark:text-orange-400 dark:hover:text-orange-300"
                          >
                            {updatingId === listing._id ? 'Updating...' : 'Deactivate'}
                          </button>
                        )}
                        {listing.state === 'pulled' && (
                          <button
                            onClick={() => handleReactivate(listing._id)}
                            disabled={updatingId === listing._id}
                            className="text-sm text-green-600 hover:text-green-700 disabled:opacity-50 dark:text-green-400 dark:hover:text-green-300"
                          >
                            {updatingId === listing._id ? 'Updating...' : 'Reactivate'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(listing._id)}
                          disabled={deletingId === listing._id}
                          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {deletingId === listing._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  return (
    <ProtectedContent>
      <MyListingsPageContent />
    </ProtectedContent>
  );
}

