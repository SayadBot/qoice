import { cn } from '@/lib/utils'
import { createContext } from 'daily-code/react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ComponentPropsWithoutRef,
  Fragment,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Button } from './button'

type TriggerRect = {
  top: number
  left: number
  width: number
  height: number
}

type TriggerItem = Omit<
  ComponentPropsWithoutRef<'button'>,
  'label' | 'content'
> & {
  label: ReactNode
  content: ReactNode

  activeIcon?: ReactNode
  activeLabel?: ReactNode
}

type AwesomeTabsContextProps = {
  defaultTab?: number
  items: TriggerItem[]
}

type AwesomeTabsTriggerProps = ComponentPropsWithoutRef<'div'> & {
  renderOverlay?: (triggerRect: TriggerRect) => ReactNode
  renderButton?: (props: { isActive: boolean; item: TriggerItem }) => ReactNode
}

export const [AwesomeTabs, useAwesomeTabsContext] = createContext(
  ({ items, defaultTab }: AwesomeTabsContextProps) => {
    const [currentTab, setCurrentTab] = useState(defaultTab ?? 0)

    const triggerContainerRef = useRef<HTMLDivElement | null>(null)
    const [triggerSizes, setTriggerSizes] = useState<TriggerRect[]>([])

    useEffect(() => {
      const triggerContainer = triggerContainerRef.current!
      if (!triggerContainer) return

      const triggers = Array.from(triggerContainer.children)
      if (triggers.length === 0) return

      function updateChanges() {
        const containerRect = triggerContainer.getBoundingClientRect()

        setTriggerSizes(
          triggers.map((entry) => {
            const { top, left, width, height } = entry.getBoundingClientRect()
            return {
              width,
              height,
              top: top - containerRect.top,
              left: left - containerRect.left,
            }
          })
        )
      }

      const resizeObserver = new ResizeObserver(() => updateChanges)
      triggers.forEach((child) => resizeObserver.observe(child))

      updateChanges()
      return () => resizeObserver.disconnect()
    }, [triggerContainerRef])

    const selectedTriggerRect = triggerSizes[currentTab]

    return {
      items,
      currentTab,
      setCurrentTab,
      triggerContainerRef,
      selectedTriggerRect,
    }
  }
)

export function AwesomeTabsTriggers({
  renderOverlay,
  renderButton,
  ...props
}: AwesomeTabsTriggerProps) {
  const {
    items,
    currentTab,
    setCurrentTab,
    triggerContainerRef,
    selectedTriggerRect,
  } = useAwesomeTabsContext()

  return (
    <div
      {...props}
      ref={triggerContainerRef}
      className={cn(
        'ring-border relative isolate flex w-fit items-center justify-center gap-2 overflow-hidden rounded-md ring',
        props.className
      )}
    >
      {!renderButton &&
        items.map(
          ({ activeLabel, activeIcon, label, content: _, ...props }, index) => (
            <Button
              {...props}
              key={index}
              variant="ghost"
              data-active={currentTab === index}
              onClick={(e) => {
                setCurrentTab(index)
                props.onClick?.(e)
              }}
              className={cn('hover:bg-transparent', props.className)}
            >
              {currentTab === index && activeIcon}
              {currentTab === index && activeLabel ? activeLabel : label}
            </Button>
          )
        )}

      {renderButton &&
        items.map((item, index) => (
          <Fragment key={index}>
            {renderButton({ isActive: currentTab === index, item })}
          </Fragment>
        ))}

      {selectedTriggerRect && !renderOverlay && (
        <div
          className="bg-primary absolute top-0 bottom-0 left-0 -z-10 h-full rounded-md transition-all duration-300"
          style={{
            top: selectedTriggerRect.top,
            left: selectedTriggerRect.left,
            width: selectedTriggerRect.width,
            height: selectedTriggerRect.height,
          }}
        />
      )}

      {selectedTriggerRect && renderOverlay?.(selectedTriggerRect)}
    </div>
  )
}

export function AwesomeTabsContent() {
  const { items, currentTab } = useAwesomeTabsContext()

  return (
    <>
      {items.map((item, index) => (
        <AnimatePresence key={index} mode="popLayout">
          {currentTab === index && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {item.content}
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </>
  )
}
