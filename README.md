# Blink. 📸

**Blink.** est une application web progressive (PWA) de "caméra jetable numérique" haut de gamme, conçue pour capturer l'essence de vos événements (mariages, soirées, festivals) avec une esthétique cinématographique et une simplicité radicale.

![Blink UI Preview](https://res.cloudinary.com/demo/image/upload/v1/sample.jpg) *Note: Image de remplacement*

## ✨ L'Expérience Blink

Blink transforme chaque smartphone en un appareil photo argentique moderne. Pas de filtres complexes après coup, pas de réseaux sociaux distrayants — juste l'instant présent, capturé pour toujours.

- **Esthétique Cinématographique** : Une interface minimaliste, sombre et élégante avec un grain de film authentique et des animations fluides.
- **Obturateur Mécanique** : Une animation d'obturateur à volets synchronisée avec un flash de lumière pour un retour tactile et visuel satisfaisant.
- **Galerie Collective Temps Réel** : Tous les invités voient la pellicule se remplir en direct sur un mur d'images partagé.
- **Limites Créatives** : L'organisateur définit un nombre de poses limité par invité (5, 10, 25 ou 50), rendant chaque déclenchement précieux.
- **Cycle de Vie Éphémère** : Les événements ont une date de fin précise. Une fois le temps écoulé, la caméra s'arrête, laissant place aux souvenirs.
- **Fonctionnement Hors-Ligne** : Capturez des photos même sans réseau (tunnel, sous-sol) ; Blink les synchronisera automatiquement dès que la connexion reviendra.

## 🚀 Stack Technique

- **Framework** : [Next.js 15](https://nextjs.org/) (App Router)
- **Base de Données & Backend** : [Convex](https://www.convex.dev/) (Temps réel natif)
- **Stockage Image** : [Cloudinary](https://cloudinary.com/) (Optimisation et dossiers par événement)
- **Animations** : [Framer Motion](https://www.framer.com/motion/)
- **PWA** : Support complet pour installation sur écran d'accueil et mode plein écran.
- **Iconographie** : [Lucide React](https://lucide.dev/)

## 🛠️ Installation & Développement

### Pré-requis
- Un compte [Convex](https://www.convex.dev/)
- Un compte [Cloudinary](https://cloudinary.com/)

### Configuration
1. Clonez le dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez vos variables d'environnement (`.env.local`) :
   ```env
   NEXT_PUBLIC_CONVEX_URL=...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   NEXT_PUBLIC_CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
4. Lancez le serveur de développement :
   ```bash
   npm run dev
   ```

## 📱 Fonctionnalités PWA
Pour une expérience optimale, installez Blink sur votre smartphone :
- **iOS** : Partager > Sur l'écran d'accueil.
- **Android** : Menu > Installer l'application.

---

*Développé avec passion pour des moments inoubliables.*
