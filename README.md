# DigiArch - Digitalisation Intelligente des Archives

Plateforme GED basée sur la numérisation et l'intelligence artificielle (LLM) pour automatiser la structuration et l'organisation des documents.

## 🎯 Objectif du projet

Développer une plateforme capable de :
- Centraliser les documents scannés
- Extraire et structurer automatiquement les informations clés
- Organiser les fichiers selon une arborescence logique
- Faciliter la recherche et la consultation des archives
- Réduire la saisie manuelle et les erreurs humaines

## 🛠️ Stack technique

- **Backend**: NestJS
- **Frontend**: Next.js + TypeScript + Tailwind CSS + shadcn/ui
- **Base de données**: MongoDB
- **Stockage de fichiers**: MinIO
- **IA / LLM**: Extraction et structuration des données
- **Format de documents**: PDF scannés

## 📋 Prérequis

- Node.js 18+ et npm
- Docker et Docker Compose
- Git

## 🚀 Installation

### 1. Cloner le repository

```bash
git clone "https://github.com/Safaa-Ettalhi/DegiArch.git"
cd DigiArch
```

### 2. Démarrer les services (MongoDB + MinIO)

```bash
docker-compose up -d
```

### 3. Configuration Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run start:dev
```

### 4. Configuration Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Éditer .env.local avec vos configurations
npm run dev
```

## 📁 Structure du projet

```
DigiArch/
├── backend/          # API NestJS
├── frontend/         # Application Next.js
├── docker-compose.yml
└── README.md
```

## 🔐 Variables d'environnement

Voir les fichiers `.env.example` dans chaque dossier pour la configuration détaillée.

## 📚 Documentation

- [Documentation technique](./docs/ARCHITECTURE.md)
- [Guide d'installation](./docs/INSTALLATION.md)
- [API Documentation](./docs/API.md)

## 📦 Dépendances externes

### Backend

#### Frameworks et Core
- **@nestjs/common** (^11.0.1) : Framework NestJS - Core du backend
- **@nestjs/core** (^11.0.1) : Core de NestJS
- **@nestjs/platform-express** (^11.0.1) : Intégration Express pour NestJS
- **reflect-metadata** (^0.2.2) : Support des métadonnées TypeScript pour les décorateurs

#### Base de données et ODM
- **@nestjs/mongoose** (^11.0.4) : Intégration Mongoose pour NestJS
- **mongoose** (^9.1.5) : ODM (Object Document Mapper) pour MongoDB

#### Authentification et sécurité
- **@nestjs/jwt** (^11.0.2) : Support JWT pour NestJS
- **@nestjs/passport** (^11.0.5) : Intégration Passport pour NestJS
- **passport** (^0.7.0) : Middleware d'authentification
- **passport-jwt** (^4.0.1) : Stratégie JWT pour Passport
- **bcrypt** (^6.0.0) : Hashage des mots de passe

#### Configuration et validation
- **@nestjs/config** (^4.0.2) : Gestion de la configuration (variables d'environnement)
- **class-validator** (^0.14.3) : Validation des DTOs avec décorateurs
- **class-transformer** (^0.5.1) : Transformation des objets (DTOs)

#### Stockage de fichiers
- **minio** (^8.0.6) : Client MinIO pour le stockage d'objets S3-compatible
- **multer** (^2.0.2) : Middleware pour l'upload de fichiers multipart/form-data

#### LLM et traitement de documents
- **@nestjs/axios** (^4.0.1) : Client HTTP Axios pour NestJS (appels API LLM)
- **pdf-parse** (^2.4.5) : Extraction de texte depuis les fichiers PDF

#### Utilitaires
- **rxjs** (^7.8.1) : Bibliothèque réactive utilisée par NestJS

### Frontend

#### Framework
- **next** (16.1.4) : Framework React avec SSR et routing
- **react** (^19.2.3) : Bibliothèque UI
- **react-dom** (^19.2.3) : Rendu React pour le DOM

#### Styling
- **tailwindcss** (^4) : Framework CSS utility-first
- **@tailwindcss/postcss** (^4) : Plugin PostCSS pour Tailwind

#### UI Components
- **lucide-react** (^0.562.0) : Bibliothèque d'icônes
- **class-variance-authority** (^0.7.1) : Gestion des variantes de composants
- **clsx** (^2.1.1) : Utilitaire pour combiner les classes CSS
- **tailwind-merge** (^3.4.0) : Fusion intelligente des classes Tailwind

#### HTTP Client
- **axios** (^1.13.2) : Client HTTP pour les appels API

### Services externes

#### Base de données
- **MongoDB** : Base de données NoSQL pour le stockage des métadonnées et utilisateurs

#### Stockage d'objets
- **MinIO** : Stockage d'objets S3-compatible pour les fichiers PDF et metadata.json

#### Intelligence Artificielle
- **Groq API** : Service LLM pour l'extraction d'informations structurées (modèle : llama-3.3-70b-versatile)
- **OpenAI API** (optionnel) : Alternative LLM supportée (modèle : gpt-4o-mini)

### Outils de développement

#### Backend
- **@nestjs/cli** (^11.0.0) : CLI NestJS pour la génération de code
- **typescript** (^5.7.3) : Compilateur TypeScript
- **eslint** (^9.18.0) : Linter JavaScript/TypeScript
- **prettier** (^3.4.2) : Formateur de code
- **jest** (^30.0.0) : Framework de tests
- **ts-jest** (^29.2.5) : Preset Jest pour TypeScript
- **supertest** (^7.0.0) : Tests HTTP pour les APIs

#### Frontend
- **typescript** (^5) : Compilateur TypeScript
- **eslint** (^9) : Linter
- **eslint-config-next** (16.1.4) : Configuration ESLint pour Next.js

## 🎯 Rôles des dépendances principales

### Backend

| Dépendance | Rôle |
|------------|------|
| **NestJS** | Framework backend modulaire avec injection de dépendances |
| **Mongoose** | Interface ODM pour MongoDB, gestion des schémas et requêtes |
| **Passport + JWT** | Authentification sécurisée avec tokens JWT |
| **MinIO** | Stockage distribué des fichiers PDF et métadonnées |
| **pdf-parse** | Extraction de texte depuis les PDF scannés |
| **Axios** | Appels HTTP vers les APIs LLM (Groq/OpenAI) |
| **class-validator** | Validation des données d'entrée (DTOs) |

### Frontend

| Dépendance | Rôle |
|------------|------|
| **Next.js** | Framework React avec routing, SSR et optimisations |
| **Tailwind CSS** | Framework CSS utility-first pour le styling |
| **Axios** | Client HTTP pour communiquer avec l'API backend |
| **shadcn/ui** | Composants UI réutilisables et accessibles |

### Services

| Service | Rôle |
|---------|------|
| **MongoDB** | Base de données pour utilisateurs, documents et audit logs |
| **MinIO** | Stockage d'objets pour fichiers PDF et metadata.json |
| **Groq API** | LLM pour extraction automatique d'informations structurées |


