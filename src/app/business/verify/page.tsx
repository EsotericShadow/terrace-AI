'use client';

import { useState, useEffect } from 'react';
import { Building2, CheckCircle, Clock, XCircle, AlertCircle, Phone, Mail } from 'lucide-react';
import Link from 'next/link';

interface VerificationRequest {
  id: string;
  type: 'claim' | 'removal';
  businessIds: string[];
  businessNames: string[];
  email: string;
  phone: string;
  status: 'pending' | 'verified' | 'rejected' | 'in_progress';
  submittedAt: string;
  verifiedAt?: string;
  notes?: string;
}

export default function VerificationStatusPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [error, setError] = useState('');

  const searchRequests = async () => {
    if (!email.trim() || !phone.trim()) {
      setError('Please enter both email and phone number');
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const response = await fetch(`/api/business/verify-status?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch verification status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Phone className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified & Approved';
      case 'rejected':
        return 'Rejected';
      case 'in_progress':
        return 'Verification in Progress';
      default:
        return 'Pending Verification';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'in_progress':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-3 mb-8">
            <Building2 className="h-8 w-8 text-terrace-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Verification Status</h1>
              <p className="text-gray-600">Check the status of your business claim or removal requests</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">How Verification Works:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Submit Request:</strong> Fill out the claim or removal form</li>
                  <li>• <strong>We Call You:</strong> We'll contact you within 1-2 business days</li>
                  <li>• <strong>Verify Ownership:</strong> We'll ask questions to confirm you own the business</li>
                  <li>• <strong>Approval:</strong> Once verified, your request will be processed</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Look Up Your Requests</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-terrace-500 focus:border-terrace-500"
                    placeholder="(250) 123-4567"
                  />
                </div>
              </div>
              <button
                onClick={searchRequests}
                disabled={isSearching || !email.trim() || !phone.trim()}
                className="bg-terrace-600 text-white px-6 py-2 rounded-lg hover:bg-terrace-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSearching ? 'Searching...' : 'Check Status'}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {requests.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Your Requests</h2>
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(request.status)}
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {request.type === 'claim' ? 'Business Claim' : 'Business Removal'}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted on {new Date(request.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </div>

                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Business{request.businessNames.length > 1 ? 'es' : ''}:</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {request.businessNames.map((name, index) => (
                            <li key={index}>• {name}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{request.phone}</span>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                          <p className="text-sm text-gray-600">{request.notes}</p>
                        </div>
                      )}

                      {request.status === 'verified' && request.verifiedAt && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✓ Verified on {new Date(request.verifiedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {requests.length === 0 && email && phone && !isSearching && (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
                <p className="text-gray-600 mb-4">
                  No verification requests found for this email and phone combination.
                </p>
                <div className="space-x-4">
                  <Link
                    href="/business/claim"
                    className="inline-block bg-terrace-600 text-white px-4 py-2 rounded-lg hover:bg-terrace-700 transition-colors"
                  >
                    Claim Your Business
                  </Link>
                  <Link
                    href="/business/remove"
                    className="inline-block bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Remove Your Business
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Need Help?</h3>
                <p className="text-sm text-gray-600">
                  If you have questions about the verification process, contact us.
                </p>
              </div>
              <Link
                href="/"
                className="text-terrace-600 hover:text-terrace-700 text-sm font-medium"
              >
                Return to Terrace AI →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

