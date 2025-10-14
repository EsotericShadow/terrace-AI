// src/lib/discriminator-xai.ts
// Document relevance filtering using xAI Grok or Groq with SNS

import { XAIClient } from './xai-client';
import { GroqClient } from './groq-client';
import { OrchestratorOutput, ConversationTurn } from './orchestrator-xai';

export interface Candidate {
  id: number;
  name: string;
  category: string;
  subcategory: string;
  address: string;
  phone: string;
  description: string;
  score: number;
  type: 'business' | 'document';
  // For documents
  title?: string;
  summary?: string;
}

export interface DiscriminatorOutput {
  relevantCandidates: number[];
  irrelevantCandidates: number[];
  rankings: {
    id: number;
    confidence: number;
    relevance: 'HIGH' | 'MEDIUM' | 'LOW';
    reason: string;
  }[];
  finalSelection: number[];
}

const DISCRIMINATOR_JSON_PROMPT = `You are a result filter for Terrace business/document search. Analyze candidates and return ONLY valid JSON.

CRITICAL RULES:
- Be STRICT: topic must match, not just keywords
- Reject keyword-only matches (e.g., "Safeway" query ≠ "SAFE-T Safety" business)
- For business queries: category must be relevant (e.g., HVAC query requires hvac category)
- Return top 1-3 most relevant results

Required JSON structure:
{
  "relevantCandidates": [1, 2, 3],
  "irrelevantCandidates": [4, 5],
  "rankings": [
    {"id": 1, "confidence": 0.95, "relevance": "HIGH", "reason": "exact category match"},
    {"id": 2, "confidence": 0.78, "relevance": "MEDIUM", "reason": "related category"}
  ],
  "finalSelection": [1, 2]
}

Return ONLY the JSON object, no explanations.`;

export class DiscriminatorXAI {
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

  private buildCandidatesPEL(candidates: Candidate[]): string {
    return candidates
      .map((c) => {
        const catInfo = c.type === 'business' 
          ? `category: ${c.category} subcategory: ${c.subcategory}`
          : `doc_type: document category: ${c.category}`;
        
        const nameInfo = c.type === 'business'
          ? `name: ${c.name}`
          : `title: ${c.title}`;

        return `CANDIDATE_${c.id}:
  ${nameInfo}
  ${catInfo}
  ${c.type === 'business' ? `address: ${c.address}` : `summary: ${c.summary?.slice(0, 100)}`}
  retrieval_score: ${c.score.toFixed(2)}`;
      })
      .join('\n\n');
  }

  async discriminate(
    originalQuery: string,
    orchestratorOutput: OrchestratorOutput,
    candidates: Candidate[],
    maxResults?: number
  ): Promise<DiscriminatorOutput> {
    // For specific business queries, be VERY strict - only return exact match
    if (orchestratorOutput.queryScope === 'specific_business' && orchestratorOutput.specificBusinessName) {
      const exactMatch = candidates.find(c => 
        c.name.toLowerCase().includes(orchestratorOutput.specificBusinessName!.toLowerCase()) ||
        orchestratorOutput.specificBusinessName!.toLowerCase().includes(c.name.toLowerCase())
      );

      if (exactMatch) {
        return {
          relevantCandidates: [exactMatch.id],
          irrelevantCandidates: candidates.filter(c => c.id !== exactMatch.id).map(c => c.id),
          rankings: [{
            id: exactMatch.id,
            confidence: 0.95,
            relevance: 'HIGH',
            reason: 'exact_business_name_match'
          }],
          finalSelection: [exactMatch.id]
        };
      }
    }
    const candidatesPEL = this.buildCandidatesPEL(candidates);

    const userMessage = `ORIGINAL_QUERY: ${originalQuery}
EXTRACTED_KEYWORDS: ${orchestratorOutput.keywords.join(' ')}
INTENT: ${orchestratorOutput.intent}
QUERY_TYPE: ${orchestratorOutput.queryType}
CATEGORY_HINTS: ${orchestratorOutput.categoryHints.join(' ')}

RETRIEVED_CANDIDATES: ${candidates.length}

${candidatesPEL}

Filter these candidates and identify which are truly relevant to the query.`;

    try {
      const response = await this.llmClient.createChatCompletion(
        [
          { role: 'system', content: DISCRIMINATOR_JSON_PROMPT },
          { role: 'user', content: userMessage }
        ],
        { 
          temperature: 0.2, 
          max_tokens: 500,
          response_format: { type: 'json_object' }
        }
      );

      const output = response.choices[0]?.message?.content || '';
      return this.parseJSONOutput(output, candidates);
    } catch (error) {
      console.error('Discriminator error:', error);

      // Fallback: use top 3 by score
      const topIds = candidates.slice(0, 3).map(c => c.id);

      return {
        relevantCandidates: topIds,
        irrelevantCandidates: [],
        rankings: topIds.map(id => ({
          id,
          confidence: candidates[id - 1].score,
          relevance: 'MEDIUM',
          reason: 'fallback_top_score'
        })),
        finalSelection: topIds
      };
    }
  }

  private parseJSONOutput(jsonText: string, candidates: Candidate[]): DiscriminatorOutput {
    try {
      const parsed = JSON.parse(jsonText);
      
      const result: DiscriminatorOutput = {
        relevantCandidates: parsed.relevantCandidates || [],
        irrelevantCandidates: parsed.irrelevantCandidates || [],
        rankings: parsed.rankings || [],
        finalSelection: parsed.finalSelection || []
      };

      // Fallback if parsing succeeded but data is incomplete
      if (result.finalSelection.length === 0 && result.relevantCandidates.length > 0) {
        result.finalSelection = result.relevantCandidates.slice(0, 3);
      }

      // Ultimate fallback
      if (result.finalSelection.length === 0) {
        result.finalSelection = candidates.slice(0, 3).map(c => c.id);
      }

      return result;
    } catch (error) {
      console.error('Discriminator JSON parse error:', error);
      console.error('Raw output:', jsonText);
      
      // Fallback: use top 3 by score
      const topIds = candidates.slice(0, 3).map(c => c.id);

      return {
        relevantCandidates: topIds,
        irrelevantCandidates: [],
        rankings: topIds.map(id => ({
          id,
          confidence: candidates[id - 1]?.score || 0.5,
          relevance: 'MEDIUM',
          reason: 'fallback_top_score'
        })),
        finalSelection: topIds
      };
    }
  }
}

