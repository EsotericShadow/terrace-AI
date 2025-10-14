'use client';

import { useState, useEffect } from 'react';
import { Building2, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  fullAddress: string;
}

export default function BusinessRemovePage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [multipleBusinesses, setMultipleBusinesses] = useState(false);

  // Search businesses based on search term
  const searchBusinesses = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/businesses/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.businesses || []);
        setHasSearched(true);
      } else {
        setError('Search failed. Please try again.');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Search failed. Please try again.');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        searchBusinesses(searchTerm);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle business selection (single or multiple)
  const handleBusinessSelect = (businessId: string) => {
    if (multipleBusinesses) {
      setSelectedBusinesses(prev => 
        prev.includes(businessId) 
          ? prev.filter(id => id !== businessId)
          : [...prev, businessId]
      );
    } else {
      setSelectedBusinesses([businessId]);
    }
  };

  // Toggle multiple business mode
  const toggleMultipleBusinesses = () => {
    setMultipleBusinesses(!multipleBusinesses);
    if (!multipleBusinesses) {
      setSelectedBusinesses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/business/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          phone,
          businessIds: selectedBusinesses,
          reason,
          multipleBusinesses,
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit removal request');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Removal Request Submitted</h1>
            <p className="text-gray-600 mb-6">
              Your business removal request has been submitted for {selectedBusinesses.length} business{selectedBusinesses.length > 1 ? 'es' : ''}. We'll contact you at the phone number you provided within 1-2 business days to verify your ownership before processing the removal.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Verification Required</h4>
                  <p className="text-sm text-yellow-800">
                    We'll call you to verify that you're the legitimate owner of the business{selectedBusinesses.length > 1 ? 'es' : ''} before removing the listing{selectedBusinesses.length > 1 ? 's' : ''} from Terrace AI.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-block bg-terrace-600 text-white px-6 py-2 rounded-lg hover:bg-terrace-700 transition-colors"
              >
                Return to Terrace AI
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-8">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Remove Your Business</h1>
              <p className="text-gray-600">Request to remove your business from Terrace AI</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-2">Important:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>Free removal:</strong> No charges for removing your listing</li>
                  <li>• <strong>Verification required:</strong> We'll contact you to verify ownership before removal</li>
                  <li>• <strong>Permanent:</strong> Your business will be completely removed from Terrace AI</li>
                  <li>• <strong>Reversible:</strong> You can always claim your business again later</li>
                </ul>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="business-search" className="block text-sm font-medium text-gray-700">
                  Search for Your Business{multipleBusinesses ? 'es' : ''} to Remove
                </label>
                <button
                  type="button"
                  onClick={toggleMultipleBusinesses}
                  className="text-sm text-terrace-600 hover:text-terrace-700 font-medium"
                >
                  {multipleBusinesses ? 'Single Business' : 'Multiple Businesses?'}
                </button>
              </div>
              
              {multipleBusinesses && (
                <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Multiple Business Removal:</strong> You can select multiple businesses to remove at once. 
                    All selected businesses will be removed from Terrace AI.
                  </p>
                </div>
              )}
              
              <div className="relative">
                <input
                  type="text"
                  id="business-search"
                  placeholder="Type your business name, address, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-terrace-500 pr-10"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                  </div>
                )}
              </div>
              
              {hasSearched && searchResults.length > 0 && (
                <div className="mt-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.map((business) => (
                    <div
                      key={business.id}
                      className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedBusinesses.includes(business.id) ? 'bg-red-50 border-red-200' : ''
                      }`}
                      onClick={() => handleBusinessSelect(business.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {multipleBusinesses && (
                          <div className="mt-1">
                            <input
                              type="checkbox"
                              checked={selectedBusinesses.includes(business.id)}
                              onChange={() => {}} // Handled by onClick
                              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{business.name}</div>
                          <div className="text-sm text-gray-600">{business.category}</div>
                          <div className="text-sm text-gray-500">{business.fullAddress}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!hasSearched && !searchTerm && (
                <p className="text-sm text-gray-500 mt-2">Start typing to search for your business...</p>
              )}
              
              {hasSearched && searchResults.length === 0 && searchTerm && (
                <p className="text-sm text-gray-500 mt-2">No businesses found matching "{searchTerm}"</p>
              )}
              
              {selectedBusinesses.length > 0 && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="text-sm text-red-800 mb-2">
                    ⚠️ Selected {selectedBusinesses.length} business{selectedBusinesses.length > 1 ? 'es' : ''} for removal:
                  </div>
                  <div className="space-y-1">
                    {selectedBusinesses.map(businessId => {
                      const business = searchResults.find(b => b.id === businessId);
                      return business ? (
                        <div key={businessId} className="text-sm text-red-700">
                          • {business.name} ({business.category})
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Business Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-terrace-500"
                placeholder="your@business.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-terrace-500"
                placeholder="(250) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Removal (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-terrace-500"
                placeholder="Help us understand why you're removing your listing..."
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isSubmitting || selectedBusinesses.length === 0}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : `Submit Removal Request${selectedBusinesses.length > 1 ? ` (${selectedBusinesses.length} businesses)` : ''}`}
              </button>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">Want to claim your business instead?</h3>
            <Link
              href="/business/claim"
              className="text-terrace-600 hover:text-terrace-700 text-sm font-medium"
            >
              Claim your business →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
