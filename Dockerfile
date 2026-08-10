# Papermark application image for self-hosted deployments.
#
# Built and run by the `app` service in docker-compose.yml. See
# docs/self-hosting.md for the deployment walkthrough.

FROM node:24-alpine

# openssl is required by Prisma; libc6-compat smooths over musl differences.
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies first so edits to source do not invalidate this layer.
# --ignore-scripts skips the postinstall prisma generate, which we run below
# once the schema has been copied in.
COPY package.json package-lock.json ./
# This install pulls ~2GB; give npm room to survive a flaky network rather
# than failing the whole build on one dropped connection.
RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 180000 \
 && npm config set fetch-timeout 600000 \
 && npm ci --ignore-scripts --no-audit --no-fund

COPY prisma ./prisma
RUN npx prisma generate

COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so
# they have to be present now rather than at container start.
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_MARKETING_URL
ARG NEXT_PUBLIC_APP_BASE_HOST
ARG NEXT_PUBLIC_UPLOAD_TRANSPORT
ARG NEXT_PUBLIC_HANKO_TENANT_ID
ARG NEXT_PUBLIC_WEBHOOK_BASE_URL
ARG NEXT_PUBLIC_WEBHOOK_BASE_HOST
ARG NEXT_PRIVATE_UPLOAD_ENDPOINT
ARG NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST

ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_MARKETING_URL=$NEXT_PUBLIC_MARKETING_URL \
    NEXT_PUBLIC_APP_BASE_HOST=$NEXT_PUBLIC_APP_BASE_HOST \
    NEXT_PUBLIC_UPLOAD_TRANSPORT=$NEXT_PUBLIC_UPLOAD_TRANSPORT \
    NEXT_PUBLIC_HANKO_TENANT_ID=$NEXT_PUBLIC_HANKO_TENANT_ID \
    NEXT_PUBLIC_WEBHOOK_BASE_URL=$NEXT_PUBLIC_WEBHOOK_BASE_URL \
    NEXT_PUBLIC_WEBHOOK_BASE_HOST=$NEXT_PUBLIC_WEBHOOK_BASE_HOST \
    NEXT_PRIVATE_UPLOAD_ENDPOINT=$NEXT_PRIVATE_UPLOAD_ENDPOINT \
    NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST=$NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

# Apply any pending migrations before serving, so a fresh volume comes up
# fully initialised without a manual step.
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
