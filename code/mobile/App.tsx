import React, { useCallback, useEffect, useState } from "react";
import * as SplashScreenNative from "expo-splash-screen";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemeProvider } from "./src/theme/ThemeContext";
import { LanguageProvider } from "./src/theme/LanguageContext";
import SplashScreen from "./src/screens/SplashScreen";
import WelcomeScreen from "./src/screens/WelcomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen, { SignupRole } from "./src/screens/SignupScreen";
import OtpVerificationScreen from "./src/screens/OtpVerificationScreen";
import HomeScreen from "./src/screens/HomeScreen";
import CustomerHomeScreen from "./src/screens/CustomerHomeScreen";
import { AuthUser } from "./src/types/user";

SplashScreenNative.preventAutoHideAsync();

type Screen = "splash" | "welcome" | "login" | "signup" | "otp" | "home";

function Root() {
  const [screen, setScreen] = useState<Screen>("splash");
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [pendingRole, setPendingRole] = useState<SignupRole>("customer");

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
    return (
      <WelcomeScreen
        onLogin={() => setScreen("login")}
        onSignup={(role) => {
          setPendingRole(role);
          setScreen("signup");
        }}
      />
    );
  }

  if (screen === "login") {
    return (
      <LoginScreen
        onLoginSuccess={({ token, user }) => {
          setAuthToken(token);
          setAuthUser(user);
          setScreen("home");
        }}
        onGoToSignup={() => setScreen("welcome")}
      />
    );
  }

  if (screen === "signup") {
    return (
      <SignupScreen
        role={pendingRole}
        onSignupSuccess={({ email }) => {
          // Signup no longer returns a token here - the backend now
          // stages the submitted details and sends an OTP instead of
          // creating the account immediately (see auth.controller.ts's
          // signup()). There's nothing to log in with yet; the real
          // account (and its token) only exists once verifyOtp below
          // completes it.
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
        onBack={() => setScreen("signup")}
      />
    );
  }

  const handleLogout = () => {
    setAuthToken(null);
    setAuthUser(null);
    setPendingEmail("");
    setScreen("welcome");
  };

  // Keeps authUser - the one shared source of truth every screen reads
  // its avatar from (TopBar, SideMenu, AccountScreen all get it via this
  // same object) - in sync the moment a new photo finishes uploading.
  // AccountScreen used to track the new URL in its own local state
  // instead, which is why the top bar and side menu never picked up a
  // freshly-uploaded photo until the next full login.
  const handleAvatarUpdated = (avatarUrl: string) => {
    setAuthUser((prev) => (prev ? { ...prev, avatarUrl } : prev));
  };

  // Role-based home routing. Only the customer dashboard is built this
  // sprint - fundi (technician) and admin each get their own home screen in
  // a later sprint (admin's is a separate web dashboard entirely, per the
  // product plan). Both fall back to the generic placeholder for now.
  if (authUser?.role === "customer" && authToken) {
    return (
      <CustomerHomeScreen user={authUser} token={authToken} onLogout={handleLogout} onAvatarUpdated={handleAvatarUpdated} />
    );
  }

  return <HomeScreen onLogout={handleLogout} />;
}

export default function App() {
  return (
    // Required by react-native-gesture-handler (used by
    // components/SwipeToDelete.tsx, for the swipe-to-delete gesture in
    // MessagesScreen) - without this wrapper, gesture handlers silently
    // don't work.
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Required by react-native-safe-area-context, which CustomerHomeScreen
          now uses for its SafeAreaView (the plain react-native SafeAreaView
          only computes insets on iOS - this one works correctly on Android
          too, needed now that app.json has android.edgeToEdgeEnabled set). */}
      <SafeAreaProvider>
        {/* LanguageProvider sits above ThemeProvider so both are available to
            every screen; CustomerHomeScreen and its children (SideMenu,
            AccountScreen, BookingsScreen, MessagesScreen, etc.) read from it
            via useLanguage() to switch between English and Swahili. */}
        <LanguageProvider>
          <ThemeProvider>
            <Root />
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
