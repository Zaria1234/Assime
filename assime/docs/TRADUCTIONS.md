# Traductions d'Assimé (Éwé · Français · English)

Toutes les phrases de l'app sont dans `src/i18n.js`. Ce fichier est généré à partir de lui.

- **Français** : langue de référence, toutes les phrases.
- **English** : toutes les phrases traduites (y compris catégories, repères, missions de démonstration).
- **Éwé** : seulement des phrases courtes, **à faire vérifier par une personne qui parle éwé**. Toute phrase absente en éwé s'affiche en français.
- **Voix** : les navigateurs ne savent ni lire ni écouter l'éwé. En éwé, la voix utilise le français (fr-FR) ; en anglais, en-US.

Pour ajouter ou corriger une phrase éwé : ajouter la clé dans l'objet `ewe` de `src/i18n.js` (même clé que le français).

## 1. Phrases éwé à vérifier (18)

| Clé | Français | Éwé proposé | Vérifié ? |
|---|---|---|---|
| `decouverte.s1.titre` | Bienvenue à Asigamé | Woezɔ va Asigamé | ☐ |
| `decouverte.s2.titre` | Va où tu veux | Yi afi si nèdi | ☐ |
| `decouverte.s4.titre` | Parle à l'IA | Ƒo nu kple IA | ☐ |
| `decouverte.s6.titre` | Tu vends au marché ? | Èdzraa nu le asime ? | ☐ |
| `carte.bonjour` | Bonjour {nom} | Woezɔ {nom} | ☐ |
| `carte.question` | On va où aujourd'hui ? | Afi kae nàyi egbea ? | ☐ |
| `recherche.titre` | Que cherches-tu ? | Nukae nèle dim ? | ☐ |
| `commun.arrive` | Tu es arrivé·e ! | Èva ɖo ! | ☐ |
| `commun.yAller` | Y aller | Yi afi ma | ☐ |
| `commun.arreter` | Arrêter | Nɔ te | ☐ |
| `trajet.arreter` | Arrêter | Nɔ te | ☐ |
| `trajet.continuer` | Continuer | Yi edzi | ☐ |
| `commun.terminer` | Terminer | Wu enu | ☐ |
| `commun.ajouter` | Ajouter | Kpe ɖe eŋu | ☐ |
| `boutique.appeler` | Appeler | Yɔe | ☐ |
| `ia.envoyer` | Envoyer | Ðoe ɖa | ☐ |
| `liste.reste` | Il reste | Esi susɔ | ☐ |
| `commun.langue` | Langue | Gbe | ☐ |

## 2. Phrases encore en français quand l'éwé est choisi (430)

À traduire en éwé : ajouter la traduction dans l'objet `ewe`.

| Clé | Français | English |
|---|---|---|
| `commun.fini` | Fini | Done |
| `commun.retirerNom` | Retirer {nom} | Remove {nom} |
| `commun.modifierNom` | Modifier {nom} | Edit {nom} |
| `commun.supprimerNom` | Supprimer {nom} | Delete {nom} |
| `commun.direction` | Direction {dir} | Head {dir} |
| `commun.des` | dès {prix} F | from {prix} F |
| `commun.annuler` | Annuler | Cancel |
| `commun.enregistrer` | Enregistrer | Save |
| `commun.valider` | Valider | Confirm |
| `commun.creer` | Créer | Create |
| `commun.retour` | Retour | Back |
| `commun.fermer` | Fermer | Close |
| `commun.envoi` | Envoi… | Sending… |
| `commun.gros` | gros | wholesale |
| `dir.0` | le nord | north |
| `dir.1` | le nord-est | north-east |
| `dir.2` | l'est | east |
| `dir.3` | le sud-est | south-east |
| `dir.4` | le sud | south |
| `dir.5` | le sud-ouest | south-west |
| `dir.6` | l'ouest | west |
| `dir.7` | le nord-ouest | north-west |
| `cote.droite` | droite | the right |
| `cote.gauche` | gauche | the left |
| `horaires.non` | Horaires non indiqués | Opening hours not given |
| `erreur.echec` | Ça n'a pas marché, réessaie | That didn't work, try again |
| `erreur.micro` | Micro indisponible. Écris ta recherche. | Microphone unavailable. Type your search. |
| `erreur.codeExpire` | Code incorrect ou expiré. | Wrong or expired code. |
| `erreur.tropDemandes` | Trop de demandes. Attends une minute et réessaie. | Too many requests. Wait a minute and try again. |
| `serveur.boutiqueEnregistree` | Boutique enregistrée | Shop saved |
| `decouverte.aria` | Découvrir Assimé | Discover Assimé |
| `decouverte.passer` | Passer | Skip |
| `decouverte.passerAria` | Passer : aller à la dernière étape | Skip: go to the last step |
| `decouverte.progression` | Progression | Progress |
| `decouverte.etape` | Étape {i} sur {n} : {titre} | Step {i} of {n}: {titre} |
| `decouverte.slide` | {i} sur {n} | {i} of {n} |
| `decouverte.creer` | Créer un compte | Create an account |
| `decouverte.deja` | J'ai déjà un compte | I already have an account |
| `decouverte.s1.texte` | Assimé t'aide à te repérer dans le Grand Marché, dans ta langue. | Assimé helps you find your way around the Grand Market, in your language. |
| `decouverte.s2.texte` | Une boutique, la sortie, ta moto : l'app te guide d'un point à un autre. | A shop, the exit, your motorbike: the app guides you from one point to another. |
| `decouverte.s3.titre` | Trouve la bonne boutique | Find the right shop |
| `decouverte.s3.texte` | Cherche un article, compare, et laisse-toi guider jusqu'au stand. | Search for an item, compare, and let the app guide you to the stall. |
| `decouverte.s4.texte` | Dis ce que tu cherches : elle trouve, compare et te montre le chemin. | Say what you're looking for: it finds, compares and shows you the way. |
| `decouverte.s5.titre` | Ta liste, ton budget | Your list, your budget |
| `decouverte.s5.texte` | Coche tes achats à la voix, l'app calcule ce qu'il te reste. | Tick off your purchases by voice, the app works out what you have left. |
| `decouverte.s6.texte` | Place ta boutique sur la carte pour que les clients te trouvent. | Put your shop on the map so customers can find you. |
| `accueil.moto` | Ma moto | My motorbike |
| `accueil.etiquette` | Boutique de pagnes · 2 min | Wax print shop · 2 min |
| `accueil.avant` | Ne te | Don't get |
| `accueil.mot` | perds | lost |
| `accueil.apres` | plus à | in |
| `accueil.sous` | Retrouve ta moto, trouve ta boutique, gère ton budget. Guidé·e dans ta langue. | Find your motorbike, find your shop, manage your budget. Guided in your language. |
| `accueil.creer` | Créer mon compte | Create my account |
| `accueil.deja` | J'ai déjà un compte | I already have an account |
| `accueil.sans` | Continuer sans compte | Continue without an account |
| `entree.canal` | Moyen de connexion | Sign-in method |
| `entree.parTel` | Par téléphone | By phone |
| `entree.parEmail` | Par e-mail | By email |
| `entree.email` | Adresse e-mail | Email address |
| `entree.emailAide` | L'e-mail peut prendre une minute. Pense à regarder dans les spams. | The email can take a minute. Remember to check your spam folder. |
| `entree.tel` | Numéro de téléphone | Phone number |
| `inscription.titre` | Créer mon compte | Create my account |
| `inscription.titreVendeur` | Créer mon compte vendeur | Create my seller account |
| `inscription.intro` | Deux minutes, et tu gardes ta liste, tes trajets et tes boutiques préférées. | Two minutes, and you keep your list, your trips and your favourite shops. |
| `inscription.introVendeur` | Crée ton compte, puis place ta boutique sur la carte. | Create your account, then put your shop on the map. |
| `inscription.prenom` | Prénom | First name |
| `inscription.prenomPh` | Ton prénom | Your first name |
| `inscription.pourQuoi` | Je crée un compte pour… | I'm creating an account to… |
| `inscription.acheter` | Acheter | Buy |
| `inscription.acheterSous` | Me repérer, trouver des boutiques | Find my way, find shops |
| `inscription.vendre` | Vendre | Sell |
| `inscription.vendreSous` | Ma boutique sur la carte, et la navigation aussi | My shop on the map, plus navigation |
| `inscription.conditions` | J'accepte les conditions d'utilisation. Mes trajets restent sur mon téléphone sauf si je choisis de les partager. | I accept the terms of use. My trips stay on my phone unless I choose to share them. |
| `inscription.recevoir` | Recevoir mon code | Get my code |
| `inscription.deja` | Déjà un compte ? | Already have an account? |
| `inscription.meConnecter` | Me connecter | Sign in |
| `connexion.titre` | Me connecter | Sign in |
| `connexion.introEmail` | Entre ton e-mail, on t'envoie un code. | Enter your email, we'll send you a code. |
| `connexion.introTel` | Entre ton numéro, on t'envoie un code. | Enter your number, we'll send you a code. |
| `connexion.sansMdp` | Pas besoin de mot de passe. | No password needed. |
| `connexion.codeEmail` | Recevoir le code par e-mail | Get the code by email |
| `connexion.codeSms` | Recevoir le code par SMS | Get the code by SMS |
| `connexion.pasCompte` | Pas encore de compte ? | Don't have an account yet? |
| `connexion.creer` | Créer un compte | Create an account |
| `code.titre` | Entre le code reçu | Enter the code you received |
| `code.envoyeA` | Envoyé à {x} | Sent to {x} |
| `code.label` | Code à 6 chiffres | 6-digit code |
| `code.aideEmail` | L'e-mail peut prendre une minute. S'il contient un lien « Log In » au lieu d'un code, touche simplement le lien : tu seras connecté·e. | The email can take a minute. If it contains a « Log In » link instead of a code, just tap the link: you will be signed in. |
| `code.aideDemo` | Version de démonstration : n'importe quel code à 6 chiffres fonctionne. | Demo version: any 6-digit code works. |
| `code.connexion` | Connexion… | Signing in… |
| `role.titre` | Dis-nous qui tu es | Tell us who you are |
| `role.prenom` | Ton prénom | Your first name |
| `role.pourQuoi` | Tu utilises l'app pour… | You're using the app to… |
| `role.acheter` | Acheter et me repérer | Buy and find my way |
| `role.acheterSous` | Trajets, favoris, recherche de boutiques | Trips, favourites, shop search |
| `role.vendre` | Vendre au marché | Sell at the market |
| `role.vendreSous` | Ma boutique sur la carte, et la navigation aussi | My shop on the map, plus navigation |
| `role.plusTard` | Tu pourras changer plus tard dans ton profil. | You can change this later in your profile. |
| `role.toi` | Toi | You |
| `compteRequis.titre` | Pour vendre, crée d'abord ton compte | To sell, create your account first |
| `compteRequis.texte` | Ta boutique est liée à ton compte : toi seul·e peux la modifier. Sans compte, tu gardes la carte, la recherche et ta liste. | Your shop is linked to your account: only you can edit it. Without an account, you keep the map, search and your list. |
| `compteRequis.creer` | Créer mon compte | Create my account |
| `compteRequis.connecter` | J'ai déjà un compte | I already have an account |
| `nav.aria` | Navigation principale | Main navigation |
| `nav.carte` | Carte | Map |
| `nav.explorer` | Explorer | Explore |
| `nav.liste` | Ma liste | My list |
| `nav.boutique` | Ma boutique | My shop |
| `nav.missions` | Missions | Missions |
| `nav.profil` | Profil | Profile |
| `coeurs.aucun` | Pas encore de coup de cœur | No likes yet |
| `vote.titre` | Coup de cœur | Like |
| `vote.moins` | Merci. Ton avis va seulement au vendeur, pour qu'il s'améliore. | Thank you. Your opinion only goes to the seller, so they can improve. |
| `vote.plus` | Merci ! Ton pouce est visible sur la carte. | Thank you! Your thumbs-up is visible on the map. |
| `vote.n` | {n} visiteur a aimé. Et toi ? | {n} visitor liked it. What about you? |
| `vote.invite` | Tu es passé·e ici ? Donne ton avis. | Been here? Give your opinion. |
| `vote.aime` | J'ai aimé | I liked it |
| `vote.pasAime` | Je n'ai pas aimé | I didn't like it |
| `etat.local` | Données sur ce téléphone | Data on this phone |
| `etat.localDetail` | Tout reste sur ce téléphone | Everything stays on this phone |
| `etat.connexion` | Connexion à la base… | Connecting to the database… |
| `etat.connexionDetail` | Un instant | One moment |
| `etat.envoi` | Envoi en cours… | Sending… |
| `etat.synchro` | Synchronisé en ligne | Synced online |
| `etat.synchroDetail` | Boutiques, photos et coups de cœur partagés | Shops, photos and likes are shared |
| `etat.erreur` | Hors ligne | Offline |
| `etat.erreurDetail` | La base ne répond pas : l'app continue sur le téléphone | The database is not responding: the app keeps working on the phone |
| `carte.monProfil` | Mon profil | My profile |
| `carte.langue` | Langue : {langue}. Toucher pour changer | Language: {langue}. Tap to change |
| `carte.rechercher` | Boutique, article, repère… | Shop, item, landmark… |
| `carte.parlerIADirect` | Parler à l'IA en direct | Talk to the AI live |
| `carte.nouveauRaccourci` | Nouveau raccourci | New shortcut |
| `carte.exRaccourci` | ex. Ramco | e.g. Ramco |
| `carte.gererRaccourcis` | Gérer mes raccourcis | Manage my shortcuts |
| `carte.positionSimulee` | Position simulée | Simulated position |
| `carte.pointDepart` | Mon point de départ | My starting point |
| `carte.parlerIA` | Parler à l'IA | Talk to the AI |
| `carte.trajetEnCours` | Trajet en cours | Trip in progress |
| `carte.enregistrer` | Enregistrer mon trajet | Record my trip |
| `carte.modeDemo` | Mode démo | Demo mode |
| `carte.depart` | Départ | Start |
| `carte.credits` | Crédits de la carte | Map credits |
| `carte.creditsTexte` | Carte : © Esri, © OpenStreetMap · Leaflet | Map: © Esri, © OpenStreetMap · Leaflet |
| `carte.satellite` | Satellite | Satellite |
| `carte.plan` | Plan | Map |
| `carte.recentrer` | Recentrer | Recenter |
| `son.couper` | Couper le son | Mute |
| `son.coupe` | Son coupé · toucher pour remettre | Muted · tap to turn the sound back on |
| `son.couperVoix` | Couper la voix | Turn off the voice |
| `son.activerVoix` | Activer la voix | Turn on the voice |
| `trajet.enregistre` | Trajet enregistré | Trip recorded |
| `trajet.enPause` | En pause | Paused |
| `trajet.enregistrement` | Enregistrement… | Recording… |
| `trajet.demo` | démo | demo |
| `trajet.departMarque` | Ton point de départ est marqué | Your starting point is marked |
| `trajet.attenteGps` | En attente du GPS… | Waiting for GPS… |
| `trajet.duree` | durée | time |
| `trajet.parcourus` | parcourus | walked |
| `trajet.points` | points | points |
| `trajet.arrets` | arrêts | stops |
| `trajet.arret` | Arrêt {n} | Stop {n} |
| `trajet.arretMarque` | Arrêt {n} marqué. | Stop {n} marked. |
| `trajet.pauseArret` | Le trajet est en pause. Touche « Continuer » quand tu repars. | The trip is paused. Tap « Continue » when you set off again. |
| `trajet.pauseManuelle` | Trajet en pause. Touche « Continuer » pour reprendre. | Trip paused. Tap « Continue » to resume. |
| `trajet.marquerArret` | Marquer un arrêt | Mark a stop |
| `trajet.retourDepart` | Retourner à mon point de départ | Go back to my starting point |
| `trajet.terminer` | Terminer le trajet | End the trip |
| `retour.aucunTrajet` | Aucun trajet enregistré | No trip recorded |
| `retour.distance` | Point de départ : {d} | Starting point: {d} |
| `retour.enregistreEnArrivant` | Enregistre un trajet en arrivant | Record a trip when you arrive |
| `retour.justeLa` | Ton point de départ est juste là | Your starting point is right here |
| `retour.boucle` | Tu avais tourné en rond : on coupe la boucle. | You went round in circles: we cut out the loop. |
| `retour.envers` | On refait ton trajet à l'envers. | We retrace your trip backwards. |
| `retour.arretsCarte` | {n} arrêt marqué sur la carte. | {n} stop marked on the map. |
| `retour.aide` | Appuie sur « Enregistrer mon trajet » en arrivant : ton point de départ sera marqué pour le retour. | Tap « Record my trip » when you arrive: your starting point will be marked for the way back. |
| `retour.arreterGuidage` | Arrêter le guidage | Stop guidance |
| `recherche.label` | Recherche | Search |
| `recherche.placeholder` | Boutique, Ramco, banque, pagnes… | Shop, Ramco, bank, wax prints… |
| `recherche.parler` | Parler pour chercher | Speak to search |
| `recherche.aide` | Écris ou dis ce que tu cherches : une boutique (« pagnes pas chers »), un repère (« pharmacie ») ou une enseigne de Lomé (« Ramco », « Ecobank »). | Type or say what you are looking for: a shop (« cheap wax prints »), a landmark (« pharmacy ») or a place in Lomé (« Ramco », « Ecobank »). |
| `recherche.boutiques` | Boutiques sur Assimé | Shops on Assimé |
| `recherche.aucune` | Aucune boutique Assimé pour « {q} ». | No Assimé shop for « {q} ». |
| `recherche.reperes` | Repères du marché | Market landmarks |
| `recherche.surCarte` | Sur la carte de Lomé | On the map of Lomé |
| `recherche.chercherCarte` | Chercher « {q} » sur la carte | Search « {q} » on the map |
| `recherche.enCours` | Recherche en cours… | Searching… |
| `recherche.rien` | Rien trouvé sur la carte. | Nothing found on the map. |
| `recherche.osm` | Données © OpenStreetMap | Data © OpenStreetMap |
| `recherche.erreurCarte` | Recherche sur la carte indisponible ici (pas d'accès internet dans l'aperçu). | Map search unavailable here (no internet access in the preview). |
| `boutique.introuvable` | Boutique introuvable | Shop not found |
| `boutique.verifiee` | Position vérifiée | Verified location |
| `boutique.gros` | Vente en gros | Wholesale |
| `boutique.momo` | Mobile money | Mobile money |
| `boutique.ouvert` | Ouvert | Open |
| `boutique.photoDe` | Photo de {nom} | Photo of {nom} |
| `boutique.changerPhoto` | Changer la photo | Change the photo |
| `boutique.retirerFavoris` | Retirer des favoris | Remove from favourites |
| `boutique.ajouterFavoris` | Ajouter aux favoris | Add to favourites |
| `boutique.favori` | Favori | Favourite |
| `boutique.contacter` | Contacter le vendeur | Contact the seller |
| `boutique.pasNumero` | Le vendeur n'a pas encore ajouté son numéro. | The seller hasn't added a number yet. |
| `boutique.articles` | Articles | Items |
| `boutique.enVitrine` | {n} en vitrine | {n} on display |
| `boutique.rupture` | Rupture | Out of stock |
| `boutique.prixSurPlace` | Prix sur place | Price on site |
| `boutique.commentTrouver` | Comment la trouver | How to find it |
| `boutique.boutique` | Boutique | Shop |
| `boutique.emmener` | M'y emmener | Take me there |
| `photo.ajouter` | Ajouter une photo | Add a photo |
| `guidage.destination` | Destination | Destination |
| `guidage.introuvable` | Destination introuvable | Destination not found |
| `guidage.gps` | Recherche du GPS… | Looking for GPS… |
| `guidage.activer` | Active ta localisation | Turn on your location |
| `guidage.justeLa` | {nom} est juste là | {nom} is right here |
| `guidage.consigne` | Tout droit {d}, puis à {cote} | Straight on for {d}, then turn to {cote} |
| `guidage.direction` | {nom} · direction {dir} | {nom} · head {dir} |
| `guidage.chargementPlan` | Chargement du plan des rues… | Loading the street map… |
| `guidage.parRues` | Par les rues (OpenStreetMap) | Along the streets (OpenStreetMap) |
| `guidage.volOiseau` |  · derniers {d} à vol d'oiseau |  · last {d} as the crow flies |
| `guidage.ligneDroite` | Ligne droite : pas de rue tracée assez près | Straight line: no street mapped close enough |
| `guidage.planIndispo` | Ligne droite : plan des rues indisponible | Straight line: street map unavailable |
| `guidage.retourCarte` | Retour à la carte | Back to the map |
| `guidage.demarrer` | Démarrer le guidage | Start guidance |
| `guidage.pause` | Le guidage est en pause. | Guidance is paused. |
| `guidage.poursuivre` | Poursuivre le guidage | Resume guidance |
| `guidage.arrive` | Je suis arrivé·e | I've arrived |
| `explorer.salut` | Salut {nom} | Hi {nom} |
| `explorer.titre` | Explorer le marché | Explore the market |
| `explorer.rechercher` | Rechercher | Search |
| `explorer.zone` | Zone à découvrir | Area to discover |
| `explorer.zoneInfo` | {min} min à pied · {n} boutiques | {min} min walk · {n} shops |
| `explorer.parlerIA` | Parler à l'IA en direct | Talk to the AI live |
| `explorer.exemple` | « Je cherche du riz en gros pas cher » | « I want cheap rice in bulk » |
| `explorer.categories` | Catégories | Categories |
| `explorer.toutes` | Toutes les boutiques | All shops |
| `explorer.trouvees` | {n} trouvée | {n} found |
| `explorer.pourToi` | ✦ Choisies par l'IA selon ce que tu cherches et regardes | ✦ Picked by the AI from what you search and look at |
| `explorer.aucunFavori` | Aucun favori. Touche « Ajouter aux favoris » sur une boutique. | No favourites. Tap « Add to favourites » on a shop. |
| `explorer.aucune` | Aucune boutique ici pour le moment. | No shops here yet. |
| `explorer.reperes` | Repères du marché | Market landmarks |
| `explorer.approx` | positions approx. | approx. positions |
| `explorer.verifiee` | Vérifiée | Verified |
| `liste.titre` | Mes listes | My lists |
| `liste.sous` | {f} sur {n} trouvés | {f} of {n} found |
| `liste.nouvelle` | Nouvelle liste | New list |
| `liste.maListe` | Ma liste | My list |
| `liste.renommer` | Renommer | Rename |
| `liste.vider` | Vider | Clear |
| `liste.supprimer` | Supprimer la liste | Delete the list |
| `liste.nomLabel` | Nom de la liste | List name |
| `liste.nomPh` | Ex. : Fête de dimanche | E.g. Sunday party |
| `liste.budget` | Budget ✎ | Budget ✎ |
| `liste.budgetAria` | Budget en FCFA | Budget in FCFA |
| `liste.depense` | Dépensé | Spent |
| `liste.ajouterLabel` | Ajouter un article | Add an item |
| `liste.ajouterPh` | Ajouter : ex. sac à main | Add: e.g. handbag |
| `liste.article` | Article | Item |
| `liste.prix` | Prix (F) | Price (F) |
| `liste.cocher` | Cocher {nom} | Tick {nom} |
| `liste.decocher` | Décocher {nom} | Untick {nom} |
| `liste.prixInconnu` | prix ? | price? |
| `liste.sugg` | {n} boutique · {zone} | {n} shop · {zone} |
| `liste.aucuneSugg` | Pas encore de boutique connue | No known shop yet |
| `liste.vide1` | Ta liste est vide. | Your list is empty. |
| `liste.vide2` | Écris ce que tu viens acheter juste au-dessus, puis « Ajouter ». | Type what you came to buy just above, then « Add ». |
| `liste.assistant` | Parler à l'assistant | Talk to the assistant |
| `assistant.titre` | Ma liste · assistant | My list · assistant |
| `assistant.accueil` | Dis-moi ce que tu as trouvé, ce que tu veux ajouter, ou demande-moi combien il te reste. | Tell me what you've found, what you want to add, or ask me how much you have left. |
| `assistant.micro` | Micro indisponible. Écris ta phrase. | Microphone unavailable. Type your sentence. |
| `assistant.allerA` | Aller à {cat} | Go to {cat} |
| `assistant.c1` | J'ai trouvé les chaussures à 8 000 | I found the shoes for 8,000 |
| `assistant.c2` | Ajoute du savon | Add soap |
| `assistant.c3` | Combien il me reste ? | How much do I have left? |
| `assistant.phrase` | Ta phrase | Your sentence |
| `assistant.placeholder` | ex. : j'ai trouvé le sac à 12 000 | e.g. I found the bag for 12,000 |
| `assistant.aide` | Dis « j'ai trouvé… », « ajoute… » ou « combien il me reste ? » | Say « I found… », « add… » or « how much do I have left? » |
| `ia.titre` | IA en direct | Live AI |
| `ia.bonjour` | Bonjour{nom} ! Dis-moi ce que tu cherches au marché, ou parle-moi de ta liste. | Hello{nom}! Tell me what you're looking for at the market, or tell me about your list. |
| `ia.voirListe` | Voir ma liste | See my list |
| `ia.retourDepart` | Retour à mon point de départ | Back to my starting point |
| `ia.jeTeRamene` | Je te ramène à ton point de départ par le chemin le plus court. | I'll take you back to your starting point by the shortest way. |
| `ia.pasEnregistre` | Tu n'as pas encore enregistré ton trajet. Touche « Enregistrer mon trajet » en arrivant, je pourrai te ramener. | You haven't recorded your trip yet. Tap « Record my trip » when you arrive, and I'll be able to take you back. |
| `ia.externe` | {q} n'est pas une boutique du marché, mais je l'ai trouvé à Lomé : {nom}{dist}. Je peux t'y guider. | {q} isn't a market shop, but I found it in Lomé: {nom}{dist}. I can guide you there. |
| `ia.introuvable` | Je ne trouve « {q} » ni dans le marché ni sur la carte de Lomé. Essaie un autre mot. | I can't find « {q} » in the market or on the map of Lomé. Try another word. |
| `ia.chercherCarte` | Chercher sur la carte de Lomé | Search the map of Lomé |
| `ia.direct` | En direct | Live |
| `ia.enPause` | En pause | Paused |
| `ia.toucher` | Touche pour parler | Tap to talk |
| `ia.ecrire` | Écris ta question | Type your question |
| `ia.ecoute` | Je t'écoute… | I'm listening… |
| `ia.reflexion` | Je réfléchis… | I'm thinking… |
| `ia.parle` | Je réponds… | I'm answering… |
| `ia.reflechit` | L'IA réfléchit… | The AI is thinking… |
| `ia.enLigne` | ✦ IA Assimé | ✦ Assimé AI |
| `ia.horsLigne` | Mode hors ligne | Offline mode |
| `ia.sources` | Sources : | Sources: |
| `ia.carteLome` | Carte de Lomé © OpenStreetMap | Map of Lomé © OpenStreetMap |
| `ia.arreterConversation` | Arrêter la conversation | Stop the conversation |
| `ia.parlerDirect` | Parler à l'IA en direct | Talk to the AI live |
| `ia.microAide` | Le micro marche sur le lien de l'app (Chrome ou Safari). Ici, écris ta question. | The microphone works on the app's link (Chrome or Safari). Here, type your question. |
| `ia.question` | Ta question | Your question |
| `ia.placeholder` | Ou écris ici… | Or type here… |
| `ia.c1` | Je cherche du riz en gros | I'm looking for rice in bulk |
| `ia.c2` | Où est la pharmacie ? | Where is the pharmacy? |
| `ia.c3` | Où trouver des mèches ? | Where can I find hair extensions? |
| `ia.c4` | Tu connais Ramco ? | Do you know Ramco? |
| `ia.c5` | Combien il me reste ? | How much do I have left? |
| `ia.c6` | Ramène-moi à mon point de départ | Take me back to my starting point |
| `iaL.dist` | , à {d} | , {d} away |
| `iaL.gros` |  en gros |  (wholesale) |
| `iaL.trouve` | J'ai trouvé {n} boutique{quoi}{gros}{tri}. | I found {n} shop{quoi}{gros}{tri}. |
| `iaL.tri` | , de la moins chère à la plus chère | , from cheapest to most expensive |
| `iaL.premier` | {qui} : {nom}{dist}. | {qui}: {nom}{dist}. |
| `iaL.moinsChere` | La moins chère | The cheapest |
| `iaL.plusProche` | La plus proche | The nearest |
| `iaL.aussi` |  Il y a aussi {nom}{dist}. |  There is also {nom}{dist}. |
| `iaL.repere` | {nom}{dist}{note}. Je t'y emmène ? | {nom}{dist}{note}. Shall I take you there? |
| `iaL.pasBoutique` | Je n'ai pas encore de boutique{quoi}{gros} sur Assimé. | I don't have a shop{quoi}{gros} on Assimé yet. |
| `iaL.inconnu` | Je ne connais pas encore « {q} » dans le marché. Je peux le chercher sur la carte de Lomé. | I don't know « {q} » in the market yet. I can search the map of Lomé for it. |
| `iaL.siOui` | Oui. Après ça, il te resterait {m} FCFA. | Yes. After that, you would have {m} FCFA left. |
| `iaL.siNon` | Non, il te manquerait {m} FCFA. | No, you would be {m} FCFA short. |
| `iaL.bilan` | Tu as dépensé {d} sur {b} FCFA. Il te reste {r}. | You've spent {d} out of {b} FCFA. You have {r} left. |
| `iaL.encore` |  Encore à trouver : {liste}. |  Still to find: {liste}. |
| `iaL.tout` |  Tu as tout trouvé ! |  You've found everything! |
| `iaL.quoiAjouter` | Dis-moi ce que je dois ajouter. | Tell me what to add. |
| `iaL.note` | C'est noté : {nom}. | Noted: {nom}. |
| `iaL.coche` | {nom} coché{m}. Tu as dépensé {d} sur {b}, il te reste {r}. | {nom} ticked{m}. You've spent {d} out of {b}, you have {r} left. |
| `iaL.essaie` | Essaie : « j'ai trouvé les chaussures à 8 000 », « ajoute du savon » ou « combien il me reste ? » | Try: « I found the shoes for 8,000 », « add soap » or « how much do I have left? » |
| `iaL.budgetOk` | Tu as dépensé {d} francs. Il te reste {r} francs. | You've spent {d} francs. You have {r} francs left. |
| `iaL.budgetDepasse` | Tu as dépensé {d} francs : tu dépasses ton budget de {r} francs. | You've spent {d} francs: you're {r} francs over budget. |
| `missions.titre` | Missions | Missions |
| `missions.titreVendeur` | Missions vendeur | Seller missions |
| `missions.sous` | Aide à dessiner la carte d'Asigamé | Help draw the map of Asigamé |
| `missions.sousVendeur` | Rends ta boutique plus visible | Make your shop more visible |
| `missions.defi` | Défi du jour | Today's challenge |
| `missions.points` | {n} points | {n} points |
| `missions.vendeur` | Vendeur·se | Seller |
| `missions.explorateur` | Explorateur·rice | Explorer |
| `missions.niveau` | niveau {niveau} · encore {reste} pts | level {niveau} · {reste} pts to go |
| `missions.duJour` | Missions du jour | Today's missions |
| `missions.fait` | Fait | Done |
| `missions.info` | Chaque trajet que tu enregistres aide à tracer les allées du marché. Plus on marche, plus la carte devient précise. | Every trip you record helps map the market aisles. The more we walk, the more accurate the map becomes. |
| `profil.invite` | Invité·e | Guest |
| `profil.sansCompte` | Sans compte | No account |
| `profil.vendeur` | Vendeur·se | Seller |
| `profil.acheteur` | Acheteur·se | Buyer |
| `profil.creer` | Créer un compte | Create an account |
| `profil.vends` | Tu vends au marché ? | Do you sell at the market? |
| `profil.vendsSous` | Ouvre ton espace vendeur. Tu gardes la navigation. | Open your seller space. You keep navigation. |
| `profil.espaceVendeur` | Mon espace vendeur | My seller space |
| `profil.missions` | Mes missions · {n} points | My missions · {n} points |
| `profil.trajets` | Mes trajets | My trips |
| `profil.trajetInfo` | {d} · {n} points | {d} · {n} points |
| `profil.aucunTrajet` | Aucun trajet pour l'instant. | No trips yet. |
| `profil.favorites` | Mes boutiques favorites | My favourite shops |
| `profil.discuter` | Discuter avec l'IA | Chat with the AI |
| `profil.discuterSous` | Pose ta question à voix haute ou par écrit | Ask your question out loud or in writing |
| `profil.decouvrir` | Découvrir Assimé | Discover Assimé |
| `profil.decouvrirSous` | Revoir la présentation de l'app | See the app introduction again |
| `profil.reglages` | Réglages | Settings |
| `profil.langue` | Langue de l'app | App language |
| `profil.deconnecter` | Se déconnecter | Sign out |
| `vendeur.espace` | Espace vendeur | Seller space |
| `vendeur.maBoutique` | Ma boutique | My shop |
| `vendeur.visible` | Visible sur la carte | Visible on the map |
| `vendeur.coeurs` | Mes coups de cœur | My likes |
| `vendeur.coeursVisibles` | visibles sur la carte | visible on the map |
| `vendeur.pouces` | pouces levés affichés | thumbs-up shown |
| `vendeur.aucunCoeur` | Ta boutique n'a pas encore de coup de cœur | Your shop doesn't have any likes yet |
| `vendeur.moins` | {n} client n'a pas aimé. | {n} customer didn't like it. |
| `vendeur.moinsTexte` | Toi seul·e le vois : ce n'est pas affiché sur la carte. Chaque pouce baissé retire un pouce levé. | Only you can see this: it isn't shown on the map. Each thumbs-down removes one thumbs-up. |
| `vendeur.semaine` | Cette semaine | This week |
| `vendeur.vues` | vues de ta fiche | views of your page |
| `vendeur.guides` | clients guidés | customers guided |
| `vendeur.whatsapp` | messages WhatsApp | WhatsApp messages |
| `vendeur.stats` | Les statistiques arriveront avec le back-end. | Statistics will come with the back-end. |
| `vendeur.gerer` | Gérer | Manage |
| `vendeur.modifier` | Modifier ma boutique | Edit my shop |
| `vendeur.creer` | Créer ma boutique | Create my shop |
| `vendeur.articles` | Mes articles et prix | My items and prices |
| `vendeur.voirFiche` | Voir ma fiche comme un client | See my page as a customer |
| `vendeur.missions` | Mes missions vendeur | My seller missions |
| `vendeur.missionsSous` | Photos, numéro, prix : gagne des points et de la visibilité | Photos, number, prices: earn points and visibility |
| `vendeur.naviguer` | Naviguer dans le marché | Get around the market |
| `vendeur.naviguerSous` | Va chez un fournisseur, retrouve ton point de départ | Visit a supplier, find your way back to your starting point |
| `photo.erreur` | Cette image n'a pas pu être lue. | This image couldn't be read. |
| `photo.changer` | Changer | Change |
| `photo.retirer` | Retirer | Remove |
| `photo.couverture` | Photo de couverture (ton stand, ta vitrine) | Cover photo (your stall, your shop window) |
| `photo.logo` | Logo | Logo |
| `photo.photo` | Photo | Photo |
| `form.obligatoire` | obligatoire | required |
| `form.nom` | Nom de la boutique | Shop name |
| `form.nomPh` | Ex. : Chez Aurore Pagnes | E.g. Aurore's Wax Prints |
| `form.vends` | Ce que je vends | What I sell |
| `form.autre` | + Autre chose | + Something else |
| `form.autrePh` | Écris ce que tu vends (ex. : Mèches, Téléphones…) | Type what you sell (e.g. hair extensions, phones…) |
| `form.autreAria` | Autre catégorie | Other category |
| `form.ou` | Où est ma boutique ? | Where is my shop? |
| `form.gps` | Utiliser ma position GPS | Use my GPS location |
| `form.gpsSimule` | GPS indisponible ici : position simulée. Touche la carte pour corriger. | GPS unavailable here: simulated position. Tap the map to correct it. |
| `form.gpsOk` | Position GPS enregistrée. | GPS position saved. |
| `form.gpsIntrouvable` | Position introuvable. Touche la carte à l'endroit de ton stand. | Position not found. Tap the map where your stall is. |
| `form.posOk` | Position enregistrée. Touche la carte pour la corriger. | Position saved. Tap the map to correct it. |
| `form.posAide` | Mets-toi devant ton stand et touche le bouton, ou touche la carte. | Stand in front of your stall and tap the button, or tap the map. |
| `form.repere` | Repère pour me trouver | Landmark to find me |
| `form.reperePh` | Ex. : en face de la zone des sacs | E.g. opposite the bag area |
| `form.contact` | Contact (au moins un) | Contact (at least one) |
| `form.tel` | Téléphone | Phone |
| `form.wa` | WhatsApp | WhatsApp |
| `form.horaires` | Horaires | Opening hours |
| `form.horairesPh` | Ex. : Lun–Sam · 7h–18h | E.g. Mon–Sat · 7am–6pm |
| `form.enregistrer` | Enregistrer les modifications | Save changes |
| `form.publier` | Publier ma boutique | Publish my shop |
| `form.lourd` | Photos trop lourdes pour le téléphone. Essaie une autre image. | Photos too heavy for the phone. Try another image. |
| `form.errNom` | Indique le nom de ta boutique | Enter your shop name |
| `form.errCat` | Indique ce que tu vends | Say what you sell |
| `form.errPos` | Indique où est ta boutique : touche le bouton GPS ou la carte | Show where your shop is: tap the GPS button or the map |
| `form.errContact` | Indique un numéro de téléphone ou WhatsApp | Enter a phone or WhatsApp number |
| `form.manque` | Complète les champs en rouge. | Fill in the fields in red. |
| `articles.titre` | Mes articles | My items |
| `articles.creerDabord` | Créer ma boutique d'abord | Create my shop first |
| `articles.ajouter` | + Article | + Item |
| `articles.premier` | + Ajouter mon premier article | + Add my first item |
| `articles.nomPh` | Nom de l'article | Item name |
| `articles.prixPh` | Prix en FCFA | Price in FCFA |
| `articles.enStock` | En stock | In stock |
| `articles.rupture` | Rupture | Out of stock |
| `articles.prixNon` | Prix non indiqué | No price given |
| `articles.info` | Quand un client cherche un article que tu as en stock, l'IA lui propose ta boutique. | When a customer looks for an item you have in stock, the AI suggests your shop. |

## 3. Données traduites seulement en anglais (71)

Catégories, repères, zones, missions et messages du serveur : en français, c'est le texte d'origine des données ; en éwé, il reste en français.

| Clé | English |
|---|---|
| `cat.Pagnes wax` | Wax prints |
| `cat.Tissus` | Fabrics |
| `cat.Épices` | Spices |
| `cat.Alimentation` | Food |
| `cat.Mèches et coiffure` | Hair & braiding |
| `cat.Artisanat` | Crafts |
| `cat.Friperie` | Second-hand clothes |
| `cat.Chaussures` | Shoes |
| `cat.Cosmétiques` | Cosmetics |
| `cat.Perles et bijoux` | Beads & jewellery |
| `cat.Sacs` | Bags |
| `cat.Vaisselle` | Kitchenware |
| `cat.Autre` | Other |
| `cat.Tout` | All |
| `cat.Pour toi` | For you |
| `cat.Favoris` | Favourites |
| `cat.Tourisme et souvenirs` | Tourism & souvenirs |
| `cat.Alimentation générale` | Groceries |
| `cat.Grossistes` | Wholesalers |
| `cat.Église` | Church |
| `cat.Banque` | Bank |
| `cat.Librairie` | Bookshop |
| `cat.Pharmacie` | Pharmacy |
| `cat.Section` | Section |
| `cat.Parking` | Parking |
| `cat.Toilettes` | Toilets |
| `cat.Eau` | Water |
| `cat.Lieu` | Place |
| `lieu.cathedrale.nom` | Sacred Heart Cathedral |
| `lieu.cathedrale.note` | Big red landmark in the heart of the market |
| `lieu.ecobank.note` | Rue du Commerce |
| `lieu.bonpasteur.nom` | Bon Pasteur bookshop & stationery |
| `lieu.bonpasteur.note` | Rue du Commerce, opposite Ecobank Assigamé |
| `lieu.pharmacie.nom` | Grand Market Pharmacy |
| `lieu.pharmacie.note` | Corner of rue du Grand Marché and av. de la Libération |
| `lieu.atipoji.note` | One of the three sections of the Grand Market |
| `lieu.asigame.note` | One of the three sections of the Grand Market |
| `lieu.assivito.note` | One of the three sections of the Grand Market |
| `lieu.parking.nom` | Motorbike parking |
| `lieu.parking.note` | To be surveyed on site |
| `lieu.toilettes.nom` | Toilets |
| `lieu.toilettes.note` | To be surveyed on site |
| `lieu.momo.note` | To be surveyed on site |
| `lieu.eau.nom` | Water point |
| `lieu.eau.note` | To be surveyed on site |
| `zone.pagnes` | Wax print area |
| `zone.epices` | Spice area |
| `zone.chaussures` | Shoe area |
| `mission.m1.titre` | Record your first trip |
| `mission.m1.detail` | Record a trip from start to finish |
| `liste.demo` | Saturday market (demo) |
| `mission.m2.titre` | Photograph the wax print aisle |
| `mission.m2.detail` | For the remote visit |
| `mission.m3.titre` | Confirm 3 shops near you |
| `mission.m3.detail` | Is it still there? |
| `mission.m4.titre` | Report a blocked passage |
| `mission.m4.detail` | Roadworks, flooding, crowds |
| `mission.v1.titre` | Put your shop on the map |
| `mission.v1.detail` | Stand in front of your stall |
| `mission.v2.titre` | Add your WhatsApp number |
| `mission.v2.detail` | Customers will be able to reach you |
| `mission.v3.titre` | Add 3 photos of your items |
| `mission.v3.detail` | A shop with photos attracts more customers |
| `mission.v4.titre` | Add prices for 5 items |
| `mission.v4.detail` | The AI will suggest your shop |
| `mission.v5.titre` | Invite a neighbouring seller |
| `mission.v5.detail` | More shops, more customers |
| `srv.Numéro invalide` | Invalid number |
| `srv.Code incorrect` | Wrong code |
| `srv.Aucun compte avec ce numéro. Crée ton compte.` | No account with this number. Create your account. |
| `srv.Comptes indisponibles sur le serveur` | Accounts unavailable on the server |

## 4. Contrôle

Toutes les phrases françaises ont une traduction anglaise.
