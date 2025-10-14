// src/app/api/chat-rag/route.ts
// RAG-powered chat endpoint using Weaviate + xAI

import { NextRequest, NextResponse } from 'next/server';
import { getRAGSystem } from '@/lib/rag-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId: clientSessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract session ID from body, headers, or generate new one
    const sessionId = clientSessionId || 
                      request.headers.get('X-Session-ID') || 
                      `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`  📡 API Request - Session: ${sessionId.slice(0, 10)}... | Msg: ${message.slice(0, 30)}...`);

    // Check environment variables
    if (!process.env.WEAVIATE_URL || !process.env.WEAVIATE_API_KEY) {
      return NextResponse.json(
        { error: 'Weaviate configuration missing' },
        { status: 500 }
      );
    }

    if (!process.env.XAI_API_KEY) {
      return NextResponse.json(
        { error: 'xAI API key missing' },
        { status: 500 }
      );
    }

    // Get RAG system instance
    const ragSystem = getRAGSystem();

    // Process query with session ID
    const response = await ragSystem.query(message, sessionId);

    return NextResponse.json({
      success: true,
      answer: response.answer,
      businesses: response.context.businesses,
      documents: response.context.documents,
      confidence: response.confidence,
      sources: response.sources,
    });

  } catch (error: any) {
    console.error('Chat RAG API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

