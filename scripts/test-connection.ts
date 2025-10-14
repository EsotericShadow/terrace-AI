// scripts/test-connection.ts
// Test Weaviate connection
// Run with: npm run weaviate:test

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testConnection() {
  console.log('🔍 Testing Weaviate Connection...\n');

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;

  // Check environment variables
  console.log('Environment check:');
  console.log(`  WEAVIATE_URL: ${weaviateUrl ? '✅' : '❌ Missing'}`);
  console.log(`  WEAVIATE_API_KEY: ${weaviateApiKey ? '✅' : '❌ Missing'}`);
  console.log('');

  if (!weaviateUrl || !weaviateApiKey) {
    console.error('❌ Missing required environment variables');
    console.error('\nPlease create a .env.local file with:');
    console.error('  WEAVIATE_URL=your_cluster_url');
    console.error('  WEAVIATE_API_KEY=your_api_key');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to Weaviate Cloud...');
    
    const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      timeout: { init: 30, query: 60, insert: 120 }
    });

    const isReady = await client.isReady();
    
    if (isReady) {
      console.log('✅ Connection successful!\n');
      
      // Get cluster info
      const meta = await client.getMeta();
      console.log('Cluster information:');
      console.log(`  Version: ${meta.version}`);
      console.log(`  Hostname: ${meta.hostname}`);
      console.log('');

      // Check collections
      const collections = await client.collections.listAll();
      console.log(`Collections: ${Object.keys(collections).length}`);
      Object.keys(collections).forEach(name => {
        console.log(`  - ${name}`);
      });

      if (Object.keys(collections).length === 0) {
        console.log('\n📝 No collections found. Run: npm run weaviate:setup');
      }

    } else {
      console.error('❌ Weaviate is not ready');
    }

    await client.close();
    console.log('\n✅ Test complete');

  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check your WEAVIATE_URL is correct');
    console.error('  2. Check your WEAVIATE_API_KEY is correct');
    console.error('  3. Make sure your cluster is running (not expired)');
    console.error('  4. Check your internet connection');
    process.exit(1);
  }
}

testConnection();

