# Spec 5: Export (PNG + Clipboard + Shareable Link)

## Priority: P0 (MVP)

## Goal
When the user saves in the Filerobot editor, export the final meme as PNG. User can download it, copy to clipboard (all browsers/OS), or get a shareable link.

## User Story
As a user, I tap "Save" in the editor and can choose to download the PNG, copy it to clipboard, or get a shareable link.

## Acceptance Criteria
- [ ] Filerobot `onSave` callback receives the edited image data (base64 + canvas element)
- [ ] "Download" saves the PNG to device
- [ ] "Copy to Clipboard" works cross-browser (Chrome, Firefox, Safari, Edge — all OS)
- [ ] "Get Link" uploads PNG to Vercel Blob and copies shareable URL to clipboard
- [ ] Toast notification confirms each action
- [ ] Graceful fallback if clipboard API unavailable (offer download)

## Implementation

Filerobot's `onSave` provides:
```typescript
onSave: (editedImageObject, designState) => {
  // editedImageObject.imageBase64 — base64 data URL of the final image
  // editedImageObject.fullName — filename
  // editedImageObject.mimeType — 'image/png'
  // editedImageObject.imageCanvas — HTMLCanvasElement (if savingPixelRatio > 0)
}
```

### Export Actions (shown after save)

```typescript
// Convert base64 to Blob
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteString = atob(base64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}

// Download
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// Clipboard (cross-browser)
async function copyToClipboard(blob: Blob) {
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    showToast('Copied to clipboard!')
  } catch {
    downloadBlob(blob, 'meme.png')
    showToast('Downloaded — clipboard not supported in this browser')
  }
}

// Shareable link
async function getShareableLink(blob: Blob) {
  const formData = new FormData()
  formData.append('image', blob, 'meme.png')
  const { imageUrl } = await fetch('/api/upload', { method: 'POST', body: formData }).then(r => r.json())
  await navigator.clipboard.writeText(imageUrl)
  showToast('Link copied!')
  return imageUrl
}
```

## Key Files
- `src/components/Editor/MemeEditor.tsx` — handles onSave callback
- `src/components/Editor/ExportPanel.tsx` — export action buttons (Download, Copy, Get Link)
- `src/hooks/useExport.ts` — export logic utilities

## Dependencies
- Spec 4 (Filerobot editor provides the saved image data)
