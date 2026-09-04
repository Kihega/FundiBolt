import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { getOnlineStatus } from "../utils/onlineStatus";
import { uploadAvatar } from "../services/profile";
import Avatar from "../components/Avatar";
import GradientButton from "../components/GradientButton";

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
  /**
   * Called with the new absolute avatar URL right after a successful
   * upload. This screen doesn't keep its own copy of the avatar in local
   * state anymore - it always renders user.avatarUrl directly, and this
   * callback is how the *shared* user object (held in App.tsx, and handed
   * down to TopBar/SideMenu/AccountScreen alike) gets updated. Previously
   * this screen tracked the new photo in its own local state instead,
   * which is why a freshly-uploaded photo only ever showed up here and
   * never on the top bar's avatar or the side menu until the next login.
   */
  onAvatarUpdated: (avatarUrl: string) => void;
};

// Shared destination for both the side menu's "View Profile" and the
// bottom nav bar's "Account" tab - same screen either way.
export default function AccountScreen({ user, token, onLogout, onAvatarUpdated }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();
  const { isOnline } = getOnlineStatus(user.lastActiveAt);

  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  function openPhotoModal() {
    setPhotoError("");
    setPhotoModalVisible(true);
  }

  function closePhotoModal() {
    if (isUploading) return; // don't let the sheet get dismissed mid-upload
    setPhotoModalVisible(false);
    setPhotoError("");
  }

  // Shared by both pickers below - uploads to POST /api/users/me/avatar
  // (see services/profile.ts) and, on success, hands the real persisted
  // URL up to the parent via onAvatarUpdated rather than storing it here.
  async function handlePickedAsset(asset: ImagePicker.ImagePickerAsset) {
    setUploading(true);
    setPhotoError("");
    const result = await uploadAvatar(token, asset.uri, asset.mimeType || "image/jpeg");
    setUploading(false);

    if (result.success && result.avatarUrl) {
      onAvatarUpdated(result.avatarUrl);
      setPhotoModalVisible(false);
    } else {
      setPhotoError(result.message || t("account.uploadFailed"));
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setPhotoError(t("account.photoPermissionDenied"));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await handlePickedAsset(result.assets[0]);
    }
  }

  async function handleChooseFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError(t("account.photoPermissionDenied"));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      await handlePickedAsset(result.assets[0]);
    }
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={{ width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg }}>
        <View style={styles.avatarSection}>
          <View>
            {/* The green "online" dot uses the same presence logic as the
                top bar's avatar (utils/onlineStatus.ts) - now backed by a
                real lastActiveAt the backend touches on every
                authenticated request (see auth.middleware.ts). */}
            <Avatar uri={user.avatarUrl} name={user.fullName} size={96} isOnline={isOnline} />
            <TouchableOpacity
              onPress={openPhotoModal}
              style={[styles.editBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}
              accessibilityRole="button"
              accessibilityLabel={t("account.uploadPhoto")}
            >
              <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {!user.avatarUrl && (
            <TouchableOpacity onPress={openPhotoModal} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: colors.primary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
                {t("account.uploadPhoto")}
              </Text>
            </TouchableOpacity>
          )}

          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.xl, marginTop: spacing.md }}>
            {user.fullName}
          </Text>

          {/* Makes clear which kind of FundiBolt account this is, since
              Account is now reached from a shared shell rather than a
              screen that only ever showed customers. */}
          <View
            style={[
              styles.roleBadge,
              { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderRadius: radius.full },
            ]}
          >
            <Text style={{ color: colors.primary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs }}>
              {t(`account.roleLabel.${user.role}`)}
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: radius.lg, borderColor: colors.border }]}>
          <DetailRow icon="person-outline" label={t("account.name")} value={user.fullName} />
          <DetailRow icon="mail-outline" label={t("account.email")} value={user.email} />
          <DetailRow icon="call-outline" label={t("account.phone")} value={user.phone || t("account.notProvided")} last />
        </View>

        <GradientButton label={t("account.logout")} onPress={onLogout} variant="outline" style={{ marginTop: spacing.lg }} />
      </View>

      <Modal visible={isPhotoModalVisible} transparent animationType="fade" onRequestClose={closePhotoModal}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
            <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.lg, marginBottom: spacing.md }}>
              {t("account.addPhotoTitle")}
            </Text>

            <TouchableOpacity
              onPress={handleTakePhoto}
              disabled={isUploading}
              style={[styles.pickerOption, { borderColor: colors.border, borderRadius: radius.md, opacity: isUploading ? 0.5 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t("account.takePhoto")}
            >
              <Ionicons name="camera-outline" size={20} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginLeft: spacing.sm }}>
                {t("account.takePhoto")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleChooseFromGallery}
              disabled={isUploading}
              style={[
                styles.pickerOption,
                { borderColor: colors.border, borderRadius: radius.md, marginTop: spacing.sm, opacity: isUploading ? 0.5 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("account.chooseFromGallery")}
            >
              <Ionicons name="images-outline" size={20} color={colors.textPrimary} />
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginLeft: spacing.sm }}>
                {t("account.chooseFromGallery")}
              </Text>
            </TouchableOpacity>

            {isUploading && (
              <View style={styles.uploadingRow}>
                <ActivityIndicator color={colors.primary} />
                <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginLeft: spacing.sm }}>
                  {t("account.uploading")}
                </Text>
              </View>
            )}

            {!!photoError && (
              <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: spacing.sm }}>
                {photoError}
              </Text>
            )}

            <GradientButton label={t("account.cancel")} onPress={closePhotoModal} variant="outline" style={{ marginTop: spacing.md }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  return (
    <View
      style={[
        styles.detailRow,
        !last && { borderBottomWidth: 1, borderBottomColor: colors.border },
        { paddingVertical: spacing.md, paddingHorizontal: spacing.md },
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <View style={{ marginLeft: spacing.sm, flex: 1 }}>
        <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs }}>{label}</Text>
        <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: { alignItems: "center", marginBottom: 24 },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  roleBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  section: { borderWidth: 1, overflow: "hidden" },
  detailRow: { flexDirection: "row", alignItems: "center" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { width: "100%", maxWidth: 360, padding: 20 },
  pickerOption: { flexDirection: "row", alignItems: "center", borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
  uploadingRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
});
