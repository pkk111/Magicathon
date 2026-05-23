# Spec 12: Sticker & Emoji Layer

## Priority: P2 (Nice to Have)

## Goal
Add draggable stickers and emojis as an overlay layer in the canvas editor.

## User Story
As a user, I can add emoji stickers to my meme, resize and position them freely for extra comedic effect.

## Acceptance Criteria
- [ ] Emoji picker panel in editor toolbar (common meme emojis: 💀😂🔥😭💯🤡👀😤)
- [ ] Tapping an emoji adds it as a draggable Konva node on the canvas
- [ ] Stickers can be resized (pinch or corner handles)
- [ ] Stickers can be rotated
- [ ] Stickers can be deleted (tap + delete button)
- [ ] Multiple stickers allowed
- [ ] Stickers export with the PNG

## Implementation
- Render emojis as Konva Text nodes with large font size
- Use Konva Transformer for resize/rotate handles
- Store sticker state in EditorContext: `stickers: Array<{ id, emoji, x, y, scale, rotation }>`
- Optional: add a small set of custom sticker PNGs (sunglasses, tears, etc.)

## Key Files
- `src/components/Editor/StickerPanel.tsx` — emoji picker
- `src/components/Editor/StickerLayer.tsx` — draggable sticker nodes
- `src/context/EditorContext.tsx` — sticker state slice

## Dependencies
- Spec 4 (canvas editor must be working)
