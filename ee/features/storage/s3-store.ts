import {
  type StorageConfig,
  getStorageConfig,
} from "@/ee/features/storage/config";
import { S3 } from "@aws-sdk/client-s3";
import { S3Store } from "@tus/s3-store";
import type { Upload } from "@tus/server";
import type { Readable } from "stream";

import { getFeatureFlags } from "@/lib/featureFlags";

/**
 * Team-aware S3Store that routes uploads to different S3 buckets
 * based on team storage preferences. Extends S3Store and dynamically
 * switches the S3 client and bucket based on team feature flags.
 */
export class MultiRegionS3Store extends S3Store {
  private euConfig: StorageConfig;
  private usConfig: StorageConfig;
  private euClient: S3;
  private usClient: S3;
  private teamStorageCache = new Map<string, boolean>(); // teamId -> useUSStorage

  constructor() {
    // Initialize with EU config as default
    const euConfig = getStorageConfig();

    // Create S3 client config for super() call (omit endpoint if empty/undefined)
    const superS3Config: any = {
      bucket: euConfig.bucket,
      region: euConfig.region,
      credentials: {
        accessKeyId: euConfig.accessKeyId,
        secretAccessKey: euConfig.secretAccessKey,
      },
    };

    super({
      partSize: 8 * 1024 * 1024, // 8MiB parts
      s3ClientConfig: superS3Config,
    });

    // Store configurations
    this.euConfig = euConfig;

    // Create EU S3 client configuration (omit endpoint if empty/undefined)
    const euS3Config: any = {
      bucket: euConfig.bucket,
      region: euConfig.region,
      credentials: {
        accessKeyId: euConfig.accessKeyId,
        secretAccessKey: euConfig.secretAccessKey,
      },
    };

    this.euClient = new S3(euS3Config);

    // Initialize US configuration and client
    try {
      this.usConfig = getStorageConfig("us-east-2");

      // Create US S3 client configuration (omit endpoint if empty/undefined)
      const usS3Config: any = {
        bucket: this.usConfig.bucket,
        region: this.usConfig.region,
        credentials: {
          accessKeyId: this.usConfig.accessKeyId,
          secretAccessKey: this.usConfig.secretAccessKey,
        },
      };

      this.usClient = new S3(usS3Config);
    } catch (error) {
      this.usConfig = euConfig;
      this.usClient = this.euClient;
    }
  }

  /**
   * Extracts teamId from upload ID (format: teamId/docId/filename)
   */
  private extractTeamIdFromUploadId(uploadId: string): string | null {
    const parts = uploadId.split("/");
    return parts.length > 0 ? parts[0] : null;
  }

  /**
   * Determines if team should use US storage, with caching
   */
  private async shouldUseUSStorage(teamId: string): Promise<boolean> {
    // Check cache first
    if (this.teamStorageCache.has(teamId)) {
      const cached = this.teamStorageCache.get(teamId)!;

      return cached;
    }

    try {
      const features = await getFeatureFlags({ teamId });
      const useUS = features.usStorage || false;

      // Cache the result for 5 minutes
      this.teamStorageCache.set(teamId, useUS);
      setTimeout(() => this.teamStorageCache.delete(teamId), 5 * 60 * 1000);

      return useUS;
    } catch (error) {
      return false; // Default to EU
    }
  }

  /**
   * Sets the S3 client and bucket for the appropriate region
   */
  private async ensureCorrectRegion(uploadId: string): Promise<void> {
    const teamId = this.extractTeamIdFromUploadId(uploadId);

    if (!teamId) {
      // Default to EU - ensure we're using EU client and bucket
      this.client = this.euClient;
      this.bucket = this.euConfig.bucket;
      return;
    }

    const useUS = await this.shouldUseUSStorage(teamId);
    if (useUS) {
      // Switch to US client and bucket
      this.client = this.usClient;
      this.bucket = this.usConfig.bucket;
    } else {
      // Use EU client and bucket
      this.client = this.euClient;
      this.bucket = this.euConfig.bucket;
    }
  }

  // Override key S3Store methods to ensure correct region
  async create(upload: Upload): Promise<Upload> {
    try {
      await this.ensureCorrectRegion(upload.id);
      return await super.create(upload);
    } catch (error) {
      throw error;
    }
  }

  async write(stream: Readable, id: string, offset: number): Promise<number> {
    try {
      await this.ensureCorrectRegion(id);
      return await super.write(stream, id, offset);
    } catch (error) {
      throw error;
    }
  }

  async getUpload(id: string): Promise<Upload> {
    try {
      await this.ensureCorrectRegion(id);
      return await super.getUpload(id);
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.ensureCorrectRegion(id);
      // Clean up cache entry
      const teamId = this.extractTeamIdFromUploadId(id);
      if (teamId) {
        this.teamStorageCache.delete(teamId);
      }
      await super.remove(id);
    } catch (error) {
      throw error;
    }
  }

  async declareUploadLength(id: string, length: number): Promise<void> {
    try {
      await this.ensureCorrectRegion(id);
      await super.declareUploadLength(id, length);
    } catch (error) {
      throw error;
    }
  }

  async read(id: string): Promise<Readable> {
    try {
      await this.ensureCorrectRegion(id);
      return await super.read(id);
    } catch (error) {
      throw error;
    }
  }
}
