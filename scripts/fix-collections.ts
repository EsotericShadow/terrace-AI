import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

/**
 * Fix metadata collections by deleting and recreating with proper vectorizer config
 */

async function fixCollections() {
  console.log('🔧 Fixing Metadata Collections\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: { 'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY! },
    }
  );

  console.log('✅ Connected to Weaviate\n');

  // Delete old collections if they exist
  try {
    console.log('Checking for existing metadata collections...');
    const collections = await client.collections.listAll();
    
    const hasBylawMeta = collections.some((c: any) => c.name === 'BylawMetadata');
    const hasBusinessOnt = collections.some((c: any) => c.name === 'BusinessOntology');

    if (hasBylawMeta) {
      console.log('Deleting old BylawMetadata collection...');
      await client.collections.delete('BylawMetadata');
      console.log('✅ Deleted\n');
    }

    if (hasBusinessOnt) {
      console.log('Deleting old BusinessOntology collection...');
      await client.collections.delete('BusinessOntology');
      console.log('✅ Deleted\n');
    }
  } catch (error: any) {
    console.log(`Note: ${error.message}\n`);
  }

  // Create BylawMetadata with proper config
  console.log('Creating BylawMetadata collection with proper vectorizer...');
  await client.collections.create({
    name: 'BylawMetadata',
    description: 'Four-layer metadata system for Terrace bylaws',
    vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    }),
    properties: [
      {
        name: 'layer',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Which layer: meta, ontology, temporal, narrative'
      },
      {
        name: 'bylawNumber',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Bylaw number this metadata relates to'
      },
      {
        name: 'category',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Regulatory category'
      },
      {
        name: 'content',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Full metadata content (JSON stringified)'
      },
      {
        name: 'summary',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Human-readable summary',
        vectorizePropertyName: false
      },
      {
        name: 'metadata',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Additional structured metadata',
        skipVectorization: true
      }
    ]
  });
  console.log('✅ BylawMetadata created\n');

  // Create BusinessOntology with proper config
  console.log('Creating BusinessOntology collection with proper vectorizer...');
  await client.collections.create({
    name: 'BusinessOntology',
    description: 'Business category ontology and narrative layers for Terrace',
    vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    }),
    properties: [
      {
        name: 'category',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Business category (e.g., automotive)'
      },
      {
        name: 'subcategory',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Business subcategory (e.g., auto_repair)'
      },
      {
        name: 'layer',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Layer type: meta, ontology, narrative'
      },
      {
        name: 'content',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Full content (JSON or markdown)'
      },
      {
        name: 'summary',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Summary of this category',
        vectorizePropertyName: false
      },
      {
        name: 'relationships',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Related categories and dependencies',
        skipVectorization: true
      },
      {
        name: 'culturalContext',
        dataType: weaviate.configure.dataType.TEXT,
        description: 'Local Terrace context and insights',
        vectorizePropertyName: false
      }
    ]
  });
  console.log('✅ BusinessOntology created\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Collections fixed and ready!');
  console.log('');
  console.log('Next step: Run npm run metadata:merge to re-upload data');

  await client.close();
}

fixCollections().catch(console.error);

