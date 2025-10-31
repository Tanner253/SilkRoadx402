'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ProtectedContent } from '@/components/auth/ProtectedContent';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress } from '@solana/spl-token';

function NewListingPageContent() {
  const { isConnected, hasAcceptedTOS, isTokenGated, mounted } = useAuth();
  const { publicKey } = useWallet();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Trading Bot',
    imageUrl: '',
    deliveryUrl: '',  // REQUIRED: Download link for buyers
    demoVideoUrl: '',  // Optional
    whitepaperUrl: '',  // Optional
    githubUrl: '',  // Optional
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

      // Include wallet for rate limiting
      const wallet = publicKey?.toBase58() || '';
      const uploadUrl = `/api/upload/image${wallet ? `?wallet=${wallet}` : ''}`;

      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData(prev => ({ ...prev, imageUrl: response.data.imageUrl }));
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to upload image';
      setError(errorMsg);
      
      // Show rate limit info if available
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        }
      }
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

    if (!formData.deliveryUrl) {
      setError('Delivery URL is required (the download link buyers will receive)');
      return;
    }

    if (!publicKey) {
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);

      // ====================================
      // VALIDATE: Check if seller has USDC account
      // ====================================
      console.log('🔍 Validating seller can receive USDC payments...');
      
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl, 'confirmed');
      
      // USDC mainnet mint
      const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
      
      // Get seller's USDC token account
      const sellerUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        publicKey
      );
      
      console.log(`📤 Checking USDC account: ${sellerUsdcAccount.toBase58()}`);
      
      // Check if account exists
      const accountInfo = await connection.getAccountInfo(sellerUsdcAccount);
      
      if (!accountInfo) {
        console.error('❌ Seller does not have a USDC token account');
        setError(
          '❌ Your wallet cannot receive USDC payments. You need to create a USDC token account first. ' +
          'Solution: Open Phantom wallet → Add a small amount of USDC (even $0.01) to create your account, ' +
          'or use a different wallet like Phantom that automatically creates token accounts. ' +
          'This is a one-time setup to enable receiving payments.'
        );
        setLoading(false);
        return;
      }
      
      console.log('✅ Seller has a valid USDC account');

      // ====================================
      // CREATE LISTING
      // ====================================
      const response = await axios.post('/api/listings', {
        wallet: publicKey.toBase58(),
        title: formData.title,
        description: formData.description,
        price,
        category: formData.category,
        imageUrl: formData.imageUrl,
        deliveryUrl: formData.deliveryUrl,
        demoVideoUrl: formData.demoVideoUrl || undefined,
        whitepaperUrl: formData.whitepaperUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
      });

      // Redirect to my-listings
      router.push('/listings/my');
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to create listing';
      setError(errorMsg);

      // Show additional info for rate limits (429 status)
      if (err.response?.status === 429) {
        const resetAt = err.response?.data?.resetAt;
        const currentCount = err.response?.data?.currentCount;
        const limit = err.response?.data?.limit;

        if (resetAt) {
          const resetTime = new Date(resetAt).toLocaleTimeString();
          setError(`${errorMsg} Try again after ${resetTime}.`);
        } else if (currentCount !== undefined && limit !== undefined) {
          setError(`${errorMsg} (${currentCount}/${limit} listings)`);
        }
      }
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

        {/* 🎉 LIMITED TIME PROMOTIONAL BANNER */}
        <div className="mb-8 overflow-hidden rounded-2xl border-4 border-purple-500 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-1 shadow-2xl">
          <div className="rounded-xl bg-white dark:bg-zinc-900 p-6">
            <div className="text-center">
              {/* Emoji Header */}
              <div className="mb-3 text-4xl">
                🎉 💰 ✅
              </div>
              
              {/* Main Heading */}
              <h2 className="mb-2 text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
                LIMITED TIME LAUNCH BONUS!
              </h2>
              
              {/* Key Message */}
              <div className="mb-3 inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 shadow-lg">
                <span className="text-2xl">✅</span>
                <span className="text-xl font-black text-white uppercase tracking-wide">
                  Guaranteed First Sale
                </span>
              </div>
              
              {/* Description */}
              <p className="text-base text-zinc-700 dark:text-zinc-300 mb-2">
                <strong>Price your listing under $11 USDC</strong> and we'll purchase it ourselves!
              </p>
              
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                🎁 Every listing below $11 is guaranteed to get at least 1 sale
              </p>
              
              {/* Fine Print */}
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 italic">
                ⏰ Limited time offer - First 100 listings only
              </p>
            </div>
          </div>
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
            <div className="mt-2 flex items-start space-x-2">
              <p className="text-xs text-zinc-500">Minimum $0.10 USDC</p>
            </div>
            {/* Launch Bonus Reminder */}
            {formData.price && parseFloat(formData.price) < 11 && parseFloat(formData.price) >= 0.10 && (
              <div className="mt-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 p-3 dark:from-green-950 dark:to-emerald-950">
                <p className="text-sm font-bold text-green-700 dark:text-green-300 flex items-center">
                  <span className="text-xl mr-2">🎉</span>
                  LAUNCH BONUS ACTIVE! This listing qualifies for a guaranteed first sale!
                </p>
              </div>
            )}
            {formData.price && parseFloat(formData.price) >= 11 && (
              <div className="mt-2 rounded-lg bg-yellow-50 border border-yellow-300 p-3 dark:bg-yellow-950 dark:border-yellow-700">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  💡 <strong>Tip:</strong> Price under $11 USDC to qualify for a guaranteed first sale (limited time)
                </p>
              </div>
            )}
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

          {/* Private Delivery URL Section */}
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white font-bold flex-shrink-0">
                🔒
              </div>
              <div>
                <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
                  Private Delivery URL <span className="text-red-600">*</span>
                </h3>
                <p className="text-xs text-red-800 dark:text-red-200">
                  ⚠️ <strong>ENCRYPTED & PRIVATE:</strong> Only shown to buyers after successful payment. Never displayed publicly.
                </p>
              </div>
            </div>
            
            <input
              type="url"
              value={formData.deliveryUrl}
              onChange={(e) => setFormData({ ...formData, deliveryUrl: e.target.value })}
              placeholder="https://github.com/yourrepo/releases/v1.0.0/software.zip"
              className="w-full rounded-lg border border-red-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600 dark:border-red-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              required
            />
            <p className="mt-2 text-xs text-red-700 dark:text-red-300">
              The download link buyers receive after purchase (GitHub release, Dropbox, Google Drive, etc.)
            </p>
          </div>

          {/* Public Information Section */}
          <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white font-bold flex-shrink-0">
                👁️
              </div>
              <div>
                <h3 className="text-sm font-bold text-green-900 dark:text-green-100 mb-1">
                  Public Resources (Optional)
                </h3>
                <p className="text-xs text-green-800 dark:text-green-200">
                  ✅ <strong>PUBLICLY VISIBLE:</strong> Shown on your listing page to help buyers make informed decisions.
                </p>
              </div>
            </div>

            {/* Demo Video URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                🎥 Demo Video URL (YouTube)
              </label>
              <input
                type="url"
                value={formData.demoVideoUrl}
                onChange={(e) => setFormData({ ...formData, demoVideoUrl: e.target.value })}
                placeholder="https://youtube.com/watch?v=dQw4w9WgXcQ or https://youtu.be/dQw4w9WgXcQ"
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                YouTube video that will auto-play (muted) on your listing page
              </p>
            </div>

            {/* Whitepaper URL */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                📄 Whitepaper URL
              </label>
              <input
                type="url"
                value={formData.whitepaperUrl}
                onChange={(e) => setFormData({ ...formData, whitepaperUrl: e.target.value })}
                placeholder="https://docs.google.com/document/..."
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Public technical documentation or whitepaper shown on your listing page
              </p>
            </div>

            {/* GitHub URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-900 dark:text-zinc-50">
                💻 GitHub URL (Public Repo)
              </label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/username/repo"
                className="w-full rounded-lg border border-green-300 bg-white px-4 py-2 text-zinc-900 placeholder-zinc-400 focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600 dark:border-green-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder-zinc-500"
              />
              <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                Public GitHub repository link shown on your listing page
              </p>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <Link
              href="/listings/my"
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

export default function NewListingPage() {
  return (
    <ProtectedContent>
      <NewListingPageContent />
    </ProtectedContent>
  );
}

