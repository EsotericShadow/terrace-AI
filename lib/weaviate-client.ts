// lib/weaviate-client.ts
import weaviate, { WeaviateClient } from 'weaviate-client';

let client: WeaviateClient | null = null;

export async function getWeaviateClient(): Promise<WeaviateClient> {
  if (client) {
    return client;
  }

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey) {
    throw new Error('Missing Weaviate credentials in environment variables');
  }

  try {
    client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
      authCredentials: new weaviate.ApiKey(weaviateApiKey),
      timeout: { 
        init: 30, 
        query: 60, 
        insert: 120 
      }
    });

    console.log('✅ Connected to Weaviate Cloud');
    return client;
  } catch (error) {
    console.error('❌ Failed to connect to Weaviate:', error);
    throw error;
  }
}

export async function closeWeaviateClient() {
  if (client) {
    await client.close();
    client = null;
    console.log('✅ Weaviate connection closed');
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const weaviate = await getWeaviateClient();
    const isReady = await weaviate.isReady();
    console.log('Weaviate ready:', isReady);
    return isReady;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

