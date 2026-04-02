# Pixel Battle

A real-time, scalable multiplayer pixel art canvas game where users can collaborate (or compete!) to draw on a shared digital board.

Built using a modern monorepo architecture with Turborepo, this project features a high-performance Fastify backend and a responsive React frontend.

## Tech Stack

### Architecture

- **Monorepo**: Turborepo
- **Package Manager**: pnpm

### Backend (`apps/api`)

- **Framework**: Fastify
- **Database**: PostgreSQL with Drizzle ORM
- **Cache / Message Broker**: Redis
- **Real-time**: WebSockets (`@fastify/websocket`)
- **Validation**: Zod
- **Authentication**: JWT & Argon2

### Frontend (`apps/web`)

- **Framework**: React 19 powered by Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Forms**: TanStack React Form

## Project Structure

```text
pixel-battle/
├── apps/
│   ├── api/       # Fastify backend, websockets, and database logic
│   └── web/       # Vite/React frontend application
├── packages/
│   ├── eslint-config/      # Shared ESLint configuration
│   ├── shared/             # Shared types, DTOs, utilities, and constants
│   └── typescript-config/  # Shared tsconfig configurations
└── turbo.json     # Turborepo pipeline configuration
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [pnpm](https://pnpm.io/) (v9+)
- PostgreSQL
- Redis

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables:
   Create `.env` files in both `apps/api` and `apps/web` based on their respective environment requirements.

3. Run database migrations:

```bash
cd apps/api
pnpm db:generate
pnpm db:push
```

### Running the App

Start the development server for all apps and packages in parallel via Turborepo:

```bash
pnpm dev
```

This will simultaneously start the Fastify API server and the Vite React frontend.

## Build

To build all apps for production:

```bash
pnpm build
```

## Scripts

Available in the root `package.json`:

- `pnpm dev` - Start development servers
- `pnpm build` - Build the project using turborepo
- `pnpm lint` - Run ESLint across packages
- `pnpm format` - Run Prettier formatting
