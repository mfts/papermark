# Dub AI Support System — Complete Architecture & Implementation

> Source: [github.com/dubinc/dub](https://github.com/dubinc/dub)

## Stack Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Docs & Help Articles | **Mintlify** | Single source of truth for all support content (`dub.co/docs`, `dub.co/help`) |
| Vector Search | **Upstash Vector** | Semantic search over chunked docs/help articles |
| LLM & Retrieval | **AI SDK** (`ai` + `@ai-sdk/react` + `@ai-sdk/anthropic`) + **Claude Sonnet** | Streaming chat with tool-calling capabilities |
| Support Infra | **Plain** (`@team-plain/typescript-sdk`) | Ticket creation, customer management, file attachments |
| Scheduling | **QStash** (Upstash) | Delayed embedding sync jobs |

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│  Mintlify Docs (dub.co/docs|help)   │
│  ─── on push to main ───►          │
│  GitHub Action calls /api/ai/       │
│  sync-embeddings with changed URLs  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Upstash Vector DB                   │
│  (chunked by H2/H3 headings,        │
│   metadata: url, title, type,        │
│   pageviews, content)                │
└──────────────┬───────────────────────┘
               │ query (topK=4)
               │
┌──────────────┴───────────────────────┐
│  API Route: /api/ai/support-chat     │
│  ┌─────────────────────────────────┐ │
│  │ streamText() with Claude Sonnet │ │
│  │                                 │ │
│  │ Tools:                          │ │
│  │  • findRelevantDocs             │ │
│  │  • getWorkspaceDetails          │ │
│  │  • getProgramPerformance        │ │
│  │  • requestSupportTicket         │ │
│  │  • createSupportTicket ──► Plain│ │
│  └─────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│  Frontend (embeddable)               │
│  • ChatInterface (useChat)           │
│  • SupportChatBubble (floating)      │
│  • EmbeddedSupportChat (inline)      │
│  • TicketUpload (file upload → Plain)│
│  • SourceCitations (doc links)       │
│                                      │
│  Embed URL:                          │
│  app.dub.co/embed/support-chat       │
│    ?variant=embedded | bubble        │
└──────────────────────────────────────┘
```

---

## 1. Vector Embedding Pipeline (Mintlify → Upstash)

### Upstash Vector Client
**File:** `apps/web/lib/upstash/vector.ts`

```typescript
import { Index } from "@upstash/vector";

export const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});
```

### Sync Endpoint (triggered by GitHub Action on push to main)
**File:** `apps/web/app/api/ai/sync-embeddings/route.ts`

This endpoint receives a `{ url, delay? }` payload authenticated via `EMBEDDING_SYNC_SECRET`. If `delay` is provided, it schedules via QStash; otherwise it processes immediately. The GitHub Action on the docs repo calls this for each changed `.mdx` file.

```typescript
export const POST = async (req: Request) => {
  // Auth: Bearer <EMBEDDING_SYNC_SECRET>
  // Body: { url: "https://dub.co/docs/...", delay?: number }
  
  if (delay !== undefined) {
    // Schedule delayed processing via QStash
    await qstash.publishJSON({
      url: `${APP_DOMAIN}/api/ai/sync-embeddings`,
      delay,
      body: { url: normalizedUrl },
    });
  }

  const result = await upsertDocsEmbeddings(normalizedUrl);
  return Response.json({ success: true, url: normalizedUrl, ...result });
};
```

### Embedding Upsert Logic
**File:** `apps/web/lib/ai/upsert-docs-embedding.ts`

Key steps:
1. **Fetch** the raw MDX from Mintlify's `.md` endpoint (e.g., `dub.co/docs/some-page.md`)
2. **Clean** the MDX — strip frontmatter, imports, images, JSX components (CardGroup, Tabs, etc.)
3. **Chunk** by H2/H3 heading boundaries — each chunk carries section URL + heading as metadata
4. **Upsert** each chunk into Upstash Vector with `data` (the text for embedding) and `metadata` (url, heading, title, type, pageviews, content preview)

```typescript
// Chunk structure
type ArticleChunk = {
  id: string;        // e.g. "https://dub.co/docs/quickstart#create-a-link"
  content: string;   // cleaned markdown section
  url: string;       // section URL with anchor
  heading: string;   // section heading
  title: string;     // article title
  type: "docs" | "help";
};

// Upsert to Upstash Vector
await vectorIndex.upsert([{
  id: chunk.id,
  data: chunk.content,  // <-- Upstash auto-embeds this
  metadata: {
    url: chunk.url,
    heading: chunk.heading,
    title: chunk.title,
    type: chunk.type,
    pageviews,
    content: chunk.content.slice(0, 4000),  // 48KB metadata limit
  },
}]);
```

### Seed Script (bulk initial load)
**File:** `apps/web/scripts/seed-support-embeddings.ts`

Fetches all article URLs from `dub.co/docs/llms.txt`, then processes each through `upsertDocsEmbeddings()` with a 200ms delay between articles.

---

## 2. AI Chat Backend (AI SDK + Claude Sonnet)

### Main Chat Route
**File:** `apps/web/app/api/ai/support-chat/route.ts`

```typescript
import { anthropic } from "@ai-sdk/anthropic";
import { streamText, UIMessage } from "ai";

export const POST = withSession(async ({ req, session }) => {
  const { messages, globalContext } = body as {
    messages: UIMessage[];
    globalContext?: GlobalChatContext;
  };

  // Rate limit: 5 requests per 30 seconds per user
  const { success } = await ratelimit(5, "30 s").limit(
    `support-chat:${session.user.id}`,
  );

  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514"),
    system: buildSystemPrompt(globalContext),
    messages: await convertToModelMessages(messages),
    stopWhen: stepCountIs(5),  // Max 5 agentic steps
    tools: {
      findRelevantDocs: findRelevantDocsTool,
      getProgramPerformance: getProgramPerformanceTool,
      getWorkspaceDetails: getWorkspaceDetailsTool,
      requestSupportTicket: requestSupportTicketTool,
      createSupportTicket: createSupportTicketTool({ session, messages, globalContext, attachmentIds, ticketDetails }),
    },
  });

  return result.toUIMessageStreamResponse();
});
```

### System Prompt Builder
**File:** `apps/web/lib/ai/build-system-prompt.ts`

Context-aware prompts based on whether user is in workspace view or partner view:

```typescript
export type GlobalChatContext = {
  chatLocation?: "app" | "partners";
  accountType?: "workspace" | "partner";
  selectedWorkspace?: Pick<Project, "id" | "name" | "slug">;
  selectedProgram?: Pick<Program, "id" | "name" | "slug">;
};
```

Key system prompt rules:
- **ALWAYS** call `findRelevantDocs` before answering — never from memory
- Ground every answer in retrieved content
- Include links to relevant articles
- Never make up information
- To escalate: call `requestSupportTicket` first (never `createSupportTicket` directly)

---

## 3. AI SDK Tools (the `tool()` implementations)

### a) `findRelevantDocs` — Vector Search
**File:** `apps/web/lib/ai/find-relevant-docs.ts`

Queries Upstash Vector with the user's question, returns top 4 matching doc chunks with metadata.

```typescript
export const findRelevantDocsTool = tool({
  description: "Finds the most relevant docs / help article for a given query.",
  inputSchema: z.object({
    query: z.string(),
    accountType: z.enum(["workspace", "partner"]),
  }),
  execute: async ({ query }) => {
    const result = await vectorIndex.query({
      data: query,
      topK: 4,
      includeMetadata: true,
    });
    return result.map(({ id, score, metadata }) => ({ id, score, metadata }));
  },
});
```

### b) `getWorkspaceDetails` — User's Workspace Data
**File:** `apps/web/lib/ai/get-workspace-details.ts`

Retrieves the user's workspace plan, usage, billing info from Prisma. Validates the user owns the workspace via session.

```typescript
export const getWorkspaceDetailsTool = tool({
  description: "Retrives the details of a given user's workspace (plan, usage, etc.).",
  inputSchema: z.object({ workspaceId: z.string() }),
  outputSchema: workspaceDetailsSchema,  // name, slug, plan, usage, usageLimit, linksUsage, linksLimit, etc.
  execute: async ({ workspaceId }) => {
    const session = await getSession();
    const workspace = await prisma.project.findUnique({
      where: { id: workspaceId, users: { some: { userId: session.user.id } } },
    });
    return workspaceDetailsSchema.parse(workspace);
  },
});
```

### c) `getProgramPerformance` — Partner's Program Data
**File:** `apps/web/lib/ai/get-program-performance.ts`

Retrieves commissions (grouped by status), payouts (latest 100), holding period, min payout amount, and program support email.

```typescript
export const getProgramPerformanceTool = tool({
  description: "Retrives the partner's performance for a given program.",
  inputSchema: z.object({ programId: z.string() }),
  outputSchema: programPerformanceSchema,
  execute: async ({ programId }) => {
    // Fetches programEnrollment + commissions + payouts from Prisma
    // Returns structured data including stripe payout trace IDs
  },
});
```

### d) `requestSupportTicket` — Show Upload Form
**File:** `apps/web/lib/ai/request-support-ticket.ts`

A "UI tool" — returns `{ status: "ready" }` which triggers the `TicketUpload` component to render in the chat. Must be called BEFORE `createSupportTicket`.

```typescript
export const requestSupportTicketTool = tool({
  description: "Shows a file upload form inside the chat so the user can optionally attach screenshots...",
  inputSchema: z.object({}),
  execute: async () => ({ status: "ready" as const }),
});
```

### e) `createSupportTicket` — Create Plain Thread
**File:** `apps/web/lib/ai/create-support-ticket.ts`

Creates the actual Plain support thread with:
- Chat history (last 5000 chars)
- User-provided description/details
- File attachment IDs
- Priority based on plan (enterprise=0, advanced=0, business=1, pro=2, free=3) or partner lifetime payouts
- Workspace/program metadata as thread components

```typescript
export function createSupportTicketTool(options: CreateSupportTicketOptions) {
  return tool({
    description: "Creates a support ticket in Plain when the AI cannot resolve the user's issue.",
    inputSchema: z.object({}),
    execute: async () => {
      // Build chat history text
      // Determine priority from workspace plan or partner lifetime payouts
      // Create Plain thread with components (chat history, metadata)
      await createPlainThread({ user, priority, components, attachmentIds });
      return { success: true, message: "Support ticket created successfully." };
    },
  });
}
```

---

## 4. Plain Integration (Support Infrastructure)

### Plain Client
**File:** `apps/web/lib/plain/client.ts`

```typescript
import { PlainClient } from "@team-plain/typescript-sdk";
export const plain = new PlainClient({ apiKey: process.env.PLAIN_API_KEY });
```

### Customer Upsert
**File:** `apps/web/lib/plain/upsert-plain-customer.ts`

Creates or updates a Plain customer using the user's email as identifier.

### Thread Creation
**File:** `apps/web/lib/plain/create-plain-thread.ts`

Upserts the customer first, then creates a Plain thread with structured components.

### File Upload Flow
**File:** `apps/web/app/api/ai/support-chat/upload/route.ts`

1. Client requests upload URL from `/api/ai/support-chat/upload` with `{ fileName, fileSizeBytes }`
2. Server upserts Plain customer, calls `plain.createAttachmentUploadUrl()`
3. Returns `{ attachmentId, uploadFormUrl, uploadFormData }` to client
4. Client POSTs file directly to Plain's storage (no file data through Dub's server)
5. Attachment IDs are passed to `createSupportTicket` tool when creating the thread

---

## 5. Frontend Components

### Chat Interface (Core)
**File:** `apps/web/ui/support/chat-interface.tsx`

The main `ChatInterface` component using `useChat` from `@ai-sdk/react`:

- **Account type selection** — Workspace vs Partner (combobox)
- **Workspace/Program picker** — fetches user's workspaces or program enrollments
- **Starter questions** — contextual quick-start buttons
- **Streaming messages** — uses `Streamdown` for animated markdown rendering
- **Tool state rendering** — shows "Searching docs...", "Creating your ticket..." status indicators
- **Source citations** — extracts URLs from `findRelevantDocs` tool output, shows collapsible source list
- **Ticket escalation** — "Convert to support ticket →" link after 2+ messages
- **Session persistence** — saves messages + selection to `localStorage` per user

Key flow:
```
User selects account type → picks workspace/program → sends message
    → AI calls findRelevantDocs (shows "Searching docs...")
    → AI responds with grounded answer + source citations
    → User can escalate → requestSupportTicket shows TicketUpload form
    → User attaches files + details → createSupportTicket → Plain thread
```

### Ticket Upload Component
**File:** `apps/web/ui/support/ticket-upload.tsx`

Rich file upload UI with:
- Drag & drop or file picker
- Image preview thumbnails
- Upload status indicators (uploading spinner, error states)
- Max 5 files, 10MB each
- Accepted: PNG, JPEG, GIF, WebP, PDF, TXT, CSV
- Files upload directly to Plain's storage

### Embeddable Chat Variants
**File:** `apps/web/app/app.dub.co/embed/support-chat/page.tsx`

Two embed variants via `?variant=` query param:

1. **`variant=embedded`** → `EmbeddedSupportChat` — inline card with header bar, used in Mintlify docs support portal
2. **Default (bubble)** → `SupportChatBubble` — floating bottom-right bubble with slide-up panel (560px wide, 660px tall)

Both are served from `app.dub.co/embed/support-chat` and can be embedded via iframe.

### Dynamic Height Messenger (for iframe embedding)
**File:** `apps/web/app/app.dub.co/embed/support-chat/dynamic-height-messenger.tsx`

Uses `ResizeObserver` to send `PAGE_HEIGHT` messages to the parent window, enabling the Mintlify docs iframe to auto-resize.

### Source Citations
**File:** `apps/web/ui/support/source-citations.tsx`

Extracts sources from `findRelevantDocs` tool output parts, deduplicates by base URL, shows collapsible list with "Docs" or "Help" badges.

### Starter Questions
**File:** `apps/web/ui/support/starter-questions.tsx`

Context-aware quick questions:
- **Workspace**: custom domains, conversion tracking, API usage, billing, etc.
- **Partners**: bank account setup, payout countries, commission calculation, etc.

---

## 6. File Structure Summary

```
apps/web/
├── app/
│   ├── api/ai/
│   │   ├── support-chat/
│   │   │   ├── route.ts              # Main chat endpoint (streamText + tools)
│   │   │   └── upload/
│   │   │       └── route.ts          # Plain file upload URL generator
│   │   └── sync-embeddings/
│   │       └── route.ts              # Embedding sync endpoint (called by GH Action)
│   └── app.dub.co/embed/
│       └── support-chat/
│           ├── page.tsx              # Embeddable page (bubble or embedded variant)
│           └── dynamic-height-messenger.tsx  # iframe height sync
├── lib/
│   ├── ai/
│   │   ├── build-system-prompt.ts    # Context-aware system prompt builder
│   │   ├── find-relevant-docs.ts     # tool() — Upstash Vector search
│   │   ├── get-workspace-details.ts  # tool() — workspace plan/usage from DB
│   │   ├── get-program-performance.ts # tool() — partner commissions/payouts from DB
│   │   ├── request-support-ticket.ts # tool() — triggers upload form UI
│   │   ├── create-support-ticket.ts  # tool() — creates Plain thread
│   │   └── upsert-docs-embedding.ts  # MDX clean, chunk, upsert to Upstash Vector
│   ├── plain/
│   │   ├── client.ts                 # PlainClient initialization
│   │   ├── create-plain-thread.ts    # Thread creation with customer upsert
│   │   └── upsert-plain-customer.ts  # Customer upsert by email
│   └── upstash/
│       └── vector.ts                 # Upstash Vector Index client
├── ui/support/
│   ├── chat-interface.tsx            # Main chat UI (useChat, messages, tools)
│   ├── chat-bubble.tsx               # Floating bubble variant
│   ├── embedded-chat.tsx             # Inline embedded variant
│   ├── ticket-upload.tsx             # File upload + ticket form
│   ├── source-citations.tsx          # Doc source links
│   ├── starter-questions.tsx         # Quick-start question buttons
│   ├── message.tsx                   # Message bubble component
│   ├── workspace-combobox.tsx        # Workspace picker
│   ├── program-combobox.tsx          # Program picker
│   ├── code-block.tsx                # Markdown code block renderer
│   ├── status-indicator.tsx          # Loading/thinking indicator
│   ├── clear-chat-button.tsx         # Clear session button
│   └── types.ts                      # SupportChatVariant, SupportChatContext types
└── scripts/
    └── seed-support-embeddings.ts    # Bulk seed all articles from llms.txt
```

---

## 7. Key Implementation Patterns

### RAG (Retrieval-Augmented Generation)
The system uses a strict RAG pattern: the system prompt mandates that the AI **always** calls `findRelevantDocs` before answering any question. This ensures responses are grounded in actual documentation rather than the model's training data.

### Agentic Tool Use
The `streamText` call uses `stopWhen: stepCountIs(5)` — the AI can call up to 5 tools in sequence within a single response, enabling multi-step reasoning (e.g., search docs → get workspace details → formulate answer).

### Two-Phase Ticket Escalation
Ticket creation is deliberately split into two tools:
1. `requestSupportTicket` — renders the upload form (no side effects)
2. `createSupportTicket` — actually creates the Plain thread (only after user confirms)

This prevents accidental ticket creation and gives users a chance to attach screenshots.

### Priority-Based Routing
Tickets are prioritized based on the user's plan:
- Enterprise/Advanced → Priority 0 (highest)
- Business → Priority 1
- Pro → Priority 2
- Free → Priority 3
- Partners: based on lifetime payouts ($10k+ → P0, $1k+ → P1, $100+ → P2)

### Embeddable Architecture
The chat is served as a standalone page at `/embed/support-chat` with two variants, making it embeddable via iframe in both the Mintlify docs portal and the main Dub app. The `SupportChatDynamicHeightMessenger` handles iframe height synchronization, and `window.parent.postMessage` communicates chat open/close state to the parent frame.
