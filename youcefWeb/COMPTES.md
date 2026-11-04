# Comptes, mots de passe et documents

Tout est géré par le code du site (dossier `src/serveur`), sans service externe. Les données sont **chiffrées** (AES-256-GCM)
avant d'être écrites, les mots de passe sont **hachés** (scrypt) : personne, Youcef compris, ne peut les relire.

## Mise en place sur Vercel (une seule fois)

1. **Stockage** : projet Vercel → onglet **Storage** → *Create* → **Blob** → connectez-le au projet (cochez Production).
   Vercel ajoute tout seul la variable `BLOB_READ_WRITE_TOKEN`.
2. **Variables d'environnement** (Settings → Environment Variables, cochez *Sensitive* pour `APP_SECRET`) :

   | Variable | Valeur |
   |---|---|
   | `APP_SECRET` | un secret de 32 caractères minimum : `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `PRO_EMAIL` | l'adresse e-mail de Youcef |
   | `SITE_URL` | `https://youcef-web.vercel.app` (sans `/` final) |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | déjà définies pour les devis : elles servent aussi aux e-mails de réinitialisation |
   | `CALENDLY_TOKEN` | déjà définie |

3. **Redeploy**.
4. **Compte de Youcef** : sur la page de connexion, **« Mot de passe oublié ? »** avec l'adresse `PRO_EMAIL` → le lien reçu par e-mail
   permet de choisir son mot de passe (10 caractères minimum). Aucun mot de passe n'est écrit dans le code.

> ⚠️ **Gardez `APP_SECRET` précieusement** (gestionnaire de mots de passe). Sans lui, les données enregistrées sont définitivement illisibles.
> Ne le changez pas une fois le site en service.

## Fonctionnement
- Youcef crée un client (nom, e-mail, séances) → le site affiche **une seule fois** un code de première connexion à lui transmettre.
- À sa première connexion (e-mail + code), le client **doit** choisir son mot de passe. Ensuite, le code ne fonctionne plus et personne ne peut le lire.
- **Mot de passe oublié** (client ou Youcef) : saisie de l'e-mail → lien valable 1 heure, utilisable une seule fois.
- **Nouveau code** dans la fiche client : invalide le mot de passe actuel et en génère un provisoire à retransmettre.
- 5 mots de passe faux de suite bloquent la connexion 15 minutes.
- Un client ne voit que ses documents et ses séances ; seul Youcef dépose, supprime ou modifie le nombre de séances.

## Limites à connaître
- Documents : **4 Mo maximum** par fichier (limite des fonctions Vercel), formats PDF, images, Word, texte.
- Le stockage Vercel Blob gratuit est limité (environ 1 Go) : largement suffisant pour des documents de coaching.
- Les e-mails partent du compte Gmail configuré (environ 500 par jour).

## Développement local ou serveur personnel
Sans `BLOB_READ_WRITE_TOKEN`, les données sont écrites dans le dossier `./donnees` (ou `DATA_DIR`). Copiez `.env.example` en `.env`,
renseignez `APP_SECRET`, `PRO_EMAIL` et `SITE_URL=http://localhost:4200`, puis `npm start`. Le même code tourne tel quel sur
un serveur à vous (`npm run build` puis `npm run serve:ssr:youcefWeb`) : il suffit de sauvegarder le dossier de données **et** `APP_SECRET`.
