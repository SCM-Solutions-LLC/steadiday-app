const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = { ...appJson.expo, ...config };

  if (!expoConfig.android) {
    expoConfig.android = {};
  }
  expoConfig.android.googleServicesFile = "./google-services.json";

  return expoConfig;
};
