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
  const { email, password, firstName, lastName, username, phone, weight, height, age, gender } = userData;

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

  // Vérifier si le username existe déjà (si fourni)
  if (username && username.trim()) {
    const existingUsername = await getUserByUsername(username.trim());
    if (existingUsername) {
      throw new Error('Ce username est déjà utilisé');
    }
  }

  const user = {
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email,
    password, // En production, il faudrait hasher le mot de passe
    firstName,
    lastName,
    username: username ? username.trim() : null,
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

// Normaliser un numéro de téléphone pour la comparaison
const normalizePhone = (phone) => {
  if (!phone) return '';
  // Supprimer tous les caractères non numériques sauf le + au début
  let normalized = phone.trim();
  // Garder le + s'il est au début, sinon le supprimer
  const hasPlus = normalized.startsWith('+');
  normalized = normalized.replace(/[^\d]/g, '');
  return hasPlus ? '+' + normalized : normalized;
};

// Obtenir un utilisateur par numéro de téléphone
export const getUserByPhone = async (phone) => {
  if (!phone) return null;
  
  // Normaliser le numéro de téléphone pour la comparaison
  const normalizedPhone = normalizePhone(phone);
  const phoneWithoutPlus = normalizedPhone.replace(/^\+/, '');
  
  if (mongoConfigured) {
    try {
      // Chercher avec différentes variantes du numéro
      const result = await mongoRequest('findOne', 'users', {
        $or: [
          { phone: phone },
          { phone: normalizedPhone },
          { phone: phoneWithoutPlus }
        ]
      });
      return result.document || null;
    } catch (error) {
      console.error('Error getting user by phone from MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      return users.find(u => {
        if (!u.phone) return false;
        const userPhoneNormalized = normalizePhone(u.phone);
        const userPhoneWithoutPlus = userPhoneNormalized.replace(/^\+/, '');
        return userPhoneNormalized === normalizedPhone || 
               userPhoneWithoutPlus === phoneWithoutPlus ||
               u.phone === phone;
      }) || null;
    }
  } else {
    const users = await getUsers();
    return users.find(u => {
      if (!u.phone) return false;
      const userPhoneNormalized = normalizePhone(u.phone);
      const userPhoneWithoutPlus = userPhoneNormalized.replace(/^\+/, '');
      return userPhoneNormalized === normalizedPhone || 
             userPhoneWithoutPlus === phoneWithoutPlus ||
             u.phone === phone;
    }) || null;
  }
};

// Se connecter avec email, username ou numéro de téléphone
export const signIn = async (identifier, password, rememberMe = true) => {
  if (!identifier || !password) {
    throw new Error('Veuillez remplir tous les champs');
  }

  const identifierTrimmed = identifier.trim();
  let user = null;

  // Stratégie de recherche intelligente : essayer toutes les méthodes possibles
  // pour trouver l'utilisateur, car un username peut contenir des chiffres
  // et un numéro de téléphone peut être stocké de différentes façons
  
  // 1. Si contient @, c'est définitivement un email
  if (identifierTrimmed.includes('@')) {
    user = await getUserByEmail(identifierTrimmed);
  } else {
    // 2. Essayer d'abord par username (priorité car les usernames peuvent contenir des chiffres)
    user = await getUserByUsername(identifierTrimmed);
    
    // 3. Si pas trouvé par username, essayer par téléphone
    // (uniquement si l'identifiant ressemble vraiment à un numéro de téléphone)
    if (!user) {
      const cleaned = identifierTrimmed.replace(/[\s\-\+\(\)]/g, '');
      // Un numéro de téléphone doit avoir au moins 8 chiffres et être principalement numérique
      if (/^[\d\s\-\+\(\)]+$/.test(identifierTrimmed) && cleaned.length >= 8 && /^\d+$/.test(cleaned)) {
        user = await getUserByPhone(identifierTrimmed);
      }
    }
    
    // 4. Si toujours pas trouvé et que ça ressemble à un email sans @, essayer quand même
    // (cas rare mais possible)
    if (!user && identifierTrimmed.includes('.')) {
      user = await getUserByEmail(identifierTrimmed);
    }
  }

  if (!user) {
    throw new Error('Identifiant ou mot de passe incorrect');
  }

  if (user.password !== password) {
    throw new Error('Identifiant ou mot de passe incorrect');
  }

  // Sauvegarder l'identifiant pour le pré-remplir (seulement si c'est un email et "Se rappeler de moi" est coché)
  if (rememberMe && identifierTrimmed.includes('@')) {
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_EMAIL, identifierTrimmed);
  } else if (!rememberMe) {
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
export const getUserByEmail = async (email) => {
  if (!email) return null;
  
  const emailLower = email.toLowerCase().trim();
  
  if (mongoConfigured) {
    try {
      // Recherche insensible à la casse avec regex
      const escapedEmail = emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const result = await mongoRequest('findOne', 'users', { 
        email: { $regex: `^${escapedEmail}$`, $options: 'i' }
      });
      return result.document || null;
    } catch (error) {
      console.error('Error getting user from MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      return users.find(u => u.email && u.email.toLowerCase() === emailLower) || null;
    }
  } else {
    const users = await getUsers();
    return users.find(u => u.email && u.email.toLowerCase() === emailLower) || null;
  }
};

// Obtenir un utilisateur par username
export const getUserByUsername = async (username) => {
  if (!username) return null;
  
  const usernameLower = username.toLowerCase().trim();
  
  if (mongoConfigured) {
    try {
      // Recherche insensible à la casse avec regex
      const escapedUsername = usernameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const result = await mongoRequest('findOne', 'users', { 
        username: { $regex: `^${escapedUsername}$`, $options: 'i' }
      });
      return result.document || null;
    } catch (error) {
      console.error('Error getting user by username from MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      return users.find(u => u.username && u.username.toLowerCase() === usernameLower) || null;
    }
  } else {
    const users = await getUsers();
    return users.find(u => u.username && u.username.toLowerCase() === usernameLower) || null;
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

// Rechercher des utilisateurs (pour la recherche d'amis)
export const searchUsers = async (searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }

  const term = searchTerm.trim().toLowerCase();
  const isEmail = term.includes('@');

  if (mongoConfigured) {
    try {
      // Recherche insensible à la casse avec regex
      const filter = isEmail
        ? { email: { $regex: term, $options: 'i' } }
        : {
            $or: [
              { username: { $regex: term, $options: 'i' } },
              { firstName: { $regex: term, $options: 'i' } },
              { lastName: { $regex: term, $options: 'i' } },
              { email: { $regex: term, $options: 'i' } },
            ],
          };

      const result = await mongoRequest('find', 'users', filter, {
        limit: 20, // Limiter à 20 résultats
      });
      return result.documents || [];
    } catch (error) {
      console.error('Error searching users from MongoDB:', error);
      // Fallback vers AsyncStorage
      const users = await getUsers();
      return filterUsers(users, term, isEmail);
    }
  } else {
    const users = await getUsers();
    return filterUsers(users, term, isEmail);
  }
};

// Filtrer les utilisateurs localement
const filterUsers = (users, term, isEmail) => {
  return users.filter((user) => {
    if (isEmail) {
      return user.email && user.email.toLowerCase().includes(term);
    } else {
      return (
        (user.username && user.username.toLowerCase().includes(term)) ||
        (user.firstName && user.firstName.toLowerCase().includes(term)) ||
        (user.lastName && user.lastName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term))
      );
    }
  }).slice(0, 20); // Limiter à 20 résultats
};

// Sauvegarder les informations utilisateur après la création de compte
const saveUserInfoFromSignup = async (user) => {
  // Import dynamique pour éviter les dépendances circulaires
  const dbModule = await import('./db');
  const { saveUserInfo } = dbModule;
  
  const userInfo = {
    name: `${user.firstName} ${user.lastName}`,
    username: user.username || null,
    email: user.email,
    phone: user.phone,
    weight: user.weight,
    height: user.height,
    age: user.age,
    gender: user.gender,
  };

  await saveUserInfo(userInfo);
};

