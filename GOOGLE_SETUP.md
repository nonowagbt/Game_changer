# Configuration Google Sign-In et Google Fit

## Étapes de configuration

### 1. Créer un projet dans Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Notez l'ID du projet

### 2. Activer les APIs nécessaires

1. Dans Google Cloud Console, allez dans "APIs & Services" > "Library"
2. Activez les APIs suivantes :
   - **Google+ API** (pour l'authentification)
   - **Google Fit API** (pour synchroniser les données de performance)

### 3. Configurer OAuth 2.0

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth client ID"
3. Configurez l'écran de consentement OAuth si ce n'est pas déjà fait
4. Créez un OAuth client ID pour :
   - **Application type**: Web application (pour Expo)
   - **Authorized redirect URIs**: 
     - `https://auth.expo.io/@your-username/game-changer`
     - `game-changer://oauth`
   - Pour iOS : Créez aussi un OAuth client ID de type "iOS"
   - Pour Android : Créez aussi un OAuth client ID de type "Android"

### 4. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet :

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=votre_client_id_web.apps.googleusercontent.com
```

Ou ajoutez dans `app.json` :

```json
{
  "expo": {
    "extra": {
      "googleClientId": "votre_client_id_web.apps.googleusercontent.com"
    }
  }
}
```

### 5. Mettre à jour le code

Dans `utils/auth.js`, remplacez :

```javascript
clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
```

Par :

```javascript
clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || Constants.expoConfig?.extra?.googleClientId || '',
```

Et ajoutez l'import :

```javascript
import Constants from 'expo-constants';
```

### 6. Tester la connexion

1. Lancez l'application
2. Cliquez sur "Continuer avec Google"
3. Autorisez l'application à accéder à vos informations Google
4. Vérifiez que la connexion fonctionne

## Synchronisation avec Google Fit

Une fois connecté avec Google, les données suivantes seront synchronisées :

- **Poids** : Synchronisé automatiquement quand mis à jour
- **Taille** : Synchronisé automatiquement quand mis à jour
- **Entraînements** : Synchronisés automatiquement quand créés
- **Activités** : Synchronisées automatiquement

### Fonctions disponibles

- `syncWeightToGoogleFit(weight, timestamp)` : Synchroniser le poids
- `syncHeightToGoogleFit(height, timestamp)` : Synchroniser la taille
- `syncWorkoutToGoogleFit(workout)` : Synchroniser un entraînement
- `syncAllPerformanceData()` : Synchroniser toutes les données

## Notes importantes

- Les tokens d'accès sont stockés localement dans AsyncStorage
- Les tokens expirent après un certain temps, il faudra implémenter le refresh token
- Pour la production, utilisez des variables d'environnement sécurisées
- Testez bien sur iOS et Android car les configurations OAuth peuvent différer

