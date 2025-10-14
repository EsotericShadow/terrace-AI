import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';
const OLLAMA_URL = 'http://localhost:11434';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface SearchResult {
  businessName: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  content: string;
  planTier?: 'free' | 'pro';
  _additional?: {
    distance?: number;
  };
}

interface BylawChunkResult {
  chunkId: string;
  chunkIndex: number;
  content: string;
  contentLength: number;
  chunkType: string;
  sectionIndex?: number;
  bylawName: string;
  bylawNumber: string;
  bylawYear: string;
  bylawCategory: string;
  sourceFile: string;
  processingDate: string;
  chunkMethod: string;
  keyTopics: string[];
  penalties: string[];
  definitions: string[];
  _additional?: {
    distance?: number;
  };
}

interface CulturalDataResult {
  chunkId: string;
  chunkIndex: number;
  content: string;
  contentLength: number;
  chunkType: string;
  category: string;
  sourceFile: string;
  processingDate: string;
  _additional?: {
    distance?: number;
  };
}

interface CivicDataResult {
  docType: string;
  content: string;
  _additional?: {
    distance?: number;
  };
}

// Clean LLM Response Function
async function generateLLMResponse(
  userMessage: string,
  bylawContext: BylawChunkResult[],
  businessResults: SearchResult[],
  conversationHistory: ChatMessage[],
  culturalData: CulturalDataResult[] = [],
  civicData: CivicDataResult[] = []
): Promise<string> {
  try {
    // Build focused context for LLM
    let context = 'You are Terrace AI, a helpful assistant for Terrace, BC. Use the provided information to answer the user\'s question.\n\n';
    
    // Add business information with specific details
    if (businessResults.length > 0) {
      context += 'Terrace Businesses:\n';
      businessResults.slice(0, 3).forEach(business => {
        const address = business.address || 'Address not available';
        const phone = business.phone || 'Phone not available';
        context += `- ${business.businessName}: ${address}${phone !== 'Phone not available' ? `, Phone: ${phone}` : ''}\n`;
      });
      context += '\n';
    }
    
    // Add bylaw information
    if (bylawContext.length > 0) {
      context += 'Terrace Municipal Information:\n';
      bylawContext.slice(0, 2).forEach(info => {
        context += `- ${info.bylawName}: ${info.content.substring(0, 150)}...\n`;
      });
      context += '\n';
    }
    
    // Add cultural/landmark information
    if (culturalData.length > 0) {
      context += 'Terrace Landmarks:\n';
      culturalData.slice(0, 2).forEach(data => {
        context += `- ${data.content.substring(0, 150)}...\n`;
      });
      context += '\n';
    }
    
    // Add civic information
    if (civicData.length > 0) {
      context += 'Terrace Municipal Services:\n';
      civicData.slice(0, 2).forEach(data => {
        context += `- ${data.docType.toUpperCase()}: ${data.content.substring(0, 150)}...\n`;
      });
      context += '\n';
    }
    
    // Create the prompt
    const prompt = `${context}User Question: ${userMessage}\n\nAnswer as Terrace AI. Be specific about Terrace businesses and locations. If you found relevant businesses, mention them by name and address. Keep responses helpful and local to Terrace, BC.`;
    
    // Call Ollama
    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'phi3:mini',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 200
        }
      })
    });

    if (!response.ok) {
      console.error('Ollama request failed:', response.status);
      return 'I found some information but had trouble generating a response. Please try asking again.';
    }

    const data = await response.json();
    return data.response || 'I found some information but had trouble generating a response. Please try asking again.';
    
  } catch (error) {
    console.error('LLM response generation failed:', error);
    return 'I found some information but had trouble generating a response. Please try asking again.';
  }
}

// Search businesses with hybrid search
async function searchWeaviate(query: string, limit: number = 5): Promise<SearchResult[]> {
  try {
    // First try vector search
    const vectorQuery = {
      query: `{
        Get {
          TerraceBusiness(
            nearText: {
              concepts: ["${query}"]
            }
            limit: ${limit}
          ) {
            _additional {
              id
              distance
            }
            businessName
            category
            subcategory
            address
            city
            postalCode
            phone
            website
            searchableText
          }
        }
      }`
    };

    let response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(vectorQuery)
    });

    let businesses = [];
    if (response.ok) {
      const data = await response.json();
      businesses = data.data?.Get?.TerraceBusiness || [];
    }

    // If vector search returns no results, try fallback search
    if (businesses.length === 0) {
      console.log('Vector search returned no results, trying fallback search...');
      
      // Get a larger set of businesses and filter them
      const fallbackQuery = {
        query: `{
          Get {
            TerraceBusiness(
              limit: 200
            ) {
              _additional {
                id
              }
              businessName
              category
              subcategory
              address
              city
              postalCode
              phone
              website
              searchableText
            }
          }
        }`
      };

      response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify(fallbackQuery)
      });

      if (response.ok) {
        const data = await response.json();
        const allBusinesses = data.data?.Get?.TerraceBusiness || [];
        
        // Filter businesses based on query
        const queryLower = query.toLowerCase();
        businesses = allBusinesses.filter((business: any) => {
          const name = (business.businessName || '').toLowerCase();
          const searchableText = (business.searchableText || '').toLowerCase();
          const address = (business.address || '').toLowerCase();
          const category = (business.category || '').toLowerCase();
          
          return name.includes(queryLower) || 
                 searchableText.includes(queryLower) || 
                 address.includes(queryLower) ||
                 category.includes(queryLower);
        }).slice(0, limit);
      }
    }

    if (!response.ok) {
      console.error('Weaviate search failed:', response.status);
      return [];
    }

    return businesses.map((business: any) => ({
      businessName: business.businessName || 'Unknown Business',
      category: business.category || 'Other',
      subcategory: business.subcategory || '',
      address: business.address || '',
      city: business.city || 'Terrace',
      postalCode: business.postalCode || '',
      phone: business.phone || '',
      website: business.website || '',
      content: business.searchableText || '',
      planTier: 'free' as const,
      _additional: {
        distance: business._additional?.distance
      }
    }));

  } catch (error) {
    console.error('Error searching businesses:', error);
    return [];
  }
}

// Search bylaws
async function searchBylaws(query: string, limit: number = 3): Promise<BylawChunkResult[]> {
  try {
    const searchQuery = {
      query: `{ 
        Get { 
          TerraceBylawChunks(
            nearText: {
              concepts: ["${query}"]
            }
            limit: ${limit}
          ) { 
            _additional {
              id
              distance
            }
            chunkId
            chunkIndex
            content 
            contentLength
            chunkType
            sectionIndex
            bylawName 
            bylawNumber 
            bylawYear 
            bylawCategory 
            sourceFile 
            processingDate
            chunkMethod
            keyTopics
            penalties
            definitions
          } 
        } 
      }`
    };

    const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(searchQuery)
    });

    if (!response.ok) {
      console.error('Weaviate bylaw search failed:', response.status);
      return [];
    }

    const data = await response.json();
    const chunks = data.data?.Get?.TerraceBylawChunks || [];

    return chunks.map((chunk: any) => ({
      chunkId: chunk.chunkId || '',
      chunkIndex: chunk.chunkIndex || 0,
      content: chunk.content || '',
      contentLength: chunk.contentLength || 0,
      chunkType: chunk.chunkType || '',
      sectionIndex: chunk.sectionIndex,
      bylawName: chunk.bylawName || '',
      bylawNumber: chunk.bylawNumber || '',
      bylawYear: chunk.bylawYear || '',
      bylawCategory: chunk.bylawCategory || '',
      sourceFile: chunk.sourceFile || '',
      processingDate: chunk.processingDate || '',
      chunkMethod: chunk.chunkMethod || '',
      keyTopics: chunk.keyTopics || [],
      penalties: chunk.penalties || [],
      definitions: chunk.definitions || [],
      _additional: {
        distance: chunk._additional?.distance
      }
    }));

  } catch (error) {
    console.error('Error searching bylaws:', error);
    return [];
  }
}

// Search cultural data
async function searchCulturalData(query: string, limit: number = 3): Promise<CulturalDataResult[]> {
  try {
    const searchQuery = {
      query: `{ 
        Get { 
          TerraceCulturalData(
            nearText: { 
              concepts: ["${query}"]
            } 
            limit: ${limit}
          ) { 
            _additional {
              id
              distance
            }
            chunkId 
            chunkIndex
            content 
            contentLength
            chunkType
            category
            sourceFile 
            processingDate 
          } 
        } 
      }`
    };

    const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(searchQuery)
    });

    if (!response.ok) {
      console.error('Weaviate cultural search failed:', response.status);
      return [];
    }

        const data = await response.json();
    const culturalData = data.data?.Get?.TerraceCulturalData || [];

    return culturalData.map((item: any) => ({
      chunkId: item.chunkId || '',
      chunkIndex: item.chunkIndex || 0,
      content: item.content || '',
      contentLength: item.contentLength || 0,
      chunkType: item.chunkType || '',
      category: item.category || '',
      sourceFile: item.sourceFile || '',
      processingDate: item.processingDate || '',
      _additional: {
        distance: item._additional?.distance
      }
    }));

  } catch (error) {
    console.error('Error searching cultural data:', error);
    return [];
  }
}

// Search civic data
async function searchCivicData(query: string, limit: number = 3): Promise<CivicDataResult[]> {
  try {
    const searchQuery = {
      query: `{ 
        Get { 
          TerraceCivicInfo(
            nearText: {
              concepts: ["${query}"]
            } 
            limit: ${limit}
          ) { 
            _additional { 
              id
              distance
            } 
            docType
            content
          } 
        } 
      }`
    };

    const response = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(searchQuery)
    });

    if (!response.ok) {
      console.error('Weaviate civic search failed:', response.status);
      return [];
    }

    const data = await response.json();
    const civicData = data.data?.Get?.TerraceCivicInfo || [];

    return civicData.map((item: any) => ({
      docType: item.docType || '',
      content: item.content || '',
      _additional: {
        distance: item._additional?.distance
      }
    }));
    
  } catch (error) {
    console.error('Error searching civic data:', error);
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    console.log(`🔍 Processing query: "${message}"`);

    // Search all data sources in parallel
    const [businessResults, bylawChunks, culturalData, civicData] = await Promise.all([
      searchWeaviate(message, 5),
      searchBylaws(message, 3),
      searchCulturalData(message, 3),
      searchCivicData(message, 3)
    ]);

    console.log(`📊 Found ${businessResults.length} businesses, ${bylawChunks.length} bylaw chunks, ${culturalData.length} cultural items, ${civicData.length} civic items`);

    // Generate LLM response
    const llmResponse = await generateLLMResponse(message, bylawChunks, businessResults, conversationHistory, culturalData, civicData);

    // Format sources
    const businessSources = businessResults.map(business => ({
      businessName: business.businessName,
      category: business.category,
      address: business.address,
      content: business.content.substring(0, 200) + '...'
    }));

    const bylawSources = bylawChunks.map(chunk => ({
      businessName: chunk.bylawName,
      category: 'municipal_government',
      address: '',
      content: chunk.content.substring(0, 200) + '...'
    }));

    const culturalSources = culturalData.map(data => ({
      businessName: `Terrace ${data.chunkType}`,
      category: 'cultural_info',
      address: '',
      content: data.content.substring(0, 200) + '...'
    }));

    const civicSources = civicData.map(data => ({
      businessName: `Terrace ${data.docType.toUpperCase()} Service`,
      category: 'municipal_services',
      address: '',
      content: data.content.substring(0, 200) + '...'
    }));

    const sources = [...businessSources, ...bylawSources, ...culturalSources, ...civicSources];

    return NextResponse.json({
      response: llmResponse,
      sources,
      searchResultsCount: businessResults.length,
      bylawChunksCount: bylawChunks.length,
      culturalDataCount: culturalData.length,
      civicDataCount: civicData.length
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
