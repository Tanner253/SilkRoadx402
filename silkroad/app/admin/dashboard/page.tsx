'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/config/constants';
import { LogsPanel } from './LogsPanel';

interface Listing {
  _id: string;
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
  state: 'in_review' | 'on_market' | 'pulled';
  approved: boolean;
  pinned?: boolean;
  pinnedAt?: Date;
  createdAt: Date;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'logs'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'pulled'>('pending');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Check admin authentication (localStorage)
  useEffect(() => {
    // Block if admin is disabled
    if (CONFIG.DISABLE_ADMIN) {
      router.push('/');
      return;
    }

    // Check localStorage for admin session (TEMPORARY MVP solution)
    const isAdminAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
    
    if (!isAdminAuthenticated) {
      console.log('❌ No admin session found, redirecting to login...');
      router.push('/admin');
      return;
    }

    console.log('✅ Admin session verified (localStorage)');
    fetchListings();
  }, [router]);

  // Fetch listings when tab changes
  useEffect(() => {
    if (activeTab === 'listings') {
      fetchListings();
    }
  }, [activeTab]);

  // Auto-refresh listings every 30 seconds (logs handle their own refresh)
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'listings') return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing listings...');
      fetchListings();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, activeTab]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/listings');
      setListings(response.data.listings || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Clear localStorage and redirect to login
        localStorage.removeItem('admin_authenticated');
        console.log('❌ Admin session expired, redirecting...');
        router.push('/admin');
      } else {
        setError(err.response?.data?.error || 'Failed to load listings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    if (activeTab === 'listings') {
      fetchListings();
    } else {
      // Logs panel handles its own refresh via lastUpdated trigger
      setLastUpdated(new Date());
    }
  };

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    return `${diffMins}m ago`;
  };

  const handleLogout = () => {
    // Clear admin session
    localStorage.removeItem('admin_authenticated');
    console.log('✅ Admin logged out');
    router.push('/admin');
  };

  const handleApprove = async (id: string) => {
    try {
      await axios.post(`/api/admin/listings/${id}/approve`);
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve listing');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await axios.post(`/api/admin/listings/${id}/reject`);
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject listing');
    }
  };

  const handleSetRisk = async (id: string, riskLevel: 'standard' | 'high-risk') => {
    try {
      await axios.post(`/api/admin/listings/${id}/risk`, { riskLevel });
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update risk level');
    }
  };

  const handleRepublish = async (id: string) => {
    if (confirm('Republish this listing? It will be visible to buyers again.')) {
      try {
        await axios.post(`/api/admin/listings/${id}/republish`);
        fetchListings();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to republish listing');
      }
    }
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean) => {
    try {
      await axios.post(`/api/admin/listings/${id}/pin`, { 
        pinned: !currentlyPinned 
      });
      fetchListings();
    } catch (err: any) {
      alert(err.response?.data?.error || `Failed to ${currentlyPinned ? 'unpin' : 'pin'} listing`);
    }
  };

  const filteredListings = listings.filter(l => {
    if (filter === 'pending') return l.state === 'in_review' && !l.approved;
    if (filter === 'approved') return l.state === 'on_market' && l.approved;
    if (filter === 'pulled') return l.state === 'pulled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Review and manage marketplace {activeTab === 'listings' ? 'listings' : 'system logs'}
          </p>
            <div className="mt-2 flex items-center space-x-3">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Last updated: {getTimeSinceUpdate()}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Refresh Now
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs font-medium px-2 py-1 rounded ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {autoRefresh ? '✓ Auto-refresh: ON' : 'Auto-refresh: OFF'}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'listings'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            📦 Listings
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'logs'
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                : 'border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            📝 Logs
          </button>
        </div>

        {/* Listing Filters */}
        {activeTab === 'listings' && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                    ? 'bg-green-600 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            All ({listings.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Pending ({listings.filter(l => l.state === 'in_review' && !l.approved).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Approved ({listings.filter(l => l.state === 'on_market' && l.approved).length})
          </button>
          <button
            onClick={() => setFilter('pulled')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pulled'
                ? 'bg-red-600 text-white'
                : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            Pulled ({listings.filter(l => l.state === 'pulled').length})
          </button>
        </div>
        )}


        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950">
            <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
          </div>
        )}

        {/* Listings View */}
        {activeTab === 'listings' && !loading && !error && (
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 text-zinc-600 dark:text-zinc-400">
                No listings in this category
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div
                  key={listing._id}
                  className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start space-x-4">
                    {/* Image */}
                    <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                            {listing.title}
                          </h3>
                            {listing.pinned === true && (
                              <span className="text-yellow-500" title="Pinned listing">
                                📌
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {listing.category} • ${listing.price.toFixed(2)} USDC
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            listing.riskLevel === 'high-risk'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {listing.riskLevel}
                          </span>
                        </div>
                      </div>

                      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {listing.description}
                      </p>

                      <p className="mb-3 text-xs text-zinc-500">
                        Seller: {listing.wallet.slice(0, 8)}...{listing.wallet.slice(-6)}
                      </p>

                      {/* Actions */}
                      {listing.state === 'in_review' && !listing.approved && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(listing._id)}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            ✗ Reject
                          </button>
                          <button
                            onClick={() => handleSetRisk(listing._id, listing.riskLevel === 'standard' ? 'high-risk' : 'standard')}
                            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Set as {listing.riskLevel === 'standard' ? 'High-Risk' : 'Standard'}
                          </button>
                        </div>
                      )}

                      {listing.state === 'on_market' && listing.approved && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            ✓ Live on marketplace
                          </span>
                          <button
                            onClick={() => handleTogglePin(listing._id, listing.pinned === true)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              listing.pinned === true
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                                : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                          >
                            {listing.pinned === true ? '📌 Unpin' : '📌 Pin'}
                          </button>
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                          >
                            Pull Listing
                          </button>
                        </div>
                      )}

                      {listing.state === 'pulled' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            ✗ Pulled from marketplace
                          </span>
                          <button
                            onClick={() => handleRepublish(listing._id)}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            🔄 Republish
                          </button>
                          <button
                            onClick={() => handleSetRisk(listing._id, listing.riskLevel === 'standard' ? 'high-risk' : 'standard')}
                            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                          >
                            Set as {listing.riskLevel === 'standard' ? 'High-Risk' : 'Standard'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Logs View - Isolated Component */}
        {activeTab === 'logs' && (
          <LogsPanel 
            autoRefresh={autoRefresh}
            lastUpdated={lastUpdated}
            onUpdate={() => setLastUpdated(new Date())}
          />
        )}
      </div>
    </div>
  );
}

