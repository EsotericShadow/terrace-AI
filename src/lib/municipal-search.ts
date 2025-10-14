/**
 * Municipal Data Search
 * Searches Weaviate for municipal documents with category filtering
 */

import { QueryIntent } from './query-classifier';

const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export interface MunicipalResult {
  documentId: string;
  title: string;
  category: string;
  subcategory: string;
  documentType: string;
  content: string;
  sourceUrl: string;
  effectiveDate?: string;
  bylawNumber?: string;
  wordCount: number;
  distance?: number;
}

export async function searchMunicipalData(
  query: string,
  intent: QueryIntent,
  limit: number = 5
): Promise<MunicipalResult[]> {
  try {
    // Build GraphQL query with category filter
    let whereClause = '';
    
    if (intent.subcategory && intent.subcategory !== 'general') {
      whereClause = `where: {
        path: ["subcategory"],
        operator: Equal,
        valueText: "${intent.subcategory}"
      }`;
    } else if (intent.category !== 'general') {
      const categoryMap: Record<string, string> = {
        'bylaw': 'bylaws_regulations',
        'tax': 'taxes_financial',
        'recreation': 'recreation_community',
        'waste': 'public_works',
        'municipal': 'municipal_government'
      };
      
      const mappedCategory = categoryMap[intent.category];
      if (mappedCategory) {
        whereClause = `where: {
          path: ["category"],
          operator: Equal,
          valueText: "${mappedCategory}"
        }`;
      }
    }
    
    // Try vector search first (if vectorizer is enabled)
    const vectorQuery = {
      query: `{
        Get {
          TerraceMunicipalDocument(
            nearText: {
              concepts: ["${query}"]
            }
            ${whereClause}
            limit: ${limit}
          ) {
            _additional {
              id
              distance
            }
            documentId
            title
            category
            subcategory
            documentType
            content
            searchableText
            sourceUrl
            effectiveDate
            bylawNumber
            wordCount
            pageCount
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
    
    let documents = [];
    if (response.ok) {
      const data = await response.json();
      documents = data.data?.Get?.TerraceMunicipalDocument || [];
    }
    
    // Fallback to keyword search if vector search fails or returns nothing
    if (documents.length === 0) {
      console.log('Vector search returned no results, trying keyword fallback...');
      
      const keywordQuery = {
        query: `{
          Get {
            TerraceMunicipalDocument(
              ${whereClause}
              limit: 50
            ) {
              _additional {
                id
              }
              documentId
              title
              category
              subcategory
              documentType
              content
              searchableText
              sourceUrl
              effectiveDate
              bylawNumber
              wordCount
              pageCount
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
        body: JSON.stringify(keywordQuery)
      });
      
      if (response.ok) {
        const data = await response.json();
        const allDocs = data.data?.Get?.TerraceMunicipalDocument || [];
        
        // Filter by keywords
        const queryLower = query.toLowerCase();
        documents = allDocs.filter((doc: any) => {
          const title = (doc.title || '').toLowerCase();
          const content = (doc.content || '').toLowerCase();
          const searchableText = (doc.searchableText || '').toLowerCase();
          
          return title.includes(queryLower) ||
                 content.includes(queryLower) ||
                 searchableText.includes(queryLower) ||
                 intent.keywords.some(kw => 
                   title.includes(kw) || content.includes(kw) || searchableText.includes(kw)
                 );
        }).slice(0, limit);
      }
    }
    
    // Transform to result format
    return documents.map((doc: any) => ({
      documentId: doc.documentId || '',
      title: doc.title || 'Unknown Document',
      category: doc.category || '',
      subcategory: doc.subcategory || '',
      documentType: doc.documentType || 'unknown',
      content: doc.content || '',
      sourceUrl: doc.sourceUrl || '',
      effectiveDate: doc.effectiveDate || undefined,
      bylawNumber: doc.bylawNumber || undefined,
      wordCount: doc.wordCount || 0,
      distance: doc._additional?.distance
    }));
    
  } catch (error) {
    console.error('Error searching municipal data:', error);
    return [];
  }
}

