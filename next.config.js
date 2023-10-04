/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "dknlay9ljaq1f.cloudfront.net",
      "lh3.googleusercontent.com", // google img
      "dev-to-uploads.s3.amazonaws.com",
      "pbs.twimg.com", // twitter img
      "media.licdn.com", // linkedin img
    ],
  },
};

module.exports = nextConfig
