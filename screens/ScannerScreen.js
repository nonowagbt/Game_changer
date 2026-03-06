import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  TextInput,
  FlatList,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { updateDailyProgress, getDailyProgress } from '../utils/db';
import { colors } from '../theme/colors';
import { FOOD_DATABASE } from '../data/foodDatabase';
import FoodItem from '../components/FoodItem';
import CaloriesSummary, { calculateTotalCalories } from '../components/CaloriesSummary';
import { recognizeFoods } from '../utils/imageRecognition';
import { ActivityIndicator } from 'react-native';
import { useLanguage } from '../contexts/LanguageContext';

// Liste complète des aliments pour la recherche
const ALL_FOODS = Object.keys(FOOD_DATABASE);

export default function ScannerScreen() {
  const { t, language } = useLanguage();
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
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);

  // --- État pour le modal de remplacement ---
  const [replaceModalVisible, setReplaceModalVisible] = useState(false);
  const [foodToReplace, setFoodToReplace] = useState(null); // nom de l'aliment à remplacer
  const [searchQuery, setSearchQuery] = useState('');

  const cameraRef = useRef(null);

  // -------------------------------------------------------
  // FIX CAMÉRA : activer/désactiver à chaque changement de focus
  // -------------------------------------------------------
  useFocusEffect(
    useCallback(() => {
      // Quand l'écran prend le focus → on active la caméra
      setCameraActive(true);
      setCameraReady(false);

      return () => {
        // Quand l'écran perd le focus → on désactive la caméra
        setCameraActive(false);
        setCameraReady(false);
      };
    }, [])
  );

  // Mise à jour des calories totales dès que la sélection change
  React.useEffect(() => {
    const total = calculateTotalCalories(selectedFoods, customPortion);
    setEstimatedCalories(total);
  }, [selectedFoods, customPortion]);

  // -------------------------------------------------------
  // Permissions
  // -------------------------------------------------------
  const handleRequestPermission = async () => {
    setIsRequestingPermission(true);
    try {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission refusée',
          "L'accès à la caméra est nécessaire pour scanner vos repas. Vous pouvez l'activer dans les paramètres de l'application.",
          [{ text: 'OK', style: 'default' }]
        );
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de demander la permission de la caméra');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  // -------------------------------------------------------
  // Prise de photo
  // -------------------------------------------------------
  const takePicture = async () => {
    if (isTakingPicture || !cameraRef.current || !cameraReady) return;

    setIsTakingPicture(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo && photo.uri) {
        setPhoto(photo.uri);
        setShowFoodSelection(true);
        setSelectedFoods([]);
        setCustomPortion({});
        setDetectedFoods([]);
        setShowManualAdd(false);
        await recognizeFoodsInImage(photo.uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Veuillez réessayer.');
    } finally {
      setTimeout(() => setIsTakingPicture(false), 500);
    }
  };

  // -------------------------------------------------------
  // Galerie
  // -------------------------------------------------------
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Nous avons besoin de la permission pour accéder à vos photos");
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
      await recognizeFoodsInImage(result.assets[0].uri);
    }
  };

  // -------------------------------------------------------
  // Sélection / Déselection d'un aliment
  // -------------------------------------------------------
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

  // -------------------------------------------------------
  // Ajouter les calories
  // -------------------------------------------------------
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
      Alert.alert('Erreur', "Impossible d'ajouter les calories");
    }
  };

  // -------------------------------------------------------
  // Reconnaissance IA
  // -------------------------------------------------------
  const recognizeFoodsInImage = async (imageUri) => {
    setIsRecognizing(true);
    try {
      const detected = await recognizeFoods(imageUri);
      setDetectedFoods(detected);

      if (detected.length > 0) {
        setSelectedFoods(detected);
        const portions = {};
        detected.forEach((food) => { portions[food] = 100; });
        setCustomPortion(portions);
      }
    } catch (error) {
      console.error('Erreur lors de la reconnaissance:', error);
    } finally {
      setIsRecognizing(false);
    }
  };

  // -------------------------------------------------------
  // Réinitialiser le scanner → retour caméra
  // -------------------------------------------------------
  const resetScanner = () => {
    setPhoto(null);
    setShowFoodSelection(false);
    setSelectedFoods([]);
    setCustomPortion({});
    setEstimatedCalories(0);
    setDetectedFoods([]);
    setShowManualAdd(false);
    setIsTakingPicture(false);
    setCameraReady(false);
  };

  // -------------------------------------------------------
  // Modal de remplacement d'aliment
  // -------------------------------------------------------
  const openReplaceModal = (foodName) => {
    setFoodToReplace(foodName);
    setSearchQuery('');
    setReplaceModalVisible(true);
  };

  const handleReplaceFood = (newFoodName) => {
    if (!foodToReplace || newFoodName === foodToReplace) {
      setReplaceModalVisible(false);
      return;
    }

    // Remplacer dans detectedFoods
    setDetectedFoods((prev) =>
      prev.map((f) => (f === foodToReplace ? newFoodName : f))
    );

    // Remplacer dans selectedFoods si l'ancien était sélectionné
    setSelectedFoods((prev) => {
      const wasSelected = prev.includes(foodToReplace);
      const without = prev.filter((f) => f !== foodToReplace);
      return wasSelected ? [...without, newFoodName] : without;
    });

    // Transférer la portion de l'ancien vers le nouveau
    setCustomPortion((prev) => {
      const newPortion = { ...prev };
      if (newPortion[foodToReplace] !== undefined) {
        newPortion[newFoodName] = newPortion[foodToReplace];
        delete newPortion[foodToReplace];
      }
      return newPortion;
    });

    setReplaceModalVisible(false);
    setFoodToReplace(null);
  };

  // Filtrer les aliments selon la recherche
  const filteredFoods = ALL_FOODS.filter((name) =>
    name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    name !== foodToReplace
  );

  // -------------------------------------------------------
  // RENDU : Permission requise
  // -------------------------------------------------------
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.text}>{language === 'fr' ? 'Chargement des permissions...' : language === 'en' ? 'Loading permissions...' : 'Cargando permisos...'}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={colors.primary} />
        <Text style={styles.title}>{language === 'fr' ? 'Accès à la caméra requis' : language === 'en' ? 'Camera access required' : 'Acceso a la cámara requerido'}</Text>
        <Text style={styles.subtitle}>
          {language === 'fr' ? "Pour scanner vos repas et estimer les calories, nous avons besoin d'accéder à votre caméra." : language === 'en' ? 'To scan your meals and estimate calories, we need to access your camera.' : 'Para escanear tus comidas y estimar las calorías, necesitamos acceder a tu cámara.'}
        </Text>
        <Text style={styles.subtitle}>
          {!permission.canAskAgain
            ? (language === 'fr' ? "Vous avez refusé l'accès. Veuillez l'activer dans les paramètres de l'application." : language === 'en' ? 'You have denied access. Please enable it in the app settings.' : 'Has denegado el acceso. Por favor apruébalo en los ajustes de la aplicación.')
            : (language === 'fr' ? "Appuyez sur le bouton ci-dessous pour autoriser l'accès." : language === 'en' ? 'Tap the button below to allow access.' : 'Presiona el botón de abajo para permitir el acceso.')}
        </Text>
        <TouchableOpacity
          style={[styles.button, isRequestingPermission && styles.buttonDisabled]}
          onPress={handleRequestPermission}
          disabled={isRequestingPermission || !permission.canAskAgain}
        >
          {isRequestingPermission ? (
            <Text style={styles.buttonText}>{language === 'fr' ? 'Demande en cours...' : language === 'en' ? 'Requesting...' : 'Solicitando...'}</Text>
          ) : (
            <>
              <Ionicons name="camera" size={20} color={colors.cardBackground} />
              <Text style={styles.buttonText}>{language === 'fr' ? 'Autoriser la caméra' : language === 'en' ? 'Allow camera' : 'Permitir cámara'}</Text>
            </>
          )}
        </TouchableOpacity>
        {!permission.canAskAgain && (
          <Text style={styles.settingsHint}>
            {language === 'fr' ? "Allez dans Paramètres → Game Changer → Caméra pour activer l'accès" : language === 'en' ? 'Go to Settings → Game Changer → Camera to enable access' : 'Ve a Ajustes → Game Changer → Cámara para habilitar el acceso'}
          </Text>
        )}
      </View>
    );
  }

  // -------------------------------------------------------
  // RENDU : Sélection d'aliments après photo
  // -------------------------------------------------------
  if (photo && showFoodSelection) {
    return (
      <View style={styles.container}>
        {/* Modal de remplacement d'aliment */}
        <Modal
          visible={replaceModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReplaceModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{language === 'fr' ? "Changer l'aliment" : language === 'en' ? 'Change food' : 'Cambiar alimento'}</Text>
                <TouchableOpacity
                  onPress={() => setReplaceModalVisible(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {language === 'fr' ? 'Remplacer ' : language === 'en' ? 'Replace ' : 'Reemplazar '}
                <Text style={styles.modalFoodName}>"{foodToReplace}"</Text>
                {language === 'fr' ? ' par :' : language === 'en' ? ' with:' : ' con:'}
              </Text>

              {/* Barre de recherche */}
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={language === 'fr' ? 'Rechercher un aliment...' : language === 'en' ? 'Search for food...' : 'Buscar alimento...'}
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoFocus={true}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Liste filtrée */}
              <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item}
                style={styles.foodList}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.foodListItem}
                    onPress={() => handleReplaceFood(item)}
                  >
                    <Text style={styles.foodListIcon}>{FOOD_DATABASE[item]?.icon || '🍽️'}</Text>
                    <View style={styles.foodListInfo}>
                      <Text style={styles.foodListName}>{item}</Text>
                      <Text style={styles.foodListCalories}>
                        {FOOD_DATABASE[item]?.calories ?? '?'} kcal/100g
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.noResultText}>{language === 'fr' ? 'Aucun aliment trouvé' : language === 'en' ? 'No food found' : 'Ningún alimento encontrado'}</Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Aperçu de la photo */}
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
              <Text style={styles.recognizingText}>
                {language === 'fr' ? 'Reconnaissance des aliments en cours...' : language === 'en' ? 'Recognizing foods...' : 'Reconociendo alimentos...'}
              </Text>
            </View>
          ) : (
            <>
              {detectedFoods.length > 0 ? (
                <>
                  <Text style={styles.sectionTitle}>{language === 'fr' ? 'Aliments détectés' : language === 'en' ? 'Detected foods' : 'Alimentos detectados'}</Text>
                  <Text style={styles.sectionSubtitle}>
                    {language === 'fr' ? "Les aliments suivants ont été reconnus automatiquement. Appuyez sur ✏️ Changer si l'identification est incorrecte." : language === 'en' ? "The following foods were recognized automatically. Tap ✏️ Change if the identification is incorrect." : "Los siguientes alimentos fueron reconocidos automáticamente. Toca ✏️ Cambiar si la identificación es incorrecta."}
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
                          onReplace={() => openReplaceModal(foodName)}
                        />
                      );
                    })}
                  </View>
                </>
              ) : (
                <Text style={styles.sectionSubtitle}>
                  {language === 'fr' ? 'Aucun aliment détecté automatiquement. Ajoutez-les manuellement ci-dessous.' : language === 'en' ? 'No food detected automatically. Add them manually below.' : 'Ningún alimento detectado automáticamente. Añádelos manualmente a continuación.'}
                </Text>
              )}

              <View style={styles.manualAddSection}>
                <View style={styles.manualAddHeader}>
                  <Text style={styles.sectionTitle}>
                    {detectedFoods.length > 0
                      ? (language === 'fr' ? "Ajouter d'autres aliments" : language === 'en' ? 'Add other foods' : 'Añadir otros alimentos')
                      : (language === 'fr' ? 'Sélectionnez les aliments visibles' : language === 'en' ? 'Select visible foods' : 'Selecciona los alimentos visibles')}
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
                      {showManualAdd
                        ? (language === 'fr' ? 'Masquer' : language === 'en' ? 'Hide' : 'Ocultar')
                        : (language === 'fr' ? 'Afficher' : language === 'en' ? 'Show' : 'Mostrar')
                      }
                      {language === 'fr' ? ' tous les aliments' : language === 'en' ? ' all foods' : ' todos los alimentos'}
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
                          // Pas de onReplace pour les aliments ajoutés manuellement
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
              <Text style={styles.cancelButtonText}>{language === 'fr' ? 'Annuler' : language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
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
                {language === 'fr' ? 'Ajouter ' : language === 'en' ? 'Add ' : 'Añadir '} {estimatedCalories} kcal
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------
  // RENDU : Caméra
  // -------------------------------------------------------
  return (
    <View style={styles.container}>
      {cameraActive && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onCameraReady={() => setCameraReady(true)}
          onMountError={(error) => {
            console.error('Erreur de montage de la caméra:', error);
            setCameraReady(false);
            Alert.alert('Erreur', "Impossible d'initialiser la caméra. Veuillez réessayer.");
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.instructionText}>
              {language === 'fr' ? 'Placez votre repas dans le cadre' : language === 'en' ? 'Place your meal in the frame' : 'Coloca tu comida en el marco'}
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.controlButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={30} color={colors.text} />
              <Text style={styles.controlButtonText}>{language === 'fr' ? 'Galerie' : language === 'en' ? 'Gallery' : 'Galería'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                (isTakingPicture || !cameraReady) && styles.captureButtonDisabled,
              ]}
              onPress={takePicture}
              disabled={isTakingPicture || !cameraReady}
            >
              <View style={styles.captureButtonInner} />
              {isTakingPicture && (
                <View style={styles.captureButtonLoading}>
                  <ActivityIndicator size="small" color={colors.cardBackground} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <Ionicons name="camera-reverse-outline" size={30} color={colors.text} />
              <Text style={styles.controlButtonText}>{language === 'fr' ? 'Retourner' : language === 'en' ? 'Flip' : 'Girar'}</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}

      {/* Indicateur si la caméra n'est pas encore prête */}
      {cameraActive && !cameraReady && (
        <View style={styles.cameraLoadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.cameraLoadingText}>
            {language === 'fr' ? 'Démarrage de la caméra...' : language === 'en' ? 'Starting camera...' : 'Iniciando cámara...'}
          </Text>
        </View>
      )}
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
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonLoading: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraLoadingText: {
    color: colors.textSecondary,
    marginTop: 15,
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 260,
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
    lineHeight: 20,
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

  // --- Modal de remplacement ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  modalFoodName: {
    color: colors.primary,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  },
  foodList: {
    flexGrow: 0,
  },
  foodListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  foodListIcon: {
    fontSize: 28,
  },
  foodListInfo: {
    flex: 1,
  },
  foodListName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  foodListCalories: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  noResultText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 15,
    paddingVertical: 30,
  },
});
