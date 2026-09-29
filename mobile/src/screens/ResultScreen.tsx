import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../navigation/AppNavigator";
import HealthScoreCard from "../components/HealthScoreCard";
import StressBadge from "../components/StressBadge";

type Props = NativeStackScreenProps<
  RootStackParamList,
  "Result"
>;

type ProbabilityEntry = [
  string,
  number,
];

function formatLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function toPercentage(value: unknown): number {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const normalizedValue =
    numericValue > 1
      ? numericValue / 100
      : numericValue;

  return Math.max(
    0,
    Math.min(100, Math.round(normalizedValue * 100)),
  );
}

function getBarColor(percentage: number): string {
  if (percentage >= 75) {
    return "#2D7A4B";
  }

  if (percentage >= 45) {
    return "#B1842D";
  }

  return "#B54848";
}

function getEntries(
  values: unknown,
): ProbabilityEntry[] {
  if (
    typeof values !== "object" ||
    values === null ||
    Array.isArray(values)
  ) {
    return [];
  }

  return Object.entries(values as Record<string, unknown>)
    .filter(([, value]) => Number.isFinite(Number(value)))
    .sort(
      (a, b) =>
        Number(b[1]) - Number(a[1]),
    ) as ProbabilityEntry[];
}

function ProbabilityRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const percentage = toPercentage(value);
  const barColor = getBarColor(percentage);

  return (
    <View style={styles.probabilityRow}>
      <View style={styles.probabilityHeader}>
        <Text style={styles.probabilityLabel}>
          {formatLabel(label)}
        </Text>

        <Text
          style={[
            styles.probabilityValue,
            {
              color: barColor,
            },
          ]}
        >
          {percentage}%
        </Text>
      </View>

      <View
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={`${formatLabel(label)} probability`}
        accessibilityValue={{
          min: 0,
          max: 100,
          now: percentage,
          text: `${percentage}%`,
        }}
        style={styles.progressTrack}
      >
        <View
          style={[
            styles.progressFill,
            {
              width: `${percentage}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

function InsightSection({
  title,
  subtitle,
  entries,
  emptyText,
}: {
  title: string;
  subtitle: string;
  entries: ProbabilityEntry[];
  emptyText: string;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionTitleWrap}>
          <Text style={styles.sectionTitle}>
            {title}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {subtitle}
          </Text>
        </View>

        <View style={styles.sectionIcon}>
          <Text style={styles.sectionIconText}>
            •
          </Text>
        </View>
      </View>

      {entries.length > 0 ? (
        <View style={styles.rows}>
          {entries.map(([label, value]) => (
            <ProbabilityRow
              key={label}
              label={label}
              value={value}
            />
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {emptyText}
        </Text>
      )}
    </View>
  );
}

export default function ResultScreen({
  route,
  navigation,
}: Props) {
  const { result } = route.params;

  const causeEntries = getEntries(
    result.cause_probabilities,
  );

  const environmentEntries = getEntries(
    result.environmental_attribution,
  );

  const recommendation =
    result.recommendation?.trim() ||
    "Continue observing the plant and review its environment.";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5FAF6"
      />

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              PLANT HEALTH SCAN
            </Text>

            <Text style={styles.title}>
              Assessment result
            </Text>

            <Text style={styles.subtitle}>
              Here is the latest analysis of your plant.
            </Text>
          </View>

          <View style={styles.completeBadge}>
            <Text style={styles.completeBadgeText}>
              COMPLETE
            </Text>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            OVERALL HEALTH
          </Text>

          <View style={styles.heroScoreRow}>
            <View style={styles.heroScoreCopy}>
              <Text style={styles.heroTitle}>
                Health overview
              </Text>

              <Text style={styles.heroHint}>
                Based on the uploaded leaf image and
                environment readings.
              </Text>
            </View>

            <View style={styles.heroLeaf}>
              <Text style={styles.heroLeafText}>
                ✦
              </Text>
            </View>
          </View>

          <View style={styles.healthCardWrap}>
            <HealthScoreCard
              score={result.health_score}
            />
          </View>

          <View style={styles.stressRow}>
            <Text style={styles.stressLabel}>
              Current stress level
            </Text>

            <StressBadge
              level={result.stress_level}
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderTitle}>
            Analysis details
          </Text>

          <Text style={styles.sectionHeaderHint}>
            Highest first
          </Text>
        </View>

        <InsightSection
          title="Probable causes"
          subtitle="Likely contributors to the detected condition"
          entries={causeEntries}
          emptyText="No probable causes were returned."
        />

        <InsightSection
          title="Environmental attribution"
          subtitle="How the supplied environment may be contributing"
          entries={environmentEntries}
          emptyText="No environmental attribution was returned."
        />

        <View style={styles.recommendationCard}>
          <View style={styles.recommendationHeader}>
            <View>
              <Text style={styles.recommendationEyebrow}>
                NEXT STEP
              </Text>

              <Text style={styles.recommendationTitle}>
                Recommendation
              </Text>
            </View>

            <View style={styles.recommendationIcon}>
              <Text style={styles.recommendationIconText}>
                ✓
              </Text>
            </View>
          </View>

          <Text style={styles.recommendationText}>
            {recommendation}
          </Text>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerIcon}>
            i
          </Text>

          <Text style={styles.disclaimerText}>
            This result is AI-assisted. Use it together
            with careful observation of the plant and its
            growing conditions.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start another plant assessment"
          style={({ pressed }) => [
            styles.newAssessmentButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => navigation.navigate("Capture")}
        >
          <Text style={styles.newAssessmentText}>
            Start another assessment
          </Text>

          <Text style={styles.newAssessmentArrow}>
            →
          </Text>
        </Pressable>

        <Text style={styles.footerText}>
          PhytoSense · AI-assisted plant care
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },

  container: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 32,
  },

  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  headerCopy: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: "#659878",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginBottom: 5,
  },

  title: {
    color: "#173C2A",
    fontSize: 28,
    fontWeight: "800",
  },

  subtitle: {
    color: "#658575",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  completeBadge: {
    backgroundColor: "#DDF1E2",
    borderRadius: 12,
    marginTop: 3,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },

  completeBadgeText: {
    color: "#2D7A4B",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  heroCard: {
    backgroundColor: "#EAF6ED",
    borderColor: "#CFE8D5",
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 25,
    padding: 17,
  },

  heroLabel: {
    color: "#5F9271",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },

  heroScoreRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
  },

  heroScoreCopy: {
    flex: 1,
    paddingRight: 16,
  },

  heroTitle: {
    color: "#1D5133",
    fontSize: 20,
    fontWeight: "800",
  },

  heroHint: {
    color: "#71927D",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  heroLeaf: {
    alignItems: "center",
    backgroundColor: "#CFEBD6",
    borderRadius: 27,
    height: 54,
    justifyContent: "center",
    width: 54,
  },

  heroLeafText: {
    color: "#2D7A4B",
    fontSize: 27,
  },

  healthCardWrap: {
    marginTop: 13,
  },

  stressRow: {
    alignItems: "center",
    borderTopColor: "#D3EAD8",
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
    paddingTop: 13,
  },

  stressLabel: {
    color: "#4F7D5F",
    flex: 1,
    fontSize: 12,
    fontWeight: "700",
    marginRight: 10,
  },

  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionHeaderTitle: {
    color: "#234A32",
    fontSize: 19,
    fontWeight: "800",
  },

  sectionHeaderHint: {
    color: "#86A292",
    fontSize: 11,
    fontWeight: "700",
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCEBE0",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 13,
    padding: 16,
    shadowColor: "#1B4332",
    shadowOpacity: 0.04,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitleWrap: {
    flex: 1,
    paddingRight: 12,
  },

  sectionTitle: {
    color: "#285A3B",
    fontSize: 16,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#86A292",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  sectionIcon: {
    alignItems: "center",
    backgroundColor: "#E4F3E7",
    borderRadius: 16,
    height: 32,
    justifyContent: "center",
    width: 32,
  },

  sectionIconText: {
    color: "#2D7A4B",
    fontSize: 23,
    lineHeight: 23,
  },

  rows: {
    borderTopColor: "#EEF5EF",
    borderTopWidth: 1,
    paddingTop: 2,
  },

  probabilityRow: {
    borderBottomColor: "#EEF5EF",
    borderBottomWidth: 1,
    paddingVertical: 11,
  },

  probabilityHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  probabilityLabel: {
    color: "#527763",
    flex: 1,
    fontSize: 13,
    marginRight: 10,
  },

  probabilityValue: {
    fontSize: 13,
    fontWeight: "900",
  },

  progressTrack: {
    backgroundColor: "#E6F1E8",
    borderRadius: 5,
    height: 7,
    overflow: "hidden",
    width: "100%",
  },

  progressFill: {
    borderRadius: 5,
    height: "100%",
  },

  emptyText: {
    color: "#8AA394",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 18,
  },

  recommendationCard: {
    backgroundColor: "#FFFDF5",
    borderColor: "#F0E7C7",
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 5,
    padding: 17,
  },

  recommendationHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  recommendationEyebrow: {
    color: "#B18B36",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 3,
  },

  recommendationTitle: {
    color: "#806B35",
    fontSize: 17,
    fontWeight: "800",
  },

  recommendationIcon: {
    alignItems: "center",
    backgroundColor: "#F5EBCB",
    borderRadius: 17,
    height: 34,
    justifyContent: "center",
    width: 34,
  },

  recommendationIconText: {
    color: "#B18B36",
    fontSize: 18,
    fontWeight: "900",
  },

  recommendationText: {
    color: "#806F46",
    fontSize: 13,
    lineHeight: 20,
  },

  disclaimerCard: {
    alignItems: "flex-start",
    flexDirection: "row",
    marginTop: 16,
    paddingHorizontal: 4,
  },

  disclaimerIcon: {
    alignItems: "center",
    backgroundColor: "#DDEBE0",
    borderRadius: 9,
    color: "#518064",
    fontSize: 12,
    fontWeight: "900",
    height: 18,
    lineHeight: 18,
    marginRight: 8,
    overflow: "hidden",
    textAlign: "center",
    width: 18,
  },

  disclaimerText: {
    color: "#82998A",
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  newAssessmentButton: {
    alignItems: "center",
    backgroundColor: "#2D7A4B",
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
    minHeight: 54,
    shadowColor: "#185C35",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 3,
  },

  buttonPressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  newAssessmentText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  newAssessmentArrow: {
    color: "#D6F2DE",
    fontSize: 22,
    marginLeft: 10,
  },

  footerText: {
    color: "#8AA992",
    fontSize: 11,
    marginTop: 17,
    textAlign: "center",
  },
});