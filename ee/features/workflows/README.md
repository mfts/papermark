# Workflow Routing System

Enterprise feature for routing visitors to different links based on email/domain matching.

## Structure

```
ee/features/workflows/
├── components/           # UI components
│   ├── index.ts         # Component exports
│   ├── workflow-list.tsx
│   ├── workflow-empty-state.tsx
│   ├── workflow-header.tsx
│   ├── step-list.tsx
│   ├── step-form-dialog.tsx
│   └── workflow-access-view.tsx
├── lib/                 # Core logic
│   ├── types.ts        # Zod schemas & TypeScript types
│   ├── validation.ts   # Validation helpers
│   └── engine.ts       # Workflow execution engine
└── index.ts            # Feature exports

pages/workflows/
├── index.tsx           # List all workflows
├── new.tsx             # Create new workflow
└── [id].tsx            # Workflow detail & step builder

app/(ee)/api/
├── workflows/
│   ├── route.ts                          # List & create workflows
│   ├── [workflowId]/
│   │   ├── route.ts                     # Get, update, delete workflow
│   │   ├── steps/
│   │   │   ├── route.ts                 # List, create, reorder steps
│   │   │   └── [stepId]/route.ts        # Update, delete step
│   │   └── executions/route.ts          # List execution history
└── workflow-entry/
    ├── [entryLinkId]/
    │   ├── verify/route.ts              # Send OTP (by linkId)
    │   └── access/route.ts              # Verify OTP & execute (by linkId)
    └── domains/[...domainSlug]/
        ├── verify/route.ts              # Send OTP (by domain/slug)
        └── access/route.ts              # Verify OTP & execute (by domain/slug)
```

## Features

- **Single Entry Point**: One URL routes to multiple datarooms/documents
- **Email-Based Routing**: Match exact emails or email domains
- **Priority-Based**: Steps execute in order, first match wins
- **Custom Domains**: Support for branded entry links
- **Security**: OTP verification, Redis sessions, rate limiting
- **Audit Trail**: Complete execution logging

## Usage

### Admin Flow
1. Navigate to `/workflows`
2. Create workflow with entry link (domain + slug)
3. Add routing steps with email/domain conditions
4. Activate workflow

### Visitor Flow
1. Access entry link (e.g., `docs.example.com/dashboard`)
2. Enter email address
3. Receive & enter OTP code
4. Automatically routed to matching dataroom/document link

## Plan Requirements

- Business or Data Rooms plan required
- Feature flag: `workflows` must be enabled

