---
description: Continue implementing a spec from a previous session
argument-hint: <spec-file-path>
---

You are continuing implementation of a specification that was started in a previous session. Work autonomously until the feature is complete.

## Your Task

1. **Read the spec** at `$ARGUMENTS`
2. **Read the Prettier and ESLint configs** for formatting conventions
3. **Assess current state**:
   - Check git status for uncommitted changes
   - Run lint to see what's passing/failing
   - Review any existing implementation
4. **Determine what remains** by comparing the spec to the current state
5. **Plan remaining work** using TodoWrite
6. **Continue implementing** until complete

## Assessing Current State

Run these commands to understand where the previous session left off:

```bash
git status                                    # See uncommitted changes
git log --oneline -10                         # See recent commits
npx tsc --noEmit                              # Check for type errors
npm run lint                                  # Check for linting issues
```

Review the code that's already been written to understand:

- What's already implemented
- What's partially done
- What's not started yet

## Implementation Guidelines

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
- Use `TeamError` or `DocumentError` classes when throwing domain errors
- Use Zod for validation; react-hook-form with `@hookform/resolvers` for complex forms
- Use SWR hooks from `lib/swr/` for client-side data fetching

### Architecture Notes

- **Pages Router** (`pages/`) handles the main authenticated dashboard and most API routes
- **App Router** (`app/`) handles auth flows, some newer API routes, and cron jobs
- **Enterprise features** live in `ee/` with separate licensing
- **API routes** are REST-based (no tRPC)
- **Prisma** is the ORM with schemas in `prisma/schema/`
- **Background jobs** use Trigger.dev v3 (`lib/trigger/`)

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

# Email templates
npm run email                                  # Preview email templates on port 3001
```

## Begin

Read the spec file and the Prettier/ESLint configs, assess the current implementation state, then continue where the previous session left off. Use TodoWrite to track your progress throughout.
