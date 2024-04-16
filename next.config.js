const withPWA = require("next-pwa")({
  dest: "public",
});

module.exports = withPWA({
  // next.js config
  compiler: {
    styledComponents: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "opencollective.com",
        port: "",
        pathname: "/duostories/contribute/**",
      },
    ],
  },
});
