module.exports = {
  // next.js config
  compiler: {
    styledComponents: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // PostHog reverse proxy configuration
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
  // Required to support PostHog trailing slash API requests
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
