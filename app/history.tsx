import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDays,
  format,
  getDaysInMonth,
  getMonth,
  getYear,
  startOfMonth,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define types for water intake records
interface WaterIntake {
  id: string;
  amount: number; // in ml
  timestamp: number;
  date: string;
  containerType?: string;
}

interface DailyRecord {
  date: string;
  totalIntake: number; // in ml
  records: WaterIntake[];
  goalReachedNotified?: boolean;
}

const STORAGE_KEY_WATER_HISTORY = "water_intake_history";

const { width } = Dimensions.get("window");
const BAR_WIDTH = 32;
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const History = () => {
  const { userData } = useUser();
  const [waterHistory, setWaterHistory] = useState<DailyRecord[]>([]);
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const dailyGoalML = userData.dailyWaterGoal?.ml || 2400;

  // Load water intake history
  const loadWaterHistory = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY_WATER_HISTORY);
      if (storedData) {
        const parsedData: DailyRecord[] = JSON.parse(storedData);
        setWaterHistory(parsedData);
      }
    } catch (error) {
      console.error("Error loading water history:", error);
    }
  }, []);

  useEffect(() => {
    loadWaterHistory();
  }, [loadWaterHistory]);

  // Format amount for display based on user's preferred unit
  const formatAmount = (amountInML: number): string => {
    if (userData.weightUnit === "kg") {
      return `${(amountInML / 1000).toFixed(1)}L`;
    } else {
      return `${(amountInML / 29.5735).toFixed(0)} oz`;
    }
  };

  // Generate weekly data for the chart
  const getWeeklyData = () => {
    const weekData = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(currentWeekStart, i);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      const dayRecord = waterHistory.find((record) => record.date === dateStr);
      const intake = dayRecord ? dayRecord.totalIntake : 0;
      const percentage = Math.min((intake / dailyGoalML) * 100, 100);

      weekData.push({
        date: dateStr,
        day: DAYS[currentDate.getDay()],
        intake,
        percentage,
        isToday: format(new Date(), "yyyy-MM-dd") === dateStr,
      });
    }

    return weekData;
  };

  // Generate monthly data for the chart
  const getMonthlyData = () => {
    const monthData = [];
    const year = getYear(currentMonth);
    const month = getMonth(currentMonth);
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = startOfMonth(currentMonth);

    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateStr = format(currentDate, "yyyy-MM-dd");

      const dayRecord = waterHistory.find((record) => record.date === dateStr);
      const intake = dayRecord ? dayRecord.totalIntake : 0;
      const percentage = Math.min((intake / dailyGoalML) * 100, 100);

      monthData.push({
        date: dateStr,
        day: i,
        intake,
        percentage,
        isToday: format(new Date(), "yyyy-MM-dd") === dateStr,
      });
    }

    return monthData;
  };

  // Navigate to previous week/month
  const goToPrevious = () => {
    if (viewMode === "week") {
      setCurrentWeekStart(subWeeks(currentWeekStart, 1));
    } else {
      setCurrentMonth(
        new Date(getYear(currentMonth), getMonth(currentMonth) - 1, 1)
      );
    }
  };

  // Navigate to next week/month
  const goToNext = () => {
    if (viewMode === "week") {
      setCurrentWeekStart(addDays(currentWeekStart, 7));
    } else {
      setCurrentMonth(
        new Date(getYear(currentMonth), getMonth(currentMonth) + 1, 1)
      );
    }
  };

  // Switch to current week/month
  const goToCurrent = () => {
    if (viewMode === "week") {
      setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    } else {
      setCurrentMonth(new Date());
    }
  };

  // Get total intake for the current period
  const getTotalPeriodIntake = () => {
    let total = 0;

    if (viewMode === "week") {
      const weekData = getWeeklyData();
      weekData.forEach((day) => {
        total += day.intake;
      });
    } else {
      const monthData = getMonthlyData();
      monthData.forEach((day) => {
        total += day.intake;
      });
    }

    return total;
  };

  // Get average daily intake for the period
  const getAverageDailyIntake = () => {
    const total = getTotalPeriodIntake();
    const days = viewMode === "week" ? 7 : getDaysInMonth(currentMonth);
    return total / days;
  };

  // Get number of days goal was reached
  const getDaysGoalReached = () => {
    let count = 0;

    if (viewMode === "week") {
      const weekData = getWeeklyData();
      weekData.forEach((day) => {
        if (day.intake >= dailyGoalML) count++;
      });
    } else {
      const monthData = getMonthlyData();
      monthData.forEach((day) => {
        if (day.intake >= dailyGoalML) count++;
      });
    }

    return count;
  };

  // Render the weekly chart
  const renderWeeklyChart = () => {
    const weekData = getWeeklyData();
    const maxBarHeight = 200;

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Weekly Intake</Text>
          <View style={styles.chartActions}>
            <TouchableOpacity
              onPress={goToPrevious}
              style={styles.chartActionButton}
            >
              <Ionicons name="chevron-back" size={24} color="#68c6ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToCurrent}
              style={styles.chartActionButton}
            >
              <Ionicons name="today" size={20} color="#68c6ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              style={styles.chartActionButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#68c6ff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.chartPeriod}>
          {format(currentWeekStart, "MMM d")} -{" "}
          {format(addDays(currentWeekStart, 6), "MMM d, yyyy")}
        </Text>

        <View style={styles.chartContent}>
          <View style={styles.goalLine}>
            <View style={styles.goalLineInner} />
            <Text style={styles.goalText}>
              Goal: {formatAmount(dailyGoalML)}
            </Text>
          </View>

          <View style={styles.barContainer}>
            {weekData.map((day, index) => (
              <View key={index} style={styles.barGroup}>
                <View style={styles.barWrapper}>
                  <View style={[styles.emptyBar, { height: maxBarHeight }]} />
                  <View
                    style={[
                      styles.filledBar,
                      {
                        height: (day.percentage / 100) * maxBarHeight,
                        backgroundColor:
                          day.percentage >= 100 ? "#4CAF50" : "#68c6ff",
                      },
                    ]}
                  />
                  {day.isToday && <View style={styles.todayIndicator} />}
                </View>
                <Text
                  style={[styles.barLabel, day.isToday && styles.todayLabel]}
                >
                  {day.day}
                </Text>
                <Text style={styles.percentageText}>
                  {day.percentage.toFixed(0)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Render the monthly chart
  const renderMonthlyChart = () => {
    const monthData = getMonthlyData();
    const maxBarHeight = 200;
    const barContainerWidth = width - 40; // 20px padding on each side
    const scrollContentWidth = Math.max(
      monthData.length * 40,
      barContainerWidth
    );

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Monthly Intake</Text>
          <View style={styles.chartActions}>
            <TouchableOpacity
              onPress={goToPrevious}
              style={styles.chartActionButton}
            >
              <Ionicons name="chevron-back" size={24} color="#68c6ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToCurrent}
              style={styles.chartActionButton}
            >
              <Ionicons name="today" size={20} color="#68c6ff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={goToNext}
              style={styles.chartActionButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#68c6ff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.chartPeriod}>
          {format(currentMonth, "MMMM yyyy")}
        </Text>

        <View style={styles.chartContent}>
          <View style={styles.goalLine}>
            <View style={styles.goalLineInner} />
            <Text style={styles.goalText}>
              Goal: {formatAmount(dailyGoalML)}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={{ width: scrollContentWidth }}
          >
            <View style={[styles.barContainer, { width: scrollContentWidth }]}>
              {monthData.map((day, index) => (
                <View key={index} style={styles.barGroup}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.emptyBar, { height: maxBarHeight }]} />
                    <View
                      style={[
                        styles.filledBar,
                        {
                          height: (day.percentage / 100) * maxBarHeight,
                          backgroundColor:
                            day.percentage >= 100 ? "#4CAF50" : "#68c6ff",
                        },
                      ]}
                    />
                    {day.isToday && <View style={styles.todayIndicator} />}
                  </View>
                  <Text
                    style={[styles.barLabel, day.isToday && styles.todayLabel]}
                  >
                    {day.day}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // Add this component near other component definitions
  const SectionHeader: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  }> = ({ icon, title }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color="#68c6ff" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // Create a reusable header component
  const ScreenHeader: React.FC<{
    title: string;
    onBackPress: () => void;
  }> = ({ title, onBackPress }) => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Ionicons name="arrow-back" size={20} color="#68c6ff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#e6f4ff" }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScreenHeader title="Water History" onBackPress={() => router.back()} />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#e6f4ff", "#f8fbff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.gradientContainer}
        >
          {/* Toggle between week and month view */}
          <SectionHeader icon="calendar" title="View Mode" />
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "week" && styles.activeToggle,
              ]}
              onPress={() => setViewMode("week")}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === "week" && styles.activeToggleText,
                ]}
              >
                Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === "month" && styles.activeToggle,
              ]}
              onPress={() => setViewMode("month")}
            >
              <Text
                style={[
                  styles.toggleText,
                  viewMode === "month" && styles.activeToggleText,
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats summary */}
          <SectionHeader icon="stats-chart" title="Water Statistics" />
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatAmount(getTotalPeriodIntake())}
              </Text>
              <Text style={styles.statLabel}>Total Intake</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatAmount(getAverageDailyIntake())}
              </Text>
              <Text style={styles.statLabel}>Daily Average</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{getDaysGoalReached()}</Text>
              <Text style={styles.statLabel}>Days Goal Reached</Text>
            </View>
          </View>

          {/* Chart based on selected view */}
          {viewMode === "week" ? renderWeeklyChart() : renderMonthlyChart()}

          {/* Daily records */}
          <View style={styles.recordsContainer}>
            {waterHistory.length > 0 ? (
              <FlatList
                data={waterHistory.sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )}
                renderItem={({ item }) => {
                  const recordDate = new Date(item.date);
                  const isToday =
                    format(new Date(), "yyyy-MM-dd") === item.date;
                  const percentage = Math.min(
                    (item.totalIntake / dailyGoalML) * 100,
                    100
                  ).toFixed(0);

                  return (
                    <View style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <View style={styles.recordDateContainer}>
                          <Ionicons
                            name={isToday ? "today" : "calendar"}
                            size={16}
                            color="#68c6ff"
                            style={styles.recordIcon}
                          />
                          <View>
                            <Text style={styles.recordDate}>
                              {isToday
                                ? "Today"
                                : format(recordDate, "EEE, MMM d")}
                            </Text>
                            <Text style={styles.recordFullDate}>
                              {format(recordDate, "MMMM d, yyyy")}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.recordStats}>
                          <Text
                            style={[
                              styles.recordPercentage,
                              parseFloat(percentage) >= 100
                                ? styles.goalReachedText
                                : null,
                            ]}
                          >
                            {percentage}%
                          </Text>
                          <Text style={styles.recordAmount}>
                            {formatAmount(item.totalIntake)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${percentage}%` as any,
                              backgroundColor:
                                parseFloat(percentage) >= 100
                                  ? "#4CAF50"
                                  : "#68c6ff",
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                }}
                keyExtractor={(item) => item.date}
                scrollEnabled={false}
              />
            ) : (
              <View style={styles.emptyRecordsContainer}>
                <Ionicons name="water-outline" size={60} color="#d0ebff" />
                <Text style={styles.emptyRecordsText}>
                  No water intake recorded yet
                </Text>
                <Text style={styles.emptyRecordsSubtext}>
                  Start drinking and tracking your water intake!
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2b374b",
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e0f2fe",
    borderRadius: 25,
    marginBottom: 20,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 20,
  },
  activeToggle: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#89a9c4",
  },
  activeToggleText: {
    color: "#2b374b",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0f2fe",
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2b374b",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#89a9c4",
  },
  chartContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
  },
  chartActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartActionButton: {
    padding: 5,
  },
  chartPeriod: {
    fontSize: 14,
    color: "#89a9c4",
    marginBottom: 16,
  },
  chartContent: {
    height: 250,
    position: "relative",
  },
  goalLine: {
    position: "absolute",
    top: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 1,
  },
  goalLineInner: {
    flex: 1,
    height: 1,
    backgroundColor: "#ffc107",
    borderStyle: "dashed",
  },
  goalText: {
    color: "#ffc107",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
    paddingHorizontal: 5,
    backgroundColor: "#fff",
  },
  barContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: "100%",
    paddingTop: 30,
  },
  barGroup: {
    alignItems: "center",
    width: BAR_WIDTH,
  },
  barWrapper: {
    width: BAR_WIDTH - 8,
    position: "relative",
    justifyContent: "flex-end",
  },
  emptyBar: {
    width: "100%",
    backgroundColor: "#f0f9ff",
    borderRadius: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  filledBar: {
    width: "100%",
    borderRadius: 4,
    position: "absolute",
    bottom: 0,
    left: 0,
  },
  todayIndicator: {
    position: "absolute",
    top: -8,
    left: "50%",
    marginLeft: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff5252",
  },
  barLabel: {
    marginTop: 8,
    fontSize: 12,
    color: "#89a9c4",
    fontWeight: "500",
  },
  todayLabel: {
    color: "#2b374b",
    fontWeight: "bold",
  },
  percentageText: {
    fontSize: 10,
    color: "#89a9c4",
    marginTop: 4,
  },
  recordsContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recordDateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordIcon: {
    marginRight: 8,
  },
  recordsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
    marginBottom: 16,
  },
  recordCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
  },
  recordFullDate: {
    fontSize: 12,
    color: "#89a9c4",
    marginTop: 2,
  },
  recordStats: {
    alignItems: "flex-end",
  },
  recordPercentage: {
    fontSize: 14,
    fontWeight: "600",
    color: "#68c6ff",
  },
  goalReachedText: {
    color: "#4CAF50",
  },
  recordAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2b374b",
    marginTop: 2,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e9f6ff",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  emptyRecordsContainer: {
    alignItems: "center",
    padding: 30,
  },
  emptyRecordsText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
    textAlign: "center",
  },
  emptyRecordsSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#89a9c4",
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
    marginLeft: 8,
  },
});
