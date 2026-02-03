import { nanoid } from "@/lib/utils";

import { redis } from "./redis";

export type DownloadJobStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED";

export interface DownloadJob {
  id: string;
  type: "bulk" | "folder";
  status: DownloadJobStatus;
  dataroomId: string;
  dataroomName: string;
  totalFiles: number;
  processedFiles: number;
  progress: number; // 0-100
  downloadUrls?: string[]; // Multiple ZIPs if large (S3 presigned URLs auto-expire)
  error?: string;
  teamId: string;
  userId: string;
  triggerRunId?: string; // Trigger.dev run ID for cancellation
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string; // When download links expire
  emailNotification?: boolean;
  emailAddress?: string;
}

const JOB_PREFIX = "download_job:";
const TEAM_JOBS_PREFIX = "team_download_jobs:";
const JOB_TTL = 60 * 60 * 24 * 3; // 3 days - Redis handles cleanup via TTL

export class RedisDownloadJobStore {
  private getJobKey(jobId: string): string {
    return `${JOB_PREFIX}${jobId}`;
  }

  private getTeamJobsKey(teamId: string): string {
    return `${TEAM_JOBS_PREFIX}${teamId}`;
  }

  async createJob(
    jobData: Omit<DownloadJob, "id" | "createdAt" | "updatedAt">,
  ): Promise<DownloadJob> {
    const jobId = nanoid();
    const now = new Date().toISOString();

    const job: DownloadJob = {
      ...jobData,
      id: jobId,
      createdAt: now,
      updatedAt: now,
    };

    const jobKey = this.getJobKey(jobId);
    const teamJobsKey = this.getTeamJobsKey(jobData.teamId);

    // Store job data with TTL (Redis handles cleanup)
    await redis.setex(jobKey, JOB_TTL, JSON.stringify(job));

    // Add to team's job list (sorted by creation time)
    await redis.zadd(teamJobsKey, { score: Date.now(), member: jobId });
    await redis.expire(teamJobsKey, JOB_TTL);

    return job;
  }

  async getJob(jobId: string): Promise<DownloadJob | null> {
    const jobKey = this.getJobKey(jobId);
    const jobData = await redis.get(jobKey);

    if (!jobData) {
      return null;
    }

    try {
      // Check if data is already an object (Redis client auto-parsed)
      if (typeof jobData === "object") {
        return jobData as DownloadJob;
      }
      // Otherwise parse the JSON string
      return JSON.parse(jobData as string);
    } catch (error) {
      console.error("Error parsing download job data:", error);
      return null;
    }
  }

  async updateJob(
    jobId: string,
    updates: Partial<DownloadJob>,
  ): Promise<DownloadJob | null> {
    const job = await this.getJob(jobId);
    if (!job) {
      return null;
    }

    const updatedJob: DownloadJob = {
      ...job,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const jobKey = this.getJobKey(jobId);
    await redis.setex(jobKey, JOB_TTL, JSON.stringify(updatedJob));

    return updatedJob;
  }

  private async getTeamJobs(
    teamId: string,
    limit: number = 20,
  ): Promise<DownloadJob[]> {
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

    // Filter out null values (expired jobs)
    return jobs.filter(
      (job: DownloadJob | null): job is DownloadJob => job !== null,
    );
  }

  async getDataroomJobs(
    dataroomId: string,
    teamId: string,
    limit: number = 10,
  ): Promise<DownloadJob[]> {
    const teamJobs = await this.getTeamJobs(teamId, limit * 2); // Get more to filter

    // Filter jobs by dataroom
    return teamJobs
      .filter((job) => {
        const matchesDataroom = job.dataroomId === dataroomId;
        const matchStatus = job.status !== "FAILED";
        return matchesDataroom && matchStatus;
      })
      .slice(0, limit);
  }
}

export const downloadJobStore = new RedisDownloadJobStore();
