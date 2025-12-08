# Configuration de la Reconnaissance d'Images

## Vue d'ensemble

Le scanner de repas utilise un service de reconnaissance d'images pour identifier automatiquement les aliments dans vos photos. Par défaut, une version de test est activée pour démontrer le fonctionnement de l'interface.

## Mode Test (Actuel)

Le mode test est actuellement activé (`ENABLE_TEST_MODE = true` dans `utils/imageRecognition.js`). Il simule la détection de quelques aliments communs pour tester l'interface utilisateur.

## Configuration d'une Vraie API de Reconnaissance

Pour utiliser une vraie reconnaissance d'images, vous avez plusieurs options:

### Option 1: Google Cloud Vision API (Recommandé)

1. **Créer un projet Google Cloud**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un nouveau projet ou sélectionnez un projet existant

2. **Activer l'API Vision**
   - Dans la console, allez dans "APIs & Services" > "Library"
   - Recherchez "Cloud Vision API"
   - Cliquez sur "Enable"

3. **Créer une clé API**
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "API Key"
   - Copiez la clé API générée

4. **Installer expo-file-system**
   ```bash
   npx expo install expo-file-system
   ```

5. **Configurer la clé API**
   - Ouvrez `utils/imageRecognition.js`
   - Remplacez `GOOGLE_VISION_API_KEY = null` par votre clé API
   - Décommentez le code dans `recognizeWithGoogleVision`
   - Importez `expo-file-system` en haut du fichier

### Option 2: Clarifai Food Model

1. **Créer un compte Clarifai**
   - Allez sur [Clarifai](https://www.clarifai.com/)
   - Créez un compte gratuit

2. **Obtenir votre clé API**
   - Dans votre dashboard, allez dans "Applications"
   - Créez une nouvelle application ou sélectionnez-en une
   - Copiez votre "API Key"

3. **Installer les dépendances nécessaires**
   ```bash
   npm install clarifai
   ```

4. **Modifier `utils/imageRecognition.js`**
   - Ajoutez une fonction `recognizeWithClarifai` similaire à `recognizeWithGoogleVision`
   - Utilisez le modèle "food-item-recognition" de Clarifai

### Option 3: Autre API

Vous pouvez intégrer n'importe quelle API de reconnaissance d'images en:
1. Créant une fonction similaire à `recognizeWithGoogleVision`
2. L'appelant dans `recognizeFoods` avant le fallback

## Désactiver le Mode Test

Pour désactiver la simulation et utiliser uniquement une vraie API:

1. Ouvrez `utils/imageRecognition.js`
2. Changez `ENABLE_TEST_MODE = false`
3. Assurez-vous qu'une vraie API est configurée (Google Vision, Clarifai, etc.)

## Notes

- Le mode test est utile pour développer et tester l'interface sans avoir besoin d'une API
- Pour la production, vous devriez utiliser une vraie API de reconnaissance d'images
- Les APIs de reconnaissance d'images peuvent avoir des limites de requêtes gratuites
- Assurez-vous de gérer les erreurs et les cas où aucune détection n'est trouvée

