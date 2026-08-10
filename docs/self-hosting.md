# Self-hosting Papermark

Papermark needs a PostgreSQL database, S3-compatible blob storage, and Redis.
Historically the setup instructions pointed you at hosted providers for all
three. The `docker-compose.yml` in the repository root runs them locally
instead, so you can get a working instance without signing up for anything.

The rest of Papermark's integrations (email, analytics, background jobs) remain
external. [What stays external](#what-stays-external) explains exactly what each
one costs you if you leave it unconfigured.

---

## Contents

- [What runs where](#what-runs-where)
- [Quick start](#quick-start)
- [Verifying the setup](#verifying-the-setup)
- [The containers in detail](#the-containers-in-detail)
- [Port conflicts](#port-conflicts)
- [Using managed providers instead](#using-managed-providers-instead)
- [What stays external](#what-stays-external)
- [Running in production](#running-in-production)
- [Troubleshooting](#troubleshooting)

---

## What runs where

| Component           | Container    | Replaces                             | Required?                                   |
| ------------------- | ------------ | ------------------------------------ | ------------------------------------------- |
| PostgreSQL 16       | `postgres`   | Vercel Postgres, Neon, Supabase, RDS | Yes                                         |
| MinIO (S3 API)      | `minio`      | AWS S3, Vercel Blob, Cloudflare R2   | Yes — documents live here                   |
| Bucket bootstrap    | `minio-init` | Manual bucket creation               | Runs once, then exits                       |
| Redis 7             | `redis`      | Upstash Redis                        | Yes — sign-in codes, rate limits            |
| Upstash REST facade | `redis-http` | Upstash REST API                     | Yes — Papermark speaks REST, not `redis://` |

Everything else (email, analytics, PDF processing) is optional and covered
under [What stays external](#what-stays-external).

---

## Quick start

**Prerequisites:** Node.js >= 24, Docker with Compose v2.

```shell
git clone https://github.com/mfts/papermark.git
cd papermark
npm install
```

**1. Start the infrastructure.**

```shell
docker compose up -d
```

This pulls Postgres, MinIO, and Redis, creates the `papermark-documents` and
`papermark-archive` buckets, and creates the Prisma shadow database. Bucket and
database creation are idempotent, so re-running the command is safe.

**2. Create your `.env`.**

```shell
cp .env.example .env
```

The database, storage, and Redis values in `.env.example` already point at the
containers you just started — no editing required to get running. Before
exposing the instance to anyone else, replace `NEXTAUTH_SECRET`,
`INTERNAL_API_KEY`, `NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY`, and the MinIO
credentials with real secrets (`openssl rand -hex 32` generates suitable
values).

**3. Apply the database schema.**

```shell
npm run dev:prisma
```

**4. Run the app.**

```shell
npm run dev
```

Papermark is now on [http://localhost:3000](http://localhost:3000), and the
MinIO console is on [http://localhost:9001](http://localhost:9001) (log in with
`papermark` / `papermark-secret`).

> **Signing in.** Papermark emails a login code, so email sign-in needs a
> `RESEND_API_KEY`. Without one, configure `GOOGLE_CLIENT_ID` /
> `GOOGLE_CLIENT_SECRET` and use Google sign-in instead. See
> [What stays external](#what-stays-external).

---

## Verifying the setup

Check that all four containers are up and the two healthchecked ones are
healthy:

```shell
docker compose ps
```

Confirm the buckets were created:

```shell
docker compose logs minio-init
# MinIO buckets ready: papermark-documents, papermark-archive
```

Confirm the database has Papermark's tables:

```shell
docker compose exec postgres psql -U papermark -d papermark -c '\dt' | head
```

Confirm the Redis REST facade answers:

```shell
curl -H "Authorization: Bearer papermark-redis-token" \
     -H "Content-Type: application/json" \
     -d '["PING"]' http://localhost:8079/
# {"result":"PONG"}
```

The real end-to-end test is uploading a document in the UI and opening its
share link. If that works, storage, database, and Redis are all wired up.

---

## The containers in detail

### `postgres`

Plain PostgreSQL 16 with a named volume for persistence.

Prisma expects both a pooled and a direct connection URL
(`POSTGRES_PRISMA_URL` and `POSTGRES_PRISMA_URL_NON_POOLING`). Against a plain
Postgres server there is no separate pooler, so both point at the same
database. That is expected and supported.

`docker/postgres/init/01-create-shadow-database.sql` creates a
`papermark_shadow` database on first boot. Prisma only needs it for
`npx prisma migrate dev` when you are authoring new migrations;
`npm run dev:prisma` (which runs `migrate deploy`) does not touch it.

### `minio`

MinIO implements the S3 API, so Papermark's existing S3 transport talks to it
unchanged. Two settings make this work:

- `NEXT_PRIVATE_UPLOAD_ENDPOINT` points the AWS SDK at MinIO instead of AWS.
- `NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE="true"` makes the SDK address buckets
  as `http://localhost:9000/papermark-documents/key` rather than
  `http://papermark-documents.localhost:9000/key`. Without it MinIO rejects
  every request with `InvalidBucketName`, because the virtual-host form
  requires wildcard DNS that `localhost` does not provide.

Buckets stay **private**. Papermark issues short-lived presigned URLs for every
read and write, exactly as it does against real S3 — objects are never public.

MinIO's default CORS policy already allows browser uploads from your app
origin, so direct-to-storage uploads work with no extra configuration.

> **Leave `NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST` empty.** Setting it switches
> Papermark to CloudFront-signed URLs, which MinIO cannot validate. It is only
> for deployments that actually put CloudFront in front of S3.

### `redis` and `redis-http`

Papermark uses `@upstash/redis`, which speaks HTTP rather than the Redis wire
protocol. `redis-http` runs
[serverless-redis-http](https://github.com/hiett/serverless-redis-http), an
Upstash-compatible REST facade, in front of an ordinary Redis container.

That is why `UPSTASH_REDIS_REST_URL` is an `http://` URL and not `redis://`.
The token in `.env` must match `SRH_TOKEN` in `docker-compose.yml`.

Redis backs sign-in codes, rate limiting, and the tus.io bulk-upload lock.

---

## Port conflicts

If another service already holds a port, override it and restart. Compose reads
these from your shell or from `.env`:

| Variable             | Default | Service           |
| -------------------- | ------- | ----------------- |
| `POSTGRES_PORT`      | `5432`  | Postgres          |
| `MINIO_PORT`         | `9000`  | MinIO S3 API      |
| `MINIO_CONSOLE_PORT` | `9001`  | MinIO console     |
| `REDIS_HTTP_PORT`    | `8079`  | Redis REST facade |

For example, if you already run Postgres on 5432:

```shell
POSTGRES_PORT=5433 docker compose up -d
```

Then update the port in `POSTGRES_PRISMA_URL`, `POSTGRES_PRISMA_URL_NON_POOLING`,
and `POSTGRES_PRISMA_SHADOW_URL` in your `.env` to match.

---

## Using managed providers instead

The containers are a convenience, not a lock-in. Each can be swapped for a
hosted equivalent by changing environment variables only.

**Database** — point `POSTGRES_PRISMA_URL` at your provider's pooled connection
string and `POSTGRES_PRISMA_URL_NON_POOLING` at the direct one. Then
`docker compose up -d minio redis redis-http` to skip the local Postgres.

**Storage** — for AWS S3, clear `NEXT_PRIVATE_UPLOAD_ENDPOINT` and
`NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE`, then set the region, buckets, and IAM
credentials. For Cloudflare R2, Backblaze B2, Wasabi, or Hetzner, keep both set
(they all use path-style addressing) and change the endpoint and credentials.

**Redis** — paste your Upstash REST URL and token into
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` and the matching
`_LOCKER_` pair.

---

## What stays external

Papermark boots without any of these. This is what you lose if you skip them:

| Service        | Variables                                                  | Without it                                                                                                                                                              |
| -------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Resend         | `RESEND_API_KEY`                                           | No email at all — email sign-in fails, notifications are dropped. Use Google OAuth to sign in instead.                                                                  |
| Vercel Blob    | `BLOB_READ_WRITE_TOKEN`                                    | Custom branding uploads (team and dataroom logos, banners, link preview images) and visit-report exports fail. **Document storage is unaffected** — that uses MinIO/S3. |
| Tinybird       | `TINYBIRD_TOKEN`                                           | Documents and links work, but analytics pages stay empty.                                                                                                               |
| Trigger.dev    | `TRIGGER_SECRET_KEY`                                       | Background processing stops: PDF-to-image conversion, bulk downloads, notification fan-out.                                                                             |
| Upstash QStash | `QSTASH_TOKEN`, `QSTASH_*_SIGNING_KEY`                     | Queued jobs are not delivered.                                                                                                                                          |
| Google OAuth   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`                 | No Google sign-in button.                                                                                                                                               |
| Hanko          | `HANKO_API_KEY`, `NEXT_PUBLIC_HANKO_TENANT_ID`             | No passkey signup.                                                                                                                                                      |
| Vercel API     | `PROJECT_ID_VERCEL`, `TEAM_ID_VERCEL`, `AUTH_BEARER_TOKEN` | Cannot provision customer custom domains.                                                                                                                               |

For a minimal working instance you need the four containers plus **either**
Resend **or** Google OAuth so you can log in.

Public assets still going through Vercel Blob is a known gap in full
self-hosting: document content was migrated to S3, brand assets were not.

---

## Running in production

The compose file is tuned for local development. Before running it on a server:

**Change every default secret.** `NEXTAUTH_SECRET`, `INTERNAL_API_KEY`,
`NEXT_PRIVATE_DOCUMENT_PASSWORD_KEY`, `MINIO_ROOT_USER` /
`MINIO_ROOT_PASSWORD` (these must stay in sync with
`NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID` / `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`),
and `REDIS_REST_TOKEN`.

**Do not publish the data ports.** Postgres, Redis, and the Redis REST facade
should not be reachable from the internet. Drop their `ports:` mappings and let
containers reach each other over the compose network, or bind them to
`127.0.0.1`.

**Serve MinIO over HTTPS on a real hostname.** Presigned URLs are handed to
browsers, so the endpoint must be publicly resolvable. Put a reverse proxy
(Caddy, nginx, Traefik) in front of MinIO, then set
`NEXT_PRIVATE_UPLOAD_ENDPOINT="https://storage.example.com"`. `next.config.mjs`
adds that origin to the `next/image` allow-list automatically.

**Create a scoped MinIO user.** Do not ship the root credentials to the app.
Create a service account limited to the two buckets and use those keys.

**Back up both stores.** The `papermark-postgres` and `papermark-minio` volumes
hold all of your data. `pg_dump` on a schedule plus `mc mirror` to off-site
storage is the minimum.

**Pin the image tags.** `minio/mc:latest` is used for the one-shot bootstrap
container; pin it to a release tag for reproducible deploys.

---

## Troubleshooting

**`Bind for 0.0.0.0:5432 failed: port is already allocated`**
Another Postgres holds the port. See [Port conflicts](#port-conflicts).

**Uploads fail with `InvalidBucketName`**
`NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE` is not set to `"true"`. MinIO needs
path-style addressing.

**Uploads fail with `AccessDenied` or `SignatureDoesNotMatch`**
`NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID` / `NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY`
in `.env` have drifted from `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` in
`docker-compose.yml`. They must match.

**Downloads return CloudFront errors**
`NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST` is set. Clear it when serving directly
from MinIO.

**Images fail to render with "hostname is not configured under images"**
Restart `npm run dev`. The `next/image` allow-list is built from
`NEXT_PRIVATE_UPLOAD_ENDPOINT` at startup, so it does not pick up `.env`
changes until the server restarts.

**Sign-in silently does nothing**
Either Redis is unreachable (check `docker compose ps redis-http` and the
token) or `RESEND_API_KEY` is missing so the login-code email is never sent.

**`prisma migrate deploy` cannot connect**
The Postgres container is still starting, or the port in `POSTGRES_PRISMA_URL`
does not match the published port. `docker compose ps postgres` should report
`healthy`.

**Starting over.** This destroys all local data:

```shell
docker compose down -v && docker compose up -d && npm run dev:prisma
```
