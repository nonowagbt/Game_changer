#!/bin/bash
cd /home/nonow/EPI/HUB/Game_changer

# Commit 1 : Écran de réglages
git add screens/SettingsScreen.js screens/InfoScreen.js App.js package.json
git commit -m "feat: Ajout de l'écran de réglages avec navigation depuis InfoScreen

- Création de SettingsScreen avec export de données, notifications, etc.
- Ajout d'une icône de réglages en haut à droite dans InfoScreen
- Configuration de la Stack Navigator pour naviguer vers Settings
- Ajout de @react-navigation/stack dans package.json"

# Commit 2 : HomeScreen
git add screens/HomeScreen.js
git commit -m "refactor: Mise à jour de HomeScreen pour utiliser colors directement"

# Commit 3 : Thème
git add theme/colors.js
git commit -m "refactor: Simplification de colors.js pour utiliser uniquement le thème sombre"

# Commit 4 : Nettoyage réglages (si SettingsScreen a encore des modifications)
git add screens/SettingsScreen.js
git commit -m "refactor: Suppression de 'Mon compte' et 'Mes signalements' dans les réglages" || true

# Push
git push

echo "✅ Tous les commits ont été créés et poussés avec succès!"

