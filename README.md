# 🌙 **Finéa — AI-powered Personal Finance Assistant**

Finéa est une application Next.js moderne offrant une expérience fluide et immersive pour gérer son budget.
Elle combine UI mobile-first, visualisations, 3D, et un coach financier animé basé sur l'IA.

# 🚀 **Features**
### 🧠 **Coach Financier (IA)**

* Chat intelligent basé sur OpenAI
* Conseils personnalisés
* Mascotte animée

### 💳 **Carte 3D Interactive**

* Carte bancaire en 3D (React Three Fiber)
* Flip 180° + parallax basé sur la souris
* Ombres réalistes et texture haute qualité

### 📊 **Gestion Budgétaire Complète**

* Budget
* Dépenses
* Épargne
* Dépenses inutiles
* Missions (gamification)
* Score financier

### 🧾 **OCR & Scan**

* Section “Scan”
* Scan des tickets & factures

### 🧮 **Modules Thématiques**

* Comptes
* Crédit
* Quiz
* Profil
* Réglages

### 📱 **Design Mobile First**

* Bottom bar style Revolut
* Animations fluides
* Components Radix UI + TailwindCSS
* UI cohérente et responsive

---

# 📁 **Project Structure**

```
finea/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Home
│   ├── api/chat/route.tsx          # AI Chat API
│   │
│   ├── budget/page.tsx             # Budget + 3D card
│   ├── coach/page.tsx              # Coach IA
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
│   ├── card3d.tsx                  # 3D Card (R3F)
│   ├── cardmesh.tsx
│   ├── coach_chat.tsx              # Chat UI
│   ├── fineamascotte.tsx           # Mascotte animations
│   ├── module_card.tsx             # Feature cards
│   ├── navbar.tsx                  # Top nav
│   └── sidebar-menu.tsx            # Bottom nav
│
├── public/
│   ├── icons/
│   └── textures/
│
├── styles/
├── hooks/
├── lib/
├── types/
│
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

# 🔧 **Tech Stack**

### **Frontend**

* **Next.js 15**
* **React 18**
* **TypeScript**
* **TailwindCSS**
* **Radix UI**
* **Framer Motion**

### **3D**

* **React Three Fiber**
* **@react-three/drei**
* **three.js**

### **AI / Backend**

* **OpenAI API (chat)**
* **Next.js Server Actions / Route Handlers**

### **Dev Tools**

* **GitHub Codespaces**
* **pnpm / npm**
* **ESLint / Prettier**

---

# 🛠️ Installation & Setup

## **1. Cloner le projet**

```bash
git clone https://github.com/sarahzhf/finea.git
cd finea
```

## **2. Installer les dépendances**

```bash
npm install
```

Si tu utilises Codespaces, Node & npm sont déjà installés.

---

# ⚙️ **Environment Variables (.env.local)**

Créer un fichier :

```
OPENAI_API_KEY=sk-xxxx
```

---

# ▶️ Lancer le projet

```bash
npm run dev
```

Le projet démarre sur :

```
http://localhost:3000
```

---

# 📦 **Important Notes**

### ✔️ Nécessaire pour faire fonctionner la 3D (R3F)

```
npm install @react-three/fiber@8.15.12 @react-three/drei@9.88.13 three@0.160.0
```

### ✔️ Tailwind + PostCSS (versions compatibles)

```
npm install tailwindcss@3.4.17 postcss@8.4.31 autoprefixer@10.4.20
```

### ✔️ React / Next version matching

```
npm install next@15.1.7 react@18.3.1 react-dom@18.3.1
```

---

# 📜 Scripts npm

```json
{
  "build": "next build",
  "dev": "next dev",
  "lint": "next lint",
  "start": "next start"
}
```

---

# ✔️ **Status**

* Frontend **100% fonctionnel**
* Budget + Carte 3D **OK**
* Mascotte + Chat IA **OK**
* Pages thématiques **OK**
* Zéro erreur bloquante dans TypeScript
