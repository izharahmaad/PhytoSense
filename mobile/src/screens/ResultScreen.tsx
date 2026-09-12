import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";
import HealthScoreCard from "../components/HealthScoreCard";
import StressBadge from "../components/StressBadge";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export default function ResultScreen({ route }: Props) {
  const { result } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <HealthScoreCard score={result.health_score} />
      <StressBadge level={result.stress_level} />

      <Text style={styles.sectionTitle}>Probable Causes</Text>
      {Object.entries(result.cause_probabilities)
        .sort((a, b) => b[1] - a[1])
        .map(([cause, prob]) => (
          <View key={cause} style={styles.row}>
            <Text style={styles.rowLabel}>{cause.replace(/_/g, " ")}</Text>
            <Text style={styles.rowValue}>{Math.round(prob * 100)}%</Text>
          </View>
        ))}

      <Text style={styles.sectionTitle}>Environmental Attribution</Text>
      {Object.entries(result.environmental_attribution)
        .sort((a, b) => b[1] - a[1])
        .map(([factor, weight]) => (
          <View key={factor} style={styles.row}>
            <Text style={styles.rowLabel}>{factor.replace(/_/g, " ")}</Text>
            <Text style={styles.rowValue}>{Math.round(weight * 100)}%</Text>
          </View>
        ))}

      <Text style={styles.sectionTitle}>Recommendation</Text>
      <Text style={styles.recommendation}>{result.recommendation}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f1f8f4" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1b4332", marginTop: 20, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#d8f3dc" },
  rowLabel: { color: "#2d6a4f", textTransform: "capitalize" },
  rowValue: { color: "#1b4332", fontWeight: "600" },
  recommendation: { backgroundColor: "#fff", padding: 14, borderRadius: 10, color: "#333", lineHeight: 20 },
});
