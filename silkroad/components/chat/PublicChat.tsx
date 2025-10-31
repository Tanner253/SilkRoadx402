'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';

interface ChatMessage {
  _id: string;
  wallet: string;
  message: string;
  messageType: 'selling' | 'buying' | 'general';
  listingId?: string;
  listing?: {
    _id: string;
    title: string;
    price: number;
    imageUrl: string;
  };
  createdAt: Date;
}

interface Listing {
  _id: string;
  title: string;
  price: number;
}

export function PublicChat() {
  const { isConnected, hasAcceptedTOS, isTokenGated } = useAuth();
  const { publicKey } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedListing, setSelectedListing] = useState<string>('');
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [sending, setSending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages every 10 seconds
  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Fetch user's listings when chat opens
  useEffect(() => {
    if (isOpen && publicKey) {
      fetchUserListings();
    }
  }, [isOpen, publicKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/chat?limit=50');
      setMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const fetchUserListings = async () => {
    if (!publicKey) return;
    try {
      const response = await axios.get('/api/listings', {
        params: { wallet: publicKey.toBase58() },
      });
      const approved = response.data.listings.filter(
        (l: any) => l.approved && l.state === 'on_market'
      );
      setUserListings(approved);
    } catch (err) {
      console.error('Failed to fetch listings:', err);
    }
  };

  const handleSend = async () => {
    if (!publicKey || !newMessage.trim()) return;

    if (!isConnected || !hasAcceptedTOS || !isTokenGated) {
      setError('Connect wallet and hold 50k+ $SRx402 to chat');
      return;
    }

    try {
      setSending(true);
      setError('');

      await axios.post('/api/chat', {
        wallet: publicKey.toBase58(),
        message: newMessage.trim(),
        listingId: selectedListing || undefined,
      });

      setNewMessage('');
      setSelectedListing('');
      setCooldown(60); // 60 second cooldown
      await fetchMessages();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to send message';
      setError(errorMsg);
      
      // Extract cooldown time from error
      if (err.response?.data?.resetIn) {
        setCooldown(Math.ceil(err.response.data.resetIn / 1000));
      }
    } finally {
      setSending(false);
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'selling':
        return 'text-green-400';
      case 'buying':
        return 'text-cyan-400';
      default:
        return 'text-yellow-300';
    }
  };

  const truncateWallet = (wallet: string) => {
    return `${wallet.slice(0, 4)}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-6 z-50 flex items-center space-x-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-amber-700 transition-all hover:scale-105 border-2 border-amber-800"
        title="Open Public Chat"
        style={{ fontFamily: 'monospace' }}
      >
        <span className="text-lg">💬</span>
        <span>Public Chat</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 right-6 z-50 w-96 rounded-lg border-4 border-amber-900 bg-zinc-900 shadow-2xl" style={{ fontFamily: 'monospace' }}>
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-800 to-amber-900 px-4 py-2 border-b-2 border-amber-950">
        <div className="flex items-center space-x-2">
          <span className="text-lg">💬</span>
          <span className="font-bold text-yellow-200 text-sm">Public Chat</span>
          <span className="text-xs text-amber-300">({messages.length})</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-yellow-200 hover:text-white font-bold text-lg"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto bg-black p-3 space-y-2 scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-zinc-900">
        {messages.length === 0 ? (
          <div className="text-center text-zinc-500 text-xs py-8">
            No messages yet. Start trading!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg._id} className="text-xs">
              <div className="flex items-start space-x-2">
                <span className="text-amber-500 font-bold">
                  {truncateWallet(msg.wallet)}:
                </span>
                <span className={`${getMessageColor(msg.messageType)} break-words flex-1`}>
                  {msg.message}
                </span>
              </div>
              
              {/* Attached Listing */}
              {msg.listing && (
                <Link
                  href={`/listings/${msg.listing._id}`}
                  className="mt-1 ml-6 flex items-center space-x-2 rounded border border-amber-700 bg-zinc-800 p-2 hover:bg-zinc-700 transition-colors"
                >
                  <Image
                    src={msg.listing.imageUrl}
                    alt={msg.listing.title}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-yellow-300 font-bold truncate text-xs">
                      {msg.listing.title}
                    </div>
                    <div className="text-green-400 text-xs">
                      ${msg.listing.price.toFixed(2)} USDC
                    </div>
                  </div>
                  <span className="text-amber-500">→</span>
                </Link>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t-2 border-amber-900 bg-zinc-900 p-3 space-y-2">
        {/* Optional Listing Selector */}
        {userListings.length > 0 && (
          <select
            value={selectedListing}
            onChange={(e) => setSelectedListing(e.target.value)}
            className="w-full rounded border border-amber-700 bg-zinc-800 px-2 py-1 text-xs text-yellow-200 focus:outline-none focus:ring-2 focus:ring-amber-600"
          >
            <option value="">📦 Attach listing (optional)</option>
            {userListings.map((listing) => (
              <option key={listing._id} value={listing._id}>
                {listing.title} - ${listing.price}
              </option>
            ))}
          </select>
        )}

        {/* Message Input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sending && cooldown === 0 && handleSend()}
            placeholder={cooldown > 0 ? `Wait ${cooldown}s...` : 'Type to trade...'}
            maxLength={280}
            disabled={sending || cooldown > 0 || !isConnected || !isTokenGated}
            className="flex-1 rounded border border-amber-700 bg-zinc-800 px-3 py-2 text-xs text-yellow-200 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-600 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || cooldown > 0 || !newMessage.trim() || !isConnected || !isTokenGated}
            className="rounded bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cooldown > 0 ? `${cooldown}s` : sending ? '...' : '💰 Send'}
          </button>
        </div>

        {/* Character Counter */}
        <div className="flex items-center justify-between text-xs">
          <span className={`${newMessage.length > 250 ? 'text-red-400' : 'text-zinc-500'}`}>
            {newMessage.length}/280
          </span>
          {!isConnected || !isTokenGated ? (
            <span className="text-amber-500">Need 50k $SRx402 to chat</span>
          ) : null}
        </div>

        {/* Error */}
        {error && (
          <div className="text-xs text-red-400 bg-red-950 border border-red-800 rounded px-2 py-1">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

