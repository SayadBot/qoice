export type HistoryRecord = {
  id: string
  input_audio: string
  transcription_model: string
  transcription_output: string
  transcription_error: string | null
  started_at: number
  completed_at: number
  recording_started_at: number | null
  recording_completed_at: number | null
  resampling_started_at: number | null
  resampling_completed_at: number | null
  transcription_started_at: number | null
  transcription_completed_at: number | null
  injection_started_at: number | null
  injection_completed_at: number | null
  language: string | null
}
