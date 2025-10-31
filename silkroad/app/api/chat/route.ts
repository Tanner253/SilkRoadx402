import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { ChatMessage } from '@/models/ChatMessage';
import { Listing } from '@/models/Listing';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { validateChatMessage } from '@/lib/validation/chatFilter';
import { createLog, getIpFromRequest } from '@/lib/logger';

/**
 * GET /api/chat
 * 
 * Fetch recent chat messages (public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK: Fetching chat messages');
      return NextResponse.json({
        success: true,
        messages: [],
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich with listing data if attached
    const enrichedMessages = await Promise.all(
      messages.map(async (msg: any) => {
        // Convert reactions Map to plain object (handle both Map and POJO)
        let reactions = {};
        if (msg.reactions) {
          if (msg.reactions instanceof Map) {
            reactions = Object.fromEntries(msg.reactions);
          } else if (typeof msg.reactions === 'object') {
            // Already a plain object from MongoDB
            reactions = msg.reactions;
          }
        }
        
        if (msg.listingId) {
          const listing = await Listing.findById(msg.listingId).lean() as { _id: any; title: string; price: number; imageUrl: string } | null;
          return {
            ...msg,
            reactions,
            listing: listing ? {
              _id: listing._id.toString(),
              title: listing.title,
              price: listing.price,
              imageUrl: listing.imageUrl,
            } : null,
          };
        }
        return {
          ...msg,
          reactions,
        };
      })
    );

    // Reverse to show oldest first (chat order)
    return NextResponse.json({
      success: true,
      messages: enrichedMessages.reverse(),
    });
  } catch (error: any) {
    console.error('❌ Fetch chat messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat
 * 
 * Send a chat message (requires token gating + rate limiting)
 */
export async function POST(req: NextRequest) {
  try {
    const { wallet, message, listingId } = await req.json();

    if (!wallet || !message) {
      return NextResponse.json(
        { error: 'Wallet and message are required' },
        { status: 400 }
      );
    }

    // Validate and filter message
    const validation = validateChatMessage(message);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check rate limit (1 message per 60 seconds)
    const rateLimit = await checkRateLimit(wallet, {
      windowMs: 60000, // 60 seconds
      maxRequests: 1,
      keyPrefix: 'chat',
    });

    if (!rateLimit.allowed) {
      const resetIn = Math.max(0, rateLimit.resetAt.getTime() - Date.now());
      const timeLeft = Math.ceil(resetIn / 1000);
      return NextResponse.json(
        { 
          error: `Please wait ${timeLeft}s before sending another message`,
          resetIn: resetIn,
        },
        { status: 429 }
      );
    }

    // Auto-detect message type from content
    const lowerMsg = validation.message.toLowerCase();
    let messageType: 'selling' | 'buying' | 'general' = 'general';
    
    if (lowerMsg.includes('selling') || lowerMsg.includes('wts') || lowerMsg.includes('sell')) {
      messageType = 'selling';
    } else if (lowerMsg.includes('buying') || lowerMsg.includes('wtb') || lowerMsg.includes('buy')) {
      messageType = 'buying';
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Chat message from ${wallet.slice(0, 8)}: ${validation.message}`);
      
      return NextResponse.json({
        success: true,
        message: {
          _id: 'mock-chat-id',
          wallet,
          message: validation.message,
          messageType,
          listingId: listingId || null,
          createdAt: new Date(),
        },
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // If listing attached, verify it exists and belongs to user
    if (listingId) {
      const listing = await Listing.findById(listingId);
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }
      if (listing.wallet !== wallet) {
        return NextResponse.json(
          { error: 'You can only attach your own listings' },
          { status: 403 }
        );
      }
    }

    // Create chat message
    const chatMessage = await ChatMessage.create({
      wallet,
      message: validation.message,
      messageType,
      listingId: listingId || undefined,
    });

    console.log(`💬 Chat message from ${wallet.slice(0, 8)}: ${validation.message}`);

    // Log chat activity
    await createLog(
      'info',
      `Chat: ${wallet.slice(0, 8)}... posted${listingId ? ' with listing' : ''}`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      message: chatMessage,
    });
  } catch (error: any) {
    console.error('❌ Chat message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

