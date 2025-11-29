# 🌙 Finéa — AI-powered Personal Finance Assistant

Finéa est une application Next.js moderne et immersive permettant de gérer son budget grâce à un coach financier basé sur l’IA

--------------------------------------------------------
🚀 FEATURES
--------------------------------------------------------

🧠 Coach Financier (IA)
- Chat intelligent (OpenAI)
- Mascotte animée
- Conseils personnalisés

💳 Carte 3D Interactive
- React Three Fiber
- Flip + parallax
- Ombres réalistes

📊 Gestion Budgétaire
- Budget
- Dépenses
- Épargne
- Achats inutiles
- Missions
- Quiz

🔍 OCR & Scan
- Scan tickets / factures

📱 Design Mobile First
- Bottom bar style Revolut
- Animations fluides
- TailwindCSS + Radix UI

--------------------------------------------------------
📁 PROJECT STRUCTURE
--------------------------------------------------------

finea/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                            # Home
│   ├── api/chat/route.ts                   # OpenAI API
│   │
│   ├── budget/page.tsx                     # Budget page
│   ├── budget/statistique/page.tsx         # Stats analytics
│   │
│   ├── coach/page.tsx
│   ├── comptes/page.tsx
│   ├── credit/page.tsx
│   ├── dep/page.tsx
│   ├── dep_inutiles/page.tsx
│   ├── epargne/page.tsx
│   ├── missions/page.tsx
│   ├── profil/page.tsx
│   ├── quiz/page.tsx
│   └── reglages/
│       ├── page.tsx
│       ├── scan/page.tsx
│       ├── score/page.tsx
│       └── searchbar/page.tsx
│
├── components/
│   ├── card3d.tsx
│   ├── cardmesh.tsx
│   ├── fineamascotte.tsx
│   ├── coach_chat.tsx
│   ├── module_card.tsx
│   ├── sidebar-menu.tsx
│   └── navbar.tsx
│
├── public/
│   ├── icons/
│   └── textures/
│
├── hooks/
├── lib/
├── types/
│
├── tailwind.config.ts
├── next.config.mjs
├── tsconfig.json
├── package.json
└── README.md

--------------------------------------------------------
🛠 INSTALLATION
--------------------------------------------------------

1. Cloner le projet :
  git clone https://github.com/sarahzhf/finea.git
  cd finea

2. Installer les dépendances :
  npm install

3. Ajouter la clé OpenAI :
  créer un fichier .env.local
  OPENAI_API_KEY=sk-xxxx

4. Lancer le projet :
  npm run dev

→ http://localhost:3000

--------------------------------------------------------
📱 TESTER SUR UN TÉLÉPHONE (MÊME WIFI)
--------------------------------------------------------

Lancer Next en exposant le réseau :
  npm run dev -- --hostname 0.0.0.0

Trouver l’IP locale du Mac :
  ipconfig getifaddr en0

Puis ouvrir depuis le téléphone :
  http://IP-LOCALE:3000

Exemple :
  http://192.168.1.34:3000

--------------------------------------------------------
📦 VERSIONS REQUISES (DÉJÀ CONFIGURÉES)
--------------------------------------------------------

React / Next :
  npm install next@15.1.7 react@18.3.1 react-dom@18.3.1

3D (R3F stable) :
  npm install @react-three/fiber@8.15.12 @react-three/drei@9.88.13 three@0.160.0

Tailwind :
  npm install tailwindcss@3.4.17 postcss@8.4.31 autoprefixer@10.4.20

--------------------------------------------------------
📤 GIT COMMANDS
--------------------------------------------------------

  git add .
  git commit -m "update"
  git push
