/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  images: {
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: [
      {
        // static images and videos
        protocol: "https",
        hostname: "dknlay9ljaq1f.cloudfront.net",
      },
      {
        // special document pages
        protocol: "https",
        hostname: "d36r2enbzam0iu.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "dev-to-uploads.s3.amazonaws.com",
      },
      {
        // twitter img
        protocol: "https",
        hostname: "pbs.twimg.com",
      },
      {
        // linkedin img
        protocol: "https",
        hostname: "media.licdn.com",
      },
      {
        // google img
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        // local img
        protocol: "https",
        hostname: "localhost",
        port: "3000",
      },
      {
        // staging img
        protocol: "https",
        hostname: "36so9a8uzykxknsu.public.blob.vercel-storage.com",
      },
      {
        // production img
        protocol: "https",
        hostname: "yoywvlh29jppecbh.public.blob.vercel-storage.com",
      },
      {
        // development / staging hosted user img
        protocol: "https",
        hostname: "d16lliwzxm242j.cloudfront.net",
      },
      {
        // production hosted user img
        protocol: "https",
        hostname: "d1ff41ind5a7r1.cloudfront.net",
      },
    ],
  },
  experimental: {
    outputFileTracingIncludes: {
      "/api/mupdf/*": ["./node_modules/mupdf/lib/*.wasm"],
    },
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
