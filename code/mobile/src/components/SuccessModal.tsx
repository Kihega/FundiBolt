import React, { useEffect, useRef } from "react";
import { Modal, View, Text, TouchableOpacity, Animated, Easing, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  buttonLabel?: string;
  onClose: () => void;
};

// A centered success card with a soft pulsing glow ring behind the
// checkmark - reusable anywhere a "this succeeded" confirmation with a
// single acknowledgement button is needed (OTP success, future flows).
export default function SuccessModal({ visible, title = "Success!", message, buttonLabel = "OK", onClose }: Props) {
  const { colors, fontFamily, fontSize, spacing, radius } = useTheme();

  const glowScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.55)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!visible) return;

    cardOpacity.setValue(0);
    cardScale.setValue(0.9);
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(cardScale, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }),
    ]).start();

    glowScale.setValue(1);
    glowOpacity.setValue(0.55);
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale, { toValue: 1.45, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.timing(glowScale, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0.55, duration: 0, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [visible, cardOpacity, cardScale, glowOpacity, glowScale]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              opacity: cardOpacity,
              transform: [{ scale: cardScale }],
            },
          ]}
        >
          <View style={styles.iconWrap}>
            <Animated.View
              style={[
                styles.glow,
                {
                  backgroundColor: colors.success,
                  opacity: glowOpacity,
                  transform: [{ scale: glowScale }],
                },
              ]}
            />
            <View style={[styles.iconCircle, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={36} color="#FFFFFF" />
            </View>
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
            {title}
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontFamily: fontFamily.bodyRegular,
              fontSize: fontSize.sm,
              marginTop: spacing.xs,
              textAlign: "center",
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.button, { backgroundColor: colors.primary, borderRadius: radius.full, marginTop: spacing.lg }]}
          >
            <Text style={{ color: "#FFFFFF", fontFamily: fontFamily.bodySemiBold, fontSize: fontSize.base }}>{buttonLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  card: { width: "100%", maxWidth: 360, padding: 24, alignItems: "center" },
  iconWrap: { width: 88, height: 88, alignItems: "center", justifyContent: "center" },
  glow: { position: "absolute", width: 88, height: 88, borderRadius: 44 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  button: { width: "100%", paddingVertical: 14, alignItems: "center" },
});
