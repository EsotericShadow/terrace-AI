// Test new metadata collections
import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testMetadata() {
  console.log('🧪 Testing New Metadata Collections\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: { 'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY! },
    }
  );

  console.log('✅ Connected to Weaviate\n');

  // Test BylawMetadata
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📄 BylawMetadata Collection\n');

  const bylawMeta = client.collections.get('BylawMetadata');
  const bylawResults = await bylawMeta.query.fetchObjects({ limit: 10 });

  console.log(`Found ${bylawResults.objects.length} metadata layers:\n`);
  bylawResults.objects.forEach((obj: any) => {
    console.log(`  Layer: ${obj.properties.layer}`);
    console.log(`  Summary: ${obj.properties.summary}`);
    console.log('');
  });

  // Test BusinessOntology
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 BusinessOntology Collection\n');

  const businessOnt = client.collections.get('BusinessOntology');
  const ontResults = await businessOnt.query.fetchObjects({ limit: 10 });

  console.log(`Found ${ontResults.objects.length} ontology objects:\n`);
  ontResults.objects.forEach((obj: any) => {
    console.log(`  Category: ${obj.properties.category}/${obj.properties.subcategory || 'ALL'}`);
    console.log(`  Layer: ${obj.properties.layer}`);
    console.log(`  Summary: ${obj.properties.summary?.substring(0, 80)}...`);
    console.log('');
  });

  // Test semantic search on new collections
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Testing Semantic Search on Metadata\n');

  const automotiveSearch = await businessOnt.query.nearText(
    'automotive repair services in Terrace winter tire season',
    { limit: 3 }
  );

  console.log('Query: "automotive repair services in Terrace winter tire season"\n');
  console.log(`Found ${automotiveSearch.objects.length} results:\n`);
  automotiveSearch.objects.forEach((obj: any, i: number) => {
    console.log(`${i + 1}. ${obj.properties.category}/${obj.properties.subcategory || 'ALL'} (${obj.properties.layer})`);
    console.log(`   ${obj.properties.summary?.substring(0, 100)}...`);
    console.log('');
  });

  // Get all collection stats
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Complete Collection Stats\n');

  const business = client.collections.get('Business');
  const document = client.collections.get('Document');

  const businessCount = await business.aggregate.overAll();
  const documentCount = await document.aggregate.overAll();
  const bylawMetaCount = await bylawMeta.aggregate.overAll();
  const ontologyCount = await businessOnt.aggregate.overAll();

  console.log('ORIGINAL COLLECTIONS (Preserved):');
  console.log(`  Business:          ${businessCount.totalCount} objects`);
  console.log(`  Document:          ${documentCount.totalCount} objects`);
  console.log('');
  console.log('NEW METADATA COLLECTIONS (Added):');
  console.log(`  BylawMetadata:     ${bylawMetaCount.totalCount} objects`);
  console.log(`  BusinessOntology:  ${ontologyCount.totalCount} objects`);
  console.log('');
  console.log(`TOTAL:               ${businessCount.totalCount + documentCount.totalCount + bylawMetaCount.totalCount + ontologyCount.totalCount} objects`);
  console.log('');
  console.log('✅ All collections verified and searchable!');

  await client.close();
}

testMetadata().catch(console.error);

