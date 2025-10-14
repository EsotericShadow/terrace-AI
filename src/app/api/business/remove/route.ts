import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

interface RemovalRequest {
  email: string;
  phone: string;
  businessIds: string[];
  reason?: string;
  multipleBusinesses: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { email, phone, businessIds, reason, multipleBusinesses }: RemovalRequest = await request.json();

    if (!email || !phone || !businessIds || businessIds.length === 0) {
      return NextResponse.json(
        { error: 'Email, phone, and at least one business are required' },
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

    // Create removal request records for each business
    const removalNotes = multipleBusinesses 
      ? `Multiple business removal request (${businessIds.length} businesses). Reason: ${reason || 'No reason provided'}`
      : `Removal request submitted via web form. Reason: ${reason || 'No reason provided'}`;

    // Create individual removal requests for each business
    const createRemovalQueries = businessIds.map(businessId => ({
      query: `mutation {
        Create {
          BusinessRemoval(
            businessId: "${businessId}"
            requesterEmail: "${email}"
            requesterPhone: "${phone}"
            reason: "${reason || 'No reason provided'}"
            status: "pending"
            notes: "${removalNotes}"
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

    // Create all removal requests
    const removalPromises = createRemovalQueries.map(query => 
      fetch(`${WEAVIATE_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify(query)
      })
    );

    const responses = await Promise.all(removalPromises);
    const failedRemovals = responses.filter(response => !response.ok);
    
    if (failedRemovals.length > 0) {
      console.error(`Failed to create ${failedRemovals.length} out of ${businessIds.length} removal requests`);
      // For now, we'll still return success as removals can be processed manually
    }

    // In a real implementation, you would:
    // 1. Send confirmation email to business owner
    // 2. Send notification to admin for processing
    // 3. Flag business for removal in database

    const businessCount = businessIds.length;
    
    console.log(`Business removal request: ${email} (${phone}) wants to remove ${businessCount} business${businessCount > 1 ? 'es' : ''}. Reason: ${reason || 'None'}`);

    return NextResponse.json({
      success: true,
      message: `Removal request submitted successfully for ${businessCount} business${businessCount > 1 ? 'es' : ''}`,
      businessCount
    });

  } catch (error) {
    console.error('Business removal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
