# Spec 6: Share + Persist

## Priority: P0 (MVP)

## Goal
Save the meme to Vercel Postgres, generate a shareable link `/m/:id`. Anyone with the link can view the meme. No signup, no session tracking needed for basic sharing.

## User Story
As a user, I tap "Share" and instantly get a link I can send to friends. The link shows my meme to anyone.

## Acceptance Criteria
- [ ] "Share" triggers: export PNG → upload to Vercel Blob → save record to Postgres → generate link
- [ ] Shareable URL format: `{domain}/m/{memeId}`
- [ ] Link is copied to clipboard automatically (with toast confirmation)
- [ ] Public view page renders the meme PNG + reactions
- [ ] No authentication required to view
- [ ] `navigator.share()` integration on mobile (native share sheet)
- [ ] Loading state during share flow

## API Contracts

### `POST /api/meme`

Saves a meme record after the PNG has been uploaded to Vercel Blob.

**Request**:
```json
{
  "imageUrl": "https://blob.vercel-storage.com/original.jpg",
  "exportedPngUrl": "https://blob.vercel-storage.com/meme-final.png",
  "textFields": [
    { "content": "When the code compiles", "position": "top-center" },
    { "content": "But you don't know why", "position": "bottom-center" }
  ]
}
```

Note: No `templateId` (there are no templates — LLM generates suggestions dynamically). No `sessionId` needed for basic sharing. The `exportedPngUrl` is in the request because the client exports the canvas, uploads the PNG to Blob first (via `/api/upload`), then saves the meme record with that URL.

**Response** (200):
```json
{
  "memeId": "abc123",
  "shareUrl": "https://your-app.vercel.app/m/abc123",
  "createdAt": "2025-05-23T10:00:00Z"
}
```

### `GET /api/meme/[id]`

**Response** (200):
```json
{
  "memeId": "abc123",
  "imageUrl": "https://...",
  "exportedPngUrl": "https://...",
  "textFields": [...],
  "reactions": { "laugh": 12, "fire": 5, "cry-laugh": 3, "100": 2, "skull": 1, "heart": 4 },
  "totalReactions": 27,
  "createdAt": "2025-05-23T10:00:00Z"
}
```

## Database Schema (Vercel Postgres)

```sql
CREATE TABLE memes (
  id TEXT PRIMARY KEY,
  image_url TEXT NOT NULL,
  exported_png_url TEXT NOT NULL,
  text_fields JSONB NOT NULL,
  reactions JSONB NOT NULL DEFAULT '{"laugh":0,"fire":0,"cry-laugh":0,"100":0,"skull":0,"heart":0}',
  total_reactions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reaction_log (
  id SERIAL PRIMARY KEY,
  meme_id TEXT NOT NULL REFERENCES memes(id),
  reaction TEXT NOT NULL,
  visitor_fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meme_id, reaction, visitor_fingerprint)
);
```

Note on deduplication: Instead of sessionId, use a simple visitor fingerprint (hash of user-agent + IP, generated server-side) to prevent one person spamming reactions. The `UNIQUE` constraint prevents duplicates.

## Share Flow

```
User taps "Share"
  → Export canvas to PNG blob (all text composited)
  → Upload PNG to Vercel Blob (POST /api/upload)
  → Save meme record to Postgres (POST /api/meme)
  → Receive memeId + shareUrl
  → Copy shareUrl to clipboard
  → Show share panel with: link, copy button, native share button
```

## Public View Page (`/m/:id`)

- Fetches meme data via `GET /api/meme/:id`
- Renders the exported PNG
- Shows reaction bar below
- Meta tags for link previews (title, image) — handled via Vercel Edge Middleware or API route for crawlers

## Key Files
- `api/meme.ts` — POST handler (save to Postgres)
- `api/meme/[id].ts` — GET handler (fetch from Postgres)
- `src/components/Share/SharePanel.tsx` — share UI (link, copy, native share)
- `src/pages/ViewPage.tsx` — public `/m/:id` page
- `src/components/View/MemeViewPage.tsx` — meme display + reactions
- `src/lib/db.ts` — Vercel Postgres client initialization

## Technical Notes
- Generate `memeId` with `nanoid(10)` server-side
- `navigator.share()`: wrap in feature detection, fall back to copy link
- Vercel Postgres: use `@vercel/postgres` package
- All storage (images + database) is on Vercel — no Firebase anywhere in the project

## Dependencies
- Spec 5 (export provides the PNG blob + upload mechanism)
- Vercel Postgres database must be created in the Vercel dashboard
