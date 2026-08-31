import React, { useCallback, useEffect, useState } from "react";
import * as SplashScreenNative from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";

import { ThemeProvider } from "./src/theme/ThemeContext";
import SplashScreen from "./src/screens/SplashScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import OtpVerificationScreen from "./src/screens/OtpVerificationScreen";
import HomeScreen from "./src/screens/HomeScreen";

SplashScreenNative.preventAutoHideAsync();

type Screen = "splash" | "welcome" | "login" | "signup" | "otp" | "home";

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreenNative.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) return null;

  if (screen === "splash") {
    return <SplashScreen onFinish={() => setScreen("welcome")} />;
  }

  if (screen === "welcome") {
    return <WelcomeScreen onLogin={() => setScreen("login")} onSignup={() => setScreen("signup")} />;
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onLoginSuccess={(token) => {
          setAuthToken(token);
          setScreen("home");
        }}
        onGoToSignup={() => setScreen("signup")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupScreen
        onSignupSuccess={({ token, email }) => {
          setAuthToken(token);
          setPendingEmail(email);
          setScreen("otp");
        }}
        onGoToLogin={() => setScreen("login")}
      />
    );
  }

  if (screen === "otp") {
    return (
      <OtpVerificationScreen
        email={pendingEmail}
        onVerified={() => {
          // Verification just confirms the email - it doesn't log the user
          // in. Drop the signup token and send them to the login screen so
          // they sign in explicitly with their new credentials.
          setAuthToken(null);
          setPendingEmail("");
          setScreen("login");
        }}
      />
    );
  }

  return (
    <HomeScreen
      onLogout={() => {
        setAuthToken(null);
        setPendingEmail("");
        setScreen("welcome");
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}
