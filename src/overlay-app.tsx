import { listen } from '@tauri-apps/api/event'
import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { OverlayState } from './features/overlay/overlay-state'

type OverlayStatus = 'recording' | 'processing'

export function OverlayApp() {
  const [status, setStatus] = useState<OverlayStatus>('recording')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const cleanup: (() => void)[] = []

    void listen('overlay-show', () => {
      setVisible(true)
    }).then((fn) => cleanup.push(fn))

    void listen<string>('overlay-status', (event) => {
      const newStatus = event.payload as OverlayStatus
      if (newStatus) {
        setStatus(newStatus)
      }
    }).then((fn) => cleanup.push(fn))

    void listen('overlay-hide', () => {
      setVisible(false)
    }).then((fn) => cleanup.push(fn))

    return () => {
      cleanup.forEach((fn) => fn())
    }
  }, [])

  return (
    <AnimatePresence>
      {visible && <OverlayState status={status} />}
    </AnimatePresence>
  )
}
