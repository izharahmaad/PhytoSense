import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { fetchHistory } from "../services/api";

interface HistoryItem {
  id: number;
  created_at: string;
  stress_level: string;
  health_score: number;
  recommendation: string;
}

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2d6a4f" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleString()}</Text>
          <Text style={styles.stress}>{item.stress_level.replace(/_/g, " ")}</Text>
          <Text style={styles.score}>Health score: {Math.round(item.health_score * 100)}%</Text>
          <Text style={styles.rec}>{item.recommendation}</Text>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No assessments yet.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, backgroundColor: "#f1f8f4" },
  card: { backgroundColor: "#fff", borderRadius: 10, padding: 14, marginBottom: 12 },
  date: { fontSize: 11, color: "#888" },
  stress: { fontSize: 16, fontWeight: "700", color: "#1b4332", textTransform: "capitalize", marginTop: 4 },
  score: { fontSize: 13, color: "#2d6a4f", marginTop: 2 },
  rec: { fontSize: 12, color: "#555", marginTop: 6 },
  empty: { textAlign: "center", color: "#888", marginTop: 40 },
});
