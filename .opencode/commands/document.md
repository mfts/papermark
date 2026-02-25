---
description: Generate documentation for a module or feature
argument-hint: <module-path-or-feature>
---

You are creating documentation for a module or feature in Papermark.

## Your Task

1. **Identify the scope** - What does `$ARGUMENTS` refer to? (file, directory, or feature name)
2. **Read the source code** - Understand the public API, types, and behavior
3. **Read existing docs** - Check if there's documentation to update or reference
4. **Write comprehensive documentation** - Create or update docs in the appropriate location

## Documentation Structure

Papermark does not have a dedicated docs app. Documentation is kept as Markdown files alongside the code or in relevant directories:

- **Root-level docs**: `README.md`, `SECURITY.md`, `CLA.md`
- **Feature-specific docs**: In the relevant directory (e.g., `prisma/README.md`, `lib/tinybird/README.md`, `ee/README.md`)
- **Agent docs**: `.agents/` for AI agent reference material

### File Format

All documentation files should be `.md` files:

```markdown
# Feature Name

Brief description of what this does and when to use it.

## Overview

More detailed explanation...
```

### Documentation Format

````markdown
# <Module|Feature Name>

Brief description of what this module/feature does and when to use it.

## Overview

High-level explanation of the feature's purpose and architecture.

## Usage

```typescript
// Minimal working example
import { something } from "@/lib/module";

const result = await something();
```

## API Reference

### Function/Component Name

Description of what it does.

#### Parameters

| Param    | Type                 | Description               |
| -------- | -------------------- | ------------------------- |
| param    | `string`             | Description of the param  |
| optional | `boolean` (optional) | Optional param description|

#### Example

```typescript
import { something } from "@/lib/module";

const result = await something("value");
```

### Types

#### `TypeName`

```typescript
type TypeName = {
  property: string;
  optional?: boolean;
};
```

## Architecture

Explain how this feature fits into the broader codebase:
- Which API routes serve it (`pages/api/` or `app/api/`)
- Which Prisma models it uses (`prisma/schema/`)
- Which SWR hooks fetch data (`lib/swr/`)
- Which components render it (`components/`)

## Related

- [Link to related file](../path/to/file)
- [Another related file](../path/to/other)
````

## Guidelines

### Content Quality

- **Be accurate** - Verify behavior by reading the code
- **Be complete** - Document all public API surface
- **Be practical** - Include real, working examples
- **Be concise** - Don't over-explain obvious things
- **Be user-focused** - Write for developers working on the Papermark codebase

### Code Examples

- Use appropriate language tags: `typescript`, `tsx`, `bash`, `json`
- Use the `@/*` path alias in imports (e.g., `@/lib/prisma`, `@/components/ui/button`)
- Show imports when not obvious
- Include expected output in comments where helpful
- Progress from simple to complex
- Use real examples from the codebase when possible

### Formatting

- Use proper markdown headers (h1 for title, h2 for sections)
- Use tables for parameters/props documentation
- Use code fences with appropriate language tags
- Use relative links for internal references

### Maintenance

- Include types inline so docs don't get stale
- Reference source file locations for complex behavior
- Keep examples up-to-date with the codebase

## Process

1. **Explore the code** - Read source files to understand the API
2. **Check existing docs** - Look for similar files to match style
3. **Draft the structure** - Outline sections before writing
4. **Write content** - Fill in each section
5. **Add examples** - Create working code samples
6. **Review** - Read through for clarity and accuracy

## Begin

Analyze `$ARGUMENTS`, read the relevant source code, check existing documentation patterns, and create comprehensive documentation following the Papermark documentation style.
