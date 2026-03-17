# FoodieSpot - Estiam E4

Application FoodieSpot (React Native + Backend Node.js).

## Décisions Techniques

- **Architecture :** Séparation des responsabilités (UI dans `app/` et `components/`, logique métier dans `hooks/`, appels réseaux dans `services/`).
- **Gestion d'État :** Utilisation de Contexts React (ex: `CartContext`, `ThemeContext`) privilégiée pour éviter le prop-drilling, couplée au stockage local (`AsyncStorage` / `SecureStore`) pour la persistance hors-ligne.
- **Réseau & API :** Centralisation des requêtes via Axios avec intercepteurs pour la gestion automatique du token d'authentification.
- **Performances UI :** Remplacement des `ScrollView` par `FlatList` (ex: Category List) pour des listes performantes.

## Fonctionnalités Innovantes (Choix & Justifications)

1. **Mode Sombre (Dark Mode)**

   - **Pourquoi ?** Réduit la fatigue oculaire et s'adapte aux préférences système de l'utilisateur.
   - **Valeur utilisateur :** Améliore grandement le confort d'utilisation nocturne ou en faible luminosité.
   - **Difficultés :** Nécessite une abstraction rigoureuse des couleurs (via `Colors` et `useTheme()`) pour ne pas avoir de valeurs hexadécimales en dur.
2. **Système de Panier Interactif**

   - **Pourquoi ?** Centralise la gestion des commandes depuis n'importe quel écran.
   - **Valeur utilisateur :** Indicateur flottant omniprésent rappelant le contenu et le total courant, facilitant le passage en caisse.
   - **Difficultés :** Assurer la réactivité globale via le `CartContext` sans provoquer des re-renders inutiles sur l'ensemble de l'application.
3. **Suivi de Livraison en Temps Réel sur Carte**

   - **Pourquoi ?** Comble le manque de visibilité de l'utilisateur après le paiement.
   - **Valeur utilisateur :** Rassure l'utilisateur et rend l'expérience d'attente ludique en visualisant la position du livreur et l'adresse d'arrivée.
   - **Difficultés :** Intégration de `react-native-maps` et maintien d'une expérience fluide via un intervalle de synchronisation (polling) vers l'API.
4. **Système d'Avis avec Critères Multiples**

   - **Pourquoi ?** Offrir une mesure de qualité détaillée pour les restaurants, bien plus précise qu'une simple note sur 5.
   - **Valeur utilisateur :** Permet aux futurs clients d'avoir des retours ciblés (qualité, vitesse livraison).
   - **Difficultés :** Gérer plusieurs états de formulaire complexes et l'envoi vers un endpoint REST adapté.
5. **Estimation du Temps et du Coût de Livraison**

   - **Pourquoi ?** Apporte de la transparence avant même l'ajout d'articles au panier.
   - **Valeur utilisateur :** Évite la surprise des frais cachés ou de délais trop longs à la toute dernière étape de paiement.
   - **Difficultés :** Lier les coordonnées GPS du téléphone, l'adresse du restaurant, et recalculer la distance et les coûts de manière dynamique et réactive.

6. **Système d'Onboarding Dynamique et Persistant**

   - **Pourquoi ?** Présenter les fonctionnalités clés de l'application aux nouveaux utilisateurs lors de leur première connexion.
   - **Valeur utilisateur :** Accompagne l'utilisateur pour une meilleure compréhension de la plateforme (commande, livraison, options).
   - **Difficultés :**
     - Gestion asynchrone de l'état d'affichage (via `AsyncStorage` avec la clé `onboarding_seen`) pour s'assurer que l'écran ne s'affiche qu'une seule fois.
     - Synchronisation parfaite avec la logique de routing et le `NavigationGuard` (Expo Router) afin d'éviter les conflits de redirection entre la racine (`/`), l'onboarding et l'authentification (`/login`).
     - Utilisation de `FlatList` et d'animations pour créer un carrousel paginé fluide avec un indicateur visuel de progression.
