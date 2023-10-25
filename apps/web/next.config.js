/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ["ui"],
  images: {
    minimumCacheTTL: 2592000, // 30 days
    domains: [
      "dknlay9ljaq1f.cloudfront.net", // static images and videos
      "d36r2enbzam0iu.cloudfront.net", // special document pages
      "lh3.googleusercontent.com", // google img
      "dev-to-uploads.s3.amazonaws.com",
      "pbs.twimg.com", // twitter img
      "media.licdn.com", // linkedin img
      "localhost", // local img
      "yoywvlh29jppecbh.public.blob.vercel-storage.com", // production img
    ],
  },
};
