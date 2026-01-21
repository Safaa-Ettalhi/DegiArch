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
git clone <votre-repo-github>
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

## 🔗 Liens

- **JIRA**: [Lien vers votre planification JIRA]
- **GitHub**: [Lien vers votre repository]

## 📝 Licence

[Votre licence]
