# Export Visits Background Task System

This document explains the new background task system for exporting visits data, which helps prevent rate limiting issues with the Tinybird API when processing large datasets (200+ views).

## Overview

The export visits functionality has been converted from a synchronous API call to an asynchronous background task system using Trigger.dev v3. This provides several benefits:

- **Rate Limiting**: Tinybird API calls are now rate-limited to 5 concurrent requests with 200ms minimum interval
- **Reliability**: Background tasks have retry logic and can handle failures gracefully
- **Scalability**: Can process large datasets without hitting API timeouts
- **User Experience**: Users get immediate feedback and are notified when exports are ready

## Components

### 1. Background Task (`lib/trigger/export-visits.ts`)
- **Task ID**: `export-visits`
- **Rate Limiting**: Uses Bottleneck to limit Tinybird API calls
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 15 minutes maximum duration
- **Machine**: Medium-1x preset for more resources

### 2. Redis Job Storage
Export jobs are stored in Redis for fast access and automatic cleanup:

```typescript
interface ExportJob {
  id: string;
  type: "document" | "dataroom" | "dataroom-group";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  resourceId: string;
  resourceName?: string;
  groupId?: string;
  result?: string; // CSV data
  error?: string;
  userId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
```

**Benefits of Redis storage:**
- **Fast access**: Redis is much faster than database queries
- **Automatic cleanup**: Jobs expire after 7 days (configurable)
- **No database migrations**: Uses existing Redis infrastructure
- **Sorted job lists**: Jobs are automatically sorted by creation time

### 3. API Endpoints

#### Create Export Job
- **Document**: `POST /api/teams/[teamId]/documents/[id]/export-visits`
- **Dataroom**: `POST /api/teams/[teamId]/datarooms/[id]/export-visits`
- **Dataroom Group**: `POST /api/teams/[teamId]/datarooms/[id]/groups/[groupId]/export-visits`

#### Job Management
- **List Jobs**: `GET /api/teams/[teamId]/export-jobs`
- **Job Status**: `GET /api/teams/[teamId]/export-jobs/[exportId]`
- **Download Result**: `GET /api/teams/[teamId]/export-jobs/[exportId]?download=true`
- **Delete Job**: `DELETE /api/teams/[teamId]/export-jobs/[exportId]`

### 4. Frontend Integration
The frontend components now:
- Trigger background jobs instead of direct API calls
- Poll for job completion every 3 seconds
- Automatically download results when ready
- Show appropriate loading/error states

## Setup Instructions

### 1. Environment Variables
Ensure your Trigger.dev environment variables are set:

```bash
TRIGGER_PROJECT_ID=your_project_id
TRIGGER_ACCESS_TOKEN=your_access_token
```

### 2. Start Trigger.dev Development Server
Run the Trigger.dev development server:

```bash
npm run trigger:v3:dev
```

### 3. Deploy to Production
When ready for production, deploy the Trigger.dev tasks:

```bash
npm run trigger:v3:deploy
```

## Rate Limiting Configuration

The background task uses Bottleneck to limit Tinybird API calls:

```typescript
const tinybirdLimiter = new Bottleneck({
  maxConcurrent: 5, // Maximum 5 concurrent requests
  minTime: 200, // Minimum 200ms between requests
});
```

You can adjust these values based on your Tinybird API limits and requirements.

## Monitoring

Export jobs can be monitored through:
- Redis commands to inspect job data (`HGETALL export_job:*`)
- API endpoints for job listing and status
- Trigger.dev dashboard (if using Trigger.dev Cloud)
- Application logs

## Error Handling

The system handles various error scenarios:
- Tinybird API rate limiting
- Network timeouts
- Data processing errors
- Job failures with retry logic

Failed jobs are marked with status `FAILED` and include error details.

## Usage Examples

### Document Export
```javascript
const response = await fetch(
  `/api/teams/${teamId}/documents/${documentId}/export-visits`,
  { method: "POST" }
);
const { exportId } = await response.json();
```

### Dataroom Export
```javascript
const response = await fetch(
  `/api/teams/${teamId}/datarooms/${dataroomId}/export-visits`,
  { method: "POST" }
);
const { exportId } = await response.json();
```

### Check Job Status
```javascript
const response = await fetch(
  `/api/teams/${teamId}/export-jobs/${exportId}`
);
const jobStatus = await response.json();
```

### Download Results
```javascript
const response = await fetch(
  `/api/teams/${teamId}/export-jobs/${exportId}?download=true`
);
const blob = await response.blob();
```

## Migration Notes

**No database migrations required!** This solution uses Redis for job storage.

The following endpoints have been changed from GET to POST:
- `/api/teams/[teamId]/documents/[id]/export-visits`
- `/api/teams/[teamId]/datarooms/[id]/export-visits`
- `/api/teams/[teamId]/datarooms/[id]/groups/[groupId]/export-visits`

The frontend components have been updated to use the new background task system with polling for job completion.

## Performance Improvements

With the new system, you should see:
- Reduced Tinybird API rate limiting errors
- Better handling of large datasets (200+ views)
- Improved user experience with background processing
- More reliable exports with retry logic

The system is designed to handle the rate limits gracefully while providing a responsive user experience.