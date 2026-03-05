import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANALYSIS_KEY = 'body_analysis';

// ── Logique de morphologie ──────────────────────────────────────────
/*
  On utilise 3 signaux :
    1. IMC (poids/taille)
    2. Ratio hanche/épaule (subjectif, choix simple)
    3. Tour de taille perçu vs épaules/hanches

  Morphologies déduites :
    Ectomorphe  : mince, petits os, peu de muscle/graisse
    Mésomorphe  : musculeux, épaules larges, facile à sculpter
    Endomorphe  : tendance à stocker, hanches larges, métabolisme lent
    Sablier (F) : épaules = hanches, taille marquée
    Rectangle   : épaules ≈ hanches ≈ taille
    Pomme       : taille > hanches/épaules
    Poire       : hanches >> épaules
*/

const MORPHOLOGIE = {
    ectomorphe: {
        label: 'Ectomorphe',
        emoji: '🏃',
        color: '#3B82F6',
        description: 'Tu as une ossature fine et une silhouette naturellement mince. Ton métabolisme est rapide.',
        strengths: [
            '✅ Endurance naturelle élevée',
            '✅ Peu de risque de surpoids',
            '✅ Récupération rapide',
            '✅ Silhouette longiligne appréciée',
        ],
        weaknesses: [
            '⚠️ Prise de masse musculaire difficile',
            '⚠️ Manque de force brute',
            '⚠️ Peut sembler maigre rapidement',
        ],
        advice: [
            '💪 Mise en priorité sur des exercices composés (squat, soulevé de terre)',
            '🍗 Augmente tes apports en protéines (2g par kg de poids)',
            '🛌 Dors au moins 8h pour maximiser la construction musculaire',
            '📈 Vise un surplus calorique de 300-500 kcal/jour',
        ],
    },
    mesomorphe: {
        label: 'Mésomorphe',
        emoji: '🏋️',
        color: '#4ADE80',
        description: 'Tu as une silhouette naturellement sportive. Tu prends du muscle facilement et perds de la graisse rapidement.',
        strengths: [
            '✅ Prise de masse rapide',
            '✅ Perte de graisse efficace',
            '✅ Bonne force naturelle',
            '✅ Récupération excellente',
        ],
        weaknesses: [
            '⚠️ Peut faire de la rétention si alimentation non contrôlée',
            '⚠️ Tendance à se reposer sur ses capacités naturelles',
        ],
        advice: [
            '⚖️ Varises les cycles prise de masse / sèche',
            '🥗 Maintiens une alimentation équilibrée riche en protéines',
            '🏃 Ajoute du cardio pour optimiser ta définition musculaire',
            '📊 Suis tes progrès régulièrement pour rester motivé',
        ],
    },
    endomorphe: {
        label: 'Endomorphe',
        emoji: '🛡️',
        color: '#F59E0B',
        description: 'Tu as naturellement un métabolisme plus lent et une tendance à stocker de l\'énergie. Tu as une bonne masse musculaire potentielle.',
        strengths: [
            '✅ Grande force et puissance naturelle',
            '✅ Bonne endurance à l\'effort intense',
            '✅ Réserves d\'énergie importantes',
            '✅ Facilité à prendre du muscle',
        ],
        weaknesses: [
            '⚠️ Métabolisme lent, perte de graisse plus longue',
            '⚠️ Tendance à prendre du poids rapidement',
            '⚠️ Nécessite un suivi alimentaire strict',
        ],
        advice: [
            '🔥 Privilégie le HIIT (30 min, 3x/semaine) pour booster ton métabolisme',
            '🥦 Réduis les glucides transformés, mise sur les légumes et protéines',
            '⏱️ Mange en déficit calorique modéré (-300 à -500 kcal)',
            '💧 Hydrate-toi bien (au moins 2L d\'eau par jour)',
        ],
    },
    sablier: {
        label: 'Sablier',
        emoji: '⌛',
        color: '#EC4899',
        description: 'Tu as une silhouette équilibrée avec des épaules et des hanches larges et une taille bien marquée. C\'est la morphologie la plus enviée.',
        strengths: [
            '✅ Silhouette naturellement harmonieuse',
            '✅ Équilibre haut/bas du corps',
            '✅ Facilité à mettre en valeur les vêtements',
            '✅ Bonne proportion musculaire',
        ],
        weaknesses: [
            '⚠️ La taille peut disparaître rapidement avec un excès de poids',
            '⚠️ Difficulté à doser la prise de masse (haut ou bas)',
        ],
        advice: [
            '🎯 Travaille le gainage pour conserver ta taille marquée',
            '🤸 Intègre le yoga ou le Pilates pour allonger ta silhouette',
            '⚖️ Maintiens ta morphologie par un équilibre alimentaire',
            '💪 Renforce les épaules et fessiers de façon équilibrée',
        ],
    },
    rectangle: {
        label: 'Rectangle / Athlétique',
        emoji: '📏',
        color: '#8B5CF6',
        description: 'Tes épaules, ta taille et tes hanches sont sensiblement les mêmes. Cette morphologie est très athlétique.',
        strengths: [
            '✅ Corps très sportif et tonique',
            '✅ Facile de sculpter des muscles visibles',
            '✅ Endurance et polyvalence sportive',
            '✅ Style vestimentaire très flexible',
        ],
        weaknesses: [
            '⚠️ Peu de courbes naturelles',
            '⚠️ La taille n\'est pas naturellement marquée',
        ],
        advice: [
            '💃 Travaille les fessiers et les épaules pour créer des courbes',
            '🔺 Mise sur des exercices pour élargir les épaules (développé militaire)',
            '🏋️ Squats et hip thrusts pour arrondir les fessiers',
            '✂️ Une alimentation précise te permettra de te définir rapidement',
        ],
    },
    poire: {
        label: 'Poire / Gynoïde',
        emoji: '🍐',
        color: '#EF4444',
        description: 'Tu as des hanches plus larges que tes épaules. Cette morphologie est féminine et courante.',
        strengths: [
            '✅ Très bonne prédisposition pour les exercices de jambes',
            '✅ Silhouette féminine naturellement marquée',
            '✅ Bonne résistance cardiovasculaire',
        ],
        weaknesses: [
            '⚠️ Tendance à stocker les graisses dans le bas du corps',
            '⚠️ Déséquilibre haut/bas peut impacter la posture',
        ],
        advice: [
            '🏋️ Renforce le haut du corps pour équilibrer ta silhouette',
            '🚣 Aviron, natation, développé militaire pour élargir les épaules',
            '🏃 Cardio modéré pour brûler les graisses des cuisses/fessiers',
            '🍗 Protéines en priorité pour densifier le haut du corps',
        ],
    },
    pomme: {
        label: 'Pomme / Androïde',
        emoji: '🍎',
        color: '#EF4444',
        description: 'Tu as tendance à stocker la graisse au niveau du ventre. Tes hanches et épaules sont similaires mais la taille est plus large.',
        strengths: [
            '✅ Bonne force dans le haut du corps',
            '✅ Jambes souvent fines et toniques',
            '✅ Endurance naturelle',
        ],
        weaknesses: [
            '⚠️ Risque cardiovasculaire plus élevé (graisse viscérale)',
            '⚠️ Taille difficile à affiner',
        ],
        advice: [
            '🏃 Priorise le cardio (jogging, vélo) pour réduire la graisse viscérale',
            '🥗 Réduis les sucres rapides et l\'alcool en priorité',
            '🧘 Le stress augmente le cortisol (stockage ventre) → méditation/yoga',
            '🩺 Consulte un professionnel pour un suivi métabolique adapté',
        ],
    },
};

// Calcule la morphologie à partir des réponses
const determineMorphologie = ({ bmi, shoulderHip, waistFeel, gender }) => {
    // Ectomorphe: IMC < 20
    if (bmi && parseFloat(bmi) < 20) return MORPHOLOGIE.ectomorphe;

    // Basé sur ratio épaules/hanches
    if (shoulderHip === 'shoulders_wider') {
        if (bmi && parseFloat(bmi) > 27) return MORPHOLOGIE.endomorphe;
        return MORPHOLOGIE.mesomorphe;
    }
    if (shoulderHip === 'hips_wider') {
        if (waistFeel === 'wide') return MORPHOLOGIE.pomme;
        return MORPHOLOGIE.poire;
    }
    if (shoulderHip === 'equal') {
        if (waistFeel === 'narrow') return MORPHOLOGIE.sablier;
        if (waistFeel === 'wide') return MORPHOLOGIE.pomme;
        if (bmi && parseFloat(bmi) > 27) return MORPHOLOGIE.endomorphe;
        return MORPHOLOGIE.rectangle;
    }
    return MORPHOLOGIE.mesomorphe;
};

// ── Composant principal ──────────────────────────────────────────────
export default function BodyAnalysisCard({ bmi }) {
    const [photoUri, setPhotoUri] = useState(null);
    const [step, setStep] = useState('idle'); // idle | photo | questions | result
    const [shoulderHip, setShoulderHip] = useState(null);
    const [waistFeel, setWaistFeel] = useState(null);
    const [gender, setGender] = useState('neutral');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [savedAnalysis, setSavedAnalysis] = useState(null);

    React.useEffect(() => {
        loadSaved();
    }, []);

    const loadSaved = async () => {
        try {
            const data = await AsyncStorage.getItem(ANALYSIS_KEY);
            if (data) setSavedAnalysis(JSON.parse(data));
        } catch (_) { }
    };

    const saveAnalysis = async (analysis) => {
        try {
            await AsyncStorage.setItem(ANALYSIS_KEY, JSON.stringify(analysis));
            setSavedAnalysis(analysis);
        } catch (_) { }
    };

    const handlePickPhoto = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            const camStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (camStatus.status !== 'granted') {
                Alert.alert('Permission refusée', 'Activez la caméra ou la galerie dans les réglages.');
                return;
            }
        }

        Alert.alert(
            'Ajouter une photo',
            'Choisissez la source',
            [
                {
                    text: '📷 Caméra',
                    onPress: async () => {
                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.6,
                            allowsEditing: true,
                            aspect: [3, 4],
                        });
                        if (!result.canceled) {
                            setPhotoUri(result.assets[0].uri);
                            setStep('questions');
                        }
                    },
                },
                {
                    text: '🖼️ Galerie',
                    onPress: async () => {
                        const res = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ImagePicker.MediaTypeOptions.Images,
                            quality: 0.6,
                            allowsEditing: true,
                            aspect: [3, 4],
                        });
                        if (!res.canceled) {
                            setPhotoUri(res.assets[0].uri);
                            setStep('questions');
                        }
                    },
                },
                { text: 'Annuler', style: 'cancel' },
            ]
        );
    };

    const handleAnalyze = async () => {
        if (!shoulderHip || !waistFeel) {
            Alert.alert('Répondez à toutes les questions pour continuer');
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 800)); // effet de chargement
        const morpho = determineMorphologie({ bmi, shoulderHip, waistFeel, gender });
        const analysis = { morpho, photoUri, date: new Date().toISOString() };
        setResult(morpho);
        await saveAnalysis(analysis);
        setStep('result');
        setLoading(false);
    };

    const handleReset = () => {
        setStep('idle');
        setPhotoUri(null);
        setShoulderHip(null);
        setWaistFeel(null);
        setResult(null);
    };

    // ── RENDU ─────────────────────────────────────────────────────────
    return (
        <View style={s.card}>
            <View style={s.cardHeader}>
                <View style={s.cardHeaderLeft}>
                    <Ionicons name="body-outline" size={22} color={colors.primary} />
                    <Text style={s.cardTitle}>Analyse corporelle</Text>
                </View>
                {(step === 'result' || savedAnalysis) && (
                    <TouchableOpacity onPress={handleReset} style={s.retryBtn}>
                        <Ionicons name="refresh" size={16} color={colors.textSecondary} />
                        <Text style={s.retryBtnText}>Refaire</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ── État initial ── */}
            {step === 'idle' && !savedAnalysis && (
                <View style={s.idleWrap}>
                    <Text style={s.idleText}>
                        Prenez-vous en photo (vue de face, entier) pour découvrir votre morphologie, vos points forts et axes d'amélioration.
                    </Text>
                    <TouchableOpacity style={s.startBtn} onPress={handlePickPhoto}>
                        <Ionicons name="camera" size={20} color={colors.cardBackground} />
                        <Text style={s.startBtnText}>Commencer l'analyse</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Résultat sauvegardé (affiché direct) ── */}
            {step === 'idle' && savedAnalysis && (
                <ResultView analysis={savedAnalysis} />
            )}

            {/* ── Questions ── */}
            {step === 'questions' && (
                <View>
                    {photoUri && (
                        <Image source={{ uri: photoUri }} style={s.photoPreview} resizeMode="cover" />
                    )}

                    <Text style={s.questionTitle}>📐 Tes épaules vs tes hanches</Text>
                    <View style={s.choiceRow}>
                        {[
                            { key: 'shoulders_wider', label: 'Épaules\nplus larges', icon: '🔺' },
                            { key: 'equal', label: 'Environ\négales', icon: '◼️' },
                            { key: 'hips_wider', label: 'Hanches\nplus larges', icon: '🔻' },
                        ].map(({ key, label, icon }) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.choiceBtn, shoulderHip === key && s.choiceBtnActive]}
                                onPress={() => setShoulderHip(key)}
                            >
                                <Text style={s.choiceEmoji}>{icon}</Text>
                                <Text style={[s.choiceLabel, shoulderHip === key && s.choiceLabelActive]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={s.questionTitle}>👕 Ta taille / ventre ?</Text>
                    <View style={s.choiceRow}>
                        {[
                            { key: 'narrow', label: 'Bien\nmarquée', icon: '✂️' },
                            { key: 'average', label: 'Dans la\nmoyenne', icon: '▪️' },
                            { key: 'wide', label: 'Plus\nlarge', icon: '⭕' },
                        ].map(({ key, label, icon }) => (
                            <TouchableOpacity
                                key={key}
                                style={[s.choiceBtn, waistFeel === key && s.choiceBtnActive]}
                                onPress={() => setWaistFeel(key)}
                            >
                                <Text style={s.choiceEmoji}>{icon}</Text>
                                <Text style={[s.choiceLabel, waistFeel === key && s.choiceLabelActive]}>{label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[s.startBtn, (!shoulderHip || !waistFeel) && { opacity: 0.5 }]}
                        onPress={handleAnalyze}
                        disabled={!shoulderHip || !waistFeel || loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.cardBackground} />
                        ) : (
                            <>
                                <Ionicons name="analytics" size={20} color={colors.cardBackground} />
                                <Text style={s.startBtnText}>Analyser ma morphologie</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Résultat ── */}
            {step === 'result' && result && (
                <ResultView analysis={{ morpho: result, photoUri }} />
            )}
        </View>
    );
}

// ── Sous-composant Résultat ──────────────────────────────────────────
function ResultView({ analysis }) {
    const { morpho, photoUri } = analysis;
    if (!morpho) return null;

    return (
        <View>
            {photoUri && (
                <Image source={{ uri: photoUri }} style={s.photoResult} resizeMode="cover" />
            )}

            {/* Badge morphologie */}
            <View style={[s.morphoBadge, { backgroundColor: morpho.color + '20', borderColor: morpho.color + '60' }]}>
                <Text style={s.morphoEmoji}>{morpho.emoji}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={[s.morphoLabel, { color: morpho.color }]}>{morpho.label}</Text>
                    <Text style={s.morphoDesc}>{morpho.description}</Text>
                </View>
            </View>

            {/* Points forts */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>💪 Points forts</Text>
                {morpho.strengths.map((s_, i) => (
                    <Text key={i} style={s.bullet}>{s_}</Text>
                ))}
            </View>

            {/* Points faibles */}
            <View style={s.section}>
                <Text style={s.sectionTitle}>🎯 Axes d'amélioration</Text>
                {morpho.weaknesses.map((w, i) => (
                    <Text key={i} style={s.bullet}>{w}</Text>
                ))}
            </View>

            {/* Conseils */}
            <View style={[s.section, s.adviceSection]}>
                <Text style={s.sectionTitle}>📋 Conseils personnalisés</Text>
                {morpho.advice.map((a, i) => (
                    <Text key={i} style={[s.bullet, { color: colors.text }]}>{a}</Text>
                ))}
            </View>
        </View>
    );
}

// ── Styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    card: {
        backgroundColor: colors.cardBackground,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 17, fontWeight: 'bold', color: colors.text },
    retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    retryBtnText: { fontSize: 13, color: colors.textSecondary },

    idleWrap: { alignItems: 'center', paddingVertical: 10 },
    idleText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 20 },

    startBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: colors.primary, paddingVertical: 15, borderRadius: 14,
    },
    startBtnText: { color: colors.cardBackground, fontSize: 15, fontWeight: 'bold' },

    photoPreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
    photoResult: { width: '100%', height: 200, borderRadius: 12, marginBottom: 14 },

    questionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 10, marginTop: 4 },
    choiceRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    choiceBtn: {
        flex: 1, alignItems: 'center', paddingVertical: 12,
        borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
        backgroundColor: colors.background,
    },
    choiceBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
    choiceEmoji: { fontSize: 22, marginBottom: 4 },
    choiceLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', lineHeight: 15 },
    choiceLabelActive: { color: colors.primary, fontWeight: '700' },

    morphoBadge: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12,
    },
    morphoEmoji: { fontSize: 36 },
    morphoLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
    morphoDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

    section: { marginTop: 10 },
    adviceSection: {
        backgroundColor: colors.primary + '10', padding: 14,
        borderRadius: 12, borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    bullet: { fontSize: 13, color: colors.textSecondary, lineHeight: 22 },
});
