# DONNA

**Distributed Organizational Neural Network Assistant**

<div align="center">

*Transforming scattered organizational history into actionable institutional knowledge*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://www.python.org/)

</div>

---

## The Problem

Organizations suffer from **institutional amnesia**:

- **Repeated Mistakes**: Teams lack visibility into past failures and repeat them
- **Knowledge Loss**: When employees leave, critical context and reasoning disappears  
- **Slow Onboarding**: New hires can't understand why systems exist or how they evolved
- **Context Fragmentation**: Critical knowledge is scattered across Slack, GitHub, Jira, Confluence, and Docs

The question "Has anyone tried this before?" echoes through Slack channels, met with silence or vague memories.

---

## The Solution

**DONNA** is an AI-powered institutional memory assistant that captures, contextualizes, and surfaces historical organizational knowledge through conversational exploration of real case studies.

### How DONNA Helps

- **Learns from History**: Analyzes codebases, docs, tickets, and communication tools to understand what worked, what failed, and why
- **Understands Previous Work**: Builds a contextual map of past projects, showing how systems evolved and why certain choices were made
- **Warns Before Mistakes**: Proactively flags decisions similar to past failures with context, impact, and proven solutions
- **Preserves Organizational Wisdom**: Knowledge persists beyond employee tenure—new hires learn from years of experience from day one

---

## Features

### Case-Based Learning
Explore four interactive case workspaces, each representing a real company's historical data including Slack discussions, GitHub commits, Jira tickets, Confluence documentation, and Google Docs notes.

### Conversational AI
Ask DONNA anything about organizational history and receive contextual, AI-generated answers using the company's data as reference.

### Polished Interface
- Elegant black-and-white aesthetic
- Smooth animations via Framer Motion
- Mobile-responsive design
- Collapsible context panels
- Smart query suggestions

### Intelligent Context
- **Vector Search**: Semantic understanding via Qdrant vector database
- **Separate Chat Threads**: Each case maintains its own workspace memory
- **Streamed Responses**: Real-time AI generation for fluid interaction

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        DONNA Frontend                      │
│              Next.js 15 + TypeScript + Tailwind            │
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐    │
│  │   Landing   │  │     Case     │  │   Chat Thread   │    │
│  │    Page     │──│   Workspace  │──│   (per case)    │    │
│  └─────────────┘  └──────────────┘  └─────────────────┘    │
└────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌────────────────────────────────────────────────────────────┐
│                      DONNA Backend                         │
│                  FastAPI + Python 3.12                     │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   MongoDB    │  │    Qdrant    │  │    Ollama    │      │
│  │  Metadata &  │  │Vector Search │  │  Embeddings  │      │
│  │  User Data   │  │ (localhost)  │  │(nomic-embed) │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                            │
│                    ┌──────────────┐                        │
│                    │Google Gemini │                        │
│                    │  AI Engine   │                        │
│                    └──────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend**
- Next.js 15 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Framer Motion
- AI SDK (Vercel)

**Backend**
- FastAPI
- Python 3.12
- MongoDB (company data, metadata)
- Qdrant (vector database)
- Ollama (nomic-embed-text embeddings)
- Google Gemini AI (chat generation)

---

## Getting Started

### Prerequisites

Ensure you have the following installed and running:
- Node.js 18+
- Python 3.12+
- MongoDB instance
- Qdrant vector database (localhost:6333)
- Ollama (with nomic-embed-text model)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Manas-Nanivadekar/DONNA.git
   cd DONNA
   git checkout dev
   ```

2. **Set up environment variables**

   Create a `.env.local` file in the root directory:
   ```env
   # Google Gemini AI
   GOOGLE_API_KEY=your_google_api_key_here
   
   # MongoDB
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB_NAME=donna
   
   # Qdrant
   QDRANT_HOST=localhost
   QDRANT_PORT=6333
   
   # Ollama
   OLLAMA_BASE_URL=http://localhost:11434
   ```

3. **Install frontend dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

4. **Install backend dependencies**
   ```bash
   # Create and activate virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install Python packages
   pip install -r requirements.txt
   ```

5. **Start required services**
   ```bash
   # Start MongoDB (if not already running)
   mongod
   
   # Start Qdrant
   docker run -p 6333:6333 qdrant/qdrant
   
   # Start Ollama
   ollama serve
   
   # Pull required embedding model
   ollama pull nomic-embed-text
   ```

6. **Run the application**
   ```bash
   pnpm dev
   ```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3000/api/*`

---

## 📂 Project Structure

```
DONNA/
├── api/                          # FastAPI Backend
│   ├── index.py                  # Main API endpoint
│   ├── services/
│   │   ├── vector_store.py       # Qdrant vector operations
│   │   ├── embedding.py          # Ollama embeddings
│   │   └── llm.py                # Gemini AI integration
│   └── utils/
│       ├── stream.py             # Response streaming
│       ├── prompt.py             # Prompt engineering
│       └── attachment.py         # File handling
│
├── app/                          # Next.js Frontend
│   ├── (chat)/
│   │   ├── page.tsx              # Main chat page
│   │   └── [caseId]/             # Dynamic case routes
│   ├── cases/
│   │   └── page.tsx              # Case selection landing
│   ├── layout.tsx                # Root layout
│   └── api/                      # API route handlers
│
├── components/                   # React Components
│   ├── chat.tsx                  # Chat interface
│   ├── case-card.tsx             # Case preview cards
│   ├── context-panel.tsx         # Collapsible summary
│   ├── suggestions-panel.tsx     # Query suggestions
│   ├── message.tsx               # Chat message display
│   ├── multimodal-input.tsx      # Chat input field
│   └── ui/                       # Reusable UI components
│
├── lib/
│   ├── db/
│   │   ├── mongodb.ts            # MongoDB client
│   │   └── models.ts             # Data models
│   └── utils.ts                  # Utility functions
│
├── hooks/
│   ├── use-chat-history.tsx      # Per-case chat state
│   └── use-scroll-to-bottom.tsx  # Auto-scroll
│
├── public/
│   └── cases/                    # Case metadata & assets
│
├── requirements.txt              # Python dependencies
├── package.json                  # Node.js dependencies
└── vercel.json                   # Deployment config
```

---

## User Experience Flow

1. **Landing Page**: User sees four case study cards
2. **One-Time Registration**: User provides name and email (stored locally)
3. **Case Selection**: Click a case to enter its workspace
4. **Workspace Interface**:
   - **Left Panel**: Collapsible case summary with full historical context
   - **Center**: Chat interface for conversational exploration
   - **Right Panel**: Suggested queries that prefill the input
5. **Exploration**: Ask questions, receive AI-streamed answers based on company data
6. **Case Switching**: Each case maintains its own separate chat thread

---

## API Endpoints

### `POST /api/chat`
Main chat endpoint for conversational AI

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Why did Project Phoenix fail?"
    }
  ],
  "caseId": "company-a",
  "userId": "user-123"
}
```

**Response:**
Streamed text using Data Stream Protocol

### `GET /api/cases`
Fetch all available case studies

**Response:**
```json
{
  "cases": [
    {
      "id": "company-a",
      "name": "Company A: The Scaling Crisis",
      "description": "How rapid growth without infrastructure led to collapse",
      "dataPoints": 1247
    }
  ]
}
```

### `GET /api/cases/:caseId`
Fetch specific case details and context

---

## Example Queries

Each case workspace includes intelligent query suggestions:

**For a Failed Product Launch:**
- "What were the key warning signs before launch?"
- "How did internal communication break down?"
- "What technical debt contributed to the failure?"

**For a Scaling Crisis:**
- "When did the infrastructure problems start?"
- "What architectural decisions caused bottlenecks?"
- "How did the team respond to the outage?"

**For a Successful Pivot:**
- "What data informed the pivot decision?"
- "How did the team align on the new direction?"
- "What was the turning point in customer adoption?"

---

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

<div align="center">

**DONNA** - *Because your organization's past deserves a future*

⭐ Star this repo if you believe in preserving institutional knowledge!

</div>
