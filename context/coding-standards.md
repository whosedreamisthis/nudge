# Coding Standards

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Next.js

- Server components by default
- Only use `'use client'` when needed (interactivity, hooks, browser APIs)
- Use Server Actions for form submissions, mutations, and data loading from client components
- **Don't use API routes if a Server Action can do the job.** Use an API route only when something external calls it or it needs raw HTTP control:
  - Webhooks (e.g. Clerk)
  - Scheduled jobs / cron endpoints
  - Specific HTTP status codes or headers that matter to the caller
  - Endpoints for future mobile/CLI clients
  - Third-party integrations
- Otherwise, fetch data directly in server components
- Dynamic routes for item/collection pages

## Tailwind CSS v4

**CRITICAL**: We are using Tailwind CSS v4, which uses CSS-based configuration.

- **DO NOT** create `tailwind.config.ts` or `tailwind.config.js` files (those are for v3)
- All theme configuration must be done in CSS using the `@theme` directive in `app/globals.css`
- Use CSS custom properties for colors, spacing, etc.
- No JavaScript-based config allowed

Example v4 configuration:

```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(50% 0.2 250);
}
```

## File Organization

- Components: `components/[feature]/ComponentName.tsx`
- Pages: `app/[route]/page.tsx`
- Auth pages (sign-in, register): in the `app/(auth)/` route group
- Server Actions: `actions/[feature].ts` (all server actions live in `actions/`, never inside components or pages)
- Custom hooks: `hooks/useX.ts` (all custom hooks live in `hooks/`, never inside component files)
- Types: `types/[feature].ts`
- Lib/Utils: `lib/[utility].ts`

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- Tailwind CSS for all styling
- Use shadcn/ui components where applicable
- No inline styles
- Dark mode first, light mode as option

## Database

- Use Prisma ORM for all database operations
- Always use `prisma migrate dev` for schema changes (not `db push`)
- Run `prisma migrate status` before committing to verify migrations are in sync
- Production deployments must run `prisma migrate deploy` before the app starts

## Data Fetching

- Server components fetch directly with Prisma
- Client components use Server Actions
- Validate all inputs with Zod

## Error Handling

- Use try/catch in Server Actions
- Return `{ success, data, error }` pattern from actions
- Display user-friendly error messages via toast

## Testing

- Unit tests use **Vitest** (`vitest.config.ts`): `npm test` runs once, `npm run test:watch` watches
- Test server actions and utilities only, not components or pages
- Name test files `*.test.ts` and put them next to the code they test (e.g. `lib/tokens.test.ts`, `actions/profile.test.ts`); Vitest collects `**/*.test.ts` outside `node_modules` and `.next`
- Import `describe`, `it`, `expect` and `vi` from `vitest` explicitly (no globals)
- Never hit the database, email or Redis in unit tests: mock dependencies such as `@/auth`, `@/lib/db` and `next/headers` with `vi.mock`
- Cover the happy path and the error cases (no session, invalid input, failures); don't write tests just to write them
- Mocks and `vi.stubEnv` values are reset before each test by the config

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible
