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
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
  riskLevel: 'standard' | 'high-risk';
}

function ListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hideMyListings, setHideMyListings] = useState(true);
  const [walletSearch, setWalletSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (mounted) {
      fetchListings();
    }
  }, [mounted]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/listings');
      setListings(response.data.listings || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  const categories = ['all', 'Trading Bot', 'API Tool', 'Script', 'Custom'];
  
  // Filter by category
  let filteredListings = selectedCategory === 'all' 
    ? listings 
    : listings.filter(l => l.category === selectedCategory);
  
  // Filter out user's own listings if toggle is enabled
  if (hideMyListings && publicKey) {
    filteredListings = filteredListings.filter(l => l.wallet !== publicKey.toBase58());
  }
  
  // Filter by wallet search
  if (walletSearch.trim()) {
    filteredListings = filteredListings.filter(l => 
      l.wallet.toLowerCase().includes(walletSearch.toLowerCase().trim())
    );
  }

  // Utility to truncate wallet address
  const truncateWallet = (wallet: string) => {
    if (wallet.length <= 12) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            Browse Software
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Discover private software, tools, and scripts
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Top Row: Category Filter */}
          <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-zinc-700 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              {category === 'all' ? 'All' : category}
            </button>
          ))}
          </div>

          {/* Bottom Row: Search and Toggle */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            {/* Wallet Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by vendor wallet address (e.g., 8KTD...GeMm or full address)"
                value={walletSearch}
                onChange={(e) => setWalletSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                  title="Grid View"
                >
                  ⊞
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-green-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                  title="List View"
                >
                  ☰
                </button>
              </div>

              {/* Hide My Listings Toggle */}
              <div className="flex items-center space-x-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideMyListings}
                    onChange={(e) => setHideMyListings(e.target.checked)}
                    className="sr-only peer"
                  />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-green-600"></div>
                  <span className="ms-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                    Hide my listings
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banners */}
        {!isConnected ? (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>👀 Browse Mode:</strong> You're viewing public listings. Connect your wallet to purchase or create listings.
            </p>
          </div>
        ) : !hasAcceptedTOS ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>⚠️ Action Required:</strong> Please accept the Terms of Service to interact with the marketplace.
            </p>
          </div>
        ) : !isTokenGated ? (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>👀 Browse Mode:</strong> You can view listings but need <strong>50,000 $SRx402</strong> tokens to purchase or create listings.
            </p>
          </div>
        ) : null}

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

        {/* Listings Grid/List */}
        {!loading && !error && (
          <>
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-600 dark:text-zinc-400">No listings found in this category</p>
              </div>
            ) : viewMode === 'grid' ? (
              // Grid View
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {/* Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      <Image
                        src={listing.imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                      {listing.riskLevel === 'high-risk' && (
                        <div className="absolute top-2 right-2 rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
                          High Risk
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h3 className="font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-2">
                          {listing.title}
                        </h3>
                      </div>

                      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {listing.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs text-zinc-500 dark:text-zinc-500">Price</span>
                          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            ${listing.price.toFixed(2)} USDC
                          </p>
                        </div>

                        <Link
                          href={`/listings/${listing._id}`}
                          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                        >
                          View Details
                        </Link>
                      </div>

                      <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {listing.category}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                          {truncateWallet(listing.wallet)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // List View
              <div className="space-y-2">
                {filteredListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="group overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="relative h-32 sm:h-24 sm:w-40 flex-shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                        <Image
                          src={listing.imageUrl}
                          alt={listing.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {listing.riskLevel === 'high-risk' && (
                          <div className="absolute top-1 right-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                            High Risk
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex flex-1 items-center justify-between p-3 sm:p-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 line-clamp-1 mb-1">
                            {listing.title}
                          </h3>

                          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-1 mb-2">
                            {listing.description}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                              {listing.category}
                            </span>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                              {truncateWallet(listing.wallet)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 ml-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                              ${listing.price.toFixed(2)}
                            </p>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">USDC</span>
                          </div>
                          <Link
                            href={`/listings/${listing._id}`}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors whitespace-nowrap"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ListingsPage() {
  return (
    <ProtectedContent>
      <ListingsPageContent />
    </ProtectedContent>
  );
}

