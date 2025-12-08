// Calcul des objectifs basés sur le programme, poids et taille

/**
 * Calcule le BMR (Basal Metabolic Rate) avec la formule de Mifflin-St Jeor
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @param {number} age - Âge (par défaut 30 si non fourni)
 * @param {string} gender - 'male' ou 'female' (par défaut 'male')
 * @returns {number} BMR en kcal
 */
export function calculateBMR(weight, height, age = 30, gender = 'male') {
  if (!weight || !height) return null;
  
  const heightInMeters = height / 100;
  
  // Formule de Mifflin-St Jeor
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calcule les calories quotidiennes selon le programme
 * @param {string} program - 'maintain', 'weight_loss', 'weight_gain'
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @param {number} age - Âge
 * @param {string} gender - 'male' ou 'female'
 * @returns {number} Calories quotidiennes
 */
export function calculateCalories(program, weight, height, age = 30, gender = 'male') {
  const bmr = calculateBMR(weight, height, age, gender);
  if (!bmr) return 2000; // Valeur par défaut
  
  // Facteur d'activité (sédentaire à modérément actif)
  const activityFactor = 1.5;
  const maintenanceCalories = Math.round(bmr * activityFactor);
  
  switch (program) {
    case 'weight_loss':
      // Déficit de 500 kcal pour perte de poids (environ 0.5kg par semaine)
      return Math.max(1200, maintenanceCalories - 500);
    
    case 'weight_gain':
      // Surplus de 500 kcal pour prise de masse
      return maintenanceCalories + 500;
    
    case 'maintain':
    default:
      // Maintien du poids
      return maintenanceCalories;
  }
}

/**
 * Calcule l'objectif d'eau quotidien selon le programme
 * @param {string} program - 'maintain', 'weight_loss', 'weight_gain'
 * @param {number} weight - Poids en kg
 * @returns {number} Litres d'eau par jour
 */
export function calculateWater(program, weight) {
  if (!weight) return 2; // Valeur par défaut
  
  // Base : 30-35ml par kg de poids corporel
  let baseWater = (weight * 0.035); // 35ml par kg
  
  // Ajustements selon le programme
  switch (program) {
    case 'weight_loss':
      // Légèrement plus d'eau pour la perte de poids (aide au métabolisme)
      baseWater *= 1.1;
      break;
    
    case 'weight_gain':
      // Plus d'eau pour la prise de masse (récupération musculaire)
      baseWater *= 1.15;
      break;
    
    case 'maintain':
    default:
      // Maintien : quantité standard
      break;
  }
  
  // Arrondir à 0.25L près et minimum 1.5L
  return Math.max(1.5, Math.round(baseWater * 4) / 4);
}

/**
 * Obtient le nom du programme en français
 */
export function getProgramName(program) {
  switch (program) {
    case 'weight_loss':
      return 'Perte de poids';
    case 'weight_gain':
      return 'Prise de masse';
    case 'maintain':
      return 'Se maintenir';
    default:
      return 'Se maintenir';
  }
}

/**
 * Obtient la description du programme
 */
export function getProgramDescription(program) {
  switch (program) {
    case 'weight_loss':
      return 'Déficit calorique pour perdre du poids de manière saine';
    case 'weight_gain':
      return 'Surplus calorique pour prendre de la masse musculaire';
    case 'maintain':
      return 'Maintien du poids actuel avec un équilibre calorique';
    default:
      return 'Maintien du poids actuel';
  }
}

