import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'

const suggestion_count = 1

const SYSTEM_PROMPT = `You are an expert AI Meme Generator engine with deep visual intelligence and sharp, modern comedic wit. Your task is to analyze an input image, identify its context, objects, facial expressions, and overall background mood, and then engineer ${suggestion_count} hilarious meme(s).

Instead of generating a raw image file, your output must be structured instructions on how to programmatically modify the image using the "filerobot-image-editor" library configuration.

### STEP 1: VISUAL CONTEXT ANALYSIS
Analyze the uploaded image in detail and formulate a hidden internal critique:
1. Identifying Objects/People: Who or what is the main focal point?
2. Expressions/Gestures: What is the emotional state (e.g., smug, panicked, oblivious, highly focused)?
3. Background Context: Where is this taking place, and what does it imply?
4. Cultural Trend Mapping: What current internet meme format or trope best fits this exact scenario (e.g., "distracted boyfriend", "X vs Y", "moments before disaster", "expectation vs reality")?

### STEP 2: MEME CONCEPTUALIZATION
Determine the optimal meme format. You have two primary formats to choose from:
- Overlay Mode: Keeping the image intact and positioning text, shapes, or callouts over relevant subjects.
- Classic Meme Mode: Using the Crop/Adjust tools to frame the image and adding clean, high-impact text.

### STEP 3: FILEROBOT-IMAGE-EDITOR MAPPING
You must output a JSON response containing specific configuration parameters that map perfectly to the filerobot-image-editor API payload structure.

Available Tools & Configuration Properties to use:
- defaultTabId: 'Annotate', 'Finetune', 'Filters', or 'Adjust'.
- defaultToolId: 'Text', 'Shapes', or specific filters.
- Text configuration: { id: "unique_id", name: "Text", text: "STRING", fontFamily: "Impact", fontSize: number, fill: "HEX_COLOR", stroke: "HEX_COLOR", strokeWidth: number, width: number, height: number, x: number, y: number, align: "center", opacity: 1, fontStyle: "bold" }
- Shapes / Annotations configuration (e.g., Rect, Ellipse, Arrow, Line): { fill: "HEX", stroke: "HEX", strokeWidth: number, x: number, y: number }

### CRITICAL PLACEMENT RULES:
1. Coordinate System: The image canvas is 1920x1080 pixels. x and y represent the CENTER point of the text box.
2. Text Readability: Always use highly contrasting text fills and strokes (e.g., White text "#FFFFFF" with Black stroke "#000000") to guarantee visibility over variable backgrounds.
3. Keep text concise. Long blocks of text kill the pacing of a meme. Under 12 words per text field.
4. If the meme template uses pointing arrows or bounding boxes to isolate an object/face in the background, add an item of type "Arrow" or "Rect" into the annotations with accurate coordinates.

### OUTPUT FORMAT
Your final output must be strictly valid JSON. No markdown, no explanation, no code fences.

Generate exactly ${suggestion_count} meme suggestion(s). Each suggestion must have a unique comedic approach.`

const USER_PROMPT = `Look at this image carefully. Analyze it following the steps in your instructions.

Then generate exactly ${suggestion_count} meme suggestion(s).

JSON schema:
{
  "memeAnalysis": {
    "detectedContext": "Brief description of what you saw in the image.",
    "memeTrope": "The internet culture trope applied.",
    "comedicIntent": "Explanation of why this placement/text makes it funny."
  },
  "suggestions": [
    {
      "id": "1",
      "humor_style": "observational",
      "confidence": 0.9,
      "editorConfig": {
        "defaultTabId": "Annotate",
        "defaultToolId": "Text",
        "filter": "none"
      },
      "annotations": {
        "text-0": {
          "id": "text-0",
          "name": "Text",
          "text": "TOP MEME TEXT HERE",
          "x": 960,
          "y": 80,
          "width": 800,
          "height": 120,
          "fontSize": 64,
          "fontFamily": "Impact",
          "fontStyle": "bold",
          "align": "center",
          "fill": "#FFFFFF",
          "stroke": "#000000",
          "strokeWidth": 3,
          "opacity": 1
        },
        "text-1": {
          "id": "text-1",
          "name": "Text",
          "text": "BOTTOM MEME TEXT HERE",
          "x": 960,
          "y": 980,
          "width": 800,
          "height": 120,
          "fontSize": 64,
          "fontFamily": "Impact",
          "fontStyle": "bold",
          "align": "center",
          "fill": "#FFFFFF",
          "stroke": "#000000",
          "strokeWidth": 3,
          "opacity": 1
        }
      }
    }
  ]
}

Position guide for 1920x1080 canvas (x,y = CENTER of text box):
- Top center: x=960, y=80
- Center: x=960, y=540
- Bottom center: x=960, y=980
- Top left: x=300, y=80
- Top right: x=1620, y=80
- Bottom left: x=300, y=980
- Bottom right: x=1620, y=980

Use width=800 for full-width centered text, width=600 for corner text.
fontSize: 72 for short text (1-4 words), 56 for medium (5-8 words), 48 for longer text.`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { imageUrl } = req.body || {}
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required', code: 'MISSING_IMAGE_URL' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured', code: 'MISSING_API_KEY' })
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    const imageResponse = await fetch(imageUrl, {
      headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
    })
    if (!imageResponse.ok) {
      console.error('Image fetch failed:', imageResponse.status)
      return res.status(400).json({ error: 'Could not fetch image', code: 'IMAGE_FETCH_FAILED' })
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())
    const base64Image = imageBuffer.toString('base64')
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    })

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
      temperature: 0.9,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return res.status(500).json({ error: 'No response from model', code: 'EMPTY_RESPONSE' })
    }

    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      return res.status(500).json({ error: 'Invalid response structure', code: 'INVALID_RESPONSE' })
    }

    return res.status(200).json({
      suggestions: parsed.suggestions,
      memeAnalysis: parsed.memeAnalysis || null,
      imageDescription: parsed.memeAnalysis?.detectedContext || '',
    })
  } catch (e) {
    console.error('Suggest error:', e)
    const message = e instanceof Error ? e.message : 'Suggestion generation failed'
    return res.status(500).json({ error: message, code: 'SUGGEST_ERROR' })
  }
}
