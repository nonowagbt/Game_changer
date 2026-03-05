import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function FoodItem({ 
  foodName, 
  foodData, 
  isSelected, 
  portion, 
  onToggle, 
  onPortionChange,
  onReplace,  // Optionnel : si fourni, affiche le bouton "Changer"
}) {
  return (
    <TouchableOpacity
      style={[
        styles.foodItem,
        isSelected && styles.foodItemSelected,
      ]}
      onPress={onToggle}
    >
      <Text style={styles.foodIcon}>{foodData?.icon || '🍽️'}</Text>
      <Text style={styles.foodName}>{foodName}</Text>
      <Text style={styles.foodCalories}>
        {foodData?.calories ?? '?'} kcal/100g
      </Text>
      {isSelected && (
        <View style={styles.portionInput}>
          <Text style={styles.portionLabel}>Portion (g):</Text>
          <TextInput
            style={styles.portionInputField}
            value={portion.toString()}
            onChangeText={onPortionChange}
            keyboardType="numeric"
            placeholder="100"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
      )}
      {/* Bouton Changer — uniquement pour les aliments auto-détectés */}
      {onReplace && (
        <TouchableOpacity
          style={styles.replaceButton}
          onPress={(e) => {
            e.stopPropagation?.();
            onReplace();
          }}
        >
          <Ionicons name="pencil-outline" size={12} color={colors.primary} />
          <Text style={styles.replaceButtonText}>Changer</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    foodItem: {
      width: '48%',
      backgroundColor: colors.cardBackground,
      padding: 15,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
    },
    foodItemSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '20',
    },
    foodIcon: {
      fontSize: 40,
      marginBottom: 5,
    },
    foodName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 5,
    },
    foodCalories: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    portionInput: {
      marginTop: 10,
      width: '100%',
    },
    portionLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    portionInputField: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 5,
      padding: 8,
      color: colors.text,
      fontSize: 14,
    },
    replaceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    replaceButtonText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: '600',
    },
});
