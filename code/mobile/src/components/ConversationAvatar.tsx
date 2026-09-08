import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { useTheme } from "../theme/ThemeContext";
import Avatar from "./Avatar";

type Props = {
  /** FundiBolt Customer Service has no real agent photo - shows the app logo instead, everywhere this conversation's avatar appears. */
  isSupport?: boolean;
  avatarUrl?: string | null;
  name: string;
  size: number;
};

// Single source of truth for "what avatar represents this conversation",
// used in the conversation list row, the open thread's header, and next
// to each of the other party's messages - so all three can never drift
// out of sync (e.g. one place still showing "FS" initials while another
// correctly shows the logo).
export default function ConversationAvatar({ isSupport, avatarUrl, name, size }: Props) {
  const { colors } = useTheme();

  if (isSupport) {
    return (
      <View
        style={[
          styles.logoWrap,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
          },
        ]}
      >
        <Image
          source={require("../../assets/logo.png")}
          style={{ width: size * 0.62, height: size * 0.62 }}
          resizeMode="contain"
        />
      </View>
    );
  }

  return <Avatar uri={avatarUrl} name={name} size={size} />;
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
