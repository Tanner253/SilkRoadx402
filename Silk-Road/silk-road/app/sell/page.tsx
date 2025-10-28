'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function SellPage() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Trading Bot',
    imageUrl: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Image must be JPEG, PNG, or WebP');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);

    // Auto-upload image
    await uploadImage(file);
  };

  const uploadImage = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post('/api/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (formData.title.length < 5 || formData.title.length > 100) {
      setError('Title must be 5-100 characters');
      return;
    }

    if (formData.description.length < 50 || formData.description.length > 2000) {
      setError('Description must be 50-2000 characters');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0.10) {
      setError('Price must be at least $0.10 USDC');
      return;
    }

    if (!formData.imageUrl) {
      setError('Please upload an image');
      return;
    }

    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post('/api/listings', {
        wallet: publicKey.toBase58(),
        title: formData.title,
        description: formData.description,
        price,
        category: formData.category,
        imageUrl: formData.imageUrl,
      });

      // Redirect to my-listings
      router.push('/my-listings');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create listing');
    } finally {
      setLoading(false);
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
            You need to connect your wallet and accept TOS to create listings
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black py-12 px-4">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
            List Your Software
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Create a new listing for your private software
          </p>
        </div>

        {/* Token Gating Warning */}
        {!isTokenGated && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You don't have enough $SRx402 tokens. Listing creation may be restricted.
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Advanced Trading Bot - MEV Arbitrage"
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              maxLength={100}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">{formData.title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your software in detail. What does it do? What are the key features? Who is it for?"
              rows={6}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              maxLength={2000}
              required
            />
            <p className="mt-1 text-xs text-zinc-500">{formData.description.length}/2000 characters (min 50)</p>
          </div>

          {/* Price */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Price (USDC) <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2 text-zinc-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0.10"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 pl-8 text-zinc-900 placeholder-zinc-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
                required
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">Minimum $0.10 USDC</p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
              Category <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              required
            >
              <option value="Trading Bot">Trading Bot</option>
              <option value="API Tool">API Tool</option>
              <option value="Script">Script</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {/* Image Upload */}
          <div className="mb-6">
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
                  className="block w-full text-sm text-zinc-500 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700 dark:text-zinc-400"
                />
                <p className="mt-2 text-xs text-zinc-500">
                  JPEG, PNG, or WebP. Max 5MB. Recommended 800x600px
                </p>
                {uploadingImage && (
                  <p className="mt-2 text-sm text-blue-600">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/my-listings"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ℹ️ Your listing will be reviewed by admins before going live on the marketplace.
              This usually takes 24-48 hours.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

