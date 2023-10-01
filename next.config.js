/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "dknlay9ljaq1f.cloudfront.net",
      "lh3.googleusercontent.com",
      "dev-to-uploads.s3.amazonaws.com",
      "pbs.twimg.com", // twitter img
      "d18zd1fdi56ai5.cloudfront.net", // twitter cdn
    ],
  },
};

module.exports = nextConfig
