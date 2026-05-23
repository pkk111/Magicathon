# Spec 4: Canvas Editor

## Priority: P0 (MVP)

## Goal
Use `react-filerobot-image-editor` to provide a full-featured meme editor. The user's photo is pre-loaded with AI-suggested text annotations already placed. User can edit text, drag, resize, change fonts, add more annotations, and fine-tune.

## User Story
As a user, I select a suggestion and enter a full image editor pre-loaded with my photo and the suggested text. I can edit, move, resize, or add more text, then save/export.

## Acceptance Criteria
- [ ] Filerobot editor opens with user's photo as source
- [ ] AI-suggested text(s) are pre-populated as text annotations via `loadableDesignState`
- [ ] Text is editable, draggable, resizable (provided by Filerobot)
- [ ] Font selector with meme-appropriate fonts (Impact, Anton, Comic Neue, Montserrat)
- [ ] Undo/redo works (built-in to Filerobot)
- [ ] User can add additional text, shapes, or drawings (Annotate tab)
- [ ] Works on mobile (Filerobot is touch-friendly)
- [ ] Export produces a PNG blob for sharing

## Library

**Package**: `react-filerobot-image-editor`
**GitHub**: https://github.com/scaleflex/filerobot-image-editor

Features we get for free:
- Text annotations with fonts, colors, positioning
- Drag/resize/rotate any annotation
- Undo/redo/reset
- Filters, adjustments, crop (bonus)
- Mobile/touch support
- PNG/JPEG/WebP export
- Design state save/load

## Configuration

```tsx
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'

<FilerobotImageEditor
  source={imageUrl}
  tabsIds={[TABS.ANNOTATE, TABS.ADJUST, TABS.FILTERS]}
  defaultTabId={TABS.ANNOTATE}
  defaultToolId={TOOLS.TEXT}
  defaultSavedImageType="png"
  defaultSavedImageQuality={0.92}
  savingPixelRatio={2}
  theme={{
    palette: {
      'bg-secondary': '#0c0c0a',
      'bg-primary': '#161613',
      'accent-primary': '#c6f24e',
      'icons-primary': '#f4f1e8',
      'borders-primary': '#333',
    },
    typography: { fontFamily: 'Montserrat, sans-serif' },
  }}
  Text={{
    text: 'Your text',
    fonts: [
      { label: 'Impact', value: 'Impact' },
      { label: 'Anton', value: 'Anton' },
      { label: 'Comic Neue', value: 'Comic Neue' },
      { label: 'Montserrat', value: 'Montserrat' },
    ],
    fontSize: 56,
    align: 'center',
    fontStyle: 'bold',
  }}
  annotationsCommon={{
    fill: '#FFFFFF',
    stroke: '#000000',
    strokeWidth: 3,
    shadowOffsetX: 2,
    shadowOffsetY: 2,
    shadowBlur: 4,
    shadowColor: '#000000',
  }}
  onSave={(editedImageObject, designState) => {
    // editedImageObject contains imageBase64 and canvas element
    // Trigger export/share flow
  }}
  onClose={() => { /* go back to pick step */ }}
  loadableDesignState={designStateFromSuggestion}
/>
```

## Pre-loading AI Text

Convert the selected suggestion's texts into Filerobot design state format:

```typescript
function suggestionToDesignState(suggestion: MemeSuggestion) {
  return {
    annotations: {
      ...Object.fromEntries(
        suggestion.texts.map((t, i) => [
          `text-${i}`,
          {
            id: `text-${i}`,
            name: 'Text',
            type: 'text',
            text: t.content,
            x: positionToPercent(t.position).x,
            y: positionToPercent(t.position).y,
            fontSize: computeFontSize(t.content),
            fontFamily: 'Impact',
            fill: '#FFFFFF',
            stroke: '#000000',
            strokeWidth: 3,
          },
        ])
      ),
    },
  }
}
```

Note: The exact design state structure may need adjustment based on Filerobot's internal format. Test with `loadableDesignState` prop.

## Key Files
- `src/components/Editor/MemeEditor.tsx` — Filerobot wrapper with config + suggestion pre-loading
- `src/lib/designState.ts` — Convert suggestion to Filerobot loadable design state

## Dependencies
- `react-filerobot-image-editor` npm package
- Spec 3 (provides selected suggestion + image URL)

## What We No Longer Need
- No custom Konva editor code (TextLayer, EditorToolbar, TextInput)
- No EditorContext with custom useReducer (Filerobot manages its own state)
- No manual undo/redo implementation
- No manual font preloading (Filerobot handles it)
- No touch-action handling (Filerobot handles touch)
