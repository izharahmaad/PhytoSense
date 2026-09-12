import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HealthScoreCard({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color = percentage >= 70 ? "#2d6a4f" : percentage >= 40 ? "#e9c46a" : "#e63946";

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <Text style={styles.label}>Health Score</Text>
      <Text style={[styles.value, { color }]}>{percentage}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 2, padding: 20, alignItems: "center" },
  label: { fontSize: 13, color: "#555" },
  value: { fontSize: 40, fontWeight: "800", marginTop: 4 },
});
