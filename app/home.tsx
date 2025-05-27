import { useUser } from "@/context/UserContext";
import {
  registerForPushNotificationsAsync,
  scheduleHydrationReminders,
  sendLocalNotification,
} from "@/utils/notifications";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { format } from "date-fns";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define types for water intake records
interface WaterIntake {
  id: string;
  amount: number; // in ml
  timestamp: number;
  date: string;
  containerType?: string; // cup, bottle, jug
}

interface DailyRecord {
  date: string;
  totalIntake: number; // in ml
  records: WaterIntake[];
  goalReachedNotified?: boolean; // Track if we've already notified for goal completion
}

const STORAGE_KEY_WATER_HISTORY = "water_intake_history";

// Water container types with icons and amounts
const WATER_CONTAINERS = [
  { type: "cup", icon: "water-outline" as const, amount: 200, label: "Cup" },
  { type: "glass", icon: "wine-outline" as const, amount: 250, label: "Glass" },
  {
    type: "bottle",
    icon: "flask-outline" as const,
    amount: 500,
    label: "Bottle",
  },
  {
    type: "jug",
    icon: "beaker-outline" as const,
    amount: 1000,
    label: "Jug (1L)",
  },
];

const Home = () => {
  const { userData } = useUser();
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [todayIntake, setTodayIntake] = useState(0); // in ml
  const [showAddModal, setShowAddModal] = useState(false);
  const [waterHistory, setWaterHistory] = useState<DailyRecord[]>([]);
  const [congratsVisible, setCongratsVisible] = useState(false);
  const goalReachedToday = useRef(false);
  const [selectedContainer, setSelectedContainer] = useState<string | null>(
    null
  );
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<number>(0);
  const { height: windowHeight } = useWindowDimensions();

  // Format daily goal to display
  const dailyGoalML = userData.dailyWaterGoal?.ml || 2400;
  const dailyGoal = userData.dailyWaterGoal
    ? userData.weightUnit === "kg"
      ? `${userData.dailyWaterGoal.liters}L`
      : `${userData.dailyWaterGoal.oz} oz`
    : "2.4L";

  // Calculate progress percentage
  const progressPercentage = Math.min((todayIntake / dailyGoalML) * 100, 100);
  const formattedProgress = progressPercentage.toFixed(0);
  const todayFormatted = format(new Date(), "yyyy-MM-dd");

  // Load water intake history
  const loadWaterHistory = useCallback(async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY_WATER_HISTORY);
      if (storedData) {
        const parsedData: DailyRecord[] = JSON.parse(storedData);
        setWaterHistory(parsedData);

        // Find today's record
        const todayRecord = parsedData.find(
          (record) => record.date === todayFormatted
        );
        if (todayRecord) {
          setTodayIntake(todayRecord.totalIntake);

          // Check if we've already reached the goal today
          if (
            todayRecord.goalReachedNotified ||
            todayRecord.totalIntake >= dailyGoalML
          ) {
            goalReachedToday.current = true;
          }
        }
      }
    } catch (error) {
      console.error("Error loading water history:", error);
    }
  }, [todayFormatted, dailyGoalML]);

  // Save water intake history
  const saveWaterHistory = async (records: DailyRecord[]) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY_WATER_HISTORY,
        JSON.stringify(records)
      );
    } catch (error) {
      console.error("Error saving water history:", error);
    }
  };

  // Add water intake
  const addWaterIntake = async (
    amount: number,
    containerType: string = "custom"
  ) => {
    try {
      // Get current date for record keeping
      const now = new Date();
      const newRecord: WaterIntake = {
        id: now.getTime().toString(),
        amount: amount,
        timestamp: now.getTime(),
        date: todayFormatted,
        containerType: containerType,
      };

      // Update waterHistory
      const updatedHistory = [...waterHistory];
      const todayRecordIndex = updatedHistory.findIndex(
        (record) => record.date === todayFormatted
      );

      let updatedTodayRecord: DailyRecord;
      let newTotalIntake: number;

      if (todayRecordIndex >= 0) {
        // Update existing record
        newTotalIntake = updatedHistory[todayRecordIndex].totalIntake + amount;

        updatedTodayRecord = {
          ...updatedHistory[todayRecordIndex],
          totalIntake: newTotalIntake,
          records: [...updatedHistory[todayRecordIndex].records, newRecord],
        };

        // Check if we need to mark goal as reached
        const wasGoalReached =
          updatedHistory[todayRecordIndex].totalIntake >= dailyGoalML;
        const isGoalReachedNow = newTotalIntake >= dailyGoalML;

        if (
          isGoalReachedNow &&
          !wasGoalReached &&
          !updatedHistory[todayRecordIndex].goalReachedNotified
        ) {
          updatedTodayRecord.goalReachedNotified = true;
        }

        updatedHistory[todayRecordIndex] = updatedTodayRecord;
      } else {
        // Create new record for today
        newTotalIntake = amount;
        updatedTodayRecord = {
          date: todayFormatted,
          totalIntake: amount,
          records: [newRecord],
          goalReachedNotified: amount >= dailyGoalML ? true : false,
        };

        updatedHistory.push(updatedTodayRecord);
      }

      // Update state and storage
      setWaterHistory(updatedHistory);
      await saveWaterHistory(updatedHistory);

      // Update today's intake
      setTodayIntake(newTotalIntake);

      // Provide haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Check if goal achieved for the first time today
      const isFirstTimeReachingGoal =
        newTotalIntake >= dailyGoalML && !goalReachedToday.current;

      if (isFirstTimeReachingGoal) {
        goalReachedToday.current = true;
        setCongratsVisible(true);
        sendLocalNotification(
          "Goal Reached! 🎉",
          "Congratulations! You've reached your daily water intake goal!"
        );

        // Hide congrats message after 3 seconds
        setTimeout(() => {
          setCongratsVisible(false);
        }, 3000);
      }

      // Reset selection state
      setSelectedContainer(null);
      setSelectedAmount(null);
      setCustomAmount(0);
    } catch (error) {
      console.error("Error adding water intake:", error);
    }
  };

  useEffect(() => {
    checkNotificationPermission();
    loadWaterHistory();
  }, [loadWaterHistory]);

  const checkNotificationPermission = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      setNotificationPermission(!!token);

      if (token) {
        // If we have permission, schedule notifications
        await scheduleHydrationReminders(userData);
      }
    } catch (error) {
      console.error("Error checking notification permission:", error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      setNotificationPermission(!!token);

      if (token) {
        await scheduleHydrationReminders(userData);
        Alert.alert(
          "Success!",
          "You'll now receive hydration reminders throughout the day."
        );
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      Alert.alert(
        "Permission Error",
        "We couldn't set up notifications. Please enable them in your device settings."
      );
    }
  };

  // Format amount for display based on user's preferred unit
  const formatAmount = (amountInML: number): string => {
    if (userData.weightUnit === "kg") {
      return `${(amountInML / 1000).toFixed(1)}L`;
    } else {
      return `${(amountInML / 29.5735).toFixed(0)} oz`;
    }
  };

  // Add this helper function to your component
  const getContainerIcon = (containerType: string | undefined) => {
    const container = WATER_CONTAINERS.find((c) => c.type === containerType);
    // Return the icon directly without casting to string
    return container?.icon || "water-outline";
  };

  // Render a water intake record
  const renderWaterRecord = ({ item }: { item: WaterIntake }) => {
    const recordTime = new Date(item.timestamp);

    return (
      <View style={styles.historyItem}>
        <View style={styles.historyItemLeft}>
          <Ionicons
            name={getContainerIcon(item.containerType)}
            size={20}
            color="#68c6ff"
          />
          <Text style={styles.historyItemAmount}>
            {formatAmount(item.amount)}
          </Text>
        </View>
        <Text style={styles.historyItemTime}>
          {format(recordTime, "h:mm a")}
        </Text>
      </View>
    );
  };

  // Get today's records
  const todayRecords =
    waterHistory.find((record) => record.date === todayFormatted)?.records ||
    [];

  // Add this calculation for a more adaptive height
  const calculateHistoryHeight = () => {
    // Base the height on screen size and content
    const baseHeight = windowHeight * 0.35; // 35% of screen height
    const minHeight = 150; // Minimum height in points
    const maxHeight = windowHeight * 0.5; // Maximum 50% of screen

    // If there are few records, use less space
    const recordCount = todayRecords.length;
    const recordBasedHeight = Math.min(50 + recordCount * 60, maxHeight);

    return Math.max(Math.min(baseHeight, recordBasedHeight), minHeight);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#e6f4ff" }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient
          colors={["#e6f4ff", "#f8fbff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.container}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hi there!</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.profileButton}
                onPress={() => {
                  router.push("/history");
                }}
              >
                <Ionicons name="time-outline" size={22} color="#68c6ff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profileButton, { marginLeft: 10 }]}
                onPress={() => {
                  router.push("/setting");
                }}
              >
                <Ionicons name="settings" size={22} color="#68c6ff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Congratulations Message */}
          {congratsVisible && (
            <View style={styles.congratsCard}>
              <Ionicons name="trophy" size={28} color="#ffc107" />
              <Text style={styles.congratsText}>
                Congratulations! You've reached your daily water goal! 🎉
              </Text>
            </View>
          )}

          {/* Water Goal Card */}
          <View style={styles.goalCard}>
            <View style={styles.goalCardHeader}>
              <Text style={styles.goalCardTitle}>Daily Water Goal</Text>
              <TouchableOpacity style={styles.infoButton} onPress={() => {}}>
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#89c4f4"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.goalAmount}>
              <Ionicons
                name="water"
                size={24}
                color="#68c6ff"
                style={styles.waterIcon}
              />
              <Text style={styles.goalAmountText}>{dailyGoal}</Text>
            </View>

            <View style={styles.reminderSection}>
              <Ionicons name="time-outline" size={18} color="#68c6ff" />
              <Text style={styles.reminderText}>
                Reminders active from {userData.wakeupTime.hour}:
                {userData.wakeupTime.minute < 10 ? "0" : ""}
                {userData.wakeupTime.minute} {userData.wakeupTime.ampm} to{" "}
                {userData.bedTime.hour}:
                {userData.bedTime.minute < 10 ? "0" : ""}
                {userData.bedTime.minute} {userData.bedTime.ampm}
              </Text>
            </View>
          </View>

          {/* Notification Permission Section */}
          {!notificationPermission && (
            <TouchableOpacity
              style={styles.notificationCard}
              onPress={requestNotificationPermission}
            >
              <View style={styles.notificationCardContent}>
                <Ionicons
                  name="notifications-outline"
                  size={24}
                  color="#fc9842"
                />
                <View style={styles.notificationTextContainer}>
                  <Text style={styles.notificationTitle}>Enable Reminders</Text>
                  <Text style={styles.notificationDesc}>
                    Get notifications to help you stay hydrated throughout the
                    day
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#ccc" />
              </View>
            </TouchableOpacity>
          )}

          {/* Progress Summary */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Today's Progress</Text>
            </View>

            <View style={styles.progressBarContainer}>
              <LinearGradient
                colors={["#68c6ff", "#aeefff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBar,
                  { width: `${progressPercentage}%` },
                ]}
              />
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressStatsText}>
                {formatAmount(todayIntake)} / {dailyGoal}
              </Text>
              <Text style={styles.progressPercentage}>
                {formattedProgress}%
              </Text>
            </View>

            <TouchableOpacity
              style={styles.addWaterButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.addWaterText}>Add Water</Text>
            </TouchableOpacity>

            {/* Today's history directly below the progress */}
            <View
              style={[
                styles.todayHistory,
                { maxHeight: calculateHistoryHeight() },
              ]}
            >
              <Text style={styles.todayHistoryTitle}>Today's Intake</Text>

              {todayRecords.length > 0 ? (
                <ScrollView
                  style={styles.todayHistoryList}
                  showsVerticalScrollIndicator={true}
                  contentContainerStyle={{ paddingBottom: 10 }}
                >
                  {todayRecords
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map((item) => (
                      <View key={item.id} style={styles.historyItem}>
                        <View style={styles.historyItemLeft}>
                          <Ionicons
                            name={getContainerIcon(item.containerType)}
                            size={20}
                            color="#68c6ff"
                          />
                          <Text style={styles.historyItemAmount}>
                            {formatAmount(item.amount)}
                          </Text>
                        </View>
                        <Text style={styles.historyItemTime}>
                          {format(new Date(item.timestamp), "h:mm a")}
                        </Text>
                      </View>
                    ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyTodayHistory}>
                  <Ionicons name="water-outline" size={24} color="#c4e0f3" />
                  <Text style={styles.emptyTodayText}>
                    No water intake recorded today
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </ScrollView>

      {/* Add Water Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Water</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color="#2b374b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Select your container:</Text>

            <View style={styles.containerGrid}>
              {WATER_CONTAINERS.map((container) => (
                <TouchableOpacity
                  key={container.type}
                  style={[
                    styles.containerButton,
                    selectedContainer === container.type &&
                      styles.selectedContainer,
                  ]}
                  onPress={() => {
                    setSelectedContainer(container.type);
                    setSelectedAmount(container.amount);
                  }}
                >
                  <Ionicons
                    name={container.icon}
                    size={32}
                    color={
                      selectedContainer === container.type ? "#fff" : "#68c6ff"
                    }
                  />
                  <Text
                    style={[
                      styles.containerLabel,
                      selectedContainer === container.type &&
                        styles.selectedContainerText,
                    ]}
                  >
                    {container.label}
                  </Text>
                  <Text
                    style={[
                      styles.containerAmount,
                      selectedContainer === container.type &&
                        styles.selectedContainerText,
                    ]}
                  >
                    {container.amount} ml
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.addSelectedButton,
                !selectedAmount && styles.disabledButton,
              ]}
              disabled={!selectedAmount}
              onPress={() => {
                if (selectedAmount && selectedContainer) {
                  addWaterIntake(selectedAmount, selectedContainer);
                  setShowAddModal(false);
                }
              }}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.addSelectedText}>
                Add {selectedAmount ? `${selectedAmount} ml` : "Water"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.customAmountButton}
              onPress={() => {
                // In a real app, you would show a number input here
                // For simplicity, we're just adding a default custom amount
                addWaterIntake(150, "custom");
                setShowAddModal(false);
              }}
            >
              <Text style={styles.customAmountText}>Add Custom Amount</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  headerButtons: {
    flexDirection: "row",
  },
  greeting: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
  },
  date: {
    fontSize: 14,
    color: "#68c6ff",
    fontWeight: "500",
  },
  profileButton: {
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
  goalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  goalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
  },
  infoButton: {
    padding: 4,
  },
  goalAmount: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  waterIcon: {
    marginRight: 10,
  },
  goalAmountText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#68c6ff",
  },
  reminderSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 12,
    borderRadius: 10,
  },
  reminderText: {
    fontSize: 14,
    color: "#5d7e9b",
    marginLeft: 8,
    flex: 1,
  },
  notificationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationTextContainer: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
  },
  notificationDesc: {
    fontSize: 13,
    color: "#89a9c4",
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
  },
  progressBarContainer: {
    height: 16,
    backgroundColor: "#e9f6ff",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBar: {
    height: "100%",
    borderRadius: 8,
  },
  progressStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  progressStatsText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2b374b",
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#68c6ff",
  },
  addWaterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#68c6ff",
    borderRadius: 30,
    paddingVertical: 12,
    marginTop: 5,
    marginBottom: 15,
  },
  addWaterText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  congratsCard: {
    backgroundColor: "#e6fbff",
    borderWidth: 1,
    borderColor: "#bae7ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  congratsText: {
    flex: 1,
    color: "#0891b2",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2b374b",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#5d7e9b",
    marginBottom: 16,
  },
  containerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  containerButton: {
    width: "48%",
    marginVertical: 6,
    borderRadius: 12,
    backgroundColor: "#f0f9ff",
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedContainer: {
    backgroundColor: "#68c6ff",
  },
  containerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
    marginTop: 8,
  },
  containerAmount: {
    fontSize: 14,
    color: "#89a9c4",
    marginTop: 4,
  },
  selectedContainerText: {
    color: "#ffffff",
  },
  addSelectedButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#68c6ff",
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: "#c4e0f3",
  },
  addSelectedText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  customAmountButton: {
    backgroundColor: "#f0f9ff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  customAmountText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#68c6ff",
  },
  todayHistory: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#e0f2fe",
    paddingTop: 10,
  },
  todayHistoryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2b374b",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2fe",
    paddingBottom: 8,
  },
  todayHistoryList: {
    flexGrow: 0,
    paddingRight: 5,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f9ff",
  },
  historyItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyItemAmount: {
    marginLeft: 10,
    fontSize: 15,
    color: "#2b374b",
    fontWeight: "500",
  },
  historyItemTime: {
    fontSize: 14,
    color: "#89a9c4",
  },
  emptyTodayHistory: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    flexDirection: "row",
  },
  emptyTodayText: {
    color: "#89a9c4",
    marginLeft: 10,
    fontSize: 14,
  },
});
