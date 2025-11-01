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
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
}

function MyListingsPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Edit modal state
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    imageUrl: '',
    demoVideoUrl: '',
    whitepaperUrl: '',
    githubUrl: '',
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const openEditModal = (listing: Listing) => {
    setEditingListing(listing);
    setEditFormData({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
      category: listing.category,
      imageUrl: listing.imageUrl,
      demoVideoUrl: listing.demoVideoUrl || '',
      whitepaperUrl: listing.whitepaperUrl || '',
      githubUrl: listing.githubUrl || '',
    });
    setImagePreview(listing.imageUrl);
    setEditError(null);
  };

  const closeEditModal = () => {
    setEditingListing(null);
    setEditFormData({
      title: '',
      description: '',
      price: '',
      category: '',
      imageUrl: '',
      demoVideoUrl: '',
      whitepaperUrl: '',
      githubUrl: '',
    });
    setImagePreview('');
    setImageFile(null);
    setEditError(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setEditError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setEditError('Image must be JPEG, PNG, or WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setEditError(null);

    // Auto-upload image
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const wallet = publicKey?.toBase58() || '';
      const uploadUrl = `/api/upload/image${wallet ? `?wallet=${wallet}` : ''}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEditFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload image';
      setEditError(errorMsg);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingListing || !publicKey) return;

    // Validation
    if (editFormData.title.length < 5 || editFormData.title.length > 100) {
      setEditError('Title must be 5-100 characters');
      return;
    }

    if (editFormData.description.length < 50 || editFormData.description.length > 2000) {
      setEditError('Description must be 50-2000 characters');
      return;
    }

    const price = parseFloat(editFormData.price);
    if (isNaN(price) || price < 0.1 || price > 10000) {
      setEditError('Price must be between $0.10 and $10,000 USDC');
      return;
    }

    if (!editFormData.imageUrl) {
      setEditError('Please upload an image');
      return;
    }

    try {
      setSubmittingEdit(true);
      await axios.put(`/api/listings/${editingListing._id}/edit`, {
        wallet: publicKey.toBase58(),
        title: editFormData.title,
        description: editFormData.description,
        price,
        category: editFormData.category,
        imageUrl: editFormData.imageUrl,
        demoVideoUrl: editFormData.demoVideoUrl || undefined,
        whitepaperUrl: editFormData.whitepaperUrl || undefined,
        githubUrl: editFormData.githubUrl || undefined,
      });

      closeEditModal();
      await fetchMyListings(); // Refresh list
      alert('Listing updated successfully!');
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update listing');
    } finally {
      setSubmittingEdit(false);
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
                        <button
                          onClick={() => openEditModal(listing)}
                          className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Edit
                        </button>
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

        {/* Edit Modal */}
        {editingListing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeEditModal}>
            <div 
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    Edit Listing
                  </h2>
                  <button
                    onClick={closeEditModal}
                    className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Update your listing information. Changes will require admin approval if currently live.
                </p>
                <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> The delivery URL cannot be changed. Only title, description, price, category, image, and public URLs can be edited.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitEdit} className="p-6 space-y-6">
                {/* Error Message */}
                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                    <p className="text-sm text-red-600 dark:text-red-400">⚠️ {editError}</p>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Title <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    maxLength={100}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">{editFormData.title.length}/100 characters</p>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Description <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={6}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    maxLength={2000}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">{editFormData.description.length}/2000 characters</p>
                </div>

                {/* Price & Category Row */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {/* Price */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Price (USDC) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editFormData.price}
                      onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Category <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                      required
                    >
                      <option value="Trading Bot">Trading Bot</option>
                      <option value="API Tool">API Tool</option>
                      <option value="Script">Script</option>
                      <option value="Jobs/Services">Jobs/Services</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Image Upload */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Product Image <span className="text-red-600">*</span>
                  </label>
                  <div className="flex items-start space-x-4">
                    {imagePreview && (
                      <div className="relative h-32 w-32 overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700">
                        <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-green-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-700 dark:text-zinc-400"
                      />
                      <p className="mt-2 text-xs text-zinc-500">
                        JPEG, PNG, or WebP. Max 5MB.
                      </p>
                      {uploadingImage && (
                        <p className="mt-2 text-sm text-green-600">Uploading...</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optional URLs */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    Optional Resources
                  </h3>
                  
                  <div>
                    <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
                      Demo Video URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.demoVideoUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, demoVideoUrl: e.target.value })}
                      placeholder="https://youtube.com/..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
                      Whitepaper URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.whitepaperUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, whitepaperUrl: e.target.value })}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-zinc-700 dark:text-zinc-300">
                      GitHub URL
                    </label>
                    <input
                      type="url"
                      value={editFormData.githubUrl}
                      onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                      placeholder="https://github.com/..."
                      className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:border-green-600 focus:ring-2 focus:ring-green-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex items-center justify-end space-x-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="rounded-lg border border-zinc-300 px-6 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit || uploadingImage}
                    className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingEdit ? 'Updating...' : 'Update Listing'}
                  </button>
                </div>
              </form>
            </div>
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

