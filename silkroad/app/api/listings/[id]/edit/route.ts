import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { sanitizeString } from '@/lib/validation/sanitization';
import { createLog, getIpFromRequest } from '@/lib/logger';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';

/**
 * PUT /api/listings/[id]/edit
 * 
 * Update an existing listing
 * Only the owner can edit their listing
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    const { 
      wallet, 
      title, 
      description, 
      price, 
      category, 
      imageUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl,
    } = body;

    // Validate required fields
    if (!wallet || !title || !description || !price || !category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description length
    if (description.length < 50 || description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be between 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0.1 || priceNum > 10000) {
      return NextResponse.json(
        { error: 'Price must be between $0.10 and $10,000 USDC' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['Trading Bot', 'API Tool', 'Script', 'Jobs/Services', 'Custom'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
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
      console.log('🧪 MOCK: Updating listing', id);
      
      const updated = mockStore.updateListing(id, {
        title: sanitizedTitle,
        description: sanitizedDescription,
        price: priceNum,
        category,
        imageUrl,
        demoVideoUrl: demoVideoUrl ? demoVideoUrl.trim() : undefined,
        whitepaperUrl: whitepaperUrl ? whitepaperUrl.trim() : undefined,
        githubUrl: githubUrl ? githubUrl.trim() : undefined,
      });

      if (!updated) {
        return NextResponse.json(
          { error: 'Listing not found or you are not the owner' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        listing: updated,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Check rate limit (reuse listing creation limit)
    const rateLimit = await checkRateLimit(wallet, RATE_LIMITS.CREATE_LISTING);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: rateLimit.message || 'Too many requests',
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    // Find the listing
    const listing = await Listing.findById(id);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Check if the user is the owner
    if (listing.wallet !== wallet) {
      return NextResponse.json(
        { error: 'You are not authorized to edit this listing' },
        { status: 403 }
      );
    }

    // Update the listing
    listing.title = sanitizedTitle;
    listing.description = sanitizedDescription;
    listing.price = priceNum;
    listing.category = category;
    listing.imageUrl = imageUrl;
    listing.demoVideoUrl = demoVideoUrl ? demoVideoUrl.trim() : listing.demoVideoUrl;
    listing.whitepaperUrl = whitepaperUrl ? whitepaperUrl.trim() : listing.whitepaperUrl;
    listing.githubUrl = githubUrl ? githubUrl.trim() : listing.githubUrl;
    listing.updatedAt = new Date();

    // If listing was previously approved, set back to pending for admin review
    if (listing.state === 'approved') {
      listing.state = 'pending';
    }

    await listing.save();

    // Log the update
    await createLog(
      'listing_created',
      `Listing updated: "${sanitizedTitle}" ($${priceNum}) by ${wallet.slice(0, 8)}...`,
      wallet,
      getIpFromRequest(req)
    );

    return NextResponse.json({
      success: true,
      listing: {
        _id: listing._id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        category: listing.category,
        imageUrl: listing.imageUrl,
        state: listing.state,
      },
      message: listing.state === 'pending' 
        ? 'Listing updated and sent for admin review' 
        : 'Listing updated successfully',
    });
  } catch (error: any) {
    console.error('❌ Edit listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

