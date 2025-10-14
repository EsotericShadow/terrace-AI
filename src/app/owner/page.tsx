'use client';

import { useState, useEffect } from 'react';
import { Building2, Plus, Edit, Trash2, Crown, Package, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface BusinessPlan {
  tier: 'free' | 'pro';
  status: 'active' | 'inactive';
  currentPeriodEnd?: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  priceRange: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  pickupDelivery: boolean;
  lastUpdated: string;
}

export default function OwnerPortalPage() {
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan>({ tier: 'free', status: 'active' });
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Mock data - in real implementation, this would come from API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBusinessPlan({ tier: 'free', status: 'active' });
      setProducts([
        {
          id: '1',
          title: 'Oil Change Service',
          description: 'Full synthetic oil change with filter replacement',
          priceRange: '$50-75',
          availability: 'in_stock',
          pickupDelivery: false,
          lastUpdated: '2024-01-15'
        }
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleUpgrade = () => {
    // Redirect to Stripe checkout
    window.location.href = '/subscribe/checkout';
  };

  const handleAddProduct = () => {
    // In real implementation, this would open a modal or navigate to add product page
    console.log('Add product clicked');
  };

  const handleEditProduct = (productId: string) => {
    // In real implementation, this would open edit modal or navigate to edit page
    console.log('Edit product:', productId);
  };

  const handleDeleteProduct = (productId: string) => {
    // In real implementation, this would call delete API
    console.log('Delete product:', productId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center space-x-3 mb-8">
          <Building2 className="h-8 w-8 text-terrace-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Owner Portal</h1>
            <p className="text-gray-600">Manage your Terrace AI business listing</p>
          </div>
        </div>

        {/* Plan Status */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {businessPlan.tier === 'pro' ? (
                <Crown className="h-6 w-6 text-yellow-500" />
              ) : (
                <Building2 className="h-6 w-6 text-gray-400" />
              )}
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {businessPlan.tier === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </h2>
                <p className="text-sm text-gray-600">
                  {businessPlan.tier === 'pro' 
                    ? `Active until ${businessPlan.currentPeriodEnd}` 
                    : 'Basic listing visible to residents'
                  }
                </p>
              </div>
            </div>
            {businessPlan.tier === 'free' && (
              <button
                onClick={handleUpgrade}
                className="bg-terrace-600 text-white px-4 py-2 rounded-lg hover:bg-terrace-700 transition-colors"
              >
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Products Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <Package className="h-5 w-5 text-terrace-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Products & Services</h3>
                </div>
                {businessPlan.tier === 'pro' ? (
                  <button
                    onClick={handleAddProduct}
                    className="flex items-center space-x-2 bg-terrace-600 text-white px-3 py-2 rounded-lg hover:bg-terrace-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Product</span>
                  </button>
                ) : (
                  <div className="text-sm text-gray-500">
                    Pro required
                  </div>
                )}
              </div>

              {businessPlan.tier === 'free' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    Upgrade to Pro to add products and services to your listing.
                  </p>
                </div>
              )}

              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No products added yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Price: {product.priceRange}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              product.availability === 'in_stock' 
                                ? 'bg-green-100 text-green-800' 
                                : product.availability === 'limited'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.availability.replace('_', ' ')}
                            </span>
                            {product.pickupDelivery && (
                              <span className="text-blue-600">Pickup/Delivery Available</span>
                            )}
                          </div>
                        </div>
                        {businessPlan.tier === 'pro' && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditProduct(product.id)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analytics & Info */}
          <div className="space-y-6">
            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-5 w-5 text-terrace-600" />
                <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
              </div>
              {businessPlan.tier === 'pro' ? (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Search Impressions</span>
                    <span className="text-sm font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Profile Views</span>
                    <span className="text-sm font-medium">456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Product Views</span>
                    <span className="text-sm font-medium">89</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Analytics available with Pro plan</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/business/claim"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  Update Business Info
                </Link>
                <Link
                  href="/business/remove"
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Remove Listing
                </Link>
                <Link
                  href="/"
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                >
                  View Public Listing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

