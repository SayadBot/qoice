---
name: dialog
description: Build accessible, responsive dialog components with scrollable content, headers, and action footers. Use this skill when creating modals, forms, confirmations, or any dialog-based UI patterns.
---

## Overview

The `BetterDialog` component is a production-grade dialog/modal component designed for building accessible, responsive dialogs with rich content layouts. It provides a flexible, scroll-aware container system for creating polished modal experiences.

## Component Structure

### `BetterDialog`

The outer wrapper component that manages dialog state and rendering.

**Props:**

- `className?`: Additional CSS classes for the dialog
- `trigger?`: ReactNode to trigger the dialog (typically a Button)
- Inherits all Dialog props for state management

**Example:**

```tsx
<BetterDialog trigger={<Button>Open Dialog</Button>}>
  <BetterDialogContent title="Confirm Action" description="Are you sure?">
    <p>Dialog content goes here</p>
  </BetterDialogContent>
</BetterDialog>
```

**Pro Tip:**

Split `BetterDialog` and `BetterDialogContent` into separate components when the content has complex state or logic. This prevents the entire dialog from re-rendering when only the content state changes. Example:

```tsx
// ❌ Content re-renders the whole dialog
function MyDialog() {
  const [value, setValue] = useState('')
  return (
    <BetterDialog trigger={<Button>Open</Button>}>
      <BetterDialogContent>
        <input onChange={(e) => setValue(e.target.value)} />
      </BetterDialogContent>
    </BetterDialog>
  )
}

// ✅ Only content re-renders, dialog stays stable (Recommended)
function MyDialog() {
  return (
    <BetterDialog trigger={<Button>Open</Button>}>
      <MyDialogContent />
    </BetterDialog>
  )
}

function MyDialogContent() {
  const [value, setValue] = useState('')
  return (
    <BetterDialogContent>
      <input onChange={(e) => setValue(e.target.value)} />
    </BetterDialogContent>
  )
}
```

Use this pattern when dialogs have forms, filters, or frequently updating content.

### `BetterDialogContent`

The main content container with built-in support for headers, scrollable content, and footers.

**Props:**

- `title?`: Header title text
- `description?`: Header subtitle/description text
- `children`: Main content to display
- `footerCancel?`: Cancel button label (or `true` for default "Cancel")
- `footerSubmit?`: Submit button label (or `true` for default "Submit")
- `footerSubmitIcon?`: Icon to display in submit button
- `footerSubmitLoading?: boolean`: Show loading spinner in submit button
- `footerAlign?`: Footer button alignment - `'start' | 'end' | 'center' | 'between'` (default: `'end'`)
- `onFooterSubmitClick?`: Callback when submit button is clicked
- `className?`: Additional classes for the content area

## Usage Examples

### Dialog with Form and Submit

```tsx
<BetterDialogContent
  title="Edit Settings"
  description="Update your preferences"
  footerCancel={true}
  footerSubmit={true}
  onFooterSubmitClick={async () => handleSave()}
>
  <input type="text" placeholder="Name" />
</BetterDialogContent>
```

### Dialog with Loading State

```tsx
const [isLoading, setIsLoading] = useState(false)

<BetterDialogContent
  title="Delete Item"
  footerCancel
  footerSubmit="Delete"
  footerSubmitLoading={isLoading}
  onFooterSubmitClick={async () => {
    setIsLoading(true)
    await deleteItem()
    setIsLoading(false)
  }}
>
  <p>This action cannot be undone.</p>
</BetterDialogContent>
```

### Usage with `BetterDialogContent` props (Recommended)

```tsx
import {
  BetterDialog,
  BetterDialogContent,
} from '@/components/ui/better-dialog'

type UsageDialogContentProps = {
  type?: string
}

function UsageDialog({
  open,
  onOpenChange,
  ...props
}: UsageDialogContentProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <BetterDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={<Button>Open Dialog</Button>}
    >
      <UsageDialogContent type={{ ...props }} />
    </BetterDialog>
  )
}

function UsageDialogContent({ type }: UsageDialogContentProps) {
  return (
    <BetterDialogContent title="Confirm Action" description="Are you sure?">
      <p>Dialog content goes here</p>
    </BetterDialogContent>
  )
}
```

## Key Features

- **Responsive Design**: Adapts from full-screen on mobile to constrained modal on desktop
- **Automatic Scrolling**: Content area scrolls when it exceeds available space
- **Built-in Close Button**: X button in header automatically closes the dialog
- **Loading States**: Integrated support for async operations with loading indicators
- **Flexible Footer**: Customizable button alignment and labels
- **Accessible**: Built on Radix UI's Dialog primitives for accessibility

## Customization (In case you need more control)

### Custom Header

Use `_headerContent` prop to replace the default header entirely:

```tsx
<BetterDialogContent
  _headerContent={<div className="custom-header">Custom</div>}
>
  Content
</BetterDialogContent>
```

### Custom Footer

Use `_footerContent` prop for complete footer control:

```tsx
<BetterDialogContent
  _footerContent={<div className="custom-footer">Custom Footer</div>}
>
  Content
</BetterDialogContent>
```

### Content Styling

Pass `className` to customize the content area padding and styling:

```tsx
<BetterDialogContent className="space-y-4" title="Example">
  Content
</BetterDialogContent>
```
