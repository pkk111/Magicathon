export interface UploadResult {
  imageId: string
  imageUrl: string
  displayUrl: string
  width: number
  height: number
}

export async function uploadImage(blob: Blob): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('image', blob, 'photo.jpg')

  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(err.error || 'Upload failed')
  }
  return res.json()
}

export function getDisplayUrl(privateUrl: string): string {
  return `/api/image?url=${encodeURIComponent(privateUrl)}`
}
