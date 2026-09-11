import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { AuthUser } from "../types/user";
import { updateTechnicianProfile, uploadIdDocument } from "../services/technicianProfile";
import Avatar from "../components/Avatar";
import GradientButton from "../components/GradientButton";
import InputField from "../components/InputField";

type Props = {
  user: AuthUser;
  token: string;
  onLogout: () => void;
  onAvatarUpdated: (avatarUrl: string) => void;
  /** Bubbles the full updated technician fields up to App.tsx's shared user state, same pattern as onAvatarUpdated. */
  onProfileUpdated: (patch: Partial<AuthUser>) => void;
};

const QUALIFICATION_THRESHOLD = 90;

// Mirrors the backend's weighted rubric (utils/qualification.ts) purely
// for display - the backend remains the single source of truth for the
// actual stored score, this is just what lets the checklist render
// instantly from whatever's already in `user` without waiting on a
// round-trip after every keystroke.
function checklistItems(u: {
  avatarUrl?: string | null;
  idDocumentUrl?: string | null;
  specialty?: string | null;
  skills?: string[];
  bio?: string | null;
  hourlyRate?: number | null;
  yearsExperience?: number | null;
  phone?: string | null;
}) {
  return [
    { key: "photo", icon: "camera-outline" as const, weight: 15, complete: !!u.avatarUrl },
    { key: "idDocument", icon: "shield-checkmark-outline" as const, weight: 20, complete: !!u.idDocumentUrl },
    { key: "specialty", icon: "construct-outline" as const, weight: 10, complete: !!u.specialty },
    { key: "skills", icon: "ribbon-outline" as const, weight: 15, complete: (u.skills?.length ?? 0) >= 3 },
    { key: "bio", icon: "document-text-outline" as const, weight: 15, complete: (u.bio?.length ?? 0) >= 50 },
    { key: "hourlyRate", icon: "cash-outline" as const, weight: 10, complete: !!u.hourlyRate },
    { key: "yearsExperience", icon: "time-outline" as const, weight: 5, complete: u.yearsExperience != null },
    { key: "phone", icon: "call-outline" as const, weight: 10, complete: !!u.phone },
  ];
}

export default function TechnicianProfileScreen({ user, token, onLogout, onAvatarUpdated, onProfileUpdated }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();
  const { t } = useLanguage();
  const { maxContentWidth } = useResponsive();

  const [specialty, setSpecialty] = useState(user.specialty || "");
  const [skillsInput, setSkillsInput] = useState((user.skills || []).join(", "));
  const [bio, setBio] = useState(user.bio || "");
  const [hourlyRate, setHourlyRate] = useState(user.hourlyRate != null ? String(user.hourlyRate) : "");
  const [yearsExperience, setYearsExperience] = useState(user.yearsExperience != null ? String(user.yearsExperience) : "");

  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const items = checklistItems(user);
  const score = user.qualificationScore ?? 0;
  const qualifies = score >= QUALIFICATION_THRESHOLD;

  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const cardsTranslateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // driving a width percentage, not a transform
    }).start();
    Animated.parallel([
      Animated.timing(cardsOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(cardsTranslateY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [score]);

  async function handleSave() {
    setError("");
    setNotice("");
    setSaving(true);

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const rate = hourlyRate.trim() ? Number(hourlyRate) : undefined;
    const years = yearsExperience.trim() ? Number(yearsExperience) : undefined;

    if (hourlyRate.trim() && (!Number.isFinite(rate) || (rate as number) < 0)) {
      setError("Hourly rate must be a valid non-negative number.");
      setSaving(false);
      return;
    }
    if (yearsExperience.trim() && (!Number.isInteger(years) || (years as number) < 0)) {
      setError("Years of experience must be a whole number.");
      setSaving(false);
      return;
    }

    const result = await updateTechnicianProfile(token, {
      specialty: specialty.trim(),
      skills,
      bio: bio.trim(),
      ...(rate !== undefined ? { hourlyRate: rate } : {}),
      ...(years !== undefined ? { yearsExperience: years } : {}),
    });

    setSaving(false);
    if (!result.success || !result.user) {
      setError(result.message || "Could not save your profile.");
      return;
    }

    onProfileUpdated({
      specialty: result.user.specialty,
      skills: result.user.skills,
      bio: result.user.bio,
      hourlyRate: result.user.hourlyRate,
      yearsExperience: result.user.yearsExperience,
      qualificationScore: result.user.qualificationScore,
    });
    setNotice(t("techProfile.saved"));
  }

  async function handleUploadId() {
    setError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Photo library permission is required to upload your ID.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingId(true);
    const asset = result.assets[0];
    const uploadResult = await uploadIdDocument(token, asset.uri, asset.mimeType || "image/jpeg");
    setUploadingId(false);

    if (!uploadResult.success || !uploadResult.user) {
      setError(uploadResult.message || "Could not upload your ID document.");
      return;
    }
    onProfileUpdated({
      idDocumentUrl: uploadResult.user.idDocumentUrl,
      qualificationScore: uploadResult.user.qualificationScore,
    });
  }

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  const progressColor = qualifies ? colors.success : score >= 60 ? colors.warning : colors.error;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={{ width: "100%", maxWidth: maxContentWidth, alignSelf: "center", padding: spacing.lg }}>
        {/* Header card - photo, name, qualification banner, progress bar */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, alignItems: "center" }]}>
          <Avatar uri={user.avatarUrl} name={user.fullName} size={72} />
          <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.lg, marginTop: spacing.sm }}>
            {user.fullName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: 2 }}>
            {user.specialty || t("techProfile.specialty")}
          </Text>

          <View
            style={[
              styles.qualifyBanner,
              { backgroundColor: qualifies ? colors.success + "22" : colors.warning + "22", borderRadius: radius.md, marginTop: spacing.md },
            ]}
          >
            <Ionicons name={qualifies ? "checkmark-circle" : "alert-circle-outline"} size={16} color={qualifies ? colors.success : colors.warning} />
            <Text
              style={{
                color: qualifies ? colors.success : colors.warning,
                fontFamily: fontFamily.bodyMedium,
                fontSize: fontSize.xs,
                marginLeft: 6,
                flexShrink: 1,
              }}
            >
              {qualifies ? t("techProfile.qualified") : t("techProfile.notQualified")}
            </Text>
          </View>

          <View style={{ width: "100%", marginTop: spacing.md }}>
            <View style={styles.progressHeader}>
              <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.xs }}>
                {t("techProfile.scoreLabel")}
              </Text>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.xs }}>{score}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}>
              <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor, borderRadius: radius.full }]} />
            </View>
          </View>
        </View>

        {/* Checklist */}
        <Animated.View style={{ opacity: cardsOpacity, transform: [{ translateY: cardsTranslateY }], marginTop: spacing.md }}>
          {items.map((item) => (
            <View
              key={item.key}
              style={[styles.checklistRow, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}
            >
              <Ionicons name={item.icon} size={18} color={item.complete ? colors.success : colors.textMuted} style={{ marginRight: spacing.sm }} />
              <Text style={{ flex: 1, color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
                {t(`techProfile.${item.key}`) !== `techProfile.${item.key}` ? t(`techProfile.${item.key}`) : item.key}
              </Text>
              <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginRight: spacing.sm }}>
                {item.weight}%
              </Text>
              <Ionicons
                name={item.complete ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={item.complete ? colors.success : colors.border}
              />
            </View>
          ))}
        </Animated.View>

        {/* Editable fields */}
        <View style={{ marginTop: spacing.lg }}>
          <InputField label={t("techProfile.specialty")} icon="construct-outline" value={specialty} onChangeText={setSpecialty} placeholder="e.g. Plumber" />
          <InputField
            label={t("techProfile.skills")}
            icon="ribbon-outline"
            value={skillsInput}
            onChangeText={setSkillsInput}
            placeholder="pipe fitting, leak repair, installation"
          />

          <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm, marginBottom: spacing.xs }}>
            {t("techProfile.bio")}
          </Text>
          <TextInput
            value={bio}
            onChangeText={setBio}
            placeholder="Tell customers about your experience..."
            placeholderTextColor={colors.placeholder}
            multiline
            numberOfLines={4}
            style={[
              styles.bioInput,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, color: colors.textPrimary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.base },
            ]}
          />

          <InputField
            label={t("techProfile.hourlyRate")}
            icon="cash-outline"
            value={hourlyRate}
            onChangeText={setHourlyRate}
            placeholder="15000"
            keyboardType="numeric"
          />
          <InputField
            label={t("techProfile.yearsExperience")}
            icon="time-outline"
            value={yearsExperience}
            onChangeText={setYearsExperience}
            placeholder="3"
            keyboardType="numeric"
          />

          {/* ID document */}
          <View style={[styles.idCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.sm }}>
                {t("techProfile.idDocument")}
              </Text>
              <Text style={{ color: colors.textMuted, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 2 }}>
                {user.idDocumentUrl ? t("techProfile.idUploaded") : "20%"}
              </Text>
            </View>
            <GradientButton
              label={t("techProfile.uploadId")}
              onPress={handleUploadId}
              loading={uploadingId}
              variant={user.idDocumentUrl ? "outline" : "primary"}
              style={{ width: 130 }}
            />
          </View>

          {!!error && (
            <Text style={{ color: colors.error, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm }}>{error}</Text>
          )}
          {!!notice && (
            <Text style={{ color: colors.success, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginTop: spacing.sm }}>{notice}</Text>
          )}

          <GradientButton label={t("techProfile.save")} onPress={handleSave} loading={saving} style={{ marginTop: spacing.lg }} />
          <GradientButton label={t("account.logout")} onPress={onLogout} variant="outline" style={{ marginTop: spacing.md }} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 20 },
  qualifyBanner: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 12 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressTrack: { height: 8, width: "100%", overflow: "hidden" },
  progressFill: { height: 8 },
  checklistRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 12, marginBottom: 8 },
  bioInput: { borderWidth: 1, padding: 12, minHeight: 90, textAlignVertical: "top", marginBottom: 16 },
  idCard: { flexDirection: "row", alignItems: "center", borderWidth: 1, padding: 14, marginTop: 4, marginBottom: 8 },
});
