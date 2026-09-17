/**
 * AIME ICONOGRAPHY V1 — source de vérité des pictogrammes.
 *
 * CONTRAT DE GRILLE (aucune exception)
 *   viewBox        0 0 24 24
 *   keyline        20 × 20 centré (marge optique de 2)
 *   stroke         1.5
 *   linecap/join   round
 *   coin           rayon 2 maximum
 *   remplissage    aucun — sauf point plein r ≤ 1.2 (repère) et formes d'état
 *   couleur        currentColor uniquement : une icône n'a jamais de couleur propre
 *
 * Règle systémique : une icône AIME est un dessin au trait, pas un logo.
 * Les emojis sont interdits dans l'interface (contrôlé par le QA).
 */

export const ICON_CONTRACT = {
  viewBox: '0 0 24 24',
  keyline: 20,
  strokeWidth: 1.5,
  linecap: 'round',
  linejoin: 'round',
  fill: 'none',
  color: 'currentColor',
};

const P = (d, extra = '') => `<path d="${d}"${extra ? ` ${extra}` : ''}/>`;
const C = (cx, cy, r, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}"${extra ? ` ${extra}` : ''}/>`;
const R = (x, y, w, h, rx = 2, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"${extra ? ` ${extra}` : ''}/>`;
const DOT = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="1.1" fill="currentColor" stroke="none"/>`;

export const icons = [
  /* ── NAVIGATION ─────────────────────────────────────────────── */
  { id: 'nav-home', cat: 'NAVIGATION', label: 'Accueil', body: P('M4 10.6 12 4l8 6.6V20H4z') + P('M10 20v-5h4v5') },
  { id: 'nav-arrow-right', cat: 'NAVIGATION', label: 'Suivant', body: P('M4 12h15') + P('M13.5 6.5 19 12l-5.5 5.5') },
  { id: 'nav-arrow-left', cat: 'NAVIGATION', label: 'Précédent', body: P('M20 12H5') + P('M10.5 6.5 5 12l5.5 5.5') },
  { id: 'nav-chevron-down', cat: 'NAVIGATION', label: 'Déplier', body: P('M6.5 9.5 12 15l5.5-5.5') },
  { id: 'nav-chevron-right', cat: 'NAVIGATION', label: 'Ouvrir', body: P('M9.5 6.5 15 12l-5.5 5.5') },
  { id: 'nav-menu', cat: 'NAVIGATION', label: 'Menu', body: P('M4 7h16M4 12h16M4 17h16') },
  { id: 'nav-close', cat: 'NAVIGATION', label: 'Fermer', body: P('M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5') },
  { id: 'nav-external', cat: 'NAVIGATION', label: 'Lien externe', body: P('M14 4h6v6M20 4l-8.4 8.4') + P('M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5') },
  { id: 'nav-back', cat: 'NAVIGATION', label: 'Retour', body: P('M20 12H7.5') + P('M12 6.5 6.5 12 12 17.5') + P('M4 5v14') },

  /* ── MEMORY ─────────────────────────────────────────────────── */
  { id: 'mem-card', cat: 'MEMORY', label: 'Carte universelle', body: R(3, 5, 18, 14, 2) + P('M3 10h18') + P('M7 14.5h6') },
  { id: 'mem-memory', cat: 'MEMORY', label: 'Mémoire', body: C(12, 12, 8.75) + C(12, 12, 3.6) + DOT(12, 12) },
  { id: 'mem-archive', cat: 'MEMORY', label: 'Archive', body: R(3, 4, 18, 5, 1.5) + P('M5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9') + P('M10 13h4') },
  { id: 'mem-vault', cat: 'MEMORY', label: 'Coffre sensible', body: R(5, 10, 14, 10, 2) + P('M8 10V7.6a4 4 0 0 1 8 0V10') + DOT(12, 15) },
  { id: 'mem-bookmark', cat: 'MEMORY', label: 'Repère', body: P('M7 4h10v16l-5-4-5 4z') },

  /* ── PEOPLE ─────────────────────────────────────────────────── */
  { id: 'ppl-person', cat: 'PEOPLE', label: 'Personne', body: C(12, 8, 3.6) + P('M5.2 20a6.8 6.8 0 0 1 13.6 0') },
  { id: 'ppl-people', cat: 'PEOPLE', label: 'Personnes', body: C(9.6, 8.6, 3.2) + P('M3.6 19.6a6 6 0 0 1 12 0') + P('M16.2 6.2a3.2 3.2 0 0 1 0 6.2') + P('M17.2 14.6a6 6 0 0 1 3.2 5') },
  { id: 'ppl-org', cat: 'PEOPLE', label: 'Organisation', body: R(4, 4, 10, 16, 1.5) + P('M14 10h5a1 1 0 0 1 1 1v9h-6') + P('M7 8h4M7 12h4M7 16h4') },
  { id: 'ppl-role', cat: 'PEOPLE', label: 'Rôle', body: C(12, 8.5, 4) + P('M8.6 15.4 7.2 21l4.8-2.3L16.8 21l-1.4-5.6') },

  /* ── PROJECT ────────────────────────────────────────────────── */
  { id: 'prj-project', cat: 'PROJECT', label: 'Projet', body: P('M4 6.6A1.6 1.6 0 0 1 5.6 5h3.1l1.6 2h8.1A1.6 1.6 0 0 1 20 8.6v8.8A1.6 1.6 0 0 1 18.4 19H5.6A1.6 1.6 0 0 1 4 17.4z') },
  { id: 'prj-brief', cat: 'PROJECT', label: 'Brief', body: R(4, 5, 16, 14, 2) + P('M8 9.5h8M8 13.5h5') },
  { id: 'prj-target', cat: 'PROJECT', label: 'Objectif', body: C(12, 12, 8.75) + C(12, 12, 4.2) + DOT(12, 12) },
  { id: 'prj-flag', cat: 'PROJECT', label: 'Jalon', body: P('M6.5 20V4.5l10.5 3.5-10.5 3.5') },

  /* ── TIMELINE ───────────────────────────────────────────────── */
  { id: 'time-timeline', cat: 'TIMELINE', label: 'Timeline', body: P('M3 12h18') + C(7, 12, 2) + C(16.5, 12, 2) + P('M12 5.5v13') },
  { id: 'time-clock', cat: 'TIMELINE', label: 'Heure', body: C(12, 12, 8.75) + P('M12 7.4V12l3.2 1.9') },
  { id: 'time-calendar', cat: 'TIMELINE', label: 'Date', body: R(3.5, 5, 17, 15, 2) + P('M3.5 10h17') + P('M8 3.5v3M16 3.5v3') },
  { id: 'time-playhead', cat: 'TIMELINE', label: 'Tête de lecture', body: P('M12 4.5v15M9 4.5h6M9 19.5h6') },
  { id: 'time-history', cat: 'TIMELINE', label: 'Historique', body: P('M3.6 12a8.4 8.4 0 1 0 2.7-6.2') + P('M3.5 4.4v4.4H8') + P('M12 8.2v4.2l3 1.8') },

  /* ── MEDIA ──────────────────────────────────────────────────── */
  { id: 'med-image', cat: 'MEDIA', label: 'Image', body: R(3.5, 5, 17, 14, 2) + C(8.6, 10, 1.6) + P('M4 17.5l4.8-4.3 3.6 3.2 2.8-2.4 4.8 3.6') },
  { id: 'med-video', cat: 'MEDIA', label: 'Vidéo', body: R(3, 6, 12.5, 12, 2) + P('M15.5 10.8 20.5 8v8l-5-2.8z') },
  { id: 'med-audio', cat: 'MEDIA', label: 'Audio', body: P('M4 14v-4M8 17.5v-11M12 20V4M16 16V8M20 13.5v-3') },
  { id: 'med-library', cat: 'MEDIA', label: 'Médiathèque', body: R(6, 6, 14, 12, 2) + P('M3.6 9.5V18a2 2 0 0 0 2 2H17') },
  { id: 'med-qr', cat: 'MEDIA', label: 'QR', body: R(4, 4, 6, 6, 1.2) + R(14, 4, 6, 6, 1.2) + R(4, 14, 6, 6, 1.2) + P('M14 14h2.6v2.6H14zM17.4 17.4H20V20h-2.6z') },

  /* ── GRID ───────────────────────────────────────────────────── */
  { id: 'grd-grid', cat: 'GRID', label: 'Grille', body: R(3, 3, 18, 18, 2) + P('M3 9h18M3 15h18M9 3v18M15 3v18') },
  { id: 'grd-guides', cat: 'GRID', label: 'Repères', body: R(3.5, 3.5, 17, 17, 2) + P('M12 2.4v19.2M2.4 12h19.2') },
  { id: 'grd-snap', cat: 'GRID', label: 'Magnétisme', body: P('M6 4.2v7.6a6 6 0 0 0 12 0V4.2h-4v7.6a2 2 0 0 1-4 0V4.2z') },
  { id: 'grd-ruler', cat: 'GRID', label: 'Mesure', body: R(2.5, 8, 19, 8, 1.5) + P('M7 8v3M11 8v4.2M15 8v3M19 8v4.2') },
  { id: 'grd-format', cat: 'GRID', label: 'Format', body: R(5.5, 4.5, 13, 15, 1) + P('M3 7V3.5h3.5M21 3.5v3.5M21 20.5V17M3 17v3.5h3.5') },

  /* ── COMPOSER ───────────────────────────────────────────────── */
  { id: 'cmp-compose', cat: 'COMPOSER', label: 'Composer', body: P('M12 3.6 18.8 12 12 20.4 5.2 12z') + P('M12 3.6v16.8') },
  { id: 'cmp-layers', cat: 'COMPOSER', label: 'Calques', body: P('M12 3.6 20.4 8 12 12.4 3.6 8z') + P('M3.6 12.4 12 16.8l8.4-4.4') + P('M3.6 16.4 12 20.8l8.4-4.4') },
  { id: 'cmp-node', cat: 'COMPOSER', label: 'Objet', body: R(3.5, 9, 8, 8, 2) + C(17.8, 6.6, 2.6) + P('M11.5 13h3.4a2 2 0 0 0 2-2V9.2') },
  { id: 'cmp-connect', cat: 'COMPOSER', label: 'Relation', body: P('M9.6 14.4 14.4 9.6') + P('M7.2 12.4 5.2 14.4a3.5 3.5 0 0 0 5 5l2-2') + P('M16.8 11.6 18.8 9.6a3.5 3.5 0 0 0-5-5l-2 2') },
  { id: 'cmp-cursor', cat: 'COMPOSER', label: 'Sélection', body: P('M6 4.2 18 10.2l-5 1.6-2.2 5.2z') },
  { id: 'cmp-move', cat: 'COMPOSER', label: 'Déplacer', body: P('M12 3.5v17M3.5 12h17') + P('M9.6 5.9 12 3.5l2.4 2.4M9.6 18.1 12 20.5l2.4-2.4M5.9 9.6 3.5 12l2.4 2.4M18.1 9.6 20.5 12l-2.4 2.4') },

  /* ── DOCUMENT ───────────────────────────────────────────────── */
  { id: 'doc-document', cat: 'DOCUMENT', label: 'Document', body: P('M6 3.6h7.4L18.4 8v12.4H6z') + P('M13.4 3.6V8h5') + P('M9 12.8h6M9 16.2h6') },
  { id: 'doc-contract', cat: 'DOCUMENT', label: 'Contrat', body: P('M5.8 3.6h7.2L17 7.4V15.2H5.8z') + C(16.4, 17.4, 3.2) + P('M14.9 17.4l1.1 1.1 2-2.2') },
  { id: 'doc-clipboard', cat: 'DOCUMENT', label: 'Exigences', body: R(5.5, 5, 13, 15, 2) + P('M9 5.2V3.6h6v1.6') + P('M9 11h6M9 15h4') },
  { id: 'doc-proof', cat: 'DOCUMENT', label: 'Preuve', body: P('M5.4 3.6h8L17.8 8v8.4H5.4z') + P('M8.4 15.6l2.3 2.3 4.4-4.6') },
  { id: 'doc-version', cat: 'DOCUMENT', label: 'Version', body: P('M6 3.6h7l4.4 4.4v12.4H6z') + P('M9 9.6h6M9 13.6h3') },

  /* ── ACTION ─────────────────────────────────────────────────── */
  { id: 'act-execute', cat: 'ACTION', label: 'Exécuter', body: P('M13 4.2h5.4a1 1 0 0 1 1 1v13.6a1 1 0 0 1-1 1H13') + P('M4.2 12H15') + P('M11.4 8.4 15 12l-3.6 3.6') },
  { id: 'act-check', cat: 'ACTION', label: 'Valider', body: P('M5 12.6 9.8 17.2 19 6.8') },
  { id: 'act-play', cat: 'ACTION', label: 'Lecture', body: P('M8.2 5.4v13.2L18.4 12z') },
  { id: 'act-export', cat: 'ACTION', label: 'Exporter', body: P('M12 15.6V4.2M8.2 8 12 4.2 15.8 8') + P('M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5') },
  { id: 'act-publish', cat: 'ACTION', label: 'Publier', body: C(12, 12, 8.75) + P('M3.4 12h17.2') + P('M12 3.4c2.5 2.6 3.8 5.4 3.8 8.6s-1.3 6-3.8 8.6c-2.5-2.6-3.8-5.4-3.8-8.6s1.3-6 3.8-8.6z') },
  { id: 'act-undo', cat: 'ACTION', label: 'Annuler', body: P('M9 7 4.6 11.4 9 15.8') + P('M4.6 11.4H14a5.4 5.4 0 0 1 0 10.8H8.4') },

  /* ── SEARCH ─────────────────────────────────────────────────── */
  { id: 'src-search', cat: 'SEARCH', label: 'Rechercher', body: C(11, 11, 7) + P('M16.2 16.2 20.8 20.8') },
  { id: 'src-filter', cat: 'SEARCH', label: 'Filtrer', body: P('M4 5.6h16l-6.2 7v6.2l-3.6 1.9v-8.1z') },
  { id: 'src-sort', cat: 'SEARCH', label: 'Trier', body: P('M6.6 5v14M6.6 19l-2.8-2.8M6.6 19l2.8-2.8') + P('M13 7h7M13 12h5M13 17h3') },

  /* ── RELATION ───────────────────────────────────────────────── */
  { id: 'rel-relation', cat: 'RELATION', label: 'Relation', body: C(6.2, 6.2, 2.6) + C(17.8, 17.8, 2.6) + P('M8.4 8.4 15.6 15.6') },
  { id: 'rel-network', cat: 'RELATION', label: 'Réseau', body: C(12, 5.4, 2.2) + C(5.4, 17.6, 2.2) + C(18.6, 17.6, 2.2) + P('M10.8 7.2 6.8 15.6M13.2 7.2l4 8.4M7.8 17.6h8.4') },
  { id: 'rel-share', cat: 'RELATION', label: 'Partager', body: C(17.8, 6, 2.5) + C(6.2, 12, 2.5) + C(17.8, 18, 2.5) + P('M8.4 10.8 15.6 7.2M8.4 13.2l7.2 3.6') },
  { id: 'rel-group', cat: 'RELATION', label: 'Groupe', body: R(3.5, 3.5, 7, 7, 1.5) + R(13.5, 3.5, 7, 7, 1.5) + R(3.5, 13.5, 7, 7, 1.5) + R(13.5, 13.5, 7, 7, 1.5) },

  /* ── APPROVAL ───────────────────────────────────────────────── */
  { id: 'apr-approved', cat: 'APPROVAL', label: 'Approuvé', body: C(12, 12, 8.75) + P('M8.2 12.2l2.7 2.7 5.1-5.4') },
  { id: 'apr-rejected', cat: 'APPROVAL', label: 'Refusé', body: C(12, 12, 8.75) + P('M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6') },
  { id: 'apr-sign', cat: 'APPROVAL', label: 'Signer', body: P('M4 17c3.4 0 4.4-10.4 6.8-10.4S13 12.4 15 12.4s2.8-2 5-2') + P('M4 20.4h16') },
  { id: 'apr-pending', cat: 'APPROVAL', label: 'En attente', body: P('M6.6 4.2h10.8M6.6 19.8h10.8') + P('M8.2 4.2v3.4L12 11.4l3.8-3.8V4.2M8.2 19.8v-3.4L12 12.6l3.8 3.8v3.4') },

  /* ── PROOF ──────────────────────────────────────────────────── */
  { id: 'prf-shield', cat: 'PROOF', label: 'Garanti', body: P('M12 3.6 19.4 6v6.1c0 3.9-3.1 6.9-7.4 8.3-4.3-1.4-7.4-4.4-7.4-8.3V6z') + P('M8.9 12.1l2.2 2.2 4.1-4.3') },
  { id: 'prf-evidence', cat: 'PROOF', label: 'Évidence', body: P('M5.2 3.6h8.4L17.6 7.6v6.2H5.2z') + C(15.6, 16.4, 3.4) + P('M18.1 18.9l2.9 2.9') },
  { id: 'prf-fingerprint', cat: 'PROOF', label: 'Empreinte', body: P('M8.2 20.2c-1.5-3-1.5-8.2 0-11.4M12 20.6c-2-3.6-2-9.6 0-13.2M15.8 20.2c1.5-3 1.5-8.2 0-11.4') + P('M12 4.4v2') },
  { id: 'prf-verified', cat: 'PROOF', label: 'Vérifié', body: P('M12 3.4l2.4 1.8 3-.2.9 2.8 2.4 1.8-1 2.9 1 2.9-2.4 1.8-.9 2.8-3-.2L12 21.6l-2.4-1.8-3 .2-.9-2.8-2.4-1.8 1-2.9-1-2.9 2.4-1.8.9-2.8 3 .2z') + P('M9.6 12.4l1.8 1.8 3.2-3.4') },

  /* ── SETTINGS ───────────────────────────────────────────────── */
  { id: 'set-sliders', cat: 'SETTINGS', label: 'Réglages', body: P('M4 8h10M18 8h2M4 16h4M12 16h8') + C(16, 8, 2) + C(10, 16, 2) },
  { id: 'set-preferences', cat: 'SETTINGS', label: 'Préférences', body: C(12, 12, 8.75) + P('M12 12l4.2-3') + P('M12 3.4v1.8M20.6 12h-1.8M12 20.6v-1.8M3.4 12h1.8') },
  { id: 'set-theme', cat: 'SETTINGS', label: 'Thème', body: C(12, 12, 8.75) + P('M12 3.4a8.6 8.6 0 0 1 0 17.2z', 'fill="currentColor" stroke="none"') },
  { id: 'set-permission', cat: 'SETTINGS', label: 'Permission', body: C(8, 12, 3.6) + P('M11.6 12H20M17 12v3M20 12v2.4') },

  /* ── COMMUNICATION ──────────────────────────────────────────── */
  { id: 'com-message', cat: 'COMMUNICATION', label: 'Commentaire', body: P('M5 5.6h14a1 1 0 0 1 1 1v8.4a1 1 0 0 1-1 1H9.8L5.5 20.2v-4.2H5a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1z') },
  { id: 'com-mail', cat: 'COMMUNICATION', label: 'Courriel', body: R(3.5, 5.5, 17, 13, 2) + P('M4.2 7.2 12 12.6l7.8-5.4') },
  { id: 'com-alert', cat: 'COMMUNICATION', label: 'Alerte', body: P('M12 4.4 21 19.6H3z') + P('M12 10v4.4') + DOT(12, 17.2) },
  { id: 'com-broadcast', cat: 'COMMUNICATION', label: 'Diffusion', body: C(12, 12, 2.2) + P('M7.9 7.9a5.8 5.8 0 0 0 0 8.2M16.1 16.1a5.8 5.8 0 0 0 0-8.2') + P('M5 5a9.9 9.9 0 0 0 0 14M19 19a9.9 9.9 0 0 0 0-14') },
  { id: 'com-inbox', cat: 'COMMUNICATION', label: 'Boîte', body: P('M3.6 13.6 6.2 5.6h11.6l2.6 8v4.8a1 1 0 0 1-1 1H4.6a1 1 0 0 1-1-1z') + P('M3.6 13.6h4l1.2 2.6h6.4l1.2-2.6h4') },

  /* ── NOEMA — marque et états de connaissance ────────────────── */
  {
    id: 'noe-mark',
    cat: 'NOEMA',
    label: 'Marque NOEMA',
    body: C(12, 12, 8.75) + C(12, 12, 3) + P('M3.4 9.3h17.2M3.4 14.7h17.2'),
  },
  { id: 'noe-observed', cat: 'NOEMA', label: 'Observé', body: P('M2.6 12S6.2 6.6 12 6.6 21.4 12 21.4 12 17.8 17.4 12 17.4 2.6 12 2.6 12z') + C(12, 12, 2.6) },
  { id: 'noe-extracted', cat: 'NOEMA', label: 'Extrait', body: P('M8.4 4.6 4.2 12l4.2 7.4M15.6 4.6 19.8 12l-4.2 7.4') },
  { id: 'noe-inferred', cat: 'NOEMA', label: 'Déduit', body: P('M9.4 12h5.2', 'stroke-dasharray="2 2.4"') + C(6.4, 12, 2.6) + C(17.6, 12, 2.6) },
  { id: 'noe-proposed', cat: 'NOEMA', label: 'Proposé', body: R(4.2, 4.2, 15.6, 15.6, 2, 'stroke-dasharray="3.2 2.6"') },
  { id: 'noe-confirmed', cat: 'NOEMA', label: 'Confirmé', body: R(4.2, 4.2, 15.6, 15.6, 2) + P('M8.6 12.2l2.5 2.5 4.7-5') },
  { id: 'noe-superseded', cat: 'NOEMA', label: 'Remplacé', body: R(4.2, 4.2, 15.6, 15.6, 2) + P('M6.4 17.6 17.6 6.4') },
];

export const categories = [
  'NAVIGATION',
  'MEMORY',
  'PEOPLE',
  'PROJECT',
  'TIMELINE',
  'MEDIA',
  'GRID',
  'COMPOSER',
  'DOCUMENT',
  'ACTION',
  'SEARCH',
  'RELATION',
  'APPROVAL',
  'PROOF',
  'SETTINGS',
  'COMMUNICATION',
  'NOEMA',
];
