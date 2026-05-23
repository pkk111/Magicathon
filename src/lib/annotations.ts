import type { TextAnnotation } from '../../shared/types'

const AI_WIDTH = 1920
const AI_HEIGHT = 1080

interface ScaledAnnotations {
  annotations: Record<string, object>
  annotationIds: string[]
}

export function scaleAnnotationsToEditor(
  rawAnnotations: Record<string, TextAnnotation>,
  displayWidth: number,
  displayHeight: number,
): ScaledAnnotations {
  const scaleX = displayWidth / AI_WIDTH
  const scaleY = displayHeight / AI_HEIGHT

  const annotations = Object.fromEntries(
    Object.entries(rawAnnotations).map(([key, ann]) => {
      const scaledWidth = (ann.width || 800) * scaleX
      return [
        key,
        {
          ...ann,
          x: ann.x * scaleX - scaledWidth / 2,
          y: ann.y * scaleY,
          width: scaledWidth,
          height: (ann.height || 120) * scaleY,
          fontSize: ann.fontSize * scaleY,
          strokeWidth: (ann.strokeWidth || 3) * scaleX,
          name: 'Text',
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
          visible: true,
          padding: 1,
          verticalAlign: 'top',
          lineHeight: 1,
          letterSpacing: 0,
          fontWeight: 'bold',
        },
      ]
    })
  )

  return { annotations, annotationIds: Object.keys(annotations) }
}
