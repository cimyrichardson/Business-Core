# API métier Business Core

Base locale : `http://localhost:8000`  
Préfixe métier : `/api/v1`  
Format : JSON. Les montants sont des nombres entiers en gourdes HTG.

## Erreurs de connexion

Si l'API ne peut pas se connecter à PostgreSQL, elle renvoie `503 Service
Unavailable` avec un message de configuration. Vérifiez `DATABASE_URL` dans
`backend/.env`, notamment le nom d'utilisateur et le mot de passe de la base
Supabase, puis redémarrez l'API. Ne partagez pas cette URL : elle contient le
mot de passe de la base.

## Authentification et périmètre

Les routes métier destinées au navigateur exigent le jeton d'accès de la
session Supabase :

```http
Authorization: Bearer <access_token>
```

FastAPI vérifie le jeton auprès de Supabase Auth et trouve la boutique dans
`business_members`. Le frontend ne transmet jamais `business_id`; l'API le
déduit du compte authentifié et filtre toutes les lectures et écritures par
cet identifiant.

Les webhooks WhatsApp et Telegram ne reçoivent pas le Bearer token du
commerçant : ils vérifient la signature ou le secret configuré du fournisseur,
puis autorisent le contact à partir de sa liaison active en base.

## Endpoints disponibles

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/health` | État du service |
| GET | `/api/v1/dashboard/summary?period=7days` | Résumé sur `7days`, `month` ou `30days` |
| GET | `/api/v1/products?limit=100&offset=0` | Produits de la boutique |
| GET | `/api/v1/products/low-stock` | Produits actifs au seuil minimal ou en dessous |
| POST | `/api/v1/products` | Ajouter un produit |
| GET | `/api/v1/sales?period=30days` | Ventes récentes et nom du produit |
| POST | `/api/v1/sales` | Enregistrer une vente et réduire le stock |
| GET | `/api/v1/expenses?period=30days` | Dépenses récentes |
| POST | `/api/v1/expenses` | Enregistrer une dépense |
| GET | `/api/v1/channels/links` | État des liaisons WhatsApp/Telegram |
| POST | `/api/v1/channels/links` | Créer un code de liaison authentifié |
| DELETE | `/api/v1/channels/links/{channel}` | Révoquer une liaison |
| GET/POST | `/api/v1/channels/whatsapp/webhook` | Vérification Meta et messages entrants signés |
| POST | `/api/v1/channels/telegram/webhook` | Messages entrants avec secret webhook |

La page `/asistan` est actuellement un espace réservé; l'endpoint
`POST /api/v1/assistant/ask` n'est pas encore implémenté. Le contrat proposé,
les intents, les règles de sécurité et le plan de réalisation sont dans
[`assistant-implementation.md`](./assistant-implementation.md).
Les routes de liaison et webhooks sont décrites dans
[`channels-whatsapp-telegram.md`](./channels-whatsapp-telegram.md). Pour les
utiliser, appliquez également la migration des canaux et configurez les
secrets requis dans `backend/.env`.

Les périodes `7days` et `30days` incluent aujourd'hui et les jours précédents;
`month` commence le premier jour du mois courant. Les bornes de date utilisent
le fuseau `America/Port-au-Prince`.

## Création d'un produit

`POST /api/v1/products`

```json
{
  "name": "Diri 1 kg",
  "description": null,
  "purchase_cost_htg": 180,
  "unit_price_htg": 250,
  "stock_quantity": 40,
  "min_stock_quantity": 5
}
```

## Création d'une vente

`POST /api/v1/sales`

```json
{
  "product_id": "UUID",
  "quantity": 2,
  "payment_method": "cash"
}
```

Le prix unitaire est relu depuis le produit en base. Le backend calcule
`total_htg`; la contrainte et le trigger PostgreSQL refusent une quantité
supérieure au stock disponible.

## Création d'une dépense

`POST /api/v1/expenses`

```json
{
  "amount_htg": 75,
  "category": "Transpò",
  "spent_at": "2026-11-16",
  "description": "Livrezon"
}
```

## Résumé du dashboard

`GET /api/v1/dashboard/summary?period=7days` renvoie les totaux de ventes et
dépenses, le nombre de ventes, les cinq produits les plus vendus et jusqu'à
vingt produits en stock bas. `daily_activity` fournit une entrée par jour de la
période, y compris les jours sans mouvement, pour tracer les courbes de ventes
et de dépenses. Une réponse vide contient des totaux à zéro et une série
journalière à zéro; aucune donnée de démonstration n'est inventée par l'API.
