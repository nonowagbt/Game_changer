# Script PowerShell pour configurer le port forwarding WSL sur le port 8085
# Exécutez ce script en tant qu'administrateur

Write-Host "=========================================="
Write-Host "Configuration du port forwarding WSL (Port 8085)"
Write-Host "=========================================="
Write-Host ""

# Obtenir l'adresse IP de WSL
$wslIP = (wsl hostname -I).Trim()
Write-Host "Adresse IP WSL: $wslIP"
Write-Host ""

# Supprimer les anciennes règles si elles existent
Write-Host "Suppression des anciennes regles (si elles existent)..."
netsh interface portproxy delete v4tov4 listenport=8085 listenaddress=0.0.0.0 2>$null
netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0 2>$null
Write-Host ""

# Ajouter la nouvelle règle de port forwarding pour le port 8085
Write-Host "Ajout de la regle de port forwarding (port 8085)..."
netsh interface portproxy add v4tov4 listenport=8085 listenaddress=0.0.0.0 connectport=8085 connectaddress=$wslIP
Write-Host ""

# Afficher les règles configurées
Write-Host "Regles de port forwarding configurees:"
netsh interface portproxy show all
Write-Host ""

Write-Host "=========================================="
Write-Host "Configuration terminee!"
Write-Host "=========================================="
Write-Host ""
Write-Host "Utilisez cette URL dans Expo Go:"
Write-Host "  exp://192.168.1.135:8085"
Write-Host ""
Write-Host "N'oubliez pas d'autoriser le port 8085 dans le pare-feu Windows!"
Write-Host ""

