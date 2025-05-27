import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserData {
  isFirstTime: boolean;
  gender: "male" | "female" | null;
  weight: number;
  weightUnit: "kg" | "lbs";
  wakeupTime: {
    hour: number;
    minute: number;
    ampm: "AM" | "PM";
  };
  bedTime: {
    hour: number;
    minute: number;
    ampm: "AM" | "PM";
  };
  dailyWaterGoal: {
    ml: number;
    liters: number;
    oz: number;
  };
}

export const STORAGE_KEYS = {
  USER_DATA: "@DrinkMe_UserData",
};

export const initialUserData: UserData = {
  isFirstTime: true,
  gender: null,
  weight: 70,
  weightUnit: "kg",
  wakeupTime: {
    hour: 7,
    minute: 30,
    ampm: "AM",
  },
  bedTime: {
    hour: 11,
    minute: 30,
    ampm: "PM",
  },
  dailyWaterGoal: {
    ml: 2400,
    liters: 2.4,
    oz: 81.15,
  },
};

export const storeUserData = async (userData: UserData): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.USER_DATA,
      JSON.stringify(userData)
    );
  } catch (error) {
    console.error("Error storing user data:", error);
  }
};

export const getUserData = async (): Promise<UserData | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.error("Error reading user data:", error);
    return null;
  }
};

export const calculateDailyWaterGoal = (
  weight: number,
  weightUnit: "kg" | "lbs",
  gender: "male" | "female"
): { ml: number; liters: number; oz: number } => {
  // Convert weight to kg if in lbs
  const weightInKg = weightUnit === "lbs" ? weight / 2.20462 : weight;

  // Calculate water needs
  // Base calculation: ~30-35ml per kg of body weight
  // Gender adjustments: Men typically need slightly more water than women
  const mlPerKg = gender === "male" ? 35 : 31;

  const waterInMl = Math.round(weightInKg * mlPerKg * 10) / 10;
  const waterInLiters = Math.round(waterInMl / 100) / 10; // Round to 1 decimal place
  const waterInOz = Math.round((waterInMl / 29.5735) * 10) / 10; // Convert to oz, round to 1 decimal place

  return {
    ml: waterInMl,
    liters: waterInLiters,
    oz: waterInOz,
  };
};
