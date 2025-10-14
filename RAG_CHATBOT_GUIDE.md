# Terrace AI RAG Chatbot - Complete Guide

## 🎯 What You Have

A fully functional **Retrieval-Augmented Generation (RAG) chatbot** powered by:
- **xAI Grok** - For intelligent response generation
- **Weaviate Vector Database** - With 2,793 vectorized objects
- **Hugging Face Embeddings** - Free tier semantic search
- **Next.js 14** - Modern React framework

---

## 📊 Your Data

### Total Objects in Weaviate: **2,793**

- ✅ **1,128 Businesses** 
  - Contact info, addresses, phones
  - Categories and subcategories
  - Descriptions and ratings

- ✅ **308 Municipal Documents**
  - Bylaws and regulations
  - Permits and applications
  - Planning documents
  - Tax information
  - Recreation schedules

---

## 🚀 How to Run the Chatbot

### Option 1: Development Mode

```bash
cd terrace-ai-chatbot
npm run dev
```

Visit: `http://localhost:3000`

### Option 2: Production Build

```bash
cd terrace-ai-chatbot
npm run build
npm run start
```

---

## 💬 Try These Queries

### Business Queries:
- "Find HVAC contractors in Terrace"
- "Where can I get groceries?"
- "Show me restaurants near downtown"
- "I need a plumber"

### Municipal Queries:
- "What are the noise bylaws?"
- "How do I apply for a building permit?"
- "What are the property tax rates?"
- "Tell me about recreation programs"

### Mixed Queries:
- "I want to start a business, what permits do I need?"
- "Are there any contractors who can help with renovations?"

---

## 🔧 How It Works

1. **User asks a question** → Frontend (React/Next.js)
   
2. **Query is sent** → `/api/chat-rag` endpoint
   
3. **Weaviate searches** → Finds relevant businesses/documents using semantic similarity
   
4. **Context is built** → Top 5 most relevant results
   
5. **xAI Grok generates** → Natural language answer based on context
   
6. **Response displayed** → With source cards showing businesses/documents

---

## 🎨 UI Features

- **Real-time chat interface** - Smooth, responsive
- **Confidence badges** - Shows AI confidence level
- **Business cards** - With address, phone, category
- **Document cards** - With summaries and categories
- **Source attribution** - Shows how many sources used
- **Typing indicators** - Professional UX

---

## 🔑 Environment Variables

Configure in `.env.local` file:

```env
# Weaviate (Vector Database)
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_key

# Hugging Face (Embeddings)
HUGGINGFACE_API_KEY=your_huggingface_key

# Groq (Orchestrator/Discriminator)
GROQ_API_KEY=your_groq_key

# xAI (Response Generation)
XAI_API_KEY=your_xai_key
```

---

## 📁 Key Files

### Core RAG System:
- `src/lib/rag-system.ts` - Main RAG logic (search + generation)
- `src/lib/xai-client.ts` - xAI Grok API client
- `src/app/api/chat-rag/route.ts` - Chat API endpoint

### UI Components:
- `src/components/ChatInterface.tsx` - Main chat UI
- `src/components/MessageBubble.tsx` - Message display with source cards
- `src/app/page.tsx` - Homepage

### Data Scripts:
- `scripts/upload-terrace-data.ts` - Upload all data to Weaviate
- `scripts/retry-failed.ts` - Retry failed uploads
- `scripts/test-search.ts` - Test semantic search
- `scripts/clear-data.ts` - Clear all data

---

## 💰 Cost Breakdown

### Current Setup (Free/Low Cost):

1. **Hugging Face Embeddings**: FREE
   - Generous rate limits
   - No monthly fees

2. **Weaviate Cloud**: FREE (14-day trial)
   - Expires: October 26, 2025
   - 300K object limit (you're using 2,793)
   - Upgrade to keep after trial (~$25/month for Sandbox)

3. **xAI Grok API**: PAY-AS-YOU-GO
   - `grok-beta` model (cost-effective)
   - Typical cost: ~$0.50-$2.00 per 1,000 questions
   - Very affordable for municipal chatbot

### Estimated Monthly Cost:
- **Development/Testing**: ~$5-10/month
- **Light Production** (100 queries/day): ~$15-30/month
- **Medium Production** (500 queries/day): ~$50-100/month

---

## 🛠️ Useful Commands

```bash
# Test Weaviate connection
npm run weaviate:test

# Test semantic search
npm run weaviate:test-search

# Re-upload all data
npm run weaviate:upload-terrace

# Clear all data
npm run weaviate:clear

# Build for production
npm run build

# Type check
npm run type-check

# Lint code
npm run lint
```

---

## 🔄 Updating Data

If you get new businesses or documents:

1. Add JSON files to `TERRACE_DATA/` directory
2. Run: `npm run weaviate:upload-terrace`
3. It will automatically:
   - Detect new files
   - Vectorize them with Hugging Face
   - Upload to Weaviate
   - Skip existing files

---

## 📈 Next Steps

### Improvements:
1. **Add conversation history** - Remember previous messages
2. **Add filters** - Category, location, price range
3. **Add ratings** - User feedback on answers
4. **Add admin panel** - Manage businesses/documents
5. **Deploy to production** - Vercel, Railway, or your own server

### Deployment Options:
- **Vercel** - Easiest, free tier available
- **Railway** - Good for Node.js apps
- **AWS/GCP** - Full control

---

## 🐛 Troubleshooting

### Chatbot not responding?
- Check `.env.local` has all keys
- Check Weaviate cluster is running
- Check xAI API key is valid

### Slow responses?
- Normal for first query (cold start)
- Hugging Face free tier can be slow
- Consider upgrading Weaviate plan

### No search results?
- Data might not be uploaded
- Run: `npm run weaviate:test-search`
- Check: `npm run weaviate:test`

---

## 📞 Support

- xAI Documentation: https://x.ai/api
- Weaviate Docs: https://weaviate.io/developers/weaviate
- Hugging Face: https://huggingface.co/docs

---

## ✅ What's Working

- ✅ 2,793 objects vectorized and searchable
- ✅ xAI Grok integration complete
- ✅ Semantic search with Hugging Face embeddings
- ✅ Beautiful UI with source attribution
- ✅ Confidence scoring
- ✅ Business and document search
- ✅ Fast, responsive interface
- ✅ Production build successful

**You're ready to launch! 🚀**

