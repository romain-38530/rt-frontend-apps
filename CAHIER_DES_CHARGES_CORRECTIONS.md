# Cahier des Charges - Corrections RT-Frontend-Apps

**Date:** 2026-01-03
**Version:** 1.0
**Auteur:** Claude Code

---

## 1. CONTEXTE

Audit complet du monorepo rt-frontend-apps identifiant des erreurs de sécurité, TypeScript et de configuration nécessitant des corrections immédiates.

---

## 2. VULNERABILITES DE SECURITE (P0 - CRITIQUE)

### 2.1 Next.js - Multiple CVE

| CVE | Sévérité | Description | Impact |
|-----|----------|-------------|--------|
| GHSA-f82v-jwr5-mffw | CRITIQUE | Authorization Bypass in Middleware | Contournement auth |
| GHSA-gp8f-8m3g-qvj9 | HIGH | Cache Poisoning | Injection cache |
| GHSA-7gfc-8cq8-jh5f | HIGH | Authorization Bypass | Contournement auth |

**Action:** Mettre à jour `next` de 14.2.5 vers ≥14.2.25

**Apps concernées:**
- backoffice-admin
- marketing-site
- web-forwarder
- web-industry
- web-logistician
- web-recipient
- web-supplier
- web-transporter

### 2.2 jws - GHSA Signature Verification

| Package | Version actuelle | Version corrigée |
|---------|------------------|------------------|
| jws | 3.2.2 | ≥3.2.3 |

**Impact:** Vérification HMAC incorrecte permettant falsification JWT

### 2.3 glob - Command Injection

| Package | Version actuelle | Version corrigée |
|---------|------------------|------------------|
| glob | 10.3.10 | ≥10.5.0 |

---

## 3. ERREURS TYPESCRIPT PAR PACKAGE

### 3.1 api-admin (1 erreur)

**Fichier:** `src/routes/auth.ts:142`

**Problème:**
```typescript
jwt.sign(payload, secret, { expiresIn: '24h' })
```
Le type de `expiresIn` est incompatible avec la nouvelle version de jsonwebtoken.

**Solution:**
```typescript
jwt.sign(payload, secret, { expiresIn: '24h' } as jwt.SignOptions)
```

---

### 3.2 api-bourse-maritime (1 erreur)

**Fichier:** `src/services/matching-service.ts:322`

**Problème:** Propriété dupliquée dans object literal

**Solution:** Supprimer la propriété dupliquée

---

### 3.3 api-chatbot (10 erreurs)

**Fichiers concernés:**
- `src/index.ts:269,277` - Type callback incorrect
- `src/models/Message.ts:26` - ObjectId type
- `src/models/Ticket.ts:40,132,138,147-149` - Propriétés manquantes

**Solutions:**
1. Corriger le type de callback dans index.ts
2. Utiliser `Schema.Types.ObjectId` correctement
3. Ajouter les propriétés `sla`, `updatedAt`, `priority` à l'interface ITicket

---

### 3.4 api-recipient (23 erreurs)

**Fichiers concernés:**
- `src/routes/chat.ts` - Méthodes manquantes sur modèle
- `src/routes/deliveries.ts:406,425` - Optional chaining
- `src/routes/incidents.ts:385,433` - Type enum incorrect
- `src/routes/onboarding.ts` - Méthodes manquantes
- `src/routes/recipients.ts` - Méthodes manquantes

**Solutions:**
1. Ajouter méthodes au modèle IRecipientChat: `addMessage`, `markAsRead`, `archive`, `close`, `addParticipant`, `removeParticipant`
2. Ajouter optional chaining pour `delivery.unloading`
3. Ajouter "recipient" au type enum des incidents
4. Ajouter méthodes `generateContactId`, `generateSiteId` au modèle IRecipient

---

### 3.5 api-supplier (35+ erreurs)

**Types d'erreurs:**
- `TS7030: Not all code paths return a value` (25+)
- `TS2769: JWT sign()` (1)
- Variables non utilisées (5+)

**Solutions:**
1. Ajouter `return` explicite dans toutes les fonctions async
2. Corriger signature JWT comme api-admin
3. Préfixer variables non utilisées avec `_`

---

### 3.6 api-sales-agents (2 erreurs)

**Fichier:** `src/services/contract-generator.ts:137,147`

**Problèmes:**
1. PDFKit `text()` n'accepte pas `color` dans options
2. Callback signature incompatible

**Solutions:**
1. Utiliser `doc.fillColor()` avant `text()`
2. Corriger signature callback

---

### 3.7 Apps Web - Traduction manquante (5 apps)

**Fichiers:** `pages/team.tsx:264` dans:
- web-transporter
- web-logistician
- web-forwarder
- web-recipient
- web-supplier

**Problème:** Clé de traduction `unlimited` manquante

**Solution:** Ajouter dans chaque `lib/translations.ts`:
```typescript
unlimited: 'Illimité',
// EN: 'Unlimited'
// ES: 'Ilimitado'
// DE: 'Unbegrenzt'
// IT: 'Illimitato'
```

---

### 3.8 web-supplier - OrderStatus (1 erreur)

**Fichier:** `pages/orders/[id].tsx:16`

**Problème:** Statuts OrderStatus manquants dans STATUS_LABELS

**Solution:** Ajouter les statuts:
```typescript
pending: { label: 'En attente', color: 'gray', icon: 'clock' },
planification_auto: { label: 'Planification auto', color: 'blue', icon: 'cpu' },
affret_ia: { label: 'Affrètement IA', color: 'purple', icon: 'brain' },
echec_planification: { label: 'Échec planification', color: 'red', icon: 'x' },
accepted: { label: 'Accepté', color: 'green', icon: 'check' },
```

---

## 4. ORDRE DE PRIORITE DES CORRECTIONS

| Priorité | Tâche | Estimation |
|----------|-------|------------|
| P0 | Mise à jour Next.js | 10 min |
| P0 | Mise à jour jws/glob | 5 min |
| P1 | api-admin JWT | 5 min |
| P1 | api-supplier JWT + returns | 30 min |
| P1 | Traductions unlimited | 15 min |
| P2 | api-bourse-maritime | 5 min |
| P2 | api-chatbot modèles | 20 min |
| P2 | api-recipient méthodes | 30 min |
| P2 | api-sales-agents PDF | 10 min |
| P2 | web-supplier OrderStatus | 10 min |

---

## 5. TESTS DE VALIDATION

Après corrections:
1. `pnpm audit` - 0 vulnérabilités high/critical
2. `pnpm --filter @rt/* exec tsc --noEmit` - 0 erreurs
3. `pnpm build` - Build réussi sur tous les packages

---

## 6. LIVRABLES

- [ ] Toutes les dépendances mises à jour
- [ ] Tous les fichiers TypeScript corrigés
- [ ] Toutes les traductions ajoutées
- [ ] Build validé sans erreur
- [ ] Commit avec message descriptif
