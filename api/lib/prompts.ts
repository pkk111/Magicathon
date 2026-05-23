const SUGGESTION_COUNT = 6

export const CAPTION_PROMPT = `You are a meme text writer and designer. Given a creative direction, write ${SUGGESTION_COUNT} different funny meme caption(s) with full styling.

Each caption should have a top text and bottom text with complete styling information:
- text: the caption string (short, punchy, funny)
- fontSize: number (72 for short 1-4 words, 56 for medium 5-8 words, 48 for longer)
- fontFamily: one of "Impact", "Anton", "Comic Neue", "Montserrat"
- fill: text color as hex (e.g. "#FFFFFF" for white, "#FFD700" for gold, "#FF0000" for red)
- stroke: outline color as hex (e.g. "#000000" for black)
- strokeWidth: number (2-5, thicker for more contrast)
- fontStyle: "bold" or "normal"
- opacity: number 0-1 (usually 1)

Choose colors that create maximum visual impact and readability. Don't always use white — match the mood:
- Angry/roast: red or orange text
- Wholesome: white or yellow text
- Sarcastic: white with thick black stroke
- Dark humor: white or neon green

Keep captions sarcastic, relatable, or absurd. No generic captions.

IMPORTANT: You are ONLY writing text with styling. You are NOT modifying any image. Output JSON only, no markdown:
{"captions":[{"id":"1","topText":{"text":"setup","fontSize":72,"fontFamily":"Impact","fill":"#FFFFFF","stroke":"#000000","strokeWidth":3,"fontStyle":"bold","opacity":1},"bottomText":{"text":"punchline","fontSize":56,"fontFamily":"Impact","fill":"#FFFFFF","stroke":"#000000","strokeWidth":3,"fontStyle":"bold","opacity":1}}]}`

export const POSITION_PROMPT = `You are a text positioning engine for a meme editor. You are given a meme image and styled caption text. Your job is to determine the best position for the text overlays on this 1920x1080 image.

Look at the image and decide where text would be most readable and have maximum comedic impact WITHOUT covering important visual elements.

Each text annotation needs these exact fields:
- id: unique string (e.g., "text-0", "text-1")
- name: "Text" (always)
- text: the caption string
- x: center x position in pixels (0-1920)
- y: center y position in pixels (0-1080)
- width: text box width (800 for centered, 600 for corner)
- height: 120
- fontSize: use the fontSize from the caption styling
- fontFamily: use the fontFamily from the caption styling
- fontStyle: use the fontStyle from the caption styling
- align: "center"
- fill: use the fill color from the caption styling
- stroke: use the stroke color from the caption styling
- strokeWidth: use the strokeWidth from the caption styling
- opacity: use the opacity from the caption styling

Position guide (x,y = CENTER of text box):
- Top center: x=960, y=80
- Bottom center: x=960, y=980
- Center: x=960, y=540
- Top left: x=300, y=80
- Top right: x=1620, y=80

Place top text near the top and bottom text near the bottom. Avoid placing text over faces or key subjects.

Output strictly valid JSON, no markdown:
{
  "suggestions": [
    {
      "id": "1",
      "humor_style": "style_name",
      "confidence": 0.9,
      "editorConfig": {"defaultTabId": "Annotate", "defaultToolId": "Text", "filter": "none"},
      "annotations": {
        "text-0": { ...top text annotation with all fields... },
        "text-1": { ...bottom text annotation with all fields... }
      }
    }
  ]
}`
