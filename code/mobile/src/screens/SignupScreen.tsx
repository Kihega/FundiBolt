import React, { useState } from "react";
import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import InputField from "../components/InputField";
import GradientButton from "../components/GradientButton";

type Props = {
  onSignupSuccess: (token: string) => void;
  onGoToLogin: () => void;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    setError("");
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Signup failed.");
        return;
      }
      onSignupSuccess(data.token);
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
            Signup
          </Text>
        </View>

        <InputField label="Full Name" icon="person-outline" placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <InputField label="Email" icon="mail-outline" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <InputField label="Phone Number" icon="call-outline" placeholder="(012) 345 678" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <InputField label="Password" icon="lock-closed-outline" placeholder="Enter your password" isPassword value={password} onChangeText={setPassword} />
        <InputField label="Confirm Password" icon="lock-closed-outline" placeholder="Confirm your password" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />

        {!!error && (
          <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
            {error}
          </Text>
        )}

        <GradientButton label="Sign up" onPress={handleSignup} loading={loading} />

        <TouchableOpacity onPress={onGoToLogin} style={{ marginTop: spacing.lg, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
            Already have an account? <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 64, height: 64 },
});
