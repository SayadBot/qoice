import { listen } from '@tauri-apps/api/event'
import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

const SPECTRUM_POINTS = 20
const VISUALIZER_BARS = 22
const VISUALIZER_VIEWBOX_WIDTH = 140
const VISUALIZER_VIEWBOX_HEIGHT = 20
const VISUALIZER_BAR_WIDTH = 4

function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function createBaselineSpectrum() {
  return Array.from({ length: SPECTRUM_POINTS }, () => 0.04)
}

export function OverlayRecordingState() {
  const [elapsed, setElapsed] = useState(0)
  const [displaySpectrum, setDisplaySpectrum] = useState<number[]>(
    createBaselineSpectrum
  )
  const targetSpectrumRef = useRef<number[]>(createBaselineSpectrum())

  useEffect(() => {
    const cleanup: (() => void)[] = []

    void listen<number>('overlay-tick', (event) => {
      setElapsed(event.payload ?? 0)
    }).then((fn) => cleanup.push(fn))

    void listen<number[]>('overlay-spectrum', (event) => {
      const next = event.payload
      if (!Array.isArray(next) || next.length === 0) {
        return
      }

      const normalized = Array.from({ length: SPECTRUM_POINTS }, (_, index) => {
        const value = next[index] ?? 0.04
        return Number.isFinite(value)
          ? Math.min(1, Math.max(0.03, value))
          : 0.04
      })

      targetSpectrumRef.current = normalized
    }).then((fn) => cleanup.push(fn))

    return () => {
      cleanup.forEach((fn) => fn())
    }
  }, [])

  useEffect(() => {
    let frame = 0

    function animate() {
      setDisplaySpectrum((current) =>
        current.map((value, index) => {
          const target = targetSpectrumRef.current[index] ?? 0.03
          return value + (target - value) * 0.52
        })
      )

      frame = window.requestAnimationFrame(animate)
    }

    frame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const visualizerLevels = useMemo(
    () =>
      Array.from({ length: VISUALIZER_BARS }, (_, index) => {
        const position =
          (index * (displaySpectrum.length - 1)) / (VISUALIZER_BARS - 1)
        const left = Math.floor(position)
        const right = Math.min(displaySpectrum.length - 1, left + 1)
        const blend = position - left
        const sample =
          (displaySpectrum[left] ?? 0.04) * (1 - blend) +
          (displaySpectrum[right] ?? 0.04) * blend
        const gated = Math.max(0, sample - 0.12)
        const normalized = Math.min(1, gated / 0.88)
        return normalized ** 0.7
      }),
    [displaySpectrum]
  )

  return (
    <div className="flex size-full items-center gap-2">
      <svg
        className="block h-9 w-full"
        viewBox={`0 0 ${VISUALIZER_VIEWBOX_WIDTH} ${VISUALIZER_VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
      >
        {visualizerLevels.map((amplitude, index) => {
          const x =
            (index / (VISUALIZER_BARS - 1)) *
            (VISUALIZER_VIEWBOX_WIDTH - VISUALIZER_BAR_WIDTH)
          const targetHeight = 2 + amplitude * 18
          const centerY = VISUALIZER_VIEWBOX_HEIGHT / 2
          const targetTop = centerY - targetHeight / 2
          const targetBottom = centerY + targetHeight / 2

          return (
            <motion.line
              key={index}
              x1={x + VISUALIZER_BAR_WIDTH / 2}
              y1={targetTop}
              x2={x + VISUALIZER_BAR_WIDTH / 2}
              y2={targetBottom}
              strokeWidth={2.5}
              strokeLinecap="round"
              initial={false}
              animate={{ y1: targetTop, y2: targetBottom }}
              transition={{
                type: 'spring',
                stiffness: 280,
                damping: 24,
                mass: 0.35,
              }}
              stroke="#ffffff"
            />
          )
        })}
      </svg>

      <div className="flex items-center text-sm tabular-nums">
        {formatElapsed(elapsed)}
      </div>
    </div>
  )
}
