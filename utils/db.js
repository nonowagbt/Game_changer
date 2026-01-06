import AsyncStorage from '@react-native-async-storage/async-storage';
import { mongodbConfig, isMongoConfigured } from '../config/mongodb';

// Vérifier si MongoDB est configuré
const mongoConfigured = isMongoConfigured();

// Générer un ID utilisateur unique (stocké localement)
const getUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem('user_id', userId);
    }
    return userId;
  } catch (error) {
    return `user_${Date.now()}`;
  }
};

// Fonctions pour interagir avec MongoDB via Data API
const mongoRequest = async (action, collection, filter = {}, additionalData = {}) => {
  if (!mongoConfigured) {
    throw new Error('MongoDB not configured');
  }

  try {
    const userId = await getUserId();
    const url = `${mongodbConfig.apiUrl}/action/${action}`;
    
    const requestBody = {
      dataSource: mongodbConfig.clusterName,
      database: mongodbConfig.databaseName,
      collection: collection,
      filter: { userId, ...filter },
      ...additionalData,
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': mongodbConfig.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MongoDB API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('MongoDB request error:', error);
    throw error;
  }
};

// Fallback vers AsyncStorage
const STORAGE_KEYS = {
  DAILY_GOALS: 'daily_goals',
  WORKOUTS: 'workouts',
  USER_INFO: 'user_info',
  DAILY_PROGRESS: 'daily_progress',
};

// Daily Goals
export const getDailyGoals = async () => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
      return data ? JSON.parse(data) : { water: 2, calories: 2000 };
    } catch (error) {
      return { water: 2, calories: 2000 };
    }
  }

  try {
    const result = await mongoRequest('findOne', 'dailyGoals');
    if (result.document) {
      return result.document;
    }
    // Valeurs par défaut
    const defaultGoals = { water: 2, calories: 2000 };
    await saveDailyGoals(defaultGoals);
    return defaultGoals;
  } catch (error) {
    console.error('Error getting daily goals:', error);
    // Fallback vers AsyncStorage en cas d'erreur
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOALS);
    return data ? JSON.parse(data) : { water: 2, calories: 2000 };
  }
};

export const saveDailyGoals = async (goals) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
    } catch (error) {
      console.error('Error saving daily goals:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    await mongoRequest('updateOne', 'dailyGoals', {}, {
      update: {
        $set: {
          ...goals,
          userId,
          updatedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    });
  } catch (error) {
    console.error('Error saving daily goals:', error);
    // Fallback vers AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_GOALS, JSON.stringify(goals));
  }
};

// Daily Progress
export const getDailyProgress = async () => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const today = new Date().toDateString();
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
      const allProgress = data ? JSON.parse(data) : {};
      return allProgress[today] || { water: 0, calories: 0 };
    } catch (error) {
      return { water: 0, calories: 0 };
    }
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const result = await mongoRequest('findOne', 'dailyProgress', { date: today });
    if (result.document) {
      return result.document;
    }
    return { water: 0, calories: 0, date: today };
  } catch (error) {
    console.error('Error getting daily progress:', error);
    // Fallback vers AsyncStorage
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    return allProgress[today] || { water: 0, calories: 0 };
  }
};

export const updateDailyProgress = async (progress) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const today = new Date().toDateString();
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
      const allProgress = data ? JSON.parse(data) : {};
      allProgress[today] = { ...allProgress[today], ...progress };
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(allProgress));
    } catch (error) {
      console.error('Error updating daily progress:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    const today = new Date().toISOString().split('T')[0];
    
    // Récupérer les valeurs existantes pour les fusionner
    const existing = await getDailyProgress();
    const mergedProgress = {
      water: progress.water !== undefined ? progress.water : existing.water || 0,
      calories: progress.calories !== undefined ? progress.calories : existing.calories || 0,
    };
    
    await mongoRequest('updateOne', 'dailyProgress', { date: today }, {
      update: {
        $set: {
          ...mergedProgress,
          userId,
          date: today,
          updatedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    });
  } catch (error) {
    console.error('Error updating daily progress:', error);
    // Fallback vers AsyncStorage
    const today = new Date().toDateString();
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
    const allProgress = data ? JSON.parse(data) : {};
    allProgress[today] = { ...allProgress[today], ...progress };
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_PROGRESS, JSON.stringify(allProgress));
  }
};

// Workouts
export const getWorkouts = async () => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      return [];
    }
  }

  try {
    const result = await mongoRequest('find', 'workouts', {}, {
      sort: { createdAt: -1 },
    });
    return result.documents || [];
  } catch (error) {
    console.error('Error getting workouts:', error);
    // Fallback vers AsyncStorage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUTS);
    return data ? JSON.parse(data) : [];
  }
};

export const saveWorkouts = async (workouts) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
    } catch (error) {
      console.error('Error saving workouts:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    
    // Supprimer tous les workouts existants pour cet utilisateur
    await mongoRequest('deleteMany', 'workouts', {});
    
    // Insérer les nouveaux workouts
    if (workouts.length > 0) {
      const workoutsWithUserId = workouts.map(workout => ({
        ...workout,
        userId,
        createdAt: workout.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      await mongoRequest('insertMany', 'workouts', {}, {
        documents: workoutsWithUserId,
      });
    }
  } catch (error) {
    console.error('Error saving workouts:', error);
    // Fallback vers AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  }
};

export const saveWorkout = async (workout) => {
  if (!mongoConfigured) {
    // Pour AsyncStorage, on doit récupérer tous les workouts, modifier et sauvegarder
    const workouts = await getWorkouts();
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index >= 0) {
      workouts[index] = workout;
    } else {
      workouts.push(workout);
    }
    await saveWorkouts(workouts);
    return;
  }

  try {
    const userId = await getUserId();
    await mongoRequest('updateOne', 'workouts', { id: workout.id }, {
      update: {
        $set: {
          ...workout,
          userId,
          createdAt: workout.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    });
  } catch (error) {
    console.error('Error saving workout:', error);
    throw error;
  }
};

export const deleteWorkout = async (workoutId) => {
  if (!mongoConfigured) {
    const workouts = await getWorkouts();
    const filtered = workouts.filter(w => w.id !== workoutId);
    await saveWorkouts(filtered);
    return;
  }

  try {
    await mongoRequest('deleteOne', 'workouts', { id: workoutId });
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

// User Info
export const getUserInfo = async () => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
      return data ? JSON.parse(data) : { weight: null, height: null };
    } catch (error) {
      return { weight: null, height: null };
    }
  }

  try {
    const result = await mongoRequest('findOne', 'userInfo');
    if (result.document) {
      return result.document;
    }
    return { weight: null, height: null };
  } catch (error) {
    console.error('Error getting user info:', error);
    // Fallback vers AsyncStorage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);
    return data ? JSON.parse(data) : { weight: null, height: null };
  }
};

export const saveUserInfo = async (info) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
    } catch (error) {
      console.error('Error saving user info:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    await mongoRequest('updateOne', 'userInfo', {}, {
      update: {
        $set: {
          ...info,
          userId,
          updatedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    });
  } catch (error) {
    console.error('Error saving user info:', error);
    // Fallback vers AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(info));
  }
};

// Historique des progressions (optionnel)
export const getProgressHistory = async (startDate, endDate) => {
  if (!mongoConfigured) {
    return [];
  }

  try {
    const result = await mongoRequest('find', 'dailyProgress', {
      date: { $gte: startDate, $lte: endDate },
    }, {
      sort: { date: 1 },
    });
    return result.documents || [];
  } catch (error) {
    console.error('Error getting progress history:', error);
    return [];
  }
};

// Obtenir tous les progrès quotidiens pour calculer les streaks
export const getAllDailyProgress = async () => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  try {
    const result = await mongoRequest('find', 'dailyProgress', {}, {
      sort: { date: -1 },
    });
    const progressMap = {};
    if (result.documents) {
      result.documents.forEach(doc => {
        progressMap[doc.date] = doc;
      });
    }
    return progressMap;
  } catch (error) {
    console.error('Error getting all daily progress:', error);
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_PROGRESS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }
};

// Calculer les streaks (récurrences)
export const calculateStreaks = async () => {
  const allProgress = await getAllDailyProgress();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Initialiser les streaks
  let gymStreak = 0;
  let eatingStreak = 0;
  let drinkingStreak = 0;
  
  // Obtenir les objectifs pour vérifier si les objectifs sont atteints
  const goals = await getDailyGoals();
  
  // Obtenir les workouts pour vérifier la présence de séances
  const workouts = await getWorkouts();
  
  // Parcourir les jours en arrière depuis aujourd'hui
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = checkDate.toISOString().split('T')[0];
    const dateKeyString = checkDate.toDateString();
    
    // Vérifier dans les deux formats (ISO et DateString)
    const progress = allProgress[dateKey] || allProgress[dateKeyString];
    
    // Vérifier le streak de gym (salle)
    if (i === 0 || gymStreak > 0) {
      // Vérifier s'il y a un workout ce jour-là
      // Les workouts peuvent avoir date, createdAt, ou updatedAt
      const hasWorkout = workouts.some(workout => {
        const workoutDateStr = workout.date || workout.createdAt || workout.updatedAt;
        if (!workoutDateStr) return false;
        const workoutDate = new Date(workoutDateStr);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });
      
      if (hasWorkout) {
        gymStreak++;
      } else if (i > 0) {
        // Si pas de workout et que ce n'est pas aujourd'hui, arrêter le streak
        break;
      }
      // Si i === 0 (aujourd'hui) et pas de workout, on ne fait rien
      // Le streak reste à 0 ou continue selon les jours précédents
    }
    
    // Vérifier le streak de manger (calories)
    if (i === 0 || eatingStreak > 0) {
      if (progress && progress.calories >= goals.calories * 0.8) {
        // Atteint au moins 80% de l'objectif
        eatingStreak++;
      } else if (i > 0) {
        // Si objectif pas atteint et que ce n'est pas aujourd'hui, arrêter le streak
        break;
      }
      // Si i === 0 (aujourd'hui) et objectif pas atteint, on ne fait rien
      // Le streak reste à 0 ou continue selon les jours précédents
    }
    
    // Vérifier le streak de boire (eau)
    if (i === 0 || drinkingStreak > 0) {
      if (progress && progress.water >= goals.water * 0.8) {
        // Atteint au moins 80% de l'objectif
        drinkingStreak++;
      } else if (i > 0) {
        // Si objectif pas atteint et que ce n'est pas aujourd'hui, arrêter le streak
        break;
      }
      // Si i === 0 (aujourd'hui) et objectif pas atteint, on ne fait rien
      // Le streak reste à 0 ou continue selon les jours précédents
    }
  }
  
  return {
    gym: gymStreak,
    eating: eatingStreak,
    drinking: drinkingStreak,
  };
};