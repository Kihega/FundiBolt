import React, { useEffect, useRef, useState } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage, Language } from "../theme/LanguageContext";
import { useResponsive } from "../theme/responsive";
import { getOnlineStatus } from "../utils/onlineStatus";
import Avatar from "./Avatar";

type Props = {
  visible: boolean;
  onClose: () => void;
  userName: string;
  email: string;
  avatarUrl?: string | null;
  lastActiveAt?: string | null;
  onViewProfile: () => void;
  onChangePassword: () => void;
  onNeedSupport: () => void;
};

type ExpandedSection = "language" | "theme" | null;

// Slide-in drawer opened from the top bar's hamburger button. "Change
// Language" and "Change Theme" expand inline into a small radio-style
// picker rather than pushing to a separate screen, per the wireframe
// note ("change language button will open another dropdown menu").
export default function SideMenu({
  visible,
  onClose,
  userName,
  email,
  avatarUrl,
  lastActiveAt,
  onViewProfile,
  onChangePassword,
  onNeedSupport,
}: Props) {
  const { colors, fontFamily, fontSize, spacing, isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { width } = useResponsive();
  const { isOnline } = getOnlineStatus(lastActiveAt);

  const [expanded, setExpanded] = useState<ExpandedSection>(null);
  const panelWidth = Math.min(width * 0.8, 320);

  const translateX = useRef(new Animated.Value(-panelWidth)).current;

  useEffect(() => {
    if (visible) {
      translateX.setValue(-panelWidth);
      Animated.timing(translateX, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Collapse any open sub-menu so it doesn't flash open on next reveal.
      setExpanded(null);
    }
  }, [visible, panelWidth, translateX]);

  function toggleSection(section: Exclude<ExpandedSection, null>) {
    setExpanded((prev) => (prev === section ? null : section));
  }

  function handleSelectLanguage(lang: Language) {
    setLanguage(lang);
    setExpanded(null);
  }

  function handleSelectTheme(mode: "dark" | "light") {
    if ((mode === "dark") !== isDark) {
      toggleTheme();
    }
    setExpanded(null);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[
            styles.panel,
            { width: panelWidth, backgroundColor: colors.backgroundElevated, borderRightColor: colors.border, transform: [{ translateX }] },
          ]}
        >
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
            <TouchableOpacity
              onPress={onViewProfile}
              style={[styles.profileRow, { borderBottomColor: colors.border, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }]}
            >
              <Avatar uri={avatarUrl} name={userName} size={56} isOnline={isOnline} />
              <View style={{ marginLeft: spacing.md, flex: 1 }}>
                <Text numberOfLines={1} style={{ color: colors.textPrimary, fontFamily: fontFamily.headingSemiBold, fontSize: fontSize.base }}>
                  {userName}
                </Text>
                <Text numberOfLines={1} style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.xs, marginTop: 2 }}>
                  {email}
                </Text>
              </View>
            </TouchableOpacity>

            <MenuItem icon="person-outline" label={t("sideMenu.viewProfile")} onPress={onViewProfile} />
            <MenuItem icon="key-outline" label={t("sideMenu.changePassword")} onPress={onChangePassword} />

            <MenuItem
              icon="language-outline"
              label={t("sideMenu.changeLanguage")}
              onPress={() => toggleSection("language")}
              expandable
              expanded={expanded === "language"}
            />
            {expanded === "language" && (
              <View style={styles.subOptions}>
                <SubOption label={t("language.english")} selected={language === "en"} onPress={() => handleSelectLanguage("en")} />
                <SubOption label={t("language.swahili")} selected={language === "sw"} onPress={() => handleSelectLanguage("sw")} />
              </View>
            )}

            <MenuItem
              icon="contrast-outline"
              label={t("sideMenu.changeTheme")}
              onPress={() => toggleSection("theme")}
              expandable
              expanded={expanded === "theme"}
            />
            {expanded === "theme" && (
              <View style={styles.subOptions}>
                <SubOption label={t("theme.dark")} selected={isDark} onPress={() => handleSelectTheme("dark")} />
                <SubOption label={t("theme.light")} selected={!isDark} onPress={() => handleSelectTheme("light")} />
              </View>
            )}

            <MenuItem icon="headset-outline" label={t("sideMenu.needSupport")} onPress={onNeedSupport} />
          </ScrollView>
        </Animated.View>

        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} accessibilityRole="button" accessibilityLabel={t("common.close")} />
      </View>
    </Modal>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  expandable,
  expanded,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  expandable?: boolean;
  expanded?: boolean;
}) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.menuItem, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={{ color: colors.textPrimary, fontFamily: fontFamily.bodyMedium, fontSize: fontSize.base, marginLeft: spacing.md, flex: 1 }}>
        {label}
      </Text>
      {expandable && <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />}
    </TouchableOpacity>
  );
}

function SubOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const { colors, fontFamily, fontSize, spacing } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} style={[styles.subOption, { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }]}>
      <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
      </View>
      <Text style={{ color: colors.textSecondary, fontFamily: fontFamily.bodyRegular, fontSize: fontSize.sm, marginLeft: spacing.sm }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  panel: { height: "100%", borderRightWidth: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  profileRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  menuItem: { flexDirection: "row", alignItems: "center" },
  subOptions: { paddingLeft: 8 },
  subOption: { flexDirection: "row", alignItems: "center" },
  radioOuter: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
