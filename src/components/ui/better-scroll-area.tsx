import { cn } from '@/lib/utils'
import { ScrollArea } from './scroll-area'

export function BetterScrollAreaProvider({
  children,
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div {...props} className={cn('relative size-full', className)}>
      {children}
    </div>
  )
}

export function BetterScrollAreaContent({
  ...props
}: React.ComponentProps<typeof ScrollArea>) {
  return (
    <ScrollArea
      {...props}
      style={{
        ...props?.style,
        inset: '0 !important',
        position: 'absolute' as const,
        width: '100%',
        height: '100%',
      }}
    />
  )
}
