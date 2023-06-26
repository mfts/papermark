<div align="center">
  <h1 align="center">Papermark</h1>
  <h3>The open-source DocSend alternative.</h3>
</div>

<div align="center">
  <a href="https://www.papermark.io">papermark.io</a>
</div>

<br/>

<div align="center">
  <a href="https://github.com/mfts/papermark/stargazers"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/mfts/papermark"></a>
  <a href="https://twitter.com/mfts0"><img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/mfts0"></a>
  <a href="https://github.com/mfts/papermark/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-AGPLv3-purple"></a>
</div>

<br/>

Papermark is an open-source document sharing alternative to DocSend with built-in analytics. Built with [Vercel Storage](http://vercel.com/storage) and [Vercel Edge Functions](http://vercel.com/edge).



## Features

- **Shareable Links:** Share your document securely by sending a custom link
- **Analytics:** Get insights via document tracking and soon page-by-page analytics
- **Self-hosted, open-source:** Host it yourself and hack on it


## Demo 
![Papermark Welcome GIF](.github/images/papermark-welcome.gif)


## Tech Stack

- [Next.js](https://nextjs.org/) – framework
- [Typescript](https://www.typescriptlang.org/) – language
- [Tailwind](https://tailwindcss.com/) – styling
- [Prisma](https://prisma.io) - orm
- [Vercel Blob](https://vercel.com/storage/blob) - blob storage
- [Vercel Postgres](https://vercel.com/storage/postgres) - database
- [NextAuth.js](https://next-auth.js.org/) – auth
- [Resend](https://resend.com) – email
- [Vercel](https://vercel.com/) – hosting


## Getting Started

### Prerequisites

Here's what you need to be able to run Papermark:

- Node.js (version >= 18)
- PostgreSQL (I use [Vercel Postgres](https://vercel.com/storage/postgres))
- Blob storage (I use [Vercel Blob](https://vercel.com/storage/blob))
- [Google OAuth Client](https://console.cloud.google.com/apis/credentials) (for authentication)
- [Resend](https://resend.com) (for sending emails)

### 1. Clone the repository

```shell
git clone https://github.com/mfts/papermark.git
cd papermark
```

### 2. Install npm dependencies

```shell
npm install
```

### 3. Copy the environment variables to `.env`

```shell
cp .env.example .env
```

### 4. Configure the variables in `.env`

| Variable | Value |
|---|---|
| NEXTAUTH_SECRET | a random string |
| NEXTAUTH_URL | < Your base doamin or localhost:3000 > |
| POSTGRES_PRISMA_URL  | < Vercel Postgres Pooling URL > |
| POSTGRES_URL_NON_POOLING | < Vercel Postgres Non-Pooling URL > |
| BLOB_READ_WRITE_TOKEN | < Vercel Blob Token > |
| GOOGLE_CLIENT_ID | < Google Client ID > |
| GOOGLE_CLIENT_SECRET | < Google Client Secret > |
| RESEND_API_KEY | < Resend API KEY > |
| NEXT_PUBLIC_BASE_URL | < Your base domain or localhost:3000 > |


### 5. Initialize the database

```shell
npx prisma generate
npx prisma db push
```

### 6. Run the dev server

```shell
npm run dev
```

### 7. Open the app in your browser

Visit [http://localhost:3000](http://localhost:3000) in your browser.


## Deploy your own

All you need is a Vercel account and access to Vercel Storage (_Blob_ and _Postgres_). Click the
button below to clone and deploy:

[![Deploy with Vercel](https://vercel.com/button)](https%3A%2F%2Fvercel.com%2Fnew%2Fclone%3Frepository-url%3Dhttps%3A%2F%2Fgithub.com%2Fmfts%2Fpapermark%26env%3DNEXTAUTH_SECRET%2CNEXTAUTH_URL%2CPOSTGRES_PRISMA_URL%2CPOSTGRES_PRISMA_URL_NON_POOLING%2CBLOB_READ_WRITE_TOKEN%2CGOOGLE_CLIENT_ID%2CGOOGLE_CLIENT_SECRET%2CNEXT_PUBLIC_BASE_URL%26envDescription%3DHere%27s%20an%20example%20.env%20for%20all%20variables%20required%26envLink%3Dhttps%3A%2F%2Fgithub.com%2Fmfts%2Fpapermark%2Fblob%2Fmain%2F.env.example%26project-name%3Dmy-awesome-papermark%26repository-name%3Dmy-awesome-papermark%26demo-title%3DPapermark%26demo-description%3DPapermark%20is%20an%20open-source%20document%20sharing%20alternative%20to%20DocSend%20with%20built-in%20analytics.%26demo-url%3Dhttps%3A%2F%2Fwww.papermark.io%26demo-image%3Dhttps%3A%2F%2Fwww.papermark.io%2F_static%2Fpapermark.png)

## Contributing

Papermark is an open-source project and we welcome contributions from the community.

If you'd like to contribute, please fork the repository and make changes as you'd like. Pull requests are warmly welcome.

### Our Contributors ✨

<a href="https://github.com/mfts/papermark/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=mfts/papermark" />
</a>


## Inspiration

...and friends

- [Dub](https://github.com/steven-tey/dub) - An open-source link shortener SaaS with built-in analytics + free custom domains
