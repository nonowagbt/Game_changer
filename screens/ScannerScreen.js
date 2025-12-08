import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { updateDailyProgress, getDailyProgress } from '../utils/db';
import { colors } from '../theme/colors';
import { FOOD_DATABASE } from '../data/foodDatabase';
import FoodItem from '../components/FoodItem';
import CaloriesSummary, { calculateTotalCalories } from '../components/CaloriesSummary';
import { recognizeFoods } from '../utils/imageRecognition';
import { ActivityIndicator } from 'react-native';

export default function ScannerScreen() {
  const [facing, setFacing] = useState('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [showFoodSelection, setShowFoodSelection] = useState(false);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [estimatedCalories, setEstimatedCalories] = useState(0);
  const [customPortion, setCustomPortion] = useState({});
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState([]);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    const total = calculateTotalCalories(selectedFoods, customPortion);
    setEstimatedCalories(total);
  }, [selectedFoods, customPortion]);

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission refusée',
          'L\'accès à la caméra est nécessaire pour scanner vos repas. Vous pouvez l\'activer dans les paramètres de l\'application.',
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de demander la permission de la caméra');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      setPhoto(photo.uri);
      setShowFoodSelection(true);
      setSelectedFoods([]);
      setCustomPortion({});
      setDetectedFoods([]);
      setShowManualAdd(false);
      
      // Démarrer la reconnaissance automatique
      await recognizeFoodsInImage(photo.uri);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de prendre la photo');
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
      setShowFoodSelection(true);
      setSelectedFoods([]);
      setCustomPortion({});
      setDetectedFoods([]);
      setShowManualAdd(false);
      
      // Démarrer la reconnaissance automatique
      await recognizeFoodsInImage(result.assets[0].uri);
    }
  };

  const toggleFood = (foodName) => {
    if (selectedFoods.includes(foodName)) {
      setSelectedFoods(selectedFoods.filter((f) => f !== foodName));
      const newPortion = { ...customPortion };
      delete newPortion[foodName];
      setCustomPortion(newPortion);
    } else {
      setSelectedFoods([...selectedFoods, foodName]);
    }
  };

  const updatePortion = (foodName, portion) => {
    setCustomPortion({ ...customPortion, [foodName]: parseFloat(portion) || 100 });
  };

  const handleAddCalories = async () => {
    if (estimatedCalories <= 0) {
      Alert.alert('Erreur', 'Veuillez sélectionner au moins un aliment');
      return;
    }

    try {
      const currentProgress = await getDailyProgress();
      await updateDailyProgress({
        calories: currentProgress.calories + estimatedCalories,
      });

      Alert.alert(
        'Succès',
        `${estimatedCalories} calories ajoutées à votre progression quotidienne`,
        [
          {
            text: 'OK',
            onPress: () => {
              setPhoto(null);
              setShowFoodSelection(false);
              setSelectedFoods([]);
              setCustomPortion({});
              setEstimatedCalories(0);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter les calories');
    }
  };

  const recognizeFoodsInImage = async (imageUri) => {
    setIsRecognizing(true);
    try {
      const detected = await recognizeFoods(imageUri);
      setDetectedFoods(detected);
      
      // Ajouter automatiquement les aliments détectés
      if (detected.length > 0) {
        setSelectedFoods(detected);
        // Initialiser les portions à 100g par défaut pour les aliments détectés
        const portions = {};
        detected.forEach((food) => {
          portions[food] = 100;
        });
        setCustomPortion(portions);
      }
    } catch (error) {
      console.error('Erreur lors de la reconnaissance:', error);
    } finally {
      setIsRecognizing(false);
    }
  };

  const resetScanner = () => {
    setPhoto(null);
    setShowFoodSelection(false);
    setSelectedFoods([]);
    setCustomPortion({});
    setEstimatedCalories(0);
    setDetectedFoods([]);
    setShowManualAdd(false);
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>Chargement des permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={colors.primary} />
        <Text style={styles.title}>Accès à la caméra requis</Text>
        <Text style={styles.subtitle}>
          Pour scanner vos repas et estimer les calories, nous avons besoin d'accéder à votre caméra.
        </Text>
        <Text style={styles.subtitle}>
          {!permission.canAskAgain 
            ? 'Vous avez refusé l\'accès. Veuillez l\'activer dans les paramètres de l\'application.'
            : 'Appuyez sur le bouton ci-dessous pour autoriser l\'accès.'}
        </Text>
        <TouchableOpacity 
          style={[styles.button, isRequestingPermission && styles.buttonDisabled]} 
          onPress={handleRequestPermission}
          disabled={isRequestingPermission || !permission.canAskAgain}
        >
          {isRequestingPermission ? (
            <Text style={styles.buttonText}>Demande en cours...</Text>
          ) : (
            <>
              <Ionicons name="camera" size={20} color={colors.cardBackground} />
              <Text style={styles.buttonText}>Autoriser la caméra</Text>
            </>
          )}
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <Text style={styles.settingsHint}>
            Allez dans Paramètres → Game Changer → Caméra pour activer l'accès
          </Text>
        )}
      </View>
    );
  }

  if (photo && showFoodSelection) {
    return (
      <View style={styles.container}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: photo }} style={styles.previewImage} />
          <TouchableOpacity style={styles.closeButton} onPress={resetScanner}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.foodSelectionContainer}>
          {isRecognizing ? (
            <View style={styles.recognizingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.recognizingText}>Reconnaissance des aliments en cours...</Text>
            </View>
          ) : (
            <>
              {detectedFoods.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>Aliments détectés</Text>
                  <Text style={styles.sectionSubtitle}>
                    Les aliments suivants ont été reconnus automatiquement. Ajustez les portions si nécessaire.
                  </Text>
                  <View style={styles.foodGrid}>
                    {detectedFoods.map((foodName) => {
                      const isSelected = selectedFoods.includes(foodName);
                      const foodData = FOOD_DATABASE[foodName];
                      const portion = customPortion[foodName] || 100;

                      return (
                        <FoodItem
                          key={foodName}
                          foodName={foodName}
                          foodData={foodData}
                          isSelected={isSelected}
                          portion={portion}
                          onToggle={() => toggleFood(foodName)}
                          onPortionChange={(text) => updatePortion(foodName, text)}
                        />
                      );
                    })}
                  </View>
                </>
              ) : (
                <Text style={styles.sectionSubtitle}>
                  Aucun aliment détecté automatiquement. Ajoutez-les manuellement ci-dessous.
                </Text>
              )}

              <View style={styles.manualAddSection}>
                <View style={styles.manualAddHeader}>
                  <Text style={styles.sectionTitle}>
                    {detectedFoods.length > 0 ? 'Ajouter d\'autres aliments' : 'Sélectionnez les aliments visibles'}
                  </Text>
                  <TouchableOpacity
                    style={styles.toggleManualButton}
                    onPress={() => setShowManualAdd(!showManualAdd)}
                  >
                    <Ionicons
                      name={showManualAdd ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={colors.primary}
                    />
                    <Text style={styles.toggleManualText}>
                      {showManualAdd ? 'Masquer' : 'Afficher'} tous les aliments
                    </Text>
                  </TouchableOpacity>
                </View>

                {showManualAdd && (
                  <View style={styles.foodGrid}>
                    {Object.keys(FOOD_DATABASE)
                      .filter((foodName) => !detectedFoods.includes(foodName))
                      .map((foodName) => {
                        const isSelected = selectedFoods.includes(foodName);
                        const foodData = FOOD_DATABASE[foodName];
                        const portion = customPortion[foodName] || 100;

                        return (
                          <FoodItem
                            key={foodName}
                            foodName={foodName}
                            foodData={foodData}
                            isSelected={isSelected}
                            portion={portion}
                            onToggle={() => toggleFood(foodName)}
                            onPortionChange={(text) => updatePortion(foodName, text)}
                          />
                        );
                      })}
                  </View>
                )}
              </View>
            </>
          )}

          <CaloriesSummary
            selectedFoods={selectedFoods}
            customPortion={customPortion}
          />

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={resetScanner}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.addButton,
                estimatedCalories === 0 && styles.addButtonDisabled,
              ]}
              onPress={handleAddCalories}
              disabled={estimatedCalories === 0}
            >
              <Ionicons name="add-circle" size={20} color={colors.cardBackground} />
              <Text style={styles.addButtonText}>
                Ajouter {estimatedCalories} kcal
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.instructionText}>
            Placez votre repas dans le cadre
          </Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={30} color={colors.text} />
            <Text style={styles.controlButtonText}>Galerie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() =>
              setFacing(facing === 'back' ? 'front' : 'back')
            }
          >
            <Ionicons name="camera-reverse-outline" size={30} color={colors.text} />
            <Text style={styles.controlButtonText}>Retourner</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  text: {
    color: colors.text,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 200,
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingsHint: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 40,
    fontStyle: 'italic',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 300,
    height: 300,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    color: colors.text,
    fontSize: 16,
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    color: colors.text,
    fontSize: 12,
    marginTop: 5,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.cardBackground,
    borderWidth: 4,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
  },
  imageContainer: {
    position: 'relative',
    height: 300,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
  },
  foodSelectionContainer: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  foodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
  addButton: {
    backgroundColor: colors.primary,
  },
  addButtonDisabled: {
    backgroundColor: colors.textTertiary,
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  recognizingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  recognizingText: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  manualAddSection: {
    marginTop: 20,
  },
  manualAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleManualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 8,
  },
  toggleManualText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});

