import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

/**
 * Remove any remaining old OCR-extracted bylaws
 * These have documentType="extracted" and category/subcategory="bylaws"
 */

async function removeOldOCRBylaws() {
  console.log('🧹 Removing Remaining Old OCR Bylaws\n');
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

  // Get all documents
  const allDocs = await documentCollection.query.fetchObjects({ limit: 500 });
  
  console.log(`Total documents: ${allDocs.objects.length}\n`);

  // Find old OCR bylaws (documentType="extracted" AND category/subcategory contains "bylaw")
  const oldOCRBylaws: any[] = [];
  const newStructuredBylaws: any[] = [];
  const otherDocs: any[] = [];

  for (const doc of allDocs.objects) {
    const props = doc.properties;
    const type = (typeof props.documentType === 'string' ? props.documentType : '');
    const cat = (typeof props.category === 'string' ? props.category : '');
    const subcat = (typeof props.subcategory === 'string' ? props.subcategory : '');
    
    const isBylaw = cat.includes('bylaw') || subcat.includes('bylaw');
    const isExtracted = type === 'extracted';
    const isNew = type === 'bylaw';

    if (isBylaw && isExtracted) {
      oldOCRBylaws.push({ 
        id: doc.uuid, 
        title: props.title || props.filename,
        type,
        cat,
        subcat
      });
    } else if (isBylaw && isNew) {
      newStructuredBylaws.push({
        id: doc.uuid,
        title: props.title,
        bylawNumber: props.bylawNumber
      });
    } else {
      otherDocs.push({
        id: doc.uuid,
        title: props.title || props.filename,
        type
      });
    }
  }

  console.log('Document Analysis:');
  console.log(`  📜 Old OCR bylaws:      ${oldOCRBylaws.length} (WILL DELETE)`);
  console.log(`  ✨ New structured bylaws: ${newStructuredBylaws.length} (KEEP)`);
  console.log(`  📄 Other documents:      ${otherDocs.length} (KEEP)`);
  console.log('');

  if (oldOCRBylaws.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️  Deleting old OCR bylaws\n');

    console.log('Old OCR bylaws to delete:');
    oldOCRBylaws.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.title?.substring(0, 60) || 'Untitled'}`);
    });
    console.log('');

    let deleted = 0;
    for (const bylaw of oldOCRBylaws) {
      try {
        await documentCollection.data.deleteById(bylaw.id);
        deleted++;
      } catch (error: any) {
        console.error(`  ❌ Failed to delete ${bylaw.id}: ${error.message}`);
      }
    }

    console.log(`✅ Deleted ${deleted} old OCR bylaw documents\n`);
  } else {
    console.log('✅ No old OCR bylaws found - all clean!\n');
  }

  // Final count
  const finalCount = await documentCollection.aggregate.overAll();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Final Summary\n');
  console.log(`  New structured bylaws: ${newStructuredBylaws.length}`);
  console.log(`  Other documents:       ${otherDocs.length}`);
  console.log(`  Total documents:       ${finalCount.totalCount}`);
  console.log('');
  console.log('✅ OCR CLEANUP COMPLETE!');

  await client.close();
}

removeOldOCRBylaws().catch(console.error);

