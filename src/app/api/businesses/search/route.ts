import { NextRequest, NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ businesses: [] });
    }

    console.log('Searching for businesses with query:', query);

    const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `{
          Get {
            TerraceBusiness(
              limit: 20
              where: {
                operator: Or
                operands: [
                  {
                    path: ["businessName"]
                    operator: Like
                    valueText: "*${query}*"
                  }
                  {
                    path: ["address"]
                    operator: Like
                    valueText: "*${query}*"
                  }
                  {
                    path: ["category"]
                    operator: Like
                    valueText: "*${query}*"
                  }
                ]
              }
            ) {
              _additional {
                id
              }
              businessName
              category
              address
              city
              postalCode
            }
          }
        }`
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weaviate search failed:', response.status, errorText);
      throw new Error(`Weaviate search failed: ${response.status}`);
    }

    const data = await response.json();
    const businesses = data.data?.Get?.TerraceBusiness || [];

    // Transform the data for the frontend
    const transformedBusinesses = businesses.map((business: any) => ({
      id: business._additional?.id || '',
      name: business.businessName || 'Unknown Business',
      category: business.category || 'Other',
      address: business.address || '',
      city: business.city || 'Terrace',
      postalCode: business.postalCode || '',
      phone: '', // Not available in current schema
      website: '', // Not available in current schema
      fullAddress: `${business.address || ''} ${business.city || 'Terrace'} ${business.postalCode || ''}`.trim()
    }));

    // Sort by business name for easier selection
    transformedBusinesses.sort((a: any, b: any) => a.name.localeCompare(b.name));

    console.log(`Found ${transformedBusinesses.length} businesses matching "${query}"`);

    return NextResponse.json({ businesses: transformedBusinesses });
  } catch (error: any) {
    console.error('Error searching businesses:', error);
    return NextResponse.json({ error: 'Failed to search businesses' }, { status: 500 });
  }
}

