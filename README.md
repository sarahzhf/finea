# Finéa - Coaching Financier

Finéa est une application mobile-first de coaching financier pour étudiants et jeunes actifs. 

## Fonctionnalités (MVP)
- **Authentification** via Firebase Auth
- **Dashboard** avec suivi des dépenses et objectifs
- **Suivi des opérations** (AJout manuel + Import Excel)
- **Objectif d'épargne** avec barre de progression
- **Scan de ticket** avec microservice OCR mock
- **Quiz Adaptatif** d'éducation financière
- **Chatbot** (OpenAI) avec contexte utilisateur
- **Copilote IA** simulant les scénarios patrimoniaux via méthode Monte Carlo
- **Microservice Python** pour exécuter les simulations complexes

## Stack Technique
- Frontend : Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend : Next.js API Routes, Firebase Auth, Firestore
- Data Science / Simulation : Python (FastAPI, NumPy, Pydantic)
- IA : Vercel AI SDK, OpenAI `gpt-4o-mini`

## Installation
1. Installer les dépendances du frontend :
   \`\`\`bash
   npm install
   \`\`\`
2. Configurer `.env.local`
3. Lancer le frontend localement :
   \`\`\`bash
   npm run dev
   \`\`\`
4. Lancer le service Python :
   \`\`\`bash
   cd apps/sim
   pip install -r requirements.txt
   uvicorn main:app --reload
   \`\`\`
5. Seeder Firestore pour le Quiz :
   \`\`\`bash
   node scripts/seed-quiz.js
   \`\`\`

## Architecture
Le projet suit une séparation stricte entre composants UI et logique Firebase. Le backend Next.js sécurise les appels via le SDK Admin Firebase.

Développé dans le cadre d'un projet étudiant Master 2.
