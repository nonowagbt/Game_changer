import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getUserInfo, saveUserInfo, getDailyGoals, saveDailyGoals } from '../utils/db';
import { colors } from '../theme/colors';

export default function InfoScreen() {
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'measurements', 'goals'
  
  // Informations personnelles
  const [personalInfo, setPersonalInfo] = useState({ email: '', name: '', phone: '' });
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({ email: '', name: '', phone: '' });

  // Mensurations
  const [measurements, setMeasurements] = useState({ weight: null, height: null });
  const [editingMeasurements, setEditingMeasurements] = useState(false);
  const [measurementsForm, setMeasurementsForm] = useState({ weight: '', height: '' });

  // Objectifs
  const [goals, setGoals] = useState({ water: 2, calories: 2000 });
  const [editingGoals, setEditingGoals] = useState(false);
  const [goalsForm, setGoalsForm] = useState({ water: '', calories: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userInfo = await getUserInfo();
    const dailyGoals = await getDailyGoals();
    
    // Informations personnelles
    setPersonalInfo({
      email: userInfo.email || '',
      name: userInfo.name || '',
      phone: userInfo.phone || '',
    });
    setPersonalForm({
      email: userInfo.email || '',
      name: userInfo.name || '',
      phone: userInfo.phone || '',
    });

    // Mensurations
    setMeasurements({
      weight: userInfo.weight || null,
      height: userInfo.height || null,
    });
    setMeasurementsForm({
      weight: userInfo.weight ? userInfo.weight.toString() : '',
      height: userInfo.height ? userInfo.height.toString() : '',
    });

    // Objectifs
    setGoals(dailyGoals);
    setGoalsForm({
      water: dailyGoals.water ? dailyGoals.water.toString() : '',
      calories: dailyGoals.calories ? dailyGoals.calories.toString() : '',
    });
  };

  // Informations personnelles
  const handleSavePersonal = async () => {
    const newInfo = {
      ...personalForm,
      email: personalForm.email.trim(),
      name: personalForm.name.trim(),
      phone: personalForm.phone.trim(),
    };

    // Récupérer les autres infos existantes
    const existingInfo = await getUserInfo();
    const updatedInfo = {
      ...existingInfo,
      ...newInfo,
    };

    setPersonalInfo(newInfo);
    await saveUserInfo(updatedInfo);
    setEditingPersonal(false);
    Alert.alert('Succès', 'Informations personnelles enregistrées');
  };

  // Mensurations
  const handleSaveMeasurements = async () => {
    const weight = parseFloat(measurementsForm.weight);
    const height = parseFloat(measurementsForm.height);

    if (isNaN(weight) || weight <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un poids valide');
      return;
    }

    if (isNaN(height) || height <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une taille valide');
      return;
    }

    if (height > 300) {
      Alert.alert('Erreur', 'La taille doit être en centimètres (ex: 175)');
      return;
    }

    const newMeasurements = { weight, height };
    
    // Récupérer les autres infos existantes
    const existingInfo = await getUserInfo();
    const updatedInfo = {
      ...existingInfo,
      ...newMeasurements,
    };

    setMeasurements(newMeasurements);
    await saveUserInfo(updatedInfo);
    setEditingMeasurements(false);
    Alert.alert('Succès', 'Mensurations enregistrées');
  };

  // Objectifs
  const handleSaveGoals = async () => {
    const water = parseFloat(goalsForm.water);
    const calories = parseFloat(goalsForm.calories);

    if (isNaN(water) || water <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un objectif d\'eau valide');
      return;
    }

    if (isNaN(calories) || calories <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un objectif de calories valide');
      return;
    }

    const newGoals = { water, calories };
    setGoals(newGoals);
    await saveDailyGoals(newGoals);
    setEditingGoals(false);
    Alert.alert('Succès', 'Objectifs mis à jour');
  };

  const calculateBMI = () => {
    if (!measurements.weight || !measurements.height) {
      return null;
    }
    const heightInMeters = measurements.height / 100;
    return (measurements.weight / (heightInMeters * heightInMeters)).toFixed(1);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    const bmiValue = parseFloat(bmi);
    if (bmiValue < 18.5) return { label: 'Insuffisance pondérale', color: colors.info };
    if (bmiValue < 25) return { label: 'Poids normal', color: colors.success };
    if (bmiValue < 30) return { label: 'Surpoids', color: colors.warning };
    return { label: 'Obésité', color: colors.error };
  };

  const bmi = calculateBMI();
  const bmiCategory = getBMICategory(bmi);

  const renderPersonalTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Informations personnelles</Text>

        {editingPersonal ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom</Text>
              <TextInput
                style={styles.input}
                value={personalForm.name}
                onChangeText={(text) =>
                  setPersonalForm({ ...personalForm, name: text })
                }
                placeholder="Ex: Jean Dupont"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={personalForm.email}
                onChangeText={(text) =>
                  setPersonalForm({ ...personalForm, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Ex: jean.dupont@email.com"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Téléphone</Text>
              <TextInput
                style={styles.input}
                value={personalForm.phone}
                onChangeText={(text) =>
                  setPersonalForm({ ...personalForm, phone: text })
                }
                keyboardType="phone-pad"
                placeholder="Ex: 0612345678"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingPersonal(false);
                  loadData();
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSavePersonal}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoDisplay}>
            <View style={styles.infoRow}>
              <Ionicons name="person" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Nom</Text>
                <Text style={styles.infoValue}>
                  {personalInfo.name || 'Non renseigné'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="mail" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {personalInfo.email || 'Non renseigné'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="call" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>
                  {personalInfo.phone || 'Non renseigné'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingPersonal(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderMeasurementsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mensurations</Text>

        {editingMeasurements ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Poids (kg)</Text>
              <TextInput
                style={styles.input}
                value={measurementsForm.weight}
                onChangeText={(text) =>
                  setMeasurementsForm({ ...measurementsForm, weight: text })
                }
                keyboardType="numeric"
                placeholder="Ex: 75"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Taille (cm)</Text>
              <TextInput
                style={styles.input}
                value={measurementsForm.height}
                onChangeText={(text) =>
                  setMeasurementsForm({ ...measurementsForm, height: text })
                }
                keyboardType="numeric"
                placeholder="Ex: 175"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingMeasurements(false);
                  loadData();
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveMeasurements}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoDisplay}>
            <View style={styles.infoRow}>
              <Ionicons name="scale" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Poids</Text>
                <Text style={styles.infoValue}>
                  {measurements.weight ? `${measurements.weight} kg` : 'Non renseigné'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="resize" size={24} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Taille</Text>
                <Text style={styles.infoValue}>
                  {measurements.height ? `${measurements.height} cm` : 'Non renseigné'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingMeasurements(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {bmi && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Indice de Masse Corporelle (IMC)</Text>
          <View style={styles.bmiContainer}>
            <Text style={styles.bmiValue}>{bmi}</Text>
            {bmiCategory && (
              <View
                style={[
                  styles.bmiCategory,
                  { backgroundColor: bmiCategory.color + '20' },
                ]}
              >
                <Text
                  style={[styles.bmiCategoryText, { color: bmiCategory.color }]}
                >
                  {bmiCategory.label}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.bmiScale}>
            <View style={styles.scaleItem}>
              <View
                style={[
                  styles.scaleBar,
                  { backgroundColor: colors.info, flex: 1 },
                ]}
              />
              <Text style={styles.scaleLabel}>18.5</Text>
            </View>
            <View style={styles.scaleItem}>
              <View
                style={[
                  styles.scaleBar,
                  { backgroundColor: colors.success, flex: 2 },
                ]}
              />
              <Text style={styles.scaleLabel}>25</Text>
            </View>
            <View style={styles.scaleItem}>
              <View
                style={[
                  styles.scaleBar,
                  { backgroundColor: colors.warning, flex: 1.5 },
                ]}
              />
              <Text style={styles.scaleLabel}>30</Text>
            </View>
            <View style={styles.scaleItem}>
              <View
                style={[
                  styles.scaleBar,
                  { backgroundColor: colors.error, flex: 1 },
                ]}
              />
            </View>
          </View>

          <View style={styles.bmiLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.info }]} />
              <Text style={styles.legendText}>Insuffisance pondérale</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.success }]} />
              <Text style={styles.legendText}>Poids normal</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.warning }]} />
              <Text style={styles.legendText}>Surpoids</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: colors.error }]} />
              <Text style={styles.legendText}>Obésité</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderGoalsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Objectifs quotidiens</Text>

        {editingGoals ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Eau (litres)</Text>
              <TextInput
                style={styles.input}
                value={goalsForm.water}
                onChangeText={(text) =>
                  setGoalsForm({ ...goalsForm, water: text })
                }
                keyboardType="numeric"
                placeholder="Ex: 2"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Calories</Text>
              <TextInput
                style={styles.input}
                value={goalsForm.calories}
                onChangeText={(text) =>
                  setGoalsForm({ ...goalsForm, calories: text })
                }
                keyboardType="numeric"
                placeholder="Ex: 2000"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setEditingGoals(false);
                  loadData();
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSaveGoals}
              >
                <Text style={styles.saveButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoDisplay}>
            <View style={styles.infoRow}>
              <Ionicons name="water" size={24} color="#3B82F6" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Eau quotidienne</Text>
                <Text style={styles.infoValue}>
                  {goals.water} litres
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="flame" size={24} color="#EF4444" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Calories quotidiennes</Text>
                <Text style={styles.infoValue}>
                  {goals.calories} kcal
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditingGoals(true)}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} />
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle" size={80} color={colors.primary} />
        <Text style={styles.headerTitle}>Mes Informations</Text>
      </View>

      {/* Onglets */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Ionicons 
            name={activeTab === 'personal' ? 'person' : 'person-outline'} 
            size={20} 
            color={activeTab === 'personal' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'personal' && styles.activeTabText
          ]}>
            Personnelles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'measurements' && styles.activeTab]}
          onPress={() => setActiveTab('measurements')}
        >
          <Ionicons 
            name={activeTab === 'measurements' ? 'body' : 'body-outline'} 
            size={20} 
            color={activeTab === 'measurements' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'measurements' && styles.activeTabText
          ]}>
            Mensurations
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'goals' && styles.activeTab]}
          onPress={() => setActiveTab('goals')}
        >
          <Ionicons 
            name={activeTab === 'goals' ? 'flag' : 'flag-outline'} 
            size={20} 
            color={activeTab === 'goals' ? colors.primary : colors.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === 'goals' && styles.activeTabText
          ]}>
            Objectifs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.scrollView}>
        {activeTab === 'personal' && renderPersonalTab()}
        {activeTab === 'measurements' && renderMeasurementsTab()}
        {activeTab === 'goals' && renderGoalsTab()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    paddingBottom: 20,
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
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
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
  buttonContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: colors.buttonPrimary,
  },
  saveButtonText: {
    color: colors.buttonPrimaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.buttonSecondaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  infoDisplay: {
    gap: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    paddingVertical: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  bmiContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  bmiCategory: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bmiCategoryText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bmiScale: {
    flexDirection: 'row',
    height: 30,
    marginBottom: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  scaleItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scaleBar: {
    height: '100%',
  },
  scaleLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 5,
  },
  bmiLegend: {
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
