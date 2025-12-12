// Thèmes clair et sombre avec accents verts

// Couleurs communes (vert gardé dans les deux thèmes)
const commonColors = {
  // Couleur d'accent vert (conservée dans les deux thèmes)
  primary: '#4ADE80',           // Vert clair/vibrant (couleur principale)
  primaryDark: '#22C55E',       // Vert plus foncé pour les variantes
  primaryLight: '#86EFAC',       // Vert très clair
  
  // États (conservés identiques)
  success: '#4ADE80',           // Succès (vert)
  error: '#EF4444',             // Erreur (rouge)
  warning: '#F59E0B',           // Avertissement (orange)
  info: '#3B82F6',              // Info (bleu)
  
  accentLine: '#4ADE80',        // Ligne d'accent vert
};

// Thème sombre
export const darkTheme = {
  ...commonColors,
  // Couleurs principales
  background: '#0D0D0D',        // Fond principal très sombre
  backgroundSecondary: '#1A1A1A', // Fond secondaire
  cardBackground: '#1F1F1F',    // Fond des cartes (gris foncé)
  
  // Texte
  text: '#FFFFFF',              // Texte principal (blanc)
  textSecondary: '#A3A3A3',     // Texte secondaire (gris clair)
  textTertiary: '#737373',      // Texte tertiaire (gris moyen)
  
  // Bordures et séparateurs
  border: '#2A2A2A',            // Bordures des cartes
  borderLight: '#3A3A3A',       // Bordures plus claires
  
  // Overlay et modals
  overlay: 'rgba(0, 0, 0, 0.7)', // Overlay pour les modals
  modalBackground: '#1F1F1F',   // Fond des modals
  
  // Inputs
  inputBackground: '#2A2A2A',   // Fond des inputs
  inputBorder: '#3A3A3A',       // Bordure des inputs
  inputText: '#FFFFFF',         // Texte dans les inputs
  inputPlaceholder: '#737373',  // Placeholder
  
  // Boutons
  buttonPrimary: '#4ADE80',     // Bouton principal (vert)
  buttonPrimaryText: '#0D0D0D', // Texte sur bouton principal (noir sur vert)
  buttonSecondary: '#2A2A2A',   // Bouton secondaire
  buttonSecondaryText: '#FFFFFF', // Texte sur bouton secondaire
  
  // Progress bars
  progressBackground: '#2A2A2A', // Fond de la barre de progression
  progressFill: '#4ADE80',      // Remplissage de la barre (vert)
  
  // Icons
  iconActive: '#4ADE80',        // Icônes actives (vert)
  iconInactive: '#737373',      // Icônes inactives (gris)
};

// Thème clair
export const lightTheme = {
  ...commonColors,
  // Couleurs principales
  background: '#FFFFFF',        // Fond principal blanc
  backgroundSecondary: '#F5F5F5', // Fond secondaire (gris très clair)
  cardBackground: '#FFFFFF',    // Fond des cartes (blanc)
  
  // Texte
  text: '#000000',              // Texte principal (noir)
  textSecondary: '#525252',     // Texte secondaire (gris foncé)
  textTertiary: '#737373',      // Texte tertiaire (gris moyen)
  
  // Bordures et séparateurs
  border: '#E5E5E5',            // Bordures des cartes (gris clair)
  borderLight: '#D4D4D4',       // Bordures plus foncées (gris moyen)
  
  // Overlay et modals
  overlay: 'rgba(0, 0, 0, 0.5)', // Overlay pour les modals
  modalBackground: '#FFFFFF',   // Fond des modals (blanc)
  
  // Inputs
  inputBackground: '#F5F5F5',   // Fond des inputs (gris très clair)
  inputBorder: '#D4D4D4',       // Bordure des inputs
  inputText: '#000000',         // Texte dans les inputs (noir)
  inputPlaceholder: '#A3A3A3',  // Placeholder (gris)
  
  // Boutons
  buttonPrimary: '#4ADE80',     // Bouton principal (vert)
  buttonPrimaryText: '#FFFFFF', // Texte sur bouton principal (blanc sur vert)
  buttonSecondary: '#F5F5F5',   // Bouton secondaire (gris très clair)
  buttonSecondaryText: '#000000', // Texte sur bouton secondaire (noir)
  
  // Progress bars
  progressBackground: '#E5E5E5', // Fond de la barre de progression (gris clair)
  progressFill: '#4ADE80',      // Remplissage de la barre (vert)
  
  // Icons
  iconActive: '#4ADE80',        // Icônes actives (vert)
  iconInactive: '#A3A3A3',      // Icônes inactives (gris)
};

// Par défaut, on exporte le thème sombre
export const colors = darkTheme;
