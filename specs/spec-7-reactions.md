# Spec 7: Reactions

## Priority: P0 (MVP)

## Goal
Anyone with the meme link can react. Reactions are stored in Vercel Postgres and displayed on the meme view page.

## User Story
As a viewer, I tap a reaction emoji on someone's meme. The count updates and other viewers see it.

## Acceptance Criteria
- [ ] Public view page shows 6 reaction buttons (no signup)
- [ ] Tapping a reaction increments the count
- [ ] Rate-limited: 1 reaction per emoji per visitor (server-side fingerprint dedup)
- [ ] Updated reaction counts shown after reacting (response from POST includes new totals)
- [ ] Total reaction count displayed on meme card
- [ ] Already-reacted state shown visually (button disabled/highlighted)

## Reaction Types
| Emoji | Key | Display |
|-------|-----|---------|
| 😂 | laugh | Laugh |
| 🔥 | fire | Fire |
| 😭 | cry-laugh | Crying |
| 💯 | 100 | 100 |
| 💀 | skull | Dead |
| ❤️ | heart | Heart |

## API Contract

### `POST /api/react`

**Request**:
```json
{
  "memeId": "abc123",
  "reaction": "laugh"
}
```

**Response** (200):
```json
{
  "success": true,
  "reactions": { "laugh": 13, "fire": 5, "cry-laugh": 3, "100": 2, "skull": 1, "heart": 4 }
}
```

**Response** (409 — already reacted):
```json
{
  "error": "Already reacted with this emoji",
  "code": "DUPLICATE_REACTION"
}
```

## Server-side Logic

```typescript
// api/react.ts
// 1. Generate visitor fingerprint from request headers (user-agent + IP hash)
// 2. Try INSERT into reaction_log (meme_id, reaction, visitor_fingerprint)
//    - UNIQUE constraint prevents duplicates → returns 409 if already exists
// 3. If insert succeeds: UPDATE memes SET reactions[type] += 1, total_reactions += 1
// 4. Return updated reaction counts
```

## No Real-time Listener (P0)

For MVP, reaction counts are fetched once on page load (via `GET /api/meme/:id`) and updated optimistically when the user reacts. No polling, no real-time subscriptions. Real-time updates can be added as a P1/P2 enhancement later.

## Deduplication

Uses the `reaction_log` table in Vercel Postgres (defined in spec-6):

```sql
CREATE TABLE reaction_log (
  id SERIAL PRIMARY KEY,
  meme_id TEXT NOT NULL REFERENCES memes(id),
  reaction TEXT NOT NULL,
  visitor_fingerprint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meme_id, reaction, visitor_fingerprint)
);
```

- **Server-side**: visitor fingerprint (hash of IP + user-agent) + UNIQUE constraint prevents duplicates at the DB level
- **Client-side**: disable button after clicking (optimistic UX)
- No separate storage needed — same Postgres database, just a second table

## Key Files
- `api/react.ts` — reaction serverless function
- `src/components/View/ReactionBar.tsx` — reaction buttons on view page

## Dependencies
- Spec 6 (meme must be persisted in Postgres to receive reactions)
