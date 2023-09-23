/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "dknlay9ljaq1f.cloudfront.net",
      "lh3.googleusercontent.com",
      "dev-to-uploads.s3.amazonaws.com",
    ],
  },
};

module.exports = nextConfig
