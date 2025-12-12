import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';
import InfoScreen from './screens/InfoScreen';
import SettingsScreen from './screens/SettingsScreen';
import ScannerScreen from './screens/ScannerScreen';
import FriendsScreen from './screens/FriendsScreen';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import { getCurrentUser } from './utils/auth';
import { colors } from './theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Stack pour l'écran Informations (permet de naviguer vers Réglages)
function InfoStack({ refreshAuth }) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="InfoMain">
        {(props) => <InfoScreen {...props} refreshAuth={refreshAuth} />}
      </Stack.Screen>
      <Stack.Screen 
        name="Settings" 
        options={{
          headerShown: false,
        }}
      >
        {(props) => <SettingsScreen {...props} refreshAuth={refreshAuth} />}
      </Stack.Screen>
    </Stack.Navigator>
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
  const [authKey, setAuthKey] = useState(0); // Clé pour forcer le rafraîchissement

  useEffect(() => {
    checkAuth();
  }, [authKey]);

  const checkAuth = async () => {
    try {
      // Timeout de 3 secondes pour éviter que l'app reste bloquée
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 3000)
      );
      
      const userPromise = getCurrentUser();
      const user = await Promise.race([userPromise, timeoutPromise]);
      setIsAuthenticated(!!user);
    } catch (error) {
      // En cas d'erreur ou timeout, considérer comme non authentifié
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour forcer le rafraîchissement de l'authentification (appelée après déconnexion)
  const refreshAuth = () => {
    setAuthKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {isAuthenticated ? (
        <MainTabs refreshAuth={refreshAuth} />
      ) : (
        <AuthScreen onAuthChange={refreshAuth} />
      )}
    </NavigationContainer>
  );
}

function MainTabs({ refreshAuth }) {
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
      <Tab.Screen name="Informations">
        {(props) => <InfoStack {...props} refreshAuth={refreshAuth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

