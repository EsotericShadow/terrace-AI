'use client';

import { useState, useEffect } from 'react';
import { Building2, CheckCircle, Clock, XCircle, Phone, Mail, AlertCircle, RefreshCw } from 'lucide-react';

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
  multipleBusinesses: boolean;
}

export default function AdminVerificationPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'in_progress'>('all');

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/verification-requests');
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch verification requests');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const updateRequestStatus = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/verification-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status: newStatus,
          notes
        }),
      });

      if (response.ok) {
        // Refresh the requests
        await fetchRequests();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update request status');
      }
    } catch (err) {
      setError('Network error. Please try again.');
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

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-terrace-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
                <p className="text-gray-600">Manage business claim and removal requests</p>
              </div>
            </div>
            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-terrace-600 text-white rounded-lg hover:bg-terrace-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Requests', count: requests.length },
                { key: 'pending', label: 'Pending', count: requests.filter(r => r.status === 'pending').length },
                { key: 'in_progress', label: 'In Progress', count: requests.filter(r => r.status === 'in_progress').length },
                { key: 'verified', label: 'Verified', count: requests.filter(r => r.status === 'verified').length },
                { key: 'rejected', label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === key
                      ? 'bg-terrace-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading verification requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? 'No verification requests have been submitted yet.'
                  : `No ${filter} requests found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {request.type === 'claim' ? 'Business Claim' : 'Business Removal'}
                          {request.multipleBusinesses && ' (Multiple)'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Submitted on {new Date(request.submittedAt).toLocaleDateString()} at {new Date(request.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Business{request.businessNames.length > 1 ? 'es' : ''}:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {request.businessNames.map((name, index) => (
                          <li key={index}>• {name}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Contact Information:</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4" />
                          <span>{request.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Notes:</h4>
                      <p className="text-sm text-gray-600">{request.notes}</p>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateRequestStatus(request.id, 'in_progress', 'Started verification process')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Start Verification
                      </button>
                      <button
                        onClick={() => updateRequestStatus(request.id, 'verified', 'Verified via phone call')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateRequestStatus(request.id, 'rejected', 'Could not verify ownership')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === 'in_progress' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => updateRequestStatus(request.id, 'verified', 'Verified via phone call')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => updateRequestStatus(request.id, 'rejected', 'Could not verify ownership')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {request.status === 'verified' && request.verifiedAt && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-800">
                        ✓ Verified on {new Date(request.verifiedAt).toLocaleDateString()} at {new Date(request.verifiedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

