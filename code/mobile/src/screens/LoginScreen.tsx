import React, { useState } from "react";
import { View, Image, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import InputField from "../components/InputField";
import PhoneInput from "../components/PhoneInput";
import GradientButton from "../components/GradientButton";
import SocialButton from "../components/SocialButton";
import Checkbox from "../components/Checkbox";
import BrandWordmark from "../components/BrandWordmark";

type Props = {
  onLoginSuccess: (token: string) => void;
  onGoToSignup: () => void;
};

type LoginMethod = "email" | "phone";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginScreen({ onLoginSuccess, onGoToSignup }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { maxContentWidth } = useResponsive();

  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    const identifier = method === "email" ? email : `+255${phone}`;
    if (!identifier || !password) {
      setError(`Please enter your ${method === "email" ? "email" : "phone number"} and password.`);
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={{ width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg }}>
          <View style={{ alignItems: "center", marginBottom: spacing.lg }}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
              <BrandWordmark size={fontSize.xxl} />
            </View>
            <Text
              style={{
                color: colors.textPrimary,
                fontFamily: fontFamily.headingSemiBold,
                fontSize: fontSize.xl,
                marginTop: spacing.md,
                textAlign: "center",
              }}
            >
              Welcome Back To FundiBolt
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: fontFamily.bodyRegular,
                fontSize: fontSize.sm,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Enter valid email & password to continue
            </Text>
          </View>

          <View style={[styles.toggleRow, { backgroundColor: colors.surface, borderRadius: radius.full, borderColor: colors.border }]}>
            <TouchableOpacity
              onPress={() => setMethod("email")}
              style={[styles.toggleButton, { borderRadius: radius.full, backgroundColor: method === "email" ? colors.primary : "transparent" }]}
            >
              <Text style={{ color: method === "email" ? "#FFFFFF" : colors.textSecondary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.sm }}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMethod("phone")}
              style={[styles.toggleButton, { borderRadius: radius.full, backgroundColor: method === "phone" ? colors.primary : "transparent" }]}
            >
              <Text style={{ color: method === "phone" ? "#FFFFFF" : colors.textSecondary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.sm }}>
                Phone
              </Text>
            </TouchableOpacity>
          </View>

          {method === "email" ? (
            <InputField label="Email" icon="mail-outline" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          ) : (
            <PhoneInput value={phone} onChangeText={setPhone} />
          )}

          <InputField label="Password" icon="lock-closed-outline" placeholder="Enter Password" isPassword value={password} onChangeText={setPassword} />

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Checkbox checked={rememberMe} onToggle={() => setRememberMe(!rememberMe)} label="Remember me" />
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
                Forget Password?
              </Text>
            </TouchableOpacity>
          </View>

          {!!error && (
            <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm }}>
              {error}
            </Text>
          )}

          <GradientButton label="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.lg }} />

          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginHorizontal: spacing.sm }}>OR</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <SocialButton provider="google" onPress={() => {}} />
            <SocialButton provider="apple" onPress={() => {}} />
          </View>

          <TouchableOpacity onPress={onGoToSignup} style={{ marginTop: spacing.lg, alignItems: "center" }}>
            <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
              Haven't any account? <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold }}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, marginRight: 6 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  toggleRow: { flexDirection: "row", borderWidth: 1, padding: 4, marginBottom: 16 },
  toggleButton: { flex: 1, alignItems: "center", paddingVertical: 8 },
});
