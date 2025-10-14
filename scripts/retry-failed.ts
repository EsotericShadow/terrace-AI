// scripts/retry-failed.ts
// Retry uploading failed files
// Run with: npm run weaviate:retry-failed

import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

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
  city?: string;
  created_at?: string;
  updated_at?: string;
  subcategory?: string;
}

function determineCategory(filepath: string): { category: string; subcategory: string } {
  const parts = filepath.split('/');
  const terraceDataIndex = parts.findIndex(p => p === 'TERRACE_DATA');
  
  if (terraceDataIndex === -1) {
    return { category: 'unknown', subcategory: 'unknown' };
  }

  const category = parts[terraceDataIndex + 1] || 'unknown';
  const subcategory = parts[terraceDataIndex + 2] || 'unknown';

  return { category, subcategory };
}

async function retryFailed() {
  console.log('🔄 Retrying Failed Uploads\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey || !huggingfaceApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  const failedFiles = [
    '/Users/main/Desktop/untitled folder/terrace_ai 2/TERRACE_DATA/business_economy/construction_trades/general_contractors/new_haven_ventures/business_data.json',
    '/Users/main/Desktop/untitled folder/terrace_ai 2/TERRACE_DATA/business_economy/security_services/security_guards/blue_hawk_security__group_inc/business_data.json'
  ];

  try {
    console.log('🔗 Connecting to Weaviate Cloud...');
    const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      headers: {
        'X-HuggingFace-Api-Key': huggingfaceApiKey,
      },
      timeout: { init: 30, query: 60, insert: 300 }
    });

    console.log('✅ Connected!\n');

    const businessCollection = client.collections.get('Business');

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < failedFiles.length; i++) {
      const file = failedFiles[i];
      const shortPath = file.split('TERRACE_DATA')[1];
      
      console.log(`[${i + 1}/${failedFiles.length}] Retrying: ${shortPath}`);

      try {
        const fileContent = readFileSync(file, 'utf-8').trim();
        if (!fileContent || fileContent === '') {
          console.log('   ⚠️  Skipped: Empty file\n');
          failCount++;
          continue;
        }

        const data = JSON.parse(fileContent) as BusinessData;
        const { category, subcategory } = determineCategory(file);

        await businessCollection.data.insert({
          businessName: data.business_name || 'Unknown',
          category: data.category || category,
          subcategory: data.subcategory || subcategory,
          industryCategory: data.industry_category || '',
          address: data.google_address || '',
          city: data.city || 'Terrace',
          postalCode: '',
          description: data.description || '',
          phone: data.google_phone || data.primary_phone || '',
          email: '',
          website: data.google_official_website || data.website_found || '',
          rating: data.google_rating || 0,
          reviewsCount: data.google_reviews_count || 0,
          contactPerson: data.contact_person || '',
          sourceFile: file,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
        });

        console.log('   ✅ Success!\n');
        successCount++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.log(`   ❌ Failed: ${error.message}\n`);
        failCount++;
      }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Retry Summary\n');
    console.log(`Total files retried: ${failedFiles.length}`);
    console.log(`  ✅ Successful: ${successCount}`);
    console.log(`  ❌ Failed: ${failCount}`);

    // Get updated collection stats
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Updated Weaviate Collection Stats\n');

    const businessAggregate = await businessCollection.aggregate.overAll();
    const documentCollection = client.collections.get('Document');
    const documentAggregate = await documentCollection.aggregate.overAll();

    console.log(`Business objects in Weaviate: ${businessAggregate.totalCount}`);
    console.log(`Document objects in Weaviate: ${documentAggregate.totalCount}`);
    console.log(`Total objects: ${businessAggregate.totalCount + documentAggregate.totalCount}`);

    if (successCount > 0) {
      console.log('\n🎉 Retry complete! All recoverable files uploaded successfully.');
    } else {
      console.log('\n⚠️  No files were successfully uploaded. The API may still be experiencing issues.');
    }

    await client.close();

  } catch (error: any) {
    console.error('\n❌ Retry failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

retryFailed();


