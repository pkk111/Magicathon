# Spec 15: Remix Link

## Priority: P2 (Nice to Have)

## Goal
Allow anyone viewing a shared meme to "remix" it — use the same photo but generate their own meme with it.

## User Story
As a viewer, I see a funny meme and tap "Remix" to create my own meme using the same photo.

## Acceptance Criteria
- [ ] "Remix 🔄" button on public meme view page
- [ ] Tapping it takes the user to the creation flow with the original photo pre-loaded
- [ ] Generates fresh suggestions for that photo
- [ ] Remixed meme is its own entity (separate share link, separate reactions)
- [ ] Original meme shows "X remixes" count (optional)

## Implementation
- "Remix" link navigates to `/?remix={memeId}`
- On load: fetch original meme → extract `imageUrl` → skip upload → go to suggest step
- Rest of flow is identical (suggest → pick → edit → share)
- Optionally store `remix_of` field in memes table

## Key Files
- `src/components/View/RemixButton.tsx` — button on view page
- `src/App.tsx` — handle `?remix=` query param on load
- `src/context/MemeContext.tsx` — pre-populate image from remix source

## Dependencies
- Spec 6 (share/persist must work)
- Spec 2 (suggestions must work)
