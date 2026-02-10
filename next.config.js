module.exports = {
  // next.js config
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // PostHog reverse proxy to avoid ad blockers
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  // Required for PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "opencollective.com",
        port: "",
        pathname: "/duostories/contribute/**",
      },
      {
        protocol: "https",
        hostname: "stories-cdn.duolingo.com",
        port: "",
        pathname: "/image/**",
      },
      {
        protocol: "https",
        hostname: "carex.uber.space",
        port: "",
        pathname: "/stories/flags/**",
      },
    ],
  },
};
