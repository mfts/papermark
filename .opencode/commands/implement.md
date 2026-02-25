---
description: Implement a spec from the plans directory
argument-hint: <spec-file-path>
---

You are implementing a specification from the `.agents/plans/` directory. Work autonomously until the feature is complete.

## Your Task

1. **Read the spec** at `$ARGUMENTS`
2. **Read the Prettier and ESLint configs** for formatting conventions
3. **Plan the implementation** using the TodoWrite tool to break down the work
4. **Implement the feature** following the spec and code style
5. **Run typecheck and lint** and fix any issues

## Implementation Guidelines

### Before Coding

- Understand the spec's goals and scope
- Identify the desired API from usage examples in the spec
- Review related existing code to understand patterns
- Break the work into discrete tasks using TodoWrite

### During Implementation

- Follow Prettier config strictly (2-space indent, double quotes, semicolons, trailing commas)
- Follow ESLint rules (extends `next/core-web-vitals`)
- Use the `@/*` path alias for imports (maps to project root)
- Follow import order: next/* → react/* → third-party → @/lib/* → @/components/* → relative → @/styles/*
- Mark todos complete as you finish each task
- Commit logical chunks of work

### Code Quality

- No stubbed implementations
- Handle edge cases and error conditions
- Include descriptive error messages with context
- Use async/await for all I/O operations
- Use `TeamError` or `DocumentError` classes when throwing domain errors (from `lib/errorHandler.ts`)
- Use Zod for validation; react-hook-form with `@hookform/resolvers` for complex forms
- Use SWR hooks from `lib/swr/` for client-side data fetching
- Use `fetcher` from `lib/utils.ts` for data fetching utilities

### Architecture Notes

- **Pages Router** (`pages/`) handles the main authenticated dashboard and most API routes
- **App Router** (`app/`) handles auth flows, some newer API routes, and cron jobs
- **Enterprise features** live in `ee/` with separate licensing
- **API routes** are REST-based (no tRPC) — typically in `pages/api/teams/[teamId]/`
- **Prisma** is the ORM with schemas in `prisma/schema/`
- **Background jobs** use Trigger.dev v3 (`lib/trigger/`)
- **UI components** use shadcn/ui (Radix + Tailwind) in `components/ui/`
- **Authentication** via next-auth v4 (`getServerSession` on server, `useSession` on client)

## Autonomous Workflow

Work continuously through these steps:

1. **Implement** - Write the code for the current task
2. **Typecheck** - Run `npx tsc --noEmit` to verify types
3. **Lint** - Run `npm run lint` to check linting issues
4. **Format** - Run `npm run format` to fix formatting
5. **Fix** - If errors are found, fix and re-run
6. **Repeat** - Move to next task

## Stopping Conditions

**Stop and report success when:**

- All spec requirements are implemented
- Typecheck passes
- Lint passes

**Stop and ask for help when:**

- The spec is ambiguous and you need clarification
- You encounter a blocking issue you cannot resolve
- You need to make a decision that significantly deviates from the spec
- External dependencies are missing

## Commands

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Formatting
npm run format

# Development
npm run dev                                    # Start dev server

# Database
npm run dev:prisma                             # Regenerate Prisma client and apply migrations
```

## Begin

Read the spec file and the Prettier/ESLint configs, then start implementing. Use TodoWrite to track your progress throughout.
