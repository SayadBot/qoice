# Woice

A desktop application built with Tauri, React, and TypeScript.

## Features

- Built with [Tauri](https://tauri.app) for a lightweight, secure desktop experience
- [React](https://reactjs.org) with TypeScript for a modern UI
- [Vite](https://vitejs.dev) for fast development and builds
- [Tailwind CSS](https://tailwindcss.com) for styling
- State management with [Zustand](https://zustand-demo.pmndrs)
- Form handling with [React Hook Form](https://react-hook-form.com)
- Data fetching with [TanStack Query](https://tanstack.com/query)
- UI components from [Shadcn](https://ui.shadcn.com) and [Base UI](https://base-ui.com)
- Icons from [Hugeicons](https://hugeicons.com) and [Lucide](https://lucide.dev)
- Charts with [Recharts](https://recharts.org)
- Animations with [Framer Motion](https://www.framer.com/motion)
- Date handling with [date-fns](https://date-fns.org)
- Theme switching with [next-themes](https://github.com/pacocoursey/next-themes)
- Tauri plugins for autostart, filesystem, global shortcuts, opener, and SQL

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) (version 25.7.0 or later)
- [pnpm](https://pnpm.io) (package manager)
- [Rust](https://www.rust-lang.org) (for Tauri builds)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Development

To start the development server:

```bash
pnpm dev
```

To build the application:

```bash
pnpm build
```

To run the Tauri application:

```bash
pnpm tauri
```

### Available Scripts

- `pnpm dev` - Start Vite development server
- `pnpm build` - Build the application for production
- `pnpm tauri` - Run the Tauri application
- `pnpm tc` - Watch TypeScript compilation
- `pnpm lint` - Run ESLint and TypeScript type checking
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm lint:format` - Format code with Prettier

## Project Structure

- `src/` - Source code
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions and libraries
  - `store/` - Zustand stores
  - `styles/` - CSS and Tailwind configuration
  - `types/` - TypeScript type definitions
- `src-tauri/` - Tauri backend code
  - `src/` - Rust source code
  - `tauri.conf.json` - Tauri configuration

## License

This project is licensed under the MIT License.
