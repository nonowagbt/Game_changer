# Script PowerShell pour configurer le port forwarding WSL
# Exécutez ce script en tant qu'administrateur

Write-Host "=========================================="
Write-Host "Configuration du port forwarding WSL"
Write-Host "=========================================="
Write-Host ""

# Obtenir l'adresse IP de WSL
$wslIP = (wsl hostname -I).Trim()
Write-Host "Adresse IP WSL: $wslIP"
Write-Host ""

# Supprimer l'ancienne règle si elle existe
Write-Host "Suppression de l'ancienne règle (si elle existe)..."
netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0 2>$null
Write-Host ""

# Ajouter la nouvelle règle de port forwarding
Write-Host "Ajout de la règle de port forwarding..."
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=$wslIP
Write-Host ""

# Afficher les règles configurées
Write-Host "Règles de port forwarding configurées:"
netsh interface portproxy show all
Write-Host ""

Write-Host "=========================================="
Write-Host "Configuration terminée!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Vous pouvez maintenant démarrer Expo avec:"
Write-Host "  wsl bash -c 'cd /home/nonow/EPI/HUB/Game_changer && npx expo start'"
Write-Host ""
Write-Host "Et utiliser l'URL: exp://192.168.1.135:8081"
Write-Host ""

