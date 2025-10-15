import weaviate, { WeaviateClient } from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testBylawSearch() {
  const client: WeaviateClient = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL || '',
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY || ''),
      headers: {
        'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY || '',
      },
    }
  );

  try {
    console.log('🔍 TESTING BYLAW SEARCH\n');
    console.log('═'.repeat(80));

    const documentCollection = client.collections.get('Document');

    // Test 1: Direct fetch of Business Licence bylaw
    console.log('\n📋 TEST 1: Direct fetch of Business Licence bylaw');
    console.log('─'.repeat(80));
    const directResults = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('title').like('*Business Licence*'),
      limit: 1,
    });
    
    if (directResults.objects.length > 0) {
      const doc = directResults.objects[0].properties as any;
      console.log('✅ Found:', doc.title);
      console.log('   Content length:', (doc.fullContent || doc.content || '').length);
      const content = doc.fullContent || doc.content || '';
      console.log('   Has fees?', content.includes('$79') ? '✅ YES' : '❌ NO');
    } else {
      console.log('❌ Not found');
    }

    // Test 2: Semantic search for "business licence fees"
    console.log('\n📋 TEST 2: Semantic search - "business licence fees cost"');
    console.log('─'.repeat(80));
    const semanticResults = await documentCollection.query.nearText(
      'business licence fees cost how much',
      {
        limit: 3,
        returnMetadata: ['distance'],
      }
    );
    
    console.log(`Found ${semanticResults.objects.length} results:`);
    semanticResults.objects.forEach((obj, i) => {
      const props = obj.properties as any;
      const meta = obj.metadata as any;
      console.log(`  ${i + 1}. ${props.title} (distance: ${meta.distance?.toFixed(4)})`);
    });

    // Test 3: Hybrid search for "business licence cost"
    console.log('\n📋 TEST 3: Hybrid search (70% semantic, 30% keyword)');
    console.log('─'.repeat(80));
    const hybridResults = await documentCollection.query.hybrid(
      'business licence cost fees',
      {
        limit: 3,
        alpha: 0.7,
        returnMetadata: ['score'],
      }
    );
    
    console.log(`Found ${hybridResults.objects.length} results:`);
    hybridResults.objects.forEach((obj, i) => {
      const props = obj.properties as any;
      const meta = obj.metadata as any;
      console.log(`  ${i + 1}. ${props.title} (score: ${meta.score?.toFixed(4)})`);
    });

    // Test 4: Keyword search for "business licence"
    console.log('\n📋 TEST 4: BM25 keyword search - "business licence"');
    console.log('─'.repeat(80));
    const keywordResults = await documentCollection.query.bm25(
      'business licence',
      {
        limit: 3,
        returnMetadata: ['score'],
      }
    );
    
    console.log(`Found ${keywordResults.objects.length} results:`);
    keywordResults.objects.forEach((obj, i) => {
      const props = obj.properties as any;
      const meta = obj.metadata as any;
      console.log(`  ${i + 1}. ${props.title} (score: ${meta.score?.toFixed(4)})`);
      console.log(`      Type: ${props.documentType}, Category: ${props.category}`);
    });

    // Test 5: Check if bylaws have vectors
    console.log('\n📋 TEST 5: Checking vectorization status');
    console.log('─'.repeat(80));
    const bylawSample = await documentCollection.query.fetchObjects({
      filters: documentCollection.filter.byProperty('documentType').equal('bylaw'),
      limit: 3,
      includeVector: true,
    });
    
    console.log(`Checking ${bylawSample.objects.length} bylaw samples:`);
    bylawSample.objects.forEach((obj) => {
      const props = obj.properties as any;
      const hasVector = obj.vectors && Object.keys(obj.vectors).length > 0;
      console.log(`  • ${props.title?.substring(0, 50)}`);
      console.log(`    Vector: ${hasVector ? '✅ EXISTS' : '❌ MISSING'}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('✅ SEARCH TESTS COMPLETE\n');

    await client.close();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBylawSearch();

