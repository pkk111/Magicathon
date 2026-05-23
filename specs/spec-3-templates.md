# Spec 3: Suggestion Previews + Rendering

## Priority: P0 (MVP)

## Goal
Render 6 LLM-generated meme suggestions as live previews using the user's actual photo. Each preview shows the image at 16:9 with text overlaid at the positions specified by the LLM.

## User Story
As a user, I see 6 meme previews rendered with my actual photo and the AI-generated text placed correctly. I can tap one to select it for editing.

## Acceptance Criteria
- [ ] All 6 suggestions rendered as 16:9 previews with the user's photo
- [ ] Text is overlaid at the positions specified in the suggestion (top-center, bottom-left, center, etc.)
- [ ] Text has proper styling: white fill, black stroke/outline for readability
- [ ] Previews use a fluid responsive grid — adapts from 2x3 to vertical based on available viewport space (no hardcoded breakpoint)
- [ ] Tapping a preview selects it and transitions to the editor
- [ ] Previews render quickly after suggestions arrive (< 200ms)
- [ ] Selected preview has a visible highlight/border

## Responsive Grid (Fluid)

Use CSS Grid with `auto-fit` and `minmax()` so the grid fluidly transitions from 3 columns to 2 to 1 based on available space — no media query breakpoints.

```css
.suggestion-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}
```

This means:
- Wide viewport: 3 columns (2x3 grid)
- Medium viewport: 2 columns
- Narrow viewport: 1 column (vertical stack)
- Transitions smoothly as browser resizes

Each card maintains 16:9 aspect ratio via `aspect-ratio: 16/9`.

## Rendering Logic

Each preview takes a suggestion and renders it on the image:

```typescript
interface RenderConfig {
  imageUrl: string;
  imageSize: { width: 1920; height: 1080 };
  texts: Array<{
    content: string;
    position: TextPosition;  // mapped to x,y coordinates
    style: 'bold' | 'italic' | 'normal';
  }>;
}
```

### Position → Coordinates Mapping

Given a canvas of 1920x1080:

| Position | x | y | align | verticalAlign |
|----------|---|---|-------|---------------|
| `top-left` | 96 (5%) | 54 (5%) | left | top |
| `top-center` | 960 (50%) | 54 (5%) | center | top |
| `top-right` | 1824 (95%) | 54 (5%) | right | top |
| `center-left` | 96 (5%) | 540 (50%) | left | middle |
| `center` | 960 (50%) | 540 (50%) | center | middle |
| `center-right` | 1824 (95%) | 540 (50%) | right | middle |
| `bottom-left` | 96 (5%) | 972 (90%) | left | bottom |
| `bottom-center` | 960 (50%) | 972 (90%) | center | bottom |
| `bottom-right` | 1824 (95%) | 972 (90%) | right | bottom |

### Text Styling (Preview — not editable in MVP)
- Font: Impact (default meme font)
- Fill: white (`#FFFFFF`)
- Stroke: black (`#000000`), 3px width
- Shadow: black, blur 4px, offset 2px
- Font size: auto-scaled based on text length (larger for short text, smaller for long)
- Max width: 60% of canvas width (text wraps)
- Line height: 1.2

## Key Files
- `src/components/Suggestions/SuggestionGrid.tsx` — fluid responsive grid layout
- `src/components/Suggestions/MemePreviewCard.tsx` — single Konva preview (mini stage)
- `src/lib/positions.ts` — position ID → coordinate mapping
- `src/lib/textRenderer.ts` — text styling and auto-sizing logic

## Technical Notes
- Each preview is a Konva `<Stage>` rendered at display size (scaled down from 1920x1080)
- Use `scaleX/scaleY` on stage to fit container while maintaining 16:9 ratio
- Image loaded once, shared across all 6 previews (pass as `Image` object)
- No hardcoded pixel breakpoints — let CSS `auto-fit` handle responsiveness

## Dependencies
- Spec 2 (provides suggestion data with texts + positions)
- Spec 1 (provides the image URL)
