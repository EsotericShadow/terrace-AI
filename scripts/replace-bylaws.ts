import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve, join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

interface BylawMetadata {
  bylaw_number: string;
  bylaw_name: string;
  adoption_date?: string;
  last_amended?: string;
  status?: string;
  url?: string;
  summary?: string;
  key_topics?: string[];
  sections?: any[];
  full_text?: string;
  [key: string]: any;
}

async function replaceBylaws() {
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
    timeout: { init: 30, query: 120, insert: 300 }
  });

  console.log('✅ Connected!\n');

  const documentCollection = client.collections.get('Document');

  // STEP 1: Delete all existing bylaw entries
  console.log('🗑️  STEP 1: Removing old bylaw data...');
  
  // Query for all bylaw documents (using multiple filters to catch all)
  const bylawQueries = [
    { path: 'category', operator: 'Like' as const, valueText: '*bylaw*' },
    { path: 'documentType', operator: 'Like' as const, valueText: '*bylaw*' },
    { path: 'category', operator: 'Like' as const, valueText: '*regulation*' },
  ];

  let totalDeleted = 0;
  for (const filter of bylawQueries) {
    try {
      const results = await documentCollection.query.fetchObjects({
        filters: documentCollection.filter.byProperty(filter.path).like(filter.valueText),
        limit: 1000
      });

      if (results.objects.length > 0) {
        console.log(`   Found ${results.objects.length} documents matching filter: ${filter.path} = ${filter.valueText}`);
        
        for (const obj of results.objects) {
          await documentCollection.data.deleteById(obj.uuid);
          totalDeleted++;
        }
      }
    } catch (error: any) {
      console.log(`   No documents found for filter: ${filter.path}`);
    }
  }

  console.log(`✅ Deleted ${totalDeleted} old bylaw entries\n`);

  // STEP 2: Load new bylaw data from BYLAWS directory
  console.log('📂 STEP 2: Loading new bylaw data from BYLAWS directory...');
  
  const bylawsDir = resolve(__dirname, '../../BYLAWS');
  const bylawFolders = readdirSync(bylawsDir).filter(name => {
    const fullPath = join(bylawsDir, name);
    return statSync(fullPath).isDirectory();
  });

  console.log(`   Found ${bylawFolders.length} bylaw folders\n`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const folder of bylawFolders) {
    const folderPath = join(bylawsDir, folder);
    const metaPath = join(folderPath, 'meta.json');

    // Check if meta.json exists
    try {
      statSync(metaPath);
    } catch {
      console.log(`⚠️  Skipping ${folder} - no meta.json found`);
      skippedCount++;
      continue;
    }

    // Check for NEEDS_VERIFICATION or DOWNLOAD_ISSUE
    const needsVerificationPath = join(folderPath, 'NEEDS_VERIFICATION.txt');
    const downloadIssuePath = join(folderPath, 'DOWNLOAD_ISSUE.txt');
    
    try {
      statSync(needsVerificationPath);
      console.log(`⚠️  Skipping ${folder} - NEEDS_VERIFICATION`);
      skippedCount++;
      continue;
    } catch {}

    try {
      statSync(downloadIssuePath);
      console.log(`⚠️  Skipping ${folder} - DOWNLOAD_ISSUE`);
      skippedCount++;
      continue;
    } catch {}

    // Load and parse meta.json
    try {
      const metaContent = readFileSync(metaPath, 'utf-8');
      const metadata: BylawMetadata = JSON.parse(metaContent);

      // Build the document content
      let fullContent = '';
      
      // Use summary as primary content if available
      if (metadata.summary) {
        fullContent += `Summary: ${metadata.summary}\n\n`;
      }

      // Add sections if available
      if (metadata.sections && Array.isArray(metadata.sections)) {
        fullContent += metadata.sections.map((section: any) => {
          return `Section ${section.number || ''}: ${section.title || ''}\n${section.content || ''}`;
        }).join('\n\n');
      }

      // Add full_text if available and no sections
      if (metadata.full_text && (!metadata.sections || metadata.sections.length === 0)) {
        fullContent += metadata.full_text;
      }

      // Prepare document for upload
      const document: any = {
        title: metadata.bylaw_name || folder,
        content: fullContent || metadata.summary || 'Bylaw document',
        documentType: 'bylaw',
        category: 'bylaws',
        subcategory: 'municipal_bylaws',
        sourceFile: folder,
        extractedAt: new Date().toISOString(),
        
        // Bylaw-specific metadata (only add if defined)
        bylawNumber: metadata.bylaw_number || '',
        bylawName: metadata.bylaw_name || '',
        status: metadata.status || 'active',
        summary: metadata.summary || '',
        
        // Store full metadata as JSON string for reference
        metadata: JSON.stringify(metadata)
      };

      // Add optional fields only if they exist
      if (metadata.adoption_date) document.adoptionDate = metadata.adoption_date;
      if (metadata.last_amended) document.lastAmended = metadata.last_amended;
      if (metadata.url) document.officialUrl = metadata.url;
      if (metadata.key_topics && metadata.key_topics.length > 0) {
        document.keyTopics = metadata.key_topics.join(', ');
      }

      // Upload to Weaviate
      await documentCollection.data.insert(document);
      uploadedCount++;
      console.log(`✅ Uploaded: ${metadata.bylaw_name || folder}`);

    } catch (error: any) {
      errorCount++;
      console.error(`❌ Failed to process ${folder}:`, error.message);
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   ✅ Uploaded: ${uploadedCount} bylaws`);
  console.log(`   ⚠️  Skipped: ${skippedCount} bylaws (incomplete)`);
  console.log(`   ❌ Errors: ${errorCount} bylaws`);
  console.log(`   🗑️  Deleted: ${totalDeleted} old entries`);
  console.log(`\n🎉 Bylaw data replacement complete!`);

  await client.close();
}

replaceBylaws().catch(console.error);


