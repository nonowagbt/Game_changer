# Configuration Google OAuth - URIs et Origines JavaScript

## Informations de votre application

- **Nom de l'application** : Game Changer
- **Slug Expo** : game-changer
- **Bundle ID iOS** : com.gamechanger.app
- **Package Android** : com.gamechanger.app
- **Scheme** : game-changer

## 1. Redirect URIs (URIs de redirection)

Dans Google Cloud Console > Credentials > OAuth 2.0 Client IDs, ajoutez ces **Authorized redirect URIs** :

### Pour le développement (Expo Go / Expo Dev Client)

**Si vous êtes connecté à Expo** :
```
https://auth.expo.io/@votre-username/game-changer
```
(Pour trouver votre username : `npx expo whoami`)

**Si vous n'êtes pas connecté (proxy anonyme)** :
```
https://auth.expo.io/@anonymous/game-changer
```

**Recommandé : Utilisez les deux pour plus de flexibilité**

### Pour la production (Build standalone)

```
game-changer://oauth
```

### Pour le web (si vous déployez une version web)

```
http://localhost:8081
http://localhost:19006
https://votre-domaine.com/oauth/callback
```

### Liste complète recommandée

```
https://auth.expo.io/@anonymous/game-changer
game-changer://oauth
exp://localhost:8081
http://localhost:8081
http://localhost:19006
```

**Note** : Si vous vous connectez plus tard à Expo (`npx expo login`), vous pouvez aussi ajouter :
```
https://auth.expo.io/@votre-username/game-changer
```

## 2. JavaScript Origins (Origines JavaScript autorisées)

Dans Google Cloud Console > Credentials > OAuth 2.0 Client IDs, ajoutez ces **Authorized JavaScript origins** :

### Pour le développement

```
http://localhost:8081
http://localhost:19006
https://auth.expo.io
```

### Pour la production web

```
https://votre-domaine.com
```

### Liste complète recommandée

```
http://localhost:8081
http://localhost:19006
https://auth.expo.io
https://votre-domaine.com
```

## 3. Configuration dans Google Cloud Console

### Étapes détaillées :

1. **Allez sur** : https://console.cloud.google.com/

2. **Sélectionnez votre projet** (ou créez-en un nouveau)

3. **Activez les APIs** :
   - Allez dans "APIs & Services" > "Library"
   - Recherchez et activez :
     - **Google+ API** (ou Google Identity)
     - **Google Fit API**

4. **Créez les OAuth 2.0 Client IDs** :
   - Allez dans "APIs & Services" > "Credentials"
   - Cliquez sur "Create Credentials" > "OAuth client ID"
   - Configurez l'écran de consentement OAuth si nécessaire

5. **Créez 3 types de clients OAuth** :

   #### a) Web application (pour Expo)
   - **Application type** : Web application
   - **Name** : Game Changer - Web
   - **Authorized JavaScript origins** : (voir section 2 ci-dessus)
   - **Authorized redirect URIs** : (voir section 1 ci-dessus)
   - **Copiez le Client ID** : `xxxxx.apps.googleusercontent.com`

   #### b) iOS (pour build iOS)
   - **Application type** : iOS
   - **Name** : Game Changer - iOS
   - **Bundle ID** : `com.gamechanger.app`
   - **Copiez le Client ID** : `xxxxx.apps.googleusercontent.com`

   #### c) Android (pour build Android)
   - **Application type** : Android
   - **Name** : Game Changer - Android
   - **Package name** : `com.gamechanger.app`
   - **SHA-1 certificate fingerprint** : (obtenez-le avec `keytool -list -v -keystore ~/.android/debug.keystore`)
   - **Copiez le Client ID** : `xxxxx.apps.googleusercontent.com`

## 4. Configuration dans votre application

### Option 1 : Fichier .env (recommandé)

Créez un fichier `.env` à la racine du projet :

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=votre_client_id_web.apps.googleusercontent.com
```

### Option 2 : app.json

Ajoutez dans `app.json` :

```json
{
  "expo": {
    "extra": {
      "googleClientId": "votre_client_id_web.apps.googleusercontent.com"
    }
  }
}
```

## 5. Vérification

Pour vérifier votre configuration :

1. **Vérifiez votre username Expo** :
   ```bash
   npx expo whoami
   ```

2. **Testez la connexion Google** dans l'application

3. **Vérifiez les logs** pour voir les erreurs éventuelles

## 6. URLs importantes

- **Google Cloud Console** : https://console.cloud.google.com/
- **OAuth 2.0 Playground** : https://developers.google.com/oauthplayground/
- **Google Fit API Documentation** : https://developers.google.com/fit/rest
- **Expo AuthSession Docs** : https://docs.expo.dev/guides/authentication/#google

## 7. Exemple de Client ID

Votre Client ID ressemblera à quelque chose comme :
```
123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
```

**Important** : Utilisez le Client ID de type "Web application" pour Expo.

## 8. Dépannage

### Erreur "redirect_uri_mismatch"
- Vérifiez que tous les redirect URIs sont bien ajoutés dans Google Cloud Console
- Vérifiez que le scheme `game-changer` est bien configuré dans `app.json`

### Erreur "invalid_client"
- Vérifiez que le Client ID est correct
- Vérifiez que vous utilisez le Client ID de type "Web application"

### L'authentification ne fonctionne pas
- Vérifiez que les APIs Google+ et Google Fit sont activées
- Vérifiez que l'écran de consentement OAuth est configuré
- Vérifiez les logs de l'application pour plus de détails

