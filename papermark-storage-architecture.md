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

**File**: `ee/features/storage/config.ts`

This component manages storage configurations per team:

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

**File**: `lib/files/aws-client.ts`

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

### 4. **Upload Services**

Papermark supports multiple upload methods to accommodate different file sizes and use cases:

#### a) **Browser Direct Upload** (Small to Medium Files)
**File**: `pages/api/file/s3/get-presigned-post-url.ts`

- Client requests presigned POST URL from Papermark API
- Papermark generates presigned URL with team credentials
- Client uploads directly to S3 using presigned URL
- No file data passes through Papermark servers

**S3 Operations Used**:
- `PutObjectCommand` with presigned URL generation

#### b) **TUS Resumable Upload** (Large Files, >100MB)
**Files**: `pages/api/file/tus/[[...file]].ts`, `ee/features/storage/s3-store.ts`

- Protocol: [TUS (resumable upload protocol)](https://tus.io)
- Supports pause/resume for unreliable connections
- Chunked uploads in 8MB parts
- Multi-region routing based on team configuration

**S3 Operations Used**:
- `CreateMultipartUploadCommand`
- `UploadPartCommand`
- `CompleteMultipartUploadCommand`
- `AbortMultipartUploadCommand`

#### c) **Multipart Upload** (Very Large Files, >1GB)
**File**: `pages/api/file/s3/multipart.ts`

- Client-coordinated multipart upload
- Parallel part uploads for speed
- Three-phase process: initiate ? upload parts ? complete

**S3 Operations Used**:
- `CreateMultipartUploadCommand`
- `UploadPartCommand` (presigned URLs for each part)
- `CompleteMultipartUploadCommand`
- `AbortMultipartUploadCommand` (on failure)

#### d) **Server-side Upload** (API/Integration Uploads)
**Files**: `lib/files/put-file-server.ts`, `lib/files/stream-file-server.ts`

- Used for API integrations, webhooks, email attachments
- File streams directly from server to S3
- Uses AWS SDK's `Upload` class for automatic multipart handling

**S3 Operations Used**:
- `PutObjectCommand`
- `Upload` (from `@aws-sdk/lib-storage`) for streaming

### 5. **Download Services**

**Files**: `lib/files/get-file.ts`, `pages/api/file/s3/get-presigned-get-url.ts`

Downloads support two modes:

#### a) **S3 Presigned URLs** (Direct Access)
- 1-hour expiration time
- Direct download from S3
- Used when no CDN is configured

**S3 Operations Used**:
- `GetObjectCommand` with presigned URL generation

#### b) **CloudFront Signed URLs** (CDN Access)
- 1-hour expiration time
- Cached content delivery
- Used when CloudFront is configured
- Requires RSA private key for signing

**CloudFront Operations Used**:
- URL signing with `@aws-sdk/cloudfront-signer`

### 6. **Delete Services**

**File**: `lib/files/delete-file-server.ts`

Handles document deletion:

- Lists all objects in document folder (includes versions, watermarked copies)
- Batch deletion of objects
- Handles pagination for large document sets

**S3 Operations Used**:
- `ListObjectsV2Command`
- `DeleteObjectsCommand`

### 7. **File Organization Structure**

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

### 8. **Metadata Management**

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
   - With permissions: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, `s3:ListBucket`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`
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
           "s3:AbortMultipartUpload"
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

**Setup Process**:

1. **Download CloudFormation Template**
   
   We provide a template (`papermark-storage-stack.yaml`) that creates:
   - S3 bucket with recommended settings
   - IAM user and policy
   - CloudFront distribution (optional)
   - CloudWatch alarms for monitoring

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
   - Secret Access Key (encrypted)
   - CloudFront Distribution Domain (if enabled)

4. **Share Credentials with Papermark**
   
   Provide the stack outputs to Papermark team securely

**CloudFormation Template Structure**:

```yaml
# Simplified example - full template provided separately
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Papermark Storage Infrastructure'

Parameters:
  BucketName:
    Type: String
    Description: 'Name for the S3 bucket'
  EnableCloudFront:
    Type: String
    Default: 'false'
    AllowedValues: ['true', 'false']

Resources:
  PapermarkBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref BucketName
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
  
  PapermarkUser:
    Type: AWS::IAM::User
    Properties:
      UserName: papermark-storage-access
  
  PapermarkPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: PapermarkS3Access
      Users:
        - !Ref PapermarkUser
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:PutObject
              - s3:GetObject
              - s3:DeleteObject
              - s3:ListBucket
              - s3:AbortMultipartUpload
            Resource:
              - !GetAtt PapermarkBucket.Arn
              - !Sub '${PapermarkBucket.Arn}/*'
  
  PapermarkAccessKey:
    Type: AWS::IAM::AccessKey
    Properties:
      UserName: !Ref PapermarkUser

Outputs:
  BucketName:
    Value: !Ref PapermarkBucket
  AccessKeyId:
    Value: !Ref PapermarkAccessKey
  SecretAccessKey:
    Value: !GetAtt PapermarkAccessKey.SecretAccessKey
  # ... additional outputs
```

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

## Cost Estimation

### AWS S3 Costs (Example: US East)

| Component | Pricing | Example (100GB, 10K docs) |
|-----------|---------|---------------------------|
| **Storage** | $0.023/GB/month | $2.30/month |
| **PUT Requests** | $0.005/1000 requests | $0.05/month (10K uploads) |
| **GET Requests** | $0.0004/1000 requests | $0.40/month (100K downloads) |
| **Data Transfer Out** | $0.09/GB | $9.00/month (100GB egress) |
| **Total (estimated)** | - | **~$12/month** |

### With CloudFront CDN

| Component | Pricing | Example (100GB, 10K docs) |
|-----------|---------|---------------------------|
| **Storage** | $0.023/GB/month | $2.30/month |
| **PUT Requests** | $0.005/1000 requests | $0.05/month |
| **CloudFront Data Transfer** | $0.085/GB | $8.50/month (100GB via CDN) |
| **CloudFront Requests** | $0.0075/10K requests | $0.08/month (100K requests) |
| **Total (estimated)** | - | **~$11/month** (5% savings) |

**Savings with CloudFront**:
- Reduced S3 egress costs
- Faster global delivery
- Caching reduces origin load

### Alternative: Cloudflare R2

| Component | Pricing | Example (100GB, 10K docs) |
|-----------|---------|---------------------------|
| **Storage** | $0.015/GB/month | $1.50/month |
| **Class A Operations** | $4.50/million | $0.05/month (10K uploads) |
| **Class B Operations** | $0.36/million | $0.04/month (100K downloads) |
| **Data Transfer Out** | **FREE** | **$0.00/month** |
| **Total (estimated)** | - | **~$1.60/month** (86% savings) |

---

## Migration Path

If you're currently using Papermark's default storage and want to migrate to your own:

### Migration Process

1. **Setup Your Storage**
   - Follow one of the deployment options above
   - Test connectivity with a staging environment

2. **Data Migration**
   - We provide a migration script to copy existing documents
   - Minimal downtime (1-2 hours for most customers)
   - Validation of all transferred files

3. **Configuration Update**
   - Update environment variables to use your storage
   - Deploy configuration changes
   - Smoke testing

4. **Verification**
   - Upload test documents
   - Download existing documents
   - Verify analytics still functioning

5. **Cleanup**
   - After 30-day grace period, delete documents from old storage
   - Final verification

**Timeline**: Typically 1-2 weeks from decision to full migration

**Downtime**: < 2 hours during cutover

---

## Support & Resources

### Documentation
- **AWS S3 API Reference**: https://docs.aws.amazon.com/s3/
- **AWS SDK for JavaScript v3**: https://docs.aws.amazon.com/sdk-for-javascript/v3/
- **TUS Protocol Specification**: https://tus.io/protocols/resumable-upload

### Papermark Support
- **Email**: storage-support@papermark.io
- **Response Time**: < 24 hours for storage issues
- **Escalation**: Critical issues escalated to infrastructure team

### AWS Support Resources
- **AWS Support Plans**: Recommended Business or Enterprise support
- **AWS Well-Architected Framework**: Security, reliability, performance
- **AWS Trusted Advisor**: Cost optimization, security checks

---

## Frequently Asked Questions

### Q: Can I use multiple buckets for different teams?
**A:** Yes, Papermark supports per-team storage configuration. Each team can have its own bucket, region, or even provider.

### Q: What happens if I revoke credentials?
**A:** Papermark will be unable to access documents. Users will see errors when uploading/downloading. We can coordinate credential rotation with zero downtime.

### Q: Can I migrate data back to Papermark-hosted storage?
**A:** Yes, the migration process works in both directions.

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
