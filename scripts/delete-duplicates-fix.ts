// Delete duplicate businesses from Weaviate
// Run with: npx tsx scripts/delete-duplicates-fix.ts

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function deleteDuplicates() {
  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log('🔗 Connecting to Weaviate...');
  const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
    headers: huggingfaceApiKey ? { 'X-HuggingFace-Api-Key': huggingfaceApiKey } : {},
    timeout: { init: 30, query: 60, insert: 300 }
  });

  console.log('✅ Connected!\n');

  const collection = client.collections.get('Business');
  
  // Get all businesses
  console.log('📊 Fetching all businesses...');
  const allBusinesses = await collection.query.fetchObjects({ limit: 2000 });
  console.log(`Found ${allBusinesses.objects.length} total businesses\n`);

  // Group by business name
  const businessMap = new Map<string, any[]>();
  allBusinesses.objects.forEach((obj: any) => {
    const name = obj.properties.businessName;
    if (!businessMap.has(name)) {
      businessMap.set(name, []);
    }
    businessMap.get(name)!.push(obj);
  });

  // Find duplicates
  console.log('🔍 Finding duplicates...');
  let duplicatesFound = 0;
  let deleted = 0;

  for (const [name, instances] of businessMap.entries()) {
    if (instances.length > 1) {
      duplicatesFound++;
      console.log(`\n📍 "${name}" has ${instances.length} copies`);
      
      // Keep the first one, delete the rest
      for (let i = 1; i < instances.length; i++) {
        try {
          await collection.data.deleteById(instances[i].uuid);
          deleted++;
          console.log(`  ✅ Deleted duplicate ${i}`);
        } catch (error: any) {
          console.error(`  ❌ Failed to delete: ${error.message}`);
        }
      }
    }
  }

  console.log(`\n🎉 Cleanup complete!`);
  console.log(`📊 Found ${duplicatesFound} businesses with duplicates`);
  console.log(`✅ Deleted ${deleted} duplicate entries`);
  
  // Get final count
  const finalCount = await collection.aggregate.overAll();
  console.log(`\n📊 Final business count: ${finalCount.totalCount}`);

  await client.close();
}

deleteDuplicates().catch(console.error);

