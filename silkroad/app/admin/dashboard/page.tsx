'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
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
  type?: 'listing' | 'fundraiser'; // Added to distinguish type
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'listings' | 'fundraisers' | 'reports' | 'logs'>('listings');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'pulled'>('pending');
  const [reports, setReports] = useState<any[]>([]);
  const [detailModalListing, setDetailModalListing] = useState<Listing | null>(null);
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
    if (activeTab === 'listings' || activeTab === 'fundraisers') {
      fetchListings();
    } else if (activeTab === 'reports') {
      fetchReports();
    }
  }, [activeTab]);

  // Auto-refresh listings every 30 seconds (logs handle their own refresh)
  useEffect(() => {
    if (!autoRefresh) return;

    if (activeTab === 'listings' || activeTab === 'fundraisers') {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing listings...');
      fetchListings();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    } else if (activeTab === 'reports') {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing reports...');
        fetchReports();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
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

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/admin/reports');
      setReports(response.data.reports || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem('admin_authenticated');
        console.log('❌ Admin session expired, redirecting...');
        router.push('/admin');
      } else {
        setError(err.response?.data?.error || 'Failed to load reports');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = () => {
    console.log('🔄 Manual refresh triggered');
    if (activeTab === 'listings' || activeTab === 'fundraisers') {
      fetchListings();
    } else if (activeTab === 'reports') {
      fetchReports();
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

  const handleApprove = async (id: string, type?: 'listing' | 'fundraiser') => {
    try {
      await axios.post(`/api/admin/listings/${id}/approve`);
      fetchListings();
    } catch (err: any) {
      const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
      alert(err.response?.data?.error || `Failed to approve ${itemType}`);
    }
  };

  const handleReject = async (id: string, type?: 'listing' | 'fundraiser') => {
    try {
      await axios.post(`/api/admin/listings/${id}/reject`);
      fetchListings();
    } catch (err: any) {
      const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
      alert(err.response?.data?.error || `Failed to reject ${itemType}`);
    }
  };

  const handleSetRisk = async (id: string, riskLevel: 'standard' | 'high-risk', type?: 'listing' | 'fundraiser') => {
    try {
      await axios.post(`/api/admin/listings/${id}/risk`, { riskLevel });
      fetchListings();
    } catch (err: any) {
      const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
      alert(err.response?.data?.error || `Failed to update ${itemType} risk level`);
    }
  };

  const handleRepublish = async (id: string, type?: 'listing' | 'fundraiser') => {
    const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
    if (confirm(`Republish this ${itemType}? It will be visible to buyers again.`)) {
      try {
        await axios.post(`/api/admin/listings/${id}/republish`);
        fetchListings();
      } catch (err: any) {
        alert(err.response?.data?.error || `Failed to republish ${itemType}`);
      }
    }
  };

  const handleTogglePin = async (id: string, currentlyPinned: boolean, type?: 'listing' | 'fundraiser') => {
    try {
      await axios.post(`/api/admin/listings/${id}/pin`, { 
        pinned: !currentlyPinned 
      });
      fetchListings();
    } catch (err: any) {
      const itemType = type === 'fundraiser' ? 'fundraiser' : 'listing';
      alert(err.response?.data?.error || `Failed to ${currentlyPinned ? 'unpin' : 'pin'} ${itemType}`);
    }
  };

  const filteredListings = listings.filter(l => {
    // First filter by type based on active tab
    if (activeTab === 'listings' && l.type === 'fundraiser') {
      return false; // Hide fundraisers in listings tab
    }
    if (activeTab === 'fundraisers' && l.type !== 'fundraiser') {
      return false; // Hide listings in fundraisers tab
    }

    // Then apply status filter
    if (filter === 'pending') return l.state === 'in_review' && !l.approved;
    if (filter === 'approved') return l.state === 'on_market' && l.approved;
    if (filter === 'pulled') return l.state === 'pulled';
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background   py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
          <h1 className="text-4xl font-bold text-foreground  mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground ">
              Review and manage marketplace {activeTab === 'listings' ? 'listings' : activeTab === 'fundraisers' ? 'fundraisers' : activeTab === 'reports' ? 'user reports' : 'system logs'}
          </p>
            <div className="mt-2 flex items-center space-x-3">
              <span className="text-xs text-muted-foreground ">
                Last updated: {getTimeSinceUpdate()}
              </span>
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="text-xs text-green-600 hover:text-green-700   disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🔄 Refresh Now
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-xs font-medium px-2 py-1 rounded ${
                  autoRefresh
                    ? 'bg-green-100 text-green-700  '
                    : 'bg-muted text-muted-foreground  '
                }`}
              >
                {autoRefresh ? '✓ Auto-refresh: ON' : 'Auto-refresh: OFF'}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50    transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-2 border-b border-border ">
          <button
            onClick={() => setActiveTab('listings')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'listings'
                  ? 'border-green-200 text-green-600 '
                : 'border-transparent text-muted-foreground hover:text-foreground  '
            }`}
          >
            📦 Listings
          </button>
          <button
            onClick={() => setActiveTab('fundraisers')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'fundraisers'
                  ? 'border-border text-primary '
                : 'border-transparent text-muted-foreground hover:text-foreground  '
            }`}
          >
            💝 Fundraisers
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'reports'
                  ? 'border-red-200 text-red-600 '
                : 'border-transparent text-muted-foreground hover:text-foreground  '
            }`}
          >
            🚨 Reports {reports.length > 0 && `(${reports.length})`}
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'logs'
                  ? 'border-green-200 text-green-600 '
                : 'border-transparent text-muted-foreground hover:text-foreground  '
            }`}
          >
            📝 Logs
          </button>
        </div>

        {/* Listing Filters */}
        {(activeTab === 'listings' || activeTab === 'fundraisers') && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all'
                    ? 'bg-green-600 text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted   '
            }`}
          >
            All ({listings.filter(l => activeTab === 'fundraisers' ? l.type === 'fundraiser' : l.type !== 'fundraiser').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted   '
            }`}
          >
            Pending ({listings.filter(l => {
              const isCorrectType = activeTab === 'fundraisers' ? l.type === 'fundraiser' : l.type !== 'fundraiser';
              return isCorrectType && l.state === 'in_review' && !l.approved;
            }).length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'approved'
                ? 'bg-green-600 text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted   '
            }`}
          >
            Approved ({listings.filter(l => {
              const isCorrectType = activeTab === 'fundraisers' ? l.type === 'fundraiser' : l.type !== 'fundraiser';
              return isCorrectType && l.state === 'on_market' && l.approved;
            }).length})
          </button>
          <button
            onClick={() => setFilter('pulled')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'pulled'
                ? 'bg-red-600 text-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted   '
            }`}
          >
            Pulled ({listings.filter(l => {
              const isCorrectType = activeTab === 'fundraisers' ? l.type === 'fundraiser' : l.type !== 'fundraiser';
              return isCorrectType && l.state === 'pulled';
            }).length})
          </button>
        </div>
        )}


        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-200 border-t-transparent"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6  ">
            <p className="text-sm text-red-600 ">⚠️ {error}</p>
          </div>
        )}

        {/* Listings/Fundraisers View */}
        {(activeTab === 'listings' || activeTab === 'fundraisers') && !loading && !error && (
          <div className="space-y-4">
            {filteredListings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground ">
                No {activeTab === 'fundraisers' ? 'fundraisers' : 'listings'} in this category
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div
                  key={listing._id}
                  className="rounded-lg border border-border bg-card p-6 shadow-sm  "
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
                          <button
                            onClick={() => setDetailModalListing(listing)}
                            className="font-semibold text-foreground  hover:text-green-600  transition-colors text-left"
                          >
                            {listing.title}
                          </button>
                            {listing.pinned === true && (
                              <span className="text-yellow-700" title="Pinned listing">
                                📌
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground ">
                            {listing.category} • ${listing.price.toFixed(2)} USDC
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            listing.riskLevel === 'high-risk'
                              ? 'bg-red-100 text-red-800  '
                              : 'bg-green-100 text-green-800  '
                          }`}>
                            {listing.riskLevel}
                          </span>
                        </div>
                      </div>

                      <p className="mb-3 text-sm text-muted-foreground  line-clamp-2">
                        {listing.description}
                      </p>

                      <p className="mb-3 text-xs text-muted-foreground">
                        Seller: {listing.wallet.slice(0, 8)}...{listing.wallet.slice(-6)}
                      </p>

                      {/* Actions */}
                      {listing.state === 'in_review' && !listing.approved && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(listing._id)}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-green-700 transition-colors"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-red-700 transition-colors"
                          >
                            ✗ Reject
                          </button>
                          <button
                            onClick={() => handleSetRisk(listing._id, listing.riskLevel === 'standard' ? 'high-risk' : 'standard')}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted    transition-colors"
                          >
                            Set as {listing.riskLevel === 'standard' ? 'High-Risk' : 'Standard'}
                          </button>
                        </div>
                      )}

                      {listing.state === 'on_market' && listing.approved && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600 ">
                            ✓ Live on marketplace
                          </span>
                          <button
                            onClick={() => handleTogglePin(listing._id, listing.pinned === true)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              listing.pinned === true
                                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200  '
                                : 'bg-muted text-muted-foreground hover:bg-muted  '
                            }`}
                          >
                            {listing.pinned === true ? '📌 Unpin' : '📌 Pin'}
                          </button>
                          <button
                            onClick={() => handleReject(listing._id)}
                            className="text-sm text-red-600 hover:text-red-700 "
                          >
                            Pull Listing
                          </button>
                        </div>
                      )}

                      {listing.state === 'pulled' && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-red-600 ">
                            ✗ Pulled from marketplace
                          </span>
                          <button
                            onClick={() => handleRepublish(listing._id)}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-green-700 transition-colors"
                          >
                            🔄 Republish
                          </button>
                          <button
                            onClick={() => handleSetRisk(listing._id, listing.riskLevel === 'standard' ? 'high-risk' : 'standard')}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted    transition-colors"
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

        {/* Reports View */}
        {activeTab === 'reports' && !loading && !error && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground ">
                No reports submitted yet
              </div>
            ) : (
              reports.map((report: any) => (
                <div
                  key={report._id}
                  className="rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm  "
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground ">
                          {report.title}
                        </h3>
                        {report.type === 'fundraiser' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary  ">
                            💝 Fundraiser
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground ">
                        <div>
                          <span className="font-medium">Seller:</span> {report.wallet.slice(0, 8)}...{report.wallet.slice(-6)}
                        </div>
                        <div>
                          <span className="font-medium">Reports:</span>{' '}
                          <span className="font-bold text-red-600 ">{report.reportCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`font-medium ${
                            report.state === 'on_market' ? 'text-green-600 ' :
                            report.state === 'pulled' ? 'text-red-600 ' :
                            'text-yellow-600 '
                          }`}>
                            {report.state === 'on_market' ? '✅ Live' : report.state === 'pulled' ? '❌ Pulled' : '⏳ In Review'}
                          </span>
                        </div>
                      </div>

                      {/* Recent Reports */}
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-muted-foreground ">Recent Reports:</p>
                        {report.reports.slice(0, 3).map((r: any, idx: number) => (
                          <div key={idx} className="text-xs bg-card  rounded p-2 border border-border ">
                            <div className="flex justify-between mb-1">
                              <span className="font-mono text-muted-foreground ">
                                {r.reporterWallet.slice(0, 8)}...{r.reporterWallet.slice(-4)}
                              </span>
                              <span className="text-muted-foreground ">
                                {new Date(r.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            {r.reason && (
                              <p className="text-muted-foreground ">"{r.reason}"</p>
                            )}
                          </div>
                        ))}
                        {report.reportCount > 3 && (
                          <p className="text-xs text-muted-foreground ">
                            ...and {report.reportCount - 3} more reports
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <Link
                        href={report.type === 'fundraiser' ? `/fundraisers/${report._id}` : `/listings/${report._id}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-700  "
                      >
                        View {report.type === 'fundraiser' ? 'Fundraiser' : 'Listing'} →
                      </Link>
                      {report.state === 'on_market' && (
                        <button
                          onClick={() => handleReject(report._id, report.type)}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-red-700 transition-colors"
                        >
                          Pull from Market
                        </button>
                      )}
                      {report.state === 'pulled' && (
                        <button
                          onClick={() => handleRepublish(report._id, report.type)}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-green-700 transition-colors"
                        >
                          Republish
                        </button>
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

        {/* Detail Modal */}
        {detailModalListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setDetailModalListing(null)}>
            <div className="bg-card  rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-card  border-b border-border  p-6 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-2xl font-bold text-foreground ">{detailModalListing.title}</h2>
                    {detailModalListing.type === 'fundraiser' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary  ">
                        💝 Fundraiser
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground ">{detailModalListing.category}</p>
                </div>
                <button
                  onClick={() => setDetailModalListing(null)}
                  className="text-muted-foreground hover:text-muted-foreground "
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Image */}
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border ">
                  <Image
                    src={detailModalListing.imageUrl}
                    alt={detailModalListing.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Price */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground  mb-1">Price</p>
                  <p className="text-2xl font-bold text-green-600 ">
                    ${detailModalListing.price.toFixed(2)} USDC
                  </p>
                </div>

                {/* Description */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground  mb-2">Description</p>
                  <p className="text-sm text-muted-foreground  whitespace-pre-wrap">
                    {detailModalListing.description}
                  </p>
                </div>

                {/* Seller */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground  mb-1">Seller Wallet</p>
                  <p className="text-sm font-mono text-foreground ">
                    {detailModalListing.wallet}
                  </p>
                </div>

                {/* Risk Level */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground  mb-1">Risk Level</p>
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                    detailModalListing.riskLevel === 'high-risk'
                      ? 'bg-red-100 text-red-700  '
                      : 'bg-green-100 text-green-700  '
                  }`}>
                    {detailModalListing.riskLevel === 'high-risk' ? '⚠️ High Risk' : '✓ Standard'}
                  </span>
                </div>

                {/* State */}
                <div>
                  <p className="text-sm font-medium text-muted-foreground  mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      detailModalListing.approved && detailModalListing.state === 'on_market'
                        ? 'bg-green-100 text-green-700  '
                        : detailModalListing.state === 'pulled'
                        ? 'bg-red-100 text-red-700  '
                        : 'bg-yellow-100 text-yellow-700  '
                    }`}>
                      {detailModalListing.approved && detailModalListing.state === 'on_market'
                        ? '✅ Live on Market'
                        : detailModalListing.state === 'pulled'
                        ? '❌ Pulled'
                        : '⏳ Awaiting Approval'}
                    </span>
                    {detailModalListing.pinned && (
                      <span className="text-yellow-700 text-xl" title="Pinned">📌</span>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground ">Created</p>
                    <p className="text-foreground ">
                      {new Date(detailModalListing.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-muted  border-t border-border  p-6">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setDetailModalListing(null)}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted   "
                  >
                    Close
                  </button>
                  <Link
                    href={detailModalListing.type === 'fundraiser' ? `/fundraisers/${detailModalListing._id}` : `/listings/${detailModalListing._id}`}
                    target="_blank"
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-green-700"
                  >
                    View Live Page →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

