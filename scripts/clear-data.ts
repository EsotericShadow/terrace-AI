// scripts/clear-data.ts
// Clear all data from Weaviate collections
// Run with: npm run weaviate:clear

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function clearData() {
  console.log('🗑️  Clearing Weaviate Data\n');

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to Weaviate...');
    const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      headers: huggingfaceApiKey ? {
        'X-HuggingFace-Api-Key': huggingfaceApiKey,
      } : {},
    });

    console.log('✅ Connected!\n');

    // Get collections
    const collections = await client.collections.listAll();
    const collectionNames = Object.keys(collections);
    
    console.log('📊 Current object counts:');
    
    let businessCount = 0;
    let documentCount = 0;
    let municipalCount = 0;

    if (collectionNames.includes('Business')) {
      const businessCollection = client.collections.get('Business');
      const businessAggregate = await businessCollection.aggregate.overAll();
      businessCount = businessAggregate.totalCount;
      console.log(`  Business: ${businessCount}`);
    } else {
      console.log(`  Business: Collection not found`);
    }

    if (collectionNames.includes('Document')) {
      const documentCollection = client.collections.get('Document');
      const documentAggregate = await documentCollection.aggregate.overAll();
      documentCount = documentAggregate.totalCount;
      console.log(`  Document: ${documentCount}`);
    } else {
      console.log(`  Document: Collection not found`);
    }

    if (collectionNames.includes('MunicipalService')) {
      const municipalCollection = client.collections.get('MunicipalService');
      const municipalAggregate = await municipalCollection.aggregate.overAll();
      municipalCount = municipalAggregate.totalCount;
      console.log(`  MunicipalService: ${municipalCount}`);
    } else {
      console.log(`  MunicipalService: Collection not found`);
    }
    console.log('');

    // Confirm deletion
    const total = businessCount + documentCount + municipalCount;
    
    if (total === 0) {
      console.log('✅ No data to clear!');
      await client.close();
      return;
    }

    console.log(`⚠️  About to delete ${total} objects`);
    console.log('This action cannot be undone.\n');

    // Delete all objects by deleting and recreating collections
    if (collectionNames.includes('Business') && businessCount > 0) {
      console.log('🗑️  Clearing Business collection...');
      await client.collections.delete('Business');
      console.log('✅ Done');
    }

    if (collectionNames.includes('Document') && documentCount > 0) {
      console.log('🗑️  Clearing Document collection...');
      await client.collections.delete('Document');
      console.log('✅ Done');
    }

    if (collectionNames.includes('MunicipalService') && municipalCount > 0) {
      console.log('🗑️  Clearing MunicipalService collection...');
      await client.collections.delete('MunicipalService');
      console.log('✅ Done');
    }

    console.log('\n✅ All data cleared!');
    console.log('\nNote: Collections have been deleted. Run upload script to recreate and populate.');
    console.log('You can upload new data with: npm run weaviate:upload-terrace');

    await client.close();

  } catch (error: any) {
    console.error('❌ Clear failed:', error.message);
    process.exit(1);
  }
}

clearData();

