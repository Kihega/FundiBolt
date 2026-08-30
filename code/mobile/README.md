# FundiBolt Mobile App

Not yet scaffolded. This will be an Expo (React Native + TypeScript) app.

## To scaffold (run once, from code/mobile):

    cd code/mobile
    npx create-expo-app@latest . --template blank-typescript

## After scaffolding

    cp .env.example .env
    npx expo start

## Building (via EAS, cloud build - no local Android SDK needed)

    npm install -g eas-cli
    eas login
    eas build:configure
    eas build --platform android --profile preview
