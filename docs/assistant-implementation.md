# Assistant Business Core — implementation et recommandations

## 1. Objectif

L'assistant aide les petits commerces haïtiens à comprendre leurs ventes, leurs
dépenses et leur stock. Les utilisateurs peuvent poser leurs questions en
créole haïtien, avec ou sans accents, et recevoir des réponses courtes en
créole. Les montants sont exprimés en gourdes (HTG).

L'assistant est un outil d'aide à la décision, pas un comptable certifié. Il
doit séparer les chiffres calculés par l'application des conseils qu'il formule
à partir de ces chiffres.

## 2. État actuel et périmètre

À la date de rédaction :

- La page `/asistan` affiche encore un espace réservé.
- Le backend fournit les données métier via FastAPI et PostgreSQL/Supabase.
- L'API possède des données utilisables pour les ventes, les dépenses, les
  produits, le stock et le résumé du dashboard.
- La route `POST /api/v1/assistant/ask` est planifiée, mais n'est pas encore
  implémentée.

### MVP recommandé

1. Une interface de chat web avec quelques questions suggérées.
2. Un modèle IA configuré côté backend, capable de comprendre les questions
   créoles et de choisir parmi les outils métier autorisés.
3. Des fonctions métier déterministes qui calculent les chiffres.
4. Un moteur de secours sans fournisseur d'IA, activé si le modèle est
   indisponible.
5. Des réponses créoles concises, affichant leur période, leurs faits et des
   recommandations utiles.
6. Des adaptateurs WhatsApp et Telegram vers le même Assistant, avec
   compréhension des messages vocaux.

Valider d'abord l'orchestrateur sur le web et le simulateur, puis raccorder les
canaux sans réimplémenter les outils métier. Reporter l'historique persistant
et tout agent autonome capable d'exécuter du code ou des opérations non
autorisées.

## 3. Architecture recommandée

```text
Page Next.js /asistan
        |
        | POST avec Bearer token Supabase
        v
FastAPI /api/v1/assistant/ask
        |
        +-- authentifier l'utilisateur
        +-- déduire business_id côté serveur
        +-- transmettre la question au modèle IA avec les outils autorisés
        +-- exécuter côté serveur les outils métier choisis et validés
        +-- faire formuler une réponse créole à partir des seuls résultats
        +-- utiliser le moteur déterministe si le modèle est indisponible
        |
        v
PostgreSQL / Supabase
```

Le navigateur appelle FastAPI, comme les autres fonctionnalités métier. Il ne
lit pas directement les tables Supabase et ne reçoit aucun secret de base de
données. La page réutilise le client et la gestion du jeton déjà présents dans
`frontend/src/lib/business-api.ts`.

Organiser le backend en petits modules suivant les conventions existantes :

- `assistant/routes.py` : endpoint HTTP, schémas de requête et réponse;
- `assistant/normalize.py` : normalisation, périodes et garde-fous;
- `assistant/tools.py` : fonctions de lecture métier;
- `assistant/messages_ht.py` : réponses de secours et messages créoles;
- `assistant/provider.py` : adaptateur vers le fournisseur du modèle IA.

Ce découpage est une proposition; il peut être adapté à la structure du
backend sans introduire de couches inutiles.

## 4. Contrat API proposé

### Requête

`POST /api/v1/assistant/ask`

En-tête obligatoire :

```http
Authorization: Bearer <access_token Supabase>
Content-Type: application/json
```

Corps :

```json
{
  "question": "Ki pwodwi ki vann pi plis semèn sa a ?"
}
```

La période peut être extraite du texte. Une option explicite `period` pourra
être ajoutée plus tard si l'interface en a besoin; au MVP, éviter de maintenir
deux sources de vérité pour la période.

### Réponse

```json
{
  "answer": "Semèn sa a, Diri 1 kg se pwodwi ki vann pi plis la: 12 inite.",
  "intent": "top_products",
  "period": {
    "start": "2026-11-10",
    "end": "2026-11-16",
    "label": "7 dènye jou yo"
  },
  "data": [
    {
      "product": "Diri 1 kg",
      "quantity": 12,
      "revenue_htg": 3000
    }
  ],
  "source": "fallback",
  "warnings": []
}
```

La forme de `data` dépend de l'intention; sa structure doit être documentée
dans les schémas backend et les types du frontend. `source` vaut `llm` lorsque
le modèle a formulé la réponse et `fallback` lorsque le moteur déterministe a
pris le relais. Ne jamais annoncer une réponse comme issue d'une IA si elle
vient du moteur de secours.

Erreurs recommandées : `401` si la session est absente ou invalide, `422` si
la requête est invalide, `429` si la limite de requêtes est atteinte et `503`
si un service nécessaire est indisponible. Une question simplement non prise
en charge devrait plutôt recevoir une réponse `200` avec une intention
`unknown` et une suggestion de question, pas une erreur serveur.

## 5. Intents et outils autorisés

Normaliser le texte avant toute détection : minuscules, accents supprimés,
ponctuation écartée, espaces consécutifs réduits. Accepter le créole avec ou
sans accents, ainsi que les formulations françaises courantes.

| Intention | Exemples | Outil métier |
|---|---|---|
| `sales_summary` | « Konbyen vant mwen fè jodi a ? », « Résume mes ventes » | `sales_summary(period)` |
| `expenses_total` | « Konbyen depans mwen fè mwa sa a ? » | `expenses_total(period)` |
| `top_products` | « Ki pwodwi ki vann pi plis semèn sa a ? » | `top_products(period)` |
| `low_stock` | « Ki pwodwi ki prèske fini ? » | `low_stock()` |
| `unknown` | Question hors périmètre ou ambiguë | Aucun; demander une précision |

Les outils sont des fonctions Python ordinaires et testables. Ils utilisent
SQLAlchemy et les modèles existants. Chaque requête doit être limitée au
`business_id` issu de l'utilisateur authentifié; le client ne fournit jamais
cet identifiant.

L'orchestrateur ne doit pouvoir appeler que cette liste fermée de fonctions.
Il n'exécute jamais du SQL, du code fourni par un utilisateur, ni une requête
choisie librement par un modèle.

### Périodes

Réutiliser les règles déjà définies dans `backend/app/periods.py` :

- « jodi a » : aujourd'hui;
- « semèn sa a » : période `7days`, aujourd'hui inclus;
- « mwa sa a » : période `month`;
- aucune période précisée : période `30days`, annoncée explicitement dans la
  réponse.

Toutes les bornes calendaires métier suivent le fuseau
`America/Port-au-Prince`. La période réellement utilisée doit toujours
apparaître dans la réponse.

## 6. Conseils et recommandations

Le modèle IA est requis pour comprendre les questions en langage naturel,
choisir un outil autorisé et formuler les recommandations. Les chiffres, eux,
restent calculés par les outils déterministes du backend : le modèle ne doit
jamais les inventer, les recalculer ou les modifier.

Exemples de règles prudentes :

- Stock au seuil minimal ou en dessous : signaler les produits à réapprovisionner.
- Ventes concentrées sur quelques produits : proposer de surveiller leur stock,
  sans prédire les ventes futures.
- Dépenses notables : indiquer le total et inviter à vérifier les catégories;
  ne pas qualifier une dépense d'anormale sans période de comparaison fiable.
- Absence de données : le dire explicitement et proposer d'enregistrer des
  ventes, des dépenses ou du stock.

Chaque conseil doit être relié à un fait présent dans `data`. Éviter les
affirmations causales, les prévisions présentées comme certaines et les
recommandations financières personnalisées. Ne pas appeler la différence
chiffre d'affaires moins dépenses « bénéfice net ».

## 7. Interface utilisateur

La page `/asistan` devrait inclure :

- un titre et une courte explication en créole;
- des suggestions de questions cliquables (ventes, dépenses, meilleurs
  produits, stock bas);
- une zone de conversation avec distinction visuelle entre utilisateur et
  assistant;
- un indicateur de chargement, un bouton d'envoi et l'envoi avec Entrée;
- une réponse qui montre la période, les faits et, séparément, les conseils;
- des états explicites pour absence de données, question non comprise,
  problème réseau et session expirée;
- une mise en page responsive et des messages accessibles aux lecteurs d'écran.

Au MVP, l'historique peut rester dans l'état local de la page. Ne pas persister
les messages tant qu'il n'y a pas de besoin produit clair et de politique de
rétention définie. Les questions suggérées ne doivent pas afficher de chiffres
de démonstration comme s'il s'agissait des données du commerçant.

## 8. Modèle IA requis et mode de secours

Le MVP doit intégrer un modèle IA fourni par un fournisseur configurable côté
backend. Le modèle comprend la question en créole, sélectionne un intent et
les outils autorisés, puis formule une réponse claire et des recommandations
fondées sur les résultats retournés. Il ne se connecte jamais directement à la
base de données. Tous les calculs financiers et les filtres par commerce sont
effectués et vérifiés par le backend.

L'ordre de fournisseurs retenu pour le projet est Gemini, puis Groq, puis
OpenRouter. Les identifiants de modèles restent configurables côté backend,
pas dans le frontend. Comparer les coûts, la qualité du créole haïtien, la
disponibilité, les garanties de confidentialité et la prise en charge de
l'appel d'outils. Valider les formulations locales avec un locuteur haïtien.
Les règles de configuration, de bascule et de tests sont détaillées dans
[`ai-provider-routing.md`](./ai-provider-routing.md).

Garde-fous :

- clé fournisseur uniquement dans les variables d'environnement backend;
- démarrage de l'Assistant en erreur explicite si le modèle requis n'est pas
  configuré en production; ne jamais prétendre qu'une réponse de secours est
  une réponse IA;
- délai d'attente, limites de coût et gestion explicite des erreurs du
  fournisseur;
- mode `fallback` fonctionnel lorsque le fournisseur est temporairement
  indisponible, avec mention claire de ce mode dans `source`;
- ne transmettre au modèle que l'intention, la période et les agrégats
  nécessaires, jamais la base entière, les jetons ou les données d'autres
  commerces;
- imposer une liste fermée d'outils et valider chaque appel avant exécution;
- valider les entrées et sorties avec des schémas;
- rejeter tout chiffre rédigé par le modèle qui ne correspond pas aux faits
  fournis, ou faire remplir les chiffres par un gabarit déterministe après
  réception de la réponse;
- maîtriser le coût, la taille des messages, la fréquence et la conservation
  des journaux;
- évaluer la qualité du créole avec un locuteur haïtien avant publication.

WhatsApp et Telegram sont des adaptateurs vers le même orchestrateur, pas des
implémentations séparées des règles métier. Le périmètre des opérations, la
liaison des comptes, la confirmation des écritures et le traitement audio sont
décrits dans [`channels-whatsapp-telegram.md`](./channels-whatsapp-telegram.md).

## 9. Sécurité et confidentialité

- Authentifier chaque demande avec le jeton Supabase existant.
- Déterminer le commerce côté serveur et appliquer le filtre
  `business_id` à chaque outil.
- Limiter longueur et fréquence des questions; ne pas accepter de HTML ou
  d'instructions opérationnelles dans les entrées.
- Ne pas exposer les erreurs SQL, les secrets, les prompts internes ou les
  données d'un autre commerce.
- Éviter de journaliser le texte intégral des conversations; si nécessaire,
  définir une durée de rétention et exclure les données sensibles.
- Les futures actions ayant un effet métier (par exemple créer une vente)
  requièrent un récapitulatif et une confirmation explicite. L'Assistant du
  MVP est en lecture seule.

## 10. Tests et critères d'acceptation

### Backend

- chaque intent reconnu avec accents, sans accents et avec variantes
  françaises prévues;
- période explicite, période par défaut, limites de dates et fuseau
  d'Haïti;
- commerce A incapable de lire les données du commerce B;
- réponse vide sans données inventées;
- montant HTG sérialisé en nombre entier;
- question inconnue, entrée trop longue, expiration/défaillance d'API;
- appels d'outils du modèle limités à la liste autorisée et au commerce courant;
- réponse réellement générée par le modèle, ainsi que délai dépassé, erreur
  fournisseur et bascule `fallback` clairement signalée.

### Frontend

- jeton transmis à l'API; aucune requête métier directe vers PostgreSQL;
- questions suggérées et soumission au clavier;
- affichage fidèle de `answer`, `period`, `data`, `source` et `warnings`;
- états chargement, vide, erreur et réessai;
- parcours utilisable sur mobile et au clavier.

### Critère de livraison

Un commerçant connecté peut demander en créole combien il a vendu, combien il
a dépensé, quels produits se vendent le mieux et quels produits sont en stock
bas. Le modèle IA comprend les questions et formule des recommandations; les
chiffres proviennent des outils métier, la période est indiquée et les données
absentes sont signalées honnêtement. Si le fournisseur est indisponible, le
moteur de secours fournit une réponse limitée et identifiée comme telle.

## 11. Ordre de réalisation

1. Figer les schémas request/response et les ajouter à la documentation OpenAPI.
2. Implémenter les outils de lecture métier et leurs tests de cloisonnement.
3. Comparer les fournisseurs, choisir un modèle adapté au créole et configurer
   l'ordre Gemini → Groq → OpenRouter et leurs secrets uniquement côté backend.
4. Implémenter l'orchestrateur avec appels d'outils contraints, validation des
   résultats et moteur déterministe de secours.
5. Ajouter `POST /api/v1/assistant/ask` derrière l'authentification existante.
6. Raccorder la page `/asistan` et valider les états du chat.
7. Faire relire les textes créoles par un locuteur natif et évaluer les
   réponses IA sur des questions représentatives et non sensibles.
8. Ajouter WhatsApp/Telegram comme canaux vers le même orchestrateur.

## Documents connexes

- [Présentation et règles métier du hackathon](./projet_hackathon_docs.md)
- [Contrat de l'API métier](./api-endpoints.md)
