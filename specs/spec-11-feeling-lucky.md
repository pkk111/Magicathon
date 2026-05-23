# Spec 11: "I'm Feeling Lucky" One-Click Meme

## Priority: P1 (Post-MVP, High Impact)

## Goal
One-tap meme generation — upload a photo and instantly get the best meme without picking or editing. For users who want speed over control.

## User Story
As a user in a hurry, I tap "I'm Feeling Lucky", snap a photo, and in seconds I have a shareable meme without any decisions.

## Acceptance Criteria
- [ ] "🎰 I'm Feeling Lucky" button on upload screen
- [ ] Flow: upload → suggest → auto-pick highest confidence → auto-export → show share panel
- [ ] Skips the pick and edit steps entirely
- [ ] Takes the #1 suggestion (highest confidence score)
- [ ] Shows a brief "generating..." animation during the process
- [ ] Still allows "Edit this" to go back into the editor if they want to tweak

## Implementation
- Reuse all existing APIs (upload, suggest)
- Auto-select `suggestions[0]` (highest confidence)
- Auto-render template at export quality
- Jump directly to share panel
- Add "Edit" link to go back to editor with current state

## Key Files
- `src/components/Upload/LuckyButton.tsx` — the button
- `src/context/MemeContext.tsx` — add `luckyMode` flag to skip intermediate steps
- `src/App.tsx` — conditional step flow based on mode

## Dependencies
- Specs 1-6 (full pipeline must work to auto-run it)
