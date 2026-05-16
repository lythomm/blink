Tu es un développeur expert Fullstack Web. Tu dois générer l'intégralité du code pour une Web App de "Caméra Jetable Numérique" nommée **Blink**, dédiée aux événements (mariages, anniversaires). L'application doit être optimisée pour mobile, ultra-rapide, interactive en temps réel et fonctionner même avec un réseau dégradé.

### 1. STACK TECHNIQUE

- Frontend : Next.js (App Router)
- Backend & Base de données : Convex (avec requêtes réactives temps réel)
- Stockage d'images : Cloudinary (formule gratuite optimisée)
- Styles : Tailwind CSS (Look skeuomorphique / Vintage)

### 2. ARCHITECTURE DES COMPTES & SÉCURITÉ (GUEST SYSTEM)

- Pas d'authentification classique (pas de mot de passe/email).
- Lorsqu'un utilisateur accède à un événement via une URL `/event/[eventId]`, l'application vérifie la présence d'un `guestId` unique dans son `localStorage`. S'il n'existe pas, un ID anonyme est généré (ex: `guest_abc123`) et stocké localement.
- Cet ID sert à identifier l'utilisateur au sein de cet événement spécifique pour gérer ses quotas et ses droits de suppression.

### 3. BASE DE DONNÉES (CONVEX SCHEMA)

Fichier `convex/schema.ts` à générer avec les contraintes suivantes :

- Table `events` : `id`, `name`, `createdAt`
- Table `photos` : `eventId` (string), `guestId` (string), `cloudinaryId` (string), `createdAt` (number).
- CRUCIAL : Mettre en place un index composite sur la table `photos` : `.index("by_event_and_guest", ["eventId", "guestId"])` pour optimiser le comptage des quotas.

### 4. LOGIQUE DES QUOTAS & DROIT À L'ERREUR (MUTATIONS CONVEX)

- Limite : 50 photos par utilisateur ET par événement.
- Le calcul des poses restantes doit être DYNAMIQUE (comptage à la volée via l'index composite avant chaque prise).
- Mutation `takePhoto` : Compter le nombre de photos actives pour ce couple eventId/guestId. Si `>= 50`, bloquer l'action et lever une erreur.
- Mutation `deletePhoto` (Droit à l'erreur / Option A) : Un utilisateur peut supprimer uniquement ses propres photos (vérification stricte du `guestId`). La suppression est un "Hard Delete" (suppression de la ligne dans Convex) pour libérer automatiquement et instantanément un crédit de pose.
- Action Convex : Associer une action à la suppression pour appeler l'API de Cloudinary et supprimer physiquement le fichier afin d'économiser l'espace de stockage gratuit.

### 5. PIPELINE DE CAPTURE MULTIMÉDIA & FILTRES VINTAGE

Le flux de capture se fait exclusivement au sein de la Web App pour garantir l'immersion :

- Utiliser l'API `navigator.mediaDevices.getUserMedia` pour afficher le flux de la caméra arrière dans une balise `<video>`.
- Appliquer un effet vintage en pur CSS sur le viseur `<video>` (ex: combinaison de `sepia`, `contrast`, `saturate` et `brightness`) pour simuler le rendu argentique en direct.
- Au clic sur le déclencheur : Capturer la frame courante via un élément `<canvas>`, y appliquer de manière permanente le traitement de couleur/grain, puis exporter l'image au format WebP hautement compressé (poids cible : ~200 Ko maximum par image).
- Intégrer la `Wake Lock API` (`navigator.wakeLock`) pour empêcher le smartphone de se mettre en veille pendant que le viseur de l'appareil photo est actif.

### 6. STRATÉGIE D'UPLOAD ET QUOTAS CLOUD / VERCEL

- Sécurité Cloudinary : Créer une API Route Next.js sécurisée (`/api/sign-cloudinary`) qui génère une signature cryptographique à usage unique. Le frontend uploade directement le fichier WebP du canvas vers Cloudinary avec cette signature.
- Optimisation Vercel : Configurer un loader personnalisé dans `next.config.js` ou utiliser la bibliothèque officielle `@cloudinary/url-gen` pour déléguer 100% du redimensionnement et du traitement des images à Cloudinary (éviter d'impacter le quota gratuit de 1000 images de Vercel).

### 7. LOGIQUE OFFLINE-FIRST (RÉSEAU EN CARTON)

- Mettre en place une file d'attente de synchronisation basée sur **IndexedDB** pour stocker temporairement les Blobs des images capturées en l'absence de réseau.
- Si l'upload échoue, la photo est sauvegardée localement dans IndexedDB et une entrée temporaire UI est affichée.
- Écouter l'événement JavaScript `online` pour vider la file d'attente de manière séquentielle dès que le réseau revient.

### 8. INTERFACE UTILISATEUR SKEUOMORPHIQUE (DESIGN BLINK)

Créer une interface web mobile en mode "Portrait" calquée sur un boîtier d'appareil jetable physique :

- **Partie Principale (Haut/Centre) :** Le viseur de la caméra (élément `<video>` filtré en CSS) habillé par un cadre rétro.
- **Barre d'outils inférieure (Contrôles au pouce) :**
  - **En bas à gauche :** Un indicateur de pellicule sous forme de cadran rotatif mécanique stylisé (roue crantée). Il affiche le nombre de photos restantes (décompte de 50 à 0). Appliquer une animation CSS de rotation de la roue à chaque fois que la valeur change.
  - **Au centre :** Un gros bouton déclencheur central très visible (look rétro/plastique).
  - **En bas à droite :** Une miniature de la toute dernière photo prise et validée par Convex. Au clic sur cette miniature, l'utilisateur est redirigé vers la galerie collective de l'événement.
- **Vue Galerie (`/event/[eventId]/gallery`) :** Une grille affichant toutes les photos de l'événement en temps réel (via le hook réactif de Convex). Chaque photo affiche une icône "Poubelle" de suppression uniquement si la photo possède le même `guestId` que l'utilisateur local.

Génère une architecture propre avec les composants React nécessaires, le fichier de configuration de l'API Route Next.js pour la signature, le schéma de données Convex, et les fonctions de mutation associées.
