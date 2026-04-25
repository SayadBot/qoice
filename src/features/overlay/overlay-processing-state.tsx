import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export function OverlayProcessingState() {
  return (
    <div className="flex size-full items-center justify-center">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="size-7 shrink-0 animate-spin"
      />
    </div>
  )
}
