const { withContentlayer } = require('next-contentlayer')


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    minimumCacheTTL: 2592000, // 30 days
    domains: [
      "dknlay9ljaq1f.cloudfront.net", // static images and videos
      "d36r2enbzam0iu.cloudfront.net", // special document pages
      "lh3.googleusercontent.com", // google img
      "dev-to-uploads.s3.amazonaws.com",
      "avatars.githubusercontent.com",// for github oauth
      
      "pbs.twimg.com", // twitter img
      "media.licdn.com", // linkedin img
      "localhost", // local img
      "36so9a8uzykxknsu.public.blob.vercel-storage.com", // staging img
      "yoywvlh29jppecbh.public.blob.vercel-storage.com", // production img
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/mupdf/*": ["./node_modules/mupdf/lib/*.wasm"],
    },
  },
};

module.exports = withContentlayer(nextConfig)
