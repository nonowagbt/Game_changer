# Game Changer

Application mobile de suivi fitness et nutrition développée avec React Native et Expo.

## Fonctionnalités

### 🏠 Page d'accueil
- **Objectifs quotidiens** :
  - Suivi de la consommation d'eau (en litres)
  - Suivi des calories consommées
  - Barres de progression visuelles
  - Boutons rapides pour ajouter/soustraire
  - Saisie manuelle personnalisée

### 💪 Entraînements
- Création et gestion d'entraînements personnalisés
- Pour chaque exercice :
  - Nom de l'exercice
  - Nombre de séries
  - Nombre de répétitions
  - Charge (poids en kg)
  - Temps de repos (en secondes)
- Modification et suppression des entraînements

### 📊 Informations personnelles
- Enregistrement du poids (kg)
- Enregistrement de la taille (cm)
- **Calcul automatique de l'IMC** (Indice de Masse Corporelle)
- Affichage de la catégorie IMC avec code couleur
- Échelle visuelle de l'IMC

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

## Technologies utilisées

- **React Native 0.76.5** - Framework mobile
- **Expo SDK 54** - Outils de développement
- **React Navigation** - Navigation entre les écrans
- **AsyncStorage** - Stockage local des données
- **Expo Linear Gradient** - Dégradés visuels

## Structure du projet

```
Game_changer/
├── App.js                 # Point d'entrée avec navigation
├── screens/
│   ├── HomeScreen.js      # Page principale avec objectifs
│   ├── WorkoutScreen.js   # Gestion des entraînements
│   └── InfoScreen.js      # Informations personnelles et IMC
├── utils/
│   └── storage.js         # Fonctions de stockage local
└── package.json
```

## Stockage des données

L'application utilise **MongoDB Atlas** pour stocker les données de manière persistante dans le cloud. Si MongoDB n'est pas configuré, l'application utilise automatiquement AsyncStorage comme fallback.

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

### Mode Fallback (AsyncStorage)

Si MongoDB n'est pas configuré, l'application fonctionne avec AsyncStorage :
- Données stockées localement sur l'appareil
- Pas de synchronisation entre appareils
- Données perdues si l'app est désinstallée

**Données stockées** :
- Objectifs quotidiens
- Progrès quotidiens (réinitialisés chaque jour)
- Entraînements personnalisés
- Informations personnelles (poids, taille)

## Calcul de l'IMC

L'IMC est calculé selon la formule standard :
```
IMC = Poids (kg) / Taille (m)²
```

Catégories :
- < 18.5 : Insuffisance pondérale
- 18.5 - 24.9 : Poids normal
- 25 - 29.9 : Surpoids
- ≥ 30 : Obésité