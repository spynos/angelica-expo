const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

// Gradle 9.0.0 has a breaking change (IBM_SEMERU removed) that breaks Expo SDK 55
// plugins. Pin to 8.13 until Expo plugins are updated for Gradle 9 compatibility.
const GRADLE_VERSION = '8.13';

module.exports = function withGradleVersion(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const propsPath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle/wrapper/gradle-wrapper.properties'
      );

      let contents = fs.readFileSync(propsPath, 'utf8');
      contents = contents.replace(
        /distributionUrl=.*gradle-.*-bin\.zip/,
        `distributionUrl=https\\://services.gradle.org/distributions/gradle-${GRADLE_VERSION}-bin.zip`
      );
      fs.writeFileSync(propsPath, contents);

      return config;
    },
  ]);
};
