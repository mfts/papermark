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
        hostname: "assets.papermark.io",
      },
      {
        // user-shared documents and files
        protocol: "https",
        hostname: process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST ?? "",
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
        protocol: "http",
        hostname: "localhost",
        port: "3000",
      },
      {
        // papermark img
        protocol: "https",
        hostname: "www.papermark.io",
      },
      {
        // special document pages
        protocol: "https",
        hostname: "d36r2enbzam0iu.cloudfront.net",
      },
      {
        // staging vercel blob
        protocol: "https",
        hostname: "36so9a8uzykxknsu.public.blob.vercel-storage.com",
      },
      {
        // production vercel blob
        protocol: "https",
        hostname: "yoywvlh29jppecbh.public.blob.vercel-storage.com",
      },
      {
        // blog images
        protocol: "https",
        hostname: "aicontentfy-customer-images.s3.eu-central-1.amazonaws.com",
      },
      {
        // also blog images
        protocol: "https",
        hostname: "dev-to-uploads.s3.amazonaws.com",
      },
    ],
  },
  transpilePackages: ["@trigger.dev/react"],
  skipTrailingSlashRedirect: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/mupdf/*": ["./node_modules/mupdf/lib/*.wasm"],
    },
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
