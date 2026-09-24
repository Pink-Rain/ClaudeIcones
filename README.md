# ClaudeIcones — le moteur de tokens d'Eraser

Tout le travail de conception des tokens (septembre 2026) : le moteur de relief,
les accessoires, les cadres et les planches validées.

## Ce qu'on garde (planches dans `planches/`)
1. **Tokens de base** : 8 finitions × 4 états (Neuf, Abîmé, Très abîmé, Détruit).
   Or, Argent, Cuivre, Émail rouge, Émail bleu clair, Rouge vif, Vert vif, Bleu vif.
2. **Cadres épiques** : 20 entités spéciales.
3. **Boutiques, pack 1** : objets entassés, 7 boutiques + Marché ambulant.
4. à 7. **Boutiques, pack 2** : Vitrine, Enseigne, Auvent, Porte (7 boutiques + Marché ambulant chacun).
8. **Fonds sans PNJ, A · Intérieur** : 8 fonds (retenus). Les fonds B ne sont pas gardés.

Le Marché ambulant a la DA « étrange » (aubergine, laiton terni, symboles à l'os,
flammes vertes, corbeau, boule de cristal). Il n'existe pas encore dans l'appli
Eraser (7 types de boutique dans `lib/shop-schema.ts`) : à ajouter.

## Icônes d'objets (`icones/`)
- `icones/armes/` : 82 armes, PNG 512 × 512 fond transparent (style A « Relique », sans fond).
  Planches : `planches/armurerie-1.png`, `planches/armurerie-2.png`.
  Code : `moteur/armory.js` (+ `weapons.js`), aperçu `moteur/armory.html`
  (`?only=Katana|Lance&size=300&cols=2`), export PNG : `moteur/export-armory.html`.

## Le moteur (`moteur/`)
Tout tourne dans un navigateur, en canvas 512 × 512, sans dépendance.
- `relief.js` : moteur de relief (albédo, hauteur, matière, lumières, ombres portées,
  reflets, patine et usure par matière, tonemap). `Relief.createLayers()`, `Relief.render()`, `Relief.compose()`.
- `helpers.js` : formes (plumes, crânes, gemmes, chaînes, runes…).
- `props.js` : objets (livres, bougies, fioles, armes, tonneaux, roues…).
- `props-strange.js` : accessoires étranges (corbeau, cage, boule de cristal, bocal à œil, tarot, breloques).
- `base.js` : tokens de base. `frames*.js` : cadres épiques.
- `stalls.js` (symboles, planches), `shops2.js` (pack 1), `shops3.js` (pack 2), `backdrops.js` (fonds A et B).

## Voir et régénérer les planches
Ouvrir les pages HTML dans Chrome/Chromium (fichier local) :
- `base.html` — tokens de base (`?only=gold,vividRed&size=230`)
- `frames.html` — cadres épiques (`?cols=5&size=250`, `?only=witch&big=1`)
- `shops2.html` — boutiques (`?pack=1`, `?pack=2&concept=vitrine`, `&bg=A` pour le fond sans PNJ)
- `fonds.html`, `backdrops.html` — fonds ; `combo.html?preset=situation` — combinaisons
- `strange-test.html` — planche d'essai des accessoires étranges

Portrait d'essai : dépose une image `portrait.png` dans `moteur/` ; sinon une silhouette neutre est utilisée.
(Le portrait d'origine venait d'une capture personnelle ; il n'est volontairement pas inclus.)

Rendu automatique (Linux, Chromium) : `./recap.sh` refait les 8 planches récapitulatives
(`shot2.sh`, `boards.sh` sont les scripts de capture ; `crop.cjs` recadre avec `sharp`).

## Pour reprendre avec Claude
Donne ce dépôt à une session Claude Code et dis-lui : « lis le README, le moteur est dans `moteur/` ».
