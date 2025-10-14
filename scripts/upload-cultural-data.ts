// Upload cultural, historical, and points of interest data to Weaviate
// Run with: npx tsx scripts/upload-cultural-data.ts

import weaviate from 'weaviate-client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const TERRACE_DATA_ROOT = path.join(__dirname, '../../TERRACE_DATA');

interface CulturalItem {
  title: string;
  content: string;
  category: string;
  subcategory: string;
  sourceFile: string;
  metadata?: any;
}

async function uploadCulturalData() {
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

  const documents: CulturalItem[] = [];

  // 1. Process culture_community data
  console.log('📚 Processing culture_community data...');
  const culturePaths = [
    'culture_community/points_of_interest/attractions/individual_items',
    'culture_community/indigenous_culture/first_nations_sites/individual_items',
    'culture_community/heritage_sites/museums/individual_items'
  ];

  for (const culturePath of culturePaths) {
    const fullPath = path.join(TERRACE_DATA_ROOT, culturePath);
    if (fs.existsSync(fullPath)) {
      const items = fs.readdirSync(fullPath);
      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          const jsonFile = path.join(itemPath, 'cultural_data.json');
          if (fs.existsSync(jsonFile)) {
            try {
              const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
              
              // Extract content based on structure
              let title = '';
              let content = '';
              let subcategory = 'general';
              
              if (data.historical_info) {
                title = data.historical_info.event || data.historical_info.overview || item;
                content = JSON.stringify(data.historical_info, null, 2);
                subcategory = 'historical_event';
              } else if (data.indigenous_info) {
                title = `Indigenous Culture: ${item}`;
                content = data.indigenous_info.summary || JSON.stringify(data.indigenous_info, null, 2);
                subcategory = 'indigenous_culture';
              } else if (data.heritage_info) {
                title = data.heritage_info.name || item;
                content = JSON.stringify(data.heritage_info, null, 2);
                subcategory = 'heritage_site';
              } else {
                title = item;
                content = JSON.stringify(data, null, 2);
              }
              
              documents.push({
                title,
                content,
                category: 'culture_heritage',
                subcategory,
                sourceFile: `culture_community/${item}`,
                metadata: data.metadata
              });
            } catch (error) {
              console.warn(`⚠️  Failed to parse ${jsonFile}:`, error);
            }
          }
        }
      }
    }
  }

  // 2. Process points_of_interest data
  console.log('🗺️  Processing points_of_interest data...');
  const poiConsolidatedPath = path.join(TERRACE_DATA_ROOT, 'points_of_interest/consolidated_data');
  if (fs.existsSync(poiConsolidatedPath)) {
    const files = fs.readdirSync(poiConsolidatedPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(poiConsolidatedPath, file), 'utf-8'));
        
        // Handle different structures
        if (Array.isArray(data)) {
          // Array of items
          data.forEach((item: any, idx: number) => {
            documents.push({
              title: item.title || item.name || `POI ${idx + 1}`,
              content: JSON.stringify(item, null, 2),
              category: 'points_of_interest',
              subcategory: item.category || 'attraction',
              sourceFile: file,
              metadata: item
            });
          });
        } else {
          // Single object
          documents.push({
            title: data.title || file.replace('.json', ''),
            content: JSON.stringify(data, null, 2),
            category: 'points_of_interest',
            subcategory: data.category || 'general',
            sourceFile: file,
            metadata: data
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error);
      }
    }
  }

  // 3. Process infrastructure_services data
  console.log('🏗️  Processing infrastructure_services data...');
  const infraConsolidatedPath = path.join(TERRACE_DATA_ROOT, 'infrastructure_services/consolidated_data');
  if (fs.existsSync(infraConsolidatedPath)) {
    const files = fs.readdirSync(infraConsolidatedPath).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(infraConsolidatedPath, file), 'utf-8'));
        
        documents.push({
          title: data.title || file.replace('.json', ''),
          content: JSON.stringify(data, null, 2),
          category: 'infrastructure_services',
          subcategory: data.category || 'general',
          sourceFile: file,
          metadata: data
        });
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}:`, error);
      }
    }
  }

  console.log(`\n📊 Found ${documents.length} cultural/historical/POI items\n`);

  // Upload to Weaviate
  const collection = client.collections.get('Document');
  let uploaded = 0;
  let failed = 0;

  for (const doc of documents) {
    try {
      await collection.data.insert({
        title: doc.title,
        content: doc.content,
        documentType: 'cultural_historical',
        category: doc.category,
        subcategory: doc.subcategory,
        sourceFile: doc.sourceFile,
        pageNumber: 0,
        extractedAt: new Date().toISOString(),
      });
      uploaded++;
      if (uploaded % 10 === 0) {
        console.log(`✅ Uploaded ${uploaded}/${documents.length}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to upload "${doc.title}":`, error.message);
      failed++;
    }
  }

  console.log(`\n🎉 Upload complete!`);
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);

  await client.close();
}

uploadCulturalData().catch(console.error);

