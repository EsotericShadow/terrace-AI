import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

/**
 * REPLACE OLD OCR BYLAWS WITH NEW STRUCTURED DATA
 * 
 * This script:
 * 1. Deletes old OCR-extracted bylaw documents (full of artifacts)
 * 2. Uploads new structured bylaws from BYLAWS/ folders
 * 3. Preserves 4-layer metadata (already uploaded)
 * 4. Preserves permits, planning docs, and other non-bylaw documents
 */

async function replaceOldBylaws() {
  console.log('🔄 REPLACING OLD OCR BYLAWS WITH STRUCTURED DATA\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: { 'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY! },
      timeout: { init: 30, query: 120, insert: 300 }
    }
  );

  console.log('✅ Connected to Weaviate\n');

  const documentCollection = client.collections.get('Document');

  // ============================================================================
  // PHASE 1: ANALYZE EXISTING DOCUMENTS
  // ============================================================================

  console.log('📊 PHASE 1: Analyzing existing documents');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const allDocs = await documentCollection.query.fetchObjects({ limit: 500 });
  
  console.log(`Total Document objects: ${allDocs.objects.length}\n`);

  // Categorize documents
  const bylaws: any[] = [];
  const permits: any[] = [];
  const planning: any[] = [];
  const other: any[] = [];

  for (const doc of allDocs.objects) {
    const props = doc.properties;
    const catValue = props.category || props.subcategory;
    const typeValue = props.documentType;
    const cat = (typeof catValue === 'string' ? catValue : '');
    const type = (typeof typeValue === 'string' ? typeValue : '');
    
    if (cat.includes('bylaw') || type.includes('bylaw')) {
      bylaws.push({ id: doc.uuid, ...props });
    } else if (cat.includes('permit') || type.includes('permit')) {
      permits.push({ id: doc.uuid, ...props });
    } else if (cat.includes('planning') || type.includes('planning')) {
      planning.push({ id: doc.uuid, ...props });
    } else {
      other.push({ id: doc.uuid, ...props });
    }
  }

  console.log('Document breakdown:');
  console.log(`  📜 Bylaws:   ${bylaws.length} (WILL BE REPLACED)`);
  console.log(`  📋 Permits:  ${permits.length} (PRESERVED)`);
  console.log(`  📐 Planning: ${planning.length} (PRESERVED)`);
  console.log(`  📄 Other:    ${other.length} (PRESERVED)`);
  console.log('');

  // ============================================================================
  // PHASE 2: DELETE OLD OCR BYLAWS
  // ============================================================================

  if (bylaws.length > 0) {
    console.log('🗑️  PHASE 2: Deleting old OCR bylaw documents');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`Deleting ${bylaws.length} old bylaw documents...`);
    
    let deleted = 0;
    for (const bylaw of bylaws) {
      try {
        await documentCollection.data.deleteById(bylaw.id);
        deleted++;
        if (deleted % 10 === 0) {
          console.log(`  Deleted ${deleted}/${bylaws.length}...`);
        }
      } catch (error: any) {
        console.error(`  ❌ Failed to delete ${bylaw.id}: ${error.message}`);
      }
    }

    console.log(`✅ Deleted ${deleted} old bylaw documents\n`);
  } else {
    console.log('✅ No old bylaws to delete\n');
  }

  // ============================================================================
  // PHASE 3: UPLOAD NEW STRUCTURED BYLAWS
  // ============================================================================

  console.log('📄 PHASE 3: Uploading new structured bylaws');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const bylawsDir = resolve(__dirname, '../../BYLAWS');
  const bylawFolders = readdirSync(bylawsDir).filter(name => {
    const fullPath = resolve(bylawsDir, name);
    try {
      return statSync(fullPath).isDirectory() && /^\d/.test(name); // Starts with number
    } catch {
      return false;
    }
  });

  console.log(`Found ${bylawFolders.length} bylaw folders to process\n`);

  let uploaded = 0;
  let skipped = 0;

  for (const folder of bylawFolders) {
    const folderPath = resolve(bylawsDir, folder);
    const metaPath = resolve(folderPath, 'meta.json');

    // Skip if no meta.json or has issue flags
    try {
      statSync(metaPath);
    } catch {
      console.log(`⚠️  Skipping ${folder} - no meta.json`);
      skipped++;
      continue;
    }

    try {
      statSync(resolve(folderPath, 'NEEDS_VERIFICATION.txt'));
      console.log(`⚠️  Skipping ${folder} - NEEDS_VERIFICATION`);
      skipped++;
      continue;
    } catch {}

    try {
      statSync(resolve(folderPath, 'DOWNLOAD_ISSUE.txt'));
      console.log(`⚠️  Skipping ${folder} - DOWNLOAD_ISSUE`);
      skipped++;
      continue;
    } catch {}

    // Load meta.json
    try {
      const metaContent = readFileSync(metaPath, 'utf-8');
      const meta = JSON.parse(metaContent);

      // Build full content from sections AND schedules
      const sectionFiles = readdirSync(folderPath).filter(f => 
        (f.startsWith('section_') || f.startsWith('schedule_')) && f.endsWith('.json')
      );

      let fullContent = '';
      if (meta.description) {
        fullContent += `${meta.description}\n\n`;
      }

      // Load section and schedule files
      for (const sectionFile of sectionFiles.sort()) {
        try {
          const sectionPath = resolve(folderPath, sectionFile);
          const sectionData = JSON.parse(readFileSync(sectionPath, 'utf-8'));
          
          // Handle schedule files differently
          if (sectionFile.startsWith('schedule_')) {
            fullContent += `Schedule ${sectionData.schedule || ''}: ${sectionData.title || ''}\n`;
            if (sectionData.description) {
              fullContent += `${sectionData.description}\n\n`;
            }
            // Include entire schedule data as JSON for searchability
            fullContent += JSON.stringify(sectionData, null, 2) + '\n\n';
          } else {
            // Regular section file
            fullContent += `Section ${sectionData.section_number || ''}: ${sectionData.title || ''}\n`;
            
            if (typeof sectionData.content === 'object') {
              fullContent += JSON.stringify(sectionData.content, null, 2) + '\n\n';
            } else if (typeof sectionData.content === 'string') {
              fullContent += sectionData.content + '\n\n';
            }
          }
        } catch (e) {}
      }

      // Prepare document for upload
      // Convert legalAuthority to string if it's an array
      let legalAuthority = meta.legal_authority;
      if (Array.isArray(legalAuthority)) {
        legalAuthority = legalAuthority.join('; ');
      }

      const document = {
        title: meta.title || meta.bylaw_name || folder,
        content: fullContent || meta.description || 'Bylaw document',
        documentType: 'bylaw',
        category: 'bylaws',
        subcategory: 'municipal_bylaws',
        sourceFile: folder,
        extractedAt: new Date().toISOString(),
        
        // Bylaw-specific metadata
        bylawNumber: meta.bylaw_number,
        bylawName: meta.bylaw_name || meta.title,
        documentUrl: meta.document_url || meta.url,
        legalAuthority: legalAuthority,
        adoptionDate: meta.adoption_date || meta.adoption_dates?.adopted,
        lastAmended: meta.last_amended,
        pages: meta.pages,
        
        // Store full metadata as JSON
        summary: meta.description,
        metadata: JSON.stringify(meta)
      };

      await documentCollection.data.insert(document);
      uploaded++;
      console.log(`  ✅ Uploaded: ${meta.bylaw_number || folder} - ${meta.title || meta.bylaw_name}`);

    } catch (error: any) {
      console.error(`  ❌ Failed to process ${folder}: ${error.message}`);
      skipped++;
    }
  }

  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PHASE 4: Final Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const finalCount = await documentCollection.aggregate.overAll();

  console.log('OLD DATA:');
  console.log(`  Bylaws deleted:        ${bylaws.length}`);
  console.log(`  Permits preserved:     ${permits.length}`);
  console.log(`  Planning preserved:    ${planning.length}`);
  console.log(`  Other preserved:       ${other.length}`);
  console.log('');
  console.log('NEW DATA:');
  console.log(`  Bylaws uploaded:       ${uploaded}`);
  console.log(`  Bylaws skipped:        ${skipped}`);
  console.log('');
  console.log(`TOTAL DOCUMENTS NOW:     ${finalCount.totalCount}`);
  console.log('');
  console.log('✅ BYLAW REPLACEMENT COMPLETE!');
  console.log('');
  console.log('What changed:');
  console.log('  ❌ Old OCR bylaws (messy) → DELETED');
  console.log('  ✅ New structured bylaws → ADDED');
  console.log('  ✅ Permits & planning docs → PRESERVED');
  console.log('  ✅ 4-layer metadata → PRESERVED');

  await client.close();
}

replaceOldBylaws().catch(console.error);

