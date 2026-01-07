import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  FlatList,
  Image,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWorkouts, saveWorkouts } from '../utils/db';
import { colors } from '../theme/colors';
import ExerciseImagePicker from '../components/ExerciseImagePicker';

export default function WorkoutScreen() {
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContainer: {
      padding: 15,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.textSecondary,
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 10,
    },
    workoutCard: {
      backgroundColor: colors.cardBackground,
      padding: 20,
      borderRadius: 15,
      marginBottom: 15,
      borderLeftWidth: 3,
      borderLeftColor: colors.accentLine,
      borderWidth: 1,
      borderColor: colors.border,
    },
    workoutHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 15,
    },
    workoutTitleContainer: {
      flex: 1,
    },
    workoutName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    exerciseCount: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 5,
    },
    workoutActions: {
      flexDirection: 'row',
      gap: 10,
    },
    iconButton: {
      padding: 5,
    },
    exercisesList: {
      marginTop: 10,
      gap: 10,
    },
    exercisePreview: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginTop: 8,
    },
    exercisePreviewName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    exercisePreviewDetails: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    exerciseItem: {
      backgroundColor: colors.backgroundSecondary,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    exerciseContent: {
      flexDirection: 'row',
      gap: 15,
    },
    exerciseImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: colors.background,
    },
    exerciseEmojiContainer: {
      width: 80,
      height: 80,
      borderRadius: 10,
      backgroundColor: colors.cardBackground,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.primary,
    },
    exerciseEmoji: {
      fontSize: 40,
    },
    exerciseInfo: {
      flex: 1,
    },
    exerciseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      flex: 1,
    },
    exerciseActions: {
      flexDirection: 'row',
      gap: 8,
    },
    exerciseDetails: {
      marginTop: 8,
    },
    exerciseDetailText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    serieRow: {
      paddingVertical: 4,
    },
    serieText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    fab: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.background,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 5,
    },
    form: {
      padding: 20,
    },
    inputGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    smallLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 10,
      padding: 15,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
    },
    smallInput: {
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      backgroundColor: colors.inputBackground,
      color: colors.inputText,
    },
    sectionHeader: {
      marginTop: 20,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 12,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      marginTop: 10,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyExercises: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 10,
      marginVertical: 10,
    },
    emptyExercisesText: {
      fontSize: 14,
      color: colors.textTertiary,
    },
    defaultsSection: {
      backgroundColor: colors.backgroundSecondary,
      padding: 15,
      borderRadius: 10,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowInputs: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 15,
    },
    halfInput: {
      flex: 1,
    },
    thirdInput: {
      flex: 1,
    },
    applyButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10,
    },
    applyButtonText: {
      color: colors.cardBackground,
      fontSize: 14,
      fontWeight: '600',
    },
    seriesSection: {
      marginTop: 20,
    },
    serieCard: {
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    serieTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: {
      color: colors.cardBackground,
      fontSize: 18,
      fontWeight: 'bold',
    },
    inlineExerciseForm: {
      backgroundColor: colors.backgroundSecondary,
      padding: 15,
      borderRadius: 10,
      marginTop: 15,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.accentLine,
    },
    exerciseFormHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    exerciseFormTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    exerciseFormActions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 15,
    },
    exerciseFormButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelExerciseButton: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelExerciseButtonText: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
    },
    saveExerciseButton: {
      backgroundColor: colors.primary,
    },
    saveExerciseButtonText: {
      color: colors.cardBackground,
      fontSize: 16,
      fontWeight: 'bold',
    },
    exercisesListContainer: {
      marginTop: 15,
      marginBottom: 15,
    },
    exercisesListTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    exerciseCountSeparator: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    estimatedTimeContainer: {
      marginBottom: 20,
    },
    estimatedTimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: colors.backgroundSecondary,
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    estimatedTimeTextContainer: {
      flex: 1,
    },
    estimatedTimeLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    estimatedTimeValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
    },
  });
  
  const [workouts, setWorkouts] = useState([]);
  const [workoutModalVisible, setWorkoutModalVisible] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    sets: '',
    defaultReps: '',
    defaultWeight: '',
    defaultRestTime: '',
    imageUri: null,
  });
  const [series, setSeries] = useState([]);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const savedWorkouts = await getWorkouts();
    setWorkouts(savedWorkouts);
  };

  const handleOpenWorkoutModal = (workout = null) => {
    if (workout) {
      setEditingWorkout(workout.id);
      setWorkoutName(workout.name);
      setExercises(workout.exercises || []);
    } else {
      setEditingWorkout(null);
      setWorkoutName('');
      setExercises([]);
    }
    setShowExerciseForm(false);
    resetExerciseForm();
    setWorkoutModalVisible(true);
  };

  const handleSaveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'entraînement');
      return;
    }

    if (exercises.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un exercice');
      return;
    }

    const workout = {
      id: editingWorkout || Date.now().toString(),
      name: workoutName.trim(),
      exercises: exercises,
    };

    let updatedWorkouts;
    if (editingWorkout) {
      updatedWorkouts = workouts.map((w) =>
        w.id === editingWorkout ? workout : w
      );
    } else {
      updatedWorkouts = [...workouts, workout];
    }

    setWorkouts(updatedWorkouts);
    await saveWorkouts(updatedWorkouts);
    setWorkoutModalVisible(false);
    resetWorkoutForm();
  };

  const resetWorkoutForm = () => {
    setWorkoutName('');
    setExercises([]);
    setEditingWorkout(null);
    setShowExerciseForm(false);
    resetExerciseForm();
  };

  const handleOpenExerciseForm = (exercise = null) => {
    if (exercise) {
      setEditingExercise(exercise.id);
      setExerciseForm({
        name: exercise.name,
        sets: exercise.series.length.toString(),
        defaultReps: exercise.defaultReps?.toString() || '',
        defaultWeight: exercise.defaultWeight?.toString() || '',
        defaultRestTime: exercise.defaultRestTime?.toString() || '',
        imageUri: exercise.imageUri || null,
      });
      setSeries(exercise.series.map((s, index) => ({
        id: index,
        reps: s.reps.toString(),
        weight: s.weight.toString(),
        restTime: s.restTime.toString(),
      })));
    } else {
      setEditingExercise(null);
      resetExerciseForm();
    }
    setShowExerciseForm(true);
  };


  const handleUpdateSeries = () => {
    const numSets = parseInt(exerciseForm.sets) || 0;
    if (numSets <= 0) {
      Alert.alert('Erreur', 'Le nombre de séries doit être supérieur à 0');
      return;
    }

    const defaultReps = parseInt(exerciseForm.defaultReps) || 0;
    const defaultWeight = parseFloat(exerciseForm.defaultWeight) || 0;
    const defaultRestTime = parseInt(exerciseForm.defaultRestTime) || 0;

    const newSeries = [];
    for (let i = 0; i < numSets; i++) {
      if (series[i]) {
        newSeries.push({
          id: i,
          reps: series[i].reps,
          weight: series[i].weight,
          restTime: series[i].restTime,
        });
      } else {
        newSeries.push({
          id: i,
          reps: defaultReps.toString(),
          weight: defaultWeight.toString(),
          restTime: defaultRestTime.toString(),
        });
      }
    }
    setSeries(newSeries);
  };

  const handleSaveExercise = () => {
    if (!exerciseForm.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour l\'exercice');
      return;
    }

    const numSets = parseInt(exerciseForm.sets) || 0;
    if (numSets <= 0) {
      Alert.alert('Erreur', 'Le nombre de séries doit être supérieur à 0');
      return;
    }

    // Si les séries ne sont pas encore initialisées, les créer avec les valeurs par défaut
    let finalSeries = series;
    if (series.length !== numSets) {
      const defaultReps = parseInt(exerciseForm.defaultReps) || 0;
      const defaultWeight = parseFloat(exerciseForm.defaultWeight) || 0;
      const defaultRestTime = parseInt(exerciseForm.defaultRestTime) || 0;
      
      finalSeries = [];
      for (let i = 0; i < numSets; i++) {
        if (series[i]) {
          finalSeries.push({
            id: i,
            reps: series[i].reps || defaultReps.toString(),
            weight: series[i].weight || defaultWeight.toString(),
            restTime: series[i].restTime || defaultRestTime.toString(),
          });
        } else {
          finalSeries.push({
            id: i,
            reps: defaultReps.toString(),
            weight: defaultWeight.toString(),
            restTime: defaultRestTime.toString(),
          });
        }
      }
    }

    const exercise = {
      id: editingExercise || Date.now().toString(),
      name: exerciseForm.name.trim(),
      defaultReps: parseInt(exerciseForm.defaultReps) || 0,
      defaultWeight: parseFloat(exerciseForm.defaultWeight) || 0,
      defaultRestTime: parseInt(exerciseForm.defaultRestTime) || 0,
      imageUri: exerciseForm.imageUri || null,
      series: finalSeries.map((s) => ({
        reps: parseInt(s.reps) || 0,
        weight: parseFloat(s.weight) || 0,
        restTime: parseInt(s.restTime) || 0,
      })),
    };

    let updatedExercises;
    if (editingExercise) {
      updatedExercises = exercises.map((e) =>
        e.id === editingExercise ? exercise : e
      );
    } else {
      updatedExercises = [...exercises, exercise];
    }

    setExercises(updatedExercises);
    setShowExerciseForm(false);
    resetExerciseForm();
  };

  const resetExerciseForm = () => {
    setExerciseForm({
      name: '',
      sets: '',
      defaultReps: '',
      defaultWeight: '',
      defaultRestTime: '',
      imageUri: null,
    });
    setSeries([]);
    setEditingExercise(null);
  };

  const handleDeleteExercise = (exerciseId) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cet exercice ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setExercises(exercises.filter((e) => e.id !== exerciseId));
          },
        },
      ]
    );
  };

  const handleDeleteWorkout = (id) => {
    Alert.alert(
      'Supprimer',
      'Êtes-vous sûr de vouloir supprimer cet entraînement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updatedWorkouts = workouts.filter((w) => w.id !== id);
            setWorkouts(updatedWorkouts);
            await saveWorkouts(updatedWorkouts);
          },
        },
      ]
    );
  };

  // Calculer le temps total estimé d'un entraînement (en secondes)
  const calculateWorkoutTime = (workoutExercises) => {
    if (!workoutExercises || workoutExercises.length === 0) {
      return 0;
    }

    let totalSeconds = 0;
    const TIME_PER_REP = 3; // 3 secondes par répétition
    const TRANSITION_TIME = 15; // 15 secondes de transition entre exercices

    workoutExercises.forEach((exercise, exerciseIndex) => {
      if (exercise.series && exercise.series.length > 0) {
        exercise.series.forEach((serie, serieIndex) => {
          const reps = parseInt(serie.reps) || 0;
          const restTime = parseInt(serie.restTime) || 0;
          
          // Temps d'exécution de la série (répétitions × 3 secondes)
          totalSeconds += reps * TIME_PER_REP;
          
          // Temps de repos après la série (sauf pour la dernière série de l'exercice)
          if (serieIndex < exercise.series.length - 1) {
            totalSeconds += restTime;
          }
        });
      }
      
      // Temps de transition entre exercices (sauf pour le dernier exercice)
      if (exerciseIndex < workoutExercises.length - 1) {
        totalSeconds += TRANSITION_TIME;
      }
    });

    return totalSeconds;
  };

  // Formater le temps en heures/minutes ou minutes/secondes
  const formatTime = (seconds) => {
    if (seconds === 0) return '0 min';
    
    const totalMinutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // Si plus d'une heure, afficher en heures et minutes
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      
      if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}min`;
      }
    } else {
      // Sinon, afficher en minutes et secondes
      if (totalMinutes === 0) {
        return `${remainingSeconds}s`;
      } else if (remainingSeconds === 0) {
        return `${totalMinutes}min`;
      } else {
        return `${totalMinutes}min ${remainingSeconds}s`;
      }
    }
  };

  // Formater l'entraînement en texte pour le partage
  const formatWorkoutForShare = (workout) => {
    let text = `🏋️ ${workout.name}\n\n`;
    
    const estimatedTime = calculateWorkoutTime(workout.exercises);
    if (estimatedTime > 0) {
      text += `⏱️ Temps estimé: ${formatTime(estimatedTime)}\n\n`;
    }
    
    if (workout.exercises && workout.exercises.length > 0) {
      text += `📋 ${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''}:\n\n`;
      
      workout.exercises.forEach((exercise, index) => {
        text += `${index + 1}. ${exercise.name}\n`;
        
        if (exercise.series && exercise.series.length > 0) {
          exercise.series.forEach((serie, serieIndex) => {
            const reps = serie.reps || '0';
            const weight = serie.weight || '0';
            const restTime = serie.restTime || '0';
            
            text += `   Série ${serieIndex + 1}: ${reps} reps × ${weight} kg`;
            if (restTime > 0) {
              text += ` (repos: ${restTime}s)`;
            }
            text += '\n';
          });
        }
        text += '\n';
      });
    } else {
      text += 'Aucun exercice défini.\n';
    }
    
    text += '\n---\n';
    text += 'Créé avec Game Changer';
    
    return text;
  };

  // Partager l'entraînement
  const handleShareWorkout = async (workout) => {
    try {
      const workoutText = formatWorkoutForShare(workout);
      const result = await Share.share({
        message: workoutText,
        title: workout.name,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Partagé avec un type d'activité spécifique
          console.log('Partagé avec:', result.activityType);
        } else {
          // Partagé
          console.log('Entraînement partagé');
        }
      } else if (result.action === Share.dismissedAction) {
        // Partage annulé
        console.log('Partage annulé');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de partager l\'entraînement');
      console.error('Erreur lors du partage:', error);
    }
  };

  const renderExerciseItem = ({ item, index }) => {
    const isExerciseFromDB = item.imageUri && item.imageUri.startsWith('exercise:');
    const exerciseData = isExerciseFromDB ? item.imageUri.split(':') : null;
    const exerciseEmoji = exerciseData ? exerciseData[2] : null;

    return (
      <View style={styles.exerciseItem}>
        <View style={styles.exerciseContent}>
          {item.imageUri && (
            isExerciseFromDB ? (
              <View style={styles.exerciseEmojiContainer}>
                <Text style={styles.exerciseEmoji}>{exerciseEmoji}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: item.imageUri }}
                style={styles.exerciseImage}
              />
            )
          )}
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.exerciseActions}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleOpenExerciseForm(item);
                }}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteExercise(item.id);
                }}
                style={styles.iconButton}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.exerciseDetails}>
            <Text style={styles.exerciseDetailText}>
              {item.series.length} série{item.series.length > 1 ? 's' : ''}
            </Text>
            {item.series.map((serie, idx) => (
              <View key={idx} style={styles.serieRow}>
                <Text style={styles.serieText}>
                  Série {idx + 1}: {serie.reps} reps × {serie.weight} kg
                  {serie.restTime > 0 && ` (repos: ${serie.restTime}s)`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
    );
  };

  const renderWorkoutItem = ({ item }) => {
    const estimatedTime = calculateWorkoutTime(item.exercises);
    
    return (
      <View style={styles.workoutCard}>
        <View style={styles.workoutHeader}>
          <View style={styles.workoutTitleContainer}>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text style={styles.exerciseCount}>
              {item.exercises?.length || 0} exercice{(item.exercises?.length || 0) > 1 ? 's' : ''}
              {estimatedTime > 0 && (
                <Text style={styles.exerciseCountSeparator}> • {formatTime(estimatedTime)}</Text>
              )}
            </Text>
          </View>
          <View style={styles.workoutActions}>
            <TouchableOpacity
              onPress={() => handleShareWorkout(item)}
              style={styles.iconButton}
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleOpenWorkoutModal(item)}
              style={styles.iconButton}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteWorkout(item.id)}
              style={styles.iconButton}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {item.exercises && item.exercises.length > 0 && (
          <View style={styles.exercisesList}>
            {item.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exercisePreview}>
                <Text style={styles.exercisePreviewName}>{exercise.name}</Text>
                <Text style={styles.exercisePreviewDetails}>
                  {exercise.series.length} série{exercise.series.length > 1 ? 's' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {workouts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="barbell-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyText}>Aucun entraînement</Text>
          <Text style={styles.emptySubtext}>
            Créez votre premier entraînement !
          </Text>
        </View>
      ) : (
        <FlatList
          data={workouts}
          renderItem={renderWorkoutItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => handleOpenWorkoutModal()}
      >
        <Ionicons name="add" size={30} color={colors.cardBackground} />
      </TouchableOpacity>

      {/* Workout Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={workoutModalVisible}
        onRequestClose={() => {
          setWorkoutModalVisible(false);
          resetWorkoutForm();
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setWorkoutModalVisible(false);
            resetWorkoutForm();
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingWorkout ? 'Modifier' : 'Nouvel'} Entraînement
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setWorkoutModalVisible(false);
                  resetWorkoutForm();
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nom de l'entraînement</Text>
                <TextInput
                  style={styles.input}
                  value={workoutName}
                  onChangeText={setWorkoutName}
                  placeholder="Ex: Entraînement Jambes"
                />
              </View>

              {/* Affichage du temps estimé */}
              {exercises.length > 0 && (
                <View style={styles.estimatedTimeContainer}>
                  <View style={styles.estimatedTimeBadge}>
                    <Ionicons name="time" size={20} color={colors.primary} />
                    <View style={styles.estimatedTimeTextContainer}>
                      <Text style={styles.estimatedTimeLabel}>Temps estimé</Text>
                      <Text style={styles.estimatedTimeValue}>
                        {formatTime(calculateWorkoutTime(exercises))}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exercices</Text>
                {!showExerciseForm && (
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleOpenExerciseForm(null);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                    <Text style={styles.addButtonText}>Ajouter un exercice</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Formulaire d'exercice intégré */}
              {showExerciseForm && (
                <View style={styles.inlineExerciseForm}>
                  <View style={styles.exerciseFormHeader}>
                    <Text style={styles.exerciseFormTitle}>
                      {editingExercise ? 'Modifier' : 'Nouvel'} Exercice
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowExerciseForm(false);
                        resetExerciseForm();
                      }}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nom de l'exercice</Text>
                    <TextInput
                      style={styles.input}
                      value={exerciseForm.name}
                      onChangeText={(text) =>
                        setExerciseForm({ ...exerciseForm, name: text })
                      }
                      placeholder="Ex: Développé couché"
                    />
                  </View>

                  <ExerciseImagePicker
                    imageUri={exerciseForm.imageUri}
                    exerciseName={exerciseForm.name}
                    onImageSelected={(uri) =>
                      setExerciseForm({ ...exerciseForm, imageUri: uri })
                    }
                    onImageRemoved={() =>
                      setExerciseForm({ ...exerciseForm, imageUri: null })
                    }
                    onExerciseNameSelected={(name) =>
                      setExerciseForm({ ...exerciseForm, name })
                    }
                  />

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Nombre de séries</Text>
                    <TextInput
                      style={styles.input}
                      value={exerciseForm.sets}
                      onChangeText={(text) => {
                        setExerciseForm({ ...exerciseForm, sets: text });
                        const numSets = parseInt(text) || 0;
                        if (numSets > 0) {
                          const defaultReps = parseInt(exerciseForm.defaultReps) || 0;
                          const defaultWeight = parseFloat(exerciseForm.defaultWeight) || 0;
                          const defaultRestTime = parseInt(exerciseForm.defaultRestTime) || 0;
                          const newSeries = [];
                          for (let i = 0; i < numSets; i++) {
                            if (series[i]) {
                              newSeries.push(series[i]);
                            } else {
                              newSeries.push({
                                id: i,
                                reps: defaultReps.toString(),
                                weight: defaultWeight.toString(),
                                restTime: defaultRestTime.toString(),
                              });
                            }
                          }
                          setSeries(newSeries);
                        }
                      }}
                      keyboardType="numeric"
                      placeholder="Ex: 4"
                    />
                  </View>

                  <View style={styles.defaultsSection}>
                    <Text style={styles.sectionTitle}>Valeurs par défaut</Text>
                    <View style={styles.rowInputs}>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>Répétitions</Text>
                        <TextInput
                          style={styles.input}
                          value={exerciseForm.defaultReps}
                          onChangeText={(text) => {
                            setExerciseForm({ ...exerciseForm, defaultReps: text });
                            const reps = text || '0';
                            setSeries(series.map((s) => ({ ...s, reps })));
                          }}
                          keyboardType="numeric"
                          placeholder="Ex: 12"
                        />
                      </View>
                      <View style={styles.halfInput}>
                        <Text style={styles.label}>Charge (kg)</Text>
                        <TextInput
                          style={styles.input}
                          value={exerciseForm.defaultWeight}
                          onChangeText={(text) => {
                            setExerciseForm({ ...exerciseForm, defaultWeight: text });
                            const weight = text || '0';
                            setSeries(series.map((s) => ({ ...s, weight })));
                          }}
                          keyboardType="numeric"
                          placeholder="Ex: 60"
                        />
                      </View>
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Temps de repos (secondes)</Text>
                      <TextInput
                        style={styles.input}
                        value={exerciseForm.defaultRestTime}
                        onChangeText={(text) => {
                          setExerciseForm({ ...exerciseForm, defaultRestTime: text });
                          const restTime = text || '0';
                          setSeries(series.map((s) => ({ ...s, restTime })));
                        }}
                        keyboardType="numeric"
                        placeholder="Ex: 90"
                      />
                    </View>
                  </View>

                  {series.length > 0 && (
                    <View style={styles.seriesSection}>
                      <Text style={styles.sectionTitle}>Détails par série</Text>
                      {series.map((serie, index) => (
                        <View key={serie.id} style={styles.serieCard}>
                          <Text style={styles.serieTitle}>Série {index + 1}</Text>
                          <View style={styles.rowInputs}>
                            <View style={styles.thirdInput}>
                              <Text style={styles.smallLabel}>Répétitions</Text>
                              <TextInput
                                style={styles.smallInput}
                                value={serie.reps}
                                onChangeText={(text) => {
                                  const newSeries = [...series];
                                  newSeries[index] = { ...newSeries[index], reps: text };
                                  setSeries(newSeries);
                                }}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={styles.thirdInput}>
                              <Text style={styles.smallLabel}>Charge (kg)</Text>
                              <TextInput
                                style={styles.smallInput}
                                value={serie.weight}
                                onChangeText={(text) => {
                                  const newSeries = [...series];
                                  newSeries[index] = { ...newSeries[index], weight: text };
                                  setSeries(newSeries);
                                }}
                                keyboardType="numeric"
                              />
                            </View>
                            <View style={styles.thirdInput}>
                              <Text style={styles.smallLabel}>Repos (s)</Text>
                              <TextInput
                                style={styles.smallInput}
                                value={serie.restTime}
                                onChangeText={(text) => {
                                  const newSeries = [...series];
                                  newSeries[index] = { ...newSeries[index], restTime: text };
                                  setSeries(newSeries);
                                }}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.exerciseFormActions}>
                    <TouchableOpacity
                      style={[styles.exerciseFormButton, styles.cancelExerciseButton]}
                      onPress={() => {
                        setShowExerciseForm(false);
                        resetExerciseForm();
                      }}
                    >
                      <Text style={styles.cancelExerciseButtonText}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.exerciseFormButton, styles.saveExerciseButton]}
                      onPress={handleSaveExercise}
                    >
                      <Text style={styles.saveExerciseButtonText}>
                        {editingExercise ? 'Modifier' : 'Ajouter'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Liste des exercices ajoutés */}
              {exercises.length === 0 ? (
                !showExerciseForm && (
                  <View style={styles.emptyExercises}>
                    <Text style={styles.emptyExercisesText}>
                      Aucun exercice ajouté
                    </Text>
                  </View>
                )
              ) : (
                <View style={styles.exercisesListContainer}>
                  <Text style={styles.exercisesListTitle}>Exercices ajoutés ({exercises.length})</Text>
                  {exercises.map((exercise, index) => (
                    <View key={exercise.id || index}>
                      {renderExerciseItem({ item: exercise, index })}
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveWorkout}
              >
                <Text style={styles.saveButtonText}>Enregistrer l'entraînement</Text>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
