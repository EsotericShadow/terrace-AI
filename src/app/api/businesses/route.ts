import { NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export async function GET() {
  try {
    console.log('WEAVIATE_URL:', WEAVIATE_URL);
    console.log('WEAVIATE_API_KEY:', WEAVIATE_API_KEY ? 'Present' : 'Missing');
    
    if (!WEAVIATE_URL || !WEAVIATE_API_KEY) {
      console.error('Weaviate configuration missing');
      return NextResponse.json({ error: 'Weaviate configuration missing' }, { status: 500 });
    }

    console.log('Making request to Weaviate...');
    const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify({
        query: `{
          Get {
            TerraceBusiness(limit: 1500) {
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

    console.log('Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Weaviate request failed:', response.status, errorText);
      throw new Error(`Weaviate request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    const businesses = data.data?.Get?.TerraceBusiness || [];
    console.log('Businesses count:', businesses.length);

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

    return NextResponse.json({ businesses: transformedBusinesses });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 });
  }
}
