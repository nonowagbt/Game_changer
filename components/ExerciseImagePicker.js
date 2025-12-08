import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';
import { EXERCISE_DATABASE, searchExercises } from '../data/exerciseDatabase';

export default function ExerciseImagePicker({ imageUri, onImageSelected, onImageRemoved, exerciseName, onExerciseNameSelected }) {
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState(null);

  const handlePickImage = async () => {
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

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à votre caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const handleSelectFromDatabase = () => {
    setShowExercisePicker(true);
  };

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise);
    // Utiliser l'emoji comme image (on pourrait aussi utiliser une URL d'image)
    // Pour l'instant, on stocke l'info de l'exercice et l'emoji
    onImageSelected(`exercise:${exercise.name}:${exercise.image}`);
    // Si une fonction de callback est fournie, mettre à jour le nom de l'exercice
    if (onExerciseNameSelected) {
      onExerciseNameSelected(exercise.name);
    }
    setShowExercisePicker(false);
    setSearchQuery('');
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Ajouter une photo',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Choisir depuis la base de données', onPress: handleSelectFromDatabase },
        { text: 'Prendre une photo', onPress: handleTakePhoto },
        { text: 'Choisir depuis la galerie', onPress: handlePickImage },
        imageUri ? { text: 'Supprimer', onPress: onImageRemoved, style: 'destructive' } : null,
      ].filter(Boolean)
    );
  };

  const isExerciseFromDB = imageUri && imageUri.startsWith('exercise:');
  const exerciseData = isExerciseFromDB ? imageUri.split(':') : null;
  const exerciseEmoji = exerciseData ? exerciseData[2] : null;

  const filteredExercises = searchQuery
    ? searchExercises(searchQuery)
    : Object.keys(EXERCISE_DATABASE).map(name => ({
        name,
        ...EXERCISE_DATABASE[name],
      }));

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo de l'exercice</Text>
      {imageUri ? (
        <View style={styles.imagePreviewContainer}>
          {isExerciseFromDB ? (
            <View style={styles.exerciseEmojiContainer}>
              <Text style={styles.exerciseEmoji}>{exerciseEmoji}</Text>
              <Text style={styles.exerciseName}>{exerciseData[1]}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
            />
          )}
          <TouchableOpacity
            style={styles.removeImageButton}
            onPress={onImageRemoved}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.imagePickerButton}
          onPress={showImagePickerOptions}
        >
          <Ionicons name="camera-outline" size={24} color={colors.primary} />
          <Text style={styles.imagePickerButtonText}>
            Ajouter une photo
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showExercisePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un exercice</Text>
              <TouchableOpacity
                onPress={() => setShowExercisePicker(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un exercice..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={styles.exercisesList}>
              {filteredExercises.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aucun exercice trouvé</Text>
                </View>
              ) : (
                filteredExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.name}
                    style={styles.exerciseOption}
                    onPress={() => handleSelectExercise(exercise)}
                  >
                    <Text style={styles.exerciseEmojiLarge}>{exercise.image}</Text>
                    <View style={styles.exerciseOptionInfo}>
                      <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                      <Text style={styles.exerciseOptionCategory}>{exercise.category}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: 10,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  exerciseEmojiContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  exerciseEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 15,
    padding: 5,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.background,
    marginTop: 10,
  },
  imagePickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    margin: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  exercisesList: {
    paddingHorizontal: 15,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exerciseEmojiLarge: {
    fontSize: 40,
    marginRight: 15,
  },
  exerciseOptionInfo: {
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  exerciseOptionCategory: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
});
