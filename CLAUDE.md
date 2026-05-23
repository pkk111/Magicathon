# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Magicathon — an AI-powered meme creation tool for the Magicathon hackathon ("Make it a meme"). Full loop: upload photo → AI suggests 6 memes → pick → edit on canvas → export PNG → share link → live reactions.

## Tech Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Vercel Serverless Functions (in `api/` directory)
- **AI**: OpenRouter API — vision LLM for meme suggestions
- **Database**: Vercel Postgres — meme persistence + reactions
- **Storage**: Vercel Blob — uploaded photos + exported PNGs
- **Editor**: Filerobot Image Editor (react-filerobot-image-editor) — meme editor with text, export, filters
- **Previews**: Konva.js (react-konva) — rendering suggestion preview cards
- **State**: React hooks (useContext + useReducer for shared state, useState for local)
- **Deploy**: Vercel (everything on Vercel — no Firebase, no external services)

## Commands

```bash
npm run dev          # Start Vite dev server (frontend)
npm run build        # Production build
npm run preview      # Preview production build
vercel dev           # Run serverless functions locally
```

## Architecture

```
src/                 # React frontend
  components/        # Upload, Suggestions, Editor, Share, View
  hooks/             # useUpload, useSuggestions, useExport, useReactions
  lib/               # api.ts, image.ts, positions.ts
  pages/             # CreatePage, ViewPage (/m/:id)

api/                 # Vercel Serverless Functions
  upload.ts          # Image → Vercel Blob
  suggest.ts         # Image → OpenRouter vision LLM → 6 suggestions
  meme.ts            # Save meme to Vercel Postgres
  meme/[id].ts       # Fetch meme for public view
  react.ts           # Add reaction (atomic increment)

shared/              # Shared TypeScript types between frontend + API
specs/               # Spec-driven development specs (the source of truth)
```

## Spec-Driven Development

This project uses spec-driven development. Each spec in `specs/` defines a self-contained feature with acceptance criteria, API contracts, and key files. See `specs/PRIORITY.md` for the full priority map.

- **P0 (MVP)**: Specs 0–8 — the core loop (upload → suggest → pick → edit → export → share → react)
- **P1 (High Impact Bonus)**: Specs 9–11 — meme roulette, global wall, feeling lucky
- **P2 (Nice to Have)**: Specs 12–15 — stickers, background removal, GIF export, remix

Build P0 first, deploy, verify end-to-end, then layer P1/P2.

## Key Design Decisions

- LLM generates 6 complete suggestions (text + position + style) per image — no predefined templates
- Image format: 1920x1080 (16:9 standard) for all meme outputs
- Reactions use polling (every 10s) since Vercel Postgres has no real-time subscriptions
- Session identity via visitor fingerprint (server-side, hash of IP + user-agent) for reaction dedup
- Mobile-first: step-based flow, bottom toolbar, fluid grid (auto-fit) for previews
- State managed via React hooks (useState in pages), Filerobot manages editor state internally
- Everything on Vercel: Postgres, Blob storage, serverless functions, hosting
