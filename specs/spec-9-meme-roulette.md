# Spec 9: Meme Roulette (Wildcard)

## Priority: P1 (Post-MVP, High Impact)

## Goal
Add a "Spin" button that re-interprets the user's photo with a random humor persona — roast mode, boomer mode, absurdist mode, wholesome mode, etc. Surprise the judges.

## User Story
As a user, after getting my 6 suggestions, I can tap "Spin the Wheel" for a completely different comedic take on my photo.

## Acceptance Criteria
- [ ] "🎰 Remix" button visible after initial suggestions load
- [ ] Tapping it calls `/api/suggest` with a randomly selected humor persona
- [ ] Returns 6 new suggestions in a different comedic style
- [ ] Animated transition (spin/shuffle) while loading
- [ ] User can keep spinning for more styles
- [ ] Shows which persona was used ("Roast Mode 🔥", "Boomer Mode 👴", etc.)

## Humor Personas
| Persona | Style | System Prompt Override |
|---------|-------|----------------------|
| 🔥 Roast Mode | Savage, insulting (playfully) | "Roast everything in this image mercilessly" |
| 👴 Boomer Mode | Facebook humor, minion energy | "Write like a boomer who just discovered memes" |
| 🌀 Absurdist | Surreal, non-sequitur | "Maximum absurdity, nothing needs to make sense" |
| 🥺 Wholesome | Uplifting, wholesome-core | "Make it aggressively wholesome and supportive" |
| 📰 Corporate | LinkedIn/corporate speak | "Write as if this is a LinkedIn post about leadership" |
| 🧠 Galaxy Brain | Overthinking, pseudo-intellectual | "Overthink this image to an absurd philosophical degree" |

## Implementation
- Add `persona` field to `POST /api/suggest` request
- If persona provided: swap system prompt to persona-specific version
- Reuse entire existing suggestion → preview → edit pipeline
- Minimal new code: ~50 lines in API, ~30 lines for the button + persona display

## Key Files
- `api/suggest.ts` — add persona parameter + persona prompts
- `src/components/Suggestions/RouletteButton.tsx` — spin button UI
- `src/lib/personas.ts` — persona definitions

## Dependencies
- Spec 2 (suggestions API must be working)
- Spec 3 (previews must render)
