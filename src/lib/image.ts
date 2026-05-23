const TARGET_WIDTH = 1920
const TARGET_HEIGHT = 1080

export function reformatImage(file: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = TARGET_WIDTH
      canvas.height = TARGET_HEIGHT
      const ctx = canvas.getContext('2d')!

      // Center-crop to fill 16:9
      const srcAspect = img.width / img.height
      const targetAspect = TARGET_WIDTH / TARGET_HEIGHT

      let sx = 0, sy = 0, sw = img.width, sh = img.height
      if (srcAspect > targetAspect) {
        sw = img.height * targetAspect
        sx = (img.width - sw) / 2
      } else {
        sh = img.width / targetAspect
        sy = (img.height - sh) / 2
      }

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
        'image/jpeg',
        0.9
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function captureFrameFromVideo(video: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = TARGET_WIDTH
    canvas.height = TARGET_HEIGHT
    const ctx = canvas.getContext('2d')!

    const srcAspect = video.videoWidth / video.videoHeight
    const targetAspect = TARGET_WIDTH / TARGET_HEIGHT

    let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight
    if (srcAspect > targetAspect) {
      sw = video.videoHeight * targetAspect
      sx = (video.videoWidth - sw) / 2
    } else {
      sh = video.videoWidth / targetAspect
      sy = (video.videoHeight - sh) / 2
    }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, TARGET_WIDTH, TARGET_HEIGHT)
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed')),
      'image/jpeg',
      0.9
    )
  })
}
