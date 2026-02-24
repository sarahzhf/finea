# Contributing to Finéa

## Conventions Code & Processus de Dev

### 1. Typescript
- Strict mode activé.
- Tout nouveau fichier doit utiliser des schémas de validation (Zod) pour ses inputs/outputs.
- Les interfaces/types React doivent être préfixés et clairs.

### 2. Microservice Python
- Modèle MVC simple (routers, services, models).
- Typage strict avec Pydantic obligatoire.
- Tests avec `pytest` pour valider les formules de la simulation Monte Carlo.

### 3. Gestion des branches et Commits
- `main` : code stable, prêt pour production.
- Convention de commit : `[Ticket#] Type: Description claire`. 
  Ex: `[Ticket 0] Docs: Add project architecture`.

## Definition of Done (DoD) & Checklist Qualité
Pour qu'un ticket soit considéré terminé, il doit valider :

- [ ] Code complet et exécutable localement (web + sim-service).
- [ ] Typage TS strict respecté, pas de `any`.
- [ ] Gestion du chargement (`loading states`) sur les actions asynchrones.
- [ ] Design Responsive (Mobile-first, testé sur viewport mobile).
- [ ] Pydantic / Zod validation sur les routes (Python et Next.js).
- [ ] Console sans erreurs / warnings significatifs.
- [ ] Variables d'environnement nécessaires documentées.
- [ ] Si une fonction est modifiée, son impact sur les autres parties (Copilot, Dashboard) a été vérifié.
