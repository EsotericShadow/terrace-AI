// Delete duplicate objects from Weaviate
import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function deleteDuplicates() {
  console.log('🗑️  Removing Duplicate Objects from Weaviate\n');

  const client = await weaviate.connectToWeaviateCloud(
    process.env.WEAVIATE_URL!,
    {
      authCredentials: new weaviate.ApiKey(process.env.WEAVIATE_API_KEY!),
      headers: {
        'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY!,
      },
    }
  );

  console.log('✅ Connected!\n');

  // Get current counts
  const businessCollection = client.collections.get('Business');
  const documentCollection = client.collections.get('Document');

  const businessAggregate = await businessCollection.aggregate.overAll();
  const documentAggregate = await documentCollection.aggregate.overAll();

  console.log('📊 Current counts:');
  console.log(`  Business: ${businessAggregate.totalCount}`);
  console.log(`  Document: ${documentAggregate.totalCount}`);
  console.log(`  Total: ${businessAggregate.totalCount + documentAggregate.totalCount}\n`);

  console.log('⚠️  Deleting ALL collections to remove duplicates...\n');

  // Delete collections
  await client.collections.delete('Business');
  console.log('✅ Business collection deleted');

  await client.collections.delete('Document');
  console.log('✅ Document collection deleted');

  console.log('\n✅ All data cleared!');
  console.log('\nNext step: Run npm run weaviate:upload-terrace to re-upload clean data');

  await client.close();
}

deleteDuplicates().catch(console.error);

