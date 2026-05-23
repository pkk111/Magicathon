import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import express from 'express'
import multer from 'multer'
import { createServer as createViteServer } from 'vite'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

const app = express()
app.use(express.json())
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } })

// Import API handlers
const loadHandler = async (path: string) => (await import(path)).default

// Health
app.get('/api/health', async (req, res) => {
  const handler = await loadHandler('./api/health.ts')
  handler(req, res)
})

// Upload (use multer locally since Express doesn't stream like Vercel)
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'No image file found', code: 'NO_FILE' })
    }
    const isMemeExport = req.headers['x-upload-type'] === 'meme'
    const folder = isMemeExport ? 'memes' : 'upload'
    const ext = isMemeExport ? 'png' : 'jpg'

    const imageId = nanoid(12)
    const blob = await put(`${folder}/${imageId}.${ext}`, file.buffer, {
      access: 'private',
      contentType: isMemeExport ? 'image/png' : (file.mimetype || 'image/jpeg'),
    })
    return res.status(200).json({
      imageId,
      imageUrl: blob.url,
      displayUrl: `/api/image?url=${encodeURIComponent(blob.url)}`,
      width: 1920,
      height: 1080,
    })
  } catch (e) {
    console.error('Upload error:', e)
    return res.status(500).json({ error: 'Upload failed', code: 'UPLOAD_ERROR' })
  }
})

// Suggest
app.post('/api/suggest', async (req, res) => {
  const handler = await loadHandler('./api/suggest.ts')
  handler(req, res)
})

// Image proxy (signed URL)
app.get('/api/image', async (req, res) => {
  const handler = await loadHandler('./api/image.ts')
  handler(req, res)
})

// Meme CRUD
app.post('/api/meme', async (req, res) => {
  const handler = await loadHandler('./api/meme.ts')
  handler(req, res)
})

app.get('/api/meme/:id', async (req, res) => {
  (req as any).query = { id: req.params.id }
  const handler = await loadHandler('./api/meme/[id].ts')
  handler(req, res)
})

// React
app.post('/api/react', async (req, res) => {
  const handler = await loadHandler('./api/react.ts')
  handler(req, res)
})

// Feed
app.get('/api/feed', async (req, res) => {
  const handler = await loadHandler('./api/feed.ts')
  handler(req, res)
})

// DB Setup
app.post('/api/setup-db', async (req, res) => {
  const handler = await loadHandler('./api/setup-db.ts')
  handler(req, res)
})

async function start() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })

  app.use(vite.middlewares)

  app.listen(3000, () => {
    console.log('🚀 Dev server running at http://localhost:3000')
    console.log('   API routes: /api/health, /api/upload, /api/suggest, etc.')
  })
}

start()
