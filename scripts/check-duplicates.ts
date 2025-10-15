import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkDuplicates() {
  console.log('🔍 Checking for Duplicate Businesses in Weaviate\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: { 'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY! },
    }
  );

  console.log('✅ Connected to Weaviate\n');

  const businessCollection = client.collections.get('Business');

  // Get all businesses
  console.log('Fetching all businesses...');
  const allBusinesses = await businessCollection.query.fetchObjects({
    limit: 3000,
    returnProperties: ['businessName', 'address', 'category', 'subcategory', 'city']
  });

  console.log(`\nTotal Business objects in Weaviate: ${allBusinesses.objects.length}\n`);

  // Check for duplicates by business name
  const businessNames = new Map<string, any[]>();
  
  for (const obj of allBusinesses.objects) {
    const businessName = obj.properties.businessName;
    const name = (typeof businessName === 'string' ? businessName.toUpperCase().trim() : 'UNKNOWN');
    if (!businessNames.has(name)) {
      businessNames.set(name, []);
    }
    businessNames.get(name)!.push({
      id: obj.uuid,
      name: obj.properties.businessName,
      address: obj.properties.address || 'No address',
      category: obj.properties.category,
      subcategory: obj.properties.subcategory,
      city: obj.properties.city
    });
  }

  // Find duplicates
  const duplicates: Array<[string, any[]]> = [];
  for (const [name, instances] of Array.from(businessNames.entries())) {
    if (instances.length > 1) {
      duplicates.push([name, instances]);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Duplicate Analysis\n');
  console.log(`Total unique business names: ${businessNames.size}`);
  console.log(`Businesses with duplicates: ${duplicates.length}`);
  console.log(`Total duplicate objects: ${allBusinesses.objects.length - businessNames.size}\n`);

  if (duplicates.length > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Sample Duplicates (first 10):\n');
    
    for (let i = 0; i < Math.min(10, duplicates.length); i++) {
      const [name, instances] = duplicates[i];
      console.log(`${i + 1}. "${name}" (${instances.length} copies)`);
      instances.forEach((inst, idx) => {
        console.log(`   Copy ${idx + 1}: ${inst.address}`);
        console.log(`           Category: ${inst.category} → ${inst.subcategory}`);
        console.log(`           ID: ${inst.id.substring(0, 8)}...`);
      });
      console.log('');
    }
  }

  // Check category distribution
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📂 Category Distribution\n');
  
  const categories = new Map<string, number>();
  for (const obj of allBusinesses.objects) {
    const catValue = obj.properties.category;
    const cat = (typeof catValue === 'string' ? catValue : 'unknown');
    categories.set(cat, (categories.get(cat) || 0) + 1);
  }

  const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
  sortedCategories.slice(0, 10).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} businesses`);
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Recommendations:\n');
  
  if (duplicates.length > 0) {
    console.log(`  ⚠️  Found ${duplicates.length} businesses with duplicates`);
    console.log(`  ⚠️  ${allBusinesses.objects.length - businessNames.size} duplicate objects should be removed`);
    console.log(`  ✅  After cleanup, you should have ~${businessNames.size} unique businesses`);
    console.log('');
    console.log('  Run: npm run weaviate:clean-duplicates');
  } else {
    console.log('  ✅ No duplicates found!');
  }

  await client.close();
}

checkDuplicates().catch(console.error);

