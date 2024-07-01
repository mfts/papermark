/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
  images: {
    minimumCacheTTL: 2592000, // 30 days
    remotePatterns: prepareRemotePatterns(),
  },
  transpilePackages: ["@trigger.dev/react"],
  skipTrailingSlashRedirect: true,
  experimental: {
    outputFileTracingIncludes: {
      "/api/mupdf/*": ["./node_modules/mupdf/lib/*.wasm"],
    },
    missingSuspenseWithCSRBailout: false,
  },
  async redirects() {
    return [
      {
        source: "/view/d/:path*",
        destination: "/view/:path*",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ai-pitch-deck-generator/:path*",
        destination: "https://deck.papermark.io/:path*",
      },
    ];
  },
};

function prepareRemotePatterns() {
  let patterns = [
    // static images and videos
    { protocol: "https", hostname: "assets.papermark.io" },
    // twitter img
    { protocol: "https", hostname: "pbs.twimg.com" },
    // linkedin img
    { protocol: "https", hostname: "media.licdn.com" },
    // google img
    { protocol: "https", hostname: "lh3.googleusercontent.com" },
    // papermark img
    { protocol: "https", hostname: "www.papermark.io" },
    // special document pages
    { protocol: "https", hostname: "d36r2enbzam0iu.cloudfront.net" },
    // blog images
    {
      protocol: "https",
      hostname: "aicontentfy-customer-images.s3.eu-central-1.amazonaws.com",
    },
    // also blog images
    { protocol: "https", hostname: "dev-to-uploads.s3.amazonaws.com" },
  ];

  if (process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST) {
    patterns.push({
      protocol: "https",
      hostname: process.env.NEXT_PRIVATE_UPLOAD_DISTRIBUTION_HOST,
    });
  }

  if (process.env.VERCEL_ENV === "production") {
    patterns.push({
      // production vercel blob
      protocol: "https",
      hostname: "yoywvlh29jppecbh.public.blob.vercel-storage.com",
    });
  }

  if (
    process.env.VERCEL_ENV === "preview" ||
    process.env.NODE_ENV === "development"
  ) {
    patterns.push({
      // staging vercel blob
      protocol: "https",
      hostname: "36so9a8uzykxknsu.public.blob.vercel-storage.com",
    });
  }

  return patterns;
}

export default nextConfig;
