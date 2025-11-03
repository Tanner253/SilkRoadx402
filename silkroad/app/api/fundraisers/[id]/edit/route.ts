import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { connectDB } from '@/lib/db';
import { Fundraiser } from '@/models/Fundraiser';
import { sanitizeString } from '@/lib/validation/sanitization';

// POST - Edit fundraiser (limited fields)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { 
      wallet,
      title, 
      description, 
      price, 
      category, 
      imageUrl,
      demoVideoUrl,
      whitepaperUrl,
      githubUrl 
    } = await req.json();

    // Validation
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet is required' },
        { status: 400 }
      );
    }

    // Validate title if provided
    if (title && (title.length < 5 || title.length > 100)) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }

    // Validate description if provided
    if (description && (description.length < 50 || description.length > 2000)) {
      return NextResponse.json(
        { error: 'Description must be 50-2000 characters' },
        { status: 400 }
      );
    }

    // Validate price if provided
    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0.10) {
        return NextResponse.json(
          { error: 'Price must be at least $0.10 USDC' },
          { status: 400 }
        );
      }
    }

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Editing fundraiser ${id}`);
      return NextResponse.json({
        success: true,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Find fundraiser and verify ownership
    const fundraiser = await Fundraiser.findById(id);
    if (!fundraiser) {
      return NextResponse.json(
        { error: 'Fundraiser not found' },
        { status: 404 }
      );
    }

    if (fundraiser.wallet !== wallet) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only edit your own fundraisers' },
        { status: 403 }
      );
    }

    // Build update object (only include provided fields)
    const updates: any = { updatedAt: new Date() };

    if (title) updates.title = sanitizeString(title);
    if (description) updates.description = sanitizeString(description);
    if (price !== undefined) updates.price = parseFloat(price);
    if (category) updates.category = category;
    if (imageUrl) updates.imageUrl = imageUrl;
    if (demoVideoUrl !== undefined) updates.demoVideoUrl = demoVideoUrl;
    if (whitepaperUrl !== undefined) updates.whitepaperUrl = whitepaperUrl;
    if (githubUrl !== undefined) updates.githubUrl = githubUrl;

    // Update fundraiser
    const updatedFundraiser = await Fundraiser.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      fundraiser: updatedFundraiser,
    });
  } catch (error: any) {
    console.error('Edit fundraiser error:', error);
    return NextResponse.json(
      { error: 'Failed to edit fundraiser' },
      { status: 500 }
    );
  }
}

