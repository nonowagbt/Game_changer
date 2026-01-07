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
  MESSAGES: 'messages',
  WEEKLY_GOALS: 'weekly_goals',
  GYM_ATTENDANCE: 'gym_attendance',
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
      // Vérifier la présence à la salle via markGymAttendance
      let hasGymAttendance = false;
      try {
        const weekStart = getWeekStart(checkDate);
        const weekAttendance = await getGymAttendanceForWeek(weekStart);
        hasGymAttendance = weekAttendance[dateKey] || false;
      } catch (error) {
        // En cas d'erreur, vérifier aussi les workouts comme fallback
        hasGymAttendance = workouts.some(workout => {
          const workoutDateStr = workout.date || workout.createdAt || workout.updatedAt;
          if (!workoutDateStr) return false;
          const workoutDate = new Date(workoutDateStr);
          workoutDate.setHours(0, 0, 0, 0);
          return workoutDate.getTime() === checkDate.getTime();
        });
      }
      
      if (hasGymAttendance) {
        gymStreak++;
      } else if (i > 0) {
        // Si pas de présence et que ce n'est pas aujourd'hui, arrêter le streak
        break;
      }
      // Si i === 0 (aujourd'hui) et pas de présence, on ne fait rien
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

// Messages
export const getMessages = async (userId1, userId2) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      const allMessages = data ? JSON.parse(data) : [];
      // Filtrer les messages entre les deux utilisateurs
      return allMessages.filter(
        msg => 
          (msg.senderId === userId1 && msg.receiverId === userId2) ||
          (msg.senderId === userId2 && msg.receiverId === userId1)
      ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  try {
    // Récupérer les messages où l'utilisateur est soit l'expéditeur soit le destinataire
    const result = await mongoRequest('find', 'messages', {
      $or: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 }
      ]
    }, {
      sort: { timestamp: 1 },
    });
    return result.documents || [];
  } catch (error) {
    console.error('Error getting messages:', error);
    // Fallback vers AsyncStorage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    const allMessages = data ? JSON.parse(data) : [];
    return allMessages.filter(
      msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
};

export const sendMessage = async (message) => {
  if (!mongoConfigured) {
    // Fallback vers AsyncStorage
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
      const messages = data ? JSON.parse(data) : [];
      messages.push(message);
      await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
    return;
  }

  try {
    await mongoRequest('insertOne', 'messages', {}, {
      document: {
        ...message,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error sending message:', error);
    // Fallback vers AsyncStorage
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MESSAGES);
    const messages = data ? JSON.parse(data) : [];
    messages.push(message);
    await AsyncStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
  }
};

export const sendWorkoutMessage = async (message) => {
  // Utilise la même fonction que sendMessage mais avec type 'workout'
  return sendMessage(message);
};

// Obtenir le début de la semaine (lundi)
export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuster pour que lundi = 1
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
};

// Objectifs hebdomadaires pour la salle
export const getWeeklyGoal = async () => {
  if (!mongoConfigured) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_GOALS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      return null;
    }
  }

  try {
    const result = await mongoRequest('findOne', 'weeklyGoals', {}, {
      sort: { weekStart: -1 },
    });
    return result.document || null;
  } catch (error) {
    console.error('Error getting weekly goal:', error);
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEEKLY_GOALS);
    return data ? JSON.parse(data) : null;
  }
};

export const saveWeeklyGoal = async (goal, weekStart) => {
  const weeklyGoal = {
    goal,
    weekStart,
    createdAt: new Date().toISOString(),
  };

  if (!mongoConfigured) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_GOALS, JSON.stringify(weeklyGoal));
    } catch (error) {
      console.error('Error saving weekly goal:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    await mongoRequest('updateOne', 'weeklyGoals', { weekStart }, {
      update: {
        $set: {
          ...weeklyGoal,
          userId,
          updatedAt: new Date().toISOString(),
        },
      },
      upsert: true,
    });
  } catch (error) {
    console.error('Error saving weekly goal:', error);
    await AsyncStorage.setItem(STORAGE_KEYS.WEEKLY_GOALS, JSON.stringify(weeklyGoal));
  }
};

// Marquer la présence à la salle pour un jour donné
export const markGymAttendance = async (date, attended) => {
  const dateKey = date instanceof Date ? date.toISOString().split('T')[0] : date;
  
  if (!mongoConfigured) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GYM_ATTENDANCE);
      const attendance = data ? JSON.parse(data) : {};
      if (attended) {
        attendance[dateKey] = true;
      } else {
        delete attendance[dateKey];
      }
      await AsyncStorage.setItem(STORAGE_KEYS.GYM_ATTENDANCE, JSON.stringify(attendance));
    } catch (error) {
      console.error('Error marking gym attendance:', error);
    }
    return;
  }

  try {
    const userId = await getUserId();
    if (attended) {
      await mongoRequest('updateOne', 'gymAttendance', { date: dateKey }, {
        update: {
          $set: {
            date: dateKey,
            userId,
            attended: true,
            createdAt: new Date().toISOString(),
          },
        },
        upsert: true,
      });
    } else {
      await mongoRequest('deleteOne', 'gymAttendance', { date: dateKey });
    }
  } catch (error) {
    console.error('Error marking gym attendance:', error);
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GYM_ATTENDANCE);
    const attendance = data ? JSON.parse(data) : {};
    if (attended) {
      attendance[dateKey] = true;
    } else {
      delete attendance[dateKey];
    }
    await AsyncStorage.setItem(STORAGE_KEYS.GYM_ATTENDANCE, JSON.stringify(attendance));
  }
};

// Obtenir la présence à la salle pour une semaine
export const getGymAttendanceForWeek = async (weekStart) => {
  if (!mongoConfigured) {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.GYM_ATTENDANCE);
      const attendance = data ? JSON.parse(data) : {};
      const weekStartDate = new Date(weekStart);
      
      const weekAttendance = {};
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        weekAttendance[dateKey] = attendance[dateKey] || false;
      }
      return weekAttendance;
    } catch (error) {
      return {};
    }
  }

  try {
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    
    const result = await mongoRequest('find', 'gymAttendance', {
      date: {
        $gte: weekStart,
        $lte: weekEndDate.toISOString().split('T')[0],
      },
    });
    
    const attendance = {};
    if (result.documents) {
      result.documents.forEach(doc => {
        attendance[doc.date] = true;
      });
    }
    
    // Remplir les jours manquants avec false
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      if (!attendance[dateKey]) {
        attendance[dateKey] = false;
      }
    }
    
    return attendance;
  } catch (error) {
    console.error('Error getting gym attendance:', error);
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GYM_ATTENDANCE);
    const attendance = data ? JSON.parse(data) : {};
    return attendance;
  }
};

// Compter le nombre de fois où on est allé à la salle cette semaine
export const getWeeklyGymCount = async (weekStart) => {
  const attendance = await getGymAttendanceForWeek(weekStart);
  return Object.values(attendance).filter(Boolean).length;
};