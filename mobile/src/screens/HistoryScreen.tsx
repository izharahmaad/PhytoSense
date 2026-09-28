import React, {
  useCallback,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
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
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
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
  const normalized = stressLevel.toLowerCase();

  if (normalized.includes("healthy")) {
    return "#2D7A4B";
  }

  if (normalized.includes("mild")) {
    return "#A67829";
  }

  return "#B54848";
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
        setItems(history);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to load assessment history.";

        setErrorMessage(message);

        if (showLoader) {
          Alert.alert(
            "History unavailable",
            message,
          );
        }
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
    }, [loadHistory]),
  );

  const refresh = () => {
    setRefreshing(true);
    void loadHistory(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F5FAF6"
        />

        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#2D7A4B"
          />

          <Text style={styles.loadingText}>
            Loading assessments...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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
        keyExtractor={(item) => String(item.id)}
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
            <Text style={styles.eyebrow}>
              PLANT HEALTH RECORDS
            </Text>

            <Text style={styles.title}>
              Assessment history
            </Text>

            <Text style={styles.subtitle}>
              Review your previous plant-health
              assessments.
            </Text>

            {errorMessage && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorTitle}>
                  Could not refresh history
                </Text>

                <Text style={styles.errorText}>
                  {errorMessage}
                </Text>

                <Pressable
                  style={styles.retryButton}
                  onPress={() => void loadHistory()}
                >
                  <Text style={styles.retryText}>
                    Try again
                  </Text>
                </Pressable>
              </View>
            )}

            {items.length > 0 && (
              <Text style={styles.countText}>
                {items.length}{" "}
                {items.length === 1
                  ? "assessment"
                  : "assessments"}
              </Text>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const score = Number(item.health_score);
          const safeScore = Number.isFinite(score)
            ? Math.max(0, Math.min(1, score))
            : 0;

          const stressColor = getStressColor(
            item.stress_level,
          );

          const healthColor = getHealthColor(
            safeScore,
          );

          return (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.date}>
                  {formatDate(item.created_at)}
                </Text>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        `${stressColor}18`,
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
                    {formatStressLevel(
                      item.stress_level,
                    )}
                  </Text>
                </View>
              </View>

              <View style={styles.scoreRow}>
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
                    {Math.round(safeScore * 100)}%
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${safeScore * 100}%`,
                        backgroundColor: healthColor,
                      },
                    ]}
                  />
                </View>
              </View>

              {item.recommendation ? (
                <View style={styles.recommendationBox}>
                  <Text
                    style={styles.recommendationLabel}
                  >
                    Recommendation
                  </Text>

                  <Text style={styles.recommendation}>
                    {item.recommendation}
                  </Text>
                </View>
              ) : (
                <Text style={styles.noRecommendation}>
                  No recommendation was recorded.
                </Text>
              )}
            </View>
          );
        }}
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
              Your completed plant-health assessments
              will appear here.
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
    flex: 1,
    backgroundColor: "#F5FAF6",
  },

  list: {
    flex: 1,
    backgroundColor: "#F5FAF6",
  },

  listContent: {
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 30,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FAF6",
  },

  loadingText: {
    color: "#628472",
    fontSize: 13,
    marginTop: 12,
  },

  header: {
    marginBottom: 20,
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

  countText: {
    color: "#7B9885",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 18,
  },

  errorBanner: {
    backgroundColor: "#FFF4F2",
    borderColor: "#F0C9C3",
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 18,
    padding: 14,
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

  retryText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCEBE0",
    borderRadius: 19,
    borderWidth: 1,
    marginBottom: 13,
    padding: 16,
    shadowColor: "#1B4332",
    shadowOpacity: 0.05,
    shadowRadius: 7,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 2,
  },

  cardTopRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  date: {
    color: "#8A9C91",
    flex: 1,
    fontSize: 11,
    marginRight: 10,
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

  scoreRow: {
    marginBottom: 14,
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
    backgroundColor: "#E5F0E8",
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
    textTransform: "uppercase",
  },

  recommendation: {
    color: "#42664E",
    fontSize: 13,
    lineHeight: 19,
  },

  noRecommendation: {
    color: "#9AAFA0",
    fontSize: 12,
    fontStyle: "italic",
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