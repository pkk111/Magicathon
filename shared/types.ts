export interface TextAnnotation {
  id: string
  name: string
  text: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  fontFamily: string
  fontStyle: string
  align: string
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
}

export interface MemeSuggestion {
  id: string
  humor_style: string
  confidence: number
  annotations: Record<string, TextAnnotation>
}

export interface SuggestResponse {
  suggestions: MemeSuggestion[]
  imageDescription: string
}

export interface UploadResponse {
  imageId: string
  imageUrl: string
  displayUrl: string
  width: number
  height: number
}

export interface MemeRecord {
  memeId: string
  imageUrl: string
  exportedPngUrl: string
  textFields: TextAnnotation[]
  reactions: Record<string, number>
  totalReactions: number
  createdAt: string
}

export interface ReactRequest {
  memeId: string
  reaction: 'laugh' | 'fire' | 'cry-laugh' | '100' | 'skull' | 'heart'
}

export interface ReactResponse {
  success: boolean
  reactions: Record<string, number>
}
