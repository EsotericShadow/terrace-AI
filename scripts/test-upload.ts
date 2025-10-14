// scripts/test-upload.ts
// Test upload with a small sample
// Run with: npm run weaviate:test-upload

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testUpload() {
  console.log('🧪 Testing Weaviate Upload with Sample Data\n');

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to Weaviate...');
    const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      timeout: { init: 30, query: 60, insert: 120 }
    });

    console.log('✅ Connected!\n');

    // Sample test data
    const testBusinesses = [
      {
        businessName: "Test Restaurant #1",
        category: "restaurants_food",
        subcategory: "restaurants",
        address: "123 Main St",
        city: "Terrace",
        postalCode: "V8G 1A1",
        description: "A test restaurant for demo purposes",
        phone: "250-555-0001",
        email: "test1@example.com",
        website: "https://test1.com"
      },
      {
        businessName: "Test HVAC Company",
        category: "construction_trades",
        subcategory: "hvac",
        address: "456 Industrial Ave",
        city: "Terrace",
        postalCode: "V8G 2B2",
        description: "Heating and cooling services",
        phone: "250-555-0002",
        email: null,
        website: null
      },
      {
        businessName: "Test Grocery Store",
        category: "retail_shopping",
        subcategory: "grocery",
        address: "789 Shopping Blvd",
        city: "Terrace",
        postalCode: "V8G 3C3",
        description: "Fresh groceries and produce",
        phone: "250-555-0003",
        email: "info@testgrocery.com",
        website: "https://testgrocery.com"
      }
    ];

    const testDocuments = [
      {
        title: "Test Bylaw - Noise Control",
        content: "This is a test document about noise control regulations in the city. Quiet hours are from 10 PM to 7 AM. Excessive noise during these hours may result in fines.",
        documentType: "bylaw",
        category: "bylaws",
        subcategory: "noise",
        sourceFile: "test-noise-bylaw.pdf",
        pageNumber: 1,
        extractedAt: new Date().toISOString()
      },
      {
        title: "Test Permit - Building Application",
        content: "This document explains how to apply for a building permit. You need to submit Form 14 with architectural drawings and pay the application fee.",
        documentType: "permit",
        category: "permits",
        subcategory: "building",
        sourceFile: "test-building-permit.pdf",
        pageNumber: 1,
        extractedAt: new Date().toISOString()
      }
    ];

    // Upload businesses
    console.log('📤 Uploading test businesses...');
    const businessCollection = client.collections.get('Business');
    
    for (const business of testBusinesses) {
      await businessCollection.data.insert(business);
      console.log(`  ✅ ${business.businessName}`);
    }

    console.log(`\n✅ Uploaded ${testBusinesses.length} businesses\n`);

    // Upload documents
    console.log('📤 Uploading test documents...');
    const documentCollection = client.collections.get('Document');
    
    for (const doc of testDocuments) {
      await documentCollection.data.insert(doc);
      console.log(`  ✅ ${doc.title}`);
    }

    console.log(`\n✅ Uploaded ${testDocuments.length} documents\n`);

    // Test search
    console.log('🔍 Testing search...\n');

    // Test 1: Search for restaurants
    console.log('Query: "restaurant"');
    const restaurantResults = await businessCollection.query.nearText('restaurant', {
      limit: 3
    });
    console.log(`  Found ${restaurantResults.objects.length} results:`);
    restaurantResults.objects.forEach((obj: any) => {
      console.log(`    - ${obj.properties.businessName} (${obj.properties.category})`);
    });

    // Test 2: Search for HVAC
    console.log('\nQuery: "heating cooling HVAC"');
    const hvacResults = await businessCollection.query.nearText('heating cooling HVAC', {
      limit: 3
    });
    console.log(`  Found ${hvacResults.objects.length} results:`);
    hvacResults.objects.forEach((obj: any) => {
      console.log(`    - ${obj.properties.businessName} (${obj.properties.subcategory})`);
    });

    // Test 3: Search for bylaws
    console.log('\nQuery: "noise bylaws regulations"');
    const bylawResults = await documentCollection.query.nearText('noise bylaws regulations', {
      limit: 3
    });
    console.log(`  Found ${bylawResults.objects.length} results:`);
    bylawResults.objects.forEach((obj: any) => {
      console.log(`    - ${obj.properties.title} (${obj.properties.documentType})`);
    });

    // Get collection stats
    console.log('\n📊 Collection Stats:');
    const businessAggregate = await businessCollection.aggregate.overAll();
    const documentAggregate = await documentCollection.aggregate.overAll();
    console.log(`  Business objects: ${businessAggregate.totalCount}`);
    console.log(`  Document objects: ${documentAggregate.totalCount}`);

    console.log('\n🎉 Test upload successful!');
    console.log('\nNext steps:');
    console.log('1. Check Weaviate dashboard to see your objects');
    console.log('2. If everything looks good, run full upload script');
    console.log('3. Delete test data before full upload with: npm run weaviate:clear');

    await client.close();

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.message?.includes('not found')) {
      console.error('\n💡 Tip: Run "npm run weaviate:setup" first to create collections');
    }
    process.exit(1);
  }
}

testUpload();

