# Quick Start - API Supplier

Guide de démarrage rapide pour lancer l'API Supplier en 5 minutes.

## Prérequis

- Node.js 18+
- MongoDB installé et démarré
- Terminal/CMD

## Étape 1 - Installation (1 min)

```bash
cd c:\Users\rtard\rt-frontend-apps\apps\api-supplier
npm install
```

## Étape 2 - Configuration (30 sec)

Le fichier `.env` est déjà créé avec les valeurs par défaut.

Si MongoDB n'est pas sur localhost, éditer `.env`:
```env
MONGODB_URI=mongodb://votre-serveur:27017/rt-supplier
```

## Étape 3 - Peupler la Base de Données (30 sec)

```bash
npm run seed
```

Cela crée:
- 3 fournisseurs (SUP-2024-0001, SUP-2024-0002, SUP-2024-0003)
- 3 commandes
- 2 créneaux de chargement
- 1 signature
- 1 conversation

## Étape 4 - Démarrer l'API (10 sec)

```bash
npm run dev
```

L'API démarre sur http://localhost:3017

## Étape 5 - Tester (2 min)

### Health Check
```bash
curl http://localhost:3017/health
```

### Documentation
Ouvrir dans le navigateur: http://localhost:3017

### Tester un endpoint
```bash
curl http://localhost:3017/suppliers/me -H "x-supplier-id: SUP-2024-0001"
```

## Données de Test Créées

### Fournisseurs
| ID | Nom | Statut | Token |
|----|-----|--------|-------|
| SUP-2024-0001 | Fournisseur Acier Premium | active | - |
| SUP-2024-0002 | Composants Électroniques SA | active | - |
| SUP-2024-0003 | Plastiques Industriels SARL | invited | test-token-123 |

### Commandes
| ID | Fournisseur | Statut |
|----|-------------|--------|
| ORD-2024-0001 | SUP-2024-0001 | to_prepare |
| ORD-2024-0002 | SUP-2024-0002 | ready |
| ORD-2024-0003 | SUP-2024-0001 | in_progress |

## Tests Rapides

### 1. Profil Fournisseur
```bash
curl http://localhost:3017/suppliers/me \
  -H "x-supplier-id: SUP-2024-0001"
```

### 2. Liste des Commandes
```bash
curl "http://localhost:3017/orders?status=to_prepare" \
  -H "x-supplier-id: SUP-2024-0001"
```

### 3. Créneaux de Chargement
```bash
curl http://localhost:3017/slots \
  -H "x-supplier-id: SUP-2024-0001"
```

### 4. Accepter un Créneau
```bash
curl -X POST http://localhost:3017/slots/SLOT-202412-00001/accept \
  -H "x-supplier-id: SUP-2024-0001"
```

### 5. Changer Statut Commande
```bash
curl -X PUT http://localhost:3017/orders/ORD-2024-0001/status \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ready",
    "notes": "Marchandise prête"
  }'
```

### 6. Générer QR Code pour Signature
```bash
curl -X POST http://localhost:3017/signatures/qrcode/generate \
  -H "x-supplier-id: SUP-2024-0001" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-2024-0001",
    "type": "loading"
  }'
```

### 7. Liste des Conversations
```bash
curl http://localhost:3017/chats \
  -H "x-supplier-id: SUP-2024-0001"
```

### 8. Créer une Notification de Test
```bash
curl -X POST http://localhost:3017/notifications/test \
  -H "x-supplier-id: SUP-2024-0001"
```

## Collection Postman

Pour tester avec Postman, importer les exemples depuis `API_TESTS.md`.

Variables d'environnement à créer:
- `BASE_URL`: http://localhost:3017
- `SUPPLIER_ID`: SUP-2024-0001

## Endpoints Principaux

| Route | Description |
|-------|-------------|
| `/health` | Health check |
| `/` | Documentation |
| `/suppliers/me` | Profil fournisseur |
| `/orders` | Liste commandes |
| `/slots` | Créneaux de chargement |
| `/signatures/qrcode/generate` | Générer QR code |
| `/chats` | Conversations |
| `/notifications` | Notifications |

## Logs

Les logs s'affichent dans le terminal:
```
[2024-12-01T17:00:00.000Z] GET /health
[2024-12-01T17:00:01.000Z] GET /suppliers/me
```

## Arrêter l'API

Dans le terminal, appuyer sur `Ctrl+C`

## Problèmes Courants

### MongoDB non démarré
```bash
# Windows
net start MongoDB

# Linux/Mac
sudo systemctl start mongod
```

### Port 3017 déjà utilisé
Changer le port dans `.env`:
```env
PORT=3018
```

### Erreur "Module not found"
```bash
rm -rf node_modules
npm install
```

## Next Steps

1. ✅ API démarrée et testée
2. 📖 Lire `README.md` pour documentation complète
3. 🏗️ Lire `ARCHITECTURE.md` pour comprendre l'architecture
4. 🧪 Tester tous les endpoints via `API_TESTS.md`
5. 🔗 Connecter aux autres APIs (Tracking, Events, Orders)

## Support

- Documentation complète: `README.md`
- Tests détaillés: `API_TESTS.md`
- Architecture: `ARCHITECTURE.md`
- Synthèse: `SUMMARY.md`

---

**Temps total**: ~5 minutes
**Statut**: ✅ API opérationnelle avec données de test
