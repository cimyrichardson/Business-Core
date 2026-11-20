# Obtenir et configurer les identifiants WhatsApp et Telegram

Ce guide explique où obtenir les valeurs attendues par `backend/.env.example`,
comment les enregistrer dans `backend/.env` et comment enregistrer les URLs de
webhook Business Core. Les noms des écrans des fournisseurs peuvent évoluer;
les liens officiels ci-dessous sont les références pour leur interface actuelle.

## 1. Préparer l'URL de webhook

Les fournisseurs doivent pouvoir joindre l'API backend sur une URL HTTPS
publique. En développement local, utilisez un tunnel HTTPS temporaire vers
FastAPI; en production, configurez le nom de domaine HTTPS de votre serveur.
Ne configurez pas `localhost` comme URL de webhook.

| Fournisseur | URL de rappel |
|---|---|
| Telegram | `https://<domaine-api>/api/v1/channels/telegram/webhook` |
| WhatsApp | `https://<domaine-api>/api/v1/channels/whatsapp/webhook` |

Vérifiez que l'URL atteint le backend et que le pare-feu ou le proxy autorise
les requêtes HTTPS entrantes. Ne partagez pas une URL temporaire de tunnel si
elle contient un jeton ou un autre secret.

## 2. Telegram

### Créer un bot et récupérer son jeton

1. Ouvrez Telegram et démarrez une conversation avec le compte officiel
   [@BotFather](https://t.me/BotFather).
2. Envoyez `/newbot`, choisissez le nom affiché du bot, puis son nom
   d'utilisateur. Le nom d'utilisateur doit être disponible et se terminer
   par `bot`.
3. BotFather fournit un jeton de bot. Enregistrez-le dans
   `TELEGRAM_BOT_TOKEN`. Ce jeton autorise l'envoi de messages et l'accès aux
   fichiers du bot : traitez-le comme un mot de passe.
4. Si le jeton est exposé, utilisez BotFather pour le révoquer ou le renouveler,
   puis remplacez immédiatement l'ancienne valeur dans l'environnement du
   backend.

Documentation officielle : [Bots: An introduction for developers](https://core.telegram.org/bots).

### Générer le secret de webhook

Telegram ne fournit pas cette valeur : générez-en une vous-même. Par exemple,
Python peut produire une valeur aléatoire compatible avec les caractères
acceptés par Telegram :

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Enregistrez le résultat dans `TELEGRAM_WEBHOOK_SECRET`. Utilisez la même valeur
lors de l'enregistrement du webhook auprès de l'API Telegram. Elle doit
contenir entre 1 et 256 caractères parmi les lettres, chiffres, `_` et `-`.
Le backend compare cette valeur à l'en-tête
`X-Telegram-Bot-Api-Secret-Token` reçu pour chaque mise à jour.

### Enregistrer l'URL auprès de Telegram

Telegram n'a pas de page de configuration de webhook dans BotFather : appelez
la méthode officielle [`setWebhook`](https://core.telegram.org/bots/api#setwebhook)
avec :

- `url` : l'URL publique du webhook Telegram ci-dessus;
- `secret_token` : la valeur de `TELEGRAM_WEBHOOK_SECRET`;
- `allowed_updates` : `["message"]` pour les messages utilisés par le bot.

Utilisez un client API avec un environnement local non partagé et des variables
secrètes pour effectuer cet appel. Le jeton du bot fait partie de l'URL API
Telegram : ne copiez pas une URL contenant ce jeton dans un ticket, une capture
d'écran ou un journal partagé. Vérifiez la réponse de Telegram et confirmez
l'URL enregistrée avec `getWebhookInfo`.

## 3. WhatsApp Cloud API (Meta)

WhatsApp nécessite une application Meta, un compte WhatsApp Business et un
numéro activé par la Cloud API. Les étapes précises et les choix disponibles
dépendent du type de compte et de la configuration Meta.

### Créer l'application et obtenir un jeton

1. Connectez-vous à
   [Meta for Developers](https://developers.facebook.com/) et créez une
   application adaptée à l'utilisation Business.
2. Ajoutez le produit **WhatsApp** et suivez le parcours de configuration de
   la WhatsApp Cloud API. Pour un essai, utilisez le compte, le numéro et le
   jeton de test fournis dans l'espace API Setup; ajoutez-y le numéro
   destinataire de test autorisé.
3. Pour la production, configurez le compte WhatsApp Business et un numéro
   réel, puis créez un jeton serveur adapté dans les paramètres Business
   (généralement via un utilisateur système). Accordez uniquement les
   autorisations WhatsApp requises par le produit et attribuez les actifs
   nécessaires. Un jeton de test temporaire n'est pas un jeton de production.
4. Copiez le jeton serveur dans `WHATSAPP_ACCESS_TOKEN`. Il est envoyé en
   Bearer pour l'envoi de messages et le téléchargement de médias; gardez-le
   exclusivement côté backend.
5. Depuis les paramètres de l'application Meta (**App settings → Basic**),
   récupérez **App Secret** et placez-le dans `WHATSAPP_APP_SECRET`. Ce secret
   sert au backend à vérifier la signature `X-Hub-Signature-256` des requêtes
   entrantes. Ce n'est ni le jeton d'accès ni le jeton de vérification du
   webhook.
6. Dans l'espace API Setup de WhatsApp, copiez le **Phone number ID** du numéro
   Cloud API dans `WHATSAPP_PHONE_NUMBER_ID`. Il s'agit de l'identifiant
   numérique Meta, et non du numéro de téléphone affiché.
7. Choisissez une version Graph API actuellement prise en charge par Meta et
   renseignez-la sous la forme `vXX.X` dans `WHATSAPP_GRAPH_API_VERSION`
   (par exemple, reprenez la version proposée ou documentée pour votre
   application). Vérifiez la version avant un déploiement : Meta déprécie les
   anciennes versions.

Documentation officielle :
[WhatsApp Cloud API — Get Started](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
et [Webhooks for WhatsApp Business Accounts](https://developers.facebook.com/docs/graph-api/webhooks/getting-started/webhooks-for-whatsapp).

### Configurer et vérifier le webhook Meta

1. Créez un jeton aléatoire que vous contrôlez et enregistrez-le sous
   `WHATSAPP_VERIFY_TOKEN`. Cette valeur n'est pas fournie par Meta. Elle n'est
   pas utilisée pour signer les POST : le backend la compare seulement au
   paramètre `hub.verify_token` pendant la vérification initiale.
2. Dans **Webhooks** de votre application Meta, sélectionnez **WhatsApp
   Business Account** et configurez :
   - **Callback URL** : `https://<domaine-api>/api/v1/channels/whatsapp/webhook`;
   - **Verify token** : exactement la même valeur que
     `WHATSAPP_VERIFY_TOKEN`.
3. Enregistrez la configuration. Meta appelle le webhook en GET; le backend
   accepte le challenge si le jeton correspond.
4. Abonnez le webhook au champ `messages`, puis assurez-vous que l'application
   est bien abonnée au compte WhatsApp Business (WABA) utilisé, conformément
   au parcours Meta.
5. Envoyez un message depuis un destinataire de test autorisé et vérifiez que
   le backend reçoit le POST. La vérification de la signature est calculée
   avec `WHATSAPP_APP_SECRET`; ne désactivez pas cette vérification pour
   résoudre un problème de configuration.

## 4. Renseigner `backend/.env`

Copiez le modèle, s'il n'existe pas déjà :

```powershell
Copy-Item backend/.env.example backend/.env
```

Renseignez uniquement les variables des canaux que vous configurez :

```dotenv
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_VERIFY_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_GRAPH_API_VERSION=
```

Remplacez chaque valeur vide par la valeur obtenue ou générée. N'ajoutez pas de
guillemets autour des valeurs dans le fichier, sauf si le format de votre
configuration l'exige. Après modification, redémarrez le backend pour qu'il
relise son environnement.

`GEMINI_API_KEY` et `GEMINI_AUDIO_MODEL` sont aussi requis si vous voulez
transcrire les notes vocales; ils ne remplacent aucun identifiant Telegram ou
WhatsApp.

## 5. Protéger les secrets et diagnostiquer

- Gardez `backend/.env` hors du contrôle de version. Ne commitez ni les jetons,
  ni l'App Secret, ni les mots de passe, ni les URLs API qui contiennent un
  jeton. Utilisez le gestionnaire de secrets de l'hébergeur en production.
- N'exposez jamais ces valeurs avec un préfixe `NEXT_PUBLIC_` et ne les mettez
  pas dans le frontend.
- Si un secret est partagé, révoquez-le chez le fournisseur, créez-en un
  nouveau et mettez à jour l'environnement du backend.
- Si la génération d'un code de liaison échoue avec `503`, vérifiez que toutes
  les variables requises pour ce canal sont renseignées et valides; les champs
  WhatsApp doivent inclure un Phone number ID numérique et une version sous la
  forme `vXX.X`.
- Si Telegram refuse une mise à jour, vérifiez l'URL HTTPS, le secret
  `setWebhook` et `TELEGRAM_WEBHOOK_SECRET`.
- Si Meta ne valide pas le callback, vérifiez le HTTPS, le chemin exact,
  `WHATSAPP_VERIFY_TOKEN` et le challenge GET. Si la validation GET passe mais
  les POST sont rejetés, vérifiez `WHATSAPP_APP_SECRET` et la signature Meta.
- Les webhooks ne fonctionnent pas si le serveur est arrêté, inaccessible
  depuis Internet ou derrière une URL de tunnel qui a changé.

## Documents connexes

- [Conception des canaux WhatsApp et Telegram](./channels-whatsapp-telegram.md)
- [Configuration générale de l'API](../README.md#api-métier-fastapi)
