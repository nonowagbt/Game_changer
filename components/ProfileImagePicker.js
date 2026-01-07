import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../theme/colors';

export default function ProfileImagePicker({ imageUri, onImageSelected, onImageRemoved }) {
  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Nous avons besoin de la permission pour accéder à vos photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Photo carrée pour le profil
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
      aspect: [1, 1], // Photo carrée pour le profil
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Photo de profil',
      'Choisissez une option',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Prendre une photo', onPress: handleTakePhoto },
        { text: 'Choisir depuis la galerie', onPress: handlePickImage },
        imageUri ? { text: 'Supprimer', onPress: onImageRemoved, style: 'destructive' } : null,
      ].filter(Boolean)
    );
  };

  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 15,
    },
    profileImageContainer: {
      position: 'relative',
      width: 120,
      height: 120,
      borderRadius: 60,
      overflow: 'hidden',
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.cardBackground,
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    editOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      padding: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderContainer: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.backgroundSecondary,
    },
    cameraIcon: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      backgroundColor: colors.primary,
      borderRadius: 15,
      padding: 5,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Photo de profil</Text>
      <TouchableOpacity
        style={styles.profileImageContainer}
        onPress={showImagePickerOptions}
      >
        {imageUri ? (
          <>
            <Image
              source={{ uri: imageUri }}
              style={styles.profileImage}
            />
            <View style={styles.editOverlay}>
              <Ionicons name="camera" size={24} color={colors.text} />
            </View>
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Ionicons name="person" size={50} color={colors.textSecondary} />
            <Ionicons 
              name="camera" 
              size={20} 
              color={colors.primary} 
              style={styles.cameraIcon}
            />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

