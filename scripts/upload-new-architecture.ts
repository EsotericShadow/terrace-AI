import weaviate from 'weaviate-client';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

/**
 * COMPLETE WEAVIATE DATA REPLACEMENT - NEW TERRACE_KNOWLEDGE ARCHITECTURE
 * 
 * This script:
 * 1. DELETES all existing Weaviate collections (clean slate)
 * 2. Creates NEW collections matching TERRACE_KNOWLEDGE structure
 * 3. Uploads ALL data from consolidated TERRACE_KNOWLEDGE/ directory
 * 4. Uses proven HuggingFace vectorization method
 * 
 * NEW ARCHITECTURE:
 * - TerraceBusiness: All business data (2_BUSINESS_ECONOMY/)
 * - TerraceDocument: All documents (bylaws, culture, education, POI, infrastructure, environment)
 * - TerraceMetadata: All metadata layers (META, ONTOLOGY, TEMPORAL, MASTER_INDEX, NARRATIVE)
 */

interface BylawSection {
  section_number?: string;
  title?: string;
  content?: any;
  schedule?: string;
  description?: string;
}

async function uploadNewArchitecture() {
  console.log('🔄 COMPLETE WEAVIATE DATA REPLACEMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('⚠️  WARNING: This will DELETE all existing Weaviate data!');
  console.log('   Press Ctrl+C within 5 seconds to cancel...\n');
  
  await new Promise(resolve => setTimeout(resolve, 5000));

  const weaviateUrl = process.env.WEAVIATE_URL;
  const weaviateApiKey = process.env.WEAVIATE_API_KEY;
  const huggingfaceApiKey = process.env.HUGGINGFACE_API_KEY;

  if (!weaviateUrl || !weaviateApiKey || !huggingfaceApiKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  console.log('🔗 Connecting to Weaviate...');
  const client = await weaviate.connectToWeaviateCloud(weaviateUrl, {
    authCredentials: new weaviate.ApiKey(weaviateApiKey),
    headers: {
      'X-HuggingFace-Api-Key': huggingfaceApiKey,
    },
    timeout: { init: 30, query: 120, insert: 300 }
  });

  console.log('✅ Connected!\n');

  // ============================================================================
  // PHASE 1: DELETE ALL EXISTING COLLECTIONS
  // ============================================================================

  console.log('🗑️  PHASE 1: Deleting All Existing Collections');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const existingCollections = await client.collections.listAll();
    console.log(`Found ${existingCollections.length} existing collections\n`);

    for (const collection of existingCollections) {
      console.log(`  Deleting: ${collection.name}...`);
      await client.collections.delete(collection.name);
    }

    console.log('\n✅ All existing collections deleted\n');
  } catch (error: any) {
    console.log(`⚠️  Error deleting collections: ${error.message}\n`);
  }

  // Wait for deletion to propagate
  console.log('⏳ Waiting 3 seconds for deletion to propagate...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // ============================================================================
  // PHASE 2: CREATE NEW COLLECTIONS
  // ============================================================================

  console.log('📦 PHASE 2: Creating New Collection Schema');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Create TerraceBusiness collection
  console.log('Creating TerraceBusiness collection...');
  try {
    await client.collections.create({
      name: 'TerraceBusiness',
      description: 'All businesses in Terrace with complete metadata',
      vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
        model: 'sentence-transformers/all-MiniLM-L6-v2'
      }),
      properties: [
      { name: 'businessName', dataType: weaviate.configure.dataType.TEXT, description: 'Business name' },
      { name: 'category', dataType: weaviate.configure.dataType.TEXT, description: 'Main category (e.g., automotive, restaurants_food)' },
      { name: 'subcategory', dataType: weaviate.configure.dataType.TEXT, description: 'Subcategory (e.g., auto_repair, restaurants)' },
      { name: 'address', dataType: weaviate.configure.dataType.TEXT, description: 'Business address' },
      { name: 'phone', dataType: weaviate.configure.dataType.TEXT, description: 'Phone number' },
      { name: 'website', dataType: weaviate.configure.dataType.TEXT, description: 'Website URL' },
      { name: 'description', dataType: weaviate.configure.dataType.TEXT, description: 'Business description' },
      { name: 'businessType', dataType: weaviate.configure.dataType.TEXT, description: 'Type of business' },
      { name: 'city', dataType: weaviate.configure.dataType.TEXT, description: 'City (Terrace, Thornhill, etc.)' },
      { name: 'province', dataType: weaviate.configure.dataType.TEXT, description: 'Province (BC)' },
      { name: 'postalCode', dataType: weaviate.configure.dataType.TEXT, description: 'Postal code' },
      { name: 'email', dataType: weaviate.configure.dataType.TEXT, description: 'Email address' },
      { name: 'verified', dataType: weaviate.configure.dataType.BOOLEAN, description: 'Verified business' },
      { name: 'sourceFile', dataType: weaviate.configure.dataType.TEXT, description: 'Source data file' },
      { name: 'metadata', dataType: weaviate.configure.dataType.TEXT, description: 'Additional metadata as JSON' }
    ]
    });
    console.log('✅ TerraceBusiness collection created\n');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  TerraceBusiness collection already exists, continuing...\n');
    } else {
      throw error;
    }
  }

  // Create TerraceDocument collection
  console.log('Creating TerraceDocument collection...');
  try {
    await client.collections.create({
    name: 'TerraceDocument',
    description: 'All documents: bylaws, cultural sites, education, POI, infrastructure, environment',
    vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    }),
    properties: [
      { name: 'title', dataType: weaviate.configure.dataType.TEXT, description: 'Document title' },
      { name: 'content', dataType: weaviate.configure.dataType.TEXT, description: 'Full document content' },
      { name: 'documentType', dataType: weaviate.configure.dataType.TEXT, description: 'Type: bylaw, cultural_site, education, poi, infrastructure, environment' },
      { name: 'domain', dataType: weaviate.configure.dataType.TEXT, description: 'Domain: 1_BYLAWS, 3_CULTURE_COMMUNITY, etc.' },
      { name: 'category', dataType: weaviate.configure.dataType.TEXT, description: 'Category within domain' },
      { name: 'subcategory', dataType: weaviate.configure.dataType.TEXT, description: 'Subcategory' },
      { name: 'summary', dataType: weaviate.configure.dataType.TEXT, description: 'Brief summary' },
      { name: 'sourceFile', dataType: weaviate.configure.dataType.TEXT, description: 'Source file path' },
      { name: 'documentUrl', dataType: weaviate.configure.dataType.TEXT, description: 'Official URL if available' },
      { name: 'contactInfo', dataType: weaviate.configure.dataType.TEXT, description: 'Contact information (JSON)' },
      { name: 'location', dataType: weaviate.configure.dataType.TEXT, description: 'Physical location/address' },
      { name: 'metadata', dataType: weaviate.configure.dataType.TEXT, description: 'Full metadata as JSON' },
      { name: 'extractedAt', dataType: weaviate.configure.dataType.DATE, description: 'Extraction/upload date' }
    ]
    });
    console.log('✅ TerraceDocument collection created\n');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  TerraceDocument collection already exists, continuing...\n');
    } else {
      throw error;
    }
  }

  // Create TerraceMetadata collection
  console.log('Creating TerraceMetadata collection...');
  try {
    await client.collections.create({
    name: 'TerraceMetadata',
    description: 'All metadata layers: META, ONTOLOGY, TEMPORAL, MASTER_INDEX, NARRATIVE for each domain',
    vectorizers: weaviate.configure.vectorizer.text2VecHuggingFace({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    }),
    properties: [
      { name: 'domain', dataType: weaviate.configure.dataType.TEXT, description: 'Domain: 1_BYLAWS, 2_BUSINESS_ECONOMY, 3_CULTURE_COMMUNITY, etc.' },
      { name: 'layer', dataType: weaviate.configure.dataType.TEXT, description: 'Layer type: META, ONTOLOGY, TEMPORAL, MASTER_INDEX, NARRATIVE' },
      { name: 'category', dataType: weaviate.configure.dataType.TEXT, description: 'Category (for business metadata)' },
      { name: 'subcategory', dataType: weaviate.configure.dataType.TEXT, description: 'Subcategory (for business metadata)' },
      { name: 'content', dataType: weaviate.configure.dataType.TEXT, description: 'Full metadata content (JSON or markdown)' },
      { name: 'summary', dataType: weaviate.configure.dataType.TEXT, description: 'Summary of this metadata' },
      { name: 'sourceFile', dataType: weaviate.configure.dataType.TEXT, description: 'Source file path' }
    ]
    });
    console.log('✅ TerraceMetadata collection created\n');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  TerraceMetadata collection already exists, continuing...\n');
    } else {
      throw error;
    }
  }

  const terraceKnowledgeDir = resolve(__dirname, '../../TERRACE_KNOWLEDGE');

  // ============================================================================
  // PHASE 3: UPLOAD BUSINESSES (2_BUSINESS_ECONOMY)
  // ============================================================================

  console.log('🏢 PHASE 3: Uploading Businesses');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const businessCollection = client.collections.get('TerraceBusiness');
  const businessDir = resolve(terraceKnowledgeDir, '2_BUSINESS_ECONOMY');
  
  let totalBusinesses = 0;
  const categories = readdirSync(businessDir).filter(name => {
    const fullPath = resolve(businessDir, name);
    try {
      return statSync(fullPath).isDirectory() && !name.startsWith('_');
    } catch {
      return false;
    }
  });

  console.log(`Found ${categories.length} business categories\n`);

  for (const category of categories) {
    const categoryPath = resolve(businessDir, category);
    const subcategories = readdirSync(categoryPath).filter(name => {
      const fullPath = resolve(categoryPath, name);
      try {
        return statSync(fullPath).isDirectory() && !name.startsWith('_');
      } catch {
        return false;
      }
    });

    for (const subcategory of subcategories) {
      const subcategoryPath = resolve(categoryPath, subcategory);
      
      // Business data is in individual business folders, not a single file
      const businessFolders = readdirSync(subcategoryPath).filter(name => {
        const fullPath = resolve(subcategoryPath, name);
        try {
          return statSync(fullPath).isDirectory() && !name.startsWith('_');
        } catch {
          return false;
        }
      });

      for (const businessFolder of businessFolders) {
        const businessPath = resolve(subcategoryPath, businessFolder);
        const dataFilePath = resolve(businessPath, 'business_data.json');

        try {
          if (statSync(dataFilePath).isFile()) {
            const businessData = JSON.parse(readFileSync(dataFilePath, 'utf-8'));
            
            // Handle address (two formats)
            let address = '';
            if (typeof businessData.address === 'object' && businessData.address !== null) {
              // Format: { street, city, postal_code }
              const addr = businessData.address;
              address = `${addr.street || ''}, ${addr.city || 'Terrace'}, BC ${addr.postal_code || ''}`.trim();
            } else if (typeof businessData.address === 'string') {
              address = businessData.address;
            } else if (businessData.google_address) {
              address = businessData.google_address;
            }
            
            // Handle phone (multiple possible fields)
            const phone = businessData.phone || businessData.google_phone || businessData.primary_phone || '';
            
            // FILTER: Skip businesses outside Terrace area
            const isTerraceArea = !address || 
              address.toLowerCase().includes('terrace') || 
              address.toLowerCase().includes('thornhill') ||
              address.toLowerCase().includes('kitimat') ||
              businessData.city?.toLowerCase() === 'terrace';
            
            if (!isTerraceArea) {
              console.log(`  ⏭️  Skipping ${businessData.business_name} - Outside Terrace area (${address})`);
              continue;
            }
            
            await businessCollection.data.insert({
              businessName: businessData.business_name || businessData.name || businessFolder,
              category: category,
              subcategory: subcategory,
              address: address || 'Address not available',
              phone: phone || 'Phone not available',
              website: businessData.website || businessData.google_official_website || businessData.website_found || '',
              description: businessData.description || businessData.business_description || '',
              businessType: businessData.business_type || businessData.category || subcategory,
              city: businessData.city || 'Terrace',
              province: 'BC',
              postalCode: (typeof businessData.address === 'object' ? businessData.address?.postal_code : '') || businessData.postal_code || '',
              email: businessData.email || '',
              verified: businessData.verified || false,
              sourceFile: `${category}/${subcategory}/${businessFolder}/business_data.json`,
              metadata: JSON.stringify(businessData)
            });
            totalBusinesses++;
            
            if (totalBusinesses % 100 === 0) {
              console.log(`  Uploaded ${totalBusinesses} businesses...`);
            }
          }
        } catch (e) {
          // File doesn't exist or error, skip
        }
      }
    }
  }

  console.log(`✅ Uploaded ${totalBusinesses} businesses\n`);

  // ============================================================================
  // PHASE 4: UPLOAD BYLAWS (1_BYLAWS)
  // ============================================================================

  console.log('📜 PHASE 4: Uploading Bylaws');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const documentCollection = client.collections.get('TerraceDocument');
  const bylawsDir = resolve(terraceKnowledgeDir, '1_BYLAWS');
  
  const bylawFolders = readdirSync(bylawsDir).filter(name => {
    const fullPath = resolve(bylawsDir, name);
    try {
      return statSync(fullPath).isDirectory() && /^\d/.test(name);
    } catch {
      return false;
    }
  });

  console.log(`Found ${bylawFolders.length} bylaw folders\n`);

  let totalBylaws = 0;
  for (const folder of bylawFolders) {
    const folderPath = resolve(bylawsDir, folder);
    const metaPath = resolve(folderPath, 'meta.json');

    try {
      const meta = JSON.parse(readFileSync(metaPath, 'utf-8'));
      
      // Build full content from sections and schedules
      const sectionFiles = readdirSync(folderPath).filter(f => 
        (f.startsWith('section_') || f.startsWith('schedule_')) && f.endsWith('.json')
      );

      let fullContent = meta.description ? `${meta.description}\n\n` : '';

      for (const sectionFile of sectionFiles.sort()) {
        try {
          const sectionData: BylawSection = JSON.parse(readFileSync(resolve(folderPath, sectionFile), 'utf-8'));
          
          if (sectionFile.startsWith('schedule_')) {
            fullContent += `Schedule ${sectionData.schedule || ''}: ${sectionData.title || ''}\n`;
            if (sectionData.description) fullContent += `${sectionData.description}\n\n`;
            fullContent += JSON.stringify(sectionData, null, 2) + '\n\n';
          } else {
            fullContent += `Section ${sectionData.section_number || ''}: ${sectionData.title || ''}\n`;
            if (typeof sectionData.content === 'object') {
              fullContent += JSON.stringify(sectionData.content, null, 2) + '\n\n';
            } else if (typeof sectionData.content === 'string') {
              fullContent += sectionData.content + '\n\n';
            }
          }
        } catch (e) {}
      }

      await documentCollection.data.insert({
        title: meta.title || meta.bylaw_name || folder,
        content: fullContent || meta.description || 'Bylaw document',
        documentType: 'bylaw',
        domain: '1_BYLAWS',
        category: 'bylaws',
        subcategory: 'municipal_bylaws',
        summary: meta.description || '',
        sourceFile: folder,
        documentUrl: meta.document_url || meta.url || '',
        contactInfo: '',
        location: '',
        metadata: JSON.stringify(meta),
        extractedAt: new Date()
      });

      totalBylaws++;
      if (totalBylaws % 10 === 0) {
        console.log(`  Uploaded ${totalBylaws} bylaws...`);
      }
    } catch (error) {
      // Skip this bylaw
    }
  }

  console.log(`\n✅ Uploaded ${totalBylaws} bylaws\n`);

  // ============================================================================
  // PHASE 5: UPLOAD OTHER DOCUMENTS (Culture, Education, POI, Infrastructure, Environment)
  // ============================================================================

  console.log('📄 PHASE 5: Uploading Other Documents');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const domainConfigs = [
    { domain: '3_CULTURE_COMMUNITY', type: 'cultural_site' },
    { domain: '4_EDUCATION', type: 'education' },
    { domain: '5_ENVIRONMENT_GEOGRAPHY', type: 'environment' },
    { domain: '6_INFRASTRUCTURE', type: 'infrastructure' },
    { domain: '7_POINTS_OF_INTEREST', type: 'poi' }
  ];

  let totalOtherDocs = 0;
  
  for (const { domain, type } of domainConfigs) {
    const domainPath = resolve(terraceKnowledgeDir, domain);
    
    try {
      const processDirectory = async (dirPath: string, relPath = ''): Promise<void> => {
        const items = readdirSync(dirPath);
        
        for (const item of items) {
          const itemPath = resolve(dirPath, item);
          const stat = statSync(itemPath);
          
          if (stat.isDirectory() && !item.startsWith('_') && item !== 'consolidated_data') {
            await processDirectory(itemPath, `${relPath}/${item}`);
          } else if (stat.isFile() && item.endsWith('.json') && !item.includes('_LAYER') && !item.includes('INDEX')) {
            try {
              const data = JSON.parse(readFileSync(itemPath, 'utf-8'));
              
              // Extract relevant fields (flexible structure)
              const title = data.name || data.title || data.institution_info?.name || data.heritage_info?.name || item.replace('.json', '');
              const description = data.description || data.institution_info?.description || data.heritage_info?.description || '';
              const category = data.category || data.metadata?.category || '';
              const contactsData = data.contacts || data.institution_info?.contacts || data.heritage_info?.contacts || {};
              const location = data.address || contactsData?.address || data.location || '';
              
              await documentCollection.data.insert({
                title: title,
                content: JSON.stringify(data, null, 2),
                documentType: type,
                domain: domain,
                category: category,
                subcategory: '',
                summary: description,
                sourceFile: `${domain}${relPath}/${item}`,
                documentUrl: data.website || data.institution_info?.website || data.heritage_info?.website || contactsData?.website || '',
                contactInfo: JSON.stringify(contactsData),
                location: location,
                metadata: JSON.stringify(data),
                extractedAt: new Date()
              });
              
              totalOtherDocs++;
            } catch (e) {}
          }
        }
      };
      
      await processDirectory(domainPath);
    } catch (e) {}
  }

  console.log(`✅ Uploaded ${totalOtherDocs} other documents\n`);

  // ============================================================================
  // PHASE 6: UPLOAD ALL METADATA LAYERS
  // ============================================================================

  console.log('🔬 PHASE 6: Uploading Metadata Layers');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const metadataCollection = client.collections.get('TerraceMetadata');
  let totalMetadata = 0;

  // Upload domain-level metadata layers
  const allDomains = [
    '1_BYLAWS',
    '2_BUSINESS_ECONOMY',
    '3_CULTURE_COMMUNITY',
    '4_EDUCATION',
    '5_ENVIRONMENT_GEOGRAPHY',
    '6_INFRASTRUCTURE',
    '7_POINTS_OF_INTEREST'
  ];

  for (const domain of allDomains) {
    const domainPath = resolve(terraceKnowledgeDir, domain);
    
    // Check for domain-level metadata files
    const metadataFiles = [
      { file: 'META_LAYER.json', layer: 'META' },
      { file: 'ONTOLOGY_LAYER.json', layer: 'ONTOLOGY' },
      { file: 'TEMPORAL_LAYER.json', layer: 'TEMPORAL' },
      { file: 'NARRATIVE_LAYER.json', layer: 'NARRATIVE' },
      { file: 'MASTER_INDEX.json', layer: 'MASTER_INDEX' }
    ];

    for (const { file, layer } of metadataFiles) {
      try {
        const filePath = resolve(domainPath, file);
        const content = readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(content);
        
        await metadataCollection.data.insert({
          domain: domain,
          layer: layer,
          category: '',
          subcategory: '',
          content: content,
          summary: parsed.overview?.description || parsed.description || parsed.domain || `${layer} for ${domain}`,
          sourceFile: `${domain}/${file}`
        });
        
        totalMetadata++;
      } catch (e) {
        // File doesn't exist, skip
      }
    }
  }

  // Upload business metadata (category/subcategory level)
  const businessMetaDir = resolve(terraceKnowledgeDir, '2_BUSINESS_ECONOMY');
  
  const processBusinessMetadata = async (dirPath: string, category = '', subcategory = ''): Promise<void> => {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = resolve(dirPath, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('_')) {
        if (!category) {
          await processBusinessMetadata(itemPath, item, '');
        } else if (!subcategory) {
          await processBusinessMetadata(itemPath, category, item);
        }
      } else if (stat.isFile() && item.startsWith('_')) {
        try {
          let content = readFileSync(itemPath, 'utf-8');
          let layer = '';
          
          if (item.includes('_meta')) layer = 'META';
          else if (item.includes('_ontology')) layer = 'ONTOLOGY';
          else if (item.includes('_narrative')) layer = 'NARRATIVE';
          
          if (layer) {
            await metadataCollection.data.insert({
              domain: '2_BUSINESS_ECONOMY',
              layer: layer,
              category: category || '',
              subcategory: subcategory || '',
              content: content,
              summary: `${layer} layer for ${category}${subcategory ? '/' + subcategory : ''}`,
              sourceFile: `2_BUSINESS_ECONOMY/${category}${subcategory ? '/' + subcategory : ''}/${item}`
            });
            
            totalMetadata++;
          }
        } catch (e) {}
      }
    }
  };

  await processBusinessMetadata(businessMetaDir);

  // Upload top-level metadata files
  try {
    const ontologyMasterPath = resolve(terraceKnowledgeDir, 'ONTOLOGY_MASTER.json');
    const content = readFileSync(ontologyMasterPath, 'utf-8');
    const parsed = JSON.parse(content);
    
    await metadataCollection.data.insert({
      domain: 'ALL',
      layer: 'ONTOLOGY',
      category: 'master',
      subcategory: '',
      content: content,
      summary: 'Master ontology for all of Terrace - business ecosystem, geographic context, cultural patterns',
      sourceFile: 'ONTOLOGY_MASTER.json'
    });
    
    totalMetadata++;
  } catch (e) {}

  console.log(`✅ Uploaded ${totalMetadata} metadata layers\n`);

  // ============================================================================
  // PHASE 7: FINAL SUMMARY
  // ============================================================================

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PHASE 7: Final Summary');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const businessAggregate = await businessCollection.aggregate.overAll();
  const documentAggregate = await documentCollection.aggregate.overAll();
  const metadataAggregate = await metadataCollection.aggregate.overAll();

  console.log('NEW WEAVIATE DATA:');
  console.log(`  TerraceBusiness:   ${businessAggregate.totalCount} objects`);
  console.log(`  TerraceDocument:   ${documentAggregate.totalCount} objects`);
  console.log(`  TerraceMetadata:   ${metadataAggregate.totalCount} objects`);
  console.log('');
  console.log(`TOTAL: ${businessAggregate.totalCount + documentAggregate.totalCount + metadataAggregate.totalCount} objects`);
  console.log('');
  console.log('✅ DATA REPLACEMENT COMPLETE!');
  console.log('');
  console.log('What changed:');
  console.log('  ❌ OLD collections (Business, Document, etc.) → DELETED');
  console.log('  ✅ NEW architecture → UPLOADED');
  console.log('     - TerraceBusiness: All businesses with category structure');
  console.log('     - TerraceDocument: Bylaws + cultural + education + POI + infrastructure + environment');
  console.log('     - TerraceMetadata: All META/ONTOLOGY/TEMPORAL/NARRATIVE/MASTER_INDEX layers');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Update RAG system to query new collections');
  console.log('  2. Update search algorithm to use metadata layers for context');
  console.log('  3. Test with sample queries');

  await client.close();
}

uploadNewArchitecture().catch(console.error);

