import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  DAILY_GOALS: 'daily_goals',
  WORKOUTS: 'workouts',
  USER_INFO: 'user_info',
  DAILY_PROGRESS: 'daily_progress',
};

// Daily Goals
export const getDailyGoals = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
    return data ? JSON.parse(data) : { water: 2, calories: 2000 };
  } catch (error) {
    console.error('Error getting daily goals:', error);
    return { water: 2, calories: 2000 };
  }
};

export const saveDailyGoals = async (goals) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving daily goals:', error);
  }
};

// Daily Progress
export const getDailyProgress = async () => {
  try {
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    return allProgress[today] || { water: 0, calories: 0 };
  } catch (error) {
    console.error('Error getting daily progress:', error);
    return { water: 0, calories: 0 };
  }
};

export const updateDailyProgress = async (progress) => {
  try {
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    allProgress[today] = { ...allProgress[today], ...progress };
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error updating daily progress:', error);
  }
};

// Workouts
export const getWorkouts = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    return [];
  }
};

export const saveWorkouts = async (workouts) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (error) {
    console.error('Error saving workouts:', error);
  }
};

// User Info
export const getUserInfo = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return data ? JSON.parse(data) : { weight: null, height: null };
  } catch (error) {
    console.error('Error getting user info:', error);
    return { weight: null, height: null };
  }
};

export const saveUserInfo = async (info) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
  } catch (error) {
    console.error('Error saving user info:', error);
  }
};

