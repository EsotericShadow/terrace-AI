import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received Stripe webhook:', event.type);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout session completed:', session.id);
  
  if (session.mode === 'subscription' && session.subscription) {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Update business plan to Pro in Weaviate
    await updateBusinessPlan(session.customer as string, {
      tier: 'pro',
      status: 'active',
      stripeCustomerId: session.customer as string,
      stripeSubId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  if (invoice.subscription) {
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    
    // Update business plan status
    await updateBusinessPlan(invoice.customer as string, {
      tier: 'pro',
      status: 'past_due',
      stripeCustomerId: invoice.customer as string,
      stripeSubId: subscription.id,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  // Downgrade business plan to free
  await updateBusinessPlan(subscription.customer as string, {
    tier: 'free',
    status: 'inactive',
    stripeCustomerId: subscription.customer as string,
    stripeSubId: subscription.id,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  // Update business plan based on subscription status
  const status = subscription.status === 'active' ? 'active' : 'inactive';
  
  await updateBusinessPlan(subscription.customer as string, {
    tier: 'pro',
    status,
    stripeCustomerId: subscription.customer as string,
    stripeSubId: subscription.id,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
  });
}

async function updateBusinessPlan(customerId: string, planData: any) {
  try {
    // Update BusinessPlan in Weaviate
    const updateQuery = {
      query: `mutation {
        Update {
          BusinessPlan(
            where: {
              path: ["stripeCustomerId"]
              operator: Equal
              valueText: "${customerId}"
            }
            set: {
              tier: "${planData.tier}"
              status: "${planData.status}"
              stripeCustomerId: "${planData.stripeCustomerId}"
              stripeSubId: "${planData.stripeSubId}"
              currentPeriodEnd: "${planData.currentPeriodEnd}"
            }
          ) {
            _additional {
              id
            }
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
      body: JSON.stringify(updateQuery)
    });

    if (!response.ok) {
      console.error('Failed to update business plan in Weaviate:', response.status);
    } else {
      console.log('Business plan updated successfully');
    }
  } catch (error) {
    console.error('Error updating business plan:', error);
  }
}

