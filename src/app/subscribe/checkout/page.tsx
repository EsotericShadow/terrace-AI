'use client';

import { useState, useEffect, Suspense } from 'react';
import { CheckCircle, XCircle, Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function CheckoutContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'cancelled'>('loading');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    const success = searchParams.get('success');
    const cancelled = searchParams.get('cancelled');

    if (cancelled === 'true') {
      setStatus('cancelled');
    } else if (success === 'true' && sessionIdParam) {
      setStatus('success');
      setSessionId(sessionIdParam);
    } else if (success === 'false') {
      setStatus('error');
    } else {
      // Redirect to Stripe Checkout
      redirectToCheckout();
    }
  }, [searchParams]);

  const redirectToCheckout = async () => {
    try {
      const response = await fetch('/api/subscribe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const { url } = await response.json();
        window.location.href = url;
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terrace-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Setting up your Pro subscription...</h1>
            <p className="text-gray-600">Redirecting to secure checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Pro!</h1>
            <p className="text-gray-600 mb-6">
              Your Pro subscription is now active. You can now edit your business details, add products, and get priority placement in search results.
            </p>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-green-800">
                <Crown className="h-5 w-5" />
                <span className="font-medium">Pro Features Unlocked:</span>
              </div>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Edit business information anytime</li>
                <li>• Add products and services</li>
                <li>• Priority placement in search results</li>
                <li>• View detailed analytics</li>
                <li>• Create special offers and announcements</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Link
                href="/owner"
                className="inline-flex items-center space-x-2 bg-terrace-600 text-white px-6 py-3 rounded-lg hover:bg-terrace-700 transition-colors"
              >
                <span>Go to Owner Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div>
                <Link
                  href="/"
                  className="text-terrace-600 hover:text-terrace-700 text-sm"
                >
                  Return to Terrace AI
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Cancelled</h1>
            <p className="text-gray-600 mb-6">
              No worries! Your business listing remains visible with our free plan. You can upgrade to Pro anytime.
            </p>
            
            <div className="space-y-4">
              <button
                onClick={redirectToCheckout}
                className="inline-flex items-center space-x-2 bg-terrace-600 text-white px-6 py-3 rounded-lg hover:bg-terrace-700 transition-colors"
              >
                <Crown className="h-4 w-4" />
                <span>Try Pro Again</span>
              </button>
              <div>
                <Link
                  href="/owner"
                  className="text-terrace-600 hover:text-terrace-700 text-sm"
                >
                  Go to Owner Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Checkout Failed</h1>
          <p className="text-gray-600 mb-6">
            There was an error processing your payment. Please try again or contact support if the problem persists.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={redirectToCheckout}
              className="inline-flex items-center space-x-2 bg-terrace-600 text-white px-6 py-3 rounded-lg hover:bg-terrace-700 transition-colors"
            >
              <Crown className="h-4 w-4" />
              <span>Try Again</span>
            </button>
            <div>
              <Link
                href="/owner"
                className="text-terrace-600 hover:text-terrace-700 text-sm"
              >
                Return to Owner Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terrace-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h1>
            <p className="text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
