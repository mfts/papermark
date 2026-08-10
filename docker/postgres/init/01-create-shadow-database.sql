-- Prisma needs a second, disposable database to diff migrations against when
-- you run `prisma migrate dev`. `prisma migrate deploy` (what `npm run
-- dev:prisma` uses) does not need it, but creating it up front means schema
-- work Just Works without a second container or superuser fiddling.
--
-- This script only runs the first time the Postgres volume is initialised.
SELECT 'CREATE DATABASE papermark_shadow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'papermark_shadow')
\gexec
