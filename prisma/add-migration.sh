#!/bin/bash

# Default values
NAME=""
USER=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --name)
            NAME="$2"
            shift 2
            ;;
        --user)
            USER="$2"
            shift 2
            ;;
        *)
            echo "Unknown parameter: $1"
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$NAME" ]; then
    echo "Please provide a migration name"
    echo "Usage: ./add-migration.sh --name <migration_name> --user <database_user>"
    exit 1
fi

if [ -z "$USER" ]; then
    echo "Please provide a database user"
    echo "Usage: ./add-migration.sh --name <migration_name> --user <database_user>"
    exit 1
fi

# Get current date in YYYYMMDD000000 format (midnight of current day)
date=$(date +%Y%m%d)000000

# Create migration name with date prefix
migration_name="${date}_${NAME}"

# Create migration directory
mkdir -p "prisma/migrations/${migration_name}" || {
    echo "Failed to create migration directory"
    exit 1
}

# Generate migration
npx prisma migrate diff \
    --from-migrations prisma/migrations \
    --to-schema-datasource prisma/schema \
    --shadow-database-url "postgresql://${USER}@localhost:5432/papermark-shadow-db" \
    --script > "prisma/migrations/${migration_name}/migration.sql" || {
    echo "Failed to generate migration"
    exit 1
}

# Apply migration
npx prisma migrate resolve --applied "${migration_name}" || {
    echo "Failed to apply migration"
    exit 1
}

echo "Migration ${migration_name} created and applied successfully"



