import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>PhytoSense</Text>
      <Text style={styles.subtitle}>
        Multimodal Plant Health &amp; Stress Assessment
      </Text>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate("Capture")}>
        <Text style={styles.primaryButtonText}>New Assessment</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("History")}>
        <Text style={styles.secondaryButtonText}>View History</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f1f8f4" },
  title: { fontSize: 32, fontWeight: "700", color: "#1b4332", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#40916c", marginBottom: 40, textAlign: "center" },
  primaryButton: { backgroundColor: "#2d6a4f", paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, marginBottom: 14, width: "100%" },
  primaryButtonText: { color: "#fff", fontWeight: "600", textAlign: "center", fontSize: 16 },
  secondaryButton: { borderColor: "#2d6a4f", borderWidth: 1.5, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 10, width: "100%" },
  secondaryButtonText: { color: "#2d6a4f", fontWeight: "600", textAlign: "center", fontSize: 16 },
});
