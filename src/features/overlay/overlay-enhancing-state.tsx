import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const COLORS = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF']

function buildColorKeyframes(colors: string[]) {
  const n = colors.length
  const steps = Array.from(
    { length: n - 1 },
    (_, i) => `${((i + 1) / n) * 100}% { color: ${colors[i + 1]}; }`
  ).join('\n        ')
  return `0%, 100% { color: ${colors[0]}; }\n        ${steps}`
}

export function OverlayEnhancingState() {
  return (
    <div className="enhancing-state flex size-full items-center justify-center">
      <HugeiconsIcon
        icon={Loading03Icon}
        className="enhancing-state__icon size-7 shrink-0"
      />

      <style>{`
        .enhancing-state__icon {
          animation: enhancing-spin 1.2s linear infinite,
            enhancing-colors 2.4s ease-in-out infinite;
        }

        @keyframes enhancing-spin {
          to { transform: rotate(360deg); }
        }

        @keyframes enhancing-colors {
          ${buildColorKeyframes(COLORS)}
        }
      `}</style>
    </div>
  )
}
