import { nanoid } from "@/lib/utils";

import { redis } from "./redis";

export type ExportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ExportJob {
  id: string;
  type: "document" | "dataroom" | "dataroom-group";
  status: ExportJobStatus;
  resourceId: string;
  resourceName?: string;
  groupId?: string;
  result?: string; // CSV data or blob URL
  error?: string;
  userId: string;
  teamId: string;
  triggerRunId?: string; // Trigger.dev run ID for cancellation
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  emailNotification?: boolean;
  emailAddress?: string;
}

export interface ExportJobCleanupItem {
  blobUrl: string;
  jobId: string;
  scheduledAt: string;
}

const JOB_PREFIX = "export_job:";
const USER_JOBS_PREFIX = "user_jobs:";
const TEAM_JOBS_PREFIX = "team_jobs:";
const CLEANUP_QUEUE_PREFIX = "cleanup_blobs:";
const JOB_TTL = 60 * 60 * 24 * 3; // 3 days

export class RedisJobStore {
  private getJobKey(jobId: string): string {
    return `${JOB_PREFIX}${jobId}`;
  }

  private getUserJobsKey(userId: string): string {
    return `${USER_JOBS_PREFIX}${userId}`;
  }

  private getTeamJobsKey(teamId: string): string {
    return `${TEAM_JOBS_PREFIX}${teamId}`;
  }

  private getCleanupQueueKey(): string {
    return `${CLEANUP_QUEUE_PREFIX}pending`;
  }

  async createJob(
    jobData: Omit<ExportJob, "id" | "createdAt" | "updatedAt">,
  ): Promise<ExportJob> {
    const jobId = nanoid();
    const now = new Date().toISOString();

    const job: ExportJob = {
      ...jobData,
      id: jobId,
      createdAt: now,
      updatedAt: now,
    };

    const jobKey = this.getJobKey(jobId);
    const userJobsKey = this.getUserJobsKey(jobData.userId);
    const teamJobsKey = this.getTeamJobsKey(jobData.teamId);

    // Store job data with TTL
    await redis.setex(jobKey, JOB_TTL, JSON.stringify(job));

    // Add to user's job list (sorted by creation time)
    await redis.zadd(userJobsKey, { score: Date.now(), member: jobId });
    await redis.expire(userJobsKey, JOB_TTL);

    // Add to team's job list (sorted by creation time)
    await redis.zadd(teamJobsKey, { score: Date.now(), member: jobId });
    await redis.expire(teamJobsKey, JOB_TTL);

    return job;
  }

  async getJob(jobId: string): Promise<ExportJob | null> {
    const jobKey = this.getJobKey(jobId);
    const jobData = await redis.get(jobKey);

    if (!jobData) {
      return null;
    }

    try {
      // Check if data is already an object (Redis client auto-parsed)
      if (typeof jobData === "object") {
        return jobData as ExportJob;
      }
      // Otherwise parse the JSON string
      return JSON.parse(jobData as string);
    } catch (error) {
      console.error("Error parsing job data:", error);
      return null;
    }
  }

  async updateJob(
    jobId: string,
    updates: Partial<ExportJob>,
  ): Promise<ExportJob | null> {
    const job = await this.getJob(jobId);
    if (!job) {
      return null;
    }

    const updatedJob: ExportJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const jobKey = this.getJobKey(jobId);
    await redis.setex(jobKey, JOB_TTL, JSON.stringify(updatedJob));

    // If this update includes a blob URL, schedule it for cleanup
    if (updates.result?.startsWith("https://")) {
      await this.scheduleBlobForCleanup(updates.result, jobId);
    }

    return updatedJob;
  }

  async scheduleBlobForCleanup(blobUrl: string, jobId: string): Promise<void> {
    const cleanupTime = Date.now() + JOB_TTL * 1000; // Convert to milliseconds
    const cleanupQueueKey = this.getCleanupQueueKey();

    // Store blob URL with cleanup timestamp
    await redis.zadd(cleanupQueueKey, {
      score: cleanupTime,
      member: JSON.stringify({
        blobUrl,
        jobId,
        scheduledAt: new Date().toISOString(),
      }),
    });
  }

  async getBlobsForCleanup(
    beforeTimestamp?: number,
  ): Promise<Array<ExportJobCleanupItem>> {
    const cleanupQueueKey = this.getCleanupQueueKey();
    const maxScore = beforeTimestamp || Date.now();

    // Get all items scheduled for cleanup before the specified timestamp
    const items = await redis.zrange(cleanupQueueKey, 0, maxScore, {
      byScore: true,
    });

    const blobs: Array<ExportJobCleanupItem> = [];

    for (const item of items) {
      try {
        let parsed: ExportJobCleanupItem;
        // Check if data is already an object (Redis client auto-parsed)
        if (typeof item === "object" && item !== null) {
          parsed = item as ExportJobCleanupItem;
        } else {
          // Otherwise parse the JSON string
          parsed = JSON.parse(item as string);
        }
        blobs.push(parsed);
      } catch (error) {
        console.error("Error parsing cleanup item:", error);
      }
    }

    return blobs;
  }

  async removeBlobFromCleanupQueue(
    blobUrl: string,
    jobId: string,
  ): Promise<void> {
    const cleanupQueueKey = this.getCleanupQueueKey();
    const itemToRemove = JSON.stringify({
      blobUrl,
      jobId,
      scheduledAt: new Date().toISOString(),
    });

    // Remove the specific item from the cleanup queue
    await redis.zrem(cleanupQueueKey, itemToRemove);
  }

  async deleteJob(jobId: string): Promise<boolean> {
    const job = await this.getJob(jobId);
    if (!job) {
      return false;
    }

    const jobKey = this.getJobKey(jobId);
    const userJobsKey = this.getUserJobsKey(job.userId);
    const teamJobsKey = this.getTeamJobsKey(job.teamId);

    // Remove from all locations
    await Promise.all([
      redis.del(jobKey),
      redis.zrem(userJobsKey, jobId),
      redis.zrem(teamJobsKey, jobId),
    ]);

    return true;
  }

  async getUserJobs(userId: string, limit: number = 20): Promise<ExportJob[]> {
    const userJobsKey = this.getUserJobsKey(userId);

    // Get job IDs sorted by creation time (newest first)
    const jobIds = await redis.zrange(userJobsKey, 0, limit - 1, { rev: true });

    if (!jobIds.length) {
      return [];
    }

    // Get all job data
    const jobs = await Promise.all(
      (jobIds as string[]).map((jobId: string) => this.getJob(jobId)),
    );

    // Filter out null values (deleted jobs)
    return jobs.filter(
      (job: ExportJob | null): job is ExportJob => job !== null,
    );
  }

  async getTeamJobs(teamId: string, limit: number = 20): Promise<ExportJob[]> {
    const teamJobsKey = this.getTeamJobsKey(teamId);

    // Get job IDs sorted by creation time (newest first)
    const jobIds = await redis.zrange(teamJobsKey, 0, limit - 1, { rev: true });

    if (!jobIds.length) {
      return [];
    }

    // Get all job data
    const jobs = await Promise.all(
      (jobIds as string[]).map((jobId: string) => this.getJob(jobId)),
    );

    // Filter out null values (deleted jobs)
    return jobs.filter(
      (job: ExportJob | null): job is ExportJob => job !== null,
    );
  }

  async getResourceJobs(
    resourceId: string,
    teamId: string,
    type?: "document" | "dataroom" | "dataroom-group",
    groupId?: string,
    limit: number = 10,
  ): Promise<ExportJob[]> {
    const teamJobs = await this.getTeamJobs(teamId, limit * 2); // Get more to filter

    // Filter jobs by resource and type
    return teamJobs
      .filter((job) => {
        const matchesResource = job.resourceId === resourceId;
        const matchesType = !type || job.type === type;
        const matchesGroup = !groupId || job.groupId === groupId;
        const matchStatus = job.status !== "FAILED";
        return matchesResource && matchesType && matchesGroup && matchStatus;
      })
      .slice(0, limit);
  }

  async getUserTeamJobs(
    userId: string,
    teamId: string,
    limit: number = 20,
  ): Promise<ExportJob[]> {
    const userJobs = await this.getUserJobs(userId, limit * 2); // Get more to filter

    // Filter jobs by team
    return userJobs.filter((job) => job.teamId === teamId).slice(0, limit);
  }

  async cleanupExpiredJobs(): Promise<void> {
    // This would be called by a cron job or cleanup task
    // For now, we rely on Redis TTL for automatic cleanup
  }
}

export const jobStore = new RedisJobStore();
