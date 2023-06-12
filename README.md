<div align="center">
    <h1 align="center">Papermark</h1>
    <h5>Open-source alternative to DocSend</h5>
</div>

<div align="center">
  <a href="https://papermark.io">papermark.io</a>
</div>
<br/>

Papermark is an open-source document sharing alternative to DocSend with built-in analytics. Built with [Vercel Storage](http://vercel.com/storage) and [Vercel Edge Functions](http://vercel.com/edge).

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Features

- **Shareable Links:** Share your document securely by sending a link
- **Analytics:** Get analytics via link view tracking and soon page-by-page analytics
- **Self-hosted, open-source:** Host it yourself and hack on it

<br/>

![](public/_static/papermark.png)

## Tech Stack

- [Next.js](https://nextjs.org/) – framework
- [Typescript](https://www.typescriptlang.org/) – language
- [Tailwind](https://tailwindcss.com/) – styling
- [Prisma](https://prisma.io) - orm
- [Vercel Blob](https://vercel.com/storage/blob) - blob storage
- [Vercel Postgres](https://vercel.com/storage/postgres) - database
- [NextAuth.js](https://next-auth.js.org/) – auth
- [Vercel](https://vercel.com/) – hosting

## Deploy your own

All you need is a Vercel account and access to Vercel Storage (_Blob_ and _Postgres_). Click the
button below to clone and deploy:

[![Deploy with Vercel](https://vercel.com/button)](https%3A%2F%2Fvercel.com%2Fnew%2Fclone%3Frepository-url%3Dhttps%3A%2F%2Fgithub.com%2Fmfts%2Fpapermark%26env%3DNEXTAUTH_SECRET%2CNEXTAUTH_URL%2CPOSTGRES_PRISMA_URL%2CPOSTGRES_PRISMA_URL_NON_POOLING%2CBLOB_READ_WRITE_TOKEN%2CGOOGLE_CLIENT_ID%2CGOOGLE_CLIENT_SECRET%2CNEXT_PUBLIC_BASE_URL%26envDescription%3DHere%27s%20an%20example%20.env%20for%20all%20variables%20required%26envLink%3Dhttps%3A%2F%2Fgithub.com%2Fmfts%2Fpapermark%2Fblob%2Fmain%2F.env.example%26project-name%3Dmy-awesome-papermark%26repository-name%3Dmy-awesome-papermark%26demo-title%3DPapermark%26demo-description%3DPapermark%20is%20an%20open-source%20document%20sharing%20alternative%20to%20DocSend%20with%20built-in%20analytics.%26demo-url%3Dhttps%3A%2F%2Fwww.papermark.io%26demo-image%3Dhttps%3A%2F%2Fwww.papermark.io%2F_static%2Fpapermark.png)

## Contributing

Papermark is an open-source project and we welcome contributions from the community.

## Inspiration

...and friends

- [Dub](https://github.com/steven-tey/dub) - An open-source link shortener SaaS with built-in analytics + free custom domains
