import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function cleanDuplicates() {
  console.log('🧹 Cleaning Duplicate Businesses from Weaviate\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  This will DELETE duplicate business entries');
  console.log('   Keeping the most complete version of each business\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: { 'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY! },
      timeout: { init: 30, query: 120, insert: 300 }
    }
  );

  console.log('✅ Connected to Weaviate\n');

  const businessCollection = client.collections.get('Business');

  // Get all businesses
  console.log('Fetching all businesses...');
  const allBusinesses = await businessCollection.query.fetchObjects({
    limit: 3000
  });

  console.log(`Found ${allBusinesses.objects.length} total objects\n`);

  // Group by business name (case-insensitive, trimmed)
  const businessGroups = new Map<string, any[]>();
  
  for (const obj of allBusinesses.objects) {
    const businessName = obj.properties.businessName;
    const name = (typeof businessName === 'string' ? businessName.toUpperCase().trim() : 'UNKNOWN');
    if (!businessGroups.has(name)) {
      businessGroups.set(name, []);
    }
    businessGroups.get(name)!.push({
      id: obj.uuid,
      ...obj.properties
    });
  }

  // Find duplicates and decide which to keep
  console.log('Analyzing duplicates...\n');
  
  let duplicatesFound = 0;
  let objectsToDelete = 0;
  const deletionList: string[] = [];

  for (const [name, instances] of Array.from(businessGroups.entries())) {
    if (instances.length > 1) {
      duplicatesFound++;
      
      // Score each instance based on completeness
      const scored = instances.map(inst => {
        let score = 0;
        // Check common properties that might exist
        const props = Object.keys(inst);
        if (inst.address && inst.address !== 'Address not available' && inst.address !== 'No address' && inst.address.trim() !== '') score += 5;
        if (inst.phone || inst.primaryPhone) score += 3;
        if (inst.website || inst.websiteFound || inst.googleOfficialWebsite) score += 3;
        if (inst.description) score += 2;
        // More properties = more complete
        score += props.length;
        return { ...inst, score };
      });

      // Sort by score (highest first)
      scored.sort((a, b) => b.score - a.score);

      // Keep the first (best), delete the rest
      const toKeep = scored[0];
      const toDelete = scored.slice(1);

      for (const dup of toDelete) {
        deletionList.push(dup.id);
        objectsToDelete++;
      }

      if (duplicatesFound <= 5) {
        console.log(`📋 "${name}"`);
        console.log(`   ✅ Keeping: ${toKeep.address || 'No address'} (score: ${toKeep.score})`);
        toDelete.forEach(d => {
          console.log(`   ❌ Deleting: ${d.address || 'No address'} (score: ${d.score})`);
        });
        console.log('');
      }
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Cleanup Summary\n');
  console.log(`  Businesses with duplicates: ${duplicatesFound}`);
  console.log(`  Objects to delete:          ${objectsToDelete}`);
  console.log(`  Unique businesses to keep:  ${businessGroups.size}`);
  console.log('');

  if (objectsToDelete === 0) {
    console.log('✅ No duplicates to clean!');
    await client.close();
    return;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🗑️  Deleting duplicates...\n');

  let deleted = 0;
  let failed = 0;

  for (const id of deletionList) {
    try {
      await businessCollection.data.deleteById(id);
      deleted++;
      if (deleted % 100 === 0) {
        console.log(`   Deleted ${deleted}/${objectsToDelete}...`);
      }
    } catch (error: any) {
      failed++;
      console.error(`   ❌ Failed to delete ${id}: ${error.message}`);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Cleanup Complete!\n');
  console.log(`  Successfully deleted: ${deleted} duplicate objects`);
  if (failed > 0) {
    console.log(`  Failed to delete:     ${failed} objects`);
  }
  console.log(`  Remaining businesses: ${allBusinesses.objects.length - deleted}`);
  console.log('');
  console.log('Run npm run weaviate:test-search to verify cleanup');

  await client.close();
}

cleanDuplicates().catch(console.error);

