import { TableCell, TableRow } from '@/components/ui/table'
import { flexRender, Row } from '@tanstack/react-table'
import { useState } from 'react'
import { HistoryDetailsDialog } from './history-details-dialog'
import { HistoryRecord } from './types.t'

export function HistoryRow({ row }: { row: Row<HistoryRecord> }) {
  const [isOpen, setIsOpen] = useState(false)

  console.log({ isOpen, setIsOpen })

  return (
    <TableRow
      className="cursor-pointer"
      onClick={(e) => {
        if (e.currentTarget.contains(e.target as Node)) {
          setIsOpen(true)
        }
      }}
    >
      {row.getVisibleCells().map((cell) => {
        let cellClassName =
          'w-[150px] max-w-[150px] overflow-hidden py-3 pr-5 text-right'

        if (cell.column.id === 'transcript') {
          cellClassName = 'w-auto py-3 pr-3 pl-5'
        }

        if (cell.column.id === 'transcription_model') {
          cellClassName =
            'w-[110px] max-w-[110px] overflow-hidden py-3 pr-3 pl-4'
        }

        if (cell.column.id === 'duration') {
          cellClassName =
            'w-[105px] max-w-[105px] overflow-hidden py-3 pr-3 pl-4'
        }

        return (
          <TableCell key={cell.id} className={cellClassName}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        )
      })}

      <HistoryDetailsDialog
        open={isOpen}
        record={row.original}
        onOpenChange={(isOpen) => !isOpen && setIsOpen(isOpen)}
      />
    </TableRow>
  )
}
