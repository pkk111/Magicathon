# Priority Overview

## P0 — MVP (Must Ship)
The core meme creation loop. Without all of these, the product is incomplete.

| Spec | Feature | Est. Time |
|------|---------|-----------|
| 0 | Project Scaffold | 30m |
| 1 | Image Upload (drag-drop, paste, device camera) | 45m |
| 2 | AI Meme Suggestions (OpenRouter vision → 6 ideas) | 45m |
| 3 | Suggestion Previews (render 6 memes on 16:9 canvas) | 60m |
| 4 | Canvas Editor (drag text, fonts, positions) | 90m |
| 5 | Export (PNG download + clipboard) | 30m |
| 6 | Share + Persist (Vercel Postgres + shareable link) | 60m |
| 7 | Reactions (Vercel Postgres + polling) | 45m |
| 8 | Mobile Polish + Final Integration | 45m |

**Total P0: ~8 hours**

---

## P1 — High Impact Bonus (Build After MVP Works)
Features that wow judges and differentiate from other submissions. Each is self-contained and quick to add on top of working MVP.

| Spec | Feature | Est. Time | Why P1 |
|------|---------|-----------|--------|
| 9 | Meme Roulette (humor personas) | 30m | Wildcard judging criterion, minimal code |
| 10 | Global Meme Wall (live leaderboard) | 45m | Social proof, shows full-stack chops |
| 11 | "I'm Feeling Lucky" (one-tap meme) | 30m | Delightful UX, reuses everything |

**Total P1: ~1.5 hours**

---

## P2 — Nice to Have (Only If Time Permits)
Impressive features that are cool but not essential for a winning submission.

| Spec | Feature | Est. Time | Why P2 |
|------|---------|-----------|--------|
| 12 | Sticker & Emoji Layer | 45m | Fun but not core to meme quality |
| 13 | Background Removal | 60m | Technically impressive, takes time |
| 14 | Animated GIF Export | 60m | Complex encoding, niche use case |
| 15 | Remix Link | 30m | Social feature, needs user base to matter |

**Total P2: ~3 hours**

---

## Implementation Order

```
P0 (specs 0-8) → Deploy & test end-to-end → P1 (9, 11, 10) → P2 (if time)
```

Within P1, recommended order:
1. Spec 11 (Feeling Lucky) — fastest to build, reuses everything
2. Spec 9 (Meme Roulette) — high judge impact, minimal new code
3. Spec 10 (Global Wall) — most new UI work but great for demo

Within P2, recommended order:
1. Spec 15 (Remix) — easiest, mostly routing
2. Spec 12 (Stickers) — fun, builds on existing canvas
3. Spec 13 (Background Removal) — impressive tech
4. Spec 14 (GIF) — most complex, do last
