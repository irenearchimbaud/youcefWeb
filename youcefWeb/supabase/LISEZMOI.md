# Mise en place des comptes (Supabase)

Les comptes, mots de passe et documents sont gérés par Supabase (gratuit). À faire une seule fois.

## 1. Créer le projet
1. Compte sur https://supabase.com → **New project** (région *West EU (Paris)* de préférence). Notez le mot de passe de la base quelque part sûr (il ne sert pas au site).
2. **SQL Editor → New query** → collez tout [schema.sql](schema.sql) → **Run**.

## 2. Réglages d'authentification (Authentication)
- **Sign In / Providers → Email** : désactivez **« Allow new users to sign up »** (seuls les comptes créés par Youcef doivent exister) et mettez **Minimum password length = 10**.
- **URL Configuration** : *Site URL* = `https://youcef-web.vercel.app` ; dans *Redirect URLs*, ajoutez `https://youcef-web.vercel.app/nouveau-mot-de-passe` (et `http://localhost:4200/nouveau-mot-de-passe` pour tester en local).
- **Emails → SMTP Settings** : activez *Custom SMTP* avec le même compte Gmail que pour les devis (hôte `smtp.gmail.com`, port `465`, identifiant = l'adresse Gmail, mot de passe = mot de passe d'application). Sans cela, Supabase n'envoie que 2 e-mails par heure.
- **Emails → Templates → Reset Password** : vous pouvez traduire le texte du mail (gardez `{{ .ConfirmationURL }}`).

## 3. Créer le compte de Youcef
1. **Authentication → Users → Add user → Create new user** : son e-mail, un mot de passe provisoire, cochez **Auto Confirm User**.
2. **SQL Editor**, en remplaçant l'e-mail :
   ```sql
   insert into public.profiles (id, nom, email, role)
   select id, 'Youcef Tahri', email, 'pro' from auth.users where email = 'EMAIL_DE_YOUCEF';
   ```
3. Youcef se connecte sur le site, puis clique sur **« Mot de passe oublié ? »** pour choisir son vrai mot de passe (le provisoire ne doit servir qu'une fois).

## 4. Brancher le site
- Dans [../src/app/core/config.ts](../src/app/core/config.ts) : remplacez `SUPABASE_URL` et `SUPABASE_ANON_KEY` (Settings → API : *Project URL* et clé **anon / public**). Ces deux valeurs sont publiques par conception.
- Dans **Vercel → Settings → Environment Variables** (cochez *Sensitive* pour la clé) :
  - `SUPABASE_URL` : la même URL
  - `SUPABASE_SERVICE_ROLE_KEY` : la clé **service_role** (Settings → API). **Secrète** : ne la collez jamais dans le code, un chat ou GitHub.
- Puis **Redeploy**.

## Fonctionnement
- Youcef crée un client (nom, e-mail, séances) → le site affiche **une seule fois** un code de première connexion à lui transmettre. Ce code est le mot de passe provisoire du client ; il n'est stocké nulle part en clair.
- À sa première connexion (e-mail + code), le client est obligé de choisir son mot de passe. Ensuite, personne (Youcef compris) ne peut le lire.
- Mot de passe oublié : le client (ou Youcef) saisit son e-mail et reçoit un lien de réinitialisation.
- « Nouveau code » dans la fiche client invalide le mot de passe actuel et en génère un provisoire, à retransmettre.
