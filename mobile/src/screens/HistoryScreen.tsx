import React, {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import {
  fetchHistory,
  type HistoryItem,
} from "../services/api";

function formatStressLevel(value: string): string {
  const text = String(value || "unknown")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTime(value: string): number {
  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : 0;
}

function getHealthColor(score: number): string {
  if (score >= 0.75) {
    return "#2D7A4B";
  }

  if (score >= 0.5) {
    return "#B1842D";
  }

  return "#B54848";
}

function getStressColor(stressLevel: string): string {
  const normalized = String(
    stressLevel || "",
  ).toLowerCase();

  if (
    normalized.includes("healthy") ||
    normalized.includes("low") ||
    normalized.includes("none")
  ) {
    return "#2D7A4B";
  }

  if (
    normalized.includes("mild") ||
    normalized.includes("moderate")
  ) {
    return "#A67829";
  }

  return "#B54848";
}

function normalizeScore(value: unknown): number {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return 0;
  }

  const normalized = score > 1 ? score / 100 : score;

  return Math.max(0, Math.min(1, normalized));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load assessment history.";
}

function SummaryStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.summaryStat}>
      <Text style={styles.summaryValue}>
        {value}
      </Text>

      <Text style={styles.summaryLabel}>
        {label}
      </Text>
    </View>
  );
}

function AssessmentCard({
  item,
}: {
  item: HistoryItem;
}) {
  const score = normalizeScore(item.health_score);
  const percentage = Math.round(score * 100);
  const stressColor = getStressColor(
    item.stress_level,
  );
  const healthColor = getHealthColor(score);

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <View style={styles.dateCopy}>
          <Text style={styles.dateLabel}>
            ASSESSMENT
          </Text>

          <Text style={styles.date}>
            {formatDate(item.created_at)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${stressColor}18`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: stressColor,
              },
            ]}
          />

          <Text
            style={[
              styles.statusText,
              {
                color: stressColor,
              },
            ]}
          >
            {formatStressLevel(item.stress_level)}
          </Text>
        </View>
      </View>

      <View style={styles.scorePanel}>
        <View style={styles.scoreCopy}>
          <Text style={styles.scoreLabel}>
            Health score
          </Text>

          <Text
            style={[
              styles.score,
              {
                color: healthColor,
              },
            ]}
          >
            {percentage}%
          </Text>
        </View>

        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Health score"
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
                backgroundColor: healthColor,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>
          RECOMMENDATION
        </Text>

        <Text style={styles.recommendation}>
          {item.recommendation?.trim() ||
            "No recommendation was recorded."}
        </Text>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const loadHistory = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      setErrorMessage(null);

      try {
        const history = await fetchHistory();

        const sortedHistory = [...history].sort(
          (first, second) =>
            getTime(second.created_at) -
            getTime(first.created_at),
        );

        setItems(sortedHistory);
      } catch (error) {
        setErrorMessage(getErrorMessage(error));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      void loadHistory();

      return undefined;
    }, [loadHistory]),
  );

  const refresh = useCallback(() => {
    setRefreshing(true);
    void loadHistory(false);
  }, [loadHistory]);

  const retry = useCallback(() => {
    void loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5FAF6"
        />

        <View style={styles.center}>
          <View style={styles.loadingCircle}>
            <ActivityIndicator
              size="large"
              color="#2D7A4B"
            />
          </View>

          <Text style={styles.loadingTitle}>
            Loading assessments
          </Text>

          <Text style={styles.loadingText}>
            Fetching your plant-health records...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const averageScore =
    items.length > 0
      ? Math.round(
          (items.reduce(
            (total, item) =>
              total + normalizeScore(item.health_score),
            0,
          ) /
            items.length) *
            100,
        )
      : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F5FAF6"
      />

      <FlatList
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          items.length === 0 &&
            styles.emptyListContent,
        ]}
        data={items}
        keyExtractor={(item, index) =>
          `${item.id}-${index}`
        }
        renderItem={({ item }) => (
          <AssessmentCard item={item} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#2D7A4B"
            colors={["#2D7A4B"]}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.eyebrow}>
                  PLANT HEALTH RECORDS
                </Text>

                <Text style={styles.title}>
                  Assessment history
                </Text>

                <Text style={styles.subtitle}>
                  Track previous scans and follow the
                  recommended care steps.
                </Text>
              </View>

              <View style={styles.historyIcon}>
                <Text style={styles.historyIconText}>
                  ◷
                </Text>
              </View>
            </View>

            {items.length > 0 && (
              <View style={styles.summaryCard}>
                <SummaryStat
                  label="Total scans"
                  value={String(items.length)}
                />

                <View style={styles.summaryDivider} />

                <SummaryStat
                  label="Average health"
                  value={`${averageScore}%`}
                />

                <View style={styles.summaryDivider} />

                <SummaryStat
                  label="Latest"
                  value="Today"
                />
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIcon}>
                  <Text style={styles.errorIconText}>
                    !
                  </Text>
                </View>

                <View style={styles.errorCopy}>
                  <Text style={styles.errorTitle}>
                    Could not refresh history
                  </Text>

                  <Text style={styles.errorText}>
                    {errorMessage}
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry loading history"
                    style={({ pressed }) => [
                      styles.retryButton,
                      pressed &&
                        styles.retryButtonPressed,
                    ]}
                    onPress={retry}
                  >
                    <Text style={styles.retryText}>
                      Try again
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {items.length > 0 && (
              <View style={styles.listHeading}>
                <Text style={styles.listTitle}>
                  Recent assessments
                </Text>

                <Text style={styles.listHint}>
                  Newest first
                </Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Text style={styles.emptyIcon}>
                ◷
              </Text>
            </View>

            <Text style={styles.emptyTitle}>
              No assessments yet
            </Text>

            <Text style={styles.emptyText}>
              Complete your first plant-health scan and
              the result will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          items.length > 0 ? (
            <Text style={styles.footerText}>
              Pull down to refresh your history.
            </Text>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#F5FAF6",
    flex: 1,
  },

  list: {
    backgroundColor: "#F5FAF6",
    flex: 1,
  },

  listContent: {
    paddingBottom: 30,
    paddingHorizontal: 20,
    paddingTop: 25,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  center: {
    alignItems: "center",
    backgroundColor: "#F5FAF6",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  loadingCircle: {
    alignItems: "center",
    backgroundColor: "#E2F2E6",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    width: 68,
  },

  loadingTitle: {
    color: "#234A32",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 17,
  },

  loadingText: {
    color: "#789687",
    fontSize: 13,
    marginTop: 6,
    textAlign: "center",
  },

  header: {
    marginBottom: 19,
  },

  headerTopRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  headerCopy: {
    flex: 1,
    paddingRight: 15,
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
    fontSize: 29,
    fontWeight: "800",
  },

  subtitle: {
    color: "#658575",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },

  historyIcon: {
    alignItems: "center",
    backgroundColor: "#DDF1E2",
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },

  historyIconText: {
    color: "#2D7A4B",
    fontSize: 29,
  },

  summaryCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#DCEBE0",
    borderRadius: 17,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 19,
    paddingHorizontal: 10,
    paddingVertical: 15,
  },

  summaryStat: {
    alignItems: "center",
    flex: 1,
  },

  summaryValue: {
    color: "#2D7A4B",
    fontSize: 18,
    fontWeight: "900",
  },

  summaryLabel: {
    color: "#82998A",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
    textAlign: "center",
  },

  summaryDivider: {
    backgroundColor: "#E2EEE5",
    height: 31,
    width: 1,
  },

  errorBanner: {
    alignItems: "flex-start",
    backgroundColor: "#FFF4F2",
    borderColor: "#F0C9C3",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 16,
    padding: 13,
  },

  errorIcon: {
    alignItems: "center",
    backgroundColor: "#F5D8D3",
    borderRadius: 12,
    height: 25,
    justifyContent: "center",
    marginRight: 10,
    width: 25,
  },

  errorIconText: {
    color: "#9D3E38",
    fontSize: 14,
    fontWeight: "900",
  },

  errorCopy: {
    flex: 1,
  },

  errorTitle: {
    color: "#9D3E38",
    fontSize: 13,
    fontWeight: "800",
  },

  errorText: {
    color: "#9B6660",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: "#B54848",
    borderRadius: 9,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  retryButtonPressed: {
    opacity: 0.8,
  },

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  listHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 22,
  },

  listTitle: {
    color: "#234A32",
    fontSize: 18,
    fontWeight: "800",
  },

  listHint: {
    color: "#86A292",
    fontSize: 11,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCEBE0",
    borderRadius: 19,
    borderWidth: 1,
    elevation: 2,
    marginBottom: 13,
    padding: 16,
    shadowColor: "#1B4332",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
  },

  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  dateCopy: {
    flex: 1,
    marginRight: 10,
  },

  dateLabel: {
    color: "#9AAEA0",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 3,
  },

  date: {
    color: "#718A7A",
    fontSize: 11,
  },

  statusBadge: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    maxWidth: "55%",
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  statusDot: {
    borderRadius: 4,
    height: 7,
    marginRight: 6,
    width: 7,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },

  scorePanel: {
    backgroundColor: "#F7FBF8",
    borderRadius: 13,
    marginBottom: 13,
    padding: 12,
  },

  scoreCopy: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  scoreLabel: {
    color: "#5D7B68",
    fontSize: 13,
    fontWeight: "700",
  },

  score: {
    fontSize: 23,
    fontWeight: "900",
  },

  progressTrack: {
    backgroundColor: "#E1EEE4",
    borderRadius: 5,
    height: 8,
    overflow: "hidden",
    width: "100%",
  },

  progressFill: {
    borderRadius: 5,
    height: "100%",
  },

  recommendationBox: {
    backgroundColor: "#F6FAF7",
    borderRadius: 12,
    padding: 11,
  },

  recommendationLabel: {
    color: "#6D9379",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  recommendation: {
    color: "#42664E",
    fontSize: 13,
    lineHeight: 19,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 80,
  },

  emptyIconCircle: {
    alignItems: "center",
    backgroundColor: "#DDF1E2",
    borderRadius: 34,
    height: 68,
    justifyContent: "center",
    marginBottom: 15,
    width: 68,
  },

  emptyIcon: {
    color: "#2D7A4B",
    fontSize: 35,
  },

  emptyTitle: {
    color: "#234A32",
    fontSize: 18,
    fontWeight: "800",
  },

  emptyText: {
    color: "#789687",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },

  footerText: {
    color: "#8AA992",
    fontSize: 11,
    marginTop: 5,
    textAlign: "center",
  },
});