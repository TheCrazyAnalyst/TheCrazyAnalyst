# TheCrazyAnalyst — application autonome

Cette version transforme l'artifact Claude d'origine en **vraie application autonome** :
site web, PWA installable, ou APK Android — sans dépendre de claude.ai.

## Ce qui a changé par rapport à la version précédente

| | Avant | Maintenant |
|---|---|---|
| Hébergement | Artifact Claude | Projet Vite normal → site web / PWA / APK |
| IA par défaut | Claude (quota partagé de l'app) | **Gemini** (clé gratuite personnelle) |
| Claude | seule option | toujours disponible, en option, avec ta propre clé Anthropic |
| Taille max analysée | 90 000 caractères (échantillon début/milieu/fin) | **illimitée** — texte intégral en un appel si possible, sinon découpage + mémoire cumulative |
| Configuration | clé collée à chaque session | demandée une fois à l'accueil, puis mémorisée sur l'appareil |
| Rapport / PDF / design | — | **strictement identiques**, rien n'a été retiré |

Tout le code de rendu du rapport, les styles, et l'export PDF (`html2canvas` + `jsPDF`)
sont restés tels quels : seule la façon d'obtenir le rapport (l'IA utilisée, la
gestion de la clé, le découpage des très longues conversations) a changé.

## Pourquoi Gemini par défaut, et pourquoi ce découpage

Vérifié en juillet 2026 avant d'écrire le code :

- **Gemini** (`gemini-flash-latest`, alias toujours à jour) et **Claude Sonnet 5**
  ont chacun une fenêtre de contexte de **1 million de tokens**. La quasi-totalité
  des conversations WhatsApp — même plusieurs années de messages — tiennent
  dans un seul appel.
- Le palier **gratuit** de Gemini (celui que la plupart des gens vont utiliser)
  limite néanmoins le débit à environ 10-15 requêtes/minute et 250 000
  tokens/minute. L'app envoie donc chaque appel avec une marge de sécurité
  (~200 000 tokens, ~700 000 caractères).
- Si une conversation dépasse cette taille (plusieurs années de groupe très
  actif), l'app bascule automatiquement sur un pipeline **map-reduce** :
  1. **Découpage** en morceaux, toujours coupés à une frontière de message
     (jamais au milieu d'un message).
  2. **Extraction** partie par partie : citations exactes, observations par
     personne, expressions récurrentes, moments marquants — avec une
     **mémoire cumulative** transmise d'une partie à la suivante pour garder
     la continuité.
  3. **Synthèse finale** : le même prompt (ton, structure, style) qu'avant
     reçoit cette matière extraite de l'intégralité de la conversation, et
     rédige le rapport final — aussi fidèle que possible à une lecture
     complète en un seul bloc.

Voir les commentaires dans `src/App.jsx` (section « Long-conversation
architecture ») pour le détail.

## Lancer le projet en local

```bash
npm install
npm run dev
```

Ouvre l'URL affichée (en général `http://localhost:5173`).

## Déployer comme site web

```bash
npm run build
```

Ça génère un dossier `dist/` de fichiers statiques, à héberger n'importe où :
Vercel, Netlify, GitHub Pages, Cloudflare Pages, ou ton propre serveur. Aucune
étape serveur n'est nécessaire — tout tourne dans le navigateur, y compris les
appels à l'IA (directement depuis l'appareil de la personne vers Google ou
Anthropic, avec sa propre clé).

## Installer comme application (PWA)

Une fois le site déployé en HTTPS, il est **automatiquement installable** :
sur mobile, le navigateur propose « Ajouter à l'écran d'accueil » ; sur
ordinateur, une icône d'installation apparaît dans la barre d'adresse.
L'app s'ouvre alors en plein écran, avec sa propre icône, et fonctionne hors
ligne pour l'interface (les analyses, elles, ont toujours besoin d'internet
pour appeler l'IA).

## Générer un APK Android

Le plus simple, sans écrire de code natif :

1. Déploie le site (étape précédente).
2. Va sur **[pwabuilder.com](https://www.pwabuilder.com/)**, colle l'URL du site.
3. Choisis « Android », télécharge le package généré (APK ou AAB signé).

Pour plus de contrôle (accès à des fonctions natives, publication sur le
Play Store), [Capacitor](https://capacitorjs.com/) est une bonne option :
`npm install @capacitor/core @capacitor/android`, puis `npx cap init` et
`npx cap add android` à partir du dossier `dist/` généré par `npm run build`.

## Obtenir une clé Gemini gratuite (résumé — l'app l'explique aussi à l'écran)

1. [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → se connecter avec un compte Google.
2. « Create API key » → choisir « Create API key in new project » si demandé.
3. Copier la clé (commence par `AIza…`) et la coller dans l'app.

Gratuit, sans carte bancaire. La clé reste uniquement sur l'appareil
(stockage local du navigateur) et n'est envoyée qu'à l'API de Google.

> **Note (juillet 2026) :** Google a changé le format des clés Gemini. Les
> nouvelles clés commencent maintenant par `AQ.` (« auth keys », liées à un
> compte de service, plus sûres) au lieu de `AIza…` (« standard keys »,
> progressivement désactivées : restreintes depuis le 19 juin 2026,
> complètement coupées en septembre 2026). L'app ne vérifie jamais la forme
> de la clé — colle-la telle quelle, peu importe son format, et clique sur
> « Tester ma clé » pour confirmer qu'elle fonctionne.

## Structure du projet

```
thecrazyanalyst/
├── index.html            point d'entrée HTML + balises PWA
├── vite.config.js
├── package.json
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js              service worker (cache l'app shell, jamais les appels IA)
│   └── icons/
└── src/
    ├── main.jsx           montage React + enregistrement du service worker
    └── App.jsx            toute l'application (composant unique, comme avant)
```
