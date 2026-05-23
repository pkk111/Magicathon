# Spec 1: Image Upload

## Priority: P0 (MVP)

## Goal
Accept a user photo via drag-drop, file picker, clipboard paste, or device camera. Upload to Vercel Blob and return a URL.

## User Story
As a user, I can drop a photo (or paste/snap from camera), see a preview instantly, and have it stored for meme generation.

## Acceptance Criteria
- [ ] Drag-drop triggers on the upload zone
- [ ] File picker opens on click
- [ ] Clipboard paste (`Ctrl+V` / `Cmd+V`) captures image data globally
- [ ] Device camera access via `navigator.mediaDevices.getUserMedia()` — works on both mobile (rear/front camera) and desktop (webcam)
- [ ] Camera UI: live viewfinder with capture button, switch front/rear on mobile
- [ ] Fallback: `<input type="file" accept="image/*" capture="environment">` for browsers that block getUserMedia
- [ ] Image is reformatted client-side to 1920x1080 (16:9 ratio, crop/letterbox as needed)
- [ ] Upload hits `POST /api/upload`, returns `{ imageId, imageUrl, width, height }`
- [ ] Loading spinner shown during upload
- [ ] Error toast if upload fails
- [ ] Works on mobile (iOS Safari + Android Chrome)

## API Contract

### `POST /api/upload`

**Request**: `multipart/form-data` with field `image` (Blob)

**Response** (200):
```json
{
  "imageId": "abc123",
  "imageUrl": "https://blob.vercel-storage.com/...",
  "width": 1200,
  "height": 800
}
```

**Error** (500):
```json
{
  "error": "Upload failed",
  "code": "UPLOAD_ERROR"
}
```

## Key Files
- `src/components/Upload/UploadZone.tsx` — main upload UI
- `src/components/Upload/CameraCapture.tsx` — device camera modal (getUserMedia with front/rear switch)
- `src/hooks/useUpload.ts` — upload logic + state
- `src/lib/image.ts` — client-side resize utility
- `api/upload.ts` — serverless function

## Technical Notes
- Use `canvas` to reformat uploaded image to 1920x1080 (center-crop to fill 16:9, then export via `canvas.toBlob()`)
- Max file size: 10MB before processing
- Accept: `image/jpeg, image/png, image/webp, image/gif`
- Vercel Blob: use `put()` from `@vercel/blob`
- Generate `imageId` with `nanoid(12)`

### Camera Capture (how it works)
`getUserMedia({ video: { facingMode: 'environment' } })` opens a **live video stream** (viewfinder). To capture a still **image**:
1. Display the video stream in a `<video>` element (live preview)
2. User taps "Capture" button
3. Draw current video frame onto a hidden `<canvas>`: `canvas.drawImage(videoEl, ...)`
4. Extract image blob: `canvas.toBlob(callback, 'image/jpeg', 0.9)`
5. Stop the video stream: `stream.getTracks().forEach(t => t.stop())`

This is the standard browser approach — there is no direct "photo-only" camera API.

- Use `facingMode: 'environment'` for rear camera, `'user'` for front
- Camera permission: handle `NotAllowedError` gracefully — show message + fall back to file picker
- On iOS Safari: getUserMedia requires HTTPS (works on Vercel deploy, use `vercel dev` locally)

## Dependencies
- Spec 0 (project scaffold)
