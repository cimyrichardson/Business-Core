# Chaîne des fournisseurs IA

## Décision

L'Assistant Business Core utilise un modèle IA distant avec l'ordre de
priorité suivant :

1. **Gemini** — fournisseur principal;
2. **Groq** — premier fournisseur de secours;
3. **OpenRouter** — second fournisseur de secours.

Cette liste décrit l'ordre de tentative, pas une exécution simultanée. Le
backend essaie le fournisseur suivant seulement si le précédent échoue de
façon transitoire. Les identifiants exacts des modèles restent configurables :
les choisir et les évaluer au moment de l'implémentation, notamment sur la
compréhension du créole haïtien, les appels d'outils, le coût et la latence.

OpenRouter est utilisé comme troisième point d'accès avec un modèle explicitement
configuré; il ne remplace pas l'ordre de bascule défini ici.

## Responsabilités

- Le modèle comprend la question en créole, identifie l'intention et sélectionne
  un outil métier dans une liste fermée.
- FastAPI authentifie l'utilisateur, détermine le `business_id` et exécute
  l'outil avec les filtres de sécurité existants.
- Les chiffres (ventes, dépenses, stock, périodes) sont calculés par le backend,
  jamais estimés par le modèle.
- Le modèle formule la réponse en créole et peut proposer des recommandations
  prudentes fondées uniquement sur les résultats des outils.
- Si les trois fournisseurs sont indisponibles, le moteur déterministe de
  secours répond aux questions reconnues. La réponse doit être identifiée comme
  `fallback`, et non comme une réponse IA.

La chaîne est réservée aux appels en lecture seule du MVP. Ne jamais donner aux
fournisseurs un accès SQL, les secrets de l'application, les jetons Supabase
ou des identifiants de commerce.

## Configuration backend proposée

Les variables suivantes sont un contrat de configuration cible; elles ne sont
pas encore implémentées dans `backend/app/config.py`.

```dotenv
AI_PROVIDER_ORDER=gemini,groq,openrouter
AI_TIMEOUT_SECONDS=8
AI_TOTAL_TIMEOUT_SECONDS=22

GEMINI_API_KEY=
GEMINI_MODEL=

GROQ_API_KEY=
GROQ_MODEL=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
```

Les noms de modèles sont des espaces réservés, pas des recommandations de
versions. Chaque clé doit rester dans `backend/.env` en local ou dans le
gestionnaire de secrets de l'hébergeur. Ne pas utiliser de préfixe
`NEXT_PUBLIC_`, ne pas les exposer au navigateur, ne pas les commiter et ne pas
les inclure dans les journaux.

Si un fournisseur n'est pas configuré, le backend peut le marquer indisponible
et passer au suivant, en journalisant un événement opérationnel sans la clé ni
la question complète. En production, la configuration doit permettre de
détecter explicitement si aucun fournisseur n'est utilisable.

## Politique de bascule

Pour chaque requête d'Assistant :

1. Construire une demande à partir de la question, des instructions système et
   des définitions d'outils autorisés.
2. Essayer Gemini, puis Groq, puis OpenRouter, avec un délai maximal par
   fournisseur et un délai total borné.
3. Passer au suivant pour un délai dépassé, une erreur réseau, une limitation
   temporaire (`429`) ou une erreur temporaire du fournisseur (`5xx`).
4. Ne pas répéter indéfiniment une requête ni relancer une action métier.
   Limiter les tentatives à un appel par fournisseur pour chaque étape du
   protocole d'outils.
5. Si un modèle retourne un appel d'outil valide, le backend vérifie l'outil et
   ses arguments, exécute l'outil une seule fois, puis transmet uniquement son
   résultat agrégé au modèle pour rédiger la réponse.
6. Si un fournisseur renvoie une réponse invalide, non conforme au schéma ou
   inutilisable, le considérer indisponible et essayer le suivant.
7. Si tous les fournisseurs échouent, appeler le moteur déterministe de secours
   pour les intentions qu'il reconnaît; autrement, renvoyer une réponse
   d'indisponibilité claire.

Une erreur `401` ou `403` d'une clé fournisseur indique généralement une
configuration erronée : la signaler dans les journaux serveur sans révéler le
secret, marquer ce fournisseur indisponible pour la requête, puis poursuivre
la chaîne. Une erreur de validation de la demande utilisateur ne doit pas
déclencher la bascule vers d'autres fournisseurs.

L'orchestrateur ne doit pas changer de fournisseur parce qu'il n'aime pas une
réponse valide, ni demander à plusieurs modèles de voter ou de multiplier les
réponses. Cela limiterait les coûts et simplifierait le diagnostic.

## Contrat interne normalisé

Créer une interface d'adaptateur commune aux trois fournisseurs. Elle reçoit
les messages et la liste fermée d'outils, puis renvoie l'un des résultats
validés suivants :

- un appel d'outil autorisé avec des arguments structurés;
- une réponse textuelle, à valider avant de l'afficher;
- une erreur typée permettant à l'orchestrateur de décider s'il faut passer au
  fournisseur suivant.

Le reste du backend ne doit pas dépendre du format natif d'un fournisseur.
Chaque adaptateur est responsable de traduire les outils et messages vers le
format de son API, puis de normaliser sa réponse. Les clés d'API et les
adresses des services ne sont jamais renvoyées au frontend.

Pour le contrat HTTP de l'Assistant, conserver `source: "llm"` et ajouter un
champ `provider` (`"gemini"`, `"groq"` ou `"openrouter"`) pour indiquer le
fournisseur qui a répondu. En mode dégradé, renvoyer `source: "fallback"` et
`provider: null`. Ne pas exposer au navigateur les erreurs ou détails internes
des fournisseurs.

## Données, confidentialité et sécurité

- N'envoyer à un fournisseur que la question nécessaire à l'assistant et, après
  exécution des outils, les agrégats strictement utiles à la réponse.
- Ne jamais envoyer de mot de passe, clé, jeton d'accès, `business_id`, données
  d'un autre commerce ou historique complet de ventes.
- Éviter les noms de clients, coordonnées et détails libres de dépenses si
  l'intention peut être satisfaite sans eux.
- Appliquer les limites de longueur, de fréquence, de temps et de coût côté
  backend.
- Ne pas journaliser le contenu intégral des conversations par défaut; mesurer
  les erreurs avec fournisseur, durée, type d'erreur et identifiant de requête
  non sensible.
- Examiner les paramètres de conservation et d'utilisation des données de
  chaque fournisseur avant la mise en production; ne pas supposer que les
  trois fournisseurs offrent les mêmes garanties.
- Toute action modifiant les données, telle qu'enregistrer une vente, reste
  interdite au modèle sans confirmation utilisateur explicite et validations
  métier côté backend.

## Tests et critères de validation

- ordre de sélection Gemini → Groq → OpenRouter;
- aucun appel de secours quand le fournisseur précédent a réussi;
- bascule sur `429`, `5xx`, erreur réseau et délai dépassé;
- erreur `401`/`403` journalisée sans fuite de clé, puis bascule contrôlée;
- aucun retry non borné et aucune double exécution d'un outil;
- rejet des noms d'outils et arguments non autorisés;
- cloisonnement des données entre deux commerces;
- réponse finale qui indique le bon `source` et le bon `provider`;
- mode déterministe lorsque les trois fournisseurs échouent;
- contrôle de coût, délai maximal total et longueur du contexte;
- comparaison des modèles retenus sur un jeu de questions créoles relu par un
  locuteur haïtien, avec vérification des chiffres par rapport aux données
  d'outils.

## Ordre d'implémentation

1. Définir les interfaces normalisées, les erreurs fournisseur et le schéma de
   configuration.
2. Écrire les tests d'orchestration et de bascule avec des faux adaptateurs,
   sans appeler les API externes.
3. Implémenter et tester les adaptateurs Gemini, Groq et OpenRouter
   individuellement.
4. Implémenter l'ordre de secours, les délais bornés, la télémétrie sans
   secrets et le fallback déterministe.
5. Raccorder l'orchestrateur à `POST /api/v1/assistant/ask`.
6. Configurer les modèles et les clés uniquement dans l'environnement
   backend, puis valider le créole, les coûts et la confidentialité avec des
   données de test.

## Documents connexes

- [Guide d'implémentation de l'Assistant](./assistant-implementation.md)
- [Présentation et règles métier du hackathon](./projet_hackathon_docs.md)
