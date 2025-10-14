# PostgreSQL Database Setup (Neon)

## Purpose

Database for collecting business owner claims and management requests. Business owners can:
- Claim their business listing
- Request changes/updates
- Provide additional information

**Note:** Claims are collected in Postgres for now. Manual integration into Weaviate will happen later. Future pipeline will allow direct Weaviate updates.

## Configuration

Add these to your `.env.local` and Vercel environment variables:

```bash
# Primary connection (with PgBouncer pooling - recommended)
DATABASE_URL=postgresql://neondb_owner:npg_a4ZTHPhd0vUk@ep-purple-flower-adojthe1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Alternative URLs (Vercel compatibility)
POSTGRES_URL=postgresql://neondb_owner:npg_a4ZTHPhd0vUk@ep-purple-flower-adojthe1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require

# Unpooled connection (for migrations/admin tasks)
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_a4ZTHPhd0vUk@ep-purple-flower-adojthe1.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## Current Implementation

### Business Claim Flow

1. User visits `/business/claim`
2. Searches for their business
3. Submits claim request with:
   - Email
   - Phone
   - Best time to call
   - Business ID(s)

4. **Currently:** Claims stored in Weaviate `BusinessClaim` collection
5. **Future:** Migrate to Postgres for better management
6. **Future Pipeline:** Business owners update Weaviate directly after verification

### Tables Needed (Future)

```sql
CREATE TABLE business_claims (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  requester_email VARCHAR(255) NOT NULL,
  requester_phone VARCHAR(50) NOT NULL,
  best_time_to_call VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  multiple_businesses BOOLEAN DEFAULT false
);

CREATE TABLE business_updates (
  id SERIAL PRIMARY KEY,
  business_id VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  update_type VARCHAR(50), -- 'hours', 'phone', 'address', 'description'
  old_value TEXT,
  new_value TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP,
  applied_to_weaviate BOOLEAN DEFAULT false
);
```

## Migration Strategy

### Phase 1: Current (POC)
- ✅ Claims stored in Weaviate
- ✅ Manual review process
- ✅ Manual Weaviate updates

### Phase 2: Postgres Integration
- Move claims to Postgres
- Admin dashboard for reviewing claims
- Track verification status

### Phase 3: Self-Service Pipeline
- Verified business owners get portal access
- Update their own business info
- Auto-sync approved changes to Weaviate
- Maintain data quality with approval workflow

## For Vercel Deployment

Add **only** the `DATABASE_URL` to Vercel for now:

```
DATABASE_URL=postgresql://neondb_owner:npg_a4ZTHPhd0vUk@ep-purple-flower-adojthe1-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

The rest can be added when you implement Postgres integration.

## Security Note

**DO NOT commit the Neon database credentials to GitHub!**
- ✅ Already in `.env.local` (ignored by git)
- ✅ Add to Vercel environment variables
- ❌ Never hardcode in source files

## Next Steps

1. Deploy POC to Vercel with current Weaviate claim system
2. After city officials approve, migrate claims to Postgres
3. Build admin dashboard for claim management
4. Implement business owner self-service portal

---

**Current Status:** Database configured, ready for future integration.

