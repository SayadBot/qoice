import { Badge } from '@/components/ui/badge'
import {
  BetterDialog,
  BetterDialogContent,
} from '@/components/ui/better-dialog'
import { GROQ_MODELS } from '@/constants/models'
import { format } from 'date-fns'
import { HistoryRecord } from './types.t'

type HistoryDetailsDialogProps = {
  open: boolean
  record: HistoryRecord
  onOpenChange: (open: boolean) => void
}

type TimelineStep = {
  key: string
  label: string
  start: number | string | null | undefined
  end: number | string | null | undefined
}

function toMs(value: number | string | null | undefined): number | null {
  if (value == null) return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function getStepDuration(
  start: number | null,
  end: number | null
): number | null {
  if (start != null && end != null) {
    return end - start
  }
  return null
}

function formatDuration(ms: number | null): string {
  if (ms == null || ms <= 0) return '-'
  if (ms < 1000) return `${Math.round(ms)}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = ((ms % 60000) / 1000).toFixed(1)
  return `${minutes}m ${seconds}s`
}

function formatTimestamp(value: number | string | null | undefined): string {
  const ms = toMs(value)
  if (ms == null) return '-'
  return format(new Date(ms), 'MMM d, h:mm:ss a')
}

function formatText(value: string | null | undefined): string {
  if (value == null) return '-'
  const trimmed = value.trim()
  return trimmed.length > 0 ? value : '-'
}

function getStepState(start: number | null, end: number | null): string {
  if (start != null && end != null) return 'Completed'
  if (start != null) return 'Running'
  return 'Not started'
}

function getRecordStatus(record: HistoryRecord): string {
  if (record.transcription_error) return 'Failed'
  if (record.completed_at) return 'Completed'
  if (record.started_at) return 'In progress'
  return 'Pending'
}

function getBadgeVariant(
  value: string
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (value === 'Failed') return 'destructive'
  if (value === 'Completed') return 'secondary'
  return 'outline'
}

function DetailField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-[11px] font-medium tracking-[0.12em] uppercase">
        {label}
      </p>
      <p className={mono ? 'font-mono text-sm break-all' : 'text-sm'}>
        {value}
      </p>
    </div>
  )
}

function OutputBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-medium tracking-tight">{title}</h4>
        {value === '-' && <Badge variant="outline">Empty</Badge>}
      </div>
      <div className="bg-muted/40 min-h-28 rounded-xl border px-4 py-3 text-sm break-words whitespace-pre-wrap">
        {value}
      </div>
    </div>
  )
}

function HistoryDetailsDialogContent({ record }: { record: HistoryRecord }) {
  const timelineSteps: TimelineStep[] = [
    {
      key: 'recording',
      label: 'Recording',
      start: record.recording_started_at,
      end: record.recording_completed_at,
    },
    {
      key: 'resampling',
      label: 'Resampling',
      start: record.resampling_started_at,
      end: record.resampling_completed_at,
    },
    {
      key: 'transcription',
      label: 'Transcription',
      start: record.transcription_started_at,
      end: record.transcription_completed_at,
    },
    {
      key: 'injection',
      label: 'Injection',
      start: record.injection_started_at,
      end: record.injection_completed_at,
    },
    {
      key: 'overall',
      label: 'Overall',
      start: record.started_at,
      end: record.completed_at,
    },
  ]

  const transcriptionOutput = formatText(record.transcription_output)
  const transcriptionError = formatText(record.transcription_error)
  const recordStatus = getRecordStatus(record)

  return (
    <BetterDialogContent
      title="Transcription Details"
      description={<>Recorded at {formatTimestamp(record.completed_at)}</>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getBadgeVariant(recordStatus)}>{recordStatus}</Badge>
          <Badge variant="outline">{formatText(record.language)}</Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            {transcriptionError !== '-' && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-950 dark:bg-red-950/30 dark:text-red-300">
                {transcriptionError}
              </div>
            )}

            <OutputBlock
              title="Transcription Output"
              value={transcriptionOutput}
            />
          </div>

          <div className="space-y-4 xl:sticky xl:top-0 xl:self-start">
            <div className="rounded-xl border px-4 py-3">
              <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 xl:grid-cols-1">
                <DetailField
                  label="Total duration"
                  value={formatDuration(
                    getStepDuration(
                      toMs(record.started_at),
                      toMs(record.completed_at)
                    )
                  )}
                />
                <DetailField
                  label="Started"
                  value={formatTimestamp(record.started_at)}
                />
                <DetailField
                  label="Completed"
                  value={formatTimestamp(record.completed_at)}
                />
                <DetailField
                  label="Transcription model"
                  value={formatText(
                    GROQ_MODELS.find((m) => m.id === record.transcription_model)
                      ?.name ?? record.transcription_model
                  )}
                />
                <DetailField
                  label="Input audio"
                  value={formatText(record.input_audio)}
                  mono
                />
              </div>
            </div>

            <div className="space-y-2 rounded-xl border px-4 py-3">
              {timelineSteps.map((step) => {
                const start = toMs(step.start)
                const end = toMs(step.end)
                const state = getStepState(start, end)

                return (
                  <div
                    key={step.key}
                    className="bg-muted/20 rounded-lg px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium">{step.label}</span>
                      <span className="text-muted-foreground text-xs">
                        {formatDuration(getStepDuration(start, end))}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                      <Badge variant={getBadgeVariant(state)}>{state}</Badge>
                      <span className="text-muted-foreground">
                        {formatTimestamp(step.start)} -{' '}
                        {formatTimestamp(step.end)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </BetterDialogContent>
  )
}

export function HistoryDetailsDialog({
  open,
  record,
  onOpenChange,
}: HistoryDetailsDialogProps) {
  return (
    <BetterDialog
      open={open}
      onOpenChange={onOpenChange}
      className="sm:[--width:42rem]"
    >
      <HistoryDetailsDialogContent record={record} />
    </BetterDialog>
  )
}
