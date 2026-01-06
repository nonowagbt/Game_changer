import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getDailyGoals, saveDailyGoals, getDailyProgress, updateDailyProgress, calculateStreaks, getUserInfo } from '../utils/db';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const [goals, setGoals] = useState({ water: 2, calories: 2000 });
  const [progress, setProgress] = useState({ water: 0, calories: 0 });
  const [streaks, setStreaks] = useState({ gym: 0, eating: 0, drinking: 0 });
  const [bmi, setBmi] = useState(null);
  const [editing, setEditing] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [manualInputModal, setManualInputModal] = useState({ visible: false, type: null, value: '' });
  const navigation = useNavigation();

  const loadData = async () => {
    const savedGoals = await getDailyGoals();
    const savedProgress = await getDailyProgress();
    const calculatedStreaks = await calculateStreaks();
    const userInfo = await getUserInfo();

    // Calculer l'IMC à partir du poids et de la taille, si disponibles
    if (userInfo && userInfo.weight && userInfo.height) {
      const heightInMeters = userInfo.height / 100;
      const bmiValue = userInfo.weight / (heightInMeters * heightInMeters);
      setBmi(bmiValue ? bmiValue.toFixed(1) : null);
    } else {
      setBmi(null);
    }

    setGoals(savedGoals);
    setProgress(savedProgress);
    setStreaks(calculatedStreaks);
  };

  // Recharger les données quand l'écran reçoit le focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const handleEditGoal = (type) => {
    setEditing(type);
    setTempValue(goals[type].toString());
  };

  const handleSaveGoal = async (type) => {
    const value = parseFloat(tempValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une valeur valide');
      return;
    }
    const newGoals = { ...goals, [type]: value };
    setGoals(newGoals);
    await saveDailyGoals(newGoals);
    setEditing(null);
    setTempValue('');
  };

  const handleAddProgress = async (type, amount) => {
    const newProgress = {
      ...progress,
      [type]: Math.max(0, progress[type] + amount),
    };
    setProgress(newProgress);
    await updateDailyProgress(newProgress);
    // Recalculer les streaks après mise à jour
    const calculatedStreaks = await calculateStreaks();
    setStreaks(calculatedStreaks);
  };

  const handleManualInput = (type) => {
    setManualInputModal({ visible: true, type, value: '' });
  };

  const handleSaveManualInput = async () => {
    const amount = parseFloat(manualInputModal.value);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une valeur valide');
      return;
    }
    const newProgress = {
      ...progress,
      [manualInputModal.type]: progress[manualInputModal.type] + amount,
    };
    setProgress(newProgress);
    await updateDailyProgress(newProgress);
    // Recalculer les streaks après mise à jour
    const calculatedStreaks = await calculateStreaks();
    setStreaks(calculatedStreaks);
    setManualInputModal({ visible: false, type: null, value: '' });
  };

  const getProgressPercentage = (type) => {
    const currentProgress = progress[type] || 0;
    const goal = goals[type] || 1;
    return Math.min(100, (currentProgress / goal) * 100);
  };

  const styles = getStyles();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Objectifs Quotidiens</Text>
        <Text style={styles.headerSubtitle}>Suivez vos progrès aujourd'hui</Text>
      </View>

      {/* Raccourcis (limités à 3) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="flash" size={24} color={colors.primary} />
            <Text style={styles.cardTitle}>Raccourcis</Text>
          </View>
        </View>

        <View style={styles.shortcutsContainer}>
          {/* Raccourci Amis */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Amis')}
          >
            <View style={styles.shortcutIconContainer}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <View style={styles.shortcutTextContainer}>
              <Text style={styles.shortcutTitle}>Amis</Text>
              <Text style={styles.shortcutSubtitle}>Gérer ma liste d'amis</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Raccourci IMC */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Informations')}
          >
            <View style={styles.shortcutIconContainer}>
              <Ionicons name="body" size={22} color="#F97316" />
            </View>
            <View style={styles.shortcutTextContainer}>
              <Text style={styles.shortcutTitle}>Mon IMC</Text>
              <Text style={styles.shortcutSubtitle}>
                {bmi ? `${bmi} kg/m²` : "Complétez vos mensurations"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Raccourci Entraînement */}
          <TouchableOpacity
            style={styles.shortcutCard}
            onPress={() => navigation.navigate('Entraînements')}
          >
            <View style={styles.shortcutIconContainer}>
              <Ionicons name="barbell" size={22} color="#22C55E" />
            </View>
            <View style={styles.shortcutTextContainer}>
              <Text style={styles.shortcutTitle}>Mon entraînement</Text>
              <Text style={styles.shortcutSubtitle}>Accéder à mes séances</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Water Goal */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="water" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>Eau</Text>
          </View>
          {editing === 'water' ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="numeric"
                placeholder="Litres"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveGoal('water')}
              >
                <Ionicons name="checkmark" size={20} color={colors.cardBackground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(null)}
              >
                <Ionicons name="close" size={20} color={colors.cardBackground} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => handleEditGoal('water')}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${getProgressPercentage('water')}%`,
                  backgroundColor: '#3B82F6',
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {(progress.water || 0).toFixed(1)}L / {goals.water}L
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('water', -0.25)}
          >
            <Ionicons name="remove" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>-0.25L</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('water', 0.25)}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>+0.25L</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('water', 0.5)}
          >
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>+0.5L</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.manualButton]}
            onPress={() => handleManualInput('water')}
          >
            <Ionicons name="create" size={20} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Manuel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Calories Goal */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="flame" size={24} color="#EF4444" />
            <Text style={styles.cardTitle}>Calories</Text>
          </View>
          {editing === 'calories' ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType="numeric"
                placeholder="Calories"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveGoal('calories')}
              >
                <Ionicons name="checkmark" size={20} color={colors.cardBackground} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditing(null)}
              >
                <Ionicons name="close" size={20} color={colors.cardBackground} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={() => handleEditGoal('calories')}>
              <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                  {
                    width: `${getProgressPercentage('calories')}%`,
                    backgroundColor: colors.progressFill,
                  },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(progress.calories || 0)} / {goals.calories} kcal
          </Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('calories', -100)}
          >
            <Ionicons name="remove" size={20} color="#EF4444" />
            <Text style={styles.actionButtonText}>-100</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('calories', 100)}
          >
            <Ionicons name="add" size={20} color="#EF4444" />
            <Text style={styles.actionButtonText}>+100</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleAddProgress('calories', 250)}
          >
            <Ionicons name="add" size={20} color="#EF4444" />
            <Text style={styles.actionButtonText}>+250</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.manualButton]}
            onPress={() => handleManualInput('calories')}
          >
            <Ionicons name="create" size={20} color="#EF4444" />
            <Text style={styles.actionButtonText}>Manuel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Streaks (Récurrences) */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="trophy" size={24} color="#F59E0B" />
            <Text style={styles.cardTitle}>Récurrences</Text>
          </View>
        </View>

        <View style={styles.streaksContainer}>
          {/* Eating Streak */}
          <View style={styles.streakItem}>
            <View style={styles.streakHeader}>
              <Ionicons name="restaurant" size={20} color="#10B981" />
              <Text style={styles.streakLabel}>Manger</Text>
            </View>
            <View style={styles.streakIcons}>
              {streaks.eating > 0 ? (
                <>
                  {Array.from({ length: Math.min(streaks.eating, 7) }).map((_, index) => (
                    <Ionicons key={index} name="flame" size={24} color="#EF4444" />
                  ))}
                  {streaks.eating > 7 && (
                    <Text style={styles.streakCount}>+{streaks.eating - 7}</Text>
                  )}
                </>
              ) : (
                <Ionicons name="flame-outline" size={24} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.streakText}>{streaks.eating} jour{streaks.eating > 1 ? 's' : ''}</Text>
          </View>

          {/* Drinking Streak */}
          <View style={styles.streakItem}>
            <View style={styles.streakHeader}>
              <Ionicons name="water" size={20} color="#3B82F6" />
              <Text style={styles.streakLabel}>Boire</Text>
            </View>
            <View style={styles.streakIcons}>
              {streaks.drinking > 0 ? (
                <>
                  {Array.from({ length: Math.min(streaks.drinking, 7) }).map((_, index) => (
                    <Ionicons key={index} name="flame" size={24} color="#EF4444" />
                  ))}
                  {streaks.drinking > 7 && (
                    <Text style={styles.streakCount}>+{streaks.drinking - 7}</Text>
                  )}
                </>
              ) : (
                <Ionicons name="flame-outline" size={24} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.streakText}>{streaks.drinking} jour{streaks.drinking > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Manual Input Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={manualInputModal.visible}
        onRequestClose={() => setManualInputModal({ visible: false, type: null, value: '' })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Ajouter {manualInputModal.type === 'water' ? "de l'eau" : 'des calories'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Entrez la quantité à ajouter
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manualInputModal.value}
              onChangeText={(text) => setManualInputModal({ ...manualInputModal, value: text })}
              keyboardType="numeric"
              placeholder={manualInputModal.type === 'water' ? 'Litres (ex: 0.5)' : 'Calories (ex: 150)'}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={() => setManualInputModal({ visible: false, type: null, value: '' })}
              >
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSaveButton]}
                onPress={handleSaveManualInput}
              >
                <Text style={styles.modalSaveText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 30,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.cardBackground,
    margin: 15,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 3,
    borderLeftColor: colors.accentLine,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 5,
    padding: 5,
    width: 80,
    textAlign: 'center',
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 5,
    padding: 5,
  },
  cancelButton: {
    backgroundColor: colors.error,
    borderRadius: 5,
    padding: 5,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 20,
    backgroundColor: colors.progressBackground,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.progressFill,
    borderRadius: 10,
  },
  progressText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    gap: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualButton: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.modalBackground,
    borderRadius: 20,
    padding: 25,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelText: {
    color: colors.buttonSecondaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: colors.buttonPrimary,
  },
  modalSaveText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  streaksContainer: {
    gap: 20,
  },
  streakItem: {
    marginBottom: 10,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  streakIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  streakCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  streakText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 5,
  },
  shortcutsContainer: {
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  shortcutIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: colors.cardBackground,
  },
  shortcutTextContainer: {
    flex: 1,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  shortcutSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});

