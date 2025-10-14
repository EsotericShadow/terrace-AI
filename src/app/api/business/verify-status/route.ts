import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const phone = searchParams.get('phone');

    if (!email || !phone) {
      return NextResponse.json(
        { error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    // Search for claim requests
    const claimQuery = {
      query: `{
        Get {
          BusinessClaim(
            where: {
              operator: "And",
              operands: [
                {
                  path: ["requesterEmail"],
                  operator: "Equal",
                  valueText: "${email}"
                },
                {
                  path: ["requesterPhone"],
                  operator: "Equal",
                  valueText: "${phone}"
                }
              ]
            }
            limit: 50
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

    // Search for removal requests
    const removalQuery = {
      query: `{
        Get {
          BusinessRemoval(
            where: {
              operator: "And",
              operands: [
                {
                  path: ["requesterEmail"],
                  operator: "Equal",
                  valueText: "${email}"
                },
                {
                  path: ["requesterPhone"],
                  operator: "Equal",
                  valueText: "${phone}"
                }
              ]
            }
            limit: 50
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
    console.error('Verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

