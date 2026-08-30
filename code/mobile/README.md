# FundiBolt Mobile App

React Native (Expo, TypeScript) app for customers and fundis.

## Setup

    cd code/mobile
    npm install
    cp .env.example .env   # point EXPO_PUBLIC_API_URL at your backend
    npx expo start

Scan the QR code with the Expo Go app (SDK 54) to run on a physical device,
or press `a` for Android emulator / `w` for web preview.

## Environment Variables

| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Base URL of the FundiBolt backend API |

Note: Expo only exposes env vars prefixed with `EXPO_PUBLIC_` to the app
at runtime — anything without that prefix stays server-side only (not
applicable here since this is a pure client app, but keep it in mind if
you add any build-time secrets later).

## Building (via EAS — cloud build, no local Android SDK needed)

    npm install -g eas-cli
    eas login
    eas build:configure
    eas build --platform android --profile preview

## Notes

- `.env` is gitignored — never commit real values.
- Built with `create-expo-app` blank-typescript template on SDK 54.
