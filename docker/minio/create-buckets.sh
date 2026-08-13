#!/bin/sh
# Creates the buckets Papermark expects inside the local MinIO container.
#
# Runs as a one-shot service from docker-compose.yml after MinIO reports
# healthy. Every step is idempotent, so `docker compose up` can be re-run
# freely.
set -eu

UPLOAD_BUCKET="${UPLOAD_BUCKET:-papermark-documents}"
ARCHIVE_BUCKET="${ARCHIVE_BUCKET:-papermark-archive}"
PUBLIC_BUCKET="${PUBLIC_BUCKET:-papermark-public}"

echo "Connecting to MinIO..."
mc alias set local http://minio:9000 "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

for bucket in "${UPLOAD_BUCKET}" "${ARCHIVE_BUCKET}" "${PUBLIC_BUCKET}"; do
  echo "Ensuring bucket: ${bucket}"
  mc mb --ignore-existing "local/${bucket}"
  # Every bucket stays private, including the public-asset one: brand logos
  # are served through the app's /api/assets route rather than straight from
  # storage, so the object store never needs to be reachable from the internet.
  mc anonymous set none "local/${bucket}"
done

echo "MinIO buckets ready: ${UPLOAD_BUCKET}, ${ARCHIVE_BUCKET}, ${PUBLIC_BUCKET}"
