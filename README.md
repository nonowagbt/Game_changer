# Game Changer

Application mobile de suivi fitness et nutrition développée avec React Native et Expo.

## Fonctionnalités

### 🔐 Authentification
- **Création de compte** :
  - Prénom, nom, email, mot de passe
  - Username optionnel (unique) pour que vos amis vous trouvent
  - Informations optionnelles : téléphone, poids, taille, âge, genre
  - Vérification de l'unicité de l'email et du username
- **Connexion** :
  - Connexion par email et mot de passe
  - Option "Se rappeler de moi" pour mémoriser l'email
  - Gestion des erreurs avec messages en rouge
  - Session persistante (reste connecté après fermeture de l'app)

### 🏠 Page d'accueil
- **Objectifs quotidiens** :
  - Suivi de la consommation d'eau (en litres) avec icône bleue
  - Suivi des calories consommées avec icône rouge flamme
  - Barres de progression visuelles
  - Boutons rapides pour ajouter/soustraire
  - Saisie manuelle personnalisée
  - Synchronisation automatique avec les objectifs définis dans les informations

### 💪 Entraînements
- Création et gestion d'entraînements personnalisés
- Pour chaque exercice :
  - Nom de l'exercice
  - Nombre de séries (configurable)
  - Nombre de répétitions par série
  - Charge (poids en kg) - peut varier entre les séries
  - Temps de repos (en secondes)
  - **Photo de l'exercice** (caméra ou galerie)
- Modification et suppression des entraînements
- Formulaire d'exercice intégré dans le modal d'entraînement

### 📷 Scanner de repas
- **Reconnaissance automatique des aliments** :
  - Prise de photo ou sélection depuis la galerie
  - Détection automatique des aliments (mode test activé)
  - Possibilité d'ajouter manuellement des aliments non détectés
  - Base de données de 20+ aliments communs avec calories/100g
- **Estimation des calories** :
  - Sélection multiple d'aliments
  - Ajustement des portions (en grammes)
  - Calcul automatique du total de calories
  - Ajout direct aux calories quotidiennes
- **Configuration API** :
  - Support pour Google Cloud Vision API (optionnel)
  - Documentation complète dans `IMAGE_RECOGNITION_SETUP.md`

### 👥 Amis
- Gestion de votre liste d'amis
- Recherche d'amis par nom ou email
- Ajout d'amis par email
- Affichage des profils d'amis

### 📊 Informations personnelles
- **Onglet Personnelles** :
  - Photo de profil (caméra ou galerie)
  - Username (visible par les amis)
  - Nom, email, téléphone, âge, genre
  - Section "Votre profil public" montrant ce que voient vos amis
- **Onglet Mensurations** :
  - Enregistrement du poids (kg)
  - Enregistrement de la taille (cm)
  - **Calcul automatique de l'IMC** (Indice de Masse Corporelle)
  - Affichage de la catégorie IMC avec code couleur
  - Échelle visuelle de l'IMC
- **Onglet Objectifs** :
  - Objectifs d'eau et de calories personnalisables
  - **Sélection de programme** :
    - Maintien du poids
    - Perte de poids
    - Prise de masse
  - **Calcul automatique des objectifs** basé sur :
    - Poids, taille, âge, genre
    - Formule de Mifflin-St Jeor (BMR)
    - Ajustement selon le programme choisi
  - Synchronisation avec la page d'accueil

### 🎨 Thème
- **Thème sombre avec accents verts** :
  - Fond très sombre (#0D0D0D)
  - Cartes gris foncé (#1F1F1F)
  - Couleur principale verte (#4ADE80)
  - Interface moderne et élégante

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Démarrer l'application :
```bash
npm start
```

3. Scanner le QR code avec l'application Expo Go sur votre téléphone, ou :
   - Appuyer sur `a` pour ouvrir sur Android
   - Appuyer sur `i` pour ouvrir sur iOS
   - Appuyer sur `w` pour ouvrir dans le navigateur web

## Technologies utilisées

- **React Native 0.81.5** - Framework mobile
- **React 19.1.0** - Bibliothèque UI
- **Expo SDK 54** - Outils de développement
- **React Navigation** - Navigation entre les écrans
- **MongoDB Atlas Data API** - Base de données cloud (optionnel)
- **AsyncStorage** - Stockage local des données (fallback)
- **Expo Camera** - Accès à la caméra
- **Expo Image Picker** - Sélection d'images
- **Expo Linear Gradient** - Dégradés visuels

## Structure du projet

```
Game_changer/
├── App.js                      # Point d'entrée avec navigation et authentification
├── screens/
│   ├── HomeScreen.js           # Page principale avec objectifs
│   ├── WorkoutScreen.js        # Gestion des entraînements
│   ├── InfoScreen.js           # Informations personnelles, IMC, objectifs
│   ├── ScannerScreen.js        # Scanner de repas avec reconnaissance
│   ├── FriendsScreen.js        # Gestion des amis
│   ├── LoginScreen.js          # Écran de connexion
│   └── SignUpScreen.js         # Écran d'inscription
├── components/
│   ├── ProfileImagePicker.js  # Sélecteur de photo de profil
│   ├── ExerciseImagePicker.js # Sélecteur de photo pour exercices
│   ├── FoodItem.js            # Composant pour afficher un aliment
│   └── CaloriesSummary.js     # Résumé des calories
├── utils/
│   ├── db.js                  # Fonctions de base de données (MongoDB/AsyncStorage)
│   ├── auth.js                # Authentification et gestion des utilisateurs
│   ├── goalCalculator.js      # Calcul des objectifs (BMR, TDEE)
│   └── imageRecognition.js    # Service de reconnaissance d'images
├── data/
│   └── foodDatabase.js        # Base de données des aliments
├── theme/
│   └── colors.js              # Palette de couleurs
├── config/
│   └── mongodb.js             # Configuration MongoDB
└── package.json
```

## Stockage des données

L'application utilise **MongoDB Atlas Data API** pour stocker les données de manière persistante dans le cloud. Si MongoDB n'est pas configuré, l'application utilise automatiquement AsyncStorage comme fallback.

### Configuration MongoDB (Recommandé)

Pour utiliser MongoDB et sauvegarder vos données dans le cloud :

1. Suivez les instructions dans `MONGODB_SETUP.md`
2. Configurez vos credentials dans `config/mongodb.js`
3. Installez les dépendances : `npm install`

**Avantages de MongoDB** :
- ✅ Synchronisation entre appareils
- ✅ Sauvegarde automatique dans le cloud
- ✅ Historique des progressions
- ✅ Données sécurisées et accessibles partout
- ✅ Scalable pour de nombreux utilisateurs
- ✅ Gestion des utilisateurs et authentification

### Mode Fallback (AsyncStorage)

Si MongoDB n'est pas configuré, l'application fonctionne avec AsyncStorage :
- Données stockées localement sur l'appareil
- Pas de synchronisation entre appareils
- Données perdues si l'app est désinstallée
- Authentification locale uniquement

**Données stockées** :
- Utilisateurs et authentification
- Objectifs quotidiens
- Progrès quotidiens (réinitialisés chaque jour)
- Entraînements personnalisés
- Informations personnelles (poids, taille, photo, username)
- Liste d'amis

## Calcul de l'IMC

L'IMC est calculé selon la formule standard :
```
IMC = Poids (kg) / Taille (m)²
```

### Catégories selon l'âge

**Adultes (18-64 ans) - Seuils standards :**
- < 18.5 : Insuffisance pondérale
- 18.5 - 24.9 : Poids normal
- 25 - 29.9 : Surpoids
- ≥ 30 : Obésité

**Personnes âgées (65 ans et plus) - Seuils ajustés :**
- < 23 : Insuffisance pondérale
- 23 - 27 : Poids normal
- 27 - 30 : Surpoids
- ≥ 30 : Obésité

**Enfants et adolescents (< 18 ans) :**
- Les seuils standards sont utilisés pour référence
- Note : Les courbes de croissance spécifiques sont plus appropriées pour cette tranche d'âge

Les seuils sont automatiquement ajustés en fonction de l'âge de l'utilisateur.

## Calcul des objectifs

Les objectifs d'eau et de calories sont calculés automatiquement selon le programme choisi :

### Formule utilisée
- **BMR (Métabolisme de base)** : Formule de Mifflin-St Jeor
  - Homme : (10 × poids) + (6.25 × taille) - (5 × âge) + 5
  - Femme : (10 × poids) + (6.25 × taille) - (5 × âge) - 161
- **TDEE (Dépense énergétique totale)** : BMR × facteur d'activité (modéré = 1.55)
- **Eau** : Poids (kg) × 0.035 L + ajustement selon programme

### Programmes disponibles
- **Maintien** : TDEE (calories), eau de base
- **Perte de poids** : TDEE - 500 kcal, eau + 0.5L
- **Prise de masse** : TDEE + 500 kcal, eau + 0.25L

## Reconnaissance d'images

L'application inclut un service de reconnaissance d'images pour identifier automatiquement les aliments dans les photos. Par défaut, un mode test est activé pour démontrer le fonctionnement.

Pour utiliser une vraie API de reconnaissance :
1. Consultez `IMAGE_RECOGNITION_SETUP.md` pour les instructions
2. Configurez Google Cloud Vision API ou une autre API
3. Mettez à jour `utils/imageRecognition.js` avec vos credentials

## Permissions requises

- **Caméra** : Pour scanner les repas et prendre des photos d'exercices
- **Galerie photos** : Pour sélectionner des images depuis la galerie

Ces permissions sont demandées automatiquement lors de la première utilisation.

## Développement

### Lancer en mode développement
```bash
npm start
```

### Lancer sur une plateforme spécifique
```bash
npm run android  # Android
npm run ios      # iOS
npm start --web  # Web
```

## Licence

Ce projet est privé.
