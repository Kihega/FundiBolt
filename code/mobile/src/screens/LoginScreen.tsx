import React, { useState } from "react";
import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import InputField from "../components/InputField";
import GradientButton from "../components/GradientButton";

type Props = {
  onLoginSuccess: (token: string) => void;
  onGoToSignup: () => void;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!identifier || !password) {
      setError("Please enter your email/phone and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        return;
      }
      onLoginSuccess(data.token);
    } catch (e) {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}>
        <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
          <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.xxl, marginTop: spacing.sm }}>
            Log in
          </Text>
        </View>

        <InputField
          label="Email or Phone"
          icon="person-outline"
          placeholder="Email or phone number"
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <InputField
          label="Password"
          icon="lock-closed-outline"
          placeholder="Enter your password"
          isPassword
          value={password}
          onChangeText={setPassword}
        />

        {!!error && (
          <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
            {error}
          </Text>
        )}

        <GradientButton label="Log in" onPress={handleLogin} loading={loading} />

        <TouchableOpacity onPress={onGoToSignup} style={{ marginTop: spacing.lg, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
            Don't have an account? <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 64, height: 64 },
});
