# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Lead Research Copilot** - an AI-powered tool for automating lead sourcing and qualification for agencies, businesses, and HR teams. The system uses LinkedIn and public company data to generate qualified lead lists with personalized outreach context.

## Architecture

**Monorepo Structure:**
- `api/` - Express.js backend server with TypeScript
- `ui/` - Next.js 15 frontend with React 19, TailwindCSS, and shadcn components
- `plans/` - Product requirements and design mockups

**Tech Stack:**
- Frontend: Next.js 15 (with Turbopack), React 19, TailwindCSS v4, shadcn/ui
- Backend: Node.js with Express, TypeScript, helmet, cors, morgan
- AI Integration: OpenAI GPT models via LangChain (planned)
- Authentication: Google OAuth (planned)

## Development Commands

### Frontend (ui/)
```bash
cd ui
npm run dev          # Start Next.js dev server with Turbopack
npm run build        # Build for production with Turbopack  
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (api/)
```bash
cd api
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript
npm run start        # Start production server
```

## Design System

**Color Palette:**
- Black: #000000
- White: #FFFFFF  
- Orange (accent): #FF8904 or oklch(75% .183 55.934)
- Zinc: #f4f4f5

**UI Framework:** Clean, modern dashboard using shadcn components with TailwindCSS

## Key Features (MVP Scope)

1. **ICP Definition** - Interactive form/chat to define Ideal Customer Profile
2. **Asynchronous Lead Sourcing** - LinkedIn + public data scraping with notifications
3. **Lead Results Table** - Comprehensive lead data with AI-generated qualification
4. **Agent Interaction** - Chat with copilot to enrich lead data (e.g., add personalization hooks)
5. **Export Functionality** - CSV download of qualified leads

## Development Notes

- The backend currently has basic Express setup with health endpoints
- Frontend is a fresh Next.js installation that needs to be customized
- PRD contains detailed mockups in `plans/figma/` for UI reference
- Focus on cost-effective lead sourcing (prefer free/public data sources)
- Email verification is critical for deliverability (bounce rate <5%)