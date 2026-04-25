import { Button } from '@/components/ui/button'
import { GROQ_MODELS } from '@/constants/models'
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  ArrowUpDownIcon,
  BrainIcon,
  Clock01Icon,
  HourglassIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { type ColumnDef } from '@tanstack/react-table'
import { differenceInMilliseconds, format } from 'date-fns'
import { HistoryRecord } from './types.t'

export const HISTORY_TABLE_COLUMNS: ColumnDef<HistoryRecord>[] = [
  {
    id: 'transcript',
    accessorFn: (row) =>
      row.transcription_error || row.transcription_output || 'No output',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 inline-flex justify-start gap-1.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <span className="truncate">Transcription</span>
        {column.getIsSorted() === 'asc' && (
          <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() === 'desc' && (
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() !== 'asc' && column.getIsSorted() !== 'desc' && (
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            className="size-3.5 opacity-50"
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original.transcription_error) {
        return (
          <span
            className="text-destructive block truncate"
            title={`Error: ${row.original.transcription_error}`}
          >
            Error: {row.original.transcription_error}
          </span>
        )
      }

      return (
        <span
          className="block truncate"
          title={row.original.transcription_output || 'Empty'}
        >
          {row.original.transcription_output || 'Empty'}
        </span>
      )
    },
  },
  {
    accessorKey: 'transcription_model',
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-1 inline-flex justify-start gap-1.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <HugeiconsIcon icon={BrainIcon} className="size-4 shrink-0" />
        {column.getIsSorted() === 'asc' && (
          <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() === 'desc' && (
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() !== 'asc' && column.getIsSorted() !== 'desc' && (
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            className="size-3.5 opacity-50"
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const model = GROQ_MODELS.find(
        (m) => m.id === row.original.transcription_model
      )
      const displayName = model?.name ?? row.original.transcription_model

      return (
        <span className="block truncate font-medium" title={displayName}>
          {displayName}
        </span>
      )
    },
  },
  {
    id: 'duration',
    accessorFn: (row) => {
      if (row.recording_completed_at == null) {
        return 0
      }
      if (row.injection_completed_at == null) {
        return 0
      }

      const start = Number(row.recording_completed_at)
      const end = Number(row.injection_completed_at)

      if (Number.isNaN(start)) {
        return 0
      }
      if (Number.isNaN(end)) {
        return 0
      }

      return end - start
    },
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 inline-flex justify-start gap-1.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <HugeiconsIcon icon={HourglassIcon} className="size-4 shrink-0" />
        {column.getIsSorted() === 'asc' && (
          <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() === 'desc' && (
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() !== 'asc' && column.getIsSorted() !== 'desc' && (
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            className="size-3.5 opacity-50"
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      if (row.original.recording_completed_at == null) {
        return '-'
      }
      if (row.original.injection_completed_at == null) {
        return '-'
      }

      const start = Number(row.original.recording_completed_at)
      const end = Number(row.original.injection_completed_at)

      if (Number.isNaN(start)) {
        return '-'
      }
      if (Number.isNaN(end)) {
        return '-'
      }
      if (end <= start) {
        return '-'
      }

      const durationMs = differenceInMilliseconds(end, start)

      if (durationMs > 1000) {
        return `${+(durationMs / 1000).toFixed(1)}s`
      }

      return `${durationMs}ms`
    },
  },
  {
    id: 'createdAt',
    accessorFn: (row) => {
      if (row.started_at == null) {
        return 0
      }
      const startedAt = Number(row.started_at)
      if (Number.isNaN(startedAt)) {
        return 0
      }
      return startedAt
    },
    header: ({ column }) => (
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto inline-flex justify-end gap-1.5"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      >
        <HugeiconsIcon icon={Clock01Icon} className="size-4 shrink-0" />
        {column.getIsSorted() === 'asc' && (
          <HugeiconsIcon icon={ArrowUp01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() === 'desc' && (
          <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5" />
        )}
        {column.getIsSorted() !== 'asc' && column.getIsSorted() !== 'desc' && (
          <HugeiconsIcon
            icon={ArrowUpDownIcon}
            className="size-3.5 opacity-50"
          />
        )}
      </Button>
    ),
    cell: ({ row }) => {
      const startedAt = Number(row.original.started_at)
      if (Number.isNaN(startedAt)) {
        return '-'
      }
      return format(new Date(startedAt), 'MMM d, h:mm a')
    },
  },
]
