/**
 * Query Intent Classification
 * Detects the user's intent to route queries to appropriate data sources
 */

export interface QueryIntent {
  category: 'bylaw' | 'tax' | 'recreation' | 'waste' | 'municipal' | 'general';
  subcategory?: string;
  confidence: number;
  keywords: string[];
}

export function classifyQuery(query: string): QueryIntent {
  const q = query.toLowerCase();
  
  // Bylaw queries
  const bylawKeywords = ['bylaw', 'regulation', 'zoning', 'permit', 'license', 'noise', 'parking', 'animal', 'dog', 'cat', 'building'];
  if (bylawKeywords.some(kw => q.includes(kw))) {
    let subcategory = 'general';
    if (q.includes('zoning') || q.includes('land use')) subcategory = 'zoning';
    else if (q.includes('building') || q.includes('construction')) subcategory = 'building_construction';
    else if (q.includes('parking') || q.includes('traffic')) subcategory = 'traffic_parking';
    else if (q.includes('animal') || q.includes('dog') || q.includes('cat') || q.includes('pet')) subcategory = 'animal_control';
    else if (q.includes('noise')) subcategory = 'noise_control';
    else if (q.includes('business') && q.includes('license')) subcategory = 'business_licensing';
    
    return {
      category: 'bylaw',
      subcategory,
      confidence: 0.9,
      keywords: bylawKeywords.filter(kw => q.includes(kw))
    };
  }
  
  // Tax & financial queries
  const taxKeywords = ['tax', 'payment', 'bill', 'fee', 'charge', 'cost', 'price', 'rate'];
  if (taxKeywords.some(kw => q.includes(kw))) {
    let subcategory = 'general';
    if (q.includes('property')) subcategory = 'property_tax';
    else if (q.includes('business')) subcategory = 'business_tax';
    else if (q.includes('utility') || q.includes('water') || q.includes('sewer')) subcategory = 'utility_rates';
    else if (q.includes('recreation') || q.includes('swim') || q.includes('pool') || q.includes('skate')) subcategory = 'recreation_fees';
    
    return {
      category: 'tax',
      subcategory,
      confidence: 0.9,
      keywords: taxKeywords.filter(kw => q.includes(kw))
    };
  }
  
  // Recreation queries
  const recKeywords = ['swim', 'pool', 'skate', 'lesson', 'recreation', 'aquatic', 'facility', 'arena', 'gym', 'program', 'registration'];
  if (recKeywords.some(kw => q.includes(kw))) {
    let subcategory = 'general';
    if (q.includes('swim') || q.includes('pool') || q.includes('aquatic') || q.includes('lesson')) subcategory = 'aquatic_programs';
    else if (q.includes('schedule') || q.includes('hours')) subcategory = 'facility_schedules';
    else if (q.includes('register') || q.includes('sign up') || q.includes('enroll')) subcategory = 'registration_info';
    
    return {
      category: 'recreation',
      subcategory,
      confidence: 0.9,
      keywords: recKeywords.filter(kw => q.includes(kw))
    };
  }
  
  // Waste & utilities queries
  const wasteKeywords = ['garbage', 'waste', 'trash', 'recycle', 'recycling', 'pickup', 'collection'];
  if (wasteKeywords.some(kw => q.includes(kw))) {
    let subcategory = 'general';
    if (q.includes('garbage') || q.includes('waste') || q.includes('trash')) subcategory = 'waste_collection';
    else if (q.includes('recycle') || q.includes('recycling')) subcategory = 'recycling';
    
    return {
      category: 'waste',
      subcategory,
      confidence: 0.9,
      keywords: wasteKeywords.filter(kw => q.includes(kw))
    };
  }
  
  // Municipal services queries
  const municipalKeywords = ['311', 'city hall', 'contact', 'office', 'hours', 'phone', 'email'];
  if (municipalKeywords.some(kw => q.includes(kw))) {
    return {
      category: 'municipal',
      confidence: 0.7,
      keywords: municipalKeywords.filter(kw => q.includes(kw))
    };
  }
  
  // General/unknown
  return {
    category: 'general',
    confidence: 0.5,
    keywords: []
  };
}

