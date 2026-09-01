import React, { useEffect, useRef, useState } from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import { useResponsive } from "../theme/responsive";
import OtpInput from "../components/OtpInput";
import GradientButton from "../components/GradientButton";
import BrandWordmark from "../components/BrandWordmark";
import SuccessModal from "../components/SuccessModal";

type Props = {
  email: string;
  onVerified: () => void;
};

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
const RESEND_COOLDOWN = 30;
const OTP_LENGTH = 6;

export default function OtpVerificationScreen({ email, onVerified }: Props) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  const { maxContentWidth } = useResponsive();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/otp/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not resend code.");
        return;
      }
      startCooldown();
    } catch (e) {
      setError("Network error. Check your connection and try again.");
    }
  }

  async function handleVerify() {
    setError("");
    if (code.length !== OTP_LENGTH) {
      setError("Enter the code.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Invalid or expired code.");
        return;
      }
      setShowSuccess(true);
    } catch (e) {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
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
            Verify Code
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
            Please enter the code we just sent to{"\n"}{email}
          </Text>
        </View>

        <OtpInput length={OTP_LENGTH} onChange={setCode} />

        {!!error && (
          <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.md, textAlign: "center" }}>
            {error}
          </Text>
        )}

        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0} style={{ marginTop: spacing.lg, alignItems: "center" }}>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm }}>
            Don't receive OTP?{" "}
            <Text style={{ color: cooldown > 0 ? colors.textMuted : colors.primary, fontFamily: fontFamily.bodySemiBold }}>
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </Text>
          </Text>
        </TouchableOpacity>

        <GradientButton label="Verify" onPress={handleVerify} loading={loading} style={{ marginTop: spacing.xl }} />
      </View>

      <SuccessModal
        visible={showSuccess}
        title="Success!"
        message="Your account was successfully created. Now you can log in with your username and password."
        buttonLabel="OK"
        onClose={() => {
          setShowSuccess(false);
          onVerified();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center" },
  logo: { width: 44, height: 44, marginRight: 6 },
});
