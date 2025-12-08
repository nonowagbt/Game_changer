# Configuration MongoDB

Pour utiliser MongoDB au lieu du stockage local, suivez ces étapes :

## Option 1: MongoDB Atlas Data API (Recommandé - Simple)

### 1. Créer un cluster MongoDB Atlas

1. Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créez un compte gratuit
3. Créez un nouveau cluster (choisissez le plan gratuit M0)
4. Attendez que le cluster soit créé (2-3 minutes)

### 2. Configurer l'accès réseau

1. Dans "Network Access", cliquez sur "Add IP Address"
2. Cliquez sur "Allow Access from Anywhere" (0.0.0.0/0) pour le développement
3. Pour la production, ajoutez uniquement les IPs autorisées

### 3. Créer un utilisateur de base de données

1. Dans "Database Access", cliquez sur "Add New Database User"
2. Créez un utilisateur avec un nom d'utilisateur et un mot de passe
3. Donnez-lui les permissions "Read and write to any database"
4. Notez le nom d'utilisateur et le mot de passe

### 4. Activer Data API

1. Dans votre cluster, allez dans "Data API" (ou "Data Services")
2. Cliquez sur "Create Data API"
3. Copiez l'URL de l'API et la clé API générée
4. Notez le nom de votre cluster

### 5. Configurer l'application

1. Ouvrez le fichier `config/mongodb.js`
2. Remplacez les valeurs suivantes :

```javascript
export const mongodbConfig = {
  apiUrl: "VOTRE_API_URL", // L'URL de l'API copiée
  apiKey: "VOTRE_API_KEY", // La clé API copiée
  clusterName: "VOTRE_CLUSTER_NAME", // Ex: Cluster0
  databaseName: "game_changer",
};
```

## Option 2: Votre propre API Backend (Avancé)

Si vous préférez créer votre propre API backend :

### 1. Créer un serveur Node.js/Express

```javascript
// Exemple avec Express et MongoDB
const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

const uri = "VOTRE_CONNECTION_STRING";
const client = new MongoClient(uri);

// Routes pour vos endpoints
app.get('/api/workouts', async (req, res) => {
  // Logique pour récupérer les workouts
});

app.post('/api/workouts', async (req, res) => {
  // Logique pour sauvegarder les workouts
});

// ... autres routes
```

### 2. Modifier la configuration

Dans `config/mongodb.js`, utilisez :

```javascript
export const mongodbConfig = {
  backendUrl: "https://votre-api.com/api",
};
```

### 3. Modifier `utils/db.js`

Adaptez les fonctions `mongoRequest` pour utiliser votre API backend au lieu de l'API Data de MongoDB.

## Structure des collections MongoDB

Les données seront stockées dans les collections suivantes :

- `dailyGoals` - Objectifs quotidiens
- `dailyProgress` - Progrès quotidiens (un document par jour)
- `workouts` - Entraînements
- `userInfo` - Informations utilisateur

Chaque document contient un champ `userId` pour identifier l'utilisateur.

## Mode Fallback (AsyncStorage)

Si MongoDB n'est pas configuré, l'application utilise automatiquement AsyncStorage :
- Données stockées localement sur l'appareil
- Pas de synchronisation entre appareils
- Données perdues si l'app est désinstallée

## Avantages de MongoDB

- ✅ Synchronisation entre appareils
- ✅ Sauvegarde automatique dans le cloud
- ✅ Historique des progressions
- ✅ Données sécurisées et accessibles partout
- ✅ Scalable pour de nombreux utilisateurs

## Dépannage

- **Erreur "MongoDB not configured"** : Vérifiez que vous avez bien rempli les credentials dans `config/mongodb.js`
- **Erreur de connexion** : Vérifiez que votre IP est autorisée dans MongoDB Atlas
- **Erreur d'authentification** : Vérifiez votre clé API et l'URL de l'API

## Migration depuis AsyncStorage

Si vous avez déjà des données dans AsyncStorage, vous devrez les migrer manuellement ou créer un script de migration. Les nouvelles données seront automatiquement sauvegardées dans MongoDB.

