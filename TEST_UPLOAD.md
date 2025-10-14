# Test Upload - Quick Verification

## What This Does

The test script will:
1. ✅ Upload 3 sample businesses
2. ✅ Upload 2 sample documents  
3. ✅ Test semantic search
4. ✅ Show you it works!

Takes ~30 seconds.

---

## Step 1: Make Sure You Have .env.local

```bash
# Should already exist, but verify:
cat .env.local
```

Should show:
```
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_api_key
...
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `weaviate-client` - Connect to Weaviate
- `tsx` - Run TypeScript scripts
- `dotenv` - Load environment variables

---

## Step 3: Test Connection

```bash
npm run weaviate:test
```

Expected output:
```
🔍 Testing Weaviate Connection...

Environment check:
  WEAVIATE_URL: ✅
  WEAVIATE_API_KEY: ✅

🔗 Connecting to Weaviate Cloud...
✅ Connection successful!

Cluster information:
  Version: 1.33.0
  Hostname: your_weaviate_instance

Collections: 0
📝 No collections found. Run: npm run weaviate:setup
```

---

## Step 4: Create Schema

```bash
npm run weaviate:setup
```

Expected output:
```
🔗 Connecting to Weaviate...
✅ Connected!

📋 Creating schema...

Creating Business collection...
✅ Business collection created
Creating Document collection...
✅ Document collection created
Creating MunicipalService collection...
✅ MunicipalService collection created

🎉 Schema setup complete!
```

---

## Step 5: Test Upload

```bash
npm run weaviate:test-upload
```

Expected output:
```
🧪 Testing Weaviate Upload with Sample Data

🔗 Connecting to Weaviate...
✅ Connected!

📤 Uploading test businesses...
  ✅ Test Restaurant #1
  ✅ Test HVAC Company
  ✅ Test Grocery Store

✅ Uploaded 3 businesses

📤 Uploading test documents...
  ✅ Test Bylaw - Noise Control
  ✅ Test Permit - Building Application

✅ Uploaded 2 documents

🔍 Testing search...

Query: "restaurant"
  Found 1 results:
    - Test Restaurant #1 (restaurants_food)

Query: "heating cooling HVAC"
  Found 1 results:
    - Test HVAC Company (hvac)

Query: "noise bylaws regulations"
  Found 1 results:
    - Test Bylaw - Noise Control (bylaw)

📊 Collection Stats:
  Business objects: 3
  Document objects: 2

🎉 Test upload successful!
```

---

## Step 6: Check Weaviate Dashboard

Go to: https://console.weaviate.cloud/

Navigate to your cluster → Collections

You should see:
- **Business**: 3 objects
- **Document**: 2 objects
- **MunicipalService**: 0 objects

---

## Step 7: Clear Test Data (Optional)

If you want to start fresh:

```bash
npm run weaviate:clear
```

This deletes all test objects.

---

## What This Proves

✅ **Connection works** - Your Weaviate cluster is accessible  
✅ **Schema created** - Collections are properly configured  
✅ **Upload works** - Can insert data  
✅ **Vectorization works** - Text is being embedded  
✅ **Search works** - Semantic search returns results  

**If all 5 steps succeed, you're ready for full upload!**

---

## Troubleshooting

### "Cannot find module 'weaviate-client'"
```bash
npm install
```

### "Missing environment variables"
Check your `.env.local` file exists and has correct values.

### "Collection not found"
Run `npm run weaviate:setup` first.

### "Connection timeout"
- Check internet connection
- Verify Weaviate URL is correct
- Make sure cluster hasn't expired

### "Rate limit" or "Too many requests"
With built-in vectorizer, this shouldn't happen. But if it does, wait a minute and try again.

---

## Next Steps After Successful Test

1. ✅ Test worked
2. ⏭️ Create full upload script (uploads all 2,085 files)
3. ⏭️ Build chat API
4. ⏭️ Build chat UI
5. ⏭️ Deploy to Vercel

**Test first, then we'll build the real thing!**

