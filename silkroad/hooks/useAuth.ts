'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { getCachedTokenGate, setCachedTokenGate, clearCachedTokenGate } from '@/lib/tokenGatingCache';
import { useX403Auth } from './useX403Auth';

interface AuthState {
  isConnected: boolean;
  isTokenGated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { publicKey, connected, disconnect } = useWallet();
  const [authState, setAuthState] = useState<AuthState>({
    isConnected: false,
    isTokenGated: false,
    isLoading: false,
    error: null,
  });
  const [showTokenGateModal, setShowTokenGateModal] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [mounted, setMounted] = useState(false);
  const lastCheckedWallet = useRef<string | null>(null); // Track which wallet was checked
  const lastCheckTimestamp = useRef<number>(0); // Track when we last checked (throttle)

  // x403 Authentication Hook
  const x403 = useX403Auth();

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // x403 + Auth flow when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      const currentWallet = publicKey.toBase58();
      
      // Check if this is a new wallet or a reconnection
      const isNewWallet = lastCheckedWallet.current !== currentWallet;
      
      if (isNewWallet) {
        console.log(`🔄 ${lastCheckedWallet.current ? 'Reconnected' : 'Connected'} wallet`);
        console.log(`   Wallet: ${currentWallet.slice(0, 8)}...${currentWallet.slice(-6)}`);
        
        // Step 1: x403 Authentication (automatic)
        handleX403AndAuth();
        lastCheckedWallet.current = currentWallet;
      }
    } else {
      // Reset state on disconnect
      console.log('🔌 Wallet disconnected');
      
      setAuthState({
        isConnected: false,
        isTokenGated: false,
        isLoading: false,
        error: null,
      });
      setShowTokenGateModal(false);
      setTokenBalance(0);
      
      // Clear cache and reset wallet tracker
      if (lastCheckedWallet.current) {
        console.log('🧹 Clearing cache for:', lastCheckedWallet.current.slice(0, 8) + '...');
        clearCachedTokenGate(lastCheckedWallet.current);
        lastCheckedWallet.current = null;
      }
      
      // Reset throttle timestamp
      lastCheckTimestamp.current = 0;
    }
  }, [connected, publicKey]);

  // Handle x403 authentication first, then proceed with token gating
  const handleX403AndAuth = async () => {
    console.log('🔐 Starting x403 authentication...');
    
    // Step 1: Authenticate with x403
    const session = await x403.authenticate();
    
    if (!session) {
      console.log('❌ x403 authentication failed or cancelled');
      // Wallet will be disconnected by x403 hook on cancel
      return;
    }
    
    console.log('✅ x403 authentication successful');
    
    // Step 2: Proceed with token gating check
    checkAuthStatus(false);
  };

  const checkAuthStatus = async (forceRefresh = false) => {
    if (!publicKey) return;

    const wallet = publicKey.toBase58();
    
    // Throttle: Don't allow checks within 3 seconds of each other
    const now = Date.now();
    const timeSinceLastCheck = now - lastCheckTimestamp.current;
    const THROTTLE_MS = 3000; // 3 seconds
    
    if (timeSinceLastCheck < THROTTLE_MS && !forceRefresh) {
      console.log(`⏱️  Throttled: Last check was ${Math.round(timeSinceLastCheck / 1000)}s ago, skipping`);
      return;
    }

    // Try to use cached token gating result
    const cached = getCachedTokenGate(wallet);
    if (cached && !forceRefresh) {
      console.log(`💾 Using cached balance: ${cached.tokenBalance.toLocaleString()} tokens`);
      setTokenBalance(cached.tokenBalance);
      
      setAuthState({
        isConnected: true,
        isTokenGated: cached.isTokenGated,
        isLoading: false,
        error: null,
      });

      if (!cached.isTokenGated) {
        setShowTokenGateModal(true);
      }

      return;
    }

    // No cache or forced refresh - do full check (includes RPC call)
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Update throttle timestamp
    lastCheckTimestamp.current = Date.now();

    try {
      console.log('🔍 Performing full token balance check (RPC call)');
      
      // Call /api/auth/connect to check token gating and TOS status
      const response = await axios.post('/api/auth/connect', {
        wallet,
      });

      const { tokenGatingPassed, tokenBalance: balance } = response.data;

      if (balance !== undefined) {
        setTokenBalance(balance);
        setCachedTokenGate(wallet, balance, tokenGatingPassed);
        console.log(`✅ Fresh balance cached: ${balance.toLocaleString()} tokens`);
      }

      setAuthState({
        isConnected: true,
        isTokenGated: tokenGatingPassed,
        isLoading: false,
        error: null,
      });

      if (!tokenGatingPassed) {
        setShowTokenGateModal(true);
      }
    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      
      // If we have a cached balance and the check failed due to network/rate limit,
      // use the cached value instead of blocking the user
      const cached = getCachedTokenGate(wallet);
      if (cached && error.response?.status === 429) {
        console.warn('⚠️ Rate limited! Using last known balance:', cached.tokenBalance.toLocaleString());
        setTokenBalance(cached.tokenBalance);
        setAuthState({
          isConnected: true,
          isTokenGated: cached.isTokenGated,
          isLoading: false,
          error: null,
        });
        
        // Show appropriate modal based on cached state
        if (!cached.isTokenGated) {
          setShowTokenGateModal(true);
        }
        return;
      }
      
      const errorMessage = error.response?.data?.error || 'Failed to connect wallet';
      
      setAuthState({
        isConnected: false,
        isTokenGated: false,
        isLoading: false,
        error: errorMessage,
      });
    }
  };

  return {
    ...authState,
    hasAcceptedTOS: true,
    showTokenGateModal,
    tokenBalance,
    checkAuthStatus,
    mounted,
    x403,
  };
}
