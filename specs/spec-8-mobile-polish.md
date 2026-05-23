# Spec 8: Mobile Polish + Final Integration

## Priority: P0 (MVP)

## Goal
End-to-end flow works flawlessly on mobile. Touch targets, viewport handling, scroll behavior, and transitions are polished.

## Acceptance Criteria
- [ ] Full flow works on iPhone Safari and Android Chrome
- [ ] Touch targets are minimum 44x44px
- [ ] No horizontal overflow anywhere
- [ ] Keyboard does not push layout off-screen during text edit
- [ ] Step transitions use smooth animations
- [ ] Loading states are skeleton-based
- [ ] Error states have clear retry buttons

## Responsive Strategy

Uses fluid CSS Grid (`auto-fit` + `minmax()`) throughout — no hardcoded breakpoints. Layout adapts naturally to available space.

| Component | Narrow | Wide |
|-----------|--------|------|
| Upload zone | Full-width, tall tap target | Centered card |
| Suggestion grid | Vertical stack (1 col) | 2x3 grid (auto-fit) |
| Canvas editor | Full width, toolbar below | Centered + sidebar |
| Text editing | Bottom sheet input | Inline overlay |
| Share actions | Full-width stacked buttons | Inline row |
| Reaction bar | Full-width below meme | Inline below meme |

## Key Mobile Fixes

### Viewport
- Use `100dvh` (dynamic viewport height) for full-screen steps
- Set `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">`

### Canvas Touch
- `touch-action: none` on canvas container only (prevents scroll while dragging text)
- Konva handles touch events natively
- Prevent pull-to-refresh during canvas interaction

### Keyboard
- When text input opens: scroll input into view
- Use `visualViewport` API to detect keyboard height
- On input blur: restore scroll position

### Performance
- Preview canvases: render at display size (not full 1920x1080)
- Lazy-load Konva (dynamic import)
- Image optimization: WebP where supported

## Step Flow Transitions

```
Upload → Suggesting → Pick → Edit → Share
  (each step is a full-screen view)
  (transition: slide left / fade)
  (back button: slide right)
```

Use Framer Motion `AnimatePresence` with `mode="wait"`.

## Final Integration Checklist
- [ ] End-to-end: upload → suggest → pick → edit → export → share → react
- [ ] Error recovery at every step
- [ ] Back navigation works (browser back + in-app back)
- [ ] Deploy to Vercel, test live URL
- [ ] Vercel Postgres + Blob working in production

## Key Files
- `src/index.css` — responsive utilities, viewport fixes
- `src/App.tsx` — step flow routing + AnimatePresence
- All components (touch target + responsive audit)

## Dependencies
- Specs 0–7 (all must be functional)
