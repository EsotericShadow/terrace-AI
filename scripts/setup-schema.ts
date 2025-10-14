// scripts/setup-schema.ts
// Run with: npx tsx scripts/setup-schema.ts

import weaviate from 'weaviate-client';

async function setupSchema() {
  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey) {
    console.error('❌ Missing environment variables');
    console.error('Required: WEAVIATE_URL, WEAVIATE_API_KEY');
    process.exit(1);
  }

  console.log('🔗 Connecting to Weaviate...');
  
  const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
  });

  console.log('✅ Connected!');
  console.log('\n📋 Creating schema...\n');

  try {
    // 1. Business Collection
    console.log('Creating Business collection...');
    await client.collections.create({
      name: 'Business',
      vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
      }),
      properties: [
        { name: 'businessName', dataType: weaviate.configure.dataType.TEXT },
        { name: 'category', dataType: weaviate.configure.dataType.TEXT },
        { name: 'subcategory', dataType: weaviate.configure.dataType.TEXT },
        { name: 'address', dataType: weaviate.configure.dataType.TEXT },
        { name: 'city', dataType: weaviate.configure.dataType.TEXT },
        { name: 'postalCode', dataType: weaviate.configure.dataType.TEXT },
        { name: 'description', dataType: weaviate.configure.dataType.TEXT },
        { name: 'phone', dataType: weaviate.configure.dataType.TEXT },
        { name: 'email', dataType: weaviate.configure.dataType.TEXT },
        { name: 'website', dataType: weaviate.configure.dataType.TEXT },
        { name: 'claimed', dataType: weaviate.configure.dataType.BOOLEAN },
        { name: 'verified', dataType: weaviate.configure.dataType.BOOLEAN },
      ],
    });
    console.log('✅ Business collection created');

    // 2. Document Collection
    console.log('Creating Document collection...');
    await client.collections.create({
      name: 'Document',
      vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
      }),
      properties: [
        { name: 'title', dataType: weaviate.configure.dataType.TEXT },
        { name: 'content', dataType: weaviate.configure.dataType.TEXT },
        { name: 'documentType', dataType: weaviate.configure.dataType.TEXT },
        { name: 'category', dataType: weaviate.configure.dataType.TEXT },
        { name: 'subcategory', dataType: weaviate.configure.dataType.TEXT },
        { name: 'sourceFile', dataType: weaviate.configure.dataType.TEXT },
        { name: 'pageNumber', dataType: weaviate.configure.dataType.INT },
        { name: 'extractedAt', dataType: weaviate.configure.dataType.TEXT },
      ],
    });
    console.log('✅ Document collection created');

    // 3. Municipal Services Collection (for future)
    console.log('Creating MunicipalService collection...');
    await client.collections.create({
      name: 'MunicipalService',
      vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
      }),
      properties: [
        { name: 'serviceName', dataType: weaviate.configure.dataType.TEXT },
        { name: 'department', dataType: weaviate.configure.dataType.TEXT },
        { name: 'description', dataType: weaviate.configure.dataType.TEXT },
        { name: 'location', dataType: weaviate.configure.dataType.TEXT },
        { name: 'phone', dataType: weaviate.configure.dataType.TEXT },
        { name: 'email', dataType: weaviate.configure.dataType.TEXT },
        { name: 'hours', dataType: weaviate.configure.dataType.TEXT },
      ],
    });
    console.log('✅ MunicipalService collection created');

    console.log('\n🎉 Schema setup complete!');
    console.log('\nNext steps:');
    console.log('1. Run: npx tsx scripts/upload-businesses.ts');
    console.log('2. Run: npx tsx scripts/upload-documents.ts');

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Collections already exist. Skipping creation.');
    } else {
      console.error('❌ Error creating schema:', error);
      throw error;
    }
  } finally {
    await client.close();
  }
}

setupSchema().catch(console.error);

