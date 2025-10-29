import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { sanitizeString } from '@/lib/validation/sanitization';

// GET - Fetch all approved listings or user's listings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet'); // If provided, get user's listings

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      if (wallet) {
        console.log(`🧪 MOCK: Fetching listings for wallet ${wallet.slice(0, 8)}...`);
        const listings = mockStore.getListingsByWallet(wallet);
        return NextResponse.json({
          success: true,
          listings,
          _mock: true,
        });
      }

      console.log('🧪 MOCK: Fetching approved listings');
      
      // Seed data if empty
      const listings = mockStore.getApprovedListings();
      if (listings.length === 0) {
        mockStore.seedListings();
        const seededListings = mockStore.getApprovedListings();
        return NextResponse.json({
          success: true,
          listings: seededListings,
          _mock: true,
        });
      }

      return NextResponse.json({
        success: true,
        listings,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    if (wallet) {
      const listings = await Listing.find({ wallet })
        .sort({ createdAt: -1 });
      
      return NextResponse.json({
        success: true,
        listings,
      });
    }

    const listings = await Listing.find({
      approved: true,
      state: 'on_market',
    })
      .sort({ createdAt: -1 })
      .select('-deliveryUrl'); // Never expose delivery URL in list

    return NextResponse.json({
      success: true,
      listings,
    });
  } catch (error: any) {
    console.error('Get listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

// POST - Create new listing
export async function POST(req: NextRequest) {
  try {
    const { 
      wallet, 
      title, 
      description, 
      price, 
      category, 
      imageUrl, 
      deliveryUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl 
    } = await req.json();

    // Validation
    if (!wallet || !title || !description || !price || !category || !imageUrl || !deliveryUrl) {
      return NextResponse.json(
        { error: 'Required fields: wallet, title, description, price, category, imageUrl, deliveryUrl' },
        { status: 400 }
      );
    }

    // Validate wallet
    try {
      new PublicKey(wallet);
    } catch {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    // Validate title
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description
    if (description.length < 50 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.10) {
      return NextResponse.json(
        { error: 'Price must be at least $0.10 USDC' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedTitle = sanitizeString(title);
    const sanitizedDescription = sanitizeString(description);

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log('🧪 MOCK: Creating listing with delivery URL');

      const listing = mockStore.createListing({
        wallet,
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: priceNum,
        category,
        imageUrl,
        deliveryUrl,
        demoVideoUrl,
        whitepaperUrl,
        githubUrl,
      });

      console.log(`   Delivery URL: ${deliveryUrl}`);

      return NextResponse.json({
        success: true,
        listing,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    const listing = await Listing.create({
      wallet,
      title: sanitizedTitle,
      description: sanitizedDescription,
      price: priceNum,
      category,
      imageUrl,
      deliveryUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl,
      riskLevel: 'standard',
      state: 'in_review',
      approved: false,
    });

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Create listing error:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

