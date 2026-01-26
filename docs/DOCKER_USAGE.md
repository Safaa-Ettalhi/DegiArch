# Guide d'utilisation Docker - DigiArch

## 🚀 Démarrage rapide

### 1. Démarrer tous les services

```bash
docker-compose up -d
```

Cette commande démarre :
- **MongoDB** sur `localhost:27017`
- **MinIO** sur `localhost:9000` (Console: `localhost:9001`)
- **Backend** sur `localhost:3000`
- **Frontend** sur `localhost:3001`

### 2. Vérifier le statut des conteneurs

```bash
docker-compose ps
```

Vous devriez voir tous les services avec le statut "Up".

### 3. Voir les logs

```bash
# Tous les services
docker-compose logs -f

# Un service spécifique
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
docker-compose logs -f minio
```

---

## 🌐 Accès aux services

### Frontend
- **URL** : http://localhost:3001
- Ouvrez votre navigateur et accédez à cette URL

### Backend API
- **URL** : http://localhost:3000
- **Health check** : http://localhost:3000
- **Documentation API** : Voir `docs/API.md`

### MinIO Console
- **URL** : http://localhost:9001
- **Username** : `minioadmin`
- **Password** : `minioadmin`

### MongoDB
- **Port** : `27017`
- **Database** : `digiach`
- **Connection string** : `mongodb://localhost:27017/digiach`

---

## 🧪 Tests de l'application

### 1. Test de santé du backend

```bash
curl http://localhost:3000
```

### 2. Créer un utilisateur administrateur

**Option A : Via le script seed (dans le conteneur)**

```bash
# Entrer dans le conteneur backend
docker-compose exec backend sh

# Dans le conteneur, exécuter le script
npm run seed:admin
```

**Option B : Via l'API (depuis votre machine)**

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

**Option C : Via l'interface web**

1. Allez sur http://localhost:3001
2. Cliquez sur "S'inscrire" ou "Register"
3. Créez un compte (par défaut : ARCHIVE_MANAGER)
4. Pour créer un admin, utilisez l'API (Option B)

### 3. Se connecter à l'application

1. Ouvrez http://localhost:3001 dans votre navigateur
2. Utilisez les identifiants créés précédemment
3. Vous devriez voir le dashboard

### 4. Tester l'upload d'un document

1. Connectez-vous à l'application
2. Allez dans la section "Upload"
3. Téléchargez un fichier PDF
4. Remplissez les champs (département, type de document)
5. Le document sera analysé automatiquement par le LLM

### 5. Tester l'API directement

```bash
# 1. Se connecter
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"MotDePasse123!"}' \
  | jq -r '.access_token')

# 2. Lister les documents
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer $TOKEN"

# 3. Obtenir les statistiques (admin seulement)
curl -X GET http://localhost:3000/documents/stats/advanced \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 Commandes utiles

### Arrêter les services

```bash
docker-compose stop
```

### Redémarrer les services

```bash
docker-compose restart
```

### Arrêter et supprimer les conteneurs (sans supprimer les volumes)

```bash
docker-compose down
```

### Arrêter et supprimer tout (y compris les volumes de données)

```bash
docker-compose down -v
```

⚠️ **Attention** : Cette commande supprime toutes les données MongoDB et MinIO !

### Rebuild les images

```bash
docker-compose up -d --build
```

### Voir l'utilisation des ressources

```bash
docker stats
```

### Entrer dans un conteneur

```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# MongoDB
docker-compose exec mongodb mongosh

# MinIO (pour les commandes CLI)
docker-compose exec minio mc
```

---

## 🐛 Dépannage

### Le backend ne démarre pas

```bash
# Voir les logs
docker-compose logs backend

# Vérifier les variables d'environnement
docker-compose exec backend env | grep MONGO
docker-compose exec backend env | grep MINIO
```

### Le frontend ne démarre pas

```bash
# Voir les logs
docker-compose logs frontend

# Vérifier la connexion au backend
docker-compose exec frontend env | grep NEXT_PUBLIC_API_URL
```

### MongoDB ne répond pas

```bash
# Vérifier les logs
docker-compose logs mongodb

# Redémarrer le service
docker-compose restart mongodb
```

### MinIO ne répond pas

```bash
# Vérifier les logs
docker-compose logs minio

# Vérifier que le port 9000 n'est pas utilisé
netstat -an | grep 9000  # Windows
lsof -i :9000            # Linux/Mac
```

### Erreur de connexion entre services

Vérifiez que tous les services sont sur le même réseau :

```bash
docker network inspect degiarch_digiarch-network
```

### Réinitialiser complètement

```bash
# Arrêter et supprimer tout
docker-compose down -v

# Supprimer les images
docker rmi degiarch-backend degiarch-frontend

# Redémarrer
docker-compose up -d --build
```

---

## 📊 Vérification de l'état

### Vérifier que tous les services sont en cours d'exécution

```bash
docker-compose ps
```

Résultat attendu :
```
NAME                  STATUS          PORTS
digiarch-backend     Up (healthy)    0.0.0.0:3000->3000/tcp
digiarch-frontend    Up (healthy)    0.0.0.0:3001->3000/tcp
digiarch-mongodb     Up              0.0.0.0:27017->27017/tcp
digiarch-minio       Up (healthy)    0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp
```

### Vérifier les health checks

```bash
# Backend
curl http://localhost:3000

# Frontend
curl http://localhost:3001
```

---

## 🔐 Configuration des variables d'environnement

### Backend

Les variables sont définies dans `docker-compose.yml`. Pour les modifier :

1. Éditez `docker-compose.yml`
2. Modifiez la section `environment` du service `backend`
3. Redémarrez : `docker-compose up -d`

### Frontend

Les variables sont définies dans `docker-compose.yml`. Pour les modifier :

1. Éditez `docker-compose.yml`
2. Modifiez la section `environment` du service `frontend`
3. Redémarrez : `docker-compose up -d`

### Variables importantes

- `JWT_SECRET` : Changez en production !
- `LLM_API_KEY` : Votre clé API Groq/OpenAI
- `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` : Changez en production !

---

## 📝 Notes importantes

1. **Premier démarrage** : MongoDB et MinIO peuvent prendre quelques secondes pour être prêts
2. **Health checks** : Les conteneurs backend et frontend ont des health checks automatiques
3. **Données persistantes** : Les données MongoDB et MinIO sont stockées dans des volumes Docker
4. **Logs** : Utilisez `docker-compose logs -f` pour suivre les logs en temps réel

---

*Document généré le 26 Janvier 2026*
