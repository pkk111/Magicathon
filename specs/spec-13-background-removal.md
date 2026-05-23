# Spec 13: Background Removal

## Priority: P2 (Nice to Have)

## Goal
Remove the background from the uploaded photo and place the subject onto a new scene/color/meme background.

## User Story
As a user, I can remove the background from my photo and place myself onto a funny background for better memes.

## Acceptance Criteria
- [ ] "Remove Background" button in editor toolbar
- [ ] Uses a background removal API or client-side model
- [ ] Shows the subject with transparent background
- [ ] Offers background options: solid colors, gradients, meme scenes
- [ ] Result integrates with existing template system
- [ ] Processing time shown with progress indicator

## Implementation Options
1. **Client-side**: Use `@imgly/background-removal` (runs in browser via WASM/WebGL, ~3-5s)
2. **Server-side**: Call remove.bg API or similar service

Recommend option 1 (no API key needed, works offline, impressive for judges).

## Key Files
- `src/components/Editor/BackgroundRemoval.tsx` — UI + processing
- `src/components/Editor/BackgroundPicker.tsx` — replacement background selector
- `src/hooks/useBackgroundRemoval.ts` — processing logic

## Dependencies
- Spec 4 (canvas editor)
