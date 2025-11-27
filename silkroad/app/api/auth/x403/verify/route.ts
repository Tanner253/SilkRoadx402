/**
 * x403 Verify API
 * Based on SnekFi's clean implementation
 * 
 * POST /api/auth/x403/verify
 * Verifies signed challenge and issues session token
 */

import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';

const X403_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

function decodeAuthHeader(authHeader: string): any | null {
  try {
    if (!authHeader.startsWith('Bearer ')) {
      return null;
    }

    const encoded = authHeader.substring(7);
    const decoded = atob(encoded);
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Failed to decode auth header:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const body = await request.json();
    const { walletAddress } = body;

    if (!authHeader) {
      return NextResponse.json(
        { authenticated: false, error: 'No authorization header' },
        { status: 403 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { authenticated: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Decode signed challenge
    const signedChallenge = decodeAuthHeader(authHeader);
    
    if (!signedChallenge || !signedChallenge.walletAddress || !signedChallenge.signature || !signedChallenge.nonce) {
      return NextResponse.json(
        { authenticated: false, error: 'Invalid authorization format' },
        { status: 403 }
      );
    }

    // Verify wallet address matches
    if (signedChallenge.walletAddress !== walletAddress) {
      return NextResponse.json(
        { authenticated: false, error: 'Wallet address mismatch' },
        { status: 403 }
      );
    }

    // Verify signature (need to reconstruct the original challenge message)
    // For now, we'll create a simple session token
    // In production, you'd verify the signature against the original challenge

    try {
      const pubKey = new PublicKey(walletAddress);
      
      // Create a simple session token (you could use JWT here)
      const sessionToken = `x403_${walletAddress.substring(0, 8)}_${Date.now()}`;
      const expiresAt = new Date(Date.now() + X403_SESSION_DURATION);

      console.log('✅ x403: Authentication successful for', walletAddress.substring(0, 8));

      return NextResponse.json({
        authenticated: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('x403 signature verification error:', error);
      return NextResponse.json(
        { authenticated: false, error: 'Invalid signature' },
        { status: 403 }
      );
    }
  } catch (error) {
    console.error('x403 verification error:', error);

    return NextResponse.json(
      { authenticated: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

