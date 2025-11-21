# Modifications en Cours - Tracker Central

**Dernière mise à jour** : 21 novembre 2025
**Objectif** : Centraliser toutes les modifications identifiées qui nécessitent une action ou une discussion

---

## 📊 Vue d'Ensemble

| Sujet | Priorité | Status | Date | Fichier Détails |
|-------|----------|--------|------|-----------------|
| Agrégation des votes | 🔴 P0 | 🟡 En cours | 21/11/2025 | [CORRECTION_ISSUES_AGGREGATION.md](../corrections/CORRECTION_ISSUES_AGGREGATION.md) |
| Architecture simplifiée (pas de backend) | 🔴 P0 | ✅ Fait | 21/11/2025 | [ARCHITECTURE_NO_BACKEND.md](./ARCHITECTURE_NO_BACKEND.md) |
| Autres modifications | ⚪ À définir | ⏳ À discuter | 21/11/2025 | Ce fichier |

---

## 1️⃣ Agrégation des Votes (P0)

**Status** : 🟡 Documentation complète, actions à exécuter

### Résumé
Correction du mécanisme d'agrégation des votes suite à la découverte que le protocole INTUITION v2 ne fait pas d'agrégation automatique par objet.

### Actions concrètes
- [ ] Créer issue #97 - Fonction d'agrégation
- [ ] Ajouter commentaires sur issues #33, #34, #43-47
- [ ] PR pour ajouter 3 prédicats dans ProposalModal

### Documentation complète
👉 Voir [CORRECTION_ISSUES_AGGREGATION.md](../corrections/CORRECTION_ISSUES_AGGREGATION.md)

---

## 2️⃣ Architecture Simplifiée - Pas de Backend (P0)

**Status** : ✅ Complété

### Résumé
Décision de ne pas implémenter de serveur backend. Toute la logique passe par le frontend avec interactions blockchain directes.

### Actions concrètes
- [x] ✅ Créer documentation ARCHITECTURE_NO_BACKEND.md
- [x] ✅ Créer issue #96 - Hook useWhitelist (vérification on-chain)
- [x] ✅ Créer issue #97 - Cache local (localStorage)
- [x] ✅ Annuler issue #100 - IPFS (SDK INTUITION gère déjà)
- [x] ✅ Fermer 10 issues backend (#51-57, #62-64)
- [x] ✅ Mettre à jour ISSUES_GITHUB.md

### Résultat
- **Économies** : ~$7/mois (Render hosting)
- **Complexité** : -50% (1 codebase au lieu de 2)
- **Sécurité** : Vérification trustless on-chain
- **Issues** : 69 au lieu de 74 (5 de moins au net)

### Documentation complète
👉 Voir [ARCHITECTURE_NO_BACKEND.md](./ARCHITECTURE_NO_BACKEND.md)

---

## 3️⃣ Autres Modifications À Discuter

**Status** : ⏳ À définir

### Notes
Paul a mentionné qu'il y a d'autres modifications dont il faut parler.

### Questions à clarifier
- [ ] Quelles modifications ?
- [ ] Sont-elles bloquantes pour l'agrégation ?
- [ ] Nécessitent-elles une documentation séparée ?

### Espace pour notes
```
[Réservé pour les prochaines discussions]




```

---

## 📝 Template pour Nouvelle Modification

Quand une nouvelle modification est identifiée, utiliser ce template :

```markdown
## X️⃣ [Titre de la Modification]

**Date de découverte** : JJ/MM/AAAA
**Priorité** : 🔴 P0 / 🟡 P1 / 🟢 P2 / ⚪ À définir
**Status** : ⏳ Identifié / 🟡 En cours / ✅ Fait / ❌ Bloqué

### Contexte
[Pourquoi cette modification est nécessaire]

### Problème actuel
[Décrit ce qui ne va pas ou ce qui manque]

### Impact
- **Code** : [Fichiers/composants concernés]
- **Issues** : [Numéros d'issues concernées]
- **Priorité** : [Pourquoi c'est urgent/important]

### Solution proposée
[Ce qu'on doit faire pour corriger]

### Actions concrètes
- [ ] Action 1
- [ ] Action 2
- [ ] Action 3

### Documentation
- [Lien vers doc détaillée si nécessaire]

### Notes
[Autres informations importantes]
```

---

## 🔄 Workflow de Gestion

### 1. Identification d'une modification
- Ajouter une nouvelle section avec le template ci-dessus
- Définir la priorité (P0, P1, P2)
- Documenter le "pourquoi"

### 2. Discussion
- Clarifier les questions
- Valider l'approche
- Définir les actions concrètes

### 3. Création de documentation détaillée (si nécessaire)
- Pour les modifications complexes, créer un fichier dédié
- Référencer ce fichier dans le tracker

### 4. Exécution
- Cocher les actions au fur et à mesure
- Mettre à jour le status

### 5. Clôture
- Marquer comme ✅ Fait
- Archiver si nécessaire

---

## 🗂️ Archives

Les modifications terminées seront déplacées ici pour garder le fichier propre.

### Modifications Complétées
_Aucune pour l'instant_

---

## 📎 Liens Utiles

- [ISSUES_GITHUB.md](./ISSUES_GITHUB.md) - Liste complète des issues
- [IMPLEMENTATION_STATUS.md](./03_TECHNOLOGIES/IMPLEMENTATION_STATUS.md) - État d'avancement
- [Vote_Aggregation_Research.md](./03_TECHNOLOGIES/Vote_Aggregation_Research.md) - Recherche agrégation

---

**Prochaine étape** : Discuter des "autres modifications" mentionnées par Paul
