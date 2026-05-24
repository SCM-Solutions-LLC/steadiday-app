const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = { ...appJson.expo, ...config };

  if (!expoConfig.android) {
    expoConfig.android = {};
  }

  // In EAS Build, GOOGLE_SERVICES_JSON can be configured as a secret file
  // environment variable. Expo sets the variable value to the temp file path
  // on the build worker. Locally, keep using the checked-out file.
  expoConfig.android.googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json";

  return expoConfig;
};
