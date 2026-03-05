import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoogleAccessToken } from './auth';

const STORAGE_KEYS = {
  GOOGLE_ACCESS_TOKEN: 'google_access_token',
};

const GOOGLE_FIT_API_BASE = 'https://www.googleapis.com/fitness/v1';

// Obtenir le token d'accès Google
const getAccessToken = async () => {
  return await getGoogleAccessToken();
};

// Synchroniser les données d'activité avec Google Fit
export const syncActivityToGoogleFit = async (activityData) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  try {
    // Format des données pour Google Fit
    const dataset = {
      dataSourceId: 'raw:com.google.activity.segment:game_changer:activity',
      maxEndTimeNs: activityData.endTime || Date.now() * 1000000,
      minStartTimeNs: activityData.startTime || Date.now() * 1000000,
      point: [
        {
          startTimeNanos: (activityData.startTime || Date.now()) * 1000000,
          endTimeNanos: (activityData.endTime || Date.now()) * 1000000,
          value: [
            {
              intVal: activityData.activityType || 1, // 1 = Activité inconnue, 9 = Entraînement
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GOOGLE_FIT_API_BASE}/users/me/dataSources/raw:com.google.activity.segment:game_changer:activity/datasets/${dataset.minStartTimeNs}-${dataset.maxEndTimeNs}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Google Fit: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing activity to Google Fit:', error);
    throw error;
  }
};

// Synchroniser les données de poids avec Google Fit
export const syncWeightToGoogleFit = async (weight, timestamp = Date.now()) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  try {
    const dataset = {
      dataSourceId: 'raw:com.google.weight:game_changer:weight',
      maxEndTimeNs: timestamp * 1000000,
      minStartTimeNs: timestamp * 1000000,
      point: [
        {
          startTimeNanos: timestamp * 1000000,
          endTimeNanos: timestamp * 1000000,
          value: [
            {
              fpVal: weight,
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GOOGLE_FIT_API_BASE}/users/me/dataSources/raw:com.google.weight:game_changer:weight/datasets/${dataset.minStartTimeNs}-${dataset.maxEndTimeNs}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Google Fit: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing weight to Google Fit:', error);
    throw error;
  }
};

// Synchroniser les données de taille avec Google Fit
export const syncHeightToGoogleFit = async (height, timestamp = Date.now()) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  try {
    const dataset = {
      dataSourceId: 'raw:com.google.height:game_changer:height',
      maxEndTimeNs: timestamp * 1000000,
      minStartTimeNs: timestamp * 1000000,
      point: [
        {
          startTimeNanos: timestamp * 1000000,
          endTimeNanos: timestamp * 1000000,
          value: [
            {
              fpVal: height / 100, // Google Fit utilise les mètres
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GOOGLE_FIT_API_BASE}/users/me/dataSources/raw:com.google.height:game_changer:height/datasets/${dataset.minStartTimeNs}-${dataset.maxEndTimeNs}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Google Fit: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing height to Google Fit:', error);
    throw error;
  }
};

// Synchroniser un entraînement avec Google Fit
export const syncWorkoutToGoogleFit = async (workout) => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new Error('Non connecté à Google');
  }

  try {
    // Calculer la durée de l'entraînement (approximative)
    const startTime = workout.createdAt ? new Date(workout.createdAt).getTime() : Date.now();
    const estimatedDuration = workout.exercises?.length * 5 * 60 * 1000 || 30 * 60 * 1000; // 5 min par exercice ou 30 min par défaut
    const endTime = startTime + estimatedDuration;

    const dataset = {
      dataSourceId: 'raw:com.google.activity.segment:game_changer:workout',
      maxEndTimeNs: endTime * 1000000,
      minStartTimeNs: startTime * 1000000,
      point: [
        {
          startTimeNanos: startTime * 1000000,
          endTimeNanos: endTime * 1000000,
          value: [
            {
              intVal: 9, // 9 = Entraînement
            },
          ],
        },
      ],
    };

    const response = await fetch(
      `${GOOGLE_FIT_API_BASE}/users/me/dataSources/raw:com.google.activity.segment:game_changer:workout/datasets/${dataset.minStartTimeNs}-${dataset.maxEndTimeNs}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur Google Fit: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing workout to Google Fit:', error);
    throw error;
  }
};

// Synchroniser toutes les données de performance
export const syncAllPerformanceData = async () => {
  try {
    const { getDailyProgress, getUserInfo, getWorkouts } = await import('./db');
    
    // Synchroniser le poids et la taille
    const userInfo = await getUserInfo();
    if (userInfo.weight) {
      await syncWeightToGoogleFit(userInfo.weight);
    }
    if (userInfo.height) {
      await syncHeightToGoogleFit(userInfo.height);
    }

    // Synchroniser les entraînements récents
    const workouts = await getWorkouts();
    for (const workout of workouts.slice(0, 10)) { // Limiter aux 10 derniers
      try {
        await syncWorkoutToGoogleFit(workout);
      } catch (error) {
        console.error(`Error syncing workout ${workout.id}:`, error);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing all performance data:', error);
    throw error;
  }
};

