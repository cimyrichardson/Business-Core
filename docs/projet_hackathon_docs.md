# Business Core — Projet Ayiti AI Hackathon 2026

**Équipe :** VYROX
**Produit :** Business Core
**Initiative IA expérimentale :** VYROXMIND
**Catégorie :** Agents pour l'économie réelle
**Durée :** 48 heures
**Version du document :** v5

> **Convention linguistique de ce document.** Le document technique est rédigé en français pour l'équipe. **Tout ce que voit ou entend l'utilisateur final est en créole haïtien** : interface, messages d'erreur, réponses de l'assistant, messages WhatsApp/Telegram, rapports automatiques, scénario de démo et pitch. Les textes créoles de ce document sont des propositions à faire relire par un locuteur natif de l'équipe avant la démo.

## 1. Présentation

Business Core est un assistant de gestion pour les petits commerces haïtiens. Il suit les ventes, les dépenses et les stocks en gourdes (HTG), et **vient à la rencontre du commerçant** : celui-ci reçoit ses résumés et ses alertes, et pose ses questions, directement dans une messagerie qu'il utilise déjà (WhatsApp en priorité, Telegram en secours), en créole. Il n'a pas besoin d'ouvrir la plateforme pour être informé.

La plateforme web reste disponible pour la saisie détaillée et le tableau de bord.

> **Principe central : les chiffres sont calculés par le backend. L'IA sert à comprendre la question et à expliquer le résultat. Elle ne calcule jamais.**

## 2. Problème, utilisateur et contexte

### Le problème

Dans beaucoup de petits commerces, les informations sont dispersées entre cahiers, feuilles de calcul, messages et mémoire du commerçant. Ventes, dépenses et stock sont rarement réunis, ce qui rend difficiles les décisions simples : quoi racheter, quoi mettre en avant, combien a été dépensé ce mois-ci. Et même quand un outil existe, il faut penser à l'ouvrir.

### L'utilisateur type (à confirmer avec l'équipe)

Une commerçante ou un commerçant qui tient une boutique de quartier (alimentation, pharmacie de quartier, quincaillerie, etc.), qui note ses ventes sur un cahier, qui utilise WhatsApp tous les jours et qui veut des réponses rapides, en créole, sans maîtriser un tableur.

### Contexte haïtien

- **Devise :** tous les montants sont en HTG.
- **Langue :** créole haïtien partout côté utilisateur. Le routeur de secours reconnaît aussi quelques mots français, car les commerçants mélangent souvent les deux.
- **Connectivité limitée :** le calcul et l'assistant de secours fonctionnent sans API IA externe. Le backend et l'interface nécessitent toutefois internet pour accéder à Supabase ; les canaux de messagerie nécessitent aussi internet (voir section 6.5).
- **Pratiques réelles :** les ventes informelles et le mobile money (par exemple MonCash) existent. Le MVP n'intègre aucun paiement réel ; le « mode de paiement » est une simple information saisie.
- **Boutique de démonstration :** une boutique fictive réaliste, 15 à 25 produits aux prix plausibles en HTG, avec des noms de produits en créole.

## 3. Objectifs du MVP

1. Démarrer localement avec une procédure documentée.
2. Charger des données de démonstration datées relativement à la date du jour.
3. Afficher un tableau de bord en créole.
4. Consulter et enregistrer des produits, ventes et dépenses.
5. Calculer les indicateurs métier de façon fiable et testée.
6. Traiter au moins quatre questions prédéfinies en créole, sur le web **et** par messagerie.
7. Envoyer automatiquement un résumé et des alertes de stock bas par messagerie.
8. Démontrer l'orchestration d'outils métier, avec un mode de secours sans modèle IA.
9. Présenter clairement les limites du prototype.

**Fonctionnalité bonus (si le temps le permet) :** enregistrer une vente par message, avec confirmation obligatoire.

**Hors périmètre des 48 heures :** comptabilité certifiée, paiements réels, intégrations bancaires ou mobile money, multi-entreprises complet, authentification complète, SMS/USSD, reconnaissance vocale, entraînement d'un grand modèle.

## 4. Technologies

### Backend

| Technologie | Utilité |
|---|---|
| Python 3.11 ou 3.12 | Langage backend |
| FastAPI + Uvicorn | API REST, webhooks, serveur de développement |
| Pydantic / pydantic-settings | Validation et configuration |
| SQLAlchemy + PostgreSQL (Supabase) | Accès à la base de données hébergée |
| APScheduler | Rapports et alertes planifiés |
| HTTPX | Appels sortants (API des messageries) et tests d'API |
| pytest | Tests automatisés |
| python-dotenv | Variables d'environnement |

### Frontend

| Technologie | Utilité |
|---|---|
| Node.js LTS et npm | Environnement JavaScript |
| React + TypeScript + Vite | Interface et serveur de développement |
| React Router | Navigation |
| Axios | Appels HTTP |
| Recharts (facultatif) | Graphiques |
| CSS simple ou Tailwind CSS | Styles |

### Canaux de messagerie

| Canal | Rôle | Remarques |
|---|---|---|
| **WhatsApp (API Cloud de Meta)** | Canal cible pour la démo | Jeton de test temporaire, nombre de numéros limité ; règles de facturation à vérifier (section 6.5) |
| **Telegram (API Bot)** | Canal de développement et de secours | Bot créé en quelques minutes ; le *long polling* évite d'avoir une URL publique |
| **Simulateur de canal** | Tests et démo sans API de messagerie | Endpoint interne qui imite un message entrant (section 6.4) ; le backend doit toujours joindre Supabase |
| SMS / USSD | Feuille de route | Hors périmètre des 48 heures |

### IA

- **Mode principal (facultatif) :** modèle de langage avec appel d'outils (*tool calling*). Le modèle choisit parmi une liste fermée de fonctions autorisées et rédige la réponse **en créole** à partir du résultat.
- **Mode de secours (obligatoire) :** routeur par mots-clés créole + modèles de phrases créoles écrits à la main. La démo doit fonctionner avec ce seul mode.
- **VYROXMIND :** composant expérimental facultatif, branché via un adaptateur ; présenté comme expérimental tant que ses performances ne sont pas évaluées.

**Pile recommandée pour aller vite :** React + TypeScript + Vite, FastAPI + SQLAlchemy + PostgreSQL sur Supabase. FastAPI reste l'unique API métier ; le frontend ne se connecte pas directement à la base. Ne multipliez pas les bibliothèques avant d'avoir un parcours fonctionnel.

## 5. Architecture

```text
Commerçant
  |-- WhatsApp / Telegram ---------+
  |-- Navigateur (React) ----------+
                                   v
                    Adaptateurs de canal (webhooks)
                    + API REST web
                                   |
                                   v
                      Backend FastAPI
                        +-- Routes API et webhooks
                        +-- Services métier (ventes, dépenses, stock, indicateurs, périodes)
                        +-- Orchestrateur
                        |     +-- Outils autorisés (fonctions des services)
                        |     +-- Fournisseur IA (LLM, VYROXMIND ou mock)
                        |     +-- Routeur de secours créole
                        |     +-- Actions en attente (confirmation de saisie)
                        +-- Planificateur (rapports, alertes)
                        +-- SQLAlchemy
                              |
                              v
                 PostgreSQL hébergé sur Supabase
```

Un seul orchestrateur sert tous les canaux : le web, WhatsApp, Telegram et le simulateur appellent la même fonction. Ajouter un canal revient à écrire un petit adaptateur.

### Vocabulaire honnête : agents ou outils ?

- **Outils métier :** fonctions Python déterministes (`top_products`, `expenses_total`, `low_stock`, `sales_summary`). Ce sont elles qui calculent.
- **Orchestrateur :** reçoit la question, choisit l'outil (tool calling si un modèle est disponible, sinon mots-clés), l'exécute et formate la réponse.
- **Conseiller :** produit des recommandations *à partir de résultats déjà calculés*, présentées séparément des faits.

Si l'équipe implémente un vrai appel LLM avec choix d'outils, elle peut parler d'agent. Sinon, elle parle d'« orchestration d'outils métier ». La démo reste valable dans les deux cas.

### Flux d'un message entrant

1. Le canal reçoit le message et appelle le webhook de l'adaptateur.
2. L'adaptateur vérifie l'authenticité de la requête, puis **identifie l'expéditeur** par son numéro (liste blanche).
3. Numéro inconnu → réponse fixe « Nimewo sa a pa anrejistre. » et fin du traitement.
4. L'orchestrateur normalise le texte, détecte l'intention et la période.
5. S'il y a une action en attente de confirmation (« wi » / « non »), il la traite.
6. Sinon, il appelle l'outil métier autorisé, qui interroge la base et calcule.
7. Le formateur produit une réponse courte en créole, adaptée au chat.
8. L'adaptateur renvoie la réponse par le même canal ; l'API web renvoie en plus les données justificatives.

### Format de réponse de l'orchestrateur (interne)

```json
{
  "answer": "Semèn sa a (7 dènye jou), pwodwi ki vann pi plis yo se ...",
  "intent": "top_products",
  "period": { "start": "2026-10-27", "end": "2026-11-02", "label": "7 dènye jou" },
  "data": [ { "product": "Diri 1 kg", "quantity": 42, "revenue_htg": 12600 } ],
  "source": "fallback",
  "warnings": []
}
```

`source` vaut `llm`, `vyroxmind` ou `fallback`. Le champ `warnings` signale les données manquantes ou une question non prise en charge.

**Interdit :** laisser le modèle exécuter du SQL ou du code libre, ou citer un chiffre absent du champ `data`.

## 6. Règles métier et communication

### 6.1 Montants

- Devise unique : HTG, séparateur de milliers lisible (« 12 600 HTG »).
- Jamais de nombres à virgule flottante pour l'argent : entiers (gourdes) ou `Decimal`.
- Le total d'une vente est toujours calculé par le backend (`quantité × prix unitaire`).

### 6.2 Ventes, stock et dépenses

- Quantité vendue strictement positive ; prix unitaire positif (par défaut, le prix du produit).
- Stock insuffisant → vente **refusée** avec un message clair ; pas de stock négatif.
- Enregistrement de la vente et mise à jour du stock dans **une seule transaction**.
- Produit inexistant → erreur explicite.
- **Stock bas :** un produit est sous son seuil lorsque `quantité <= seuil minimal`. Règle fixée une fois pour toutes et testée.
- Dépense : montant positif, catégorie et date obligatoires.

### 6.3 Périodes de temps

| Expression créole | Interprétation par défaut |
|---|---|
| « jodi a » | Jour courant |
| « semèn sa a » | 7 derniers jours glissants, aujourd'hui inclus |
| « mwa sa a » | Du 1er du mois courant à aujourd'hui |
| Aucune période précisée | 30 derniers jours, indiqués dans la réponse |

L'assistant précise toujours la période réellement utilisée. Les données de démonstration sont générées **relativement à la date du jour** (par exemple « il y a 0 à 45 jours »), pour que ces questions renvoient toujours des résultats. Le seed ajoute ou met à jour les données de démonstration sans effacer toute la base ; ne jamais commiter d'export de base ni de données réelles.

### 6.4 Assistant en créole

**Normalisation avant détection :** minuscules, suppression des accents (« stòk » et « stok » deviennent « stok »), suppression de la ponctuation, espaces normalisés. On accepte ainsi les écritures sans accent et les petites variations.

**Intentions et mots-clés** (liste à valider et à compléter par l'équipe ; ordre de priorité : dépenses, stock, produits les plus vendus, résumé) :

| Intention | Exemples de formulations | Mots-clés (après normalisation) |
|---|---|---|
| `expenses_total` | « Konbyen depans mwen genyen mwa sa a ? » | depans, depanse, frais |
| `low_stock` | « Ki pwodwi ki prèske fini ? », « Ki pwodwi ki anba limit stòk la ? » | stok, preske fini, pral fini, manke, anba limit, rupture |
| `top_products` | « Ki pwodwi ki vann pi plis semèn sa a ? » | pi plis, pi vann, meyè vant, plus vendus |
| `sales_summary` | « Fè m yon rezime vant yo pou peryòd la. » | rezime, vant, bilan, chif dafe, resume |

Les mots français courants (« dépenses », « résume », « plus vendus ») sont aussi acceptés, car les deux langues se mélangent à l'écrit.

**Modèles de réponses de secours (exemples) :**

- Produits les plus vendus : « {periode}, pwodwi ki vann pi plis yo se : 1) {p1} ({q1} vann), 2) {p2} ({q2} vann), 3) {p3} ({q3} vann). Chif dafè a se {total} HTG. »
- Dépenses : « {periode}, ou depanse {total} HTG an total. Pi gwo depans lan se {categorie} ({montant} HTG). »
- Stock bas : « Pwodwi sa yo prèske fini : {liste}. Gade stòk la anvan ou fini. »
- Aucun résultat : « Mwen pa jwenn okenn vant pou {periode}. »
- Question non comprise : « Mwen pa konprann kesyon an. Ou ka mande m : "Ki pwodwi ki vann pi plis semèn sa a ?", "Konbyen depans mwen genyen mwa sa a ?", "Ki pwodwi ki prèske fini ?", "Fè m yon rezime vant yo." »

**Si un modèle de langage est utilisé :** l'instruction système exige une réponse en créole haïtien, interdit d'ajouter tout chiffre absent des données fournies et interdit de répondre aux sujets hors gestion de la boutique. La qualité de son créole doit être évaluée avant la démo ; en cas de doute, la démo utilise les modèles de secours.

**Simulateur de canal :** `POST /api/v1/channels/simulate` reçoit `{ "phone": "...", "text": "..." }` et renvoie ce que le bot enverrait. Il sert aux tests automatiques et de plan B si une API de messagerie est indisponible ; le backend doit toujours avoir accès à Supabase.

### 6.5 Canaux de messagerie

#### Trois niveaux de fonctionnalités

1. **Questions-réponses (cœur du MVP).** Les quatre questions de démo, posées par message.
2. **Alertes et rapports automatiques (fort effet en démo).** Envoyés sans demande :
   - résumé de fin de journée et de fin de semaine ;
   - alerte quand un produit passe sous son seuil ;
   - rappel si aucune vente n'a été enregistrée depuis plusieurs jours.
3. **Saisie par message (bonus).** Voir ci-dessous.

#### Exemples de messages en créole

Rapport de fin de journée :

```text
Rapò jounen jodi a
Chif dafè : 18 450 HTG (23 vant)
Depans : 4 200 HTG
Pi plis vann : Diri 1 kg (14), Lwil 1 L (9)
Atansyon : Lwil 1 L prèske fini (3 rete).
```

Alerte de stock :

```text
Atansyon : Lwil 1 L anba limit stòk la. Rete 3 sou 5 minimòm.
```

Saisie avec confirmation (bonus) :

```text
Ou      : Mwen vann 3 diri
Bot     : Mwen konprann : 3 Diri 1 kg a 300 HTG = 900 HTG. Konfime ? (wi / non)
Ou      : wi
Bot     : Vant la anrejistre. Rete 39 Diri 1 kg nan stòk.
```

Règles de la saisie par message : correspondance prudente du produit (en cas de doute, le bot propose les choix), **confirmation obligatoire** avant tout enregistrement, action en attente qui expire au bout de quelques minutes, et un seul type d'action autorisé (vente).

#### Contraintes WhatsApp à vérifier avant de s'engager

- Meta délivre gratuitement un jeton de test temporaire, qui permet d'envoyer des messages de test à une liste restreinte de numéros vérifiés. C'est suffisant pour la démo.
- Les messages libres (réponses) envoyés dans la fenêtre de 24 heures suivant un message du client sont gratuits. Les messages envoyés **hors de cette fenêtre** (vos alertes automatiques) passent par des **modèles de messages** approuvés par Meta, et peuvent être facturés selon leur catégorie.
- La tarification a changé en 2025 (facturation par message) et change de nouveau à partir d'octobre 2026, avec un quota de messages de service gratuits par numéro et par mois. Les tarifs dépendent aussi du pays. **Consulter la page officielle de tarification de Meta avant de budgéter.**
- Les règles de Meta sur les assistants IA ont évolué récemment : un assistant limité à la gestion de la boutique est le cas d'usage le plus sûr. **Vérifier la politique en vigueur.**
- Les identifiants d'utilisateur WhatsApp évoluent (noms d'utilisateur, identifiant propre à l'entreprise) : le webhook peut ne pas toujours fournir un numéro de téléphone. Prévoir que l'identification se fasse sur l'identifiant fourni par le canal.
- Pour la démo, ouvrir la fenêtre de 24 heures en écrivant d'abord un message au bot, puis déclencher le rapport ou l'alerte.

#### Plan de secours des canaux

1. WhatsApp ne fonctionne pas → même scénario sur **Telegram**.
2. Une API de messagerie est indisponible → utiliser le simulateur de canal et l'interface web, à condition que le backend puisse toujours joindre Supabase.

Supabase, le backend hébergé et les canaux de messagerie ont besoin d'internet. Le mode de secours évite une dépendance à une API IA externe ou à un fournisseur de messagerie, mais ne permet pas de travailler sans accès à Supabase.

## 7. Fonctionnalités du MVP

### Tableau de bord (« Tablo bò »)

- Chiffre d'affaires (« Chif dafè ») sur une période.
- Total des dépenses (« Total depans »).
- Nombre de ventes (« Kantite vant »).
- Produits les plus vendus (« Pwodwi ki vann pi plis »).
- Produits sous leur seuil (« Pwodwi ki prèske fini »).

**Attention :** chiffre d'affaires moins dépenses enregistrées ne signifie pas automatiquement bénéfice net comptable. L'interface l'indique par une mention discrète, en créole.

### Produits et stocks (« Pwodwi ak stòk »)

- Créer et consulter un produit (nom, prix, coût d'achat facultatif, quantité, seuil minimal).
- Signaler les stocks bas.
- Vérifier la cohérence des quantités.

### Ventes (« Vant »)

- Enregistrer date, produit, quantité, prix, mode de paiement (information seulement).
- Mettre à jour le stock dans la même transaction.
- Consulter l'historique.

### Dépenses (« Depans »)

- Enregistrer montant, catégorie, date.
- Catégories proposées : *Acha machandiz, Lwaye, Transpò, Kouran ak gaz, Salè, Lòt*.

### Assistant (« Asistan »)

- Chat dans l'interface web.
- Mêmes questions par WhatsApp/Telegram.
- Rapports et alertes automatiques par messagerie.

Le système signale les données manquantes et les questions non prises en charge, avec des exemples de questions possibles.

### Textes de l'interface

Tous les textes sont centralisés dans un seul fichier (`frontend/src/i18n/ht.ts`) et dans un fichier de modèles côté backend (`assistant/messages_ht.py`), pour que la relecture par un locuteur natif porte sur deux fichiers seulement. Messages d'erreur d'exemple :

| Situation | Message proposé |
|---|---|
| Stock insuffisant | « Pa gen ase stòk pou vant sa a. » |
| Quantité invalide | « Kantite a dwe pi gran pase zewo. » |
| Produit inexistant | « Pwodwi a pa egziste. » |
| Montant invalide | « Montan an dwe pi gran pase zewo. » |
| Numéro non enregistré | « Nimewo sa a pa anrejistre. » |

## 8. Structure de fichiers

Structure allégée, suffisante pour le MVP. Ajouter un fichier seulement quand un besoin réel apparaît.

```text
business-core/
├── README.md
├── .gitignore
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/
│   │   ├── main.py              # app FastAPI, CORS, routes, démarrage du planificateur
│   │   ├── config.py            # paramètres (pydantic-settings)
│   │   ├── database.py          # moteur PostgreSQL et sessions SQLAlchemy
│   │   ├── models.py            # Product, Sale, Expense, Contact, PendingAction
│   │   ├── schemas.py           # schémas Pydantic
│   │   ├── routes/
│   │   │   ├── health.py
│   │   │   ├── dashboard.py
│   │   │   ├── products.py
│   │   │   ├── sales.py
│   │   │   ├── expenses.py
│   │   │   ├── assistant.py
│   │   │   ├── contacts.py      # numéros autorisés
│   │   │   └── channels.py      # webhooks WhatsApp/Telegram + simulateur
│   │   ├── services/
│   │   │   ├── products.py
│   │   │   ├── sales.py         # vente + mise à jour du stock
│   │   │   ├── expenses.py
│   │   │   ├── dashboard.py
│   │   │   ├── periods.py       # règles de dates
│   │   │   └── reports.py       # contenu des rapports et alertes
│   │   ├── assistant/
│   │   │   ├── orchestrator.py
│   │   │   ├── tools.py         # fonctions autorisées
│   │   │   ├── fallback.py      # normalisation + routeur par mots-clés
│   │   │   ├── messages_ht.py   # modèles de phrases en créole
│   │   │   ├── pending.py       # confirmation des saisies
│   │   │   └── provider.py      # mock / LLM / VYROXMIND
│   │   ├── channels/
│   │   │   ├── base.py          # interface commune (recevoir, envoyer)
│   │   │   ├── telegram.py
│   │   │   ├── whatsapp.py
│   │   │   └── simulator.py
│   │   ├── scheduler.py         # rapports quotidiens/hebdo, alertes de stock
│   │   └── seed.py              # données de démo relatives à la date du jour
│   ├── migrations/              # migrations Alembic du schéma PostgreSQL
│   └── tests/
│       ├── conftest.py
│       ├── test_sales.py        # priorité : cohérence du stock
│       ├── test_periods.py
│       ├── test_dashboard.py
│       ├── test_assistant.py    # questions créoles, variantes sans accents
│       └── test_channels.py     # numéro inconnu, confirmation, simulateur
├── frontend/
│   ├── package.json
│   ├── index.html
│   ├── vite.config.ts
│   ├── .env.example
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── i18n/ht.ts           # tous les textes en créole
│       ├── pages/               # Dashboard, Products, Sales, Expenses, Assistant
│       ├── components/
│       ├── services/            # apiClient.ts et services par ressource
│       └── types/
└── docs/
    ├── api-endpoints.md
    └── demo-script.md
```

## 9. Endpoints API

Préfixe : `/api/v1` (sauf `/health`).

| Méthode | Endpoint | Fonction |
|---|---|---|
| GET | `/health` | Vérifier l'API |
| GET | `/api/v1/dashboard/summary?period=` | Indicateurs |
| GET | `/api/v1/products` | Lister les produits |
| POST | `/api/v1/products` | Créer un produit |
| GET | `/api/v1/products/low-stock` | Stocks bas |
| GET | `/api/v1/sales` | Lister les ventes |
| POST | `/api/v1/sales` | Enregistrer une vente |
| GET | `/api/v1/expenses` | Lister les dépenses |
| POST | `/api/v1/expenses` | Enregistrer une dépense |
| POST | `/api/v1/assistant/ask` | Poser une question (web) |
| GET, POST | `/api/v1/contacts` | Lister / ajouter un numéro autorisé |
| GET, POST | `/api/v1/channels/whatsapp/webhook` | Vérification du webhook (GET) et messages entrants (POST) |
| POST | `/api/v1/channels/telegram/webhook` | Messages entrants Telegram (si webhook) |
| POST | `/api/v1/channels/simulate` | Simuler un message entrant (tests, démo sans API de messagerie) |
| POST | `/api/v1/reports/send-now` | Déclencher un rapport ou une alerte (démo) |

**À faire en premier :** figer les formats JSON dans `docs/api-endpoints.md` pour que frontend et backend avancent en parallèle.

### Modèle de données ajouté pour les canaux

- `contacts` : identifiant du canal ou téléphone, nom, canal (`whatsapp`, `telegram`), actif oui/non.
- `pending_actions` : contact, type d'action (`create_sale`), données, date d'expiration, état.

## 10. Répartition des tâches

### Développeur 1 : backend, données, canaux

- FastAPI, SQLAlchemy, PostgreSQL sur Supabase, modèles, schémas, routes.
- Règles de ventes, dépenses, stock et périodes (section 6).
- Seed relatif à la date du jour.
- Webhooks, contacts, vérification des signatures, planificateur de rapports et d'alertes.
- Tests prioritaires : vente et stock, périodes, numéro inconnu, simulateur.

**Livrables :** API, base initialisée, calculs testés, canaux fonctionnels, documentation des endpoints.

### Développeur 2 : frontend, assistant, textes créoles

- React, TypeScript, Vite ; navigation, tableau de bord, pages de saisie, fichier de textes `ht.ts`.
- Orchestrateur, routeur de secours créole, modèles de réponses (avec le développeur 1).
- Chat de l'assistant sur le web.
- Scénario de démonstration et pitch en créole.

**Livrables :** interface en créole, assistant, démonstration.

### Travail partagé

- Définir tôt les formats JSON et endpoints.
- **Faire relire les textes créoles par un locuteur natif.**
- Revues de code courtes ; tests sur les deux ordinateurs.
- **Figer le scénario de démo dès les premières heures** (section 16).

## 11. Prérequis

```bash
python --version
node --version
npm --version
git --version
```

Utiliser Python 3.11 ou 3.12 et une version LTS de Node.js. Sous Windows, la commande Python peut être `py`.

Pour les canaux :

- **Supabase :** créer un projet pour le développement, choisir une région proche des utilisateurs et récupérer l'URL de connexion PostgreSQL dans les paramètres de base de données. Utiliser un projet séparé pour les tests si possible.
- **Telegram :** créer un bot via BotFather et noter son jeton (ne jamais le commiter).
- **WhatsApp :** créer une application développeur Meta et un compte WhatsApp Business, récupérer le jeton de test et ajouter les numéros de test autorisés. Pour recevoir les webhooks en local, il faut une URL publique temporaire (par exemple via un outil de tunnel comme ngrok). Prévoir ce temps de configuration tôt dans le plan.

## 12. Créer et démarrer le backend

### macOS / Linux

```bash
mkdir -p business-core/backend
cd business-core/backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
```

### Windows PowerShell

```powershell
mkdir business-core\backend
cd business-core\backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

Si PowerShell bloque l'activation, utiliser l'invite de commandes et `.\.venv\Scripts\activate.bat`.

Créer un projet Supabase et définir `DATABASE_URL` dans `backend/.env` avec l'URL PostgreSQL du projet. Pour l'application FastAPI, privilégier la chaîne de connexion PostgreSQL du pooler Supabase en mode session ; encoder le mot de passe conformément au format d'URL. Ne jamais utiliser cette chaîne dans le frontend.

`backend/requirements.txt` :

```text
fastapi
uvicorn[standard]
sqlalchemy
psycopg[binary]
alembic
pydantic-settings
python-dotenv
httpx
apscheduler
pytest
```

Initialiser Alembic une seule fois, puis configurer `migrations/env.py` pour charger les modèles et `DATABASE_URL`. Après chaque changement de schéma, créer et appliquer la migration avant le seed :

```bash
alembic init migrations
alembic revision --autogenerate -m "schema initial"
alembic upgrade head
```

Ne pas recréer ni vider automatiquement la base au démarrage de l'API.

Installer puis démarrer (après avoir créé `app/main.py` et configuré la connexion Supabase) :

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API : `http://127.0.0.1:8000`
- Documentation interactive : `http://127.0.0.1:8000/docs`
- Santé : `http://127.0.0.1:8000/health`

## 13. Créer et démarrer le frontend

Dans un **deuxième terminal**, depuis la racine du projet :

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
npm install axios react-router-dom recharts
npm run dev
```

L'interface est généralement disponible à `http://localhost:5173`.

```bash
npm run build
npm run preview
```

## 14. Relier frontend et backend

`frontend/.env` :

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

`frontend/src/services/apiClient.ts` :

```typescript
import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
});
```

Configurer CORS dans FastAPI pour autoriser `http://localhost:5173` en développement. Ne pas autoriser toutes les origines en production sans justification.

## 15. Configuration et commandes quotidiennes

### `.gitignore` à la racine

```gitignore
__pycache__/
*.py[cod]
.venv/
venv/
.pytest_cache/
.ruff_cache/
.env
.env.*
!.env.example
node_modules/
dist/
.vscode/
.DS_Store
Thumbs.db
```

### `backend/.env.example`

```env
APP_NAME=Business Core API
APP_ENV=development
DATABASE_URL=postgresql+psycopg://postgres.[PROJECT-REF]:[PASSWORD]@[POOLER-HOST]:5432/postgres
FRONTEND_ORIGIN=http://localhost:5173

AI_PROVIDER=mock
AI_API_KEY=

CHANNELS_ENABLED=simulator
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_APP_SECRET=

REPORT_DAILY_TIME=18:00
REPORT_TIMEZONE=America/Port-au-Prince
```

`AI_PROVIDER=mock` active le mode de secours sans modèle distant. `CHANNELS_ENABLED` accepte une liste (`simulator`, `telegram`, `whatsapp`). Aucune de ces valeurs secrètes ne doit apparaître dans le dépôt.

`DATABASE_URL` contient les identifiants PostgreSQL Supabase : le garder uniquement dans `backend/.env` ou dans le gestionnaire de secrets de l'hébergeur. FastAPI accède aux tables via SQLAlchemy ; le frontend ne reçoit ni cette URL ni une clé `service_role`. Le backend valide les autorisations et les entrées. Ne pas activer de politiques RLS qui bloqueraient le compte PostgreSQL utilisé par FastAPI sans avoir défini et testé le contexte d'autorisation correspondant. Le schéma doit être créé avant le seed ; exécuter le seed de démonstration uniquement sur le projet prévu et ne pas supprimer les tables ou données partagées.

### `frontend/.env.example`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Commandes quotidiennes

Backend (depuis `backend/`, environnement virtuel activé) :

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pytest -q
```

Frontend (depuis `frontend/`) :

```bash
npm run dev
npm run build
```

Git (depuis la racine) :

```bash
git init
git add .
git commit -m "Initialisation de Business Core"
```

Ne jamais commiter `.env`, les jetons, les clés API, les identifiants de connexion Supabase ni un export de la base de données.

## 16. Scénario de démonstration (à figer tôt)

Durée cible : 4 minutes. Une seule boucle, répétée plusieurs fois, **racontée en créole**.

1. **Contexte (20 s) :** la boutique fictive et sa propriétaire. Le téléphone est déjà branché sur l'écran.
2. **L'info vient au commerçant (40 s) :** un rapport de fin de journée arrive sur WhatsApp, avec une alerte « Lwil 1 L prèske fini ».
3. **Questions par message (60 s) :** poser deux questions en créole (par exemple « Ki pwodwi ki vann pi plis semèn sa a ? » et « Konbyen depans mwen genyen mwa sa a ? ») et montrer les réponses avec la période utilisée.
4. **Vente et stock (40 s) :** enregistrer une vente (par le web, ou par message avec confirmation si le bonus est prêt). Le stock baisse et le produit passe en alerte.
5. **Tableau de bord (30 s) :** montrer que les chiffres du web correspondent à ceux reçus par message.
6. **Fiabilité (20 s) :** poser une question hors périmètre pour montrer le message clair en créole ; préciser que les chiffres viennent du backend, pas de l'IA.
7. **Plan de secours (10 s) :** expliquer le mode sans API IA et le simulateur de canal ; Supabase reste nécessaire.
8. **Limites et suite (20 s) :** ce que le prototype ne fait pas ; feuille de route (SMS/USSD, notes vocales, mobile money).

Le détail exact (questions, réponses attendues, ordre) est consigné dans `docs/demo-script.md`.

## 17. Tests avant la démo

- [ ] Le backend démarre sans erreur ; le frontend démarre et communique avec lui.
- [ ] Le backend se connecte au projet Supabase prévu ; le schéma et les données de démonstration sont prêts, avec des dates relatives à aujourd'hui.
- [ ] Les chiffres du tableau de bord correspondent aux données de test.
- [ ] Une vente met à jour le stock correctement, dans une seule transaction.
- [ ] Une vente avec stock insuffisant ou quantité invalide est refusée avec un message créole clair.
- [ ] Les stocks bas sont détectés selon la règle fixée.
- [ ] « jodi a », « semèn sa a », « mwa sa a » et l'absence de période donnent les bonnes plages, affichées dans la réponse.
- [ ] Les quatre questions en créole fonctionnent, avec et sans accents, en mode de secours.
- [ ] Une question non prise en charge renvoie le message d'aide en créole.
- [ ] Un numéro non enregistré reçoit « Nimewo sa a pa anrejistre. » et rien d'autre.
- [ ] Les webhooks rejettent une requête dont la signature ou le secret est invalide.
- [ ] Le rapport quotidien et l'alerte de stock partent, via `reports/send-now` et via le planificateur.
- [ ] (Bonus) La saisie par message demande confirmation, expire après le délai, et n'enregistre rien sans « wi ».
- [ ] Les textes créoles ont été relus par un locuteur natif.
- [ ] Le scénario complet a été répété avec WhatsApp, avec Telegram et avec le simulateur (backend connecté à Supabase).

## 18. Plan de travail sur 48 heures

| Phase | Contenu | Repère |
|---|---|---|
| 1. Cadrage | Boutique fictive, produits en créole, questions, formats JSON, scénario de démo, projet Supabase et comptes Telegram/Meta à créer | Heures 0–3 |
| 2. Base technique | Backend et frontend démarrent, `/health`, CORS ; **bot Telegram qui répond « bonjour »** | Heures 3–8 |
| 3. Fonctions métier | Produits, ventes + stock, dépenses, périodes, indicateurs, seed | Heures 8–20 |
| 4. Interface | Tableau de bord et formulaires en créole (`ht.ts`) | Heures 14–28 |
| 5. Assistant | Outils, routeur de secours créole, modèles de réponses ; puis modèle si le temps le permet | Heures 20–34 |
| 6. Canaux | Adaptateurs, liste blanche, rapports et alertes planifiés, simulateur ; WhatsApp après Telegram | Heures 26–40 |
| 7. Fiabilisation | Tests, relecture des textes créoles, répétitions (3 canaux) | Heures 38–45 |
| 8. Présentation | Pitch, démo, limites, feuille de route | Heures 44–48 |

Règle d'or : **si une fonctionnalité n'est pas utilisée dans le scénario de démo, elle passe après.** La saisie par message est le premier élément à sacrifier si le temps manque.

## 19. Sécurité et limites

- Utiliser des données fictives et des numéros de test ; aucun vrai client dans la démo.
- Secrets (jetons, clés) uniquement dans les variables d'environnement ; ne jamais les exposer au frontend ni les commiter.
- Protéger `DATABASE_URL` comme un secret ; utiliser un projet Supabase de test et des données fictives, et ne jamais exposer d'identifiants PostgreSQL ou de clé `service_role` au frontend.
- Garder les opérations vente + mise à jour du stock dans une transaction PostgreSQL ; tester les contraintes et la concurrence sur la base de test.
- **N'envoyer d'information qu'aux numéros enregistrés** (liste blanche).
- **Vérifier l'authenticité des webhooks** (signature de Meta pour WhatsApp, jeton secret pour Telegram) avant tout traitement.
- Limiter le nombre de messages par numéro et par minute.
- Valider toutes les entrées dans le backend, y compris le texte des messages.
- Limiter l'assistant à des fonctions autorisées ; pas de SQL ni de code libre.
- Toute saisie par message exige une confirmation explicite.
- Si un modèle distant est utilisé, ne lui envoyer que les résultats agrégés nécessaires à la réponse, jamais la base entière.
- Distinguer clairement les faits calculés des recommandations ; ne pas présenter le résultat comme de la comptabilité certifiée.
- Décrire VYROXMIND comme expérimental tant que ses performances ne sont pas évaluées.
- Rappeler que les canaux de messagerie dépendent d'internet et des règles de leurs fournisseurs (coûts, politique sur les assistants IA), à vérifier avant tout déploiement réel.

## 20. Pitch court

**En créole :**

> Business Core se yon asistan jesyon pou ti komès yo. Li rasanble vant, depans ak stòk yo an goud, epi li voye enfòmasyon yo dirèkteman sou WhatsApp, an kreyòl. Konsa, komèsan an pa bezwen louvri okenn aplikasyon. Chif yo kalkile pa sistèm nan, pa pa entèlijans atifisyèl la : se yo ou ka fè konfyans.

**En français (pour mémoire) :**

> Business Core est un assistant de gestion pour les petits commerces. Il rassemble ventes, dépenses et stocks en gourdes et envoie l'information directement sur WhatsApp, en créole. Le commerçant n'a pas besoin d'ouvrir une application. Les chiffres sont calculés par le système, pas par l'IA : on peut leur faire confiance.

**Version avec utilisateur concret (à adapter au nom et à la boutique choisis) :**

> Imaginez une commerçante qui tient sa boutique de quartier avec un cahier. Ce soir, avant même qu'elle ne pose une question, son téléphone vibre : le résumé de sa journée est arrivé sur WhatsApp, avec une alerte « Lwil 1 L prèske fini ». Elle répond « Ki pwodwi ki vann pi plis semèn sa a ? » et reçoit la réponse en quelques secondes, en créole, avec les chiffres.

**Ce que nous ne faisons pas :** pas de comptabilité certifiée, pas de paiement réel, pas d'intégration bancaire. Ce sont les prochaines étapes de la feuille de route, avec le SMS/USSD pour les zones à faible connexion et les notes vocales en créole.

## 21. Priorités immédiates

1. Créer le projet Supabase et le dépôt avec `backend/` et `frontend/`.
2. Figer les formats JSON, les règles de la section 6, la liste des mots-clés créoles et le scénario de démo.
3. Créer le bot Telegram et le compte développeur Meta (la configuration WhatsApp prend du temps).
4. Faire démarrer FastAPI avec `/health` et un premier message échangé avec le bot.
5. Faire démarrer React avec une page simple, relier à l'API, mettre en place `ht.ts`.
6. Ajouter le seed et le tableau de bord.
7. Ajouter produits, ventes avec stock transactionnel, dépenses, avec leurs tests.
8. Ajouter l'orchestrateur : outils, routeur créole, modèles de réponses.
9. Ajouter les canaux : liste blanche, rapports et alertes, simulateur ; WhatsApp ensuite.
10. Tester les trois canaux et répéter la démo.

## Annexe : ce qui a changé par rapport à la v3

- **Base de données :** remplacement de SQLite par PostgreSQL hébergé sur Supabase, tout en conservant FastAPI et SQLAlchemy comme backend et couche d'accès aux données.
- **Créole partout côté utilisateur :** interface, assistant, messages, démo et pitch, avec fichiers de textes centralisés pour la relecture.
- **Nouveau cœur de produit :** l'information vient au commerçant par WhatsApp (Telegram en secours), sans passer par la plateforme.
- **Rapports et alertes automatiques :** résumé quotidien et hebdomadaire, alerte de stock bas, rappel d'inactivité.
- **Saisie par message en bonus,** avec confirmation obligatoire.
- **Routeur de secours créole :** normalisation des accents, mots-clés par intention, modèles de réponses en créole.
- **Architecture :** adaptateurs de canal, liste blanche de numéros, planificateur, actions en attente, simulateur de canal.
- **Endpoints et fichiers** ajoutés pour les contacts, les webhooks, le simulateur et l'envoi de rapports.
- **Sécurité :** vérification des signatures de webhooks, liste blanche, limitation de débit, données agrégées uniquement envers un modèle distant.
- **Contraintes WhatsApp documentées** (jeton de test, fenêtre de 24 heures, modèles de messages, tarification et politique à vérifier).
- **Plan de 48 heures et scénario de démo** mis à jour, avec trois niveaux de secours (WhatsApp, Telegram, simulateur).