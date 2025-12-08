// utils/imageRecognition.js
// Service de reconnaissance d'images pour identifier les aliments

import { FOOD_DATABASE } from '../data/foodDatabase';

// Mapping des mots-clés d'aliments pour la correspondance
const FOOD_KEYWORDS = {
  'Pomme': ['pomme', 'apple', 'pommes', 'apples'],
  'Banane': ['banane', 'banana', 'bananes', 'bananas'],
  'Orange': ['orange', 'oranges'],
  'Poulet grillé': ['poulet', 'chicken', 'poulet grillé', 'grilled chicken', 'volaille'],
  'Riz cuit': ['riz', 'rice', 'riz cuit', 'cooked rice'],
  'Pâtes cuites': ['pâtes', 'pasta', 'spaghetti', 'macaroni', 'nouilles'],
  'Pain': ['pain', 'bread', 'baguette', 'toast'],
  'Œuf': ['œuf', 'egg', 'eggs', 'œufs', 'omelette'],
  'Salade': ['salade', 'salad', 'lettuce', 'laitue', 'salade verte'],
  'Pizza': ['pizza', 'pizzas'],
  'Burger': ['burger', 'hamburger', 'cheeseburger', 'sandwich burger'],
  'Frites': ['frites', 'fries', 'french fries', 'pommes frites'],
  'Poisson': ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna'],
  'Fromage': ['fromage', 'cheese', 'cheddar', 'mozzarella'],
  'Yaourt': ['yaourt', 'yogurt', 'yoghurt', 'yogourt'],
  'Légumes': ['légumes', 'vegetables', 'carotte', 'carrot', 'brocoli', 'broccoli', 'tomate', 'tomato'],
  'Fruits': ['fruits', 'fruit', 'fraise', 'strawberry', 'raisin', 'grape'],
  'Viande': ['viande', 'meat', 'bœuf', 'beef', 'porc', 'pork', 'steak'],
  'Soupe': ['soupe', 'soup', 'potage'],
  'Sandwich': ['sandwich', 'sandwiches', 'panini'],
};

// Configuration pour Google Cloud Vision API (optionnel)
// Pour utiliser cette API, vous devez:
// 1. Créer un projet Google Cloud
// 2. Activer l'API Vision
// 3. Créer une clé API
// 4. Définir GOOGLE_VISION_API_KEY dans votre config
const GOOGLE_VISION_API_KEY = null; // Remplacez par votre clé API si vous voulez utiliser Google Vision

/**
 * Reconnaît les aliments dans une image en utilisant Google Cloud Vision API
 * NOTE: Pour utiliser cette fonction, vous devez:
 * 1. Installer expo-file-system: npx expo install expo-file-system
 * 2. Créer un projet Google Cloud et activer l'API Vision
 * 3. Créer une clé API et la définir dans GOOGLE_VISION_API_KEY
 * 4. Décommenter le code ci-dessous et importer FileSystem
 * 
 * @param {string} imageUri - URI de l'image à analyser
 * @returns {Promise<string[]>} - Liste des noms d'aliments détectés
 */
const recognizeWithGoogleVision = async (imageUri) => {
  if (!GOOGLE_VISION_API_KEY) {
    return [];
  }

  // Pour activer cette fonctionnalité, décommentez le code ci-dessous
  // et installez expo-file-system
  /*
  try {
    const FileSystem = require('expo-file-system');
    // Convertir l'image en base64
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'LABEL_DETECTION',
                  maxResults: 10,
                },
                {
                  type: 'OBJECT_LOCALIZATION',
                  maxResults: 10,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    if (data.responses && data.responses[0]) {
      const labels = data.responses[0].labelAnnotations || [];
      const objects = data.responses[0].localizedObjectAnnotations || [];
      
      // Extraire les labels et objets détectés
      const detectedLabels = [
        ...labels.map((l) => l.description.toLowerCase()),
        ...objects.map((o) => o.name.toLowerCase()),
      ];

      // Correspondre les labels aux aliments de notre base de données
      const matchedFoods = [];
      for (const [foodName, keywords] of Object.entries(FOOD_KEYWORDS)) {
        const found = keywords.some((keyword) =>
          detectedLabels.some((label) => label.includes(keyword.toLowerCase()))
        );
        if (found) {
          matchedFoods.push(foodName);
        }
      }

      return matchedFoods;
    }
  } catch (error) {
    console.error('Erreur lors de la reconnaissance avec Google Vision:', error);
  }
  */

  return [];
};

/**
 * Reconnaissance basique basée sur des mots-clés (fallback)
 * Cette fonction simule une reconnaissance en analysant les métadonnées de l'image
 * Pour une vraie reconnaissance, utilisez recognizeWithGoogleVision avec une API
 * 
 * NOTE: Pour l'instant, cette fonction retourne une liste vide car elle nécessite
 * une vraie API de reconnaissance d'images. Vous pouvez:
 * 1. Utiliser Google Cloud Vision API (voir recognizeWithGoogleVision)
 * 2. Utiliser Clarifai Food Model
 * 3. Utiliser une autre API de reconnaissance d'images
 * 
 * @param {string} imageUri - URI de l'image à analyser
 * @returns {Promise<string[]>} - Liste des noms d'aliments détectés
 */
const recognizeWithKeywords = async (imageUri) => {
  // Pour l'instant, on retourne une liste vide
  // Dans une vraie implémentation, vous analyseriez l'image ici
  // et retourneriez les aliments détectés basés sur les labels de l'API
  
  // Exemple de simulation (à remplacer par une vraie API):
  // Simuler un délai de traitement
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Retourner une liste vide pour l'instant
  // Vous pouvez décommenter les lignes ci-dessous pour tester avec quelques aliments communs
  /*
  // Simulation: retourner quelques aliments communs pour test
  const commonFoods = ['Pizza', 'Burger', 'Frites', 'Salade'];
  return commonFoods.filter(() => Math.random() > 0.5);
  */
  
  return [];
};

/**
 * Mode de test: active la simulation de reconnaissance pour tester l'interface
 * Mettez à false pour désactiver la simulation
 */
const ENABLE_TEST_MODE = true;

/**
 * Fonction principale pour reconnaître les aliments dans une image
 * @param {string} imageUri - URI de l'image à analyser
 * @returns {Promise<string[]>} - Liste des noms d'aliments détectés depuis FOOD_DATABASE
 */
export const recognizeFoods = async (imageUri) => {
  try {
    // Essayer d'abord avec Google Vision API si configuré
    if (GOOGLE_VISION_API_KEY) {
      const foods = await recognizeWithGoogleVision(imageUri);
      if (foods.length > 0) {
        return foods;
      }
    }

    // Fallback: reconnaissance basique
    const foods = await recognizeWithKeywords(imageUri);
    
    // Mode test: simuler la détection de quelques aliments communs
    if (ENABLE_TEST_MODE && foods.length === 0) {
      // Simuler un délai de traitement
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Retourner quelques aliments communs pour tester l'interface
      // Dans une vraie application, vous devriez utiliser une API de reconnaissance d'images
      const testFoods = ['Pizza', 'Burger', 'Frites', 'Salade'];
      // Retourner 2-3 aliments aléatoires pour la démo
      const shuffled = testFoods.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
    }
    
    return foods;
  } catch (error) {
    console.error('Erreur lors de la reconnaissance des aliments:', error);
    return [];
  }
};

/**
 * Fonction pour trouver des aliments similaires basés sur un terme de recherche
 * @param {string} searchTerm - Terme à rechercher
 * @returns {string[]} - Liste des noms d'aliments correspondants
 */
export const findSimilarFoods = (searchTerm) => {
  const term = searchTerm.toLowerCase();
  const matches = [];

  for (const [foodName, keywords] of Object.entries(FOOD_KEYWORDS)) {
    if (
      foodName.toLowerCase().includes(term) ||
      keywords.some((keyword) => keyword.toLowerCase().includes(term))
    ) {
      matches.push(foodName);
    }
  }

  return matches;
};

