import weaviate, { WeaviateClient } from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function checkAllData() {
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
    console.log('📊 CHECKING ALL WEAVIATE DATA\n');
    console.log('═'.repeat(80));
    
    // Check Document collection
    console.log('\n🗂️  DOCUMENT COLLECTION');
    console.log('─'.repeat(80));
    const documentCollection = client.collections.get('Document');
    const allDocs = await documentCollection.query.fetchObjects({ limit: 500 });
    
    const bylaws = allDocs.objects.filter(o => {
      const props = o.properties as any;
      return props.documentType === 'bylaw';
    });
    
    const businesses = allDocs.objects.filter(o => {
      const props = o.properties as any;
      return props.documentType !== 'bylaw';
    });
    
    console.log(`Total Documents: ${allDocs.objects.length}`);
    console.log(`  📜 Bylaws: ${bylaws.length}`);
    console.log(`  📄 Other: ${businesses.length}`);
    
    // Sample a bylaw to check if schedules are included
    const businessLicence = bylaws.find(b => {
      const props = b.properties as any;
      return props.title?.includes('Business Licence');
    });
    
    if (businessLicence) {
      const props = businessLicence.properties as any;
      console.log('\n  🔍 Business Licence Bylaw Check:');
      console.log(`     Title: ${props.title}`);
      console.log(`     Content Length: ${props.fullContent?.length || props.content?.length || 0} chars`);
      const content = props.fullContent || props.content || '';
      console.log(`     Contains "Schedule A"? ${content.includes('Schedule A') ? '✅' : '❌'}`);
      console.log(`     Contains "$79"? ${content.includes('$79') ? '✅' : '❌'}`);
      console.log(`     Contains "Table 1"? ${content.includes('Table 1') ? '✅' : '❌'}`);
    }

    // Check BylawMetadata collection
    console.log('\n📚 BYLAWMETADATA COLLECTION');
    console.log('─'.repeat(80));
    try {
      const bylawMetaCollection = client.collections.get('BylawMetadata');
      const metaObjects = await bylawMetaCollection.query.fetchObjects({ limit: 50 });
      console.log(`Total BylawMetadata objects: ${metaObjects.objects.length}`);
      
      if (metaObjects.objects.length > 0) {
        const metaTypes: any = {};
        metaObjects.objects.forEach(o => {
          const props = o.properties as any;
          const type = props.type || 'unknown';
          metaTypes[type] = (metaTypes[type] || 0) + 1;
        });
        console.log('  Breakdown by type:');
        Object.entries(metaTypes).forEach(([type, count]) => {
          console.log(`    - ${type}: ${count}`);
        });
      }
    } catch (error: any) {
      console.log('  ❌ BylawMetadata collection not found or empty');
    }

    // Check BusinessOntology collection
    console.log('\n🏢 BUSINESSONTOLOGY COLLECTION');
    console.log('─'.repeat(80));
    try {
      const bizOntologyCollection = client.collections.get('BusinessOntology');
      const ontObjects = await bizOntologyCollection.query.fetchObjects({ limit: 50 });
      console.log(`Total BusinessOntology objects: ${ontObjects.objects.length}`);
      
      if (ontObjects.objects.length > 0) {
        const ontCategories: any = {};
        ontObjects.objects.forEach(o => {
          const props = o.properties as any;
          const category = props.category || 'unknown';
          ontCategories[category] = (ontCategories[category] || 0) + 1;
        });
        console.log('  Breakdown by category:');
        Object.entries(ontCategories).forEach(([cat, count]) => {
          console.log(`    - ${cat}: ${count}`);
        });
      }
    } catch (error: any) {
      console.log('  ❌ BusinessOntology collection not found or empty');
    }

    // Check Business collection
    console.log('\n🏪 BUSINESS COLLECTION');
    console.log('─'.repeat(80));
    try {
      const businessCollection = client.collections.get('Business');
      const bizObjects = await businessCollection.query.fetchObjects({ limit: 2000 });
      console.log(`Total Business objects: ${bizObjects.objects.length}`);
    } catch (error: any) {
      console.log('  ❌ Business collection not found or error:', error.message);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('✅ DATA CHECK COMPLETE\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAllData();

