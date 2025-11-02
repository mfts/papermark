# Papermark Storage Architecture Overview

## Executive Summary

Papermark is designed with flexible storage architecture that supports **Bring Your Own Storage (BYOS)**, allowing customers to use their own S3-compatible storage infrastructure while leveraging Papermark's document sharing and analytics capabilities. This document outlines the storage components, S3 interactions, and deployment options available to customers who want to host their data in their own cloud environment.

---

## High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser/Client]
    end
    
    subgraph "Papermark Application Layer"
        B[Next.js Application]
        C[API Routes]
        D[Storage Configuration Manager]
        E[S3 Client Factory]
        F[Authentication & Authorization]
    end
    
    subgraph "Storage Operations"
        G[Upload Services]
        H[Download Services]
        I[Delete Services]
        J[Metadata Management]
    end
    
    subgraph "Upload Methods"
        K[Browser Direct Upload]
        L[TUS Resumable Upload]
        M[Multipart Upload]
        N[Server-side Upload]
    end
    
    subgraph "Customer Infrastructure" 
        O[S3-Compatible Storage]
        P[CDN/CloudFront Optional]
        Q[IAM/Access Keys]
    end
    
    subgraph "Papermark Database"
        R[(PostgreSQL)]
        S[Document Metadata]
        T[Access Control]
        U[Analytics Data]
    end
    
    A -->|User Actions| B
    B --> C
    C --> F
    F --> D
    D --> E
    E -->|AWS SDK v3| G
    E -->|AWS SDK v3| H
    E -->|AWS SDK v3| I
    
    G --> K
    G --> L
    G --> M
    G --> N
    
    K -->|Presigned URLs| O
    L -->|Chunked Upload| O
    M -->|Parallel Parts| O
    N -->|Direct S3 API| O
    
    H -->|Presigned URLs| O
    H -->|CloudFront Signed URLs| P
    P --> O
    
    I -->|Delete Objects| O
    
    B --> R
    R --> S
    R --> T
    R --> U
    
    S -.->|Storage Path Reference| O
    T -.->|Team Config| Q
    Q -.->|Credentials| E
    
    style O fill:#e1f5ff,stroke:#0066cc,stroke-width:3px
    style P fill:#fff3cd,stroke:#ff9800,stroke-width:2px
    style Q fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style R fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px
```

---

## Solution Components

### 1. **Papermark Application Layer**

The core Papermark application runs as a Next.js application and handles:

- **User Interface**: Document upload, sharing, and analytics dashboards
- **API Routes**: RESTful endpoints for all storage operations
- **Authentication & Authorization**: User authentication via NextAuth.js, team-based access control
- **Storage Abstraction**: Unified interface supporting multiple storage backends (S3, Vercel Blob)
- **Configuration Management**: Per-team storage configuration with feature flags

### 2. **Storage Configuration Manager**

Manages storage configurations per team:

```typescript
interface StorageConfig {
  bucket: string;                    // S3 bucket name
  region: string;                     // AWS region (e.g., us-east-1)
  accessKeyId: string;                // AWS Access Key ID
  secretAccessKey: string;            // AWS Secret Access Key
  endpoint?: string;                  // Optional: Custom endpoint for S3-compatible services
  distributionHost?: string;          // Optional: CloudFront distribution domain
  distributionKeyId?: string;         // Optional: CloudFront key pair ID
  distributionKeyContents?: string;   // Optional: CloudFront private key (PEM)
}
```

**Key Features**:
- Per-team storage isolation
- Multi-region support (EU and US regions)
- Feature flag based routing
- Fallback to default configuration

### 3. **S3 Client Factory**

Creates authenticated S3 clients using AWS SDK v3:

```typescript
// Creates team-specific S3 client
const client = new S3Client({
  endpoint: config.endpoint || undefined,  // Supports custom endpoints
  region: config.region,
  credentials: {
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
  },
});
```

**Capabilities**:
- Team-specific client instantiation
- Custom endpoint support for S3-compatible services
- Credential isolation per team
- Lambda client creation for serverless functions

### 4. **File Organization Structure**

Documents are stored with this path structure:

```
{bucket}/
??? {teamId}/
?   ??? {documentId}/
?   ?   ??? {slugified-filename}.{ext}      # Original document
?   ?   ??? {filename}-watermarked.pdf      # Watermarked version
?   ?   ??? {filename}-optimized.mp4        # Optimized media (if applicable)
```

**Benefits**:
- Team isolation at the bucket level
- Easy document identification
- Efficient batch operations
- Supports document versioning

### 5. **Metadata Management**

**Location**: PostgreSQL database (Prisma ORM)

Papermark stores only metadata in its database:

```typescript
Document {
  id: string              // Unique document identifier
  name: string            // Original filename
  storageType: enum       // S3_PATH or VERCEL_BLOB
  file: string            // S3 key path (e.g., "teamId/docId/file.pdf")
  teamId: string          // Owner team
  // ... other metadata (access stats, settings, etc.)
}
```

**What's Stored**:
- ? Document metadata (name, type, size)
- ? S3 path/key reference
- ? Access control settings
- ? View analytics
- ? Sharing permissions

**What's NOT Stored**:
- ? Actual file content
- ? S3 credentials (only in environment variables)
- ? Presigned URLs (generated on-demand)

---

## Storage Operations & S3 APIs

### Upload Operations

Papermark supports four upload methods to accommodate different file sizes and use cases:

#### 1. **Browser Direct Upload** (Small to Medium Files: <100MB)

**What Happens**:
1. Client requests a presigned POST URL from Papermark
2. Papermark generates presigned URL using team's S3 credentials
3. Client uploads file directly to S3 using presigned URL
4. No file data passes through Papermark servers
5. Papermark saves document metadata to database

**S3 Operations Used**:
- `PutObjectCommand` with presigned URL generation via `@aws-sdk/s3-request-presigner`

**Benefits**:
- Fast uploads
- No server bandwidth usage
- Reduced server load

---

#### 2. **TUS Resumable Upload** (Large Files: 100MB - 2GB)

**What Happens**:
1. Client initiates TUS upload session with metadata (filename, size, team)
2. Papermark creates multipart upload in S3
3. Client uploads file in 8MB chunks via TUS protocol
4. Each chunk stored as S3 multipart upload part
5. On completion, multipart upload finalized
6. Metadata updated in S3 (Content-Type, Content-Disposition)
7. Document metadata saved to database

**S3 Operations Used**:
- `CreateMultipartUploadCommand` - Start multipart upload
- `UploadPartCommand` - Upload each 8MB chunk
- `CompleteMultipartUploadCommand` - Finalize upload
- `AbortMultipartUploadCommand` - Cancel on failure
- `CopyObjectCommand` - Update metadata after upload
- `ListPartsCommand` - Resume interrupted uploads

**Benefits**:
- Pause and resume uploads
- Reliable for large files over unstable connections
- Automatic retry on chunk failure
- Progress tracking

---

#### 3. **Multipart Upload** (Very Large Files: >1GB)

**What Happens**:
1. Client requests to initiate multipart upload
2. Papermark creates multipart upload session in S3
3. Client requests presigned URLs for each part (calculated by file size)
4. Client uploads parts directly to S3 in parallel using presigned URLs
5. Client notifies Papermark when all parts uploaded
6. Papermark completes the multipart upload
7. Document metadata saved to database

**S3 Operations Used**:
- `CreateMultipartUploadCommand` - Initiate multipart upload
- `UploadPartCommand` with presigned URLs - Upload each part (client-driven)
- `CompleteMultipartUploadCommand` - Finalize with part ETags
- `AbortMultipartUploadCommand` - Cleanup on failure

**Benefits**:
- Parallel part uploads for maximum speed
- Handles files up to 5TB
- Client controls upload parallelization
- Efficient use of bandwidth

---

#### 4. **Server-side Upload** (API/Integration Uploads)

**What Happens**:
1. Server receives file via API (webhook, email attachment, integration)
2. File streamed directly from server to S3
3. AWS SDK automatically handles multipart for large files
4. Document metadata saved to database

**S3 Operations Used**:
- `PutObjectCommand` - Small files (<5MB)
- `Upload` class from `@aws-sdk/lib-storage` - Large files (automatic multipart)

**Benefits**:
- Supports API integrations
- Handles email attachments
- Processes files from external sources

---

### Download Operations

#### 1. **S3 Presigned URLs** (Direct Access)

**What Happens**:
1. User requests document download
2. Papermark verifies access permissions
3. Papermark extracts S3 key from document metadata
4. Papermark generates presigned GET URL (1-hour expiration)
5. Client redirected to presigned URL
6. File downloaded directly from S3

**S3 Operations Used**:
- `GetObjectCommand` with presigned URL generation via `@aws-sdk/s3-request-presigner`

**Benefits**:
- Direct download from S3 (fast)
- No Papermark bandwidth usage
- Secure, time-limited access

---

#### 2. **CloudFront Signed URLs** (CDN Access)

**What Happens**:
1. User requests document download
2. Papermark verifies access permissions
3. Papermark generates CloudFront signed URL using RSA private key (1-hour expiration)
4. Client redirected to CloudFront URL
5. File served from CloudFront edge cache (or fetched from S3 origin if not cached)

**CloudFront Operations Used**:
- URL signing via `@aws-sdk/cloudfront-signer` using private key cryptography

**Benefits**:
- Cached content delivery (faster global access)
- Reduced S3 egress costs
- Lower latency for repeat downloads

---

### Delete Operations

**What Happens**:
1. User deletes document from Papermark
2. Papermark lists all objects in document folder (includes original, watermarked, optimized versions)
3. All objects deleted in batch operation
4. If more than 1000 objects, operation repeated (pagination)
5. Document metadata removed from database

**S3 Operations Used**:
- `ListObjectsV2Command` - List all objects in document folder
- `DeleteObjectsCommand` - Batch delete up to 1000 objects at once

**Benefits**:
- Complete cleanup of all document versions
- Efficient batch deletion
- Handles pagination for large sets

---

### Additional Storage Operations

#### Document Processing (Watermarking, Optimization)

**What Happens**:
1. Original document uploaded to S3
2. Background job retrieves document from S3 via presigned URL
3. Processing applied (watermarking, video optimization, etc.)
4. Processed file uploaded back to S3 in same folder
5. Metadata updated with processed file path

**S3 Operations Used**:
- `GetObjectCommand` with presigned URL - Retrieve original
- `PutObjectCommand` - Upload processed version

---

#### Bulk Download (Multiple Documents)

**What Happens**:
1. User requests bulk download (e.g., entire data room)
2. Papermark streams multiple files from S3
3. Files compressed into ZIP archive on-the-fly
4. ZIP streamed to client

**S3 Operations Used**:
- `GetObjectCommand` with presigned URLs - Retrieve each file
- Streaming to avoid memory issues

---

#### Copy/Duplicate Operations

**What Happens**:
1. User duplicates document or moves to different data room
2. Papermark copies S3 object to new key path
3. No file download/upload required
4. New document metadata created

**S3 Operations Used**:
- `CopyObjectCommand` - Server-side copy within S3

**Benefits**:
- Fast, no data transfer
- Free operation within same region

---

## S3-Compatible Storage Requirements

### Required S3 APIs

Papermark requires the following S3-compatible APIs:

#### Core Operations (Required)
| API Operation | Usage | Frequency |
|--------------|-------|-----------|
| `PutObject` | Upload files | Per upload |
| `GetObject` | Download files | Per download |
| `DeleteObject` | Delete single file | Per deletion |
| `DeleteObjects` | Batch delete | Per document deletion |
| `ListObjectsV2` | List document versions | Per deletion |
| `HeadObject` | Check object existence | On-demand |
| `CopyObject` | Duplicate/move documents | Per copy operation |

#### Multipart Upload (Required for Large Files)
| API Operation | Usage | Frequency |
|--------------|-------|-----------|
| `CreateMultipartUpload` | Start large upload | Per large upload |
| `UploadPart` | Upload file part | Per chunk |
| `CompleteMultipartUpload` | Finalize upload | Per large upload |
| `AbortMultipartUpload` | Cancel failed upload | On error |
| `ListParts` | Resume upload | On reconnection |

#### Access Control (Required)
| Feature | Usage |
|---------|-------|
| **Presigned URLs** | All upload/download operations |
| **IAM Credentials** | Authentication (Access Key + Secret) |
| **Bucket Policies** | Team-level isolation (optional but recommended) |

#### Optional Features
| Feature | Purpose | Benefit |
|---------|---------|---------|
| **Versioning** | Document history | Audit trail |
| **Lifecycle Policies** | Auto-deletion of old files | Cost savings |
| **Server-Side Encryption** | Data at rest encryption | Security compliance |
| **Transfer Acceleration** | Faster global uploads | Performance |
| **CloudFront CDN** | Cached downloads | Performance + Cost |

### Configuration Requirements

To integrate your S3-compatible storage, you'll need to provide:

1. **Bucket Name**: Dedicated bucket for Papermark documents
2. **Region**: AWS region or equivalent for S3-compatible service
3. **Access Credentials**: 
   - Access Key ID
   - Secret Access Key
   - With permissions: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`, `s3:CopyObject`
4. **Endpoint** (Optional): Custom endpoint URL for S3-compatible services (e.g., MinIO, DigitalOcean Spaces, Backblaze B2)
5. **CloudFront Distribution** (Optional):
   - Distribution domain
   - Key Pair ID
   - RSA Private Key (PEM format, 2048-bit)

### Environment Variables Configuration

```bash
# Required: Storage transport type
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"

# Required: S3 bucket and region
NEXT_PRIVATE_UPLOAD_BUCKET="your-papermark-bucket"
NEXT_PRIVATE_UPLOAD_REGION="us-east-1"

# Required: AWS credentials
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="AKIA..."
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="secret..."

# Optional: Custom endpoint for S3-compatible services
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://s3.your-provider.com"

# Optional: CloudFront CDN configuration
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="d123456.cloudfront.net"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID="K123456"
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS="-----BEGIN RSA PRIVATE KEY-----\n..."

# Required: Distribution host for Next.js image optimization
NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST="your-bucket.s3.us-east-1.amazonaws.com"
```

---

## S3-Compatible Services Compatibility

Papermark has been designed to work with any S3-compatible storage service that implements the core S3 API. Below are known compatible services:

### ? Fully Compatible

| Service | Notes |
|---------|-------|
| **Amazon S3** | Native support, all features available |
| **AWS S3 (GovCloud)** | Tested and supported |
| **MinIO** | Open-source, self-hosted S3 alternative |
| **DigitalOcean Spaces** | Full compatibility with custom endpoint |
| **Backblaze B2** | Use S3-compatible API with custom endpoint |
| **Wasabi** | Hot storage, S3-compatible API |
| **Cloudflare R2** | Zero egress fees, S3-compatible |
| **Linode Object Storage** | S3-compatible API |

### ?? Partial Compatibility

| Service | Limitation | Workaround |
|---------|-----------|-----------|
| **Google Cloud Storage** | XML API must be enabled | Enable interoperability API |
| **Azure Blob Storage** | Limited S3 compatibility | Use Azure-specific adapter (not currently supported) |

### Configuration Example: MinIO (Self-Hosted)

```bash
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://minio.your-company.com"
NEXT_PRIVATE_UPLOAD_BUCKET="papermark-docs"
NEXT_PRIVATE_UPLOAD_REGION="us-east-1"  # Can be any value for MinIO
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="minio-access-key"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="minio-secret-key"
```

### Configuration Example: Cloudflare R2

```bash
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
NEXT_PRIVATE_UPLOAD_BUCKET="papermark-documents"
NEXT_PRIVATE_UPLOAD_REGION="auto"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="r2-access-key"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="r2-secret-key"
```

---

## Deployment Options

We offer flexible deployment options to accommodate your security and compliance requirements:

### Option 1: Customer-Managed AWS Account (Recommended)

**Overview**: You create and manage your own AWS account with an S3 bucket dedicated to Papermark documents. You provide us with limited IAM credentials that grant Papermark access only to this specific bucket.

**Setup Process**:

1. **Create AWS Account** (if you don't have one)
   - Sign up at [aws.amazon.com](https://aws.amazon.com)
   - Enable MFA for root account
   - Set up billing alerts

2. **Create S3 Bucket**
   ```bash
   # Using AWS CLI
   aws s3 mb s3://your-company-papermark-docs --region us-east-1
   ```
   
   **Recommended Settings**:
   - ? Enable versioning (for audit trail)
   - ? Enable server-side encryption (SSE-S3 or SSE-KMS)
   - ? Block public access (all settings on)
   - ? Enable bucket logging (for compliance)
   - ?? Configure lifecycle rules (optional, for cost optimization)

3. **Create IAM User for Papermark**
   ```bash
   aws iam create-user --user-name papermark-storage-access
   ```

4. **Create IAM Policy**
   
   Create a policy file `papermark-s3-policy.json`:
   
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:PutObject",
           "s3:GetObject",
           "s3:DeleteObject",
           "s3:ListBucket",
           "s3:ListBucketMultipartUploads",
           "s3:ListMultipartUploadParts",
           "s3:AbortMultipartUpload",
           "s3:CopyObject"
         ],
         "Resource": [
           "arn:aws:s3:::your-company-papermark-docs/*",
           "arn:aws:s3:::your-company-papermark-docs"
         ]
       }
     ]
   }
   ```
   
   Apply the policy:
   ```bash
   aws iam create-policy --policy-name PapermarkS3Access --policy-document file://papermark-s3-policy.json
   aws iam attach-user-policy --user-name papermark-storage-access --policy-arn arn:aws:iam::YOUR_ACCOUNT_ID:policy/PapermarkS3Access
   ```

5. **Generate Access Keys**
   ```bash
   aws iam create-access-key --user-name papermark-storage-access
   ```
   
   **Important**: Store these credentials securely. We'll need:
   - Access Key ID
   - Secret Access Key

6. **Share Credentials Securely**
   - Use encrypted communication (e.g., 1Password shared vault, encrypted email)
   - We'll configure your Papermark instance with these credentials
   - Credentials are stored as encrypted environment variables

7. **Optional: Set Up CloudFront CDN**
   
   For better performance and reduced costs:
   
   ```bash
   # Create CloudFront distribution
   aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
   
   # Create CloudFront key pair for signed URLs
   # (This must be done in AWS Console by root account)
   ```

**Benefits**:
- ? Complete control over your data
- ? Data never leaves your AWS account
- ? You manage backup and retention policies
- ? Full audit trail in CloudTrail
- ? You can revoke access at any time
- ? Meets most compliance requirements (GDPR, HIPAA, etc.)

**Support Level**: Full support from Papermark team for configuration

---

### Option 2: Papermark-Managed AWS Account on Your Behalf

**Overview**: We create and manage an AWS account specifically for your organization's Papermark documents. The account is isolated and dedicated solely to your data. You receive read-only access for auditing purposes.

**Setup Process**:

1. **Account Provisioning**
   - We create a dedicated AWS account under our AWS Organization
   - Account is named: `{YourCompany}-Papermark-Storage`
   - We apply AWS Organizations SCPs (Service Control Policies) for security

2. **Resource Setup**
   - S3 bucket created with your naming preference
   - CloudFront distribution configured (optional)
   - Encryption enabled (SSE-KMS with customer-managed key)
   - Logging and monitoring enabled

3. **Access Delegation**
   - You receive an IAM role with read-only access for auditing
   - Access via AWS Console or CLI
   - Can view all objects and access logs
   - Cannot modify or delete data without written approval

4. **Key Management**
   - Option A: AWS-managed keys (SSE-S3)
   - Option B: Customer-managed keys (SSE-KMS) - you control key policies
   - Option C: Client-side encryption before upload (you manage keys)

5. **Ongoing Management**
   - We handle infrastructure maintenance
   - You receive monthly usage reports
   - Quarterly security audits included

**Benefits**:
- ? No AWS expertise required
- ? Faster time to deployment (1-2 days)
- ? Managed backups and disaster recovery
- ? Dedicated support from Papermark infrastructure team
- ? Transparent billing (we pass through AWS costs)

**Considerations**:
- ?? Data stored in Papermark-managed account (isolated, but not your account)
- ?? Monthly infrastructure management fee applies
- ?? 30-day notice required for account transfer

**Support Level**: Fully managed by Papermark infrastructure team

---

### Option 3: CloudFormation Template (Self-Service)

**Overview**: We provide an AWS CloudFormation template that automatically provisions all required AWS resources in your account. This is the fastest option for customers with AWS experience.

**What Gets Provisioned**:
- S3 bucket with recommended security settings
- IAM user with least-privilege policy
- CloudFront distribution (optional)
- CloudWatch alarms for monitoring
- Bucket logging configuration
- Encryption configuration

**Setup Process**:

1. **Download CloudFormation Template**
   
   We provide a template (`papermark-storage-stack.yaml`)

2. **Deploy Stack**
   
   Via AWS Console:
   - Navigate to CloudFormation console
   - Click "Create Stack"
   - Upload `papermark-storage-stack.yaml`
   - Enter parameters (bucket name, region, enable CloudFront)
   - Click "Create"
   
   Via AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name papermark-storage \
     --template-body file://papermark-storage-stack.yaml \
     --parameters \
       ParameterKey=BucketName,ParameterValue=your-company-papermark-docs \
       ParameterKey=EnableCloudFront,ParameterValue=true \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Retrieve Outputs**
   
   After stack creation (5-10 minutes), retrieve outputs:
   
   ```bash
   aws cloudformation describe-stacks \
     --stack-name papermark-storage \
     --query 'Stacks[0].Outputs'
   ```
   
   Outputs include:
   - Bucket Name
   - Access Key ID
   - Secret Access Key
   - CloudFront Distribution Domain (if enabled)

4. **Share Credentials with Papermark**
   
   Provide the stack outputs to Papermark team securely

**Benefits**:
- ? Fastest setup (10-15 minutes)
- ? Infrastructure as Code (IaC) best practices
- ? All resources properly tagged
- ? Easy to replicate across regions/environments
- ? Can be version controlled
- ? Includes monitoring and alarms

**Requirements**:
- AWS account with CloudFormation permissions
- Basic understanding of CloudFormation
- IAM permissions to create users and policies

**Support Level**: Template provided with documentation, email support available

---

### Option 4: Non-AWS S3-Compatible Storage

**Overview**: Use a non-AWS S3-compatible storage provider (MinIO, Cloudflare R2, DigitalOcean Spaces, etc.) hosted in your infrastructure or a third-party provider.

**Setup Process**:

1. **Choose Provider**
   - Review compatibility matrix above
   - Ensure provider supports S3 API v4 signing
   - Verify multipart upload support

2. **Create Bucket/Namespace**
   - Follow provider's documentation
   - Configure CORS if browser uploads needed
   - Enable encryption if available

3. **Generate Credentials**
   - Create API key/credentials with S3-compatible format
   - Ensure permissions: read, write, delete, list

4. **Configure Papermark**
   - Provide custom endpoint URL
   - Provide bucket/namespace name
   - Provide access credentials
   - Specify region (can be arbitrary for some providers)

5. **Test Integration**
   - We perform connectivity tests
   - Upload/download verification
   - Multipart upload testing

**Example: Cloudflare R2**

Cloudflare R2 offers zero egress fees, making it cost-effective for document sharing.

Configuration:
```bash
NEXT_PRIVATE_UPLOAD_ENDPOINT="https://abc123.r2.cloudflarestorage.com"
NEXT_PRIVATE_UPLOAD_BUCKET="papermark-documents"
NEXT_PRIVATE_UPLOAD_REGION="auto"
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID="your-r2-access-key"
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY="your-r2-secret-key"
```

**Benefits**:
- ? Potentially lower costs (especially R2 with zero egress)
- ? Use existing provider relationships
- ? Geographic flexibility (MinIO for on-premises)
- ? Avoid vendor lock-in

**Considerations**:
- ?? Provider must fully support S3 API
- ?? CloudFront integration not available with non-AWS providers
- ?? May require additional testing/validation
- ?? Support may be limited for provider-specific issues

**Support Level**: Best-effort support, provider-specific issues may require provider support

---

## Security Considerations

### Data Security

1. **Encryption in Transit**
   - All S3 operations use HTTPS/TLS 1.2+
   - Presigned URLs use secure HTTPS endpoints
   - CloudFront requires HTTPS

2. **Encryption at Rest**
   - Recommended: Enable SSE-S3 or SSE-KMS on your bucket
   - For highest security: Use customer-managed KMS keys
   - Alternative: Client-side encryption before upload

3. **Access Control**
   - IAM credentials with least-privilege permissions
   - Bucket policies to restrict access by IP (optional)
   - MFA delete protection (recommended for production)
   - Presigned URL expiration (1 hour default)

4. **Credential Management**
   - Credentials stored as encrypted environment variables
   - Never logged or exposed in application code
   - Rotation supported (coordinate with Papermark team)
   - AWS Secrets Manager integration available

### Compliance

Papermark's BYOS architecture supports various compliance frameworks:

| Framework | Support | Requirements |
|-----------|---------|--------------|
| **GDPR** | ? Full | Data residency in EU region, customer data ownership |
| **HIPAA** | ? Full | BAA required, encryption at rest/transit, audit logging |
| **SOC 2** | ? Full | Access controls, audit trails, encryption |
| **ISO 27001** | ? Full | Documented security controls, access management |
| **FedRAMP** | ?? Partial | Use AWS GovCloud, limited Papermark support |

### Audit & Monitoring

**AWS CloudTrail** (for AWS accounts):
- All S3 API calls logged
- Searchable audit trail
- Integration with SIEM systems

**Bucket Access Logging**:
- Server access logs for all bucket operations
- Destination bucket for log storage

**CloudWatch Alarms**:
- Failed authentication attempts
- Unusual download patterns
- Storage usage thresholds

---

## Frequently Asked Questions

### Q: Can I use multiple buckets for different teams?
**A:** Yes, Papermark supports per-team storage configuration. Each team can have its own bucket, region, or even provider.

### Q: What happens if I revoke credentials?
**A:** Papermark will be unable to access documents. Users will see errors when uploading/downloading. We can coordinate credential rotation with zero downtime.

### Q: Do you support S3 bucket versioning?
**A:** Yes, Papermark is compatible with versioned buckets. We always operate on the latest version.

### Q: Can I restrict access by IP address?
**A:** Yes, you can add bucket policies to restrict access to specific IP ranges. Coordinate with Papermark team to provide our NAT gateway IPs.

### Q: What's the maximum file size?
**A:** 2GB via TUS upload. For larger files, contact us for custom configuration.

### Q: Can I use S3 Object Lock for compliance?
**A:** Yes, but requires coordination. Object Lock prevents deletion, so document removal workflows need adjustment.

### Q: Do you support cross-region replication?
**A:** Papermark doesn't manage replication, but you can enable it on your bucket for disaster recovery.

### Q: Can I use AWS KMS encryption?
**A:** Yes, configure SSE-KMS on your bucket. Ensure the IAM user has `kms:Decrypt` and `kms:GenerateDataKey` permissions.

### Q: What about GDPR data residency?
**A:** Use EU region buckets (e.g., `eu-central-1`, `eu-west-1`). Papermark application can be deployed in EU regions on request.

### Q: How do you handle failed uploads?
**A:** For multipart uploads, we automatically abort incomplete uploads to prevent storage costs. TUS protocol supports automatic retry and resume.

### Q: Can I see what S3 operations Papermark performs?
**A:** Yes, enable AWS CloudTrail and S3 server access logging. All API calls are logged with timestamps and request details.

---

## Conclusion

Papermark's flexible storage architecture enables you to maintain complete control over your document data while leveraging Papermark's powerful sharing and analytics capabilities. Whether you choose to manage your own AWS account, use Papermark-managed infrastructure, or integrate with third-party S3-compatible storage, we support your security and compliance requirements.

**Next Steps**:
1. Choose your deployment option
2. Review security and compliance requirements with your team
3. Schedule a kickoff call with Papermark infrastructure team
4. Begin setup process (1-2 week timeline for most options)

For questions or to get started, contact: **storage-support@papermark.io**

---

*Document Version: 1.0*  
*Last Updated: 2025-11-02*  
*Prepared for: Enterprise Customer BYOS Evaluation*
