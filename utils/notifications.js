import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDailyProgress, getDailyGoals } from './db';

// Configuration des notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const GOAL_NOTIFICATION_ID_KEY = 'goal_notification_id';

/**
 * Demander la permission d'envoyer des notifications
 */
export const requestNotificationPermission = async () => {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('goal-reminders', {
            name: 'Rappels objectifs',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4ADE80',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
};

/**
 * Planifier une notification quotidienne à 21h pour rappeler les objectifs
 */
export const scheduleGoalReminderNotification = async () => {
    try {
        // Annuler les anciennes notifications
        await cancelGoalNotifications();

        const granted = await requestNotificationPermission();
        if (!granted) return;

        // Planifier une notification récurrente à 21h chaque jour
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '🎯 Objectifs du jour',
                body: "Vous n'avez pas encore atteint vos objectifs de la journée ! Consultez votre progression.",
                sound: true,
                data: { type: 'goal_reminder' },
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour: 21,
                minute: 0,
            },
        });
    } catch (error) {
        console.error('Error scheduling notification:', error);
    }
};

/**
 * Annuler toutes les notifications d'objectifs
 */
export const cancelGoalNotifications = async () => {
    try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
            if (notif.content?.data?.type === 'goal_reminder') {
                await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            }
        }
    } catch (error) {
        console.error('Error cancelling notifications:', error);
    }
};

/**
 * Vérifier les objectifs NOW et envoyer une notification immédiate si non atteints
 * Appelé au démarrage ou depuis les settings
 */
export const checkAndNotifyGoals = async () => {
    try {
        const granted = await requestNotificationPermission();
        if (!granted) return;

        const [progress, goals] = await Promise.all([getDailyProgress(), getDailyGoals()]);

        const caloriesOk = progress.calories >= goals.calories * 0.8;
        const waterOk = progress.water >= goals.water * 0.8;

        if (!caloriesOk || !waterOk) {
            const missing = [];
            if (!caloriesOk) missing.push('calories');
            if (!waterOk) missing.push('eau');

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: '⚠️ Objectifs non atteints',
                    body: `Vous n'avez pas atteint vos objectifs de la journée (${missing.join(' et ')}). Continuez vos efforts !`,
                    sound: true,
                    data: { type: 'goal_check' },
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                    seconds: 1,
                    repeats: false,
                },
            });
        }
    } catch (error) {
        console.error('Error checking goals:', error);
    }
};
