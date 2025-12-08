import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import InfoScreen from './screens/InfoScreen';
import ScannerScreen from './screens/ScannerScreen';
import FriendsScreen from './screens/FriendsScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import { colors } from './theme/colors';
import { getCurrentUser } from './utils/auth';

const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Accueil') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Entraînements') {
              iconName = focused ? 'barbell' : 'barbell-outline';
            } else if (route.name === 'Scanner') {
              iconName = focused ? 'camera' : 'camera-outline';
            } else if (route.name === 'Amis') {
              iconName = focused ? 'people' : 'people-outline';
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
      <Tab.Screen name="Scanner" component={ScannerScreen} />
      <Tab.Screen name="Amis" component={FriendsScreen} />
      <Tab.Screen name="Informations" component={InfoScreen} />
    </Tab.Navigator>
  );
}

function AuthScreen({ onAuthChange }) {
  const [showSignUp, setShowSignUp] = useState(false);

  if (showSignUp) {
    return <SignUpScreen onSignUp={onAuthChange} onBack={() => setShowSignUp(false)} />;
  }

  return <LoginScreen onLogin={onAuthChange} onSignUp={() => setShowSignUp(true)} />;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const user = await getCurrentUser();
      setIsAuthenticated(!!user);
    } catch (error) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Re-vérifier l'authentification périodiquement
  useEffect(() => {
    const interval = setInterval(() => {
      checkAuth();
    }, 2000); // Vérifier toutes les 2 secondes

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? (
        <MainTabs />
      ) : (
        <AuthScreen onAuthChange={checkAuth} />
      )}
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

