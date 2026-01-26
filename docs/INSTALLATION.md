# Guide d'installation - DigiArch

Ce guide vous accompagne dans l'installation complète de la plateforme DigiArch.

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

- **Node.js** : Version 18 ou supérieure
- **npm** : Version 9 ou supérieure (inclus avec Node.js)
- **Docker** : Version 20 ou supérieure
- **Docker Compose** : Version 2 ou supérieure
- **Git** : Pour cloner le repository

### Vérification des prérequis

```bash
# Vérifier Node.js
node --version  # Doit afficher v18.x.x ou supérieur

# Vérifier npm
npm --version  # Doit afficher 9.x.x ou supérieur

# Vérifier Docker
docker --version  # Doit afficher Docker version 20.x.x ou supérieur

# Vérifier Docker Compose
docker compose version  # Doit afficher v2.x.x ou supérieur
```

## 🚀 Installation

### Étape 1 : Cloner le repository

```bash
git clone https://github.com/Safaa-Ettalhi/DegiArch.git
cd DigiArch
```

### Étape 2 : Configuration de l'environnement

#### Backend

```bash
cd backend
npm install
```

Créer le fichier `.env` à partir de `.env.example` :

```bash
cp .env.example .env
```

Éditer le fichier `.env` avec vos configurations :

```env
# Port du serveur
PORT=3000

# MongoDB
MONGO_URI=mongodb://localhost:27017/digiarch

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise
JWT_EXPIRES_IN=7d

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=archives

# LLM (Groq)
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
LLM_API_KEY=votre_cle_api_groq

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:3001
```

**Important** : 
- Remplacez `JWT_SECRET` par une chaîne aléatoire sécurisée
- Obtenez votre clé API Groq sur [console.groq.com](https://console.groq.com)
- Ajustez les URLs si nécessaire

#### Frontend

```bash
cd ../frontend
npm install
```

Créer le fichier `.env.local` :

```bash
cp .env.example .env.local
```

Éditer le fichier `.env.local` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Étape 3 : Démarrer les services avec Docker

Depuis la racine du projet :

```bash
docker compose up -d
```

Cette commande démarre :
- **MongoDB** : Port 27017
- **MinIO** : Port 9000 (Console : http://localhost:9001)

**Vérification** :

```bash
docker compose ps
```

Vous devriez voir les deux services en cours d'exécution.

### Étape 4 : Initialiser MinIO

1. Accéder à la console MinIO : http://localhost:9001
2. Se connecter avec :
   - **Username** : `minioadmin`
   - **Password** : `minioadmin`
3. Le bucket `archives` sera créé automatiquement au premier upload

### Étape 5 : Créer un utilisateur administrateur

```bash
cd backend
npm run seed:admin
```

Suivre les instructions pour créer le premier administrateur.

**Alternative** : Créer un admin via l'API :

```bash
curl -X POST http://localhost:3000/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MotDePasse123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### Étape 6 : Démarrer le backend

```bash
cd backend
npm run start:dev
```

Le serveur démarre sur `http://localhost:3000`

### Étape 7 : Démarrer le frontend

Dans un nouveau terminal :

```bash
cd frontend
npm run dev
```

L'application démarre sur `http://localhost:3001`

## ✅ Vérification de l'installation

### Test de l'API Backend

```bash
# Test de santé
curl http://localhost:3000

# Test de connexion
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "MotDePasse123!"
  }'
```

### Test du Frontend

1. Ouvrir http://localhost:3001
2. Se connecter avec les identifiants de l'admin créé
3. Vérifier l'accès au dashboard

## 🔧 Configuration avancée

### Configuration MongoDB

Pour utiliser une instance MongoDB externe :

```env
MONGO_URI=mongodb://user:password@host:port/database
```

### Configuration MinIO

Pour utiliser une instance MinIO externe :

```env
MINIO_ENDPOINT=votre-serveur-minio.com
MINIO_PORT=9000
MINIO_USE_SSL=true
MINIO_ACCESS_KEY=votre_access_key
MINIO_SECRET_KEY=votre_secret_key
```

### Configuration LLM

#### Utiliser OpenAI au lieu de Groq

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=votre_cle_openai
```

#### Utiliser un autre modèle Groq

```env
LLM_PROVIDER=groq
LLM_MODEL=llama-3.1-8b-instant  # ou autre modèle disponible
LLM_API_KEY=votre_cle_groq
```

## 🐛 Dépannage

### Problème : MongoDB ne démarre pas

```bash
# Vérifier les logs
docker compose logs mongodb

# Redémarrer le service
docker compose restart mongodb
```

### Problème : MinIO ne démarre pas

```bash
# Vérifier les logs
docker compose logs minio

# Vérifier que le port 9000 n'est pas utilisé
netstat -an | grep 9000
```

### Problème : Erreur de connexion à l'API

1. Vérifier que le backend est démarré : `http://localhost:3000`
2. Vérifier la variable `NEXT_PUBLIC_API_URL` dans `.env.local`
3. Vérifier les logs du backend pour les erreurs

### Problème : Erreur LLM

1. Vérifier que la clé API est correcte dans `.env`
2. Vérifier que le modèle est disponible (Groq : `llama-3.3-70b-versatile`)
3. Vérifier les logs du backend pour les erreurs détaillées

### Problème : Erreur de build Frontend

```bash
# Nettoyer et réinstaller
cd frontend
rm -rf node_modules .next
npm install
npm run build
```

## 📦 Installation en production

### Build du backend

```bash
cd backend
npm run build
npm run start:prod
```

### Build du frontend

```bash
cd frontend
npm run build
npm run start
```

### Variables d'environnement de production

Assurez-vous de :
- Utiliser des secrets forts pour `JWT_SECRET`
- Configurer HTTPS pour MinIO et MongoDB
- Utiliser des credentials sécurisés
- Configurer correctement CORS pour le domaine de production

## 🔄 Mise à jour

```bash
# Récupérer les dernières modifications
git pull origin main

# Mettre à jour les dépendances backend
cd backend
npm install

# Mettre à jour les dépendances frontend
cd ../frontend
npm install

# Redémarrer les services
docker compose restart
```

## 📝 Notes importantes

1. **Sécurité** : Ne commitez jamais les fichiers `.env` ou `.env.local`
2. **Backup** : Configurez des sauvegardes régulières de MongoDB et MinIO
3. **Monitoring** : Surveillez les logs pour détecter les erreurs
4. **Performance** : Ajustez les limites selon votre volume de documents

## 🆘 Support

En cas de problème :
1. Consulter les logs : `docker compose logs`
2. Vérifier la documentation API : `docs/API.md`
3. Vérifier l'architecture : `docs/ARCHITECTURE.md`
