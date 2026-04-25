import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Kbd } from '@/components/ui/kbd'
import { cn } from '@/lib/utils'

type HotkeyCaptureButtonProps = {
  value: string
  onChange: (value: string) => void
}

const modifierOrder = ['Ctrl', 'Alt', 'Shift', 'Meta']

function normalizeHotkeyKey(key: string) {
  if (key === 'Control') {
    return 'Ctrl'
  }

  if (key === 'Alt') {
    return 'Alt'
  }

  if (key === 'Shift') {
    return 'Shift'
  }

  if (key === 'Meta') {
    return 'Meta'
  }

  if (key === ' ') {
    return 'Space'
  }

  if (key.startsWith('Arrow')) {
    return key.slice(5)
  }

  if (key.length === 1) {
    return key.toUpperCase()
  }

  return key
}

function orderHotkeyParts(parts: string[]) {
  return [...parts].sort((left, right) => {
    const leftIndex = modifierOrder.indexOf(left)
    const rightIndex = modifierOrder.indexOf(right)

    if (leftIndex !== -1 && rightIndex !== -1) {
      return leftIndex - rightIndex
    }

    if (leftIndex !== -1) {
      return -1
    }

    if (rightIndex !== -1) {
      return 1
    }

    return left.localeCompare(right)
  })
}

function toHotkeyString(keys: Set<string>) {
  return orderHotkeyParts([...keys]).join('+')
}

function hasPrimaryKey(hotkey: string) {
  return hotkey
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => !modifierOrder.includes(part))
}

function getHotkeyParts(hotkey: string) {
  return hotkey
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
}

export function HotkeyCaptureButton({
  value,
  onChange,
}: HotkeyCaptureButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [tempHotkey, setTempHotkey] = useState('')
  const pressedKeysRef = useRef(new Set<string>())
  const tempHotkeyRef = useRef('')

  function resetCaptureState() {
    pressedKeysRef.current = new Set()
    tempHotkeyRef.current = ''
    setTempHotkey('')

    if (buttonRef.current) {
      buttonRef.current.blur()
    }
  }

  function stopCapturing() {
    setIsCapturing(false)
    resetCaptureState()
  }

  useEffect(() => {
    if (!isCapturing) {
      resetCaptureState()
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        setIsCapturing(false)
        resetCaptureState()

        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur()
        }

        return
      }

      const normalizedKey = normalizeHotkeyKey(event.key)

      if (pressedKeysRef.current.has(normalizedKey)) {
        return
      }

      const next = new Set(pressedKeysRef.current)
      next.add(normalizedKey)
      const nextHotkey = toHotkeyString(next)

      pressedKeysRef.current = next
      tempHotkeyRef.current = nextHotkey
      setTempHotkey(nextHotkey)
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        return
      }

      event.preventDefault()
      event.stopPropagation()

      if (event.key === 'Escape') {
        return
      }

      const normalizedKey = normalizeHotkeyKey(event.key)

      if (!pressedKeysRef.current.has(normalizedKey)) {
        return
      }

      const next = new Set(pressedKeysRef.current)
      next.delete(normalizedKey)

      pressedKeysRef.current = next

      if (next.size > 0) {
        return
      }

      const capturedHotkey = tempHotkeyRef.current

      setIsCapturing(false)
      resetCaptureState()

      if (hasPrimaryKey(capturedHotkey)) {
        onChange(capturedHotkey)
      }

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
    }
  }, [isCapturing, onChange])

  const hotkeyDisplay = isCapturing ? tempHotkey : value
  const hotkeyParts = getHotkeyParts(hotkeyDisplay)

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="ghost"
      className={cn(
        'bg-input/30 hover:bg-muted/75 border-input h-11 w-full max-w-full shrink basis-full justify-between rounded-md border px-3.5 text-left shadow-none transition-colors',
        {
          'bg-primary/8 text-primary hover:bg-primary/10 ring-primary/80! ring-2!':
            isCapturing,
        }
      )}
      onClick={() => setIsCapturing(true)}
      onFocus={() => setIsCapturing(true)}
      onBlur={stopCapturing}
    >
      <span className="flex min-h-6 flex-wrap items-center gap-1.5">
        {hotkeyParts.length > 0 ? (
          hotkeyParts.map((part, index) => (
            <span
              key={`${part}-${index}`}
              className="flex items-center gap-1.5"
            >
              {index > 0 ? (
                <span className="text-muted-foreground text-xs">+</span>
              ) : null}
              <Kbd
                className={cn(
                  'bg-background/88 text-foreground h-6 min-w-7 rounded-md px-2 text-xs shadow-none',
                  isCapturing && 'bg-background text-primary'
                )}
              >
                {part}
              </Kbd>
            </span>
          ))
        ) : (
          <span className="text-muted-foreground text-sm">
            {isCapturing ? 'Press shortcut' : 'Set shortcut'}
          </span>
        )}
      </span>

      <span className="flex items-center gap-2">
        <span
          className={cn(
            'bg-foreground/18 size-1.5 rounded-full transition-colors',
            isCapturing && 'bg-primary'
          )}
        />
        <span className="text-muted-foreground text-[11px] font-medium">
          {isCapturing ? 'Recording' : 'Ready'}
        </span>
      </span>
    </Button>
  )
}
