import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { UserData } from "./storage";

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("hydration-reminders", {
      name: "Hydration Reminders",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#68c6ff",
      sound: "default",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      // Cancel any existing scheduled notifications before requesting permission
      await Notifications.cancelAllScheduledNotificationsAsync();

      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      alert("Failed to get push token for notifications!");
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    alert("Must use physical device for Push Notifications");
  }

  return token;
}

// Function to format time in 24-hour format needed for scheduling
const formatTimeFor24Hour = (
  hour: number,
  minute: number,
  ampm: string
): { hour: number; minute: number } => {
  let hour24 = hour;

  // Convert to 24-hour format
  if (ampm === "PM" && hour !== 12) {
    hour24 = hour + 12;
  } else if (ampm === "AM" && hour === 12) {
    hour24 = 0;
  }

  return { hour: hour24, minute };
};

// Schedule hydration reminders based on wake and sleep times
export const scheduleHydrationReminders = async (userData: UserData) => {
  // Check permissions first
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    console.log("Notification permissions not granted, skipping scheduling");
    return;
  }

  // Cancel any existing reminders first
  await Notifications.cancelAllScheduledNotificationsAsync();

  const { wakeupTime, bedTime } = userData;

  // Convert to 24-hour format
  const wakeTime = formatTimeFor24Hour(
    wakeupTime.hour,
    wakeupTime.minute,
    wakeupTime.ampm
  );
  const sleepTime = formatTimeFor24Hour(
    bedTime.hour,
    bedTime.minute,
    bedTime.ampm
  );

  // Calculate active hours
  let activeHours;
  if (sleepTime.hour >= wakeTime.hour) {
    activeHours = sleepTime.hour - wakeTime.hour;
  } else {
    activeHours = 24 - wakeTime.hour + sleepTime.hour;
  }

  // We'll schedule reminders approximately every 2 hours during awake time
  const remindersCount = Math.max(3, Math.floor(activeHours / 2));

  // Calculate interval in minutes
  const intervalMinutes = (activeHours * 60) / remindersCount;

  // Create reminders
  for (let i = 1; i <= remindersCount; i++) {
    // Start first reminder 30 minutes after wakeup
    const minutesAfterWakeup = 30 + (i - 1) * intervalMinutes;

    // Calculate reminder time
    const reminderMinutes = (wakeTime.minute + minutesAfterWakeup) % 60;
    const reminderHours =
      (wakeTime.hour +
        Math.floor((wakeTime.minute + minutesAfterWakeup) / 60)) %
      24;

    // Skip reminders that would fall after bedtime
    if (
      reminderHours > sleepTime.hour ||
      (reminderHours === sleepTime.hour && reminderMinutes > sleepTime.minute)
    ) {
      continue;
    }

    // Create reminder message
    const message = getRandomReminderMessage();

    // Schedule the reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Hydration Time!",
        body: message,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: reminderHours,
        minute: reminderMinutes,
      },
    });
  }
};

// Random reminder messages
const getRandomReminderMessage = (): string => {
  const messages = [
    "Time to drink water! Your body will thank you.",
    "Hydration check! Grab your water bottle.",
    "Water break! Stay hydrated, stay healthy.",
    "Reminder: Drink some water to feel your best!",
    "Your daily water goal is waiting! Take a sip now.",
    "Feeling tired? Try drinking some water!",
    "Staying hydrated improves your mood and energy!",
    "Take a moment to hydrate yourself!",
    "Water is your superpower! Drink up!",
    "Your cells are thirsty! Drink some water now.",
  ];

  return messages[Math.floor(Math.random() * messages.length)];
};

// Send a local notification immediately
export const sendLocalNotification = async (title: string, body: string) => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") {
    console.log("Notification permissions not granted");
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, // Send immediately
  });
};
