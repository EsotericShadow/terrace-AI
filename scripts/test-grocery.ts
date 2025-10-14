// Test grocery store search
import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testGrocery() {
  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: {
        'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY!,
      },
    }
  );

  console.log('🔍 Testing Grocery Store Search\n');

  const businessCollection = client.collections.get('Business');

  // Test 1: Search for "grocery stores"
  console.log('Query: "grocery stores food supermarket"');
  const results = await businessCollection.query.nearText('grocery stores food supermarket', {
    limit: 10,
  });

  console.log(`\nFound ${results.objects.length} results:\n`);
  results.objects.forEach((obj: any, i: number) => {
    console.log(`${i + 1}. ${obj.properties.businessName}`);
    console.log(`   Category: ${obj.properties.category} → ${obj.properties.subcategory}`);
    console.log(`   Address: ${obj.properties.address}`);
    console.log('');
  });

  await client.close();
}

testGrocery().catch(console.error);

