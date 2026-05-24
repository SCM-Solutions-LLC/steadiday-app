const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expoConfig = { ...appJson.expo, ...config };

  if (!expoConfig.android) {
    expoConfig.android = {};
  }
  expoConfig.android.googleServicesFile = process.env.GOOGLE_SERVICES_JSON || "./google-services.json";

  
  expoConfig.plugins = [
    ...(expoConfig.plugins || []),
    [
      "expo-build-properties",
      {
        android: {
          compileSdkVersion: 36,
          buildToolsVersion: "36.0.0"
        }
      }
    ]
  ];

  return expoConfig;
};
