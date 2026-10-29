const { withProjectBuildGradle } = require("expo/config-plugins");

// React Native still declares OkHttp 4.9.2, which predates the block on the
// compromised eMudhra intermediate CAs (October 2026). OkHttp 4.12.1 rejects
// them in-client, so force it for devices without an updated Play Services
// trust store. Remove once React Native ships OkHttp >= 4.12.1.
const OKHTTP_VERSION = "4.12.1";
const MARKER = "// withOkHttpVersion";

module.exports = function withOkHttpVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language !== "groovy") {
      throw new Error("withOkHttpVersion only supports Groovy build.gradle");
    }
    if (!config.modResults.contents.includes(MARKER)) {
      config.modResults.contents += `
${MARKER}
allprojects {
  configurations.all {
    resolutionStrategy.force "com.squareup.okhttp3:okhttp:${OKHTTP_VERSION}",
      "com.squareup.okhttp3:okhttp-urlconnection:${OKHTTP_VERSION}"
  }
}
`;
    }
    return config;
  });
};
