import React, { useEffect, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, Keyboard, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { changePassword, requestPasswordReset } from "../services/auth";
import InputField from "./InputField";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import GradientButton from "./GradientButton";

type Props = {
  visible: boolean;
  onClose: () => void;
  token: string;
  /** Used for the "forgot password" email, not displayed anywhere in this modal. */
  email: string;
  /** Called after a successful change, once this modal has already closed itself - the parent can show its own confirmation (e.g. SuccessModal). */
  onSuccess: () => void;
};

export default function ChangePasswordModal({ visible, onClose, token, email, onSuccess }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Same fix as MessagesScreen: manual keyboard-height tracking instead
  // of KeyboardAvoidingView, which turned out to still leave inputs
  // covered on some Android devices/keyboards even with "height" behavior.
  useEffect(() => {
    const showEvent = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvent = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function resetLocalState() {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setResetNotice(null);
  }

  function handleClose() {
    resetLocalState();
    onClose();
  }

  async function handleForgotPassword() {
    setResetLoading(true);
    setError("");
    try {
      const result = await requestPasswordReset(email);
      if (result.mockTemporaryPassword) {
        setResetNotice(`${result.message} ${result.mockTemporaryPassword}`);
        // Per the requested flow: the temporary password goes straight
        // into the "old password" field so it can be used immediately.
        setOldPassword(result.mockTemporaryPassword);
      } else {
        setResetNotice(result.message);
      }
    } finally {
      setResetLoading(false);
    }
  }

  async function handleConfirm() {
    setError("");
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError(t("changePassword.fillAllFields"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("changePassword.tooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("changePassword.mismatch"));
      return;
    }

    setLoading(true);
    try {
      const result = await changePassword({ token, oldPassword, newPassword });
      if (result.success) {
        resetLocalState();
        onClose();
        onSuccess();
      } else {
        setError(result.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    // Rendered as a modal so it can pop up over whatever screen the
    // customer currently has open - the side menu is just one way to
    // trigger it, not where it lives.
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      {/* paddingBottom eats into this backdrop's own height, pushing the
          centered card (and the ScrollView's keyboardShouldPersistTaps
          logic) up above the keyboard by its real height, tracked above. */}
      <View style={[styles.backdrop, { paddingBottom: keyboardHeight }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.card, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <View style={styles.headerRow}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.lg }}>
                {t("changePassword.title")}
              </Text>
              <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel={t("common.close")}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <InputField
              label={t("changePassword.oldPassword")}
              icon="lock-closed-outline"
              isPassword
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
            />
            <InputField
              label={t("changePassword.newPassword")}
              icon="lock-closed-outline"
              isPassword
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <PasswordStrengthMeter password={newPassword} />
            <InputField
              label={t("changePassword.confirmPassword")}
              icon="lock-closed-outline"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity onPress={handleForgotPassword} disabled={resetLoading} style={styles.forgotLink}>
              <Text style={{ color: colors.primary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
                {t("changePassword.forgotPassword")}
              </Text>
            </TouchableOpacity>

            {!!resetNotice && (
              <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginBottom: spacing.sm }}>
                {resetNotice}
              </Text>
            )}

            {!!error && (
              <Text style={{ color: colors.error, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginBottom: spacing.sm }}>
                {error}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <GradientButton label={t("changePassword.close")} onPress={handleClose} variant="outline" style={{ flex: 1, marginRight: spacing.sm }} />
              <GradientButton label={t("changePassword.confirm")} onPress={handleConfirm} loading={loading} style={{ flex: 1 }} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  scrollContent: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 380, padding: 24 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  forgotLink: { alignSelf: "flex-end", marginBottom: 12 },
  buttonRow: { flexDirection: "row", marginTop: 8 },
});
