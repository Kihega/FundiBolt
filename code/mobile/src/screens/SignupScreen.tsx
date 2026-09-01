import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import InputField from "../components/InputField";
import PhoneInput from "../components/PhoneInput";
import PasswordStrengthMeter from "../components/PasswordStrengthMeter";
import GradientButton from "../components/GradientButton";
import SocialButton from "../components/SocialButton";
import Checkbox from "../components/Checkbox";
import BrandWordmark from "../components/BrandWordmark";

export type SignupRole = "customer" | "fundi";

type Props = {
  role: SignupRole;
  onSignupSuccess: (params: { token: string; email: string }) => void;
  onGoToLogin: () => void;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";

const ROLE_LABELS: Record<SignupRole, string> = {
  customer: "Customer",
  fundi: "Technician",
};

export default function SignupScreen({ role, onSignupSuccess, onGoToLogin }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { maxContentWidth } = useResponsive();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Subtle entrance animation for the scrollable fields area - fades and
  // slides in on mount so the "scroll only this part" region reads as an
  // intentional, self-contained panel rather than a plain cut-off list.
  const fieldsOpacity = useRef(new Animated.Value(0)).current;
  const fieldsTranslateY = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fieldsOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.timing(fieldsTranslateY, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
        body: JSON.stringify({ fullName, email, phone: `+255${phone}`, password, role }),
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
      {/* KeyboardAvoidingView shrinks the available height when the keyboard
          opens. Since the header/footer below keep their natural size and
          only the middle fields region is flex:1, that region automatically
          gets less space and scrolls to keep the focused input visible. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.page, { width: "100%", maxWidth: maxContentWidth, alignSelf: "center", paddingHorizontal: spacing.lg }]}>
          {/* Header - always visible, never scrolls */}
          <View style={{ alignItems: "center", paddingTop: spacing.lg, paddingBottom: spacing.md }}>
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
            <View style={[styles.roleBadge, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full, marginTop: spacing.sm }]}>
              <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs }}>
                Signing up as {ROLE_LABELS[role]}
              </Text>
            </View>
          </View>

          {/* Only this middle section scrolls - the input fields and their labels */}
          <View style={styles.scrollRegion}>
            <Animated.View style={{ flex: 1, opacity: fieldsOpacity, transform: [{ translateY: fieldsTranslateY }] }}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                <InputField label="Full Name" icon="person-outline" placeholder="Full Name" value={fullName} onChangeText={setFullName} />
                <InputField label="Email" icon="mail-outline" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
                <PhoneInput value={phone} onChangeText={setPhone} />
                <InputField label="Password" icon="lock-closed-outline" placeholder="Enter Password" isPassword value={password} onChangeText={setPassword} />
                <PasswordStrengthMeter password={password} />
                <InputField label="Confirm Password" icon="lock-closed-outline" placeholder="Confirm Password" isPassword value={confirmPassword} onChangeText={setConfirmPassword} />
              </ScrollView>
            </Animated.View>
          </View>

          {/* Footer - always visible, never scrolls */}
          <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.lg }}>
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
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, marginRight: 6 },
  roleBadge: { paddingHorizontal: 14, paddingVertical: 6 },
  scrollRegion: { flex: 1 },
  scrollContent: { paddingVertical: 4 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
});
