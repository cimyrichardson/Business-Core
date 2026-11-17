# Business Core

Projet Ayiti AI Hackathon 2026.

## Authentification Supabase

L'inscription et la connexion utilisent Supabase Auth directement depuis le
frontend. Les informations de connexion sont dans `frontend/.env.local` et ne
sont pas versionnées. Copiez `frontend/.env.example` vers ce fichier, puis
remplacez `YOUR_SUPABASE_PUBLISHABLE_KEY` par la clé publishable du projet.

Dans Supabase, autorisez `http://localhost:3000/connexion` dans
**Authentication → URL Configuration → Redirect URLs**. L'inscription envoie
le nom et celui de l'entreprise comme métadonnées du compte. Si la confirmation
de l'adresse email est activée, l'utilisateur doit confirmer son adresse avant
de se connecter.

La clé publishable est prévue pour le navigateur. Ne mettez jamais une clé
`service_role` ou un mot de passe de base de données dans `NEXT_PUBLIC_*`.
Après connexion, l'utilisateur arrive sur `/dashboard`; cette route vérifie la
session Supabase. Le frontend envoie le jeton Supabase à l'API FastAPI pour
charger les indicateurs, produits, ventes et dépenses.

## API métier FastAPI

L'API est dans `backend/`. Elle vérifie les jetons auprès de Supabase Auth et
utilise la connexion PostgreSQL uniquement côté serveur. Les endpoints métier
exigent un jeton `Bearer`; `/health` reste public.

1. Appliquez d'abord la migration Supabase décrite ci-dessous.
2. Depuis PowerShell, créez l'environnement et installez les dépendances :

   ```powershell
   Set-Location backend
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   Copy-Item .env.example .env
   ```

3. Dans `backend/.env`, renseignez `DATABASE_URL` avec la chaîne PostgreSQL
   Supabase, ainsi que `SUPABASE_URL` et `SUPABASE_PUBLISHABLE_KEY` (copiez la
   clé publishable de `frontend/.env.local`). La chaîne de base de données
   contient un secret : gardez-la uniquement dans ce fichier ignoré par Git ou
   dans le gestionnaire de secrets de l'hébergeur.
4. Ajoutez `NEXT_PUBLIC_API_URL=http://localhost:8000` dans
   `frontend/.env.local`; cette URL n'est pas un secret.
5. Depuis `backend/`, démarrez l'API :

   ```powershell
   .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

6. Vérifiez `http://localhost:8000/health`, puis ouvrez
   `http://localhost:8000/docs` pour la documentation OpenAPI.

Les endpoints sont répertoriés dans
[`docs/api-endpoints.md`](./docs/api-endpoints.md). Les opérations produits,
ventes et dépenses sont limitées à la boutique associée au compte Supabase.
Une vente utilise le prix enregistré du produit; le backend calcule le total
et la migration PostgreSQL retire la quantité vendue du stock dans la même
transaction.

La page Assistant est encore un espace réservé. Son état actuel, son contrat
d'API cible, son architecture et ses recommandations d'implémentation sont
décrits dans [`docs/assistant-implementation.md`](./docs/assistant-implementation.md).
L'ordre prévu pour les fournisseurs IA est Gemini → Groq → OpenRouter; voir
[`docs/ai-provider-routing.md`](./docs/ai-provider-routing.md) pour le
fonctionnement de la chaîne de secours.
La conception de la communication par WhatsApp et Telegram, y compris les
opérations métier, les confirmations et l'audio, est décrite dans
[`docs/channels-whatsapp-telegram.md`](./docs/channels-whatsapp-telegram.md).

## Migration de la base

La migration initiale est dans
[`supabase/migrations/20261116092700_business_core_schema.sql`](./supabase/migrations/20261116092700_business_core_schema.sql).
Pour l'appliquer sans la CLI, ouvrez le **SQL Editor** du projet Supabase,
collez le contenu du fichier et exécutez-le une seule fois. La migration crée
les tables nécessaires au MVP, relie chaque nouvel utilisateur à son profil et
à sa boutique, et préserve les éventuelles anciennes lignes en les rattachant
à une boutique de migration.

Les tables métier ont RLS activé sans politiques d'accès direct pour
`anon`/`authenticated` : le navigateur utilise Supabase Auth, tandis que les
données métier passent par FastAPI avec une connexion PostgreSQL gardée côté
serveur. L'API vérifie le jeton Supabase et ajoute l'identifiant de boutique
aux requêtes; ne publiez jamais `DATABASE_URL` ni une clé `service_role`.
