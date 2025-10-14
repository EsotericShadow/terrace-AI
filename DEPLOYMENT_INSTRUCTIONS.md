# Deployment Instructions for Vercel

## ✅ Security Checklist (Completed)

- ✅ All hardcoded API keys removed from code
- ✅ Secrets moved to environment variables
- ✅ .env.local excluded from git
- ✅ Private data (TERRACE_DATA) NOT in repository
- ✅ Business names cleaned (no corporate artifacts)
- ✅ Code committed to git

## 📦 What's in GitHub

**Included:**
- Full Next.js application code
- React components and UI
- API routes (RAG system)
- TypeScript libraries
- Configuration files
- Documentation
- Test results

**NOT Included (as intended):**
- `.env.local` (your API keys)
- `node_modules/` (dependencies)
- `.next/` (build artifacts)
- Private business data
- Training data
- Nested duplicate directories

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub (In Progress)

```bash
# You'll need to provide your GitHub repo URL, then:
cd "/Users/main/Desktop/untitled folder/terrace_ai 2/terrace-ai-chatbot"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin master
```

### Step 2: Import to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables in Vercel

Add these in Vercel Dashboard → Settings → Environment Variables:

```
WEAVIATE_URL=your_weaviate_url_from_env_local
WEAVIATE_API_KEY=your_weaviate_key_from_env_local
HUGGINGFACE_API_KEY=your_huggingface_key_from_env_local
GROQ_API_KEY=your_groq_key_from_env_local
XAI_API_KEY=your_xai_key_from_env_local
USE_GROQ_FOR_GENERATION=false
```

**Copy the actual values from your local `.env.local` file.**

**Important:** Add these as "Production", "Preview", and "Development" environment variables.

### Step 4: Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build Next.js app
- Deploy to https://your-app.vercel.app

Takes ~2-3 minutes.

### Step 5: Test

Visit your Vercel URL and test:
- "Find HVAC contractors"
- "What are the noise bylaws?"
- "I need a plumber"

## 💰 Expected Costs (POC Phase)

### Vercel
- **Free tier**: Sufficient for POC demo
- No credit card required initially

### APIs (250 queries for city officials)
- xAI: 250 × $0.008 = **$2.00**
- Groq: Effectively free (negligible)
- Weaviate Cloud: Free during trial
- Hugging Face: Free tier

**Total POC Cost: ~$2.00** (well within your $10 budget)

## 🎯 For City Officials Demo

### Suggested Demo Flow

1. **Business Search**
   - "Find restaurants in Terrace"
   - "I need a plumber"
   - "Find HVAC contractors"

2. **Municipal Information**
   - "What are the noise bylaws?"
   - "How do I get a dog license?"
   - "How much does a building permit cost?"

3. **Conversation**
   - "Find Tim Hortons"
   - "Do they have a drive-through?" (follow-up)

4. **Multi-Question**
   - "I just moved to Terrace. How do I get a dog license and what are the noise bylaws?"

### What to Highlight

- ✅ Clean, professional business names (no corporate artifacts)
- ✅ Detailed bylaw information (not "call city hall")
- ✅ Fast responses (2-4 seconds)
- ✅ Accurate results
- ✅ Conversational interface
- ✅ Cost-effective ($0.008 per query)

## 🐛 Known Limitations (Be Transparent)

1. Some businesses missing phone numbers/hours (data enrichment needed)
2. Follow-up questions with vague pronouns may lose context
3. Very complex multi-part queries (4+ topics) may trigger clarification
4. System optimized for single-topic queries

These are minor and can be improved based on feedback.

## 🔒 Data Privacy

**Emphasize to City Officials:**
- Business data is private and stored securely in Weaviate Cloud
- No raw data in GitHub repository
- All API communications encrypted
- No user queries stored (stateless except session memory)

## 📊 Success Metrics to Share

- **27 test scenarios** across 7 user personas
- **78% success rate** on first try
- **Business search:** 90% success
- **Municipal queries:** 95% success
- **Response time:** 2-4 seconds
- **Cost:** $0.008 per query (~125 queries per dollar)

## Next Steps After Demo

1. Gather feedback from city officials
2. Prioritize improvements based on their input
3. Enrich business data (add missing phones/hours)
4. Consider public beta launch
5. Monitor costs and usage patterns

---

**The prototype is ready for deployment!** 🚀

