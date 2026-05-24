const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = { ...appJson.expo, ...config };

  if (!expoConfig.android) {
    expoConfig.android = {};
  }
  expoConfig.android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON || "./google-services.json";

  return expoConfig;
};
