# AskDoc Frontend — Enterprise Document Intelligence & Hybrid RAG Interface

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12.0-0055FF?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Supabase Auth](https://img.shields.io/badge/Supabase-Auth_%26_JWT-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

**High-performance, modern Next.js user interface for the AskDoc Document Intelligence platform. Features real-time Server-Sent Events (SSE) streaming, structure-aware document visualization, interactive citation inspection, dynamic Bring-Your-Own-Key (BYOK) Gemini configuration, and evaluation dashboards.**

[Live Web Application](https://askdoc.dilip.website) • [GitHub Repository](https://github.com/DJ-InfinityCoder/RAG) • [Author Portfolio](https://dilipmeghwal.in)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Core UI Components](#core-ui-components)
  - [1. ChatInterface & Real-Time SSE Stream](#1-chatinterface--real-time-sse-stream)
  - [2. ChatArea & Inline Citation Inspector](#2-chatarea--inline-citation-inspector)
  - [3. Structure-Aware InputArea](#3-structure-aware-inputarea)
  - [4. Bring-Your-Own-Key (BYOK) & Free Tier Modals](#4-bring-your-own-key-byok--free-tier-modals)
  - [5. Responsive Sidebar & Session Management](#5-responsive-sidebar--session-management)
  - [6. Settings & Gemini Model Selector](#6-settings--gemini-model-selector)
  - [7. Evaluation & Benchmark Dashboard](#7-evaluation--benchmark-dashboard)
- [State Management & Data Layer](#state-management--data-layer)
- [Environment Configuration](#environment-configuration)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [Production Build](#production-build)
- [SEO, Metadata & PWA Support](#seo-metadata--pwa-support)
- [Author & Credits](#author--credits)

---

## Overview

**AskDoc Frontend** provides a responsive, desktop-and-mobile optimized web interface for querying complex documents. Built with **Next.js 16 (Turbopack)**, **React 19**, and **Tailwind CSS v4**, the application delivers sub-millisecond perceived latency through optimistic UI mutations, token-by-token streaming, and client-side caching.

It connects to the FastAPI backend via authenticated REST endpoints and real-time SSE streams, transmitting custom Gemini API keys and model overrides directly from the browser without storing credentials on third-party servers.

---

## Architecture & Tech Stack

```text
[ Browser / Client ]
       │
       ├── Next.js App Router (Turbopack)
       │     ├── /chat/[id] (SSE Streaming Chat)
       │     ├── /evaluation (Benchmark Dashboard)
       │     ├── /docs (Platform Reference)
       │     └── / (Landing Page)
       │
       ├── UI & Styling Layer
       │     ├── Tailwind CSS v4 (Design Tokens & Color Modes)
       │     ├── Framer Motion (Smooth Transitions & Micro-Interactions)
       │     └── Lucide React (Clean Vector Icons)
       │
       ├── State & Data Fetching
       │     ├── SWR (Stale-While-Revalidate Caching)
       │     ├── Custom SSE Stream Consumer (ReadableStream Parser)
       │     └── Supabase Auth Listener (Session & JWT Synchronization)
       │
       └── Backend Integration
             ├── REST API (FastAPI @ https://askdoc.dilip.website/api)
             └── BYOK Headers (X-Gemini-API-Key, X-Gemini-Model)
```

---

## Key Features

- **Real-Time Token Streaming**: Consumes Server-Sent Events (SSE) with live progress indicators showing retrieval, reranking, and generation status.
- **Interactive Citation Inspector**: Displays inline clickable citation pills (`[1]`, `[2]`) linked to source passages, page coordinates, and relevance scores.
- **Multi-Format Document Ingestion**: Upload interface supporting PDF, Word (DOCX), PowerPoint (PPTX), Excel (XLSX), CSV, and raw text snippets.
- **Bring-Your-Own-Key (BYOK)**: Flexible configuration modal allowing users to enter their personal Google Gemini API key and switch between Gemini 3.6 Flash, 2.5 Flash, 2.5 Pro, and 1.5 Pro.
- **Free Tier Quota Management**: Built-in 2-message / 1-document / 1-session demo tracking that smoothly prompts users to connect their own key when exhausted.
- **LLM-as-a-Judge Evaluation Dashboard**: Visual interface for running and viewing relevance, faithfulness, and completeness benchmarks across documents.
- **Session Lifecycle & History**: Create, rename, switch, and delete sessions with instant optimistic cache updates.
- **Dark & Light Mode**: Complete theme system with persistent local storage and CSS variables.

---

## Project Structure

```text
RagFrontend/
├── app/                               # Next.js App Router pages
│   ├── chat/                          # Conversational document intelligence
│   │   ├── [id]/page.tsx              # Deep-linked session chat route
│   │   └── page.tsx                   # Default chat landing route
│   ├── docs/page.tsx                  # Interactive platform documentation
│   ├── evaluation/page.tsx            # RAG benchmark evaluation suite
│   ├── privacy/page.tsx               # Privacy policy
│   ├── terms/page.tsx                 # Terms of service
│   ├── globals.css                    # Design tokens, fonts, and dark mode variables
│   ├── layout.tsx                     # Root layout with fonts, metadata, and providers
│   ├── manifest.ts                    # Progressive Web App (PWA) manifest
│   ├── page.tsx                       # Landing page with interactive demo
│   ├── robots.ts                      # Dynamic robots.txt generator
│   └── sitemap.ts                     # Dynamic XML sitemap generator
├── components/                        # React UI component library
│   ├── home/                          # Landing page feature sections
│   ├── ui/                            # Modal, Button, and input primitives
│   ├── ApiKeySetupModal.tsx           # First-time onboarding & BYOK setup modal
│   ├── AuthModal.tsx                  # Supabase login and sign-up dialog
│   ├── AuthProvider.tsx               # Global authentication context & state
│   ├── ChatArea.tsx                   # Message history, citations, and status banner
│   ├── ChatInterface.tsx              # Primary orchestration container for chat
│   ├── ChatSkeleton.tsx               # Loading skeleton placeholder
│   ├── HealthStatus.tsx               # Real-time backend connectivity badge
│   ├── InputArea.tsx                  # Text input, file dropzone, and text ingestion
│   ├── OfflineBanner.tsx              # Network disconnection warning bar
│   ├── Providers.tsx                  # SWR, Theme, and Auth wrapper
│   ├── SettingsDialog.tsx             # BYOK API key and model selection settings
│   ├── Sidebar.tsx                    # Session list, recency grouping, and key status
│   ├── ThemeProvider.tsx              # Theme context provider
│   └── ThemeToggle.tsx                # Light/Dark toggle button
├── lib/                               # Core client utilities and API clients
│   ├── api.ts                         # REST API functions, SSE parser, and BYOK storage
│   ├── hooks.ts                       # SWR hooks (useSessions, useMessages)
│   ├── supabase.ts                    # Supabase client and auth helper functions
│   ├── useHealthCheck.ts              # Backend health ping hook
│   └── utils.ts                       # ClassName merging and string helpers
├── public/                            # Static assets and icons
├── package.json                       # Dependencies and build scripts
├── tsconfig.json                      # TypeScript configuration
└── README.md                          # Comprehensive documentation
```

---

## Core UI Components

### 1. ChatInterface & Real-Time SSE Stream
Located in [`components/ChatInterface.tsx`](file:///d:/rag/RagFrontend/components/ChatInterface.tsx):
- Manages optimistic UI updates for both user messages and streaming assistant responses.
- Implements `sendMessageStream()` using standard Web `fetch` and `ReadableStreamDefaultReader` to parse incoming SSE events (`status`, `token`, `done`, `error`).
- Enforces free-tier limits on the client side (blocking message 3 and document 2 if no BYOK key is configured, and triggering the setup modal).

### 2. ChatArea & Inline Citation Inspector
Located in [`components/ChatArea.tsx`](file:///d:/rag/RagFrontend/components/ChatArea.tsx):
- Formats AI responses using `react-markdown` and `remark-gfm` for tables, bold emphasis, code blocks, and math formulas.
- Automatically translates source references into interactive numbered badges. Clicking any badge opens a modal displaying the exact excerpt, source file, page number, and similarity score.
- Displays execution metrics (response time, token count, and retrieval confidence).

### 3. Structure-Aware InputArea
Located in [`components/InputArea.tsx`](file:///d:/rag/RagFrontend/components/InputArea.tsx):
- Supports instant file selection and indexing via drag-and-drop.
- Contains a quick-paste modal for indexing raw text snippets or copied articles.
- Auto-resizing textarea with keyboard shortcuts (`Enter` to submit, `Shift+Enter` for multiline).

### 4. Bring-Your-Own-Key (BYOK) & Free Tier Modals
Located in [`components/ApiKeySetupModal.tsx`](file:///d:/rag/RagFrontend/components/ApiKeySetupModal.tsx):
- Automatically greets new users on first login or session creation.
- Explains how to obtain a free Gemini API key from Google AI Studio.
- Offers a **"Try Demo First (2 messages)"** option for immediate testing without configuration.

### 5. Responsive Sidebar & Session Management
Located in [`components/Sidebar.tsx`](file:///d:/rag/RagFrontend/components/Sidebar.tsx):
- Categorizes sessions by recency (*Today*, *Yesterday*, *Previous 7 Days*, *Older*).
- Allows inline renaming of session titles and permanent cascade deletion.
- Features a bottom BYOK widget indicating current active key status or remaining free tier credits.
- Level-aligned with the chat header at `h-[52px]` for visual consistency.

### 6. Settings & Gemini Model Selector
Located in [`components/SettingsDialog.tsx`](file:///d:/rag/RagFrontend/components/SettingsDialog.tsx):
- Dedicated settings card with masked API key entry, visibility toggles, and model selection:
  - `gemini-3.6-flash` (Recommended: High speed & reasoning)
  - `gemini-2.5-flash`
  - `gemini-2.5-pro` (Complex deep analytical reasoning)
  - `gemini-1.5-flash`
  - `gemini-1.5-pro`
- Direct link to purge all user sessions and vector indices.

### 7. Evaluation & Benchmark Dashboard
Located in [`app/evaluation/page.tsx`](file:///d:/rag/RagFrontend/app/evaluation/page.tsx):
- Connects to backend LLM-as-a-judge endpoints.
- Displays comparative scores for Relevance, Accuracy (Faithfulness), and Completeness on visual progress bars with detailed feedback logs.

---

## State Management & Data Layer

- **Data Fetching**: Powered by `SWR` with automatic revalidation on window focus and post-mutation cache updates.
- **Persistent BYOK Storage**: Personal Gemini API keys and model selections are stored directly in browser `localStorage` under `askdoc_gemini_api_key` and `askdoc_gemini_model`.
- **Authentication**: `supabase.auth.onAuthStateChange` synchronizes session JWT tokens and user metadata across all active tabs.

---

## Environment Configuration

Create a `.env.local` file in `RagFrontend/`:

```env
# Backend API Base URL
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
# For Production:
# NEXT_PUBLIC_API_BASE_URL=https://askdoc.dilip.website

# Supabase Auth & Storage Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Getting Started

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm, yarn, or pnpm

### Installation
```bash
git clone https://github.com/DJ-InfinityCoder/RAG.git
cd RAG/RagFrontend

npm install
```

### Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run start
```

---

## SEO, Metadata & PWA Support

- **Dynamic Metadata**: Complete OpenGraph, Twitter Cards, and canonical tags generated in `app/layout.tsx`.
- **Sitemap & Robots**: Automated `sitemap.xml` and `robots.txt` generated using Next.js route handlers (`app/sitemap.ts` and `app/robots.ts`).
- **Web App Manifest**: Configured in `app/manifest.ts` for progressive web app (PWA) installation.

---

## Author & Credits

**Dilip Meghwal**
- **Website**: [https://dilipmeghwal.in](https://dilipmeghwal.in)
- **LinkedIn**: [linkedin.com/in/dilipmeghwal13](https://www.linkedin.com/in/dilipmeghwal13/)
- **GitHub**: [@DJ-InfinityCoder](https://github.com/DJ-InfinityCoder)
- **Contact**: [contact@dilip.website](mailto:contact@dilip.website)

---

<div align="center">
  <sub>Built by Dilip Meghwal • AskDoc Enterprise RAG Platform</sub>
</div>
