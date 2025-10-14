# Terrace AI Chatbot

AI-powered assistant for the City of Terrace, BC providing information about local businesses, municipal services, bylaws, and regulations.

## Features

- **Business Directory Search**: Find local businesses, contractors, restaurants, and services
- **Municipal Information**: Access bylaws, permits, procedures, and regulations
- **Multi-Stage RAG Pipeline**: Intelligent query routing and response generation
- **Conversation Memory**: Maintains context for follow-up questions
- **Cost-Optimized**: Uses Groq for internal processing, xAI for premium responses

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Vector Database**: Weaviate Cloud
- **AI Models**:
  - Groq (Llama 3.1 8B) - Query orchestration & filtering
  - xAI Grok 2 - Response generation
  - Hugging Face - Text embeddings
- **Deployment**: Vercel-ready

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Environment variables (see below)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file with:

```env
# Weaviate Vector Database
WEAVIATE_URL=your_weaviate_url
WEAVIATE_API_KEY=your_weaviate_api_key

# Hugging Face (Embeddings)
HUGGINGFACE_API_KEY=your_huggingface_key

# Groq (Orchestrator/Discriminator)
GROQ_API_KEY=your_groq_api_key

# xAI (Response Generation)
XAI_API_KEY=your_xai_api_key

# Optional: Use Groq for generation (saves 94% on xAI credits)
USE_GROQ_FOR_GENERATION=false

# Optional: Stripe (for business subscriptions)
STRIPE_SECRET_KEY=your_stripe_key
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
```

### Development

```bash
npm run dev
```

Visit http://localhost:3000

### Production

```bash
npm run build
npm run start
```

## Deployment to Vercel

1. Push this repo to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Install dependencies
- Build the Next.js app
- Deploy to production URL

## API Endpoints

- `POST /api/chat-rag` - Main RAG-powered chat endpoint
- `GET /api/businesses` - List businesses
- `GET /api/businesses/search?q=query` - Search businesses

## Architecture

```
User Query
    ↓
Groq Orchestrator (JSON mode) - Analyzes intent
    ↓
Weaviate Vector Search - Retrieves candidates
    ↓
Groq Discriminator (JSON mode) - Filters results
    ↓
xAI Grok Generator - Creates natural language response
    ↓
User receives answer with sources
```

## Data

**NOT included in this repository (private)**:
- Business data (1,127+ businesses)
- Municipal documents (308+ documents)
- Training data

Data is stored in Weaviate Cloud and accessed via API.

## Cost per Query

- Groq (orchestrator + discriminator): ~$0.0002
- xAI Grok (response generation): ~$0.008
- **Total: ~$0.008 per query**

## Security

- ✅ No API keys hardcoded
- ✅ All secrets in environment variables
- ✅ .env.local excluded from git
- ✅ Data not included in repository

## Testing

27 comprehensive test scenarios completed:
- Business search: 90% success
- Municipal queries: 95% success
- Multi-question: 85% success
- Conversation flows: 60% success

See `TEST_RESULTS.md` for details.

## License

Private - City of Terrace POC

## Support

For questions or issues, contact the development team.

