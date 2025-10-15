import weaviate from 'weaviate-ts-client';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_URL || 'vjtpz5ayrw6svs42bsaa0w.c0.us-west3.gcp.weaviate.cloud',
  headers: {
    'X-HuggingFace-Api-Key': process.env.HUGGINGFACE_API_KEY || '',
  },
});

async function checkBusinessLicence() {
  try {
    console.log('🔍 Checking Business Licence Bylaw in Weaviate...\n');
    
    const result = await client.graphql
      .get()
      .withClassName('Document')
      .withFields('title fullContent sourceFile')
      .withWhere({
        operator: 'And',
        operands: [
          {
            path: ['documentType'],
            operator: 'Equal',
            valueText: 'bylaw'
          },
          {
            path: ['title'],
            operator: 'Like',
            valueText: '*Business Licence*'
          }
        ]
      })
      .withLimit(1)
      .do();

    if (!result.data?.Get?.Document || result.data.Get.Document.length === 0) {
      console.log('❌ Business Licence Bylaw NOT FOUND in Weaviate');
      return;
    }

    const doc = result.data.Get.Document[0];
    console.log('✅ Found:', doc.title);
    console.log('📄 Source:', doc.sourceFile);
    console.log('\n📊 Full Content Length:', doc.fullContent.length, 'characters');
    console.log('\n🔍 Contains "Table 1"?', doc.fullContent.includes('Table 1') ? '✅ YES' : '❌ NO');
    console.log('🔍 Contains "Schedule A"?', doc.fullContent.includes('Schedule A') ? '✅ YES' : '❌ NO');
    console.log('🔍 Contains "$79"?', doc.fullContent.includes('$79') ? '✅ YES' : '❌ NO');
    console.log('🔍 Contains "annual licence fee"?', doc.fullContent.toLowerCase().includes('annual licence fee') ? '✅ YES' : '❌ NO');
    
    // Show first 2000 chars
    console.log('\n📝 First 2000 characters of fullContent:');
    console.log('═'.repeat(80));
    console.log(doc.fullContent.substring(0, 2000));
    console.log('═'.repeat(80));
    
    // Search for fee-related content
    const feeMatches = doc.fullContent.match(/\$\d+\.?\d*/g);
    if (feeMatches && feeMatches.length > 0) {
      console.log('\n💰 Fee amounts found:', feeMatches.slice(0, 20).join(', '));
    } else {
      console.log('\n❌ NO dollar amounts found in fullContent');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkBusinessLicence();

