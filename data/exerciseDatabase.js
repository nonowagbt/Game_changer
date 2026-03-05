// Base de données d'exercices avec illustrations
// Les images peuvent être des emojis, des URLs, ou des références à des assets locaux

export const EXERCISE_DATABASE = {
  'Développé couché': {
    image: '🏋️',
    category: 'Pectoraux',
    description: 'Exercice pour développer les pectoraux',
  },
  'Squat': {
    image: '🦵',
    category: 'Jambes',
    description: 'Exercice pour les quadriceps et fessiers',
  },
  'Soulevé de terre': {
    image: '💪',
    category: 'Dos',
    description: 'Exercice complet pour le dos et les jambes',
  },
  'Développé militaire': {
    image: '💪',
    category: 'Épaules',
    description: 'Exercice pour les épaules',
  },
  'Tractions': {
    image: '🤸',
    category: 'Dos',
    description: 'Exercice pour le dos et les biceps',
  },
  'Pompes': {
    image: '🏃',
    category: 'Pectoraux',
    description: 'Exercice au poids du corps pour les pectoraux',
  },
  'Fentes': {
    image: '🚶',
    category: 'Jambes',
    description: 'Exercice pour les jambes et fessiers',
  },
  'Curl biceps': {
    image: '💪',
    category: 'Biceps',
    description: 'Exercice pour les biceps',
  },
  'Extension triceps': {
    image: '💪',
    category: 'Triceps',
    description: 'Exercice pour les triceps',
  },
  'Relevé de jambes': {
    image: '🤸',
    category: 'Abdominaux',
    description: 'Exercice pour les abdominaux',
  },
  'Planche': {
    image: '🧘',
    category: 'Abdominaux',
    description: 'Exercice isométrique pour le gainage',
  },
  'Dips': {
    image: '🤸',
    category: 'Triceps',
    description: 'Exercice pour les triceps et épaules',
  },
  'Rowing': {
    image: '🚣',
    category: 'Dos',
    description: 'Exercice pour le dos et les biceps',
  },
  'Leg press': {
    image: '🦵',
    category: 'Jambes',
    description: 'Exercice pour les jambes',
  },
  'Développé incliné': {
    image: '🏋️',
    category: 'Pectoraux',
    description: 'Exercice pour le haut des pectoraux',
  },
  'Curl mollets': {
    image: '🦵',
    category: 'Mollets',
    description: 'Exercice pour les mollets',
  },
  'Abdos': {
    image: '🤸',
    category: 'Abdominaux',
    description: 'Exercice pour les abdominaux',
  },
  'Burpees': {
    image: '🏃',
    category: 'Cardio',
    description: 'Exercice cardio complet',
  },
  'Mountain climbers': {
    image: '🏃',
    category: 'Cardio',
    description: 'Exercice cardio pour tout le corps',
  },
  'Jumping jacks': {
    image: '🤸',
    category: 'Cardio',
    description: 'Exercice cardio',
  },
};

// Obtenir tous les exercices
export const getAllExercises = () => {
  return Object.keys(EXERCISE_DATABASE).map(name => ({
    name,
    ...EXERCISE_DATABASE[name],
  }));
};

// Rechercher des exercices par nom
export const searchExercises = (query) => {
  const lowerQuery = query.toLowerCase();
  return getAllExercises().filter(exercise =>
    exercise.name.toLowerCase().includes(lowerQuery) ||
    exercise.category.toLowerCase().includes(lowerQuery) ||
    exercise.description.toLowerCase().includes(lowerQuery)
  );
};

// Obtenir les exercices par catégorie
export const getExercisesByCategory = (category) => {
  return getAllExercises().filter(exercise => exercise.category === category);
};

// Obtenir toutes les catégories
export const getCategories = () => {
  const categories = new Set();
  getAllExercises().forEach(exercise => {
    categories.add(exercise.category);
  });
  return Array.from(categories).sort();
};

