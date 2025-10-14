import { NextRequest, NextResponse } from 'next/server';

// Configuration
const WEAVIATE_URL = process.env.WEAVIATE_URL || '';
const WEAVIATE_API_KEY = process.env.WEAVIATE_API_KEY || '';

interface Product {
  id?: string;
  businessId: string;
  title: string;
  description: string;
  priceRange: string;
  availability: 'in_stock' | 'out_of_stock' | 'limited';
  pickupDelivery: boolean;
  lastUpdated: string;
}

// GET - Retrieve products for a business
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      );
    }

    // Check if business has Pro plan
    const planCheckQuery = {
      query: `{
        Get {
          BusinessPlan(
            where: {
              path: ["businessId"]
              operator: Equal
              valueText: "${businessId}"
            }
          ) {
            tier
            status
          }
        }
      }`
    };

    const planResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(planCheckQuery)
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      const plans = planData.data?.Get?.BusinessPlan || [];
      
      if (plans.length === 0 || plans[0].tier !== 'pro' || plans[0].status !== 'active') {
        return NextResponse.json(
          { error: 'Pro plan required to manage products' },
          { status: 403 }
        );
      }
    }

    // Get products for business
    const productsQuery = {
      query: `{
        Get {
          BusinessProduct(
            where: {
              path: ["businessId"]
              operator: Equal
              valueText: "${businessId}"
            }
          ) {
            _additional {
              id
            }
            businessId
            title
            description
            priceRange
            availability
            pickupDelivery
            lastUpdated
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
      body: JSON.stringify(productsQuery)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const products = data.data?.Get?.BusinessProduct || [];

    return NextResponse.json({ products });

  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request: NextRequest) {
  try {
    const product: Product = await request.json();

    if (!product.businessId || !product.title || !product.description) {
      return NextResponse.json(
        { error: 'Business ID, title, and description are required' },
        { status: 400 }
      );
    }

    // Check if business has Pro plan
    const planCheckQuery = {
      query: `{
        Get {
          BusinessPlan(
            where: {
              path: ["businessId"]
              operator: Equal
              valueText: "${product.businessId}"
            }
          ) {
            tier
            status
          }
        }
      }`
    };

    const planResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(planCheckQuery)
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      const plans = planData.data?.Get?.BusinessPlan || [];
      
      if (plans.length === 0 || plans[0].tier !== 'pro' || plans[0].status !== 'active') {
        return NextResponse.json(
          { error: 'Pro plan required to create products' },
          { status: 403 }
        );
      }
    }

    // Create product in Weaviate
    const createProductQuery = {
      query: `mutation {
        Create {
          BusinessProduct(
            businessId: "${product.businessId}"
            title: "${product.title}"
            description: "${product.description}"
            priceRange: "${product.priceRange}"
            availability: "${product.availability}"
            pickupDelivery: ${product.pickupDelivery}
            lastUpdated: "${new Date().toISOString()}"
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
      body: JSON.stringify(createProductQuery)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const createdProduct = data.data?.Create?.BusinessProduct?.[0];

    return NextResponse.json({
      success: true,
      product: {
        id: createdProduct?._additional?.id,
        ...product
      }
    });

  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update a product
export async function PUT(request: NextRequest) {
  try {
    const product: Product = await request.json();

    if (!product.id || !product.businessId) {
      return NextResponse.json(
        { error: 'Product ID and business ID are required' },
        { status: 400 }
      );
    }

    // Check if business has Pro plan
    const planCheckQuery = {
      query: `{
        Get {
          BusinessPlan(
            where: {
              path: ["businessId"]
              operator: Equal
              valueText: "${product.businessId}"
            }
          ) {
            tier
            status
          }
        }
      }`
    };

    const planResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(planCheckQuery)
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      const plans = planData.data?.Get?.BusinessPlan || [];
      
      if (plans.length === 0 || plans[0].tier !== 'pro' || plans[0].status !== 'active') {
        return NextResponse.json(
          { error: 'Pro plan required to update products' },
          { status: 403 }
        );
      }
    }

    // Update product in Weaviate
    const updateProductQuery = {
      query: `mutation {
        Update {
          BusinessProduct(
            where: {
              path: ["_additional", "id"]
              operator: Equal
              valueText: "${product.id}"
            }
            set: {
              title: "${product.title}"
              description: "${product.description}"
              priceRange: "${product.priceRange}"
              availability: "${product.availability}"
              pickupDelivery: ${product.pickupDelivery}
              lastUpdated: "${new Date().toISOString()}"
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
      body: JSON.stringify(updateProductQuery)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });

  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const businessId = searchParams.get('businessId');

    if (!productId || !businessId) {
      return NextResponse.json(
        { error: 'Product ID and business ID are required' },
        { status: 400 }
      );
    }

    // Check if business has Pro plan
    const planCheckQuery = {
      query: `{
        Get {
          BusinessPlan(
            where: {
              path: ["businessId"]
              operator: Equal
              valueText: "${businessId}"
            }
          ) {
            tier
            status
          }
        }
      }`
    };

    const planResponse = await fetch(`${WEAVIATE_URL}/v1/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WEAVIATE_API_KEY}`,
      },
      body: JSON.stringify(planCheckQuery)
    });

    if (planResponse.ok) {
      const planData = await planResponse.json();
      const plans = planData.data?.Get?.BusinessPlan || [];
      
      if (plans.length === 0 || plans[0].tier !== 'pro' || plans[0].status !== 'active') {
        return NextResponse.json(
          { error: 'Pro plan required to delete products' },
          { status: 403 }
        );
      }
    }

    // Delete product from Weaviate
    const deleteProductQuery = {
      query: `mutation {
        Delete {
          BusinessProduct(
            where: {
              path: ["_additional", "id"]
              operator: Equal
              valueText: "${productId}"
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
      body: JSON.stringify(deleteProductQuery)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

