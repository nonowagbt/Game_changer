import AsyncStorage from '@react-native-async-storage/async-storage';
import { mongodbConfig, isMongoConfigured } from '../config/mongodb';

const mongoConfigured = isMongoConfigured();
const STORAGE_KEYS = {
  CURRENT_USER: 'current_user',
  USERS: 'users',
  LAST_EMAIL: 'last_email', // Pour mémoriser l'email même après déconnexion
};

// Fonctions MongoDB pour les utilisateurs
const mongoRequest = async (action, collection, filter = {}, additionalData = {}) => {
  if (!mongoConfigured) {
    throw new Error('MongoDB not configured');
  }

  try {
    const url = `${mongodbConfig.apiUrl}/action/${action}`;
    
    const requestBody = {
      dataSource: mongodbConfig.clusterName,
      database: mongodbConfig.databaseName,
      collection: collection,
      filter,
      ...additionalData,
    };
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': mongodbConfig.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MongoDB API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('MongoDB request error:', error);
    throw error;
  }
};

// Créer un compte
export const signUp = async (userData) => {
  const { email, password, firstName, lastName, phone, weight, height, age, gender } = userData;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    throw new Error('Veuillez remplir tous les champs obligatoires');
  }

  if (password.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  }

  // Vérifier si l'email existe déjà
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new Error('Cet email est déjà utilisé');
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password, // En production, il faudrait hasher le mot de passe
    firstName,
    lastName,
    phone: phone || '',
    weight: weight ? parseFloat(weight) : null,
    height: height ? parseFloat(height) : null,
    age: age ? parseInt(age) : 30,
    gender: gender || 'male',
    createdAt: new Date().toISOString(),
  };

  if (mongoConfigured) {
    try {
      await mongoRequest('insertOne', 'users', {}, {
        document: user,
      });
    } catch (error) {
      console.error('Error saving user to MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      users.push(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  } else {
    // AsyncStorage
    const users = await getUsers();
    users.push(user);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  // Sauvegarder les informations utilisateur
  await saveUserInfoFromSignup(user);

  // Connecter l'utilisateur
  await setCurrentUser(user);
  return user;
};

// Se connecter
export const signIn = async (email, password, rememberMe = true) => {
  const user = await getUserByEmail(email);

  if (!user) {
    throw new Error('Email ou mot de passe incorrect');
  }

  if (user.password !== password) {
    throw new Error('Email ou mot de passe incorrect');
  }

  // Sauvegarder l'email pour le pré-remplir même après déconnexion (seulement si "Se rappeler de moi" est coché)
  if (rememberMe) {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
  } else {
    // Supprimer l'email mémorisé si l'utilisateur ne veut pas être rappelé
    await AsyncStorage.removeItem(STORAGE_KEYS.LAST_EMAIL);
  }
  
  await setCurrentUser(user);
  return user;
};

// Se déconnecter
export const signOut = async () => {
  await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
};

// Obtenir l'utilisateur actuel
export const getCurrentUser = async () => {
  try {
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    return null;
  }
};

// Obtenir le dernier email utilisé (pour pré-remplir le champ)
export const getLastEmail = async () => {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.LAST_EMAIL);
  } catch (error) {
    return null;
  }
};

// Définir l'utilisateur actuel
const setCurrentUser = async (user) => {
  // Ne pas stocker le mot de passe dans current_user
  const { password, ...userWithoutPassword } = user;
  await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
};

// Obtenir un utilisateur par email
const getUserByEmail = async (email) => {
  if (mongoConfigured) {
    try {
      const result = await mongoRequest('findOne', 'users', { email });
      return result.document || null;
    } catch (error) {
      console.error('Error getting user from MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      return users.find(u => u.email === email) || null;
    }
  } else {
    const users = await getUsers();
    return users.find(u => u.email === email) || null;
  }
};

// Obtenir tous les utilisateurs (pour AsyncStorage)
const getUsers = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// Sauvegarder les informations utilisateur après la création de compte
const saveUserInfoFromSignup = async (user) => {
  // Import dynamique pour éviter les dépendances circulaires
  const dbModule = await import('./db');
  const { saveUserInfo } = dbModule;
  
  const userInfo = {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    weight: user.weight,
    height: user.height,
    age: user.age,
    gender: user.gender,
  };

  await saveUserInfo(userInfo);
};

