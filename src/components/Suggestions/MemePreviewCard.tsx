import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Text } from 'react-konva'
import type { MemeSuggestion } from '../../../shared/types'

const CANVAS_W = 1920
const CANVAS_H = 1080

interface Props {
  suggestion: MemeSuggestion
  imageUrl: string
  selected: boolean
  onSelect: () => void
}

export default function MemePreviewCard({ suggestion, imageUrl, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(400)
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
    img.onload = () => setImage(img)
  }, [imageUrl])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const scale = containerWidth / CANVAS_W
  const displayHeight = CANVAS_H * scale

  const annotations = Object.values(suggestion.annotations || {})

  return (
    <div
      ref={containerRef}
      onClick={onSelect}
      className={`
        cursor-pointer rounded-lg overflow-hidden transition-all duration-200
        ${selected ? 'ring-3 ring-acid scale-[1.02]' : 'hover:ring-2 hover:ring-paper/40'}
      `}
      style={{ aspectRatio: '16/9' }}
    >
      <Stage width={containerWidth} height={displayHeight} scaleX={scale} scaleY={scale}>
        <Layer>
          {image && (
            <KonvaImage image={image} width={CANVAS_W} height={CANVAS_H} />
          )}
          {annotations.map((ann) => (
            <Text
              key={ann.id}
              x={ann.x - (ann.width || 800) / 2}
              y={ann.y}
              width={ann.width}
              text={ann.text}
              fontSize={ann.fontSize}
              fontFamily={ann.fontFamily || 'Impact'}
              fontStyle={ann.fontStyle || 'bold'}
              fill={ann.fill || '#FFFFFF'}
              stroke={ann.stroke || '#000000'}
              strokeWidth={ann.strokeWidth || 3}
              shadowColor="#000000"
              shadowBlur={4}
              shadowOffsetX={2}
              shadowOffsetY={2}
              align={(ann.align as 'left' | 'center' | 'right') || 'center'}
              lineHeight={1.2}
              wrap="word"
            />
          ))}
        </Layer>
      </Stage>
    </div>
  )
}
