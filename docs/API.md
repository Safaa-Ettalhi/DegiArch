# Documentation API - DigiArch

Base URL : `http://localhost:3000`

Toutes les routes (sauf `/auth/login` et `/auth/register`) nécessitent une authentification JWT via le header `Authorization: Bearer <token>`.

## 🔐 Authentification

### POST /auth/login

Connexion d'un utilisateur.

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response 200** :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "safaa",
    "lastName": "ettalhi",
    "role": "ARCHIVE_MANAGER"
  }
}
```

**Erreurs** :
- `401 Unauthorized` : Identifiants invalides ou compte désactivé

---

### POST /auth/register

Inscription d'un nouvel utilisateur (rôle ARCHIVE_MANAGER par défaut).

**Request Body** :
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "safaa",
  "lastName": "ettalhi"
}
```

**Response 201** :
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "safaa",
  "lastName": "ettalhi",
  "role": "ARCHIVE_MANAGER",
  "isActive": true,
  "createdAt": "2026-01-25T10:00:00.000Z",
  "updatedAt": "2026-01-25T10:00:00.000Z"
}
```

**Erreurs** :
- `401 Unauthorized` : Utilisateur déjà existant

---

### POST /auth/create-admin

Création d'un administrateur (nécessite authentification).

**Request Body** :
```json
{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User",
  "role": "ADMIN"
}
```

**Response 201** : Même format que `/auth/register`

---

### GET /auth/profile

Récupération du profil de l'utilisateur connecté.

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "firstName": "safaa",
  "lastName": "ettalhi",
  "role": "ARCHIVE_MANAGER",
  "isActive": true
}
```

---

## 👥 Gestion des utilisateurs

**Toutes les routes nécessitent le rôle ADMIN.**

### GET /users

Récupération de tous les utilisateurs.

**Headers** :
```
Authorization: Bearer <token>
```

**Response 200** :
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "safaa",
    "lastName": "ettalhi",
    "role": "ARCHIVE_MANAGER",
    "isActive": true
  }
]
```

---

### POST /users

Création d'un nouvel utilisateur.

**Request Body** :
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "firstName": "sara",
  "lastName": "ettalhi",
  "role": "ARCHIVE_MANAGER"
}
```

**Response 201** : Objet utilisateur créé

---

### GET /users/:id

Récupération d'un utilisateur par ID.

**Response 200** : Objet utilisateur

---

### PATCH /users/:id

Mise à jour d'un utilisateur (rôle, etc.).

**Request Body** :
```json
{
  "role": "ADMIN"
}
```

**Response 200** : Objet utilisateur mis à jour

---

### DELETE /users/:id

Désactivation d'un utilisateur (soft delete).

**Response 200** :
```json
{
  "message": "User deactivated successfully"
}
```

---

### PATCH /users/:id/activate

Réactivation d'un utilisateur désactivé.

**Response 200** : Objet utilisateur réactivé

---

## 📄 Gestion des documents

### POST /documents/upload

Upload d'un document PDF avec traitement LLM automatique.

**Headers** :
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data** :
- `file` : Fichier PDF (required)
- `department` : Département (required)
- `documentType` : Type de document (required)
- `logicalPath` : Chemin logique personnalisé (optional)

**Response 201** :
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "fileName": "demande_conge.pdf",
  "logicalPath": "harakat_raghad_AB123456/rh/demande_conge",
  "metadataPath": "harakat_raghad_AB123456/rh/demande_conge",
  "department": "RH",
  "documentType": "demande_conge",
  "documentStatus": "pending",
  "firstName": "raghad",
  "lastName": "harakat",
  "cin": "AB123456",
  "signatureDetected": true,
  "humanVerificationRequired": false,
  "scanDate": "2026-01-25T10:00:00.000Z",
  "minioPath": "harakat_raghad_AB123456/rh/demande_conge/demande_conge.pdf",
  "fileSize": 245678,
  "mimeType": "application/pdf",
  "uploadedBy": {
    "_id": "507f1f77bcf86cd799439011",
    "firstName": "safaa",
    "lastName": "ettalhi",
    "email": "user@example.com"
  },
  "metadata": {
    "department_description": "Ressources Humaines",
    "document_description": "Demande de congé",
    "document_type": "demande_conge",
    "document_status": "pending",
    "signature_detected": true,
    "human_verification_required": false,
    "scan_date": "2026-01-25T10:00:00.000Z",
    "archiving_manager": "507f1f77bcf86cd799439011"
  },
  "createdAt": "2026-01-25T10:00:00.000Z",
  "updatedAt": "2026-01-25T10:00:00.000Z"
}
```

**Erreurs** :
- `400 Bad Request` : Fichier non PDF ou champs manquants

---

### GET /documents

Récupération de tous les documents.

**Comportement** :
- **ADMIN** : Récupère tous les documents
- **ARCHIVE_MANAGER** : Récupère uniquement ses propres documents

**Response 200** :
```json
[
  {
    "_id": "507f1f77bcf86cd799439012",
    "fileName": "demande_conge.pdf",
    "logicalPath": "harakat_raghad_AB123456/rh/demande_conge",
    "department": "RH",
    "documentType": "demande_conge",
    "documentStatus": "pending",
    "firstName": "raghad",
    "lastName": "harakat",
    "cin": "AB123456",
    "signatureDetected": true,
    "humanVerificationRequired": false,
    "uploadedBy": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "safaa",
      "lastName": "ettalhi",
      "email": "user@example.com"
    },
    "createdAt": "2026-01-25T10:00:00.000Z",
    "updatedAt": "2026-01-25T10:00:00.000Z"
  }
]
```

---

### GET /documents/:id

Récupération d'un document par ID.

**Response 200** : Objet document complet

**Erreurs** :
- `404 Not Found` : Document introuvable

---

### GET /documents/:id/url

Génération d'une URL signée pour télécharger le document.

**Response 200** :
```json
{
  "url": "http://localhost:9000/archives/harakat_raghad_AB123456/rh/demande_conge/demande_conge.pdf?X-Amz-Algorithm=..."
}
```

**Note** : L'URL est valide pendant 1 heure par défaut.

---

### PATCH /documents/:id

Mise à jour des métadonnées d'un document.

**Permissions** :
- **ADMIN** : Peut modifier tous les documents
- **ARCHIVE_MANAGER** : Peut modifier uniquement ses propres documents

**Request Body** :
```json
{
  "firstName": "raghad",
  "lastName": "harakat",
  "cin": "AB123456",
  "department": "RH",
  "documentType": "demande_conge",
  "documentStatus": "valid"
}
```

**Tous les champs sont optionnels.**

**Response 200** : Document mis à jour

**Erreurs** :
- `403 Forbidden` : Pas la permission de modifier ce document
- `404 Not Found` : Document introuvable

---

### GET /documents/:id/history

Récupération de l'historique des modifications d'un document.

**Response 200** :
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "documentId": "507f1f77bcf86cd799439012",
    "userId": {
      "_id": "507f1f77bcf86cd799439011",
      "firstName": "safaa",
      "lastName": "ettalhi"
    },
    "action": "UPDATE_METADATA",
    "oldValue": {
      "documentStatus": "pending"
    },
    "newValue": {
      "documentStatus": "valid"
    },
    "description": "Statut modifié de pending à valid",
    "createdAt": "2026-01-25T11:00:00.000Z"
  }
]
```

**Actions possibles** :
- `CREATE_DOCUMENT` : Création d'un document
- `UPDATE_METADATA` : Modification des métadonnées
- `DELETE_DOCUMENT` : Suppression d'un document

---

### GET /documents/stats/advanced

Récupération des statistiques avancées (réservé aux ADMIN).

**Response 200** :
```json
{
  "total": 150,
  "byDepartment": [
    { "department": "RH", "count": 45 },
    { "department": "Finance", "count": 30 }
  ],
  "byStatus": [
    { "status": "valid", "count": 100 },
    { "status": "pending", "count": 40 },
    { "status": "incomplete", "count": 10 }
  ],
  "byType": [
    { "type": "demande_conge", "count": 50 },
    { "type": "contrat", "count": 30 }
  ],
  "verificationRequired": 15,
  "withSignature": 120,
  "last7Months": [
    { "month": "juil. 2025", "count": 10 },
    { "month": "août 2025", "count": 15 }
  ]
}
```

**Erreurs** :
- `401 Unauthorized` : Pas le rôle ADMIN

---

### DELETE /documents/:id

Suppression d'un document (fichier PDF et metadata.json dans MinIO + enregistrement MongoDB).

**Response 200** :
```json
{
  "message": "Document deleted successfully"
}
```

**Note** : L'audit log est enregistré avant la suppression.

---

## 🔒 Sécurité

### Authentification JWT

Toutes les routes protégées nécessitent un token JWT dans le header :

```
Authorization: Bearer <token>
```

### Gestion des erreurs

**Format standard d'erreur** :
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

**Codes d'erreur courants** :
- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Non authentifié ou identifiants invalides
- `403 Forbidden` : Pas les permissions nécessaires
- `404 Not Found` : Ressource introuvable
- `500 Internal Server Error` : Erreur serveur

---

## 📝 Notes importantes

1. **Format des dates** : Toutes les dates sont au format ISO 8601
2. **Taille maximale des fichiers** : Configurable (par défaut ~10MB)
3. **Format PDF uniquement** : Seuls les fichiers PDF sont acceptés
4. **URLs signées** : Les URLs de téléchargement expirent après 1 heure
5. **Pagination** : Actuellement gérée côté frontend (6 documents par page)

---

## 🔄 Exemples d'utilisation

### Exemple complet : Upload et modification

```bash
# 1. Connexion
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  | jq -r '.access_token')

# 2. Upload d'un document
curl -X POST http://localhost:3000/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf" \
  -F "department=RH" \
  -F "documentType=demande_conge"

# 3. Récupération des documents
curl -X GET http://localhost:3000/documents \
  -H "Authorization: Bearer $TOKEN"

# 4. Modification des métadonnées
curl -X PATCH http://localhost:3000/documents/DOCUMENT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"documentStatus":"valid"}'

# 5. Récupération de l'historique
curl -X GET http://localhost:3000/documents/DOCUMENT_ID/history \
  -H "Authorization: Bearer $TOKEN"
```
