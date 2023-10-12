/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["ui"],
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
