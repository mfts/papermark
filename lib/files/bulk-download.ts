import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { S3Client } from "@aws-sdk/client-s3";
import fetch from "node-fetch";
import { PassThrough } from "stream";
import type { Readable } from "stream";

export class S3DownloadService {
  constructor(private s3: S3Client) {}

  public createLazyDownloadStreamFrom(bucket: string, key: string): Readable {
    let streamCreated = false;
    const stream = new PassThrough();
    stream.on("newListener", async (event) => {
      if (!streamCreated && event === "data") {
        await this.initDownloadStream(bucket, key, stream);
        streamCreated = true;
      }
    });
    return stream;
  }

  public createLazyDownloadStreamFromUrl(url: string): Readable {
    let streamCreated = false;
    const stream = new PassThrough();
    stream.on("newListener", async (event) => {
      if (!streamCreated && event === "data") {
        await this.initUrlDownloadStream(url, stream);
        streamCreated = true;
      }
    });
    return stream;
  }

  private async initDownloadStream(
    bucket: string,
    key: string,
    stream: PassThrough,
  ) {
    try {
      const { Body: body } = await this.s3.send(
        new GetObjectCommand({ Bucket: bucket, Key: key }),
      );
      if (!body) {
        stream.emit(
          "error",
          new Error(
            `got an undefined body from s3 when getting object ${bucket}/${key}`,
          ),
        );
      } else if (!("on" in body)) {
        stream.emit(
          "error",
          new Error(
            `got a ReadableStream<any> or Blob from s3 when getting object ${bucket}/${key} instead of Readable`,
          ),
        );
      } else {
        body.on("error", (err) => stream.emit("error", err)).pipe(stream);
      }
    } catch (e) {
      stream.emit("error", e);
    }
  }

  private async initUrlDownloadStream(url: string, stream: PassThrough) {
    try {
      const response = await fetch(url);
      if (!response.body) {
        stream.emit(
          "error",
          new Error(`Failed to fetch the file from the URL: ${url}`),
        );
        return;
      }
      response.body
        .on("error", (err: any) => stream.emit("error", err))
        .pipe(stream);
    } catch (e) {
      stream.emit("error", e);
    }
  }
}
