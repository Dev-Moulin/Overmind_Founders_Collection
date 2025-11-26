# Atom Saver Backend - Auto-sauvegarde avec Git

## 🎯 Objectif

Créer un backend local qui sauvegarde automatiquement les atoms créés via l'interface admin dans les fichiers JSON, puis commit et push sur GitHub.

## 📋 Problématique

### Situation actuelle

1. **Interface admin** : Permet de créer des atoms (prédicats, totems) sur INTUITION testnet
2. **Fichiers JSON locaux** :
   - `packages/shared/src/data/predicates.json`
   - `packages/shared/src/data/totems.json`
3. **Problème** : Quand un atom est créé via l'interface, il existe on-chain mais n'est pas ajouté aux JSON
4. **Conséquence** : Les autres utilisateurs ne voient pas les nouveaux atoms dans les suggestions

### Pourquoi pas directement depuis le frontend ?

Le navigateur **ne peut pas** écrire dans des fichiers locaux pour des raisons de sécurité :
- Pas d'accès au système de fichiers
- Pas d'exécution de commandes git
- Sandbox de sécurité strict

## 🏗️ Architecture proposée : Option B (Backend Local + Git)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN crée "Phoenix" via AdminAuditPage                  │
│    ├─ Frontend appelle useIntuition.createAtom()            │
│    └─ Atom créé on-chain → termId: 0x123abc...              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Frontend appelle Backend Local (Express)                 │
│    POST http://localhost:3001/api/save-atom                 │
│    Body: { type: "totem", category: "animals",              │
│            label: "Phoenix", termId: "0x123abc..." }        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend lit le fichier JSON approprié                    │
│    - Si type="predicate" → predicates.json                  │
│    - Si type="totem" → totems.json (dans category)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend ajoute l'atom au JSON                            │
│    {                                                         │
│      "id": "phoenix",                                        │
│      "label": "Phoenix",                                     │
│      "termId": "0x123abc..."                                 │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Backend exécute les commandes Git                        │
│    git add packages/shared/src/data/totems.json             │
│    git commit -m "feat: add Phoenix totem (0x123abc...)"    │
│    git push origin feature/atoms-update                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. ✅ Fichier mis à jour sur GitHub                         │
│    - Historique traçable                                     │
│    - Backup automatique                                      │
│    - Paul valide la PR comme d'habitude                      │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Stack Technique

### Backend
- **Node.js** : Runtime JavaScript
- **Express** : Framework web minimaliste
- **CORS** : Permet au frontend (localhost:5173) d'appeler le backend (localhost:3001)
- **child_process** : Pour exécuter les commandes git

### Frontend
- **Fetch API** : Pour appeler le backend après création d'atom
- Pas de modification lourde de `AdminAuditPage.tsx`

## 📁 Structure du projet

```
Overmind_Founders_Collection/
├── apps/
│   ├── web/                      # Frontend Vite/React
│   │   └── src/pages/AdminAuditPage.tsx
│   └── atom-saver/               # Backend Express (NOUVEAU)
│       ├── package.json
│       ├── index.js              # Serveur Express
│       └── .gitignore
├── packages/
│   └── shared/
│       └── src/data/
│           ├── predicates.json   # Mis à jour par le backend
│           └── totems.json       # Mis à jour par le backend
└── package.json                  # Root avec scripts pnpm
```

## 🚀 Utilisation

### Phase 1 : Setup (une seule fois)

```bash
# Installer les dépendances
cd apps/atom-saver
pnpm install

# Retour à la racine
cd ../..
```

### Phase 2 : Développement (quand tu crées des atoms)

```bash
# Terminal 1 : Frontend
pnpm dev

# Terminal 2 : Backend local
pnpm dev:api
```

### Phase 3 : Créer des atoms

1. Ouvrir `http://localhost:5173/admin-audit`
2. Créer un prédicat ou un totem
3. ✅ Automatiquement :
   - Atom créé on-chain
   - JSON mis à jour localement
   - Commit + push sur GitHub
4. Valider la PR comme d'habitude

### Phase 4 : Production (site déployé)

- **Pas besoin du backend !**
- Les users lisent juste les JSON (déjà remplis)
- Ils créent des Triples directement sur INTUITION

## 🔒 Sécurité et bonnes pratiques

### Respect du workflow Git (README.md)

✅ **CE QUE LE BACKEND DOIT FAIRE** :
1. Créer une branche feature (ex: `feature/atoms-update-TIMESTAMP`)
2. Commit avec message clair
3. Push sur la branche
4. **JAMAIS** créer de PR automatiquement
5. **JAMAIS** marquer "Generated with Claude Code"
6. **JAMAIS** push sur `main` directement

❌ **CE QUE LE BACKEND NE DOIT JAMAIS FAIRE** :
- Créer une PR
- Ajouter "Co-Authored-By: Claude"
- Push sur main

### Format des commits

```bash
# ✅ BON
git commit -m "feat: add Phoenix totem (0x123abc...)"
git commit -m "feat: add 'is inspired by' predicate (0x456def...)"

# ❌ MAUVAIS
git commit -m "Generated with Claude Code"
git commit -m "Add atom"
```

### Gestion des erreurs

Le backend doit gérer :
- Fichier JSON invalide ou manquant
- Conflits Git (si quelqu'un d'autre a push)
- Permissions Git (authentification)
- Réseau indisponible

## 📊 Exemple de requête API

### POST /api/save-atom (Predicate)

```json
{
  "type": "predicate",
  "label": "is inspired by",
  "description": "X est inspiré par Y",
  "termId": "0x123abc..."
}
```

**Résultat** : Ajout dans `predicates.json`

```json
{
  "id": "is-inspired-by",
  "label": "is inspired by",
  "description": "X est inspiré par Y",
  "termId": "0x123abc...",
  "isDefault": false
}
```

### POST /api/save-atom (Totem)

```json
{
  "type": "totem",
  "category": "animals",
  "label": "Phoenix",
  "termId": "0x456def..."
}
```

**Résultat** : Ajout dans `totems.json` sous `animals`

```json
{
  "id": "phoenix",
  "label": "Phoenix",
  "termId": "0x456def..."
}
```

## 🎯 Avantages de cette approche

### ✅ Avantages

1. **Traçabilité** : Chaque atom créé = 1 commit Git
2. **Historique** : On voit qui a créé quoi et quand
3. **Backup automatique** : GitHub sauvegarde tout
4. **Déploiement auto** : Si Vercel/Netlify, redéploiement automatique
5. **Collaboration** : D'autres admins peuvent review les commits
6. **Pas de backend 24/7** : On lance le backend seulement quand on crée des atoms
7. **Gratuit** : Aucun coût de serveur

### ⚠️ Contraintes

1. **Git doit être configuré** : `git config user.name` et `user.email`
2. **Authentification GitHub** : SSH ou token
3. **Pas de conflits** : Ne pas modifier les JSON manuellement pendant l'utilisation
4. **Un seul admin à la fois** : Sinon risque de conflits Git

## 🔍 Alternative : GitHub Actions (Option C - Future)

Si on veut éliminer complètement le backend local, on peut utiliser GitHub Actions :

```
Frontend → GitHub Actions API → Actions clone/modifie/commit/push
```

**Avantages** :
- Zéro backend à maintenir
- Tout dans le cloud GitHub

**Inconvénients** :
- Plus complexe à setup
- Nécessite un token GitHub avec permissions write
- Latence plus élevée (Actions prennent 10-30s)

## 📝 TODO avant implémentation

### Recherches à faire

1. ✅ Vérifier que `child_process.exec` fonctionne bien pour git
2. ✅ Tester la gestion des conflits Git
3. ✅ Vérifier CORS entre localhost:5173 et localhost:3001
4. ⏳ Décider du format exact des noms de branches (timestamp ou autre ?)
5. ⏳ Vérifier si on doit vérifier l'authentification admin côté backend
6. ⏳ Définir la stratégie de gestion d'erreurs (retry ? rollback ?)

### Questions à clarifier

1. **Nom de branche** : `feature/atoms-update-TIMESTAMP` ou `feature/atoms-update-<label>` ?
2. **Plusieurs atoms à la fois** : Commit individuel ou groupé ?
3. **Rollback** : Si le commit échoue, on fait quoi ?
4. **Authentification backend** : On vérifie que c'est l'admin qui appelle ?
5. **Mode dev vs prod** : Le backend tourne-t-il en prod ou juste en dev ?

## 🚀 Prochaines étapes

1. **Valider cette documentation** avec Paul
2. **Faire les recherches** nécessaires (child_process, CORS, etc.)
3. **Créer une nouvelle branche** `feature/atom-saver-backend`
4. **Implémenter le backend Express**
5. **Modifier AdminAuditPage** pour appeler le backend
6. **Tester en local**
7. **Commit/Push et PR** pour validation

---

**Dernière mise à jour** : 25 novembre 2025
