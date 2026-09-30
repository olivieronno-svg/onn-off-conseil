/**
 * mesure.js — compte les visites et dit d'où elles viennent.
 *
 * POURQUOI. Le 08/09/2026, la question « la chaîne YouTube amène-t-elle
 * quelqu'un ? » n'avait aucune réponse possible : le site ne mesurait rien.
 * 2 700 vues de vidéos, et pas un chiffre en face.
 *
 * CE QUI EST ENREGISTRÉ, et rien d'autre :
 *   site   le domaine visité (onn-off.fr, ingenierie.onn-off.fr…)
 *   page   le chemin de la page, sans les paramètres
 *   source le NOM DE DOMAINE d'où vient le visiteur, jamais l'adresse
 *          complète — une adresse de recherche peut contenir des mots tapés
 *   utm    les marqueurs de campagne, quand le lien en porte
 *   ecran  « mobile » ou « bureau »
 *
 * CE QUI N'EST PAS ENREGISTRÉ : aucun cookie, aucun espace de stockage local,
 * aucun identifiant, aucune empreinte de navigateur, aucune adresse IP (elle
 * n'est ni lue ni transmise : la base ne conserve que les champs ci-dessus).
 * Deux visites du même visiteur sont donc indistinguables, et c'est voulu :
 * une mesure d'audience anonyme n'a pas à demander de consentement.
 *
 * L'HEURE vient du serveur, pas d'ici : c'est la date de création du document
 * qui fait foi dans les rapports. L'horloge d'un visiteur peut être fausse.
 *
 * En cas d'échec — hors ligne, bloqueur de publicité, règle refusée — la page
 * ne s'en aperçoit pas : tout est sous `try`, et l'envoi ne bloque rien.
 */
(function () {
  'use strict';

  // Une seule mesure par chargement, même si le script est inclus deux fois.
  if (window.__ooMesure) return;
  window.__ooMesure = true;

  var PROJET = 'onn-off-vitrine';
  var CLE = 'AIzaSyBTo1fCz7kbcqIq0Gwrx-LZgSzEXmhyFAQ';
  var POINT = 'https://firestore.googleapis.com/v1/projects/' + PROJET +
      '/databases/(default)/documents/mesures?key=' + CLE;

  /**
   * Un champ texte au format attendu par Firestore, borné en longueur : les
   * règles de sécurité refusent le document au-delà, et un refus perdrait la
   * visite entière.
   * @param {*} v Valeur à écrire.
   * @return {!Object} Champ Firestore.
   */
  function texte(v) {
    return {stringValue: String(v == null ? '' : v).slice(0, 150)};
  }

  // Les robots ne sont pas des visiteurs. Ce n'est pas de la théorie : le
  // 08/09/2026, la mise à jour de 67 descriptions de vidéos a déclenché 305
  // passages de robots Google en six minutes, tous porteurs du marqueur
  // « youtube » — de quoi faire croire à un succès qui n'existait pas. Ils
  // reviendront à chaque modification des descriptions.
  var ROBOT = /bot|crawl|spider|slurp|headless|lighthouse|inspectiontool|preview|facebookexternalhit/i;

  try {
    var hote = location.hostname;
    // Les essais locaux et les pré-rendus ne sont pas des visites.
    if (!hote || hote === 'localhost' || hote === '127.0.0.1') return;
    if (ROBOT.test(navigator.userAgent || '')) return;
    // Vrai quand le navigateur est piloté par un programme.
    if (navigator.webdriver) return;
    // Une page ouverte en arrière-plan, ou pré-chargée sans être montrée, sera
    // comptée quand elle deviendra visible, ou pas du tout.
    if (document.visibilityState === 'prerender') return;

    var p = new URLSearchParams(location.search);
    var utm = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
        .map(function (k) { return p.get(k); })
        .filter(Boolean).join(' / ');

    var venu = '';
    try {
      if (document.referrer) {
        var r = new URL(document.referrer);
        // Se venir de soi-même n'apprend rien : on ne garde que l'extérieur.
        venu = (r.hostname === hote) ? '' : r.hostname;
      }
    } catch (_) {}

    var corps = JSON.stringify({fields: {
      site: texte(hote),
      page: texte(location.pathname),
      source: texte(venu),
      utm: texte(utm),
      ecran: texte(window.innerWidth < 760 ? 'mobile' : 'bureau'),
    }});

    // `keepalive` : l'envoi survit à un visiteur qui repart aussitôt.
    fetch(POINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: corps,
      keepalive: true,
      mode: 'cors',
      credentials: 'omit',
    }).catch(function () {});
  } catch (_) {}
})();
