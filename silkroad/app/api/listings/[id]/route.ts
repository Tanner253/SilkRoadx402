import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/config/constants';
import { mockStore } from '@/lib/mockStore';
import { connectDB } from '@/lib/db';
import { Listing } from '@/models/Listing';
import { Fundraiser } from '@/models/Fundraiser';

// GET - Get listing by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Fetching listing ${id}`);
      
      const listing = mockStore.getListing(id);
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

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

    // Try to find in Listing collection first
    let listing = await Listing.findById(id);
    let itemType: 'listing' | 'fundraiser' = 'listing';

    // If not found, check Fundraiser collection
    if (!listing) {
      listing = await Fundraiser.findById(id);
      itemType = 'fundraiser';
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Add type field to response
    const listingWithType = {
      ...listing.toObject(),
      type: itemType,
    };

    return NextResponse.json({
      success: true,
      listing: listingWithType,
    });
  } catch (error: any) {
    console.error('Get listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

// PATCH - Only allows deactivate (state: pulled) or reactivate (state: in_review, approved: false).
// Cannot set approved: true or state: on_market; admin approval is required for that.
const PATCH_ALLOWED: Record<string, (v: unknown) => boolean> = {
  state: (v) => v === 'pulled' || v === 'in_review',
  approved: (v) => v === false,
};

function buildSafeListingUpdates(body: Record<string, unknown>): Record<string, unknown> | null {
  const updates: Record<string, unknown> = {};
  for (const [key, validator] of Object.entries(PATCH_ALLOWED)) {
    if (!(key in body)) continue;
    const value = body[key];
    if (!validator(value)) return null;
    updates[key] = value;
  }
  if (Object.keys(updates).length === 0) return null;
  return updates;
}

// PATCH - Update listing
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      const allowed = buildSafeListingUpdates(body);
      if (!allowed) {
        return NextResponse.json(
          { error: 'PATCH only allows deactivate (state: "pulled") or reactivate (state: "in_review", approved: false)' },
          { status: 400 }
        );
      }
      const listing = mockStore.updateListing(id, allowed);
      if (!listing) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        listing,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    const updates = buildSafeListingUpdates(body);
    if (!updates) {
      return NextResponse.json(
        { error: 'PATCH only allows deactivate (state: "pulled") or reactivate (state: "in_review", approved: false). Cannot set listing live.' },
        { status: 400 }
      );
    }

    await connectDB();

    let listing = await Listing.findById(id);
    let isFundraiser = false;
    if (!listing) {
      listing = await Fundraiser.findById(id);
      isFundraiser = true;
    }
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const wallet = body.wallet as string | undefined;
    if (wallet && listing.wallet !== wallet) {
      return NextResponse.json(
        { error: 'You are not authorized to update this listing' },
        { status: 403 }
      );
    }

    const updatePayload = { ...updates, updatedAt: new Date() };
    if (isFundraiser) {
      listing = await Fundraiser.findByIdAndUpdate(id, updatePayload, { new: true });
    } else {
      listing = await Listing.findByIdAndUpdate(id, updatePayload, { new: true });
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      listing,
    });
  } catch (error: any) {
    console.error('Update listing error:', error);
    return NextResponse.json(
      { error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

// DELETE - Delete listing
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ============================================
    // MOCK MODE
    // ============================================
    if (CONFIG.MOCK_MODE) {
      console.log(`🧪 MOCK: Deleting listing ${id}`);
      
      const result = mockStore.deleteListing(id);
      if (!result) {
        return NextResponse.json(
          { error: 'Listing not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        _mock: true,
      });
    }

    // ============================================
    // REAL MODE
    // ============================================
    await connectDB();

    // Try to delete from Listing collection first
    let listing = await Listing.findByIdAndDelete(id);

    // If not found, try Fundraiser collection
    if (!listing) {
      listing = await Fundraiser.findByIdAndDelete(id);
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete listing error:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}

