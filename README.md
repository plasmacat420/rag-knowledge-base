# RAG Knowledge Base
> Upload documents. Ask questions. Get answers grounded in your content — with source citations.

![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![LangChain](https://img.shields.io/badge/LangChain-0.2-green?logo=chainlink&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)
![CI](https://img.shields.io/github/actions/workflow/status/plasmacat420/rag-knowledge-base/ci.yml?label=CI)

---

## What is RAG?

RAG (Retrieval-Augmented Generation) is a technique that grounds AI answers in your own documents rather than relying solely on a language model's training data. When you ask a question, the system first retrieves the most relevant passages from your uploaded files, then feeds those passages to the LLM as context so it can produce a factually grounded answer. This means the AI only answers from what's in your documents — and it tells you exactly which source it used.

---

## Screenshots

<!-- screenshot: upload panel -->
<!-- screenshot: chat with sources -->

---

## Features

- **Document Upload** — Upload PDF and plain text files (up to 10MB each) via drag-and-drop or file picker
- **Automatic Chunking** — Documents are split into overlapping chunks with configurable size and overlap
- **Vector Search** — Chunks are embedded and stored in ChromaDB for fast cosine-similarity retrieval
- **Streaming Chat** — Answers stream token-by-token via Server-Sent Events for a responsive feel
- **Source Citations** — Every answer includes expandable source cards showing the exact chunk and relevance score
- **Document Filtering** — Select specific documents to scope queries to a subset of your knowledge base
- **Delete Documents** — Remove documents and their vectors from the store at any time
- **Dark UI** — Clean dark-mode interface built with Tailwind CSS and Lucide icons
- **Dockerized** — Full stack runs with a single `docker compose up`
- **CI/CD** — GitHub Actions for lint, test, Docker image publish, and GitHub Pages deployment

---

## Quick Start

### Option 1: Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/plasmacat420/rag-knowledge-base.git
cd rag-knowledge-base

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env and set your OPENAI_API_KEY

# 3. Start everything
docker compose up --build

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Option 2: Manual Setup

**Backend**

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install dependencies
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Edit .env and set OPENAI_API_KEY

# Run the API server
uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/documents/upload` | Upload a PDF or TXT file |
| `GET` | `/api/documents` | List all uploaded documents |
| `DELETE` | `/api/documents/{id}` | Delete a document and its vectors |
| `POST` | `/api/query` | Stream an answer (SSE) for a question |

Full interactive docs available at `http://localhost:8000/docs` when the backend is running.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌──────────────────┐          ┌────────────────────────┐   │
│  │   Upload Panel   │          │      Chat Panel        │   │
│  │   (drag & drop)  │          │  (SSE streaming chat)  │   │
│  └────────┬─────────┘          └──────────┬─────────────┘   │
│           │ multipart/form-data            │ POST /api/query │
└───────────┼────────────────────────────────┼─────────────────┘
            │                                │
            ▼                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Python)                   │
│                                                             │
│  POST /api/documents/upload        POST /api/query          │
│         │                                 │                 │
│         ▼                                 ▼                 │
│  ┌─────────────┐                  ┌──────────────┐          │
│  │  embeddings │                  │  vectorstore │          │
│  │  .py        │                  │  .search()   │          │
│  │ (PyPDF /    │                  └──────┬───────┘          │
│  │  TextLoader)│                         │ top-k chunks     │
│  │ text_split  │                         ▼                  │
│  └──────┬──────┘                  ┌──────────────┐          │
│         │ chunks                  │  rag.py      │          │
│         ▼                         │ (LangChain + │          │
│  ┌─────────────┐                  │  gpt-4o-mini)│          │
│  │  ChromaDB   │◄─────────────────│  astream()   │          │
│  │  (persist)  │  embed_query     └──────┬───────┘          │
│  └─────────────┘                         │ SSE tokens       │
│                                          ▼                  │
│                                   StreamingResponse         │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
     OpenAI API (embeddings + chat)
```

---

## How RAG Works

1. **Ingest** — When you upload a document, it is split into overlapping text chunks. Each chunk is converted into a vector embedding using OpenAI's embedding model and stored in ChromaDB.

2. **Retrieve** — When you ask a question, your question is also embedded. The system performs a cosine-similarity search to find the top-k most relevant chunks from your documents.

3. **Generate** — The retrieved chunks are assembled into a context prompt and sent to GPT-4o-mini along with your question. The model streams back an answer grounded only in that context, and the source chunks are returned alongside the answer.

---

## Development

### Run Tests

```bash
cd backend
pytest -v
```

### Run Tests with Coverage

```bash
cd backend
pytest --cov=app --cov-report=term-missing -v
```

### Lint and Format

```bash
cd backend
ruff check .
ruff format .
```

### Frontend Dev Server

```bash
cd frontend
npm run dev
```

### Frontend Production Build

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

---

## Deployment

### Docker Image (GHCR)

The `docker-publish.yml` workflow automatically builds and pushes a multi-arch (amd64 + arm64) Docker image to GitHub Container Registry on every push to `main`.

```bash
docker pull ghcr.io/plasmacat420/rag-knowledge-base-backend:latest
```

### GitHub Pages (Frontend)

The `pages.yml` workflow builds the React app and deploys it to GitHub Pages on every push to `main`. The `VITE_API_URL` is set to an empty string so you can configure a reverse proxy or update it to your backend URL.

### Production Stack

```bash
# Copy and configure production env
cp backend/.env.example .env
# Edit .env with production values

# Pull and start
docker compose -f docker-compose.prod.yml up -d
```

---

## License

MIT License — see [LICENSE](LICENSE) for details.

Copyright (c) 2024 plasmacat420
