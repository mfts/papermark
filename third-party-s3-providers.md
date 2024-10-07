## Integrating an S3-Compatible Storage Option: MinIO Example

<hr/>

In this article, we’ll guide you through integrating MinIO as a storage option in Papermark.

<br/>

### What is MinIO ?

[MinIO](https://min.io/) is an open-source object storage solution designed to store large amounts of unstructured data, such as photos, videos, log files, and backups. It’s optimized for high-performance, enterprise-grade environments while maintaining full compatibility with the S3 API, allowing you to swap it into existing systems that are built around Amazon S3.

<br/>

### Setting Up MinIO

To integrate MinIO into your application, the first step is to set up MinIO either locally or in your infrastructure. Here’s a basic guide to getting MinIO up and running.

<br />

### Step 1: Install MinIO

For this example, we will install MinIO locally in macOS to simulate an S3-compatible storage service. The detailed installation instructions for various operating systems can be found in the official [MinIO documentation](https://min.io/docs/minio/macos/index.html). Follow the guide to set up MinIO on your local machine or desired environment.

```
brew install minio/stable/minio
```

<br />

### Step 2: Launch the MinIO Server

From the terminal run `minio server .` from the directory in which MinIO was installed.

```
MinIO Object Storage Server
Copyright: 2015-2024 MinIO, Inc.
License: GNU AGPLv3 - https://www.gnu.org/licenses/agpl-3.0.html
Version: RELEASE.2024-09-22T00-33-43Z (go1.22.7 darwin/arm64)

API: http://192.168.1.5:9000  http://127.0.0.1:9000
   RootUser: minioadmin
   RootPass: minioadmin

WebUI: http://192.168.1.5:55372 http://127.0.0.1:55372
   RootUser: minioadmin
   RootPass: minioadmin
```

<br />

### Access the MinIO Console

- Once you have MinIO running, open your browser and navigate to WebUI url, in this case `http://192.168.1.5:55372`
- Login with the default credentials.

<br />

### Step 4: Create a Bucket

Buckets in MinIO serve the same purpose as those in Amazon S3. Use the web console to create a bucket.

You now have a storage bucket ready to store files.

<br />

### Integrating MinIO with Papermark

<br/>

You can use the default credentials as access key and secret key or create a new access key with the appropriate policy to manage your buckets and objects.

We are required to set five .env variables for the integration

1. `NEXT_PRIVATE_UPLOAD_ENDPOINT`: The api endpoint for the MinIO server, in this case `http://192.168.1.5:9000`
2. `NEXT_PRIVATE_UPLOAD_REGION`: Use a default value like `us-east-1`
3. `NEXT_PRIVATE_UPLOAD_BUCKET`: Storage bucket to be used. Copy the name from MinIO console.
4. `NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID`: Access key or the default `minioadmin`
5. `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`: Secret key or `minioadmin`

<br/>

You can upload a new document and verify it in the MinIO console.
