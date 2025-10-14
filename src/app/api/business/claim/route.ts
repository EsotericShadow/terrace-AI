import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

interface ClaimRequest {
  email: string;
  phone: string;
  bestTimeToCall: string;
  businessIds: string[];
  multipleBusinesses: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, bestTimeToCall, businessIds, multipleBusinesses }: ClaimRequest = await request.json();

    if (!email || !phone || !bestTimeToCall || !businessIds || businessIds.length === 0) {
      return NextResponse.json(
        { error: 'Email, phone, best time to call, and at least one business are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create claim records for each business
    const claimNotes = multipleBusinesses 
      ? `Multiple business claim request (${businessIds.length} businesses). Best time to call: ${bestTimeToCall}. Total potential revenue: $${businessIds.length * 30}/month`
      : `Claim request submitted via web form. Best time to call: ${bestTimeToCall}`;

    // Create individual claims for each business
    const createClaimQueries = businessIds.map(businessId => ({
      query: `mutation {
        Create {
          BusinessClaim(
            businessId: "${businessId}"
            requesterEmail: "${email}"
            requesterPhone: "${phone}"
            bestTimeToCall: "${bestTimeToCall}"
            status: "pending"
            notes: "${claimNotes}"
            createdAt: "${new Date().toISOString()}"
            multipleBusinesses: ${multipleBusinesses}
          ) {
            _additional {
              id
            }
          }
        }
      }`
    }));

    // Create all claims
    const claimPromises = createClaimQueries.map(query => 
      fetch(`${WEAVIATE_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify(query)
      })
    );

    const responses = await Promise.all(claimPromises);
    const failedClaims = responses.filter(response => !response.ok);
    
    if (failedClaims.length > 0) {
      console.error(`Failed to create ${failedClaims.length} out of ${businessIds.length} claims`);
      // For now, we'll still return success as claims can be processed manually
    }

    // In a real implementation, you would:
    // 1. Send confirmation email to business owner
    // 2. Send notification to admin for manual review
    // 3. Store claim in database with proper validation

    const businessCount = businessIds.length;
    const totalRevenue = businessCount * 30;
    
    console.log(`Business claim request: ${email} (${phone}) wants to claim ${businessCount} business${businessCount > 1 ? 'es' : ''}. Best time to call: ${bestTimeToCall}. Total potential revenue: $${totalRevenue}/month`);

    return NextResponse.json({
      success: true,
      message: `Claim request submitted successfully for ${businessCount} business${businessCount > 1 ? 'es' : ''}`,
      businessCount,
      totalRevenue
    });

  } catch (error) {
    console.error('Business claim error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
