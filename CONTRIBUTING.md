# Contributing to Papermark

First off, thank you for considering contributing to Papermark! It's people like you that make Papermark such a great open-source project. This document provides a detailed guide on how to set up the project locally for development, branch naming conventions, PR guidelines, and more.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Local Development Setup](#local-development-setup)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Tinybird Analytics Setup (Optional)](#tinybird-analytics-setup-optional)
- [Development Workflow](#development-workflow)
- [Linting and Formatting](#linting-and-formatting)
- [Submitting a Pull Request](#submitting-a-pull-request)

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct and treat everyone with respect and kindness.

## Local Development Setup

### Prerequisites

Please make sure you have the following installed to run Papermark locally:

- **Node.js**: version `>=24` (as specified in package.json engines). We recommend using `nvm` or `fnm` for managing Node versions.
- **npm**: We use npm to manage dependencies.
- **PostgreSQL Database**: You can run it locally (e.g., using Docker) or use a managed service like Supabase, Neondb, or Vercel Postgres.
- **Blob storage**: For storing documents (AWS S3 or Vercel Blob).

### 1. Fork and clone the repository

First, fork the `<github.com/mfts/papermark>` repository to your own GitHub account. Then clone your fork locally:

```shell
git clone https://github.com/<YOUR-USERNAME>/papermark.git
cd papermark
```

### 2. Install Dependencies

```shell
npm install
```

### 3. Environment Variables

Create your local `.env` file from the `.env.example`:

```shell
cp .env.example .env
```

Open `.env` and fill the variables. At the bare minimum, for local development you will need:
- `POSTGRES_PRISMA_URL`: Connection string to your Postgres database.
- `POSTGRES_PRISMA_URL_NON_POOLING`: For direct connections.
- Authentication secrets (`NEXTAUTH_SECRET`, etc.).
- `BLOB_READ_WRITE_TOKEN`: If testing the default Vercel blob transport (otherwise setup S3 config keys).

*Important note on External Services:*
- Add your **Google Auth keys** (`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`) if testing authentication.
- Add your **Resend** key (`RESEND_API_KEY`) for email capabilities.
- Add your **Stripe keys** (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, etc.) if developing payment features.
- If you don't need to test these specific features, you can often leave them with the provided dummy values to prevent runtime crashes.

### 4. Database Setup

Once you have your PostgreSQL database connection strings set in `.env`, initialize the schemas and Prisma:

```shell
npm run dev:prisma
```
This script runs:
1. `prisma generate` (generates the Prisma Client)
2. `prisma migrate deploy` (applies the schema migrations to the DB)

### 5. Running the App

Start the Next.js development server:

```shell
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the application frontend and start developing!

## Tinybird Analytics Setup (Optional)

If you are working on the analytics module, to prepare the Tinybird database, follow these steps:

0. We use `pipenv` to manage our Python dependencies. If you don't have it installed, you can install it using the following command:
   ```sh
   pkgx pipenv
   ```
1. Download the Tinybird CLI from [here](https://www.tinybird.co/docs/cli.html) and install it on your system.
2. After authenticating with the Tinybird CLI, navigate to the `lib/tinybird` directory:
   ```sh
   cd lib/tinybird
   ```
3. Push the necessary data sources using the following command:
   ```sh
   tb push datasources/*
   tb push endpoints/get_*
   ```
4. Don't forget to set the `TINYBIRD_TOKEN` with the appropriate rights in your `.env` file.

#### Updating Tinybird

```sh
pipenv shell
## start: pkgx-specific
cd ..
cd papermark
## end: pkgx-specific
pipenv update tinybird-cli
```

## Development Workflow

1. **Fork the repo** and create your branch from `main`.
2. **Branch Naming**: Use a descriptive prefix to help structure the work:
   - `feat/add-new-button`
   - `fix/login-crash`
   - `docs/update-readme`
   - `chore/update-deps`
3. **Commit Messages**: We recommend following [Conventional Commits](https://www.conventionalcommits.org/); keep them clear and descriptive (e.g., `feat(ui): add new banner`).
4. Keep PRs small and focused on one task or feature. 

## Linting and Formatting

We use Prettier and ESLint. Please ensure your code passes checks before opening a pull request.

- Check linting: `npm run lint`
- Format code: `npm run format` (runs `prettier --write "**/*.{js,jsx,ts,tsx,mdx}"`)

It is highly recommended to set up format-on-save in your editor (VSCode Plugin for Prettier) to avoid formatting issues.

## Submitting a Pull Request

1. Push your branch to your fork.
2. Open a Pull Request against the `main` branch.
3. Review the PR template and provide necessary context/screenshots if UI changes were made.
4. Wait for a code review and address any feedback!

---

**Thanks again for your interest in making Papermark better! 🚀**
