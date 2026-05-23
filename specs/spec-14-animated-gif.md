# Spec 14: Animated GIF Memes

## Priority: P2 (Nice to Have)

## Goal
Export memes as animated GIFs with simple text animations (fade in, typewriter, bounce).

## User Story
As a user, I can export my meme as an animated GIF where the text animates in dramatically.

## Acceptance Criteria
- [ ] "Export as GIF" option alongside PNG export
- [ ] Text animation options: fade-in, typewriter, drop-in, shake
- [ ] GIF is 2-3 seconds long
- [ ] Reasonable file size (< 5MB)
- [ ] Preview animation before export
- [ ] Shareable like static memes

## Implementation
- Use `gif.js` or `gifshot` library for client-side GIF encoding
- Capture Konva stage frames at 10-15fps
- Animate text properties (opacity, position) across frames
- Show progress bar during encoding (can take 3-10s)

## Key Files
- `src/components/Editor/GifExport.tsx` — GIF export UI + options
- `src/hooks/useGifExport.ts` — frame capture + encoding logic
- `src/lib/gifEncoder.ts` — GIF encoding wrapper

## Dependencies
- Spec 5 (PNG export working first)
