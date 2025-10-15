// src/lib/orchestrator-xai.ts
// Query decomposition using xAI Grok or Groq with SNS notation

import { XAIClient } from './xai-client';
import { GroqClient } from './groq-client';

export interface OrchestratorOutput {
  keywords: string[];
  entities: { type: string; value: string }[];
  intent: string;
  queryType: string;
  searchTerms: string;
  categoryHints: string[];
  expectedDocTypes: string[];
  conversationContext: 'followup' | 'new_topic' | 'clarification';
  queryScope: 'specific_business' | 'general_category' | 'information';
  specificBusinessName?: string;
  needsClarification?: boolean;
  isMultiQuestion?: boolean;
  subQuestions?: string[];
  metadata?: {
    userTopic?: string;
    skipBusinessSearch?: boolean;
    targetBusiness?: string;
    serviceQuery?: string;
    [key: string]: any;
  };
}

export interface ConversationTurn {
  query: string;
  response: string;
  retrievedDocs: string[];
  aiAskedQuestion?: boolean;  // Track if AI ended with "?"
  pendingClarification?: string;  // What AI is waiting to know
  timestamp: number;
}

const ORCHESTRATOR_JSON_PROMPT = `You are a query analyzer for Terrace municipal services. Analyze the user query and return ONLY valid JSON.

CRITICAL RULES:
- Business queries (find restaurant, contractor, plumber, HVAC, store, shop, etc) → intent="business_search", queryType="business_directory"
- Municipal queries (bylaws, permits, taxes, regulations, etc) → intent="info_request", queryType="municipal_procedure"
- **EXCEPTION**: Questions about business licence/permit COSTS, FEES, or REQUIREMENTS → intent="info_request", queryType="financial" (search bylaws, NOT businesses!)
  * "how much is a business licence?" → search Business Licence Consolidated Bylaw
  * "what are business permit fees?" → search bylaw documents for fees
  * "business licence cost" → search documents, not businesses
- FOLLOW-UP queries: ALWAYS check conversation history to resolve ambiguous references
  * "how much is it?" after dog license discussion → expand to "dog license cost"
  * "do you need a license?" after dog discussion → expand to "dog license requirements" (NOT business license!)
  * "what are their hours?" after business mention → expand to "{business name} hours"
  * "where is it?" after location discussion → expand to "{place} location"
- CONTEXT PRIORITY: If conversation history shows user was discussing a specific topic (e.g., dogs, permits, a business), the follow-up query is ALWAYS about that same topic unless explicitly stated otherwise
- Return ONLY the JSON object, no explanations or additional text

Required JSON structure:
{
  "keywords": ["extracted", "keywords"],
  "intent": "business_search or info_request or complaint or permit or fee or contact",
  "queryType": "business_directory or municipal_procedure or bylaw or permit or financial",
  "searchTerms": "expanded search terms with synonyms (resolve pronouns using conversation history)",
  "categoryHints": ["relevant", "categories"],
  "conversationContext": "new_topic or followup or clarification",
  "queryScope": "specific_business or general_category or information"
}

Examples:
Query: "Find HVAC contractors"
{"keywords":["HVAC","contractors"],"intent":"business_search","queryType":"business_directory","searchTerms":"HVAC heating cooling contractors air conditioning","categoryHints":["business_economy"],"conversationContext":"new_topic","queryScope":"general_category"}

Query: "What are noise bylaws?"
{"keywords":["noise","bylaws"],"intent":"info_request","queryType":"bylaw","searchTerms":"noise control bylaw regulations quiet hours","categoryHints":["bylaws"],"conversationContext":"new_topic","queryScope":"information"}

Query: "how much is a business licence?"
{"keywords":["business","licence","cost","fee"],"intent":"info_request","queryType":"financial","searchTerms":"business licence fees cost bylaw schedule rates","categoryHints":["bylaws","municipal_bylaws"],"conversationContext":"new_topic","queryScope":"information"}

Query: "how much is it?" (after discussing dog license)
{"keywords":["cost","fee","dog","license"],"intent":"info_request","queryType":"financial","searchTerms":"dog license cost fee price animal control","categoryHints":["bylaws"],"conversationContext":"followup","queryScope":"information"}

Query: "do you need a license?" (after discussing getting a dog)
{"keywords":["license","dog","requirements"],"intent":"info_request","queryType":"municipal_procedure","searchTerms":"dog license requirements animal control bylaw","categoryHints":["bylaws"],"conversationContext":"followup","queryScope":"information"}

Query: "where can I get a dog?"
{"keywords":["get","dog","buy","adopt"],"intent":"business_search","queryType":"business_directory","searchTerms":"pet stores animal shelter dog adoption pet valu blue barn","categoryHints":["retail_shopping","pet_services"],"conversationContext":"new_topic","queryScope":"general_category","metadata":{"alsoSearchBylaws":true,"bylawTopics":["animal control","dog licensing"]}}`;

export class OrchestratorXAI {
  private llmClient: XAIClient | GroqClient;
  private useGroq: boolean;

  constructor(apiKey: string, useGroq: boolean = false) {
    this.useGroq = useGroq;
    if (useGroq) {
      this.llmClient = new GroqClient(apiKey);
    } else {
      this.llmClient = new XAIClient(apiKey);
    }
  }

  private buildConversationContext(history: ConversationTurn[]): string {
    if (!history || history.length === 0) return 'none';

    // Helper: Sanitize Unicode characters for ByteString compatibility
    const sanitizeText = (text: string): string => {
      // Replace non-ASCII characters with ASCII equivalents or remove them
      return text
        .normalize('NFD') // Decompose Unicode characters
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
        .replace(/[^\x00-\x7F]/g, '') // Remove any remaining non-ASCII characters
        .trim();
    };

    const recent = history.slice(-3);
    return recent
      .map((turn, idx) => {
        const offset = idx - recent.length;
        // Include both query AND response summary for context
        // Sanitize to prevent Unicode ByteString errors
        const responseSummary = sanitizeText(
          turn.response.length > 150 
            ? turn.response.substring(0, 150).trim() + '...' 
            : turn.response
        );
        const query = sanitizeText(turn.query);
        const docs = turn.retrievedDocs.length > 0 
          ? ` | retrieved_docs=[${turn.retrievedDocs.slice(0, 2).map(d => sanitizeText(d)).join(', ')}]` 
          : '';
        return `TURN_${offset}:\n  User: "${query}"\n  AI: "${responseSummary}"${docs}`;
      })
      .join('\n\n');
  }

  private parseJSONOutput(jsonText: string): OrchestratorOutput {
    try {
      const parsed = JSON.parse(jsonText);
      return {
        keywords: parsed.keywords || [],
        entities: [],
        intent: parsed.intent || '',
        queryType: parsed.queryType || '',
        searchTerms: parsed.searchTerms || '',
        categoryHints: parsed.categoryHints || [],
        expectedDocTypes: [],
        conversationContext: parsed.conversationContext || 'new_topic',
        queryScope: parsed.queryScope || 'general_category',
        specificBusinessName: parsed.specificBusinessName,
        isMultiQuestion: false,
        subQuestions: []
      };
    } catch (error) {
      console.error('JSON parse error:', error);
      console.error('Raw output:', jsonText);
      
      // Fallback to safe defaults
      return {
        keywords: [],
        entities: [],
        intent: 'info_request',
        queryType: 'municipal_procedure',
        searchTerms: '',
        categoryHints: [],
        expectedDocTypes: [],
        conversationContext: 'new_topic',
        queryScope: 'general_category',
        specificBusinessName: undefined,
        isMultiQuestion: false,
        subQuestions: []
      };
    }
  }

  private detectPronounReference(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // FIX #4: Check for LOCAL REFERENTS first
    // If pronoun has a referent in the SAME sentence, it's not referring to conversation history
    // Example: "my kid wants to learn... sign THEM up" → "them" refers to "kid" in same sentence
    const hasLocalReferent = /\b(my|the|a|an|this|that)\s+\w+.*\b(them|they|their|it|he|she|his|her)\b/i.test(query);
    if (hasLocalReferent) {
      console.log(`  → Pronoun detected BUT has local referent in same sentence - not a conversation reference`);
      return false;  // Don't treat as pronoun reference
    }
    
    // Use WORD BOUNDARY REGEX to avoid false positives
    // \b ensures we match whole words only, not substrings like "nite" containing "it"
    const pronounPatterns = [
      /\b(their|theyre|they're)\b/,     // "their hours" ✓, "neither" ✗
      /\bthey\b/,                        // "they offer" ✓, "they're" handled above
      /\b(its|it's)\b/,                  // "it's open" ✓, "write" ✗
      /\bit\b/,                          // "is it open" ✓, "website" ✗, "nite" ✗
      /\bthem\b/,                        // "call them" ✓, "items" ✗
      /\bwe\b/,                          // "we qualify" ✓, "week" ✗, "tweet" ✗
      /\bwhich\b/,                       // "which one" ✓
      /\bthat\b/,                        // "that place" ✓
      /\bthis\b/,                        // "this business" ✓
    ];
    
    // Special handling for "one" (avoid "phone", "done", "money")
    if (/\b(which|that|this)\s+one\b|\bone\s+(is|has|does|offers)\b/.test(lowerQuery)) {
      return true;
    }
    
    return pronounPatterns.some(pattern => pattern.test(lowerQuery));
  }
  
  private detectCostQuery(query: string): boolean {
    // FIX #5: Detect cost-related queries to avoid matching business names
    // Example: "whats the price" should NOT match "R & A Price Leasing" business
    const lowerQuery = query.toLowerCase().trim();
    
    // Cost query patterns
    const costPatterns = [
      /^(what'?s?|whats?) (the )?(price|cost|fee|rate|charge)/i,  // "whats the price"
      /^how much/i,                                                  // "how much"
      /^(what|how) (much|expensive)/i,                              // "how expensive"
      /^(tell|give) me (the )?(price|cost|fee)/i,                   // "tell me the price"
    ];
    
    return costPatterns.some(pattern => pattern.test(lowerQuery));
  }

  private extractUserTopic(query: string): string {
    // FIX #6: Extract semantic topic from user query (not document title)
    // This ensures follow-up questions maintain the USER'S topic, not last retrieved document
    const topicPatterns = [
      { pattern: /(water|utility)\s*(bill|billing|charge|rate|high|expensive)/i, topic: 'water billing' },
      { pattern: /(trailer|rv|vehicle|camper)\s*(parking|storage|park)/i, topic: 'trailer parking' },
      { pattern: /building\s*permit/i, topic: 'building permit' },
      { pattern: /home\s*(business|occupation)/i, topic: 'home business' },
      { pattern: /business\s*licen/i, topic: 'business license' },
      { pattern: /dog\s*licen/i, topic: 'dog license' },
      { pattern: /(noise|sound|loud)\s*(bylaw|complain|issue)/i, topic: 'noise bylaw' },
      { pattern: /park.*trailer|trailer.*park/i, topic: 'trailer parking' },
      { pattern: /tree.*cut|cut.*tree|remove.*tree/i, topic: 'tree removal' },
      { pattern: /(hall|room|facility)\s*(rental|rent|book)/i, topic: 'facility rental' },
      { pattern: /swimming\s*lesson/i, topic: 'swimming lessons' },
      { pattern: /barking\s*dog|dog.*bark/i, topic: 'barking dog complaint' },
    ];
    
    for (const {pattern, topic} of topicPatterns) {
      if (pattern.test(query)) {
        console.log(`  🎯 Extracted topic: "${topic}" from query`);
        return topic;
      }
    }
    
    // Fallback: use first 40 chars as topic
    return query.slice(0, 40).trim();
  }

  private detectServiceAttributeQuery(
    query: string, 
    conversationHistory: ConversationTurn[]
  ): boolean {
    // FIX #7: Detect when user is asking about SERVICE ATTRIBUTES of a business
    // Example: "do they take insurance" → asking about dentist's insurance policy
    // NOT trying to find an insurance agency business
    
    // Ambiguous words that are both service attributes AND business categories
    const ambiguousWords = [
      'insurance', 'credit', 'financing', 'delivery', 'catering',
      'tax', 'legal', 'accounting', 'rating', 'reviews', 'certified',
      'licensed', 'warranty', 'guarantee'
    ];
    
    // Patterns indicating service inquiry about a business
    const servicePatterns = [
      /^(do|does|can|will)\s+(they|it|he|she|you)/i,
      /^(what'?s?|whats?)\s+(their|its|your)/i,
      /^(are|is)\s+(they|it|he|she)/i,
      /^(how'?s?|hows?)\s+(their|its|your)/i
    ];
    
    const hasAmbiguousWord = ambiguousWords.some(word => 
      new RegExp(`\\b${word}\\b`, 'i').test(query)
    );
    
    const matchesServicePattern = servicePatterns.some(p => p.test(query.trim()));
    
    // Check if last entity in conversation was a business (not a document/bylaw)
    const lastBusiness = conversationHistory.length > 0 &&
      conversationHistory[conversationHistory.length - 1].retrievedDocs?.some(d => 
        !d.includes('.pdf') && !d.includes('bylaw') && !d.includes('extracted')
      );
    
    if (hasAmbiguousWord && matchesServicePattern && lastBusiness) {
      console.log(`  💼 Service attribute query detected! Word: "${ambiguousWords.find(w => query.toLowerCase().includes(w))}"`);
      return true;
    }
    
    return false;
  }

  private extractSemanticTopic(filename: string): string {
    // Remove file extensions and clean up
    let topic = filename.replace(/_extracted\.json|\.pdf/gi, '');
    
    // Parse common patterns and return human-readable topics
    if (topic.toLowerCase().includes('tax') && topic.toLowerCase().includes('exempt')) return 'tax exemption policy';
    if (topic.toLowerCase().includes('animal') && topic.toLowerCase().includes('control')) return 'animal control bylaw';
    if (topic.toLowerCase().includes('noise') && topic.toLowerCase().includes('control')) return 'noise bylaw';
    if (topic.toLowerCase().includes('noise')) return 'noise regulations';
    if (topic.toLowerCase().includes('permit') && topic.toLowerCase().includes('building')) return 'building permit process';
    if (topic.toLowerCase().includes('owner') && topic.toLowerCase().includes('building')) return 'building permit guidelines';
    if (topic.toLowerCase().includes('pool') && topic.toLowerCase().includes('swim')) return 'swimming pool regulations';
    if (topic.toLowerCase().includes('zoning')) return 'zoning regulations';
    if (topic.toLowerCase().includes('business') && topic.toLowerCase().includes('licen')) return 'business license requirements';
    if (topic.toLowerCase().includes('dog') || topic.toLowerCase().includes('cat')) return 'animal control';
    if (topic.toLowerCase().includes('recreation') && topic.toLowerCase().includes('access')) return 'recreation assistance programs';
    if (topic.toLowerCase().includes('snow') && topic.toLowerCase().includes('removal')) return 'snow removal program';
    
    // Generic: convert underscores/hyphens to spaces, remove numbers, clean up
    topic = topic.replace(/[0-9\-_%.]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Return first 50 characters as readable topic
    return topic.substring(0, 50).trim() || filename;
  }

  private extractBusinessFromHistory(history: ConversationTurn[]): string | undefined {
    if (!history || history.length === 0) return undefined;
    
    // Look at the most recent turn
    const lastTurn = history[history.length - 1];
    if (lastTurn.retrievedDocs && lastTurn.retrievedDocs.length > 0) {
      const rawName = lastTurn.retrievedDocs[0];
      
      // Convert filename to semantic topic for better LLM understanding
      return this.extractSemanticTopic(rawName);
    }
    
    return undefined;
  }

  async decompose(
    userQuery: string,
    conversationHistory: ConversationTurn[] = []
  ): Promise<OrchestratorOutput> {
    // FIX #6: Extract user topic FIRST (for all queries)
    const userTopic = this.extractUserTopic(userQuery);
    
    // FIX #7: SERVICE ATTRIBUTE QUERY DETECTION (Check FIRST!)
    // Example: "do they take insurance" after dentist → service inquiry, NOT insurance business search
    if (this.detectServiceAttributeQuery(userQuery, conversationHistory)) {
      const lastBusiness = conversationHistory[conversationHistory.length - 1]?.retrievedDocs?.[0] || 'that business';
      console.log(`  💼 Service attribute query - bypassing business search for: ${lastBusiness}`);
      
      return {
        keywords: [],
        entities: [],
        intent: 'service_inquiry',
        queryType: 'business_attribute',
        searchTerms: '',
        categoryHints: [],
        expectedDocTypes: [],
        conversationContext: 'followup',
        queryScope: 'specific_business',
        metadata: {
          skipBusinessSearch: true,
          targetBusiness: lastBusiness,
          serviceQuery: userQuery,
          userTopic: lastBusiness
        }
      };
    }
    
    // FIX #5: COST QUERY DETECTION
    // Detect cost queries BEFORE pronoun/business detection to avoid matching business names
    // Example: "whats the price" should use last entity context, NOT search for "Price" business
    if (this.detectCostQuery(userQuery) && conversationHistory.length > 0) {
      // Find the last SUCCESSFUL entity (not a data gap response)
      let contextEntity = '';
      
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const turn = conversationHistory[i];
        
        // Skip turns where AI admitted data gaps
        const admittedGap = turn.response.includes("I don't have") || 
                            turn.response.includes("I'm sorry, but") ||
                            turn.response.includes("not available in");
        
        if (!admittedGap && turn.retrievedDocs && turn.retrievedDocs.length > 0) {
          contextEntity = turn.retrievedDocs[0];
          console.log(`  💰 Cost query detected! Using last SUCCESSFUL entity: ${contextEntity} (from ${i + 1} turns ago)`);
          break;
        }
      }
      
      if (contextEntity) {
        // Enhance query with context instead of searching for new business
        userQuery = `${userQuery} for ${contextEntity}`;
        
        // Return orchestrator output focused on the contextual cost query
        return {
          keywords: ['cost', 'price', 'fee', contextEntity],
          entities: [{ type: 'service', value: contextEntity }],
          intent: 'fee_inquiry',
          queryType: 'information',
          searchTerms: `${contextEntity} cost price fee rate`,
          categoryHints: [],
          expectedDocTypes: ['financial', 'recreation', 'permits'],
          conversationContext: 'followup',
          queryScope: 'information',
          specificBusinessName: undefined,
          needsClarification: false,
          metadata: {
            userTopic
          }
        };
      }
    }
    
    // DETERMINISTIC PRONOUN RESOLUTION
    // If query has pronouns ("their", "them", "it") and we have recent context, inject business name
    let enhancedQuery = userQuery;
    let injectedBusinessName: string | undefined;
    
    if (this.detectPronounReference(userQuery)) {
      // Check if we have conversation history
      if (conversationHistory.length === 0) {
        // NO CONTEXT AVAILABLE - User started with pronoun
        console.log(`  ⚠️  Pronoun detected but no context available!`);
        
        // Mark this as needing clarification
        return {
          keywords: ['clarification', 'needed'],
          entities: [],
          intent: 'clarification_needed',
          queryType: 'information',
          searchTerms: userQuery,
          categoryHints: [],
          expectedDocTypes: [],
          conversationContext: 'new_topic',
          queryScope: 'information',
          specificBusinessName: undefined,
          needsClarification: true,
          metadata: {
            userTopic
          }
        };
      }
      
      // NORMAL CASE: We have context
      const businessName = this.extractBusinessFromHistory(conversationHistory);
      if (businessName) {
        injectedBusinessName = businessName;
        // Enhance query by adding the business name for context
        enhancedQuery = `${userQuery} (referring to ${businessName})`;
        console.log(`  → Pronoun detected! Injecting business context: ${businessName}`);
      }
    }

    const contextPEL = this.buildConversationContext(conversationHistory);

    const userMessage = contextPEL !== 'none'
      ? `CONVERSATION_HISTORY:
${contextPEL}

CURRENT_USER_QUERY: ${enhancedQuery}

CRITICAL INSTRUCTIONS FOR FOLLOW-UP QUERIES:
- If the query is vague or uses pronouns ("it", "they", "that") or is incomplete ("how much?", "do you need a license?"), it is ALWAYS referring to the topic in the conversation history
- Look at what the user was asking about in TURN_-1 (most recent)
- Expand searchTerms to include the SPECIFIC TOPIC from conversation history
- Example: If user asked about "dogs" then asks "do you need a license?", expand to "dog license requirements" NOT "business license"
- Example: If user asked about "permits" then asks "how much is it?", expand to "permit fees cost"
- NEVER default to business licensing when the conversation is clearly about something else (dogs, permits, parking, etc.)

Output JSON:`
      : `USER_QUERY: ${enhancedQuery}

Output JSON:`;

    try {
      const response = await this.llmClient.createChatCompletion(
        [
          { role: 'system', content: ORCHESTRATOR_JSON_PROMPT },
          { role: 'user', content: userMessage }
        ],
        { 
          temperature: 0.3, 
          max_tokens: 300,
          response_format: { type: 'json_object' }
        }
      );

      const output = response.choices[0]?.message?.content || '';
      console.log(`  📝 Orchestrator JSON output:\n${output.substring(0, 200)}...`);
      const result = this.parseJSONOutput(output);
      console.log(`  ✅ Parsed - Intent: "${result.intent}", QueryType: "${result.queryType}"`);
      
      // Override with injected business name if we detected a pronoun
      if (injectedBusinessName && result.queryScope !== 'information') {
        result.queryScope = 'specific_business';
        result.specificBusinessName = injectedBusinessName;
      }
      
      // FIX #6: Add userTopic to metadata
      result.metadata = {
        ...result.metadata,
        userTopic
      };
      
      return result;
    } catch (error) {
      console.error('Orchestrator error:', error);
      
      // Fallback: simple keyword extraction
      const keywords = userQuery
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !['what', 'how', 'where', 'when', 'the', 'and'].includes(w));

      return {
        keywords,
        entities: [],
        intent: 'information_request',
        queryType: 'municipal_procedure',
        searchTerms: userQuery,
        categoryHints: [],
        expectedDocTypes: [],
        conversationContext: 'new_topic',
        queryScope: 'general_category',
        specificBusinessName: undefined,
        metadata: {
          userTopic
        }
      };
    }
  }

  isBusinessQuery(decomposed: OrchestratorOutput): boolean {
    return decomposed.queryType === 'business_directory' ||
           decomposed.intent === 'business_search' ||
           decomposed.categoryHints.some(c => c.includes('business_economy'));
  }
}

