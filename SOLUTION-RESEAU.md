# Solutions pour les problèmes de connexion Expo avec WSL

## Problème
Le téléphone ne peut pas se connecter au serveur Expo car WSL utilise un réseau virtuel qui n'est pas directement accessible.

## Solution 1 : Mode Tunnel (RECOMMANDÉ - En cours)

Le mode tunnel utilise un service externe pour créer une connexion sécurisée.

### Étape 1 : Attendre que le tunnel se crée
- Le serveur Expo est en train de démarrer en mode tunnel
- Attendez 30-60 secondes
- Un nouveau QR code devrait apparaître avec une URL différente (commençant par `exp://` avec un nom de domaine)

### Étape 2 : Scanner le nouveau QR code
- Utilisez Expo Go pour scanner le QR code
- L'URL sera différente de celle affichée précédemment

## Solution 2 : Configurer le Port Forwarding WSL

Si le tunnel ne fonctionne pas, configurez le port forwarding manuellement.

### Étape 1 : Ouvrir PowerShell en tant qu'administrateur
1. Appuyez sur `Windows + X`
2. Sélectionnez "Windows PowerShell (Admin)" ou "Terminal (Admin)"

### Étape 2 : Obtenir l'adresse IP de WSL
```powershell
wsl hostname -I
```
Notez l'adresse IP affichée (ex: 172.25.102.157)

### Étape 3 : Configurer le port forwarding
Remplacez `172.25.102.157` par l'IP que vous avez obtenue :

```powershell
netsh interface portproxy add v4tov4 listenport=8081 listenaddress=0.0.0.0 connectport=8081 connectaddress=172.25.102.157
```

### Étape 4 : Vérifier la configuration
```powershell
netsh interface portproxy show all
```

### Étape 5 : Autoriser le port dans le pare-feu Windows
1. Ouvrez "Pare-feu Windows Defender avec sécurité avancée"
2. Cliquez sur "Règles de trafic entrant" → "Nouvelle règle"
3. Sélectionnez "Port" → Suivant
4. Sélectionnez "TCP" et entrez "8081" → Suivant
5. Sélectionnez "Autoriser la connexion" → Suivant
6. Cochez tous les profils → Suivant
7. Donnez un nom (ex: "Expo Dev Server") → Terminer

### Étape 6 : Redémarrer Expo
Dans WSL :
```bash
cd /home/nonow/EPI/HUB/Game_changer
npx expo start --clear
```

### Étape 7 : Utiliser l'URL dans Expo Go
- Entrez manuellement : `exp://192.168.1.135:8081`
- Ou scannez le QR code (il devrait maintenant fonctionner)

## Solution 3 : Utiliser un émulateur Android

Si vous avez Android Studio installé, vous pouvez utiliser un émulateur Android qui peut accéder directement à WSL.

### Étape 1 : Démarrer l'émulateur Android
1. Ouvrez Android Studio
2. Démarrer un émulateur Android

### Étape 2 : Démarrer Expo
Dans WSL :
```bash
cd /home/nonow/EPI/HUB/Game_changer
npx expo start --android
```

L'émulateur devrait se connecter automatiquement.

## Solution 4 : Utiliser Expo Web (pour tester rapidement)

Pour tester l'application dans le navigateur :

```bash
cd /home/nonow/EPI/HUB/Game_changer
npx expo start --web
```

L'application s'ouvrira dans votre navigateur (mais certaines fonctionnalités comme la caméra ne fonctionneront pas).

## Dépannage

### Vérifier que le serveur Expo est en cours d'exécution
```bash
wsl bash -c "ps aux | grep expo | grep -v grep"
```

### Vérifier la connectivité réseau
Depuis votre téléphone, essayez d'accéder à :
```
http://192.168.1.135:8081
```
Si cela ne fonctionne pas, le problème vient du réseau/pare-feu.

### Réinitialiser le port forwarding
Pour supprimer la règle de port forwarding :
```powershell
netsh interface portproxy delete v4tov4 listenport=8081 listenaddress=0.0.0.0
```

