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
session Supabase. Les indicateurs restent vides tant que l'API métier n'est
pas disponible, afin de ne pas afficher de chiffres fictifs.

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
serveur.
