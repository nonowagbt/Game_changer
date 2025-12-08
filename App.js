import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import InfoScreen from './screens/InfoScreen';
import { colors } from './theme/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Accueil') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Entraînements') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'Informations') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.cardBackground,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          headerStyle: {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.text,
          },
        })}
      >
        <Tab.Screen name="Accueil" component={HomeScreen} />
        <Tab.Screen name="Entraînements" component={WorkoutScreen} />
        <Tab.Screen name="Informations" component={InfoScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

