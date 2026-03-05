import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RUNS_KEY = 'running_history';

// ── Haversine formula : distance entre 2 coords GPS (km) ────────
const haversineDistance = (a, b) => {
    const R = 6371;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const lat1 = (a.latitude * Math.PI) / 180;
    const lat2 = (b.latitude * Math.PI) / 180;
    const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const pad = (n) => String(n).padStart(2, '0');

const formatDuration = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
};

const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function RunningTrackerScreen() {
    // ── État de la course ────────────────────────────────────────
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [elapsed, setElapsed] = useState(0);       // secondes
    const [distance, setDistance] = useState(0);     // km
    const [speed, setSpeed] = useState(0);           // km/h
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('tracker'); // 'tracker' | 'history'

    const timerRef = useRef(null);
    const locationRef = useRef(null);
    const lastPosRef = useRef(null);
    const distRef = useRef(0);

    // ── Charger l'historique ─────────────────────────────────────
    useEffect(() => {
        loadHistory();
        return () => {
            clearInterval(timerRef.current);
            if (locationRef.current) locationRef.current.remove();
        };
    }, []);

    const loadHistory = async () => {
        try {
            const data = await AsyncStorage.getItem(RUNS_KEY);
            setHistory(data ? JSON.parse(data) : []);
        } catch (_) { }
    };

    const saveRun = async (run) => {
        try {
            const data = await AsyncStorage.getItem(RUNS_KEY);
            const runs = data ? JSON.parse(data) : [];
            const updated = [run, ...runs];
            await AsyncStorage.setItem(RUNS_KEY, JSON.stringify(updated));
            setHistory(updated);
        } catch (_) { }
    };

    // ── Démarrer / reprendre ─────────────────────────────────────
    const startRun = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permission refusée',
                'Activez la localisation dans les réglages pour suivre votre course.'
            );
            return;
        }

        setIsRunning(true);
        setIsPaused(false);

        // Chrono
        timerRef.current = setInterval(() => {
            setElapsed((prev) => prev + 1);
        }, 1000);

        // GPS
        const sub = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 2000,
                distanceInterval: 5, // recalculer tous les 5 m minimum
            },
            (loc) => {
                const { latitude, longitude, speed: rawSpeed } = loc.coords;
                const currentPos = { latitude, longitude };

                if (lastPosRef.current) {
                    const delta = haversineDistance(lastPosRef.current, currentPos);
                    // Ignorer les sauts GPS aberrants (> 200m en 2s = 360 km/h)
                    if (delta < 0.2) {
                        distRef.current += delta;
                        setDistance(parseFloat(distRef.current.toFixed(3)));
                    }
                }
                lastPosRef.current = currentPos;

                // Vitesse (m/s → km/h)
                const kmh = rawSpeed && rawSpeed > 0 ? rawSpeed * 3.6 : 0;
                setSpeed(parseFloat(kmh.toFixed(1)));
            }
        );
        locationRef.current = sub;
    };

    // ── Pause ────────────────────────────────────────────────────
    const pauseRun = () => {
        setIsPaused(true);
        clearInterval(timerRef.current);
        if (locationRef.current) { locationRef.current.remove(); locationRef.current = null; }
        lastPosRef.current = null;
    };

    // ── Arrêter & sauvegarder ────────────────────────────────────
    const stopRun = () => {
        if (distance < 0.01 && elapsed < 5) {
            resetRun(); return;
        }
        Alert.alert(
            'Terminer la course',
            `Distance : ${distRef.current.toFixed(2)} km\nDurée : ${formatDuration(elapsed)}\n\nSauvegarder ?`,
            [
                { text: 'Abandonner', style: 'destructive', onPress: resetRun },
                {
                    text: 'Sauvegarder',
                    onPress: async () => {
                        const avgPace = elapsed > 0 && distRef.current > 0
                            ? (elapsed / 60) / distRef.current : 0;
                        await saveRun({
                            id: Date.now().toString(),
                            date: new Date().toISOString(),
                            duration: elapsed,
                            distance: parseFloat(distRef.current.toFixed(3)),
                            avgPace: parseFloat(avgPace.toFixed(2)),
                            calories: Math.round(distRef.current * 65), // ~65 kcal/km
                        });
                        resetRun();
                        setActiveTab('history');
                    },
                },
            ]
        );
    };

    const resetRun = () => {
        clearInterval(timerRef.current);
        if (locationRef.current) { locationRef.current.remove(); locationRef.current = null; }
        setIsRunning(false);
        setIsPaused(false);
        setElapsed(0);
        setDistance(0);
        setSpeed(0);
        distRef.current = 0;
        lastPosRef.current = null;
    };

    // ── Pace (min/km) ────────────────────────────────────────────
    const pace = elapsed > 0 && distRef.current > 0
        ? (elapsed / 60) / distRef.current : 0;
    const paceMin = Math.floor(pace);
    const paceSec = Math.round((pace - paceMin) * 60);

    // ── Calories estimées ─────────────────────────────────────────
    const calories = Math.round(distRef.current * 65);

    // ── RENDU ─────────────────────────────────────────────────────
    return (
        <View style={s.container}>
            {/* Tabs internes */}
            <View style={s.tabRow}>
                {['tracker', 'history'].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Ionicons
                            name={tab === 'tracker' ? 'play-circle-outline' : 'list-outline'}
                            size={16}
                            color={activeTab === tab ? colors.primary : colors.textSecondary}
                        />
                        <Text style={[s.tabBtnText, activeTab === tab && s.tabBtnTextActive]}>
                            {tab === 'tracker' ? 'Course' : 'Historique'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {activeTab === 'tracker' ? (
                <ScrollView contentContainerStyle={s.trackerWrap} showsVerticalScrollIndicator={false}>
                    {/* Chrono */}
                    <View style={s.chronoCard}>
                        <Text style={s.chronoLabel}>Durée</Text>
                        <Text style={s.chronoTime}>{formatDuration(elapsed)}</Text>
                        {isRunning && !isPaused && (
                            <View style={s.liveDot}>
                                <View style={s.livePulse} />
                                <Text style={s.liveText}>EN COURS</Text>
                            </View>
                        )}
                        {isPaused && (
                            <Text style={s.pausedText}>EN PAUSE</Text>
                        )}
                    </View>

                    {/* Stats grid */}
                    <View style={s.statsGrid}>
                        <View style={s.statCard}>
                            <Ionicons name="map-outline" size={22} color={colors.primary} />
                            <Text style={s.statValue}>{distance.toFixed(2)}</Text>
                            <Text style={s.statUnit}>km</Text>
                        </View>
                        <View style={s.statCard}>
                            <Ionicons name="speedometer-outline" size={22} color={colors.primary} />
                            <Text style={s.statValue}>{speed.toFixed(1)}</Text>
                            <Text style={s.statUnit}>km/h</Text>
                        </View>
                        <View style={s.statCard}>
                            <Ionicons name="timer-outline" size={22} color={colors.primary} />
                            <Text style={s.statValue}>
                                {distRef.current > 0.01 ? `${paceMin}:${pad(paceSec)}` : '--:--'}
                            </Text>
                            <Text style={s.statUnit}>min/km</Text>
                        </View>
                        <View style={s.statCard}>
                            <Ionicons name="flame-outline" size={22} color={colors.warning} />
                            <Text style={s.statValue}>{calories}</Text>
                            <Text style={s.statUnit}>kcal</Text>
                        </View>
                    </View>

                    {/* Boutons de contrôle */}
                    <View style={s.ctrlRow}>
                        {!isRunning ? (
                            <TouchableOpacity style={s.startBtn} onPress={startRun}>
                                <Ionicons name="play" size={36} color={colors.cardBackground} />
                                <Text style={s.startBtnText}>Démarrer</Text>
                            </TouchableOpacity>
                        ) : isPaused ? (
                            <>
                                <TouchableOpacity style={[s.ctrlBtn, s.ctrlBtnSecondary]} onPress={stopRun}>
                                    <Ionicons name="stop" size={26} color={colors.error} />
                                    <Text style={[s.ctrlBtnText, { color: colors.error }]}>Terminer</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.ctrlBtn, s.ctrlBtnPrimary]} onPress={startRun}>
                                    <Ionicons name="play" size={26} color={colors.cardBackground} />
                                    <Text style={[s.ctrlBtnText, { color: colors.cardBackground }]}>Reprendre</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity style={[s.ctrlBtn, s.ctrlBtnSecondary]} onPress={pauseRun}>
                                    <Ionicons name="pause" size={26} color={colors.text} />
                                    <Text style={[s.ctrlBtnText, { color: colors.text }]}>Pause</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[s.ctrlBtn, { backgroundColor: colors.error + '20', borderColor: colors.error, borderWidth: 1 }]} onPress={stopRun}>
                                    <Ionicons name="stop" size={26} color={colors.error} />
                                    <Text style={[s.ctrlBtnText, { color: colors.error }]}>Terminer</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>

                    {/* Info GPS */}
                    <View style={s.gpsInfo}>
                        <Ionicons name="location-outline" size={14} color={colors.textTertiary} />
                        <Text style={s.gpsInfoText}>GPS haute précision • Distance calculée en temps réel</Text>
                    </View>
                </ScrollView>
            ) : (
                // ── Historique ─────────────────────────────────────────
                <ScrollView contentContainerStyle={s.historyWrap} showsVerticalScrollIndicator={false}>
                    {history.length === 0 ? (
                        <View style={s.emptyHistory}>
                            <Ionicons name="walk-outline" size={64} color={colors.textTertiary} />
                            <Text style={s.emptyTitle}>Aucune course enregistrée</Text>
                            <Text style={s.emptySub}>Lancez votre première course !</Text>
                        </View>
                    ) : (
                        <>
                            {/* Totaux */}
                            <View style={s.summaryCard}>
                                <Text style={s.summaryTitle}>📊 Mes statistiques</Text>
                                <View style={s.summaryGrid}>
                                    <View style={s.summaryItem}>
                                        <Text style={s.summaryValue}>{history.length}</Text>
                                        <Text style={s.summaryLabel}>courses</Text>
                                    </View>
                                    <View style={s.summaryItem}>
                                        <Text style={s.summaryValue}>
                                            {history.reduce((a, r) => a + r.distance, 0).toFixed(1)}
                                        </Text>
                                        <Text style={s.summaryLabel}>km totaux</Text>
                                    </View>
                                    <View style={s.summaryItem}>
                                        <Text style={s.summaryValue}>
                                            {Math.round(history.reduce((a, r) => a + (r.calories || 0), 0))}
                                        </Text>
                                        <Text style={s.summaryLabel}>kcal totales</Text>
                                    </View>
                                </View>
                            </View>

                            {history.map((run) => (
                                <View key={run.id} style={s.runCard}>
                                    <View style={s.runCardLeft}>
                                        <Ionicons name="walk" size={28} color={colors.primary} />
                                    </View>
                                    <View style={s.runCardInfo}>
                                        <Text style={s.runDate}>{formatDate(run.date)}</Text>
                                        <View style={s.runStats}>
                                            <Text style={s.runStat}>🗺 {run.distance.toFixed(2)} km</Text>
                                            <Text style={s.runStat}>⏱ {formatDuration(run.duration)}</Text>
                                        </View>
                                        <View style={s.runStats}>
                                            {run.avgPace > 0 && (
                                                <Text style={s.runStatSm}>
                                                    {Math.floor(run.avgPace)}:{pad(Math.round((run.avgPace % 1) * 60))} min/km
                                                </Text>
                                            )}
                                            {run.calories > 0 && (
                                                <Text style={s.runStatSm}>🔥 {run.calories} kcal</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </>
                    )}
                </ScrollView>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    // Tabs internes
    tabRow: {
        flexDirection: 'row',
        backgroundColor: colors.cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tabBtn: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 14,
        borderBottomWidth: 2, borderBottomColor: 'transparent',
    },
    tabBtnActive: { borderBottomColor: colors.primary },
    tabBtnText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
    tabBtnTextActive: { color: colors.primary },

    // Tracker
    trackerWrap: { padding: 20 },

    chronoCard: {
        backgroundColor: colors.cardBackground,
        borderRadius: 24,
        alignItems: 'center',
        paddingVertical: 40,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },
    chronoLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
    chronoTime: { fontSize: 64, fontWeight: '700', color: colors.text, fontVariant: ['tabular-nums'], letterSpacing: 2 },
    liveDot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
    livePulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
    liveText: { fontSize: 12, fontWeight: 'bold', color: '#4CAF50', letterSpacing: 1 },
    pausedText: { fontSize: 12, fontWeight: 'bold', color: colors.warning, marginTop: 10, letterSpacing: 1 },

    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1, minWidth: '45%',
        backgroundColor: colors.cardBackground,
        borderRadius: 16, padding: 18,
        alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: colors.border,
    },
    statValue: { fontSize: 28, fontWeight: 'bold', color: colors.text, fontVariant: ['tabular-nums'] },
    statUnit: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

    ctrlRow: { flexDirection: 'row', gap: 14, justifyContent: 'center', marginBottom: 20 },
    startBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: colors.primary, borderRadius: 20, paddingVertical: 22,
        Elevation: 4,
    },
    startBtnText: { color: colors.cardBackground, fontSize: 18, fontWeight: 'bold' },
    ctrlBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6,
        borderRadius: 20, paddingVertical: 18,
    },
    ctrlBtnPrimary: { backgroundColor: colors.primary },
    ctrlBtnSecondary: { backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border },
    ctrlBtnText: { fontSize: 14, fontWeight: '700' },

    gpsInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
    gpsInfoText: { fontSize: 12, color: colors.textTertiary },

    // Historique
    historyWrap: { padding: 16 },
    emptyHistory: { alignItems: 'center', paddingVertical: 60 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text, marginTop: 20 },
    emptySub: { fontSize: 14, color: colors.textSecondary, marginTop: 8 },

    summaryCard: {
        backgroundColor: colors.primary + '15',
        borderRadius: 16, padding: 18, marginBottom: 16,
        borderWidth: 1, borderColor: colors.primary + '40',
    },
    summaryTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 14 },
    summaryGrid: { flexDirection: 'row', justifyContent: 'space-around' },
    summaryItem: { alignItems: 'center' },
    summaryValue: { fontSize: 24, fontWeight: 'bold', color: colors.primary },
    summaryLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },

    runCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.cardBackground,
        borderRadius: 14, padding: 16, marginBottom: 10,
        borderWidth: 1, borderColor: colors.border, gap: 14,
    },
    runCardLeft: {
        width: 50, height: 50, borderRadius: 25,
        backgroundColor: colors.primary + '20',
        alignItems: 'center', justifyContent: 'center',
    },
    runCardInfo: { flex: 1 },
    runDate: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 6 },
    runStats: { flexDirection: 'row', gap: 14, marginBottom: 4 },
    runStat: { fontSize: 14, color: colors.text, fontWeight: '600' },
    runStatSm: { fontSize: 12, color: colors.textSecondary },
});
