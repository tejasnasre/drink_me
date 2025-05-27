import {
  calculateDailyWaterGoal,
  getUserData,
  initialUserData,
  storeUserData,
  UserData,
} from "@/utils/storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// If UserData doesn't include these properties in storage.ts, add them there
// If you can't modify storage.ts, extend the type here:
export interface ExtendedUserData extends UserData {
  reminderFrequency?: number;
  soundEnabled?: boolean;
  notificationsEnabled?: boolean;
  unit?: "ml" | "oz";
}

export interface UserContextType {
  userData: ExtendedUserData;
  loading: boolean;
  updateUserWeight: (weight: number, unit: "kg" | "lbs") => Promise<void>;
  updateWakeupTime: (
    hour: number,
    minute: number,
    ampm: "AM" | "PM"
  ) => Promise<void>;
  updateBedTime: (
    hour: number,
    minute: number,
    ampm: "AM" | "PM"
  ) => Promise<void>;
  updateUserUnit: (unit: "ml" | "oz") => Promise<void>;
  updateUserGender: (gender: "male" | "female") => Promise<void>;
  updateUserData: (data: Partial<ExtendedUserData>) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateReminderFrequency: (frequency: number) => Promise<void>;
  updateSoundEnabled: (enabled: boolean) => Promise<void>;
  updateNotificationsEnabled: (enabled: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserData] = useState<ExtendedUserData>(initialUserData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedData = await getUserData();
      if (storedData) {
        setUserData(storedData as ExtendedUserData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = async (data: Partial<ExtendedUserData>) => {
    try {
      const updatedData = { ...userData, ...data };
      setUserData(updatedData);
      await storeUserData(updatedData);
    } catch (error) {
      console.error("Error updating user data:", error);
      throw error; // Rethrow to allow components to catch errors
    }
  };

  const updateUserGender = async (gender: "male" | "female") => {
    await updateUserData({ gender });
  };

  const updateUserWeight = async (weight: number, weightUnit: "kg" | "lbs") => {
    await updateUserData({ weight, weightUnit });
  };

  const updateWakeupTime = async (
    hour: number,
    minute: number,
    ampm: "AM" | "PM"
  ) => {
    await updateUserData({
      wakeupTime: { hour, minute, ampm },
    });
  };

  const updateBedTime = async (
    hour: number,
    minute: number,
    ampm: "AM" | "PM"
  ) => {
    await updateUserData({
      bedTime: { hour, minute, ampm },
    });
  };

  const updateUserUnit = async (unit: "ml" | "oz") => {
    try {
      await updateUserData({ unit });
    } catch (error) {
      console.error("Error updating user unit:", error);
      throw error;
    }
  };

  const updateReminderFrequency = async (frequency: number) => {
    await updateUserData({ reminderFrequency: frequency });
  };

  const updateSoundEnabled = async (enabled: boolean) => {
    await updateUserData({ soundEnabled: enabled });
  };

  const updateNotificationsEnabled = async (enabled: boolean) => {
    await updateUserData({ notificationsEnabled: enabled });
  };

  const completeOnboarding = async () => {
    // Calculate water goal based on current data
    const waterGoal = calculateDailyWaterGoal(
      userData.weight,
      userData.weightUnit,
      userData.gender || "male" // Default to male if somehow gender is not set
    );

    await updateUserData({
      isFirstTime: false,
      dailyWaterGoal: waterGoal,
    });
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        loading,
        updateUserData,
        updateUserGender,
        updateUserWeight,
        updateWakeupTime,
        updateBedTime,
        updateUserUnit,
        updateReminderFrequency,
        updateSoundEnabled,
        updateNotificationsEnabled,
        completeOnboarding,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
