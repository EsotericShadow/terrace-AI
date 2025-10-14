// src/lib/rag-system.ts
// Retrieval-Augmented Generation system combining Weaviate + xAI

import weaviate, { WeaviateClient } from 'weaviate-client';
import { XAIClient } from './xai-client';
import { GroqClient } from './groq-client';  // NEW: Import Groq for cost-saving generation
import { OrchestratorXAI, ConversationTurn } from './orchestrator-xai';
import { DiscriminatorXAI, Candidate } from './discriminator-xai';
import { SessionManager, BusinessData } from './session-manager';
import { getDocumentUrl } from './document-urls';

export interface RAGContext {
  businesses: Array<{
    name: string;
    category: string;
    address: string;
    phone: string;
    description: string;
    score: number;
  }>;
  documents: Array<{
    title: string;
    category: string;
    summary: string;
    fullContent?: string; // Full document content for detailed information
    score: number;
  }>;
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  confidence: 'high' | 'medium' | 'low';
  sources: number;
}

export class RAGSystem {
  private weaviateClient: WeaviateClient | null = null;
  private xaiClient: XAIClient;
  private generatorClient: XAIClient | GroqClient;  // NEW: Configurable generator
  private orchestrator: OrchestratorXAI;
  private discriminator: DiscriminatorXAI;
  private weaviateUrl: string;
  private weaviateApiKey: string;
  private huggingfaceApiKey: string;
  private sessionManager: SessionManager;

  constructor(
    weaviateUrl: string,
    weaviateApiKey: string,
    huggingfaceApiKey: string,
    xaiApiKey: string,
    groqApiKey?: string,  // Optional: if provided, use Groq for orchestrator/discriminator
    useGroqForGeneration?: boolean  // NEW: if true, use Groq for final generation (saves 94% credits!)
  ) {
    this.weaviateUrl = weaviateUrl;
    this.weaviateApiKey = weaviateApiKey;
    this.huggingfaceApiKey = huggingfaceApiKey;
    this.xaiClient = new XAIClient(xaiApiKey);
    
    // Use Groq for orchestrator/discriminator if API key provided (fast + cheap)
    // Otherwise fall back to xAI
    const useGroq = !!groqApiKey;
    if (useGroq) {
      console.log('🚀 Using Groq (Llama 3.1 8B) for orchestrator/discriminator - 560 t/s, 221x cheaper!');
      this.orchestrator = new OrchestratorXAI(groqApiKey!, useGroq);
      this.discriminator = new DiscriminatorXAI(groqApiKey!, useGroq);
    } else {
      console.log('Using xAI Grok for orchestrator/discriminator');
      this.orchestrator = new OrchestratorXAI(xaiApiKey, false);
      this.discriminator = new DiscriminatorXAI(xaiApiKey, false);
    }
    
    // NEW: Configure final generation client
    if (useGroqForGeneration && groqApiKey) {
      console.log('💰 Using Groq (Llama 3.3 70B) for final generation - saves 94% on xAI credits!');
      this.generatorClient = new GroqClient(groqApiKey, 'llama-3.3-70b-versatile');
    } else {
      console.log('💎 Using xAI Grok for final generation (premium quality)');
      this.generatorClient = this.xaiClient;
    }
    
    this.sessionManager = SessionManager.getInstance();
  }

  private async getWeaviateClient(): Promise<WeaviateClient> {
    if (!this.weaviateClient) {
      this.weaviateClient = await weaviate.connectToWeaviateCloud(
        this.weaviateUrl,
        {
          authCredentials: new weaviate.ApiKey(this.weaviateApiKey),
          headers: {
            'X-HuggingFace-Api-Key': this.huggingfaceApiKey,
          },
          timeout: { init: 30, query: 60, insert: 120 },
        }
      );
    }
    return this.weaviateClient;
  }

  private cleanBusinessName(rawName: string): string {
    // Extract "operating as" name first (priority)
    const oaMatch = rawName.match(/(?:o\/a|d\/b\/a|dba)\s+(.+?)(?:\s+(?:LTD|INC|CORP|LLC|CO\.|LIMITED|INCORPORATED|CORPORATION))?$/i);
    if (oaMatch) {
      rawName = oaMatch[1].trim();
    }
    
    // Remove corporate suffixes
    let cleaned = rawName
      .replace(/\s+(LTD|LIMITED|INC|INCORPORATED|CORP|CORPORATION|LLC|CO\.|L\.L\.C\.|COMPANY)\.?$/gi, '')
      .replace(/\s+\d+$/, '') // Remove trailing numbers
      .replace(/^[\d\-]+\s+/, '') // Remove leading numbers/dashes
      .trim();
    
    // Convert ALL CAPS to Title Case
    if (cleaned === cleaned.toUpperCase()) {
      cleaned = cleaned.toLowerCase().split(' ').map(word => {
        // Handle special cases
        if (['and', 'the', 'of', 'in', 'at', 'to', 'for', 'a', 'an'].includes(word)) {
          return word;
        }
        if (['llc', 'hvac', 'bc', 'dba'].includes(word)) {
          return word.toUpperCase();
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
      
      // Capitalize first word even if it's "the", "and", etc
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    
    return cleaned;
  }

  async searchBusinesses(query: string, limit: number = 5): Promise<RAGContext['businesses']> {
    try {
      const client = await this.getWeaviateClient();
      const businessCollection = client.collections.get('Business');

      const results = await businessCollection.query.nearText(query, {
        limit: limit * 2, // Get more to account for duplicates
        returnMetadata: ['distance'],
      });

      const businesses = results.objects.map((obj: any) => {
        // If address is outside Terrace, BC, show generic "Operating in Terrace, BC"
        let displayAddress = obj.properties.address || 'Address not available';
        if (displayAddress && displayAddress !== 'Address not available') {
          const hasTerraceBC = displayAddress.toLowerCase().includes('terrace') && displayAddress.toLowerCase().includes('bc');
          const hasThornhill = displayAddress.toLowerCase().includes('thornhill') && displayAddress.toLowerCase().includes('bc');
          
          if (!hasTerraceBC && !hasThornhill) {
            displayAddress = 'Operating in Terrace, BC (claim business to add address)';
          }
        }

        return {
          name: this.cleanBusinessName(obj.properties.businessName || 'Unknown'),
          category: `${obj.properties.category} → ${obj.properties.subcategory}`,
          address: displayAddress,
          phone: obj.properties.phone || 'Phone not available',
          description: obj.properties.description || 'No description available',
          score: 1 - (obj.metadata?.distance || 0),
          claimed: obj.properties.claimed || false,
          verified: obj.properties.verified || false,
        };
      });

      // Deduplicate by business name and address
      const seen = new Set<string>();
      const unique = businesses.filter(biz => {
        const key = `${biz.name.toLowerCase()}_${biz.address.toLowerCase()}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique.slice(0, limit);
    } catch (error) {
      console.error('Business search error:', error);
      return [];
    }
  }

  async searchDocuments(query: string, limit: number = 5): Promise<RAGContext['documents']> {
    try {
      const client = await this.getWeaviateClient();
      const documentCollection = client.collections.get('Document');

      // FIX #1: Enhance query for specific topics to improve retrieval
      let enhancedQuery = query;
      if (/dog.*licen|cat.*licen|pet.*licen/i.test(query)) {
        enhancedQuery = `${query} animal control bylaw 2159 licensing fees`;
        console.log(`  🐕 Enhanced animal license query: ${enhancedQuery}`);
      }

      const results = await documentCollection.query.nearText(enhancedQuery, {
        limit: limit * 3, // Get more to account for duplicates and scoring
        returnMetadata: ['distance'],
      });

      // FIX #1: Detect if this is a fee/cost query
      const isFeeQuery = /cost|fee|price|how much|charge|rate|payment/i.test(query);
      console.log(`  ${isFeeQuery ? '💰' : '📄'} Fee query: ${isFeeQuery}`);

      const documents = results.objects.map((obj: any) => {
        const baseScore = 1 - (obj.metadata?.distance || 0);
        let adjustedScore = baseScore;
        
        const title = (obj.properties.title || '').toLowerCase();
        const content = (obj.properties.content || '').toLowerCase();
        
        // FIX #1: BOOST/PENALIZE based on document characteristics
        if (isFeeQuery) {
          // SUPER BOOST: Animal control for dog/cat license queries
          if ((title.includes('animal') || title.includes('2159')) && /dog|cat|pet/i.test(query)) {
            adjustedScore *= 2.0;
            console.log(`  ⬆️⬆️  SUPER BOOST animal control: ${obj.properties.title}`);
          }
          
          // BOOST: Consolidated/main bylaws (have complete info)
          if (title.includes('consolidated') || title.includes('main')) {
            adjustedScore *= 1.4;
            console.log(`  ↗️  BOOST consolidated: ${obj.properties.title}`);
          }
          
          // BOOST: Documents with actual dollar amounts/fees
          if (content.includes('$') || /\d+\.\d{2}/.test(content)) {
            adjustedScore *= 1.3;
            console.log(`  ↗️  BOOST has fees: ${obj.properties.title}`);
          }
          
          // PENALIZE: Amendment bylaws (usually don't have full fee schedules)
          if (title.includes('amendment') && !content.includes('$')) {
            adjustedScore *= 0.6;
            console.log(`  ↘️  PENALIZE amendment: ${obj.properties.title}`);
          }
          
          // PENALIZE: Planning fees for non-planning queries
          if (title.includes('planning') && !/planning|permit|development/i.test(query)) {
            adjustedScore *= 0.5;
            console.log(`  ↘️  PENALIZE irrelevant planning: ${obj.properties.title}`);
          }
        }
        
        return {
          title: obj.properties.title || 'Untitled',
          category: `${obj.properties.category} → ${obj.properties.subcategory}`,
          summary: obj.properties.summary || obj.properties.content?.substring(0, 200) || 'No summary available',
          fullContent: obj.properties.content || '', // Get FULL content for AI context
          score: adjustedScore,
          originalScore: baseScore,
        };
      });

      // Sort by adjusted score
      documents.sort((a, b) => b.score - a.score);

      // Deduplicate by title
      const seen = new Set<string>();
      const unique = documents.filter(doc => {
        const key = doc.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return unique.slice(0, limit);
    } catch (error) {
      console.error('Document search error:', error);
      return [];
    }
  }

  private classifyQuery(query: string): 'business' | 'document' | 'both' {
    const queryLower = query.toLowerCase();

    // Business indicators
    const businessKeywords = [
      'business', 'company', 'store', 'shop', 'restaurant', 'service',
      'contractor', 'find', 'where can i', 'looking for', 'need',
      'buy', 'sell', 'repair', 'fix', 'install', 'contact'
    ];

    // Document indicators
    const documentKeywords = [
      'bylaw', 'regulation', 'permit', 'tax', 'policy', 'rule',
      'law', 'requirement', 'how to', 'application', 'form',
      'council', 'government', 'municipal', 'city hall'
    ];

    const hasBusinessKeyword = businessKeywords.some(kw => queryLower.includes(kw));
    const hasDocumentKeyword = documentKeywords.some(kw => queryLower.includes(kw));

    if (hasBusinessKeyword && !hasDocumentKeyword) return 'business';
    if (hasDocumentKeyword && !hasBusinessKeyword) return 'document';
    return 'both';
  }

  private chunkDocument(content: string, chunkSize: number = 2000): string[] {
    // Split document into semantic chunks (paragraphs, sections)
    const paragraphs = content.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const para of paragraphs) {
      if ((currentChunk + para).length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = para;
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + para;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  private findRelevantChunks(chunks: string[], userQuery: string, maxChunks: number = 3): string[] {
    // Score each chunk by keyword relevance
    const queryKeywords = userQuery.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3 && !['what', 'how', 'where', 'when', 'the', 'and', 'for'].includes(w));
    
    const scoredChunks = chunks.map((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      
      // Score by keyword matches
      queryKeywords.forEach(keyword => {
        const matches = (chunkLower.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * 10;
      });
      
      // Boost chunks with key information markers
      if (/fee|cost|price|\$\d+|penalty|fine/i.test(chunk)) score += 20;
      if (/contact|phone|email|address/i.test(chunk)) score += 15;
      if (/procedure|process|step|how to|apply/i.test(chunk)) score += 15;
      if (/prohibited|not allowed|must|shall|required/i.test(chunk)) score += 10;
      
      // Prefer chunks near the beginning (usually have definitions/overview)
      if (idx < 3) score += 5;
      
      return { chunk, score, idx };
    });
    
    // Sort by score and take top chunks
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, maxChunks).map(sc => sc.chunk);
  }

  private buildContext(context: RAGContext, userQuery: string): string {
    let contextStr = '';

    if (context.businesses.length > 0) {
      contextStr += '=== BUSINESSES ===\n\n';
      context.businesses.forEach((biz, i) => {
        contextStr += `${i + 1}. ${biz.name}\n`;
        contextStr += `   Category: ${biz.category}\n`;
        contextStr += `   Address: ${biz.address}\n`;
        contextStr += `   Phone: ${biz.phone}\n`;
        if (biz.description) {
          contextStr += `   Description: ${biz.description}\n`;
        }
        contextStr += '\n';
      });
    }

    if (context.documents.length > 0) {
      contextStr += '=== MUNICIPAL DOCUMENTS ===\n\n';
      context.documents.forEach((doc, i) => {
        // Get the source URL for this document
        const sourceUrl = getDocumentUrl(doc.title);
        
        contextStr += `${i + 1}. ${doc.title}\n`;
        contextStr += `   Category: ${doc.category}\n`;
        if (sourceUrl) {
          contextStr += `   Source URL: ${sourceUrl} (ALWAYS include this link in your response)\n`;
        }
        
        // Intelligently handle large documents with semantic chunking
        if (doc.fullContent && doc.fullContent.length > 100) {
          const MAX_DOC_LENGTH = 40000; // Conservative limit per doc
          
          // Special handling for fee/cost queries - don't chunk fee schedules
          const isFeeQuery = /cost|fee|price|how much|charge|rate|payment/i.test(userQuery);
          const containsFees = doc.fullContent.includes('$') || /fee|cost|charge|rate/i.test(doc.title);
          
          if (doc.fullContent.length > MAX_DOC_LENGTH && !isFeeQuery) {
            // SMART APPROACH: Chunk and select most relevant
            console.log(`  📄 Large document detected (${doc.fullContent.length} chars) - chunking...`);
            const chunks = this.chunkDocument(doc.fullContent, 2000);
            const relevantChunks = this.findRelevantChunks(chunks, userQuery, 3);
            console.log(`  ✂️  Selected ${relevantChunks.length} most relevant chunks from ${chunks.length} total`);
            
            contextStr += `   Relevant Sections:\n${relevantChunks.join('\n\n---\n\n')}\n\n`;
          } else if (isFeeQuery && containsFees) {
            // For fee queries, send the FULL document so AI sees all pricing tiers
            console.log(`  💰 Fee query detected - sending full document for complete pricing`);
            contextStr += `   Full Content (READ ALL PRICING TIERS):\n${doc.fullContent}\n\n`;
          } else {
            contextStr += `   Full Content:\n${doc.fullContent}\n\n`;
          }
        } else {
          contextStr += `   Summary: ${doc.summary}\n\n`;
        }
      });
    }

    return contextStr;
  }

  private getSystemPrompt(queryScope?: string, userQuery?: string): string {
    const basePrompt = `You are a helpful AI assistant for the City of Terrace, BC, Canada. You help residents and visitors find information about local businesses, cultural heritage, Indigenous history, municipal services, bylaws, and regulations.

CRITICAL RULES - NEVER VIOLATE:
- ONLY use information explicitly provided in the context
- NEVER make up, guess, or infer information not in the context
- If information is missing (hours, phone, email, etc.), explicitly say "I don't have that information available"
- If asked about something not in the context, admit you don't know
- NEVER fabricate addresses, phone numbers, hours, or any other details
- NEVER tell users to "contact city hall" if the full document content contains the answer
- The full bylaw/document content is provided - extract ALL relevant details from it
- When answering fee/cost questions: Extract ALL pricing tiers, categories, and variations (e.g., spayed/neutered rates, senior rates, etc.)
- **MANDATORY FOR BYLAWS**: When referencing official bylaws or municipal regulations, you MUST include the clickable source link IF a Source URL is provided in the context
- Format: [Full Document Title](https://www.terrace.ca/media/XXXX)
- ONLY include links when "Source URL" is explicitly provided in the document context
- DO NOT create fake links or guess URLs

Your role:
- Provide accurate, helpful information based ONLY on the context provided
- If asked about businesses, answer based on the context provided
- If asked about bylaws or regulations, READ THE FULL DOCUMENT CONTENT and provide complete details (fees, penalties, hours, procedures, contact info)
- Extract specific information from the full document text - don't just reference it
- For fee questions: List ALL price variations (e.g., "Regular: $X, Spayed/Neutered: $Y, Senior: $Z")
- Always include contact information (phone, address) when available IN THE CONTEXT
- **When a Source URL is provided in context**, include it as: "📄 **Full details**: [Document Title](URL)"
- **DO NOT** include links if no Source URL is in the context - these are collected data, not official documents
- Be friendly, concise, and conversational
- If the context doesn't contain enough information to answer the question, say so politely and clearly

Guidelines:
- Always base your answers on the provided context
- For bylaw/permit queries: Read the FULL document content and extract specific details
- For fee queries: Extract ALL price tiers and conditions from the document
- Focus on the SINGLE MOST RELEVANT result provided - don't list multiple options unless explicitly asked
- Include specific business names, addresses, and phone numbers ONLY when they appear in the context
- If a field is missing from the context (e.g., "Phone not available"), explicitly state that
- **SOURCE CITATION**: If a "Source URL" is provided in the document context, include it
- Format: "📄 **Full details**: [Document Title](URL)"
- Only include links when explicitly provided - do not fabricate URLs
- Keep answers concise and focused on the top result
- If the user wants more options, they will ask for "more" or "another"`;

    // FIX #3: Detect general overview queries and provide concise summaries
    if (userQuery && /^(what are|what is|tell me about|explain|overview of)/i.test(userQuery)) {
      console.log(`  📝 General overview query detected - using concise mode`);
      return basePrompt + `

IMPORTANT - CONCISE SUMMARY MODE:
- The user asked a GENERAL question, so provide a BRIEF summary
- Keep your answer under 100 words total
- List only the 3-5 MOST IMPORTANT points
- DO NOT list every single detail, exemption, or rule
- End with: "Need details on a specific situation? Just ask!"
- Example: "Noise Bylaw 2100-2016 prohibits loud noise. Construction allowed 7am-8pm Mon-Sat. Violations $100-$2,000. Need details on a specific situation? Just ask!"`;
    }

    if (queryScope === 'specific_business') {
      return basePrompt + `
- The user asked about a SPECIFIC business. Answer directly about THAT business only.
- DO NOT recommend other businesses unless they explicitly ask for alternatives.
- Focus your entire response on the ONE business they asked about.
- If the requested information (hours, phone, etc.) is not in the context, say "I don't have that information for [business name]"`;
    }

    return basePrompt + `
- If multiple options exist, present the top 3-5 most relevant ones`;
  }

  private checkContextHit(
    orchestratorOutput: any,
    sessionId: string
  ): BusinessData | null {
    // Check if this is a specific business query
    if (orchestratorOutput.queryScope !== 'specific_business' || !orchestratorOutput.specificBusinessName) {
      return null;
    }

    // Get last entity (now supports businesses, documents, topics)
    const lastEntity = this.sessionManager.getLastEntity(sessionId);
    if (!lastEntity || lastEntity.entityType !== 'business') {
      return null;
    }

    // Check if the requested business matches cached business
    const requestedName = orchestratorOutput.specificBusinessName.toLowerCase();
    const cachedName = lastEntity.entityName.toLowerCase();

    if (cachedName.includes(requestedName) || requestedName.includes(cachedName)) {
      console.log(`  ⚡ CONTEXT HIT! Cached business: ${lastEntity.entityName}`);
      return lastEntity.entityData;
    }

    return null;
  }

  async query(userQuery: string, sessionId: string): Promise<RAGResponse> {
    try {
      console.log(`\n🔍 STAGE 1: Orchestrator decomposing query... [Session: ${sessionId.slice(0, 8)}]`);
      
      // Get session context for conversation history
      let sessionContext = this.sessionManager.getSession(sessionId);
      if (!sessionContext) {
        sessionContext = this.sessionManager.createSession(sessionId);
      }
      
      // CHECK: Is user responding to AI's clarification question?
      let enhancedQuery = userQuery;
      const pendingClarification = this.sessionManager.getPendingClarification(sessionId);
      if (pendingClarification && sessionContext.conversationHistory.length > 0) {
        const lastTurn = sessionContext.conversationHistory[sessionContext.conversationHistory.length - 1];
        
        // If AI's last response was a question and user is responding, this is a clarification
        if (lastTurn.aiAskedQuestion) {
          console.log(`  ℹ️  User responding to clarification question`);
          
          // Get the last entity context to understand what was being discussed
          const lastEntity = this.sessionManager.getLastEntity(sessionId);
          if (lastEntity) {
            console.log(`  → Clarification context: ${lastEntity.entityType} = ${lastEntity.entityName}`);
            // Enhance query with context: "user wants to sell [baked goods] from home"
            enhancedQuery = `${lastEntity.queryIntent || 'Previous topic'}: ${userQuery}`;
          }
          
          // Clear pending clarification
          this.sessionManager.clearPendingClarification(sessionId);
        }
      }
      
      // STAGE 1: Orchestrator - Decompose query
      const orchestratorOutput = await this.orchestrator.decompose(
        enhancedQuery,
        sessionContext.conversationHistory
      );

      console.log('  Intent:', orchestratorOutput.intent);
      console.log('  Query Type:', orchestratorOutput.queryType);
      console.log('  Category Hints:', orchestratorOutput.categoryHints);
      console.log('  Query Scope:', orchestratorOutput.queryScope);
      
      // FIX #6: Store user topic in session (not just documents)
      if (orchestratorOutput.metadata?.userTopic) {
        this.sessionManager.updateLastEntity(
          sessionId,
          'topic',
          orchestratorOutput.metadata.userTopic,
          { query: userQuery, intent: orchestratorOutput.intent }
        );
        console.log(`  💾 Stored topic context: "${orchestratorOutput.metadata.userTopic}"`);
      }
      
      // FIX #7: Check if we should skip business search (service attribute query)
      if (orchestratorOutput.metadata?.skipBusinessSearch) {
        console.log(`  ⏭️  Skipping business search (service attribute query)`);
        
        const lastEntity = sessionContext.lastEntityContext;
        if (lastEntity && lastEntity.entityType === 'business') {
          return {
            answer: `I don't have specific information about ${lastEntity.entityName}'s services or policies regarding "${userQuery}". I recommend contacting them directly for the most accurate information.`,
            context: {
              businesses: [lastEntity.entityData],
              documents: []
            },
            confidence: 'medium',
            sources: 1
          };
        }
        
        // Fallback if no last business
        return {
          answer: `I don't have specific information about that service. Could you let me know which business you're asking about?`,
          context: { businesses: [], documents: [] },
          confidence: 'low',
          sources: 0
        };
      }

      // CHECK FOR MULTI-QUESTION QUERY
      if (orchestratorOutput.isMultiQuestion && orchestratorOutput.subQuestions && orchestratorOutput.subQuestions.length > 1) {
        console.log(`\n🔀 MULTI-QUESTION DETECTED: ${orchestratorOutput.subQuestions.length} questions found`);
        orchestratorOutput.subQuestions.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));
        
        // Process each sub-question separately
        const subResponses: RAGResponse[] = [];
        
        for (let i = 0; i < Math.min(orchestratorOutput.subQuestions.length, 3); i++) {
          const subQuestion = orchestratorOutput.subQuestions[i];
          console.log(`\n📍 Processing sub-question ${i + 1}/${orchestratorOutput.subQuestions.length}: "${subQuestion}"`);
          
          try {
            // Recursively call query for each sub-question (but prevent infinite recursion)
            const subResponse = await this.query(subQuestion, sessionId);
            subResponses.push(subResponse);
          } catch (error) {
            console.error(`  ❌ Error processing sub-question ${i + 1}:`, error);
            // Continue with other sub-questions even if one fails
          }
        }
        
        // COMBINE RESULTS FROM ALL SUB-QUESTIONS
        console.log(`\n🎯 Combining ${subResponses.length} sub-responses...`);
        
        const combinedContext: RAGContext = {
          businesses: [],
          documents: []
        };
        
        // Merge all businesses and documents
        subResponses.forEach(resp => {
          combinedContext.businesses.push(...resp.context.businesses);
          combinedContext.documents.push(...resp.context.documents);
        });
        
        // Deduplicate
        const uniqueBusinesses = Array.from(new Map(
          combinedContext.businesses.map(b => [b.name + b.address, b])
        ).values());
        
        const uniqueDocs = Array.from(new Map(
          combinedContext.documents.map(d => [d.title, d])
        ).values());
        
        combinedContext.businesses = uniqueBusinesses;
        combinedContext.documents = uniqueDocs;
        
        // Generate a combined response
        const combinedAnswers = subResponses.map((resp, i) => 
          `**Question ${i + 1}: ${orchestratorOutput.subQuestions![i]}**\n${resp.answer}`
        ).join('\n\n---\n\n');
        
        // Store combined context in session
        const session = this.sessionManager.getSession(sessionId);
        if (session) {
          session.conversationHistory.push({
            query: userQuery,
            response: combinedAnswers,
            retrievedDocs: [...combinedContext.businesses.map(b => b.name), ...combinedContext.documents.map(d => d.title)],
            timestamp: Date.now()
          });
          this.sessionManager.updateSession(sessionId, { conversationHistory: session.conversationHistory });
        }
        
        return {
          answer: combinedAnswers,
          context: combinedContext,
          confidence: 'medium',
          sources: combinedContext.businesses.length + combinedContext.documents.length
        };
      }

      // CHECK FOR CLARIFICATION NEEDED (pronoun without context)
      if (orchestratorOutput.needsClarification) {
        console.log('  ℹ️  User query needs clarification (pronoun without context)');
        
        return {
          answer: "I'd be happy to help! Could you please specify which business or topic you're asking about? For example, you could say 'Safeway hours' or 'Tim Hortons wifi'.",
          context: { businesses: [], documents: [] },
          confidence: 'low',
          sources: 0
        };
      }
      
      // FIX #2/#8: IMPROVED VAGUE QUERY HANDLING WITH ENTITY DETECTION
      // Detect ultra-vague queries, but check for entities first to avoid false positives
      
      // Helper: Check if query has a specific entity
      const hasSpecificEntity = (q: string): boolean => {
        // Check for articles + noun ("the library", "a permit", "city hall")
        if (/\b(the|a|an)\s+\w+/i.test(q)) return true;
        
        // Check for specific location/entity types
        const entities = [
          'library', 'hall', 'arena', 'pool', 'hospital', 'museum',
          'park', 'school', 'fire hall', 'rec center', 'city hall',
          'permit', 'license', 'bylaw', 'event', 'program', 'courthouse',
          'police', 'fire station', 'city office'
        ];
        
        if (entities.some(e => new RegExp(`\\b${e}\\b`, 'i').test(q))) return true;
        
        // Check for proper nouns (capitalized words)
        if (/\b[A-Z][a-z]+\b/.test(q)) return true;
        
        return false;
      };
      
      const isUltraVague = (q: string): boolean => {
        // FIX #8: NOT vague if has specific entity!
        if (hasSpecificEntity(q)) {
          console.log(`  → Query has entity, NOT vague: "${q}"`);
          return false;
        }
        
        const vague = ['what time', 'how much', 'where', 'when', 'who', 'which one', 'what about'];
        return q.trim().length < 20 && vague.some(v => q.toLowerCase().includes(v));
      };
      
      if (isUltraVague(userQuery)) {
        const lastTurn = sessionContext.conversationHistory.length > 0 
          ? sessionContext.conversationHistory[sessionContext.conversationHistory.length - 1]
          : null;
        
        // Check if we have GOOD context to use
        const hasGoodContext = sessionContext.lastEntityContext && 
          lastTurn &&
          !lastTurn.response.includes("I don't have") &&
          !lastTurn.response.includes("I'm sorry, but") &&
          (Date.now() - lastTurn.timestamp) < 120000; // Within 2 minutes
        
        if (hasGoodContext) {
          // FIX #9: Use context to enhance query instead of random business search
          const lastEntity = sessionContext.lastEntityContext;
          enhancedQuery = `${userQuery} about ${lastEntity!.entityName}`;
          console.log(`  🔧 Enhanced vague query with context: "${enhancedQuery}"`);
          // Continue with enhanced query (don't return here, let it process normally)
          
        } else if (lastTurn && (
          lastTurn.response.includes("I don't have") || 
          lastTurn.response.includes("I'm sorry, but") ||
          lastTurn.response.includes("not available")
        )) {
          // FIX #2: Vague query after data gap - ask for clarification
          console.log('  ⚠️  Vague query after data gap - asking for clarification');
          
          const lastTopic = lastTurn.retrievedDocs && lastTurn.retrievedDocs.length > 0 
            ? lastTurn.retrievedDocs[0] 
            : 'that topic';
          
          // FIX #9: NO BUSINESS SEARCH FALLBACK - just ask for clarification
          return {
            answer: `Could you please clarify your question? For example: "What time does the pool open?" or "How much is the ${lastTopic}?" I want to make sure I give you the right information.`,
            context: { businesses: [], documents: [] },
            confidence: 'low',
            sources: 0
          };
        } else {
          // FIX #9: NO CONTEXT AT ALL - ask for clarification (don't show random businesses)
          console.log('  ⚠️  Vague query without valid context - asking for clarification');
          return {
            answer: `Could you please clarify your question? For example: "What time does the pool open?" or "How much is a dog license?" I want to make sure I give you the right information.`,
            context: { businesses: [], documents: [] },
            confidence: 'low',
            sources: 0
          };
        }
      }

      const context: RAGContext = {
        businesses: [],
        documents: [],
      };

      // CHECK FOR CONTEXT HIT (Bypass Weaviate if we have cached context)
      const cachedBusiness = this.checkContextHit(orchestratorOutput, sessionId);
      
      if (cachedBusiness) {
        // FAST PATH: Use cached context, skip Weaviate + Discriminator
        console.log('  ⚡ FAST PATH: Skipping search, using cached business');
        context.businesses = [cachedBusiness];
      } else {
        // NORMAL PATH: Run full search pipeline
        console.log('\n🔎 STAGE 2: Retrieving candidates from Weaviate...');
        
        const isBusinessQuery = this.orchestrator.isBusinessQuery(orchestratorOutput);

        if (isBusinessQuery) {
        const rawBusinesses = await this.searchBusinesses(
          orchestratorOutput.searchTerms,
          10 // Get more for filtering
        );
        
        // Convert to candidates for discriminator
        const candidates: Candidate[] = rawBusinesses.map((b, idx) => ({
          id: idx + 1,
          name: b.name,
          category: b.category,
          subcategory: b.category.split(' → ')[1] || '',
          address: b.address,
          phone: b.phone,
          description: b.description,
          score: b.score,
          type: 'business'
        }));

        console.log(`  Retrieved ${candidates.length} business candidates`);

        // STAGE 3: Discriminator - Filter irrelevant
        console.log('\n🎯 STAGE 3: Discriminator filtering candidates...');
        const discriminatorOutput = await this.discriminator.discriminate(
          userQuery,
          orchestratorOutput,
          candidates
        );

        console.log(`  Relevant: ${discriminatorOutput.relevantCandidates.length}`);
        console.log(`  Irrelevant (rejected): ${discriminatorOutput.irrelevantCandidates.length}`);
        console.log(`  Final selection: ${discriminatorOutput.finalSelection.length}`);

          // Use only discriminator-approved candidates
          context.businesses = discriminatorOutput.finalSelection
            .map(id => rawBusinesses[id - 1])
            .filter(Boolean);
        } else {
          // Use orchestrator's context-aware searchTerms, not original query
          context.documents = await this.searchDocuments(orchestratorOutput.searchTerms, 5);
        }
      } // End of else block for context hit check

      // Build context string (pass userQuery for intelligent chunking)
      const contextStr = this.buildContext(context, userQuery);

      // STAGE 4: Generate response with xAI
      console.log('\n💬 STAGE 4: Generating response with xAI Grok...');
      console.log(`  Query Scope: ${orchestratorOutput.queryScope}`);
      
      // Get last entity for context-aware system prompt
      const lastEntity = this.sessionManager.getLastEntity(sessionId);
      const conversationContext = lastEntity && sessionContext.conversationHistory.length > 0
        ? `\n\nCONVERSATION CONTEXT:\n- Previous topic discussed: ${lastEntity.entityName}\n- User is asking a FOLLOW-UP question about this topic\n- CRITICAL: Answer ONLY from the provided context documents\n- DO NOT switch topics or mention programs not in the context\n- If context lacks information, say "I don't have that information about ${lastEntity.entityName}"\n`
        : '';
      
      const answer = await this.generatorClient.generateResponse(
        this.getSystemPrompt(orchestratorOutput.queryScope, userQuery) + conversationContext,
        userQuery,
        contextStr,
        {
          temperature: 0.7,
          max_tokens: 800,
        }
      );

      // Check if AI is asking a clarification question
      const aiAskedQuestion = answer.trim().endsWith('?') || 
                              answer.includes('what are you planning') ||
                              answer.includes('What are you planning') ||
                              answer.includes('could you clarify') ||
                              answer.includes('Could you clarify') ||
                              answer.includes('please specify') ||
                              answer.includes('Please specify') ||
                              answer.includes('more details') ||
                              answer.includes('If you have more') ||
                              answer.includes('please let me know') ||
                              answer.includes('I can try to provide') ||
                              answer.toLowerCase().includes('what type') ||
                              answer.toLowerCase().includes('which type');

      // Store in session conversation history
      const updatedHistory = [
        ...sessionContext.conversationHistory,
        {
          query: userQuery,
          response: answer,
          retrievedDocs: [
            ...context.businesses.map(b => b.name),
            ...context.documents.map(d => d.title)
          ],
          aiAskedQuestion,  // Track if AI asked a question
          pendingClarification: aiAskedQuestion ? userQuery : undefined,  // What topic AI asked about
          timestamp: Date.now()
        }
      ];

      // Keep only last 5 turns
      const trimmedHistory = updatedHistory.length > 5 
        ? updatedHistory.slice(-5) 
        : updatedHistory;

      // Update session with conversation history
      this.sessionManager.updateSession(sessionId, {
        conversationHistory: trimmedHistory
      });

      // Store ENTITY context for follow-up questions (businesses, documents, or topics)
      if (context.businesses.length > 0) {
        this.sessionManager.updateLastEntity(
          sessionId,
          'business',
          context.businesses[0].name,
          context.businesses[0],
          orchestratorOutput.intent
        );
      } else if (context.documents.length > 0) {
        this.sessionManager.updateLastEntity(
          sessionId,
          'document',
          context.documents[0].title,
          context.documents[0],
          orchestratorOutput.intent
        );
      } else if (orchestratorOutput.categoryHints.length > 0) {
        // Store topic if no specific business/document
        this.sessionManager.updateLastEntity(
          sessionId,
          'topic',
          orchestratorOutput.categoryHints[0],
          { category: orchestratorOutput.categoryHints[0] },
          orchestratorOutput.intent
        );
      }

      // Determine confidence
      const totalSources = context.businesses.length + context.documents.length;
      const avgScore =
        totalSources > 0
          ? ([...context.businesses, ...context.documents].reduce(
              (sum, item) => sum + item.score,
              0
            ) /
            totalSources)
          : 0;

      const confidence: 'high' | 'medium' | 'low' =
        avgScore > 0.8 && totalSources >= 3
          ? 'high'
          : avgScore > 0.6 || totalSources >= 2
          ? 'medium'
          : 'low';

      console.log('✅ Complete!\n');

      return {
        answer,
        context,
        confidence,
        sources: totalSources,
      };
    } catch (error) {
      console.error('RAG query error:', error);
      throw new Error('Failed to process query');
    }
  }

  async close() {
    if (this.weaviateClient) {
      await this.weaviateClient.close();
      this.weaviateClient = null;
    }
  }
}

// Singleton instance
let ragSystemInstance: RAGSystem | null = null;

export function getRAGSystem(): RAGSystem {
  if (!ragSystemInstance) {
    ragSystemInstance = new RAGSystem(
      process.env.WEAVIATE_URL || '',
      process.env.WEAVIATE_API_KEY || '',
      process.env.HUGGINGFACE_API_KEY || '',
      process.env.XAI_API_KEY || '',
      process.env.GROQ_API_KEY,  // Optional: Use Groq for orchestrator/discriminator
      process.env.USE_GROQ_FOR_GENERATION === 'true'  // NEW: Use Groq for final generation too (saves credits!)
    );
  }
  return ragSystemInstance;
}

