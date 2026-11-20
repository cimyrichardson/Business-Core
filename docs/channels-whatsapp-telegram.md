# Canaux WhatsApp et Telegram — opérations et audio

## 1. Objectif produit

Un commerçant ayant relié son compte Business Core à WhatsApp ou Telegram doit
pouvoir gérer sa boutique dans sa conversation, en créole haïtien, comme dans
l'application web. Il peut poser des questions, consulter ses données, demander
des opérations et envoyer des messages vocaux.

Les canaux sont des interfaces d'accès au même produit, pas des backends
différents. Le web, WhatsApp, Telegram et les traitements audio
réutilisent l'authentification métier, les outils de l'Assistant et les services
de ventes, produits, dépenses et rapports.

## 2. Périmètre et parité avec le web

La parité signifie que les opérations sont accessibles par conversation quand
elles existent dans l'application et dans l'API, avec des confirmations
adaptées au canal. Elle ne signifie pas que le bot peut exécuter une action
inconnue ou contourner les règles de l'application.

### Opérations déjà exposées par l'API métier

| Domaine | Consulter | Créer |
|---|---|---|
| Dashboard | Résumé, période, ventes et dépenses agrégées | Sans objet |
| Produits et stock | Liste de produits, produits sous le seuil | Produit |
| Ventes | Ventes récentes, période et produit | Vente |
| Dépenses | Dépenses récentes, période | Dépense |
| Assistant | Questions sur ventes, dépenses, produits et stock | Recommandations en lecture seule |

### Parité complète à construire

Avant de promettre « tout ce qui est possible sur le web », inventorier les
actions réellement présentes dans chaque écran web et exposer leur service
métier commun à l'API et aux canaux. Les modifications et suppressions de
produits, la correction ou l'annulation de ventes, les retours, les ajustements
de stock, les exports et les changements de paramètres ne sont pas tous
disponibles dans l'API actuelle : ne pas les simuler. Les ajouter d'abord comme
opérations backend explicites avec autorisations, validations et tests, puis
les raccorder aux canaux.

L'Assistant conversationnel peut comprendre une demande libre, mais il ne peut
appeler qu'une liste explicite d'opérations prises en charge. Pour une demande
inconnue ou ambiguë, poser une question de clarification ou indiquer la limite.

## 3. Architecture commune

```text
WhatsApp Cloud API ──┐
                     ├─> adaptateur de canal ─┐
Telegram Bot API ────┘                        │
                                              v
Message vocal -> téléchargement contrôlé -> transcription
                                              │
Message texte / transcription ────────────────┤
                                              v
                               orchestrateur Assistant commun
                               Gemini -> Groq -> OpenRouter
                                              │
                             outils métier autorisés et validés
                                              │
                              services métier FastAPI / PostgreSQL
                                              │
                                   réponse adaptée au canal
```

Le routeur du canal vérifie la requête entrante, retrouve le contact autorisé,
normalise le message, puis appelle le même orchestrateur que le chat web. Il
utilise les services métier communs, et non des appels HTTP internes aux
endpoints web ou des requêtes SQL improvisées par le modèle.

Les adaptateurs gèrent uniquement les différences de transport : webhook,
identifiant de conversation, récupération de médias, limites de longueur et
envoi de réponse. Ils n'implémentent pas chacun leur propre interprétation
métier.

L'ordre IA choisi est Gemini → Groq → OpenRouter. Le modèle reçoit uniquement
la question et le contexte agrégé nécessaire, demande un outil autorisé si
besoin, puis formule la réponse. Les montants, dates, stocks, autorisations et
effets métier restent sous le contrôle du backend. Le fonctionnement de cette
chaîne est détaillé dans [`ai-provider-routing.md`](./ai-provider-routing.md).

## 4. Liaison d'un compte à une boutique

Le fait d'écrire au bot ne suffit jamais à donner accès à un commerce. La
liaison doit être initiée ou approuvée depuis une session web déjà
authentifiée :

1. Le commerçant choisit WhatsApp ou Telegram dans les paramètres de son
   compte.
2. Le backend émet un code ou lien de liaison aléatoire, à usage unique et à
   durée courte, rattaché au commerce et au canal attendu.
3. Le commerçant ouvre le bot et fournit le code; le webhook vérifié associe
   l'identifiant externe fourni par le canal au contact.
4. Le backend consomme le code atomiquement, confirme la liaison et affiche le
   canal et le commerce liés dans l'application.
5. Le commerçant peut désactiver ou révoquer cette liaison depuis le web.

Ne pas établir le lien à partir d'un numéro de téléphone supposé identique à
l'adresse email, d'un nom affiché, ni d'informations que l'utilisateur peut
facilement usurper. Utiliser l'identifiant externe stable fourni par le canal
et vérifier les changements de format auprès du fournisseur.

La migration actuelle prévoit `contacts` avec `business_id`, `channel`,
`external_id`, `name` et `is_active`; `pending_actions` est limitée au type
`create_sale`. Ces tables n'implémentent pas à elles seules la procédure de
liaison sécurisée. Ajouter une table de codes temporaires ou un mécanisme
équivalent, avec expiration, usage unique et consommation atomique.

À chaque message, retrouver le commerce par le contact actif et son canal.
Chaque lecture et écriture est filtrée par ce `business_id`. Un contact
inconnu, désactivé ou ambigu ne reçoit aucune donnée métier et ne peut lancer
aucune action.

## 5. Cycle d'un message entrant

1. Recevoir le webhook; répondre rapidement au fournisseur et placer le
   traitement long dans une tâche asynchrone si nécessaire.
2. Vérifier la signature ou le secret du webhook avant de traiter son contenu.
3. Dédupliquer le message par identifiant fournisseur pour rendre les
   retransmissions sans effet.
4. Résoudre le contact, le commerce associé, le canal et son état actif.
5. Détecter le type de message : texte, audio, média non pris en charge,
   commande ou réponse à une confirmation en attente.
6. Pour l'audio, valider et transcrire avant de passer au routeur commun.
7. Interpréter la demande et demander une clarification si l'intention, la
   période, le produit ou les quantités ne sont pas assez clairs.
8. Pour une lecture, appeler les outils autorisés et préparer la réponse.
9. Pour une écriture, préparer une prévisualisation et demander confirmation
   explicite sur le même canal.
10. Envoyer une réponse courte en créole, adaptée aux limites du canal, et
    journaliser l'identifiant de traitement sans enregistrer le contenu
    sensible du message par défaut.

## 6. Opérations et confirmations

### Lectures

Les consultations ne nécessitent pas de confirmation, mais indiquent la période
réellement appliquée. Exemples :

- « Konbyen vant mwen fè semèn sa a ? »
- « Ki pwodwi ki prèske fini ? »
- « Konbyen mwen depanse mwa sa a ? »
- « Chèche pwodwi diri yo. »

Lorsque plusieurs résultats correspondent, présenter un choix avant d'agir.
Une recommandation doit être distincte des faits et s'appuyer sur les données
retournées par les outils.

### Écritures

Toute opération qui modifie les données exige :

1. une intention et des champs complets et non ambigus;
2. une prévisualisation lisible (produit, quantité, prix, total, catégorie ou
   date selon l'opération);
3. une confirmation explicite, liée au contact, au canal et à l'action en
   attente;
4. une durée d'expiration courte et l'annulation des confirmations
   contradictoires;
5. une validation métier et transactionnelle à l'exécution;
6. un reçu après succès contenant les données finales relues en base.

Exemple :

```text
Ou: Mwen vann 3 diri.
Bot: Mwen konprann: 3 Diri 1 kg × 300 HTG = 900 HTG.
     Stòk la ap pase soti 42 pou rive 39. Ou konfime vant lan? (Wi / Non)
Ou: Wi
Bot: Vant lan anrejistre. Gen 39 Diri 1 kg ki rete.
```

Un « wi » isolé n'est valable que lorsqu'une action en attente non expirée
existe pour ce même contact et ce même canal. Il ne faut jamais exécuter une
action uniquement sur la base de l'interprétation du modèle.

Le schéma actuel de `pending_actions` ne couvre que `create_sale`. Ajouter les
types d'actions seulement quand les endpoints correspondants et leurs tests
existent. Les confirmations doivent être atomiques pour empêcher une double
exécution si un webhook est retransmis.

## 7. Messages audio

### Entrée audio requise

Les messages vocaux reçus dans WhatsApp ou Telegram doivent pouvoir être
utilisés comme une question ou une saisie. Le traitement recommandé :

1. Vérifier que le message audio provient d'un contact lié et actif.
2. Récupérer le média via l'API officielle du canal, côté serveur, avec
   authentification et URL contrôlées.
3. Valider le type MIME réel, la taille et la durée. Refuser les formats
   dangereux, fichiers vides et durées dépassant les limites configurées.
4. Transcrire la voix en texte créole haïtien et, si possible, préserver les
   variantes françaises usuelles.
5. Contrôler le résultat et sa confiance; traiter les nombres, noms de produits,
   quantités et montants avec une prudence particulière.
6. Si la transcription est ambiguë ou de confiance insuffisante, renvoyer le
   texte reconnu pour correction ou demander à l'utilisateur de répéter. Ne
   jamais créer une opération à partir d'une transcription incertaine.
7. Faire suivre la transcription validée au même orchestrateur que le texte.
8. Supprimer le média temporaire dès que la transcription est terminée, sauf
   consentement et besoin produit documenté qui justifient sa conservation.

Les capacités d'entrée audio, les formats acceptés et les limites varient selon
les canaux et les fournisseurs IA. Ne pas supposer que les trois modèles de la
chaîne Gemini, Groq et OpenRouter acceptent les mêmes formats audio. Prévoir un
adaptateur de transcription séparé, avec son propre fournisseur et sa
configuration backend, ou une capacité audio vérifiée du fournisseur. Dans les
deux cas, le résultat est du texte non fiable : il passe par les mêmes
validations et confirmations.

### Confirmation et audio

Pour une opération d'écriture initiée par la voix, renvoyer une prévisualisation
texte et demander une confirmation explicite. Au MVP, privilégier une réponse
« Wi » ou « Non » écrite. Une confirmation vocale peut être activée ensuite
seulement si la transcription est suffisamment fiable et qu'elle correspond
sans ambiguïté à l'action en attente; sinon, redemander une confirmation texte.

### Sortie vocale

La réponse audio synthétisée est une amélioration facultative. Le MVP doit
répondre en texte lisible dans les deux canaux. Si la synthèse vocale est
ajoutée, proposer également la transcription écrite, éviter de lire à voix
haute des informations sensibles sur un appareil partagé et permettre à
l'utilisateur de désactiver les réponses audio.

## 8. Rapports et notifications sortantes

Les rapports et alertes automatiques doivent utiliser le même service de
formatage et respecter la liaison et le consentement du contact. Prévoir une
configuration par boutique : canal activé, plages horaires, types de
notifications et possibilité de désabonnement.

Avant l'envoi réel, vérifier les règles et modèles de messages en vigueur chez
Meta, les coûts, les fenêtres de conversation et le consentement requis.
Telegram et WhatsApp ont des contraintes distinctes; le système doit traiter
un échec d'envoi sans dupliquer l'opération métier ni bloquer les autres
canaux.

## 9. Sécurité, confidentialité et fiabilité

- Vérifier l'authenticité de chaque webhook : signature WhatsApp, secret de
  webhook Telegram ou mécanisme officiel courant.
- Ne jamais faire confiance au texte, à la transcription, au nom affiché ou à
  l'identifiant du commerce envoyé dans le corps du message.
- Filtrer chaque opération par le commerce du contact lié; appliquer les mêmes
  autorisations et validations que sur le web.
- Dédupliquer les événements et les exécutions d'actions par identifiant
  fournisseur; limiter débit, taille, durée et coût.
- Ne jamais exposer les clés de canal, clés IA, jetons Supabase, requêtes SQL
  ou détails d'erreur internes.
- Limiter les données envoyées aux fournisseurs IA et de transcription au
  minimum nécessaire; privilégier des agrégats et éviter les données
  personnelles.
- Ne pas conserver les audios ou transcriptions intégrales par défaut;
  documenter toute durée de conservation et obtenir les consentements requis.
- Utiliser des messages créoles clairs pour les erreurs, les refus, les
  confirmations et les réponses de secours.
- Garder un mode simulateur pour les tests locaux; ne pas mélanger le
  simulateur et les contacts réels.

## 10. API et responsabilités à implémenter

Les routes de canaux ci-dessous sont une cible de conception; leur présence
dans le tableau marque les routes déjà ajoutées au backend et celles qui
restent à construire :

| Route | État | Rôle |
|---|---|---|---|
| `GET /api/v1/channels/links` | Implémentée | Lister les liaisons depuis une session web |
| `POST /api/v1/channels/links` | Implémentée | Émettre un code de liaison à usage unique |
| `DELETE /api/v1/channels/links/{channel}` | Implémentée | Révoquer une liaison depuis le web |
| `GET/POST /api/v1/channels/whatsapp/webhook` | Implémentée | Vérifier le webhook Meta et recevoir les messages signés |
| `POST /api/v1/channels/telegram/webhook` | Implémentée | Recevoir les messages après vérification du secret |
| `POST /api/v1/channels/simulate` | À construire | Simuler un message dans les tests et la démo |

Le routeur déterministe de démarrage comprend actuellement les commandes
d'aide, de résumé, de ventes, de dépenses, de produits et de stock. La création
de ventes, de dépenses, de produits et les autres écritures conversationnelles
avec confirmation restent à implémenter. L'audio entrant utilise Gemini pour
la transcription et nécessite `GEMINI_API_KEY` et `GEMINI_AUDIO_MODEL` dans
l'environnement backend.

### Configuration et démarrage

1. Appliquer la migration initiale, puis
   `supabase/migrations/20261117153000_channel_linking_and_deduplication.sql`.
2. Copier `backend/.env.example` vers `backend/.env` et renseigner uniquement
   les secrets nécessaires au canal utilisé. Redémarrer FastAPI après toute
   modification. Pour savoir où obtenir ces identifiants et comment
   enregistrer chaque webhook, suivre le
   [guide de configuration Telegram et WhatsApp](./channel-provider-credentials.md).
3. Configurer le webhook Telegram avec une URL HTTPS publique, le secret
   `TELEGRAM_WEBHOOK_SECRET` et l'adresse
   `/api/v1/channels/telegram/webhook`.
4. Configurer dans Meta l'URL
   `/api/v1/channels/whatsapp/webhook`, le même
   `WHATSAPP_VERIFY_TOKEN` et les secrets/identifiants de l'application
   WhatsApp. Le GET de vérification et les notifications POST doivent être
   accessibles en HTTPS.
5. Se connecter au dashboard, choisir le canal dans « Mesaj ak rapò », générer
   un code, puis envoyer `/link <code>` au bot avant son expiration.
6. Dans le dashboard, vérifier que le canal affiche « Konekte », puis essayer
   `èd`, `rezime`, `vant`, `depans`, `pwodwi` ou `stok`.
7. Pour tester une note vocale, configurer aussi `GEMINI_API_KEY` et
   `GEMINI_AUDIO_MODEL`, puis envoyer un court audio en créole au bot.

Les webhooks sont désactivés tant que leurs secrets ne sont pas configurés; un
code de liaison n'est pas émis pour un canal dont la configuration serveur est
incomplète. Les fournisseurs n'ont pas été appelés pendant les tests
automatisés.

Le webhook n'utilise pas le Bearer token Supabase du navigateur : il vérifie
l'authenticité du fournisseur puis autorise le contact via sa liaison en base.
La route de liaison, elle, exige une session web authentifiée.

## 11. Phases de livraison

1. **Contrat commun :** service Assistant, outils métier, états d'action,
   format de message interne et identifiants de déduplication.
2. **Telegram texte :** liaison de compte sécurisée, lectures du dashboard,
   produits, ventes et dépenses; réponses créoles.
3. **Écritures contrôlées :** création d'une vente et d'une dépense, avec
   confirmation, expiration, transaction et protection contre les doublons.
4. **WhatsApp texte :** adaptateur, vérification de webhook et contraintes
   commerciales testées.
5. **Audio entrant :** récupération média contrôlée, transcription créole,
   seuil de confiance et confirmation des écritures.
6. **Parité fonctionnelle :** inventorier les actions web manquantes, ajouter
   les services/API correspondants, puis les exposer explicitement aux deux
   canaux.
7. **Rapports sortants et audio de réponse :** après tests de consentement,
   coûts, disponibilité et accessibilité.

## 12. Tests et critères d'acceptation

- Contact inconnu ou désactivé ne peut lire ni modifier aucune donnée.
- Une liaison expirée, déjà utilisée ou prévue pour un autre canal est rejetée.
- Webhook invalide rejeté; événements répétés traités une seule fois.
- Même demande texte via web, Telegram et WhatsApp appelle les mêmes outils et
  produit des faits identiques.
- Demandes ambiguës, hors périmètre et sans données traitées explicitement.
- Vente et dépense exigent une confirmation valide et ne peuvent être
  exécutées deux fois.
- Stock insuffisant, données invalides et échec de transaction produisent un
  message clair sans mutation partielle.
- Audio vide, trop long, MIME incohérent, transcription erronée ou faible
  confiance ne déclenche jamais une écriture.
- Les noms, quantités, dates et montants de la transcription sont confirmés
  avant toute opération.
- Médias temporaires supprimés; secrets et données personnelles absents des
  journaux et messages aux fournisseurs.
- Tests effectués sur appareils mobiles et sur des comptes de démonstration
  avec données fictives.

## Documents connexes

- [Guide d'implémentation de l'Assistant](./assistant-implementation.md)
- [Chaîne des fournisseurs IA](./ai-provider-routing.md)
- [Contrat de l'API métier](./api-endpoints.md)
- [Obtenir les identifiants et configurer les webhooks](./channel-provider-credentials.md)
- [Présentation et règles métier du hackathon](./projet_hackathon_docs.md)
