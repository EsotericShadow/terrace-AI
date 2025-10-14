import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export async function GET() {
  try {
    // Get all claim requests
    const claimQuery = {
      query: `{
        Get {
          BusinessClaim(
            limit: 100
            sort: [{ path: ["createdAt"], order: desc }]
          ) {
            _additional {
              id
            }
            businessId
            requesterEmail
            requesterPhone
            status
            notes
            createdAt
            verifiedAt
            multipleBusinesses
          }
        }
      }`
    };

    // Get all removal requests
    const removalQuery = {
      query: `{
        Get {
          BusinessRemoval(
            limit: 100
            sort: [{ path: ["createdAt"], order: desc }]
          ) {
            _additional {
              id
            }
            businessId
            requesterEmail
            requesterPhone
            status
            notes
            createdAt
            verifiedAt
            multipleBusinesses
          }
        }
      }`
    };

    const [claimResponse, removalResponse] = await Promise.all([
      fetch(`${WEAVIATE_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify(claimQuery)
      }),
      fetch(`${WEAVIATE_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify(removalQuery)
      })
    ]);

    const claimData = await claimResponse.json();
    const removalData = await removalResponse.json();

    const claims = claimData.data?.Get?.BusinessClaim || [];
    const removals = removalData.data?.Get?.BusinessRemoval || [];

    // Get business names for each request
    const getBusinessNames = async (businessIds: string[]) => {
      if (businessIds.length === 0) return [];
      
      const businessQuery = {
        query: `{
          Get {
            TerraceBusiness(
              where: {
                operator: "Or",
                operands: ${businessIds.map(id => `{
                  path: ["_additional", "id"],
                  operator: "Equal",
                  valueText: "${id}"
                }`).join(',')}
              }
            ) {
              _additional {
                id
              }
              businessName
            }
          }
        }`
      };

      try {
        const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
          },
          body: JSON.stringify(businessQuery)
        });

        const data = await response.json();
        const businesses = data.data?.Get?.TerraceBusiness || [];
        
        return businessIds.map(id => {
          const business = businesses.find((b: any) => b._additional?.id === id);
          return business?.businessName || 'Unknown Business';
        });
      } catch (error) {
        console.error('Error fetching business names:', error);
        return businessIds.map(() => 'Unknown Business');
      }
    };

    // Process claims
    const processedClaims = await Promise.all(
      claims.map(async (claim: any) => {
        const businessNames = await getBusinessNames([claim.businessId]);
        return {
          id: claim._additional?.id,
          type: 'claim' as const,
          businessIds: [claim.businessId],
          businessNames,
          email: claim.requesterEmail,
          phone: claim.requesterPhone,
          status: claim.status || 'pending',
          submittedAt: claim.createdAt,
          verifiedAt: claim.verifiedAt,
          notes: claim.notes,
          multipleBusinesses: claim.multipleBusinesses || false
        };
      })
    );

    // Process removals
    const processedRemovals = await Promise.all(
      removals.map(async (removal: any) => {
        const businessNames = await getBusinessNames([removal.businessId]);
        return {
          id: removal._additional?.id,
          type: 'removal' as const,
          businessIds: [removal.businessId],
          businessNames,
          email: removal.requesterEmail,
          phone: removal.requesterPhone,
          status: removal.status || 'pending',
          submittedAt: removal.createdAt,
          verifiedAt: removal.verifiedAt,
          notes: removal.notes,
          multipleBusinesses: removal.multipleBusinesses || false
        };
      })
    );

    // Combine and sort by submission date
    const allRequests = [...processedClaims, ...processedRemovals]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

    return NextResponse.json({
      success: true,
      requests: allRequests
    });

  } catch (error) {
    console.error('Admin verification requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { requestId, status, notes } = await request.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Request ID and status are required' },
        { status: 400 }
      );
    }

    // Determine if it's a claim or removal request
    const claimQuery = {
      query: `{
        Get {
          BusinessClaim(
            where: {
              path: ["_additional", "id"],
              operator: "Equal",
              valueText: "${requestId}"
            }
            limit: 1
          ) {
            _additional {
              id
            }
          }
        }
      }`
    };

    const claimResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(claimQuery)
    });

    const claimData = await claimResponse.json();
    const isClaim = claimData.data?.Get?.BusinessClaim?.length > 0;

    const className = isClaim ? 'BusinessClaim' : 'BusinessRemoval';
    const verifiedAt = status === 'verified' ? new Date().toISOString() : null;

    // Update the request status
    const updateQuery = {
      query: `mutation {
        Update {
          ${className}(
            where: {
              path: ["_additional", "id"],
              operator: "Equal",
              valueText: "${requestId}"
            }
            set: {
              status: "${status}"
              ${notes ? `notes: "${notes}"` : ''}
              ${verifiedAt ? `verifiedAt: "${verifiedAt}"` : ''}
            }
          ) {
            _additional {
              id
            }
          }
        }
      }`
    };

    const updateResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(updateQuery)
    });

    if (!updateResponse.ok) {
      console.error('Failed to update request status:', updateResponse.status);
      return NextResponse.json(
        { error: 'Failed to update request status' },
        { status: 500 }
      );
    }

    console.log(`Updated ${className} ${requestId} to status: ${status}`);

    return NextResponse.json({
      success: true,
      message: 'Request status updated successfully'
    });

  } catch (error) {
    console.error('Update verification request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

