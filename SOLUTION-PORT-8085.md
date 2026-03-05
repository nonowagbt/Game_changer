# Solution pour le port 8085

Votre serveur Expo utilise le port **8085** au lieu de 8081.

## Étape 1 : Configurer le port forwarding pour le port 8085

1. **Ouvrez PowerShell en tant qu'administrateur** :
   - Appuyez sur `Windows + X`
   - Sélectionnez "Terminal (Admin)" ou "Windows PowerShell (Admin)"

2. **Naviguez vers votre projet** :
   ```powershell
   cd \\wsl.localhost\Ubuntu\home\nonow\EPI\HUB\Game_changer
   ```

3. **Exécutez le script** :
   ```powershell
   .\setup-port-8085.ps1
   ```

   OU configurez manuellement :
   ```powershell
   # Obtenir l'IP WSL
   $wslIP = (wsl hostname -I).Trim()
   
   # Configurer le port forwarding
   netsh interface portproxy add v4tov4 listenport=8085 listenaddress=0.0.0.0 connectport=8085 connectaddress=$wslIP
   ```

## Étape 2 : Autoriser le port 8085 dans le pare-feu Windows

1. Ouvrez "Pare-feu Windows Defender avec sécurité avancée"
2. Cliquez sur "Règles de trafic entrant" → "Nouvelle règle"
3. Sélectionnez "Port" → Suivant
4. Sélectionnez "TCP" et entrez **8085** → Suivant
5. Sélectionnez "Autoriser la connexion" → Suivant
6. Cochez tous les profils → Suivant
7. Donnez un nom (ex: "Expo Dev Server 8085") → Terminer

## Étape 3 : Utiliser l'URL dans Expo Go

Dans Expo Go, entrez manuellement :
```
exp://192.168.1.135:8085
```

## Alternative : Forcer Expo à utiliser le port 8081

Si vous préférez utiliser le port 8081 :

1. Arrêtez Expo (Ctrl+C dans le terminal)
2. Redémarrez avec :
   ```bash
   npx expo start --port 8081 --clear
   ```
3. Configurez le port forwarding pour 8081 au lieu de 8085

