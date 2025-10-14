import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(request: NextRequest) {
  try {
    // Get the base URL for redirects
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!, // This should be your $30/month price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/subscribe/checkout?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe/checkout?cancelled=true`,
      metadata: {
        // Add any business-specific metadata here
        source: 'terrace_ai_web',
      },
      subscription_data: {
        metadata: {
          // Add subscription metadata
          plan: 'pro',
          source: 'terrace_ai_web',
        },
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

