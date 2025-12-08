// Configuration MongoDB
// REMPLACEZ CES VALEURS PAR VOS PROPRES CRÉDENTIALS MONGODB
// Voir MONGODB_SETUP.md pour les instructions

export const mongodbConfig = {
  // Option 1: MongoDB Atlas Data API (recommandé pour commencer)
  apiUrl: "YOUR_MONGODB_API_URL", // Ex: https://data.mongodb-api.com/app/xxxxx/endpoint/data/v1
  apiKey: "YOUR_API_KEY",
  clusterName: "YOUR_CLUSTER_NAME",
  databaseName: "game_changer",
  
  // Option 2: Votre propre API backend (si vous avez un serveur)
  // backendUrl: "https://your-api.com/api",
  
  // Option 3: MongoDB Atlas Connection String (nécessite un backend)
  // connectionString: "mongodb+srv://username:password@cluster.mongodb.net/game_changer?retryWrites=true&w=majority"
};

// Vérifier si MongoDB est configuré
export const isMongoConfigured = () => {
  return mongodbConfig.apiUrl !== "YOUR_MONGODB_API_URL" && 
         mongodbConfig.apiKey !== "YOUR_API_KEY";
};

