/**
 * poser_mesure.js — insère `assets/mesure.js` dans toutes les pages de `public/`.
 *
 * À relancer après avoir ajouté une page : une page oubliée ne compte pas ses
 * visites, et c'est invisible — le rapport a simplement l'air plus creux.
 *
 * Idempotent : une page qui porte déjà la balise n'est pas retouchée. Rien
 * n'est écrit dans les sauvegardes (*.bak) ni dans les fichiers _backup_*.
 *
 *   node poser_mesure.js            # pose la balise
 *   node poser_mesure.js --verifier # dit seulement ce qui manque
 */
const fs = require('fs');
const path = require('path');

// Le dossier publié vient de firebase.json : « public » ici, la racine sur le
// site Ingénierie. Le même programme sert donc aux deux dépôts.
const PUBLIC = path.join(__dirname,
    JSON.parse(fs.readFileSync(path.join(__dirname, 'firebase.json'), 'utf8'))
        .hosting.public);
const BALISE = '<script defer src="/assets/mesure.js"></script>';
const VERIF = process.argv.includes('--verifier');

const pages = fs.readdirSync(PUBLIC)
    .filter((f) => f.endsWith('.html') && !f.startsWith('_backup_'));

let posees = 0; let deja = 0; const problemes = [];

for (const nom of pages) {
  const chemin = path.join(PUBLIC, nom);
  const html = fs.readFileSync(chemin, 'utf8');

  if (html.includes('assets/mesure.js')) { deja++; continue; }

  // On vise la fermeture du corps de page : le script part en dernier, après
  // le contenu, pour ne jamais retarder l'affichage.
  const fin = html.lastIndexOf('</body>');
  if (fin === -1) { problemes.push(`${nom} : pas de </body>`); continue; }

  if (VERIF) { problemes.push(`${nom} : balise absente`); continue; }

  const saut = html.slice(0, fin).match(/\r\n[^\r\n]*$/) ? '\r\n' : '\n';
  fs.writeFileSync(chemin,
      html.slice(0, fin) + BALISE + saut + html.slice(fin));
  posees++;
  console.log('  +', nom);
}

console.log(`${pages.length} pages : ${posees} balisées, ${deja} déjà en place.`);
if (problemes.length) {
  console.log('\nÀ REGARDER :');
  problemes.forEach((p) => console.log('  -', p));
  process.exitCode = 1;
}
