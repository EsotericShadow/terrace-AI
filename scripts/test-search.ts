// scripts/test-search.ts
// Test semantic search on uploaded data
// Run with: npm run weaviate:test-search

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testSearch() {
  console.log('🔍 Testing Semantic Search on Weaviate\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey || !huggingfaceApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to Weaviate...');
    const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      headers: {
        'X-HuggingFace-Api-Key': huggingfaceApiKey,
      },
      timeout: { init: 30, query: 60, insert: 120 }
    });

    console.log('✅ Connected!\n');

    // Test 1: Search for restaurants
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 1: "Find restaurants and food places"\n');

    const businessCollection = client.collections.get('Business');
    const restaurantResults = await businessCollection.query.nearText('restaurants and food places', {
      limit: 5
    });

    console.log(`Found ${restaurantResults.objects.length} results:\n`);
    restaurantResults.objects.forEach((obj: any, i: number) => {
      console.log(`${i + 1}. ${obj.properties.businessName}`);
      console.log(`   Category: ${obj.properties.category} → ${obj.properties.subcategory}`);
      console.log(`   Address: ${obj.properties.address}`);
      console.log('');
    });

    // Test 2: Search for HVAC contractors
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 2: "HVAC heating and cooling contractors"\n');

    const hvacResults = await businessCollection.query.nearText('HVAC heating and cooling contractors', {
      limit: 5
    });

    console.log(`Found ${hvacResults.objects.length} results:\n`);
    hvacResults.objects.forEach((obj: any, i: number) => {
      console.log(`${i + 1}. ${obj.properties.businessName}`);
      console.log(`   Category: ${obj.properties.category} → ${obj.properties.subcategory}`);
      console.log(`   Address: ${obj.properties.address}`);
      console.log('');
    });

    // Test 3: Search bylaws
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 3: "noise bylaws and regulations"\n');

    const documentCollection = client.collections.get('Document');
    const bylawResults = await documentCollection.query.nearText('noise bylaws and regulations', {
      limit: 5
    });

    console.log(`Found ${bylawResults.objects.length} results:\n`);
    bylawResults.objects.forEach((obj: any, i: number) => {
      console.log(`${i + 1}. ${obj.properties.title}`);
      console.log(`   Type: ${obj.properties.documentType} → ${obj.properties.subcategory}`);
      console.log(`   Summary: ${obj.properties.summary?.substring(0, 100)}...`);
      console.log('');
    });

    // Test 4: Search for building permits
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Test 4: "building permit application"\n');

    const permitResults = await documentCollection.query.nearText('building permit application', {
      limit: 5
    });

    console.log(`Found ${permitResults.objects.length} results:\n`);
    permitResults.objects.forEach((obj: any, i: number) => {
      console.log(`${i + 1}. ${obj.properties.title}`);
      console.log(`   Type: ${obj.properties.documentType} → ${obj.properties.subcategory}`);
      console.log(`   File: ${obj.properties.filename}`);
      console.log('');
    });

    // Get collection stats
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Collection Stats\n');

    const businessAggregate = await businessCollection.aggregate.overAll();
    const documentAggregate = await documentCollection.aggregate.overAll();

    console.log(`Business objects: ${businessAggregate.totalCount}`);
    console.log(`Document objects: ${documentAggregate.totalCount}`);
    console.log(`Total objects: ${businessAggregate.totalCount + documentAggregate.totalCount}`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Semantic search is working!\n');
    console.log('Your Weaviate cluster is ready for AI-powered queries.');

    await client.close();

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

testSearch();


