import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={styles.safeArea.backgroundColor}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>PLANT CARE ASSISTANT</Text>
            <Text style={styles.title}>PhytoSense</Text>
          </View>

          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>✦</Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>🌿</Text>
          </View>

          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>Understand your plant</Text>
            <Text style={styles.heroText}>
              Take a clear leaf photo and combine it with environmental data
              for a better health assessment.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick actions</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new plant assessment"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("Capture")}
        >
          <View style={styles.buttonIconCircle}>
            <Text style={styles.buttonIcon}>＋</Text>
          </View>
          <View style={styles.buttonCopy}>
            <Text style={styles.primaryButtonText}>New assessment</Text>
            <Text style={styles.primaryButtonHint}>Scan a leaf and check its health</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View assessment history"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("History")}
        >
          <View style={styles.historyIconCircle}>
            <Text style={styles.historyIcon}>◷</Text>
          </View>
          <View style={styles.buttonCopy}>
            <Text style={styles.secondaryButtonText}>View history</Text>
            <Text style={styles.secondaryButtonHint}>Review your previous assessments</Text>
          </View>
          <Text style={styles.secondaryArrow}>›</Text>
        </Pressable>

        <View style={styles.tipCard}>
          <Text style={styles.tipLabel}>PHOTO TIP</Text>
          <Text style={styles.tipTitle}>Use a clear, close-up leaf photo</Text>
          <Text style={styles.tipText}>
            Good lighting and one visible leaf help the model produce a more
            reliable result.
          </Text>
        </View>

        <Text style={styles.footerText}>AI-assisted plant health insights</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#61977A",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  title: {
    color: "#173C2A",
    fontSize: 35,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D8F0DF",
  },
  logoText: {
    color: "#2C7A4B",
    fontSize: 25,
    fontWeight: "800",
  },
  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DDF3E3",
    borderRadius: 22,
    padding: 18,
    marginBottom: 30,
  },
  heroIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C3E8CE",
    marginRight: 14,
  },
  heroIcon: {
    fontSize: 28,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    color: "#1C5333",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 5,
  },
  heroText: {
    color: "#477D5C",
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    color: "#234A32",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 13,
  },
  primaryButton: {
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: "#2D7A4B",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#185C35",
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  secondaryButton: {
    minHeight: 78,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D3E5D8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 26,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  buttonIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A9665",
    marginRight: 13,
  },
  buttonIcon: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "300",
  },
  historyIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2E7",
    marginRight: 13,
  },
  historyIcon: {
    color: "#2D7A4B",
    fontSize: 27,
  },
  buttonCopy: {
    flex: 1,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 3,
  },
  primaryButtonHint: {
    color: "#D4F0DB",
    fontSize: 12,
  },
  secondaryButtonText: {
    color: "#244C32",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 3,
  },
  secondaryButtonHint: {
    color: "#789682",
    fontSize: 12,
  },
  arrow: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "300",
    marginLeft: 8,
  },
  secondaryArrow: {
    color: "#6E9C7B",
    fontSize: 32,
    fontWeight: "300",
    marginLeft: 8,
  },
  tipCard: {
    backgroundColor: "#FFFDF5",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0E7C7",
    padding: 17,
    marginBottom: 24,
  },
  tipLabel: {
    color: "#B18B36",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 5,
  },
  tipTitle: {
    color: "#685521",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  tipText: {
    color: "#8F7E4A",
    fontSize: 12,
    lineHeight: 18,
  },
  footerText: {
    color: "#8AA992",
    fontSize: 12,
    textAlign: "center",
    marginTop: "auto",
  },
});