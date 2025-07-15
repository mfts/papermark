import { nanoid } from "nanoid";
import { redis } from "./redis";

export type ExportJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ExportJob {
  id: string;
  type: "document" | "dataroom" | "dataroom-group";
  status: ExportJobStatus;
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

const JOB_PREFIX = "export_job:";
const USER_JOBS_PREFIX = "user_jobs:";
const TEAM_JOBS_PREFIX = "team_jobs:";
const JOB_TTL = 60 * 60 * 24 * 7; // 7 days

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

  async createJob(jobData: Omit<ExportJob, "id" | "createdAt" | "updatedAt">): Promise<ExportJob> {
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
    await redis.zadd(userJobsKey, Date.now(), jobId);
    await redis.expire(userJobsKey, JOB_TTL);
    
    // Add to team's job list (sorted by creation time)
    await redis.zadd(teamJobsKey, Date.now(), jobId);
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
      return JSON.parse(jobData);
    } catch (error) {
      console.error("Error parsing job data:", error);
      return null;
    }
  }

  async updateJob(jobId: string, updates: Partial<ExportJob>): Promise<ExportJob | null> {
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

    return updatedJob;
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
    const jobIds = await redis.zrevrange(userJobsKey, 0, limit - 1);
    
    if (!jobIds.length) {
      return [];
    }

    // Get all job data
    const jobs = await Promise.all(
      jobIds.map(jobId => this.getJob(jobId))
    );

    // Filter out null values (deleted jobs)
    return jobs.filter((job): job is ExportJob => job !== null);
  }

  async getTeamJobs(teamId: string, limit: number = 20): Promise<ExportJob[]> {
    const teamJobsKey = this.getTeamJobsKey(teamId);
    
    // Get job IDs sorted by creation time (newest first)
    const jobIds = await redis.zrevrange(teamJobsKey, 0, limit - 1);
    
    if (!jobIds.length) {
      return [];
    }

    // Get all job data
    const jobs = await Promise.all(
      jobIds.map(jobId => this.getJob(jobId))
    );

    // Filter out null values (deleted jobs)
    return jobs.filter((job): job is ExportJob => job !== null);
  }

  async getUserTeamJobs(userId: string, teamId: string, limit: number = 20): Promise<ExportJob[]> {
    const userJobs = await this.getUserJobs(userId, limit * 2); // Get more to filter
    
    // Filter jobs by team
    return userJobs
      .filter(job => job.teamId === teamId)
      .slice(0, limit);
  }

  async cleanupExpiredJobs(): Promise<void> {
    // This would be called by a cron job or cleanup task
    // For now, we rely on Redis TTL for automatic cleanup
  }
}

export const jobStore = new RedisJobStore();