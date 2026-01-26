# Architecture de l'application DigiArch

## Vue d'ensemble

DigiArch est une plateforme de Gestion Électronique de Documents (GED) basée sur une architecture **monolithique modulaire** avec séparation claire entre le backend et le frontend.

## Architecture générale

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Pages      │  │  Components  │  │     API      │      │
│  │  (App Router)│  │  (shadcn/ui) │  │   Client     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Controllers  │  │   Services   │  │   Modules    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                            │                                │
│         ┌──────────────────┼──────────────────┐             │
│         │                  │                  │             │
│  ┌──────▼──────┐  ┌────────▼──────┐  ┌───────▼──────┐     │
│  │   MongoDB   │  │     MinIO     │  │  LLM (Groq)  │     │
│  │  (Database) │  │  (Storage)    │  │   (API)      │     │
│  └─────────────┘  └───────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## Stack technique

### Backend
- **Framework** : NestJS 11.x
- **Langage** : TypeScript 5.7
- **Base de données** : MongoDB (via Mongoose)
- **Stockage de fichiers** : MinIO
- **Authentification** : JWT (Passport)
- **Validation** : class-validator, class-transformer
- **LLM** : Groq API (llama-3.3-70b-versatile)

### Frontend
- **Framework** : Next.js 16.1 (App Router)
- **Langage** : TypeScript 5
- **Styling** : Tailwind CSS 4
- **UI Components** : shadcn/ui
- **HTTP Client** : Axios
- **State Management** : React Hooks (useState, useEffect)

## Architecture Backend

### Structure modulaire

Le backend suit l'architecture modulaire de NestJS avec les modules suivants :

#### 1. **AppModule** (Module racine)
- Point d'entrée de l'application
- Configuration globale (ConfigModule, MongooseModule)
- Import de tous les modules fonctionnels

#### 2. **AuthModule**
**Responsabilité** : Gestion de l'authentification et de l'autorisation

- **AuthService** : Gestion des utilisateurs, hashage des mots de passe (bcrypt), génération de tokens JWT
- **AuthController** : Endpoints `/auth/login`, `/auth/register`, `/auth/profile`
- **Guards** :
  - `JwtAuthGuard` : Vérification du token JWT
  - `RolesGuard` : Vérification des rôles (ADMIN, ARCHIVE_MANAGER)
- **Strategies** : `JwtStrategy` pour Passport
- **DTOs** : `LoginDto`, `RegisterDto`

#### 3. **UsersModule**
**Responsabilité** : Gestion des utilisateurs (réservé aux admins)

- **UsersService** : CRUD des utilisateurs, activation/désactivation
- **UsersController** : Endpoints `/users` (GET, POST, PATCH, DELETE)
- **Permissions** : Accès restreint aux ADMIN uniquement

#### 4. **DocumentsModule**
**Responsabilité** : Gestion complète du cycle de vie des documents

- **DocumentsService** : 
  - Upload de documents avec traitement LLM
  - Génération de chemins logiques
  - Gestion des métadonnées
  - Mise à jour des documents
  - Suppression
  - Statistiques avancées
- **DocumentsController** : Endpoints `/documents`
- **AuditService** : Enregistrement de l'historique des modifications
- **DTOs** : `UploadDocumentDto`, `UpdateMetadataDto`

#### 5. **LlmModule**
**Responsabilité** : Interaction avec les APIs LLM

- **LlmService** :
  - Extraction de texte depuis PDF (`pdf-parse`)
  - Extraction d'informations structurées (nom, prénom, CIN, département, type)
  - Détection de signature
  - Support multi-provider (Groq, OpenAI)

#### 6. **StorageModule**
**Responsabilité** : Gestion du stockage de fichiers

- **MinioService** :
  - Upload de fichiers PDF
  - Upload de fichiers JSON (metadata.json)
  - Génération d'URLs signées pour téléchargement
  - Suppression de fichiers
  - Gestion automatique du bucket

### Schémas de données (MongoDB)

#### User Schema
```typescript
{
  email: string (unique, required)
  password: string (hashed, required)
  firstName: string (required)
  lastName: string (required)
  role: 'ADMIN' | 'ARCHIVE_MANAGER' (required)
  isActive: boolean (default: true)
  createdAt: Date
  updatedAt: Date
}
```

#### Document Schema
```typescript
{
  logicalPath: string (required) // Chemin logique dans MinIO
  fileName: string (required)
  metadataPath: string (required)
  firstName?: string
  lastName?: string
  cin?: string
  department: string (required)
  documentType: string (required)
  documentStatus: 'pending' | 'valid' | 'incomplete' (required)
  signatureDetected: boolean (default: false)
  humanVerificationRequired: boolean (default: false)
  scanDate?: Date
  archivingManager?: string
  metadata: Record<string, any>
  uploadedBy: ObjectId (ref: User)
  minioPath: string (required)
  fileSize?: number
  mimeType?: string
  createdAt: Date
  updatedAt: Date
}
```

#### AuditLog Schema
```typescript
{
  documentId: ObjectId (ref: Document, required)
  userId: ObjectId (ref: User, required)
  action: 'CREATE_DOCUMENT' | 'UPDATE_METADATA' | 'DELETE_DOCUMENT' (required)
  oldValue?: Record<string, any>
  newValue?: Record<string, any>
  description?: string
  createdAt: Date
}
```

### Flux de traitement d'un document

```
1. Upload PDF
   ↓
2. Extraction du texte (pdf-parse)
   ↓
3. Appel LLM pour extraction d'informations
   ├─→ Nom, Prénom, CIN
   ├─→ Département, Type de document
   └─→ Détection de signature
   ↓
4. Génération du chemin logique
   ├─→ Avec CIN: nom_prenom_cin/departement/type/
   └─→ Sans CIN: departement/type_nom_prenom/
   ↓
5. Génération du nom de fichier unique
   ├─→ Vérification des doublons
   └─→ Incrément si nécessaire (document1.pdf, document2.pdf)
   ↓
6. Upload du PDF dans MinIO
   ↓
7. Génération des métadonnées JSON
   ↓
8. Upload de metadata.json dans MinIO
   ↓
9. Enregistrement dans MongoDB
   ↓
10. Enregistrement de l'audit log
```

## Architecture Frontend

### Structure des pages (App Router)

```
app/
├── page.tsx                    # Page d'accueil
├── login/page.tsx              # Authentification
├── register/page.tsx           # Inscription
├── dashboard/page.tsx          # Dashboard Archive Manager
├── admin/
│   ├── dashboard/page.tsx      # Dashboard Admin
│   └── users/page.tsx          # Gestion des utilisateurs
├── documents/
│   ├── page.tsx                # Liste des documents
│   └── verification/page.tsx   # Documents nécessitant vérification
└── upload/page.tsx             # Upload de documents
```

### Composants réutilisables

- **Logo** : Composant logo de l'application
- **UI Components** (shadcn/ui) :
  - Button
  - Card
  - Input

### Services API

- **api.ts** : Client Axios configuré avec intercepteurs pour JWT
- **auth.ts** : Fonctions d'authentification
- **documents.ts** : API client pour les documents

### Gestion d'état

- **Local Storage** : Stockage du token JWT et des données utilisateur
- **React Hooks** : useState, useEffect pour la gestion d'état locale
- **Pas de state management global** : Architecture simple avec hooks React

## Sécurité

### Authentification
- **JWT (JSON Web Tokens)** : Tokens signés avec expiration
- **Passport.js** : Stratégie JWT pour validation des tokens
- **Guards NestJS** : Protection des routes sensibles

### Autorisation
- **Role-Based Access Control (RBAC)** :
  - **ADMIN** : Accès complet, gestion des utilisateurs, statistiques avancées
  - **ARCHIVE_MANAGER** : Upload, modification de ses propres documents, consultation

### Validation
- **DTOs avec class-validator** : Validation des entrées côté backend
- **ValidationPipe global** : Validation automatique de toutes les requêtes

## Stockage

### MinIO
- **Bucket** : `archives` (configurable)
- **Structure** :
  ```
  archives/
  └── nom_prenom_cin/
      └── departement/
          └── type/
              ├── document.pdf
              └── metadata.json
  ```
- **URLs signées** : Génération d'URLs temporaires pour téléchargement sécurisé

### MongoDB
- **Collections** :
  - `users` : Utilisateurs de la plateforme
  - `documents` : Métadonnées des documents
  - `auditlogs` : Historique des modifications

## Principes de conception

### SOLID
- **Single Responsibility Principle (SRP)** : Chaque service/module a une responsabilité unique
- **Dependency Injection** : Utilisation de l'injection de dépendances de NestJS

### DRY (Don't Repeat Yourself)
- Services réutilisables
- Composants UI réutilisables
- Utilitaires partagés

### Séparation des préoccupations
- **Backend** : Logique métier, validation, sécurité
- **Frontend** : Présentation, interaction utilisateur
- **Base de données** : Persistance des données
- **Stockage** : Fichiers binaires

## Flux de données

### Upload de document
```
Frontend → POST /documents/upload
  ↓
Backend Controller → DocumentsService
  ↓
LlmService.extractTextFromPdf()
  ↓
LlmService.extractDocumentInfo()
  ↓
DocumentsService.generateLogicalPath()
  ↓
DocumentsService.generateUniqueFileName()
  ↓
MinioService.uploadFileWithName()
  ↓
DocumentsService.generateMetadata()
  ↓
MinioService.uploadBuffer() (metadata.json)
  ↓
DocumentModel.save() → MongoDB
  ↓
AuditService.logDocumentCreation()
  ↓
Response → Frontend
```

### Recherche de documents
```
Frontend → GET /documents
  ↓
Backend Controller → DocumentsService.findAll(userId?)
  ↓
DocumentModel.find() → MongoDB
  ↓
Populate uploadedBy
  ↓
Response → Frontend
  ↓
Filtrage côté client (recherche, département, type, statut, date)
  ↓
Pagination (6 documents par page)
```

## Performance

### Optimisations
- **Pagination** : Limitation du nombre de documents affichés
- **Filtrage côté client** : Pour les recherches rapides
- **Lazy loading** : Chargement des données à la demande
- **Index MongoDB** : Sur les champs fréquemment recherchés

### Scalabilité
- **Architecture modulaire** : Facilite l'ajout de nouvelles fonctionnalités
- **Services découplés** : Permet la mise à l'échelle indépendante
- **Stockage externe** : MinIO permet le stockage distribué

## Points d'amélioration futurs

1. **Cache** : Redis pour les requêtes fréquentes
2. **Queue** : Bull/BullMQ pour le traitement asynchrone des uploads
3. **CDN** : Pour la distribution des fichiers statiques
4. **Microservices** : Séparation en services indépendants si nécessaire
5. **Tests** : Augmentation de la couverture de tests
