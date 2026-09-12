import React from "react";
import { View, Text, StyleSheet } from "react-native";

const COLORS: Record<string, string> = {
  healthy: "#2d6a4f",
  mild_stress: "#e9c46a",
  moderate_stress: "#f4a261",
  severe_stress: "#e63946",
};

export default function StressBadge({ level }: { level: string }) {
  const color = COLORS[level] ?? "#888";
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{level.replace(/_/g, " ").toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "center", paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, marginVertical: 14 },
  text: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
