export type Model = {
  id: string
  name: string
}

export const GROQ_MODELS: Model[] = [
  { id: 'whisper-large-v3', name: 'Expert' },
  { id: 'whisper-large-v3-turbo', name: 'Turbo' },
]
