/**
 * Découpe le site une-page de l'Ingénierie en vraies pages.
 *
 * Avant : index.html = 174 Ko, tout le contenu sur une seule URL. Google ne
 * peut classer qu'UNE page sur UNE requête ; onze prestations, un logiciel et
 * une FAQ se partageaient ce seul billet de loterie.
 *
 * Après :
 *   - assets/style.css     : la feuille (18 Ko) extraite, partagée par tout
 *   - prestations.html     : sections prestations + secteurs + demarche
 *   - logiciels.html       : sections logiciel + formules-expert (+ script Stripe)
 *   - a-propos.html        : sections mission + engagements + faq
 *   - mentions-legales.html: section mentions-legales
 *   - index.html           : hero + vue d'ensemble (cartes) + contact + footer
 *
 * Les pages n'embarquent NI le carrousel de fond (85 Ko de base64) NI le logo
 * base64 : un bandeau léger, l'image d'entête vient des .webp du dépôt.
 * Le script « reveal » est réécrit avec gardes ; le script Stripe est copié
 * tel quel sur logiciels.html (il garde déjà chaque accès par querySelector).
 *
 * SIMULATION par défaut. Rien n'est écrit sans --apply.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const APPLY = process.argv.includes('--apply');
const DIR = __dirname;
const BASE = 'https://xn--onn-offingnierie-kqb.fr';

const h = fs.readFileSync(path.join(DIR, 'index.html'), 'utf8');

// ---------- extraction ----------
const styleM = h.match(/(?<ouv><style[^>]*>)(?<css>[\s\S]*?)<\/style>/);
if (!styleM) throw new Error('style introuvable');
const css = styleM.groups.css;

function section(id) {
  const deb = h.indexOf('<section' , h.indexOf(`id="${id}"`) - 200);
  const marque = `id="${id}"`;
  let i = h.indexOf(marque);
  // remonter au <section qui porte cet id
  i = h.lastIndexOf('<section', i);
  const fin = h.indexOf('</section>', i) + '</section>'.length;
  if (i < 0 || fin < i) throw new Error('section introuvable : ' + id);
  return {debut: i, fin, html: h.slice(i, fin)};
}
const S = {};
for (const id of ['logiciel', 'formules-expert', 'prestations', 'secteurs',
  'demarche', 'mission', 'engagements', 'faq', 'contact', 'mentions-legales']) {
  S[id] = section(id);
}
const stripeM = h.match(/(?<tout><script>\s*\/\* Formules ONNOFF Expert[\s\S]*?<\/script>)/);
if (!stripeM) throw new Error('script Stripe introuvable');

// ---------- gabarit des pages ----------
const NAV = `<nav>
  <div class="wrap">
    <a href="/" class="brand" style="font-weight:800;letter-spacing:.02em;text-decoration:none">ONN·OFF <span style="font-weight:400;opacity:.75">Ingénierie &amp; Conseil</span></a>
    <div class="nav-links">
      <a href="/prestations.html">Prestations</a>
      <a href="/logiciels.html">Logiciels</a>
      <a href="/a-propos.html">À propos</a>
      <a href="/#contact" class="nav-cta">Me contacter</a>
    </div>
  </div>
</nav>`;

const FOOTER = `<footer>
  <div class="wrap">
    <div><b>Onn·Off Ingénierie &amp; Conseil</b> — Paris, France</div>
    <div>SIRET 804 574 218 00066 · TVA non applicable, art. 293 B du CGI · © 2026 · <a href="/mentions-legales.html" style="border-bottom:1px solid rgba(245,242,239,.3)">Mentions légales</a></div>
  </div>
</footer>`;

const REVEAL = `<script>
// Apparition douce des blocs. Chaque accès est gardé : sur une page qui n'a
// pas de .reveal, rien ne casse (leçon du 28/08 sur site-onn).
(function(){
  var els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('in'); }); return; }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, {threshold: .12});
  els.forEach(function(e){ obs.observe(e); });
})();
</script>`;

function page({fichier, titre, description, fil, heroImg, eyebrow, h1, lede, corps, scripts}) {
  const url = `${BASE}/${fichier}`;
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${titre}</title>
<meta name="description" content="${description}">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:title" content="${titre}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<link rel="stylesheet" href="assets/style.css">
<style>
/* entête de page : léger, sans le carrousel de l'accueil */
.page-hero{position:relative;padding:120px 0 64px;background:#1E2A38 url('img/${heroImg}') center/cover no-repeat}
.page-hero::before{content:"";position:absolute;inset:0;background:linear-gradient(120deg,rgba(20,28,38,.92),rgba(20,28,38,.62))}
.page-hero .wrap{position:relative}
.page-hero h1{color:#F5F2EF;font-size:clamp(30px,4.6vw,46px);margin:14px 0 0;line-height:1.15}
.page-hero .lede{color:rgba(245,242,239,.85);max-width:640px;margin:16px 0 0;font-size:18px}
.crumb{position:relative;font-size:13px;color:rgba(245,242,239,.75)}
.crumb a{color:inherit;text-decoration:none;border-bottom:1px solid rgba(245,242,239,.35)}
main > section{scroll-margin-top:80px}
</style>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Accueil","item":"${BASE}/"},{"@type":"ListItem","position":2,"name":"${fil}","item":"${url}"}]}</script>
</head>
<body>
${NAV}
<header class="page-hero">
  <div class="wrap">
    <div class="crumb"><a href="/">Accueil</a> › ${fil}</div>
    <p class="eyebrow" style="color:#D8B24A;margin:18px 0 0">${eyebrow}</p>
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
  </div>
</header>
<main>
${corps}
</main>
${FOOTER}
${REVEAL}
${scripts || ''}
</body></html>
`;
}

const PAGES = [
  page({
    fichier: 'prestations.html',
    titre: 'Prestations — Onn-Off Ingénierie & Conseil, Paris',
    description: 'Ingénierie, AMO, audit, pilotage de projets, management des risques, sécurité incendie : onze prestations, les secteurs couverts et la démarche.',
    fil: 'Prestations', heroImg: 'bg-prestations.webp', eyebrow: 'Ce que nous faisons',
    h1: 'Des prestations d’ingénierie cadrées, sans superflu',
    lede: 'Études techniques, assistance à maîtrise d’ouvrage, audits, coordination : chaque mission commence par un périmètre clair et finit par des livrables actionnables.',
    corps: [S['prestations'].html, S['secteurs'].html, S['demarche'].html].join('\n\n'),
  }),
  page({
    fichier: 'logiciels.html',
    titre: 'Logiciels métier — ONNOFF Expert SSI',
    description: 'ONNOFF Expert SSI, le logiciel des coordinateurs SSI et responsables sécurité : registres, plans, commissions de sécurité. Formules et essai 7 jours.',
    fil: 'Logiciels', heroImg: 'bg-registre.webp', eyebrow: 'Nos outils en ligne',
    h1: 'Des logiciels métier nés sur le terrain',
    lede: 'Conçus pour les coordinateurs SSI et responsables sécurité, éprouvés en mission avant d’être proposés à l’abonnement.',
    corps: [S['logiciel'].html, S['formules-expert'].html].join('\n\n'),
    scripts: stripeM.groups.tout,
  }),
  page({
    fichier: 'a-propos.html',
    titre: 'À propos — Onn-Off Ingénierie & Conseil',
    description: 'Un bureau d’ingénierie indépendant : la mission en cours, nos engagements, et les réponses aux questions les plus fréquentes.',
    fil: 'À propos', heroImg: 'bg-equipe.webp', eyebrow: 'Qui nous sommes',
    h1: 'Un avis technique qui n’appartient qu’à vous',
    lede: 'Indépendants de tout installateur et de tout fournisseur : notre seul livrable est un conseil défendable.',
    corps: [S['mission'].html, S['engagements'].html, S['faq'].html].join('\n\n'),
  }),
  page({
    fichier: 'mentions-legales.html',
    titre: 'Mentions légales — Onn-Off Ingénierie & Conseil',
    description: 'Éditeur, hébergement et traitement des données du site onn-offingénierie.fr.',
    fil: 'Mentions légales', heroImg: 'bg-qualite.webp', eyebrow: 'Informations légales',
    h1: 'Mentions légales',
    lede: 'Qui édite ce site, qui l’héberge, et ce que deviennent les informations transmises.',
    corps: S['mentions-legales'].html,
  }),
];

// ---------- l'accueil allégé ----------
const APERCU = `<section id="explorer" style="background:var(--paper-2,#F5F2EF)">
  <div class="wrap" style="padding:72px 32px">
    <p class="eyebrow">Explorer</p>
    <h2 style="margin-top:12px">Tout le détail, page par page</h2>
    <div style="display:grid;gap:18px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-top:34px">
      <a class="reveal" href="/prestations.html" style="display:block;background:#fff;border:1px solid rgba(20,28,38,.12);border-top:4px solid #4A6274;border-radius:14px;padding:24px;text-decoration:none;color:inherit">
        <h3 style="margin:0 0 8px">Prestations</h3>
        <p style="margin:0;color:#5c6670;font-size:14.5px">Ingénierie, AMO, audits, pilotage, risques, sécurité incendie — les onze prestations, les secteurs et la démarche.</p>
        <span style="display:inline-block;margin-top:12px;font-weight:700;color:#4A6274">Découvrir →</span>
      </a>
      <a class="reveal" href="/logiciels.html" style="display:block;background:#fff;border:1px solid rgba(20,28,38,.12);border-top:4px solid #D8B24A;border-radius:14px;padding:24px;text-decoration:none;color:inherit">
        <h3 style="margin:0 0 8px">Logiciels métier</h3>
        <p style="margin:0;color:#5c6670;font-size:14.5px">ONNOFF Expert SSI : registres, plans, commissions de sécurité. Formules et essai 7 jours.</p>
        <span style="display:inline-block;margin-top:12px;font-weight:700;color:#8C6A2E">Découvrir →</span>
      </a>
      <a class="reveal" href="/a-propos.html" style="display:block;background:#fff;border:1px solid rgba(20,28,38,.12);border-top:4px solid #5F7048;border-radius:14px;padding:24px;text-decoration:none;color:inherit">
        <h3 style="margin:0 0 8px">À propos</h3>
        <p style="margin:0;color:#5c6670;font-size:14.5px">La mission en cours, nos engagements, et les réponses aux questions fréquentes.</p>
        <span style="display:inline-block;margin-top:12px;font-weight:700;color:#5F7048">Découvrir →</span>
      </a>
    </div>
  </div>
</section>`;

let index = h;
// la feuille de style devient un fichier partagé
index = index.replace(styleM[0], '<link rel="stylesheet" href="assets/style.css">');
// les sections déplacées laissent place à la vue d'ensemble (posée au premier trou)
index = index.replace(S['logiciel'].html, APERCU);
for (const id of ['formules-expert', 'prestations', 'secteurs', 'demarche', 'mission', 'engagements', 'faq']) {
  index = index.replace(S[id].html, '');
}
// mentions : page dédiée, le lien du footer suit
index = index.replace(S['mentions-legales'].html, '');
index = index.replace(/href="#mentions-legales"/g, 'href="/mentions-legales.html"');
// le script Stripe ne sert plus sur l'accueil (les formules sont parties)
index = index.replace(stripeM.groups.tout, '');
// la nav de l'accueil pointe vers les vraies pages
index = index
  .replace('<a href="#prestations">Prestations</a>', '<a href="/prestations.html">Prestations</a>')
  .replace('<a href="#secteurs">Secteurs</a>', '<a href="/logiciels.html">Logiciels</a>')
  .replace('<a href="#demarche">Démarche</a>', '<a href="/a-propos.html">À propos</a>');
// liens internes vers les sections parties → vers leurs pages
index = index
  .replace(/href="#prestations"/g, 'href="/prestations.html"')
  .replace(/href="#formules-expert"/g, 'href="/logiciels.html#formules-expert"')
  .replace(/href="#secteurs"/g, 'href="/prestations.html#secteurs"')
  .replace(/href="#demarche"/g, 'href="/prestations.html#demarche"');

// ---------- sitemap ----------
const AUJ = '2026-08-31';
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${BASE}/</loc><lastmod>${AUJ}</lastmod><priority>1.0</priority></url>
  <url><loc>${BASE}/prestations.html</loc><lastmod>${AUJ}</lastmod><priority>0.9</priority></url>
  <url><loc>${BASE}/logiciels.html</loc><lastmod>${AUJ}</lastmod><priority>0.9</priority></url>
  <url><loc>${BASE}/a-propos.html</loc><lastmod>${AUJ}</lastmod><priority>0.7</priority></url>
  <url><loc>${BASE}/mentions-legales.html</loc><lastmod>${AUJ}</lastmod><priority>0.3</priority></url>
</urlset>
`;

// ---------- bilan / écriture ----------
console.log('index : %d -> %d o', h.length, index.length);
for (const p of PAGES) {
  const nom = p.match(/<link rel="canonical" href="[^"]*\/([^"]+)"/)[1];
  console.log('  %s : %d o', nom, p.length);
}
if (!APPLY) { console.log('\nSIMULATION — relancer avec --apply.'); process.exit(0); }

fs.mkdirSync(path.join(DIR, 'assets'), {recursive: true});
fs.writeFileSync(path.join(DIR, 'assets', 'style.css'), css, 'utf8');
for (const p of PAGES) {
  const nom = p.match(/<link rel="canonical" href="[^"]*\/([^"]+)"/)[1];
  fs.writeFileSync(path.join(DIR, nom), p, 'utf8');
}
fs.writeFileSync(path.join(DIR, 'index.html'), index, 'utf8');
fs.writeFileSync(path.join(DIR, 'sitemap.xml'), sitemap, 'utf8');
console.log('\nEcrit.');
