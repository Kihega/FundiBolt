// Converted from app.json to app.config.js so the Google Maps Android API
// key can be sourced from an environment variable (GOOGLE_MAPS_ANDROID_API_KEY
// - see .env.example) rather than hardcoded/committed into the repo -
// plain app.json has no way to reference env vars at all.
//
// IMPORTANT - why the map still won't show real tiles just from adding
// this key: Expo Go is a single pre-built binary shared by every Expo
// project in the world. It has no way to embed YOUR project's specific
// Google Maps API key into its native layer at runtime - native config
// like this can only take effect in a custom build that was actually
// compiled with it baked in. Concretely, that means:
//   - Setting GOOGLE_MAPS_ANDROID_API_KEY below is necessary but NOT
//     sufficient on its own.
//   - You also need to stop using plain "Expo Go" and instead build a
//     development client that includes this project's own native code:
//       npx expo install expo-dev-client
//       eas build --profile development --platform android
//     (or, if you have the Android SDK installed locally instead of using
//     EAS: `npx expo run:android`, which builds and installs a debug
//     dev-client build directly onto a connected device/emulator).
//   - Once installed, you open the project through THAT app instead of
//     Expo Go (Metro will still show the same QR code / dev server -
//     just scan/open it from the dev-client app instead).
// iOS does NOT have this problem: Apple Maps needs no API key at all and
// already renders correctly in plain Expo Go - only Android's Google
// Maps SDK requires this.
module.exports = {
  expo: {
    name: "FundiBolt",
    slug: "fundibolt",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#211C17",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png",
        backgroundColor: "#211C17",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY || "",
        },
      },
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-font",
      [
        "expo-image-picker",
        {
          photosPermission: "FundiBolt needs access to your photos so you can set a profile picture.",
          cameraPermission: "FundiBolt needs access to your camera so you can take a profile picture.",
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission: "FundiBolt needs your location to show nearby technicians and center the map on you.",
        },
      ],
      "expo-splash-screen",
      "expo-status-bar",
    ],
  },
};
