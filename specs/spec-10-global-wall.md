# Spec 10: Global Meme Wall

## Priority: P1 (Post-MVP, High Impact)

## Goal
A live public wall showing all memes created during the hackathon, ranked by total reactions. Creates social proof and competition.

## User Story
As a viewer, I can browse a live feed of all memes made today, see which ones are getting the most reactions, and react to any of them.

## Acceptance Criteria
- [ ] `/wall` route shows all shared memes in a masonry/grid layout
- [ ] Sorted by `totalReactions` (most popular first)
- [ ] Live updates as new memes are shared (Firestore query with `onSnapshot`)
- [ ] Each card shows: meme PNG thumbnail, reaction counts, time ago
- [ ] Tapping a card opens the full meme view (`/m/:id`)
- [ ] Infinite scroll or pagination (if many memes)

## Implementation
- Postgres query: `SELECT * FROM memes ORDER BY total_reactions DESC LIMIT 50`
- Polling every 30s for updates (no real-time subscriptions)
- Masonry grid via CSS columns or a lightweight library
- Animate new entries sliding in

## Key Files
- `src/pages/WallPage.tsx` — the wall page
- `src/components/Wall/MemeGrid.tsx` — masonry grid
- `src/components/Wall/MemeCard.tsx` — single meme card

## Dependencies
- Spec 6 (memes must be persisted in Vercel Postgres)
- Spec 7 (reactions must work)
