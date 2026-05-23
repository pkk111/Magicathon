# Spec 2: AI Meme Suggestions

## Priority: P0 (MVP)

## Goal
Send the uploaded image to a vision LLM via OpenRouter and receive 6 meme suggestions. Each suggestion defines text content and position. The LLM generates everything dynamically — no predefined templates.

## User Story
As a user, after uploading a photo, I see 6 funny meme ideas generated from what the AI actually sees in my photo, each with text positioned differently.

## Acceptance Criteria
- [ ] `POST /api/suggest` accepts an image URL, calls OpenRouter with a vision model
- [ ] LLM returns exactly 6 suggestions as structured JSON
- [ ] Each suggestion specifies: text content + position (from defined set of positions)
- [ ] Suggestions are specific to image content (not generic)
- [ ] All 6 suggestions rendered in a grid: 2x3 on desktop, vertical stack on mobile
- [ ] Each preview is 16:9 ratio (matching the 1920x1080 source image)
- [ ] Loading skeleton shown while waiting (~5-12s)
- [ ] Graceful error handling (retry button)

## Text Positions

The LLM picks a position for each text field from this set (covering all areas of a rectangle):

| Position ID | Description | Anchor Point |
|-------------|-------------|--------------|
| `top-left` | Top-left corner | x: 5%, y: 5% |
| `top-center` | Top center | x: 50%, y: 5% |
| `top-right` | Top-right corner | x: 95%, y: 5% |
| `center-left` | Middle left | x: 5%, y: 50% |
| `center` | Dead center | x: 50%, y: 50% |
| `center-right` | Middle right | x: 95%, y: 50% |
| `bottom-left` | Bottom-left corner | x: 5%, y: 90% |
| `bottom-center` | Bottom center | x: 50%, y: 90% |
| `bottom-right` | Bottom-right corner | x: 95%, y: 90% |

## API Contract

### `POST /api/suggest`

**Request**:
```json
{
  "imageUrl": "https://blob.vercel-storage.com/...",
  "imageId": "abc123"
}
```

**Response** (200):
```json
{
  "suggestions": [
    {
      "id": "1",
      "texts": [
        {
          "content": "When the code finally compiles",
          "position": "top-center",
          "style": "bold"
        },
        {
          "content": "But you don't know why",
          "position": "bottom-center",
          "style": "bold"
        }
      ],
      "humor_style": "observational",
      "confidence": 0.92
    },
    {
      "id": "2",
      "texts": [
        {
          "content": "Me explaining to my cat why I need the entire couch",
          "position": "center",
          "style": "bold"
        }
      ],
      "humor_style": "relatable",
      "confidence": 0.88
    }
  ],
  "imageDescription": "A cat sitting on a keyboard looking directly at the camera with wide eyes..."
}
```

## Suggestion Schema (what LLM returns)

```typescript
interface MemeSuggestion {
  id: string;
  texts: Array<{
    content: string;
    position: 'top-left' | 'top-center' | 'top-right' |
              'center-left' | 'center' | 'center-right' |
              'bottom-left' | 'bottom-center' | 'bottom-right';
    style: 'bold' | 'italic' | 'normal';
  }>;
  humor_style: string;
  confidence: number;
}
```

## Prompt Engineering

### System Prompt
```
You are a meme lord with encyclopedic knowledge of internet humor and comedic timing.
Your job is to look at a photo and generate 6 genuinely funny meme suggestions
that use what's ACTUALLY in the image.

Rules:
- Be specific to what you see. Generic captions = failure.
- Write captions that are punchy (under 12 words per text field).
- Each suggestion should use a different comedic approach.
- Vary text positions across suggestions (don't put all text in the same spot).
- The funnier the meme, the higher the confidence score.
- Do NOT be generic. "When you..." captions must be hyper-specific to the image.

Available text positions (use these exact IDs):
top-left, top-center, top-right, center-left, center, center-right, bottom-left, bottom-center, bottom-right

Each suggestion can have 1-3 text fields, each at a different position.
Vary it: some suggestions with 1 centered text, some with classic top/bottom, some with corner text.

Respond ONLY with valid JSON matching the schema below. No markdown, no explanation.
```

### User Prompt
```
Look at this image carefully.

First, describe what you see in 2-3 sentences (objects, people, setting, mood,
anything notable or funny about the composition).

Then generate exactly 6 meme suggestions. Each must use a different comedic style.

JSON schema:
{
  "imageDescription": "string",
  "suggestions": [
    {
      "id": "1",
      "texts": [
        { "content": "string", "position": "top-center|bottom-center|center|...", "style": "bold|italic|normal" }
      ],
      "humor_style": "string",
      "confidence": 0.0-1.0
    }
  ]
}
```

### AI Provider
- **Library**: OpenRouter API (`openrouter` npm package or direct HTTP)
- **API Key**: Provided via `OPENROUTER_API_KEY` env variable
- **Model**: User-provided or default to a fast vision model available on OpenRouter
- Send image as base64 in the message content (fetch from Blob URL server-side)

### Fallback Strategy
1. Retry once with exponential backoff on failure
2. If still failing: show error with "Try Again" button
3. Never show blank state

## Preview Grid Layout

```
Desktop (≥ 768px):                Mobile (< 768px):
┌──────┬──────┬──────┐           ┌──────────────┐
│ 16:9 │ 16:9 │ 16:9 │           │    16:9      │
├──────┼──────┼──────┤           ├──────────────┤
│ 16:9 │ 16:9 │ 16:9 │           │    16:9      │
└──────┴──────┴──────┘           ├──────────────┤
                                  │    16:9      │
  (2x3 grid)                      ├──────────────┤
                                  │    16:9      │
                                  ├──────────────┤
                                  │    16:9      │
                                  ├──────────────┤
                                  │    16:9      │
                                  └──────────────┘
                                   (vertical scroll)
```

No max-px constraint — previews fill available width responsively.

## Key Files
- `api/suggest.ts` — serverless function with OpenRouter API call
- `src/hooks/useSuggestions.ts` — client-side fetch + state
- `src/components/Suggestions/SuggestionGrid.tsx` — responsive 2x3 / vertical grid
- `src/components/Suggestions/MemePreviewCard.tsx` — single 16:9 preview
- `shared/types.ts` — suggestion type definitions

## Dependencies
- Spec 0 (scaffold)
- Spec 1 (image upload provides the imageUrl)
