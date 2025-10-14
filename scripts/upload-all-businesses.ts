// Upload ALL businesses from TERRACE_DATA to Weaviate
// Run with: npx tsx scripts/upload-all-businesses.ts

import weaviate from 'weaviate-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { glob } from 'glob';

dotenv.config({ path: '.env.local' });

const TERRACE_DATA_ROOT = '/Users/main/Desktop/untitled folder/terrace_ai 2/TERRACE_DATA';

interface BusinessData {
  business_name: string;
  google_address?: string;
  google_phone?: string;
  description?: string;
  website_found?: string;
  google_official_website?: string;
  google_rating?: number;
  google_reviews_count?: number;
  primary_phone?: string;
  contact_person?: string;
  category?: string;
  industry_category?: string;
  subcategory?: string;
  city?: string;
}

async function uploadAllBusinesses() {
  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey || !huggingfaceApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log('🔗 Connecting to Weaviate...');
  const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
    headers: {
      'X-HuggingFace-Api-Key': huggingfaceApiKey,
    },
    timeout: { init: 30, query: 60, insert: 300 }
  });

  console.log('✅ Connected!\n');

  // Find all business_data.json files
  console.log('🔍 Finding all business_data.json files...');
  const businessFiles = glob.sync(path.join(TERRACE_DATA_ROOT, 'business_economy/**/business_data.json'));
  console.log(`📊 Found ${businessFiles.length} business files\n`);

  const businessCollection = client.collections.get('Business');
  
  // Get existing business names to avoid duplicates
  console.log('🔍 Checking for existing businesses...');
  const existingBusinesses = await businessCollection.aggregate.overAll();
  console.log(`📊 Currently ${existingBusinesses.totalCount} businesses in Weaviate\n`);

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of businessFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8')) as BusinessData;
      
      if (!data.business_name || data.business_name.trim() === '') {
        skipped++;
        continue;
      }

      // Extract category info from file path
      const pathParts = file.split('/');
      const categoryIndex = pathParts.findIndex(p => p === 'business_economy');
      const industryCategory = pathParts[categoryIndex + 1] || 'unknown';
      const subcategory = pathParts[categoryIndex + 2] || 'unknown';

      try {
        await businessCollection.data.insert({
          businessName: data.business_name.trim(),
          category: data.category || 'business_economy',
          subcategory: data.subcategory || subcategory,
          address: data.google_address || 'Address not available',
          city: data.city || 'Terrace',
          postalCode: data.google_address?.match(/[A-Z]\d[A-Z]\s?\d[A-Z]\d/)?.[0] || '',
          description: data.description || 'No description available',
          phone: data.google_phone || data.primary_phone || 'Phone not available',
          email: '',
          website: data.google_official_website || data.website_found || '',
          claimed: false,
          verified: false,
        });
        
        uploaded++;
        if (uploaded % 50 === 0) {
          console.log(`✅ Uploaded ${uploaded}/${businessFiles.length}`);
        }
      } catch (insertError: any) {
        // Check if it's a duplicate
        if (insertError.message?.includes('duplicate') || insertError.message?.includes('already exists')) {
          skipped++;
        } else {
          console.error(`❌ Failed to upload "${data.business_name}": ${insertError.message}`);
          failed++;
        }
      }
    } catch (error: any) {
      console.warn(`⚠️  Failed to parse ${file}: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n🎉 Upload complete!`);
  console.log(`✅ Uploaded: ${uploaded} new businesses`);
  console.log(`⏭️  Skipped: ${skipped} (duplicates or empty)`);
  console.log(`❌ Failed: ${failed}`);
  
  // Get new total
  const finalCount = await businessCollection.aggregate.overAll();
  console.log(`\n📊 Total businesses in Weaviate: ${finalCount.totalCount}`);

  await client.close();
}

uploadAllBusinesses().catch(console.error);

