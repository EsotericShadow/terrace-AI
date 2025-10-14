# Business Owner Self-Service Portal - Roadmap

## Vision

Allow verified business owners to manage and enhance their own business listings, creating rich, accurate data that improves AI search results and customer discovery.

---

## 📊 Business Owner Capabilities (Full Feature Set)

### 1. **Basic Information** (Priority 1)
- ✏️ Business name (display name)
- 📍 Full address with postal code
- ☎️ Primary phone number
- ☎️ Secondary/mobile number
- 📧 Public email address
- 🌐 Website URL
- 🕐 Hours of operation (by day)
- 📅 Seasonal hours/closures

### 2. **Business Description** (Priority 1)
- 📝 Short description (150 chars) - for search results
- 📄 Full description (1000 chars) - detailed overview
- 🏷️ Tags/keywords for better searchability
- 🎯 Specialties/unique selling points

### 3. **Products & Inventory** (Priority 2)
```typescript
interface Product {
  name: string;
  description: string;
  category: string;
  price: number | string; // "$10" or "$10-$20"
  inStock: boolean;
  stockLevel?: 'low' | 'medium' | 'high';
  images?: string[];
  sku?: string;
}
```

**Example:** 
- Pizza place: List menu items, prices
- HVAC: List services (furnace repair $150, AC install $2500-4000)
- Retail: Product inventory with stock levels

### 4. **Services & Pricing** (Priority 2)
```typescript
interface Service {
  name: string;
  description: string;
  category: string;
  priceType: 'fixed' | 'range' | 'quote' | 'hourly';
  price?: string; // "$50", "$50-$100", "$75/hr"
  duration?: string; // "1 hour", "2-3 days"
  availability: 'always' | 'seasonal' | 'by_appointment';
  notes?: string;
}
```

**Example:**
- Plumber: Emergency service $150, drain cleaning $80-$120, quote for major work
- Lawyer: Consultation $200/hr, will preparation $500 flat
- Salon: Haircut $45, color $80-$150, manicure $35

### 5. **Company History** (Priority 3)
```typescript
interface CompanyHistory {
  founded: number; // year
  founderStory?: string; // 500 chars
  milestones?: {
    year: number;
    event: string;
  }[];
  fullHistory?: string; // 2000 chars - searchable by AI
  familyOwned?: boolean;
  yearsInTerrace?: number;
  awards?: string[];
}
```

**Why this matters:**
- "Find a family-owned restaurant" → AI can filter
- "Who has been in Terrace the longest?" → AI can rank
- Builds trust and local connection

### 6. **Reviews & Testimonials** (Priority 3)
```typescript
interface Review {
  customerName: string;
  rating: number; // 1-5
  review: string;
  date: Date;
  verifiedPurchase: boolean;
  businessResponse?: string;
}
```

**Future:** Integrate with Google Reviews, or business owners add manually

### 7. **Media & Photos** (Priority 3)
- 🖼️ Logo/profile image
- 📸 Business photos (interior, exterior, products)
- 🎥 Video tour (optional)
- 📄 PDF menus/catalogs

### 8. **Special Features** (Priority 4)
- 🎫 Current promotions/deals
- 📅 Events/workshops
- 🚗 Parking information
- ♿ Accessibility features
- 💳 Payment methods accepted
- 🌍 Languages spoken
- 🐕 Pet-friendly status
- 📶 WiFi availability

---

## 🗄️ Database Schema (Postgres)

### Main Tables

```sql
-- Business claims (existing)
CREATE TABLE business_claims (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(50) NOT NULL,
  best_time_to_call VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verification_code VARCHAR(50),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);

-- Business owner accounts (after verification)
CREATE TABLE business_owners (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  business_ids TEXT[], -- Array of business IDs they own
  verified BOOLEAN DEFAULT false,
  subscription_status VARCHAR(50) DEFAULT 'free', -- free, basic, premium
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Enhanced business data (owner-provided)
CREATE TABLE business_enhancements (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES business_owners(id),
  
  -- Basic info
  display_name VARCHAR(255),
  short_description TEXT,
  full_description TEXT,
  website_url VARCHAR(500),
  email VARCHAR(255),
  phone_primary VARCHAR(50),
  phone_secondary VARCHAR(50),
  address_full TEXT,
  
  -- Hours
  hours_monday VARCHAR(100),
  hours_tuesday VARCHAR(100),
  hours_wednesday VARCHAR(100),
  hours_thursday VARCHAR(100),
  hours_friday VARCHAR(100),
  hours_saturday VARCHAR(100),
  hours_sunday VARCHAR(100),
  hours_notes TEXT,
  
  -- History
  founded_year INTEGER,
  company_history TEXT,
  family_owned BOOLEAN,
  years_in_terrace INTEGER,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, published
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  published_to_weaviate BOOLEAN DEFAULT false,
  weaviate_sync_at TIMESTAMP
);

-- Products (for inventory management)
CREATE TABLE business_products (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES business_owners(id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price_type VARCHAR(50), -- fixed, range, quote
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  price_display VARCHAR(100), -- "$50" or "$50-$100"
  in_stock BOOLEAN DEFAULT true,
  stock_level VARCHAR(50), -- low, medium, high
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services (for service businesses)
CREATE TABLE business_services (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES business_owners(id),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price_type VARCHAR(50), -- fixed, hourly, quote, range
  price_display VARCHAR(100),
  duration VARCHAR(100), -- "1 hour", "2-3 days"
  availability VARCHAR(50), -- always, by_appointment, seasonal
  
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Update requests (pending changes)
CREATE TABLE business_update_requests (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  owner_id INTEGER REFERENCES business_owners(id),
  
  update_type VARCHAR(50), -- 'info', 'product', 'service', 'hours', 'description'
  field_name VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by VARCHAR(100)
);
```

---

## 🔄 Update Pipeline (Future)

### Workflow

```
Business Owner Portal
    ↓
1. Owner logs in (email + password)
    ↓
2. Selects their business(es)
    ↓
3. Makes changes:
   - Updates hours
   - Adds products
   - Updates description
   - Adds company history
    ↓
4. Submits for review
    ↓
[ADMIN REVIEW DASHBOARD]
    ↓
5. Admin approves/rejects changes
    ↓
6. Approved changes → Postgres
    ↓
7. Sync script updates Weaviate
    ↓
AI chatbot now uses updated data
```

### Sync Script (runs on approval)

```typescript
// scripts/sync-postgres-to-weaviate.ts
async function syncBusinessToWeaviate(businessId: string) {
  // 1. Get enhanced data from Postgres
  const enhancement = await db.query(
    'SELECT * FROM business_enhancements WHERE business_id = $1 AND status = $2',
    [businessId, 'approved']
  );
  
  // 2. Get products and services
  const products = await db.query('SELECT * FROM business_products WHERE business_id = $1', [businessId]);
  const services = await db.query('SELECT * FROM business_services WHERE business_id = $1', [businessId]);
  
  // 3. Update Weaviate
  await weaviate.collections.get('Business').data.update({
    id: businessId,
    properties: {
      description: enhancement.full_description,
      shortDescription: enhancement.short_description,
      phone: enhancement.phone_primary,
      address: enhancement.address_full,
      website: enhancement.website_url,
      hours: formatHours(enhancement),
      companyHistory: enhancement.company_history,
      products: JSON.stringify(products),
      services: JSON.stringify(services),
      enhanced: true,
      lastUpdated: new Date()
    }
  });
  
  // 4. Mark as synced
  await db.query(
    'UPDATE business_enhancements SET published_to_weaviate = true, weaviate_sync_at = NOW() WHERE business_id = $1',
    [businessId]
  );
}
```

---

## 🎨 Business Owner Portal UI

### Dashboard (after login)
```
┌─────────────────────────────────────────────────┐
│ My Businesses                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Tim Hortons                             │   │
│ │ ✅ Verified • 📝 75% Complete           │   │
│ │                                         │   │
│ │ [Edit Info] [Add Products] [View Stats]│   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ Terrace Roofing Co.                     │   │
│ │ ⏳ Pending Verification                 │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [+ Claim Another Business]                     │
└─────────────────────────────────────────────────┘
```

### Edit Business Info
```
Basic Information
├─ Display Name: [Tim Hortons          ]
├─ Phone:        [(250) 555-1234       ]
├─ Email:        [terrace@timhortons.ca]
├─ Website:      [timhortons.com       ]
└─ Address:      [4631 Lakelse Ave...  ]

Hours of Operation
├─ Monday:    [6:00 AM] to [10:00 PM]
├─ Tuesday:   [6:00 AM] to [10:00 PM]
├─ ...
└─ [✓] Same hours every day

Description
├─ Short (for search results):
│   [Tim Hortons is Canada's favorite...]
│   
└─ Full Description:
    [Located in the heart of Terrace, we've been
     serving fresh coffee and baked goods since...]

Company History (helps with AI search!)
├─ Founded: [1995]
├─ Story:   [Started as a small franchise...]
└─ [✓] Family-owned business

[Save Changes] [Preview in AI]
```

### Products/Inventory Management
```
┌─────────────────────────────────────────────────┐
│ Products & Menu Items                           │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ☕ Coffee (Regular)                      │   │
│ │ Price: $2.49 • In Stock: ✅            │   │
│ │ [Edit] [Delete]                          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 🍩 Donut (Assorted)                     │   │
│ │ Price: $1.79 • In Stock: ✅            │   │
│ │ [Edit] [Delete]                          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [+ Add Product]                                 │
└─────────────────────────────────────────────────┘

Add Product Form:
├─ Name:        [Large Coffee              ]
├─ Category:    [Beverages ▼              ]
├─ Price Type:  [● Fixed  ○ Range  ○ Quote]
├─ Price:       [$2.49                    ]
├─ In Stock:    [✓] Yes  [ ] No
├─ Stock Level: [● High  ○ Medium  ○ Low  ]
└─ Description: [Fresh brewed coffee...   ]
```

### Services & Pricing (for contractors/service businesses)
```
┌─────────────────────────────────────────────────┐
│ Services Offered                                │
├─────────────────────────────────────────────────┤
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 🔧 Furnace Repair                       │   │
│ │ $150-$300 • Emergency Available         │   │
│ │ Duration: 2-4 hours                     │   │
│ │ [Edit] [Delete]                          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ❄️ A/C Installation                     │   │
│ │ $2,500-$4,000 • Free Quote              │   │
│ │ Duration: 1-2 days                      │   │
│ │ [Edit] [Delete]                          │   │
│ └─────────────────────────────────────────┘   │
│                                                 │
│ [+ Add Service]                                 │
└─────────────────────────────────────────────────┘
```

---

## 🤖 How This Enhances AI Search

### Current (Basic Listings)
```
User: "Find a plumber who does emergency service"
AI: "Here are some plumbers in Terrace:
     - Equity Plumbing
     - Phone not available
     - I don't have their service information"
```

### With Enhanced Data
```
User: "Find a plumber who does emergency service"
AI: "I found Arctic Plumbing & Heating:
     - 24/7 Emergency Service Available
     - Emergency callout: $150 + parts
     - Average response time: 1 hour
     - Phone: (250) 555-PLUM
     - Located at 4523 Keith Ave
     - Family-owned since 1998"
```

### Current (Vague)
```
User: "Where can I get a wedding cake?"
AI: "I found some bakeries but I don't have
     their product information"
```

### With Enhanced Data
```
User: "Where can I get a wedding cake?"
AI: "Sweet Dreams Bakery specializes in custom
     wedding cakes:
     - Custom 3-tier cakes: $400-$800
     - Tasting appointments available
     - 2-week advance notice required
     - Phone: (250) 555-CAKE
     - 30+ years serving Terrace weddings!"
```

---

## 📈 Value Proposition for Business Owners

### Free Tier
- ✅ Claim your business listing
- ✅ Update basic contact info (phone, address, hours)
- ✅ Add short description (150 chars)
- ✅ Appear in AI search results

### Premium Tier ($30/month)
- ✅ Everything in Free
- ✅ Add unlimited products with prices
- ✅ Add unlimited services with pricing
- ✅ Full description (1000 chars)
- ✅ Company history (searchable by AI)
- ✅ Priority placement in search results
- ✅ Photo gallery (10 images)
- ✅ Review management
- ✅ Analytics (how often you appear in searches)
- ✅ Special promotions/deals section

---

## 🔒 Security & Quality Control

### Verification Process
1. Owner submits claim
2. Admin verifies ownership (call business, check documents)
3. Admin approves claim → owner gets login
4. Owner makes changes
5. **All changes go through approval workflow**
6. Admin approves → syncs to Weaviate
7. AI immediately uses updated data

### Why Approval Workflow?
- ✅ Prevents spam/fake data
- ✅ Ensures data quality
- ✅ Protects AI accuracy
- ✅ Maintains trust with users

---

## 🛠️ Implementation Phases

### Phase 1: POC (Current) ✅
- ✅ AI chatbot working
- ✅ Basic claim form
- ✅ Claims stored in Weaviate
- ✅ Manual processing

### Phase 2: Postgres Migration (After POC Approval)
- [ ] Migrate claims to Postgres
- [ ] Admin dashboard for reviewing claims
- [ ] Email verification system
- [ ] Basic owner login/portal

### Phase 3: Enhanced Listings (Month 2-3)
- [ ] Products/inventory management
- [ ] Services/pricing management
- [ ] Company history section
- [ ] Hours of operation editor
- [ ] Photo uploads

### Phase 4: Self-Service Sync (Month 3-4)
- [ ] Auto-sync approved changes to Weaviate
- [ ] Real-time updates (owner edits → AI knows immediately)
- [ ] Analytics for business owners
- [ ] Premium tier with advanced features

---

## 💡 Why This is Valuable

### For Business Owners
- 🎯 Better discovery (AI finds them for relevant queries)
- 📞 More leads (complete contact info)
- 💰 Revenue potential (show pricing, services)
- 🏆 Competitive advantage (detailed listings)
- 📊 Control over their data

### For Users/Residents
- ✅ Accurate, complete information
- ✅ Pricing transparency
- ✅ Better recommendations from AI
- ✅ Confidence in results
- ✅ Local business support

### For City of Terrace
- 📈 Economic development tool
- 🤝 Support local businesses
- 💼 Business attraction/retention
- 🌟 Modern, innovative service
- 💰 Potential revenue ($30/month × 100 businesses = $3k/month)

---

## 🎯 Example: Enhanced Business Entry in Weaviate

**Before Enhancement:**
```json
{
  "businessName": "ARCTIC PLUMBING LTD",
  "category": "business_economy",
  "subcategory": "plumbing",
  "address": "Address not available",
  "phone": "Phone not available",
  "description": "No description available"
}
```

**After Enhancement:**
```json
{
  "businessName": "Arctic Plumbing & Heating",
  "displayName": "Arctic Plumbing & Heating",
  "category": "business_economy",
  "subcategory": "plumbing",
  "address": "4523 Keith Avenue, Terrace, BC V8G 1K4",
  "phone": "(250) 635-PLUM",
  "email": "info@arcticplumbing.ca",
  "website": "arcticplumbing.ca",
  "shortDescription": "24/7 emergency plumbing & heating services in Terrace. Family-owned since 1998.",
  "fullDescription": "Arctic Plumbing & Heating has been serving Terrace families for over 25 years...",
  "hours": {
    "emergency": "24/7",
    "office": "Mon-Fri 8am-5pm"
  },
  "services": [
    {
      "name": "Emergency Plumbing",
      "price": "$150 callout + parts",
      "availability": "24/7",
      "responseTime": "Usually within 1 hour"
    },
    {
      "name": "Furnace Repair",
      "price": "$150-$300",
      "duration": "2-4 hours"
    },
    {
      "name": "Water Heater Installation",
      "price": "$800-$1500",
      "duration": "1 day"
    }
  ],
  "companyHistory": "Founded in 1998 by John Arctic, a third-generation plumber...",
  "familyOwned": true,
  "yearsInTerrace": 27,
  "specialties": ["emergency service", "furnace repair", "frozen pipes"],
  "enhanced": true,
  "lastUpdated": "2025-10-14"
}
```

**Now AI can answer:**
- "Who does emergency plumbing?" → Arctic Plumbing (24/7 available)
- "How much does furnace repair cost?" → $150-$300 at Arctic Plumbing
- "Find a family-owned plumber" → Arctic Plumbing (27 years in Terrace)

---

## 📝 Next Steps

### For POC Demo
- ✅ Current claim system works (Weaviate-based)
- ✅ Shows proof of concept
- ✅ Business owners can express interest

### After City Approval
1. Set up Postgres tables
2. Migrate existing claims
3. Build admin approval dashboard
4. Create business owner login portal
5. Implement product/service management
6. Build Weaviate sync pipeline
7. Launch self-service with approval workflow

---

## 💰 Revenue Model (Optional)

### Free Tier
- Basic listing (phone, address, hours)
- Short description
- Appear in search results

### Premium ($30/month)
- Everything in free
- Unlimited products/services
- Priority search placement
- Photo gallery
- Company history
- Review management
- Analytics

**Potential Revenue:**
- 50 businesses @ $30/month = $1,500/month = $18k/year
- 100 businesses @ $30/month = $3,000/month = $36k/year

Covers infrastructure costs + development + profit

---

**Current Status:** Database configured, schema designed, roadmap complete. Ready to implement after POC approval! 🚀

