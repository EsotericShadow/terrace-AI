// Test direct grocery store name search
import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testGroceryDirect() {
  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: {
        'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY!,
      },
    }
  );

  console.log('🔍 Testing Direct Brand Name Search\n');

  const businessCollection = client.collections.get('Business');

  const queries = [
    'Safeway',
    'Walmart',
    'Real Canadian Superstore'
  ];

  for (const query of queries) {
    console.log(`\n━━━━ Query: "${query}" ━━━━`);
    const results = await businessCollection.query.nearText(query, {
      limit: 5,
    });

    console.log(`Found ${results.objects.length} results:\n`);
    results.objects.forEach((obj: any, i: number) => {
      console.log(`${i + 1}. ${obj.properties.businessName}`);
      console.log(`   Address: ${obj.properties.address}`);
    });
  }

  await client.close();
}

testGroceryDirect().catch(console.error);

