# Pixel Battle

**Pixel Battle** is a real-time web application where users collaborate and compete to draw on a massive shared digital canvas.

The primary engineering objective of this project is high concurrency. The architecture is explicitly designed to process thousands of simultaneous WebSocket events efficiently, maintaining consistent server performance and client-side responsiveness.

## Core Features

- **Massive Collaborative Canvas**: A shared digital board where concurrent users can place pixels in real-time to create artwork together.
- **Optimistic UI Updates**: To eliminate perceived latency, the client utilizes optimistic rendering. When a user places a pixel, it renders immediately on their local canvas while validation runs asynchronously on the server.
- **Server-Authoritative Cooldowns**: A strict cooldown mechanism prevents users from rapidly placing multiple pixels. The server maintains absolute authority over these timers, dynamically synchronizing the exact cooldown state across all active client connections.
- **Canvas State History (Time Machine)**: An administrative 'History Board' interface allows moderators to navigate backward in time, rendering the precise state of the canvas at any previous millisecond.
- **Activity Heatmap**: A live, real-time heatmap overlay provides visual analytics for moderators, highlighting the exact coordinates experiencing the highest frequency of pixel overwrites.
- **Bulk Area Fill (DrawRect)**: A moderation utility allows administrators to select a rectangular area and instantly override it with a single color, enabling rapid responses to coordinated vandalism.

## Performance Optimization & Architecture

Handling a high-volume WebSocket stream requires significant optimization to prevent severe bottlenecks. Key architectural decisions include:

1. **Redis & Database Event Batching**: Executing isolated database operations for each of the thousands of incoming pixel placements would immediately stall the primary instances. Instead, pixel updates are accumulated in memory and flushed to Redis using optimized pipeline operations. Simultaneously, persistent storage relies on large batch inserts to PostgreSQL, effectively preventing the relational database layer from becoming an I/O bottleneck under immense write loads.
2. **Periodic State Snapshots**: The server periodically exports the current complete state of the canvas. Because of this, clients initializing a session fetch the board map via a standard REST endpoint rather than processing individual history events over the WebSocket connection. This snapshot infrastructure is what powers the Time Machine and serves as a fundamental recovery mechanism.
3. **Client Rendering Optimization**: Unbounded DOM or canvas updates quickly deteriorate client performance. The rendering cycle uses `requestAnimationFrame` to deliberately pool state updates, ultimately dropping idle CPU overhead to near-zero while sustaining a smooth 60fps interface.
4. **Strict Socket Sequencing**: Synchronization relies exclusively on a strict sequence counting mechanism (`seq`). Every event is securely sequenced, guaranteeing that if a client encounters packet loss or connection instability, the events are strictly ordered and processed correctly to prevent permanent canvas desynchronization.
5. **Admin Logic Isolation**: The logic executing administrative tools such as the Heatmap and Time Machine is structurally separated from the primary application. Regular users do not bundle or download this additional code, avoiding arbitrary runtime overhead.

## Technology Stack

The project is structured as a strict monorepo leveraging **Turborepo** and **pnpm**.

### Backend (`apps/api`)

- **Fastify**
- **WebSockets (`@fastify/websocket`)**
- **Redis**
- **PostgreSQL & Drizzle ORM**
- **JWT & argon2**

### Frontend (`apps/web`)

- **React 19**
- **Vite**
- **Tailwind CSS v4**
- **shadcn/ui**
- **React Router**
- **TanStack Form**

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm (v9+)
- PostgreSQL and Redis

### Installation & Setup

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Configure environment variables (create `.env` files in both `apps/api` and `apps/web`).

3. Apply the database schema:

```bash
cd apps/api
pnpm db:generate
pnpm db:push
```

4. Start in dev mode:

```bash
pnpm dev
```

To build the project for production, run `pnpm build`.
