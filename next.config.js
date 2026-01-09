const withPWA = require("next-pwa")({
  dest: "public",
});

module.exports = withPWA({
  // next.js config
  compiler: {
    styledComponents: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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
});
