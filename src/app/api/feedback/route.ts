// src/app/api/feedback/route.ts
// Collect user feedback on AI responses for data quality improvement

import { NextRequest, NextResponse } from 'next/server';

const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

interface FeedbackRequest {
  message: string;
  feedbackType: 'correction' | 'addition' | 'wrong';
  feedbackText: string;
  businesses: string[];
  documents: string[];
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      feedbackType,
      feedbackText,
      businesses,
      documents,
      timestamp
    }: FeedbackRequest = await request.json();

    if (!feedbackText || !feedbackType) {
      return NextResponse.json(
        { error: 'Feedback text and type are required' },
        { status: 400 }
      );
    }

    // Store feedback in Weaviate for review
    // Future: Migrate to Postgres for better management
    const feedbackData = {
      query: message,
      feedbackType,
      feedbackText,
      relatedBusinesses: businesses,
      relatedDocuments: documents,
      timestamp,
      status: 'pending',
      reviewed: false
    };

    try {
      const weaviateFullUrl = WEAVIATE_URL.startsWith('http') ? WEAVIATE_URL : `https://${WEAVIATE_URL}`;
      const response = await fetch(`${weaviateFullUrl}/v1/objects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
        },
        body: JSON.stringify({
          class: 'UserFeedback',
          properties: feedbackData
        })
      });

      if (!response.ok) {
        console.error('Failed to store feedback in Weaviate:', await response.text());
        // Don't fail - just log it
      }
    } catch (error) {
      console.error('Error storing feedback:', error);
      // Don't fail - feedback is nice-to-have
    }

    // Log for immediate review (until admin dashboard built)
    console.log('📝 USER FEEDBACK RECEIVED:');
    console.log(`   Type: ${feedbackType}`);
    console.log(`   Query: ${message.substring(0, 100)}...`);
    console.log(`   Feedback: ${feedbackText}`);
    console.log(`   Related: ${[...businesses, ...documents].join(', ')}`);

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We will review and improve our data.'
    });

  } catch (error: any) {
    console.error('Feedback API error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

