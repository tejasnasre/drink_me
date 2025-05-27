import { useUser } from "@/context/UserContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Helper function to schedule notifications based on user preferences
const scheduleHydrationReminders = async (userData: any) => {
  try {
    // Cancel existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { wakeupTime, bedTime, reminderFrequency } = userData;

    // Calculate waketime and bedtime in 24-hour format
    const wakeHour =
      wakeupTime.hour +
      (wakeupTime.ampm === "PM" && wakeupTime.hour !== 12 ? 12 : 0);
    const bedHour =
      bedTime.hour + (bedTime.ampm === "PM" && bedTime.hour !== 12 ? 12 : 0);

    // Schedule notifications from wake time to bed time at the specified frequency
    let currentHour = wakeHour;

    while (currentHour < bedHour) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Time to hydrate!",
          body: "Don't forget to drink some water.",
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: currentHour,
          minute: wakeupTime.minute,
        },
      });

      currentHour += reminderFrequency;
    }

    return true;
  } catch (error) {
    console.error("Error scheduling notifications:", error);
    return false;
  }
};

interface SettingCardProps {
  children: React.ReactNode;
}

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  rightComponent?: React.ReactNode;
}

interface EditButtonProps {
  onPress: () => void;
  text?: string;
}

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export default function SettingsScreen() {
  const {
    userData,
    updateUserWeight,
    updateWakeupTime,
    updateBedTime,
    updateUserUnit,
    updateReminderFrequency,
    updateSoundEnabled,
    updateNotificationsEnabled,
  } = useUser();

  // States for settings
  const [soundEnabled, setSoundEnabled] = useState(
    userData.soundEnabled ?? true
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    userData.notificationsEnabled ?? true
  );
  const [reminderFrequency, setReminderFrequency] = useState(
    userData.reminderFrequency ?? 2
  );

  // Modal states
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWakeTimeModal, setShowWakeTimeModal] = useState(false);
  const [showBedTimeModal, setShowBedTimeModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [showFrequencyModal, setShowFrequencyModal] = useState(false);

  // Edit states
  const [editWeight, setEditWeight] = useState(userData.weight.toString());
  const [editWeightUnit, setEditWeightUnit] = useState(userData.weightUnit);

  // Time edit states
  const [editWakeHour, setEditWakeHour] = useState(userData.wakeupTime.hour);
  const [editWakeMinute, setEditWakeMinute] = useState(
    userData.wakeupTime.minute
  );
  const [editWakeAmPm, setEditWakeAmPm] = useState(userData.wakeupTime.ampm);

  const [editBedHour, setEditBedHour] = useState(userData.bedTime.hour);
  const [editBedMinute, setEditBedMinute] = useState(userData.bedTime.minute);
  const [editBedAmPm, setEditBedAmPm] = useState(userData.bedTime.ampm);

  // Helper function for time formatting
  const formatTime = (hour: number, minute: number, ampm: string) => {
    return `${hour < 10 ? "0" + hour : hour}:${
      minute < 10 ? "0" + minute : minute
    } ${ampm}`;
  };

  // Toggle functions with context updates
  const toggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await updateSoundEnabled(value);
  };

  const toggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    await updateNotificationsEnabled(value);

    // Reschedule notifications if enabled
    if (value) {
      await scheduleHydrationReminders(userData);
    } else {
      // Cancel notifications if disabled
      await Notifications.cancelAllScheduledNotificationsAsync();
    }
  };

  // Handle weight update
  const handleWeightUpdate = async () => {
    try {
      const weightValue = parseInt(editWeight, 10);
      if (isNaN(weightValue) || weightValue <= 0) {
        Alert.alert("Invalid Weight", "Please enter a valid weight value");
        return;
      }

      await updateUserWeight(weightValue, editWeightUnit as "kg" | "lbs");

      // Navigate back to home to refresh calculations based on new weight
      setShowWeightModal(false);
      router.push("/home");
    } catch (error) {
      console.error("Error updating weight:", error);
      Alert.alert("Error", "Failed to update weight");
    }
  };

  // Handle wake time update
  const handleWakeTimeUpdate = async () => {
    try {
      await updateWakeupTime(
        editWakeHour,
        editWakeMinute,
        editWakeAmPm as "AM" | "PM"
      );

      // Reschedule notifications with new wake time if enabled
      if (notificationsEnabled) {
        await scheduleHydrationReminders({
          ...userData,
          wakeupTime: {
            hour: editWakeHour,
            minute: editWakeMinute,
            ampm: editWakeAmPm as "AM" | "PM",
          },
        });
      }

      setShowWakeTimeModal(false);
    } catch (error) {
      console.error("Error updating wake time:", error);
      Alert.alert("Error", "Failed to update wake time");
    }
  };

  // Handle bed time update
  const handleBedTimeUpdate = async () => {
    try {
      await updateBedTime(
        editBedHour,
        editBedMinute,
        editBedAmPm as "AM" | "PM"
      );

      // Reschedule notifications with new bed time if enabled
      if (notificationsEnabled) {
        await scheduleHydrationReminders({
          ...userData,
          bedTime: {
            hour: editBedHour,
            minute: editBedMinute,
            ampm: editBedAmPm as "AM" | "PM",
          },
        });
      }

      setShowBedTimeModal(false);
    } catch (error) {
      console.error("Error updating bed time:", error);
      Alert.alert("Error", "Failed to update bed time");
    }
  };

  // Handle unit update
  const handleUnitChange = async (unit: "ml" | "oz") => {
    try {
      await updateUserUnit(unit);

      // Force recalculation of daily goal
      // This assumes your UserContext handles recalculation when unit changes

      setShowUnitModal(false);

      // Navigate back to home to refresh calculations
      router.push("/home");
    } catch (error) {
      console.error("Error updating unit:", error);
      Alert.alert("Error", "Failed to update unit");
    }
  };

  const SettingCard: React.FC<SettingCardProps> = ({ children }) => (
    <View style={styles.settingCard}>{children}</View>
  );

  const SettingRow: React.FC<SettingRowProps> = ({
    icon,
    title,
    subtitle,
    rightComponent,
  }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingRowLeft}>
        <View style={styles.titleContainer}>
          <Ionicons name={icon} size={16} color="#68c6ff" />
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent}
    </View>
  );

  const EditButton: React.FC<EditButtonProps> = ({
    onPress,
    text = "Edit",
  }) => (
    <TouchableOpacity style={styles.editButton} onPress={onPress}>
      <Text style={styles.editButtonText}>{text}</Text>
    </TouchableOpacity>
  );

  const CustomSwitch: React.FC<CustomSwitchProps> = ({
    value,
    onValueChange,
  }) => (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={[
        styles.switchContainer,
        { backgroundColor: value ? "#68c6ff" : "#e9f6ff" },
      ]}
    >
      <View style={[styles.switchThumb, { left: value ? 20 : 4 }]} />
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
  }> = ({ icon, title }) => (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color="#68c6ff" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={["#e6f4ff", "#f8fbff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.5 }}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#68c6ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Reminder Settings */}
          <SectionHeader icon="water" title="Reminder Settings" />
          <SettingCard>
            <SettingRow
              icon="time-outline"
              title="Reminder Time"
              subtitle={`Every ${reminderFrequency} hours`}
              rightComponent={
                <EditButton onPress={() => setShowFrequencyModal(true)} />
              }
            />
          </SettingCard>

          <SettingCard>
            <SettingRow
              icon="notifications-outline"
              title="Sound"
              rightComponent={
                <CustomSwitch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                />
              }
            />
          </SettingCard>

          {/* General */}
          <SectionHeader icon="settings" title="General" />
          <SettingCard>
            <SettingRow
              icon="options-outline"
              title="Units"
              rightComponent={
                <View style={styles.unitContainer}>
                  <Text style={styles.unitText}>
                    {userData.unit === "ml" ? "ml" : "oz"}
                  </Text>
                  <EditButton
                    onPress={() => setShowUnitModal(true)}
                    text="Change"
                  />
                </View>
              }
            />
          </SettingCard>

          <SettingCard>
            <SettingRow
              icon="notifications-off-outline"
              title="Notifications"
              rightComponent={
                <CustomSwitch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                />
              }
            />
          </SettingCard>

          {/* Personal Info */}
          <SectionHeader icon="person" title="Personal Info" />
          <SettingCard>
            <SettingRow
              icon="fitness"
              title="Weight"
              rightComponent={
                <View style={styles.unitContainer}>
                  <Text style={styles.unitText}>
                    {userData.weight} {userData.weightUnit}
                  </Text>
                  <EditButton onPress={() => setShowWeightModal(true)} />
                </View>
              }
            />
          </SettingCard>

          <SettingCard>
            <SettingRow
              icon="sunny"
              title="Wake Time"
              rightComponent={
                <View style={styles.unitContainer}>
                  <Text style={styles.unitText}>
                    {formatTime(
                      userData.wakeupTime.hour,
                      userData.wakeupTime.minute,
                      userData.wakeupTime.ampm
                    )}
                  </Text>
                  <EditButton onPress={() => setShowWakeTimeModal(true)} />
                </View>
              }
            />
          </SettingCard>

          <SettingCard>
            <SettingRow
              icon="moon"
              title="Bed Time"
              rightComponent={
                <View style={styles.unitContainer}>
                  <Text style={styles.unitText}>
                    {formatTime(
                      userData.bedTime.hour,
                      userData.bedTime.minute,
                      userData.bedTime.ampm
                    )}
                  </Text>
                  <EditButton onPress={() => setShowBedTimeModal(true)} />
                </View>
              }
            />
          </SettingCard>

          {/* Other */}
          <SectionHeader icon="information-circle" title="Other" />
          <SettingCard>
            <SettingRow
              icon="cafe"
              title="About App"
              rightComponent={
                <EditButton
                  onPress={() =>
                    Alert.alert(
                      "About",
                      "Drink Me - Your hydration companion\nVersion 1.0.0"
                    )
                  }
                  text="View"
                />
              }
            />
          </SettingCard>

          <SettingCard>
            <SettingRow
              icon="chatbubble"
              title="Send Feedback"
              rightComponent={
                <EditButton
                  onPress={() =>
                    Alert.alert(
                      "Feedback",
                      "Thank you for your interest! Feedback feature coming soon."
                    )
                  }
                  text="Send"
                />
              }
            />
          </SettingCard>

          {/* Hydration Illustration */}
          <View style={styles.illustration}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri: "https://storage.googleapis.com/uxpilot-auth.appspot.com/77fba1da50-998eb8ce1a9a598bb8fa.png",
                }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Drink Me © 2025</Text>
          <Text style={styles.footerText}>@tejasnasre</Text>
        </View>
      </LinearGradient>

      {/* Weight Modal */}
      <Modal
        visible={showWeightModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Update Weight</Text>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                value={editWeight}
                onChangeText={setEditWeight}
                keyboardType="numeric"
                placeholder="Enter weight"
              />
              <View style={styles.unitSelectorContainer}>
                <TouchableOpacity
                  style={[
                    styles.unitSelector,
                    editWeightUnit === "kg" && styles.unitSelectorActive,
                  ]}
                  onPress={() => setEditWeightUnit("kg")}
                >
                  <Text
                    style={[
                      styles.unitSelectorText,
                      editWeightUnit === "kg" && styles.unitSelectorTextActive,
                    ]}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.unitSelector,
                    editWeightUnit === "lbs" && styles.unitSelectorActive,
                  ]}
                  onPress={() => setEditWeightUnit("lbs")}
                >
                  <Text
                    style={[
                      styles.unitSelectorText,
                      editWeightUnit === "lbs" && styles.unitSelectorTextActive,
                    ]}
                  >
                    lbs
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleWeightUpdate}
              >
                <Text
                  style={[styles.modalButtonText, styles.modalSaveButtonText]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Units Modal */}
      <Modal
        visible={showUnitModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Unit</Text>
            <View style={styles.unitSelectorContainer}>
              <TouchableOpacity
                style={[styles.unitOptionButton, styles.unitOptionButtonLeft]}
                onPress={() => handleUnitChange("ml")}
              >
                <Text style={styles.unitOptionText}>Milliliters (ml)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitOptionButton, styles.unitOptionButtonRight]}
                onPress={() => handleUnitChange("oz")}
              >
                <Text style={styles.unitOptionText}>Ounces (oz)</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowUnitModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Frequency Modal */}
      <Modal
        visible={showFrequencyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFrequencyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reminder Frequency</Text>
            <Text style={styles.modalSubtitle}>
              How often would you like to be reminded?
            </Text>
            <View style={styles.frequencyOptionsContainer}>
              {[1, 2, 3, 4].map((hours) => (
                <TouchableOpacity
                  key={hours}
                  style={[
                    styles.frequencyOption,
                    reminderFrequency === hours && styles.frequencyOptionActive,
                  ]}
                  onPress={async () => {
                    setReminderFrequency(hours);
                    await updateReminderFrequency(hours);
                    setShowFrequencyModal(false);

                    // Reschedule notifications with new frequency if enabled
                    if (notificationsEnabled) {
                      await scheduleHydrationReminders({
                        ...userData,
                        reminderFrequency: hours,
                      });
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.frequencyOptionText,
                      reminderFrequency === hours &&
                        styles.frequencyOptionTextActive,
                    ]}
                  >
                    {hours} {hours === 1 ? "hour" : "hours"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setShowFrequencyModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#e6f4ff",
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: StatusBar.currentHeight,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  settingCard: {
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
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingRowLeft: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#2b374b",
    marginLeft: 8,
  },
  settingSubtitle: {
    fontSize: 13,
    color: "#68c6ff",
    marginLeft: 24,
  },
  editButton: {
    backgroundColor: "#e9f6ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  editButtonText: {
    color: "#68c6ff",
    fontSize: 13,
    fontWeight: "600",
  },
  switchContainer: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  switchThumb: {
    position: "absolute",
    top: 2,
    width: 20,
    height: 20,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  unitContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  unitText: {
    fontSize: 13,
    color: "#68c6ff",
    fontWeight: "500",
    marginRight: 8,
  },
  illustration: {
    alignItems: "center",
    marginVertical: 24,
  },
  imageContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#e9f6ff",
    shadowColor: "#68c6ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    color: "#89a9c4",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2b374b",
    marginBottom: 16,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#68c6ff",
    textAlign: "center",
    marginBottom: 16,
  },
  modalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d0e6f5",
    borderRadius: 8,
    padding: 10,
    marginRight: 10,
    fontSize: 16,
  },
  unitSelectorContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  unitSelector: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d0e6f5",
    marginRight: 10,
    borderRadius: 8,
  },
  unitSelectorActive: {
    backgroundColor: "#e9f6ff",
    borderColor: "#68c6ff",
  },
  unitSelectorText: {
    color: "#b8e5ff",
    fontWeight: "600",
  },
  unitSelectorTextActive: {
    color: "#68c6ff",
  },
  modalButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  modalCancelButton: {
    backgroundColor: "#e9f6ff",
  },
  modalSaveButton: {
    backgroundColor: "#68c6ff",
  },
  modalButtonText: {
    fontWeight: "600",
    color: "#68c6ff",
  },
  modalSaveButtonText: {
    color: "white",
  },
  unitOptionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 8,
    backgroundColor: "#e9f6ff",
    borderRadius: 8,
    marginHorizontal: 5,
  },
  unitOptionButtonLeft: {
    marginRight: 5,
  },
  unitOptionButtonRight: {
    marginLeft: 5,
  },
  unitOptionText: {
    color: "#68c6ff",
    fontWeight: "500",
  },
  frequencyOptionsContainer: {
    marginBottom: 16,
  },
  frequencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#d0e6f5",
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  frequencyOptionActive: {
    backgroundColor: "#e9f6ff",
    borderColor: "#68c6ff",
  },
  frequencyOptionText: {
    color: "#b8e5ff",
    fontWeight: "600",
  },
  frequencyOptionTextActive: {
    color: "#68c6ff",
  },
});
