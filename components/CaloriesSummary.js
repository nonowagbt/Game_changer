import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FOOD_DATABASE } from '../data/foodDatabase';
import { colors } from '../theme/colors';

export function calculateTotalCalories(selectedFoods, customPortion) {
  let total = 0;
  selectedFoods.forEach((foodName) => {
    const portion = customPortion[foodName] || 100;
    const foodData = FOOD_DATABASE[foodName];
    if (foodData) {
      total += Math.round((foodData.calories * portion) / 100);
    }
  });
  return total;
}

export default function CaloriesSummary({ selectedFoods, customPortion }) {
  const totalCalories = calculateTotalCalories(selectedFoods, customPortion);

  if (selectedFoods.length === 0) {
    return null;
  }

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Résumé</Text>
      {selectedFoods.map((foodName) => {
        const portion = customPortion[foodName] || 100;
        const foodData = FOOD_DATABASE[foodName];
        const calories = Math.round((foodData.calories * portion) / 100);
        return (
          <View key={foodName} style={styles.summaryItem}>
            <Text style={styles.summaryFood}>
              {foodData.icon} {foodName} ({portion}g)
            </Text>
            <Text style={styles.summaryCalories}>{calories} kcal</Text>
          </View>
        );
      })}
      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total estimé:</Text>
        <Text style={styles.totalCalories}>{totalCalories} kcal</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: colors.cardBackground,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryFood: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  summaryCalories: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
});

