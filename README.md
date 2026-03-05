# 🏋️ Game Changer

Application mobile de fitness complète développée avec **React Native** et **Expo**.

## ✨ Fonctionnalités

### 🏠 Accueil
- Tableau de bord quotidien (calories, eau, entraînements)
- Progression visuelle des objectifs du jour
- Historique de présence en salle

### 🏋️ Entraînements
- **Programmes** : création et gestion de programmes personnalisés avec exercices, séries, répétitions et temps de repos
- **Course 🏃** : tracker GPS type Strava — chrono en temps réel, distance (Haversine), vitesse, allure (min/km), calories, pause/reprise, historique des courses

### 📷 Scanner alimentaire
- Scan de repas par photo (IA de reconnaissance d'image)
- Base de données alimentaire intégrée
- Suivi des calories journalières

### 👥 Amis & Chat
- Liste d'amis persistante (AsyncStorage)
- Ami bot intégré "Alex Martin" avec réponses contextuelles
- Chat avec partage de programmes d'entraînement
- Indicateur de frappe et statut en ligne

### 👤 Profil & Mensurations
- Informations personnelles (photo de profil, âge, genre)
- Poids / taille / IMC avec catégorisation adaptée à l'âge
- **Analyse corporelle 📸** : photo + 2 questions → morphologie détectée (Ectomorphe, Mésomorphe, Endomorphe, Sablier, Rectangle, Poire, Pomme) avec points forts, axes d'amélioration et conseils personnalisés
- Objectifs quotidiens (eau, calories, salle)
- Programmes alimentaires (maintien / perte de poids / prise de masse)

### ⚙️ Réglages
- **Thème Dark / Light** (persisté, changement instantané)
- **Utilisateurs bloqués** : gestion et déblocage
- **Notifications locales** : rappel quotidien à 21h si objectifs non atteints
- Profil public / privé
- Changement de mot de passe
- Export des données personnelles

## 🛠️ Stack technique

| Technologie | Usage |
|---|---|
| React Native + Expo | Framework mobile |
| AsyncStorage | Persistance locale |
| expo-location | GPS pour le tracker de course |
| expo-notifications | Notifications locales planifiées |
| expo-image-picker | Photo de profil et analyse corporelle |
| expo-camera | Scanner alimentaire |
| React Navigation | Navigation (tabs + stack) |
| Ionicons | Icônes |

## 🚀 Lancer le projet

```bash
# Installer les dépendances
npm install

# Démarrer Expo
npx expo start
```

Scanner le QR code avec **Expo Go** (iOS) ou un **development build** (Android).

## 📁 Structure du projet

```
├── App.js                    # Point d'entrée, navigation, ThemeProvider
├── app.json                  # Config Expo (permissions iOS/Android)
├── screens/
│   ├── HomeScreen.js         # Tableau de bord
│   ├── WorkoutScreen.js      # Programmes + tracker de course
│   ├── RunningTrackerScreen.js # GPS tracker
│   ├── ScannerScreen.js      # Scanner alimentaire IA
│   ├── FriendsScreen.js      # Liste d'amis
│   ├── ChatScreen.js         # Messagerie
│   ├── InfoScreen.js         # Profil, mensurations, objectifs
│   ├── SettingsScreen.js     # Réglages (thème, notifs, bloqués)
│   ├── LoginScreen.js
│   └── SignUpScreen.js
├── components/
│   ├── BodyAnalysisCard.js   # Analyse morphologique par photo
│   ├── CaloriesSummary.js
│   ├── ExerciseImagePicker.js
│   ├── FoodItem.js
│   └── ProfileImagePicker.js
├── contexts/
│   └── ThemeContext.js       # Thème dynamique dark/light
├── utils/
│   ├── db.js                 # AsyncStorage CRUD (goals, workouts, friends, blocked)
│   ├── notifications.js      # Notifications locales Expo
│   ├── auth.js               # Authentification
│   ├── goalCalculator.js     # Calcul des objectifs caloriques/eau
│   ├── imageRecognition.js   # IA reconnaissance alimentaire
│   └── storage.js
├── theme/
│   └── colors.js             # Palettes dark/light (objet mutable)
└── data/
    ├── foodDatabase.js
    └── exerciseDatabase.js
```

## 📱 Compatibilité

| Plateforme | Statut |
|---|---|
| iOS (Expo Go) | ✅ Complet |
| Android (dev build) | ✅ Recommandé |
| Android (Expo Go) | ⚠️ Notifications limitées (SDK 53+) |
