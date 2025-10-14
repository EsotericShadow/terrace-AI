/**
 * Terrace AI Chat API - Municipal Data Only
 * Strict no-hallucination implementation using only verified municipal data
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyQuery, QueryIntent } from '@/lib/query-classifier';
import { searchMunicipalData, MunicipalResult } from '@/lib/municipal-search';

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Source {
  type: 'municipal';
  title: string;
  category: string;
  documentType: string;
  sourceUrl?: string;
  bylawNumber?: string;
  effectiveDate?: string;
}

/**
 * Generate response using ONLY provided context - NO HALLUCINATIONS
 */
async function generateStrictResponse(
  userMessage: string,
  municipalResults: MunicipalResult[],
  intent: QueryIntent
): Promise<string> {
  try {
    // If no results found, return honest message
    if (municipalResults.length === 0) {
      return `I don't have specific information about "${userMessage}" in my Terrace municipal database yet. For the most accurate information, please contact City of Terrace at 250-615-4000 or visit terrace.ca.`;
    }
    
    // Build strict context from ONLY the search results
    let context = 'You are Terrace AI. Answer using ONLY the information below. Do NOT make up information.\n\n';
    
    context += 'MUNICIPAL DOCUMENTS:\n';
    municipalResults.forEach((doc, idx) => {
      context += `\n[Document ${idx + 1}]\n`;
      context += `Title: ${doc.title}\n`;
      if (doc.bylawNumber) context += `Bylaw Number: ${doc.bylawNumber}\n`;
      if (doc.effectiveDate) context += `Effective Date: ${doc.effectiveDate}\n`;
      context += `Type: ${doc.documentType}\n`;
      context += `Content: ${doc.content.substring(0, 1000)}...\n`;
    });
    
    // Create STRICT prompt
    const prompt = `${context}

User Question: ${userMessage}

STRICT RULES:
1. ONLY use information from the documents above
2. NEVER make up bylaw numbers, fees, phone numbers, or addresses
3. ALWAYS cite the document title
4. If specific information is missing, say "I don't have that specific information"
5. Keep response under 250 characters
6. Be helpful and conversational but ACCURATE

Answer:`;
    
    // Call Ollama with low temperature for accuracy
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
          temperature: 0.1,  // Very low for accuracy
          top_p: 0.9,
          num_predict: 250
        }
      })
    });
    
    if (!response.ok) {
      console.error('Ollama request failed:', response.status);
      return generateFallbackResponse(municipalResults, userMessage);
    }
    
    const data = await response.json();
    const llmResponse = data.response || '';
    
    // Return LLM response or fallback
    return llmResponse.trim() || generateFallbackResponse(municipalResults, userMessage);
    
  } catch (error) {
    console.error('Error generating response:', error);
    return generateFallbackResponse(municipalResults, userMessage);
  }
}

/**
 * Fallback response using template - still no hallucinations
 */
function generateFallbackResponse(municipalResults: MunicipalResult[], query: string): string {
  if (municipalResults.length === 0) {
    return `I don't have information about "${query}" yet. Contact City of Terrace at 250-615-4000 or visit terrace.ca.`;
  }
  
  const firstDoc = municipalResults[0];
  let response = `I found information in "${firstDoc.title}"`;
  
  if (firstDoc.bylawNumber) {
    response += ` (${firstDoc.bylawNumber})`;
  }
  
  response += `. ${firstDoc.content.substring(0, 150)}...`;
  
  if (municipalResults.length > 1) {
    response += ` Plus ${municipalResults.length - 1} more document(s).`;
  }
  
  return response;
}

/**
 * Build sources array from search results
 */
function buildSources(municipalResults: MunicipalResult[]): Source[] {
  return municipalResults.map(doc => ({
    type: 'municipal' as const,
    title: doc.title,
    category: `${doc.category}/${doc.subcategory}`,
    documentType: doc.documentType,
    sourceUrl: doc.sourceUrl || undefined,
    bylawNumber: doc.bylawNumber || undefined,
    effectiveDate: doc.effectiveDate || undefined
  }));
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid message is required' },
        { status: 400 }
      );
    }
    
    const userMessage = message.trim();
    
    // Classify query intent
    const intent = classifyQuery(userMessage);
    console.log('Query intent:', intent);
    
    // Search municipal data
    const municipalResults = await searchMunicipalData(userMessage, intent, 5);
    console.log(`Found ${municipalResults.length} municipal documents`);
    
    // Generate response
    const response = await generateStrictResponse(userMessage, municipalResults, intent);
    
    // Build sources
    const sources = buildSources(municipalResults);
    
    return NextResponse.json({
      response,
      sources,
      searchResultsCount: municipalResults.length,
      intent: {
        category: intent.category,
        subcategory: intent.subcategory,
        confidence: intent.confidence
      }
    });
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

