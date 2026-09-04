import React, { useRef } from "react";
import { Animated, StyleSheet, TouchableOpacity } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme/ThemeContext";
import { useLanguage } from "../theme/LanguageContext";

type Props = {
  onDelete: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
};

// Swipe-to-delete wrapper, used for both conversation rows and individual
// chat bubbles in MessagesScreen. Dragging the row to the right reveals a
// small red bin icon at its left edge - just the icon, no filled
// background panel behind it. Tapping the icon deletes it, and so does
// dragging far enough for the row to swing fully open: a full swipe is
// treated as the confirmation itself (the same way Mail apps treat
// "swiped all the way" as "yes, delete this"), rather than popping up a
// separate confirmation dialog on top of it.
export default function SwipeToDelete({ onDelete, children, accessibilityLabel }: Props) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const swipeableRef = useRef<Swipeable>(null);

  function handleDelete() {
    swipeableRef.current?.close();
    onDelete();
  }

  function renderLeftActions(progress: Animated.AnimatedInterpolation<number>) {
    const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1], extrapolate: "clamp" });
    return (
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.action}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || t("messages.delete")}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      leftThreshold={72}
      onSwipeableOpen={(direction) => {
        // A full swipe past the threshold, released open, counts as the
        // user confirming the delete on its own - see the note above.
        if (direction === "left") {
          handleDelete();
        }
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  // No backgroundColor/borderRadius here on purpose - just the icon,
  // centered in a generously-sized tap target (the padding is invisible,
  // not a visible box).
  action: { width: 56, alignItems: "center", justifyContent: "center" },
});
