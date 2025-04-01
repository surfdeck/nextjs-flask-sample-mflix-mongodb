/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["m.media-amazon.com"], // Allow Amazon images
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination:
          process.env.NODE_ENV === "development"
            ? "http://127.0.0.1:5328/api/:path*"
            : "/api/",
      },
    ];
  },
};

module.exports = nextConfig;
