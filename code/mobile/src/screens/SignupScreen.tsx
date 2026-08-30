import React, { useState } from "react";
import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import InputField from "../components/InputField";
import PhoneInput from "../components/PhoneInput";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import GradientButton from "../components/GradientButton";
import SocialButton from "../components/SocialButton";
import Checkbox from "../components/Checkbox";
import BrandWordmark from "../components/BrandWordmark";

type Props = {
  onSignupSuccess: (params: { token: string; email: string }) => void;
  onGoToLogin: () => void;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function SignupScreen({ onSignupSuccess, onGoToLogin }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const { maxContentWidth } = useResponsive();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister() {
    setError("");
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Services to continue.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone: `+255${phone}`, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Registration failed.");
        return;
      }

      await fetch(`${API_URL}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      onSignupSuccess({ token: data.token, email });
    } catch (e) {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg }}>
          <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <View style={{ marginTop: spacing.sm }}>
              <BrandWordmark size={fontSize.xxl} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fontFamily.headingSemiBold,
                fontSize: fontSize.xl,
                marginTop: spacing.md,
              }}
            >
              Start your Journey
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamily.bodyRegular,
                fontSize: fontSize.sm,
                marginTop: 4,
              }}
            >
              Enter your Register information
            </Text>
          </View>

          <InputField label="Full Name" icon="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
          <InputField label="Email" icon="mail-outline" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <PhoneInput value={phone} onChangeText={setPhone} />
          <InputField label="Password" icon="lock-closed-outline" placeholder="Enter Password" isPassword value={password} onChangeText={setPassword} />
          <PasswordStrengthMeter password={password} />
          <InputField label="Confirm Password" icon="lock-closed-outline" placeholder="Confirm Password" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />

          <Checkbox
            checked={agreed}
            onToggle={() => setAgreed(!agreed)}
            label={
              <Text>
                I agree to the <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Terms of Services</Text>
              </Text>
            }
          />

          {!!error && (
            <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm }}>
              {error}
            </Text>
          )}

          <GradientButton label="Register" onPress={handleRegister} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginHorizontal: spacing.sm }}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SocialButton provider="google" onPress={() => {}} />
            <SocialButton provider="apple" onPress={() => {}} />
          </View>

          <TouchableOpacity onPress={onGoToLogin} style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
              Already have an account? <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  logo: { width: 64, height: 64 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
});
