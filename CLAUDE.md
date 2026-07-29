# HisabFlow — Project Context

> Update this file whenever a significant change is made to the codebase.

## What Is This

HisabFlow is a web-first bill-splitting and personal finance app built with Next.js 15 (App Router). Free, open-source, no payment wall. Target users: roommates, trip groups, friends splitting bills in PKR.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 15 App Router, TypeScript, Tailwind CSS v4 |
| State | Zustand (`@/store/ledger-store`) |
| Backend | FastAPI (Python) at `http://localhost:8000` |
| Monorepo | pnpm workspaces (root `package.json`) |
| Package manager | pnpm v11 — use `pnpm` not `npm` |

## Repo Layout

```
D:\HisabFlow\
├── apps/
│   └── web/                        # Next.js app
│       ├── app/
│       │   ├── page.tsx            # Landing page
│       │   ├── globals.css         # Global styles + shared responsive CSS
│       │   ├── layout.tsx          # Root layout + nav
│       │   ├── team/
│       │   │   ├── page.tsx        # Team list page
│       │   │   └── [id]/page.tsx   # Ledger detail page (most complex)
│       │   ├── individual/page.tsx # Personal finance (budget, goals, tracker)
│       │   ├── insights/page.tsx   # Spending insights
│       │   ├── profile/page.tsx    # Account settings
│       │   ├── login/page.tsx
│       │   ├── register/page.tsx
│       │   ├── forgot-password/page.tsx
│       │   └── reset-password/page.tsx
│       ├── components/
│       │   ├── ledgers/
│       │   │   ├── add-entry-dialog.tsx
│       │   │   └── edit-entry-dialog.tsx
│       │   └── ui/                 # Shared UI primitives
│       ├── lib/
│       │   ├── api.ts              # All API calls (wraps fetch to FastAPI)
│       │   ├── profile.ts          # localStorage username/displayName helpers
│       │   └── use-auth-guard.ts   # Redirect to /login if not authed
│       ├── store/
│       │   └── ledger-store.ts     # Zustand store + calcDues()
│       └── types/
│           └── ledger.ts           # LedgerEntry, Ledger types
└── .claude/
    └── settings.json               # Claude Code hooks
```

## Run Commands

```bash
# Frontend (from D:\HisabFlow)
pnpm --filter web dev          # starts on :3000

# Backend (separate terminal, from backend dir)
uvicorn main:app --reload      # starts on :8000
```

Known quirk: pnpm v11 needs `pnpm --filter web <cmd>` — bare `pnpm dev` may fail.

## Key Design Decisions

### Ledger Table (`team/[id]/page.tsx`)
The table has 3 sections in a horizontal flex layout:
- **Fixed left**: DATE, Food Bill (amount), Paid By (blue text, always)
- **Scrollable middle**: Shares (per-member split amounts, black text)
- **Scrollable right**: Amounts (per-member paid amounts, collapsible)

Rules that must never change:
- Amounts section **collapsed by default** (`amountsOpen = false`)
- Shows exactly **5 member columns** at a time; >5 scrolls internally
- ≤5 members: columns fill full width of their section
- `MIN_COL = 72` minimum column width to prevent truncation on mobile
- Column borders: `#e0e7ff` (light blue)
- Row backgrounds: `#fff` (no alternating colors)
- Row separators: `1px solid #e0e7ff` border
- Paid By value: `#4a7af5` (blue)
- All other values: `#0c0f1a` (black) — NO green anywhere
- ResizeObserver uses **callback ref** (`useCallback`) not `useRef` — MemberSection is defined inline and would remount on every render if useEffect was used

### Colors & Theme
- Primary blue: `#4a7af5` / `#3a6ae0` / `#1f58ea`
- Light blue borders/dividers: `#e0e7ff`
- Background: `#f5f7ff`
- Success green (dues only): `#059669`
- Danger red: `#dc2626`
- No dark mode — light theme only
- No green stripes anywhere in the team/ledger UI

### Personal Finance (`individual/page.tsx`)
- 4 tabs: budget, goal-tracker, goal-ledger, goal-dashboard
- Chart colors: `CAT_COLOR` map — expenses = `#ef4444` (red), income = `#059669`, bills = `#1d4ed8`, savings = `#10b981`, debt = `#8b5cf6`
- 3 chart cards have distinct tinted backgrounds (blue, purple, orange)
- All data from FastAPI `/api/v1/budget/*`

### Auth
- No JWT — stores username + password in localStorage via `profile.ts`
- `useAuthGuard()` hook redirects to `/login` if no username stored

## Responsive Design (Mobile-First Additions)

All pages are responsive. Desktop layout is unchanged. CSS-only additions via `@media` blocks.

### Breakpoints used
- `1100px` — 3-col charts → 2-col
- `900px` — further grid collapse
- `860px` — team detail top bar
- `768px` — major mobile breakpoint (nav stacks, grids → 1-col)
- `640px` — individual page tighter
- `560px` — landing page nav
- `480px` — fine-tuning buttons/fonts
- `420px` — very small phones

### Per-page mobile notes
- **Landing**: phones scroll horizontally (`lp-hero-visual-wrap { overflow-x:auto; min-width:572px }`)
- **Team list**: table wrapped in `.team-table-wrap { overflow-x:auto }` (in `globals.css`)
- **Team detail**: ledger table in `.ld-table-scroll` (`overflow-x:auto; minWidth:720px`); dues chart in `.ld-chart-scroll`; receipt modal shrinks at 480px; top bar stacks at 768px
- **Individual**: `.bp-section { overflow-x:auto }` at 640px; tab bar scrolls horizontally
- **Insights**: grid collapses at 768px/480px

## CSS Class Naming Conventions

- `.lp-*` — landing page
- `.team-*` — team list page (in `globals.css`)
- `.dues-*` — dues table/chart (in `globals.css`)
- `.ld-*` — ledger detail page (inline `<style>` in `team/[id]/page.tsx`)
- `.bp-*` — budget/personal finance page (inline `<style>` in `individual/page.tsx`)
- `.in-*` — insights page

## API Endpoints (FastAPI)

Base: `http://localhost:8000/api/v1`

- `POST /auth/register`, `/auth/login`, `/auth/change-username`, `/auth/change-password`
- `GET/POST /ledgers`, `GET /ledgers/:id`, `DELETE /ledgers/:id`
- `POST /ledgers/:id/entries`, `PUT /ledgers/:id/entries/:eid`, `DELETE /ledgers/:id/entries/:eid`
- `POST /ledgers/:id/close-month`, `POST /ledgers/:id/reopen-month`
- `POST /ledgers/:id/rename`, `POST /ledgers/:id/leave`
- `GET /ledgers/:id/activities`
- `GET/POST /budget/transactions`, `PUT/DELETE /budget/transactions/:id`
- `GET /budget/summary/:month`
- `GET/POST /budget/goals`, `GET/POST /budget/goal-entries`
- `GET /budget/goal-dashboard`
