import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import {
  ComponentProps,
  ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import {
  BetterScrollAreaContent,
  BetterScrollAreaProvider,
} from './better-scroll-area'
import { Button } from './button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

export type BetterDialogProps = ComponentProps<typeof Dialog> & {
  className?: string
  trigger?: ReactNode
  width?: string | number
}

type BetterDialogContentProps = {
  className?: string
  children: ReactNode

  /**
   * @ignore Internal prop, do not use.
   */
  _headerContent?: ReactNode
  /**
   * @ignore Internal prop, do not use.
   */
  _headerClassName?: string

  /**
   * @ignore Internal prop, do not use.
   */
  _footerContent?: ReactNode
  /**
   * @ignore Internal prop, do not use.
   */
  _footerClassName?: string

  title?: ReactNode
  description?: ReactNode

  footerCancel?: ReactNode | true
  footerSubmit?: ReactNode | true
  footerSubmitIcon?: ReactNode
  footerSubmitLoading?: boolean
  footerAlign?: 'start' | 'end' | 'center' | 'between'
  onFooterSubmitClick?: () => void
}

export function BetterDialog({
  className,
  children,
  trigger,
  width,
  ...props
}: BetterDialogProps) {
  return (
    <Dialog {...props}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent
        showCloseButton={false}
        className={cn(
          'bg-background flex h-full max-h-full w-full max-w-full flex-col gap-0 overflow-hidden rounded-none border-0 p-0 outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-[min(var(--width,45rem),90%)] sm:rounded-[1rem] sm:border',
          className
        )}
        style={{
          // @ts-expect-error Sorry Typescript, I know what I'm doing
          '--width': width,
        }}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function BetterDialogContent({
  children,
  className,

  _headerContent: headerContent,
  _footerContent: footerContent,

  title,
  description,

  footerCancel,
  footerSubmit,
  footerSubmitIcon,
  footerSubmitLoading,
  footerAlign = 'end',
  onFooterSubmitClick,
}: BetterDialogContentProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentSize, setContentSize] = useState<{
    width: number
    height: number
  }>()

  useLayoutEffect(() => {
    const contentEl = contentRef.current!
    if (!contentEl) return

    function changeSize() {
      setContentSize({
        width: contentEl.offsetWidth,
        height: contentEl.offsetHeight,
      })
    }

    const observer = new ResizeObserver(changeSize)

    observer.observe(contentEl)
    changeSize()

    return () => {
      observer.disconnect()
    }
  }, [])

  const header = headerContent ? (
    headerContent
  ) : title || description ? (
    <DialogHeader className="flex min-h-17 w-full flex-row items-center justify-between border-b px-4.5 pb-0.5">
      <div className="flex flex-col items-start gap-0.5">
        <DialogTitle className="text-base font-medium">{title}</DialogTitle>
        <DialogDescription className="text-muted-foreground/75 text-sm text-[0.8125rem]">
          {description}
        </DialogDescription>
      </div>

      <DialogClose asChild>
        <button className="bg-muted text-foreground hover:bg-destructive flex size-[1em] cursor-pointer items-center justify-center rounded-[0.25em] text-sm text-[2rem] transition-all hover:text-red-700">
          <svg
            width="0.4em"
            height="0.4em"
            fill="none"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M14.7434 1.1709L0.743408 15.1709M0.743408 1.1709L14.7434 15.1709"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all"
            />
          </svg>
        </button>
      </DialogClose>
    </DialogHeader>
  ) : null

  const footer = footerContent ? (
    footerContent
  ) : footerCancel || footerSubmit ? (
    <DialogFooter
      className={cn(
        'flex w-full flex-row items-center gap-3 px-5 pt-3 pb-4',
        footerAlign === 'between' && 'justify-between sm:justify-between',
        footerAlign === 'center' && 'justify-center sm:justify-center',
        footerAlign === 'start' && 'justify-start sm:justify-start',
        footerAlign === 'end' && 'justify-end sm:justify-end'
      )}
    >
      {footerCancel && (
        <DialogClose asChild>
          <Button variant="ghost">
            {footerCancel === true ? 'Cancel' : footerCancel}
          </Button>
        </DialogClose>
      )}

      {footerSubmit && (
        <Button
          variant="default"
          onClick={onFooterSubmitClick}
          disabled={footerSubmitLoading}
        >
          {!footerSubmitLoading && footerSubmitIcon}
          {footerSubmitLoading && <Loader2 className="size-4 animate-spin" />}
          {footerSubmit === true ? 'Submit' : footerSubmit}
        </Button>
      )}
    </DialogFooter>
  ) : null

  return (
    <>
      {header}

      <BetterScrollAreaProvider style={{ height: contentSize?.height }}>
        <BetterScrollAreaContent>
          <div
            ref={contentRef}
            className={cn('px-4.5 pt-3.5 pb-5', footer && 'pb-2', className)}
          >
            {children}
          </div>
        </BetterScrollAreaContent>
      </BetterScrollAreaProvider>

      {footer}
    </>
  )
}
