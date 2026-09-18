#!/usr/bin/env node
/**
 * Tests unitaires du résolveur pur de la porte universelle.
 * Chaque (mode × genre d'entrée) → destination et label attendus.
 * Couvre les contre-cas : phrase naturelle en mode diag → NOEMA,
 * lien GitHub en mode Médiathèque → diagnostic (détection non masquée).
 */
import { parseGitHub, parseHttpUrl, resolveAction } from './home-resolver.mjs';

let pass = 0;
let fail = 0;
const t = (name, cond, details) => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name}${details ? `\n      ${details}` : ''}`); }
};
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// --- parseGitHub strict ---
t('parseGitHub: https://github.com/owner/repo', !!parseGitHub('https://github.com/owner/repo'));
t('parseGitHub: owner/repo strict', eq(parseGitHub('mattmezstitchlab/AIME-COMPOSER'), { owner: 'mattmezstitchlab', repo: 'AIME-COMPOSER' }));
t('parseGitHub: avec .git suffix', eq(parseGitHub('foo/bar.git'), { owner: 'foo', repo: 'bar' }));
t('parseGitHub: github.com avec www', !!parseGitHub('https://www.github.com/foo/bar'));
t('parseGitHub: avec sous-chemin', eq(parseGitHub('https://github.com/foo/bar/tree/main'), { owner: 'foo', repo: 'bar' }));
t('parseGitHub: invalide sans slash → null', parseGitHub('foobar') === null);
t('parseGitHub: avec espace → null', parseGitHub('foo bar') === null);
t('parseGitHub: avec :// mais pas github → null pour owner/repo', parseGitHub('https://example.com/foo/bar') === null);

// --- parseHttpUrl ---
t('parseHttpUrl: site avec point', !!parseHttpUrl('https://mon-site-vitrine.fr'));
t('parseHttpUrl: example.com', parseHttpUrl('example.com')?.includes('example.com'));
t('parseHttpUrl: avec espace → null', parseHttpUrl('hello world') === null);
t('parseHttpUrl: github.com → null', parseHttpUrl('https://github.com/foo/bar') === null);
t('parseHttpUrl: sans point → null', parseHttpUrl('foobar') === null);

// Helper to test resolveAction
function check(raw, mode, expected) {
  const r = resolveAction(raw, mode);
  const ok = r.intention === expected.intention && r.label === expected.label && r.destination === expected.destination;
  t(
    `resolveAction(${JSON.stringify(raw)}, ${JSON.stringify(mode)}) → ${expected.intention} / ${expected.label} / ${expected.destination}`,
    ok,
    `reçu: ${JSON.stringify({ intention: r.intention, label: r.label, destination: r.destination })} | attendu: ${JSON.stringify(expected)}`
  );
  // Also check aperçu exists
  t(`  aperçu présent pour ${expected.intention}`, !!r.aperçu);
}

// --- Mode × Genre d'entrée ---

// GitHub detection outranks mode
check('https://github.com/mattmezstitchlab/AIME-COMPOSER', 'media', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('https://github.com/mattmezstitchlab/AIME-COMPOSER', 'da', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('https://github.com/mattmezstitchlab/AIME-COMPOSER', 'diag', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('https://github.com/mattmezstitchlab/AIME-COMPOSER', 'noema', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('https://github.com/mattmezstitchlab/AIME-COMPOSER', null, { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('mattmezstitchlab/AIME-COMPOSER', 'media', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('owner/repo', 'media', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:owner/repo' });
check('owner/repo', 'diag', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:owner/repo' });
check('owner/repo', 'da', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:owner/repo' });

// Site URL detection outranks mode
check('https://mon-site-vitrine.fr', 'media', { intention: 'diag-site', label: 'Lancer le diagnostic', destination: 'https://mon-site-vitrine.fr/' });
check('https://mon-site-vitrine.fr', 'diag', { intention: 'diag-site', label: 'Lancer le diagnostic', destination: 'https://mon-site-vitrine.fr/' });
check('https://mon-site-vitrine.fr', 'noema', { intention: 'diag-site', label: 'Lancer le diagnostic', destination: 'https://mon-site-vitrine.fr/' });
check('example.com', 'media', { intention: 'diag-site', label: 'Lancer le diagnostic', destination: 'https://example.com/' });
check('example.com', 'da', { intention: 'diag-site', label: 'Lancer le diagnostic', destination: 'https://example.com/' });

// Mode DA — sans contenu détecté
check('', 'da', { intention: 'da', label: 'Ouvrir la Direction artistique', destination: 'design-system/direction.html' });
check('un texte libre', 'da', { intention: 'da', label: 'Ouvrir la Direction artistique', destination: 'design-system/direction.html' });
check('owner/repo', 'da', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:owner/repo' }); // content wins

// Mode Médiathèque — sans contenu détecté
check('', 'media', { intention: 'media', label: 'Ouvrir la Médiathèque', destination: 'point-zero/#pz-bureau' });
check('un texte libre', 'media', { intention: 'media', label: 'Ouvrir la Médiathèque', destination: 'point-zero/#pz-bureau' });
check('', null, { intention: 'noema-empty', label: 'Proposer à NOEMA', destination: 'loop/' }); // null mode fallback -> noema-empty

// Mode Diagnostic — cas nominaux et contre-cas
check('', 'diag', { intention: 'diag-empty', label: 'Lancer le diagnostic', destination: 'diagnostic/README.md' });
check('mattmezstitchlab/AIME-COMPOSER', 'diag', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:mattmezstitchlab/AIME-COMPOSER' });
check('https://github.com/foo/bar', 'diag', { intention: 'diag-github', label: 'Lancer le diagnostic', destination: 'diagnostic:github:foo/bar' });
// Contre-cas 1 : phrase naturelle en mode diag → NOEMA, jamais commande fabriquée
{
  const r = resolveAction('envoyer l’annonce du concert pour le 24 septembre', 'diag');
  t('diag + phrase naturelle → NOEMA (jamais commande fabriquée)', r.intention === 'noema' && r.label === 'Proposer à NOEMA' && r.destination === 'noema:intent', `reçu ${JSON.stringify(r)}`);
  t('diag + phrase naturelle → pas de owner/repo fabriqué', !r.owner && !r.repo && r.destination !== 'diagnostic:github:owner/envoyer l’annonce du concert pour le 24 septembre');
}
{
  const r = resolveAction('il faut la capacité de la salle', 'diag');
  t('diag + "il faut la capacité de la salle" → NOEMA', r.intention === 'noema', `reçu ${JSON.stringify(r)}`);
}
{
  const r = resolveAction('Camille Vasseur est saxophoniste', 'diag');
  t('diag + "Camille Vasseur est saxophoniste" → NOEMA', r.intention === 'noema', `reçu ${JSON.stringify(r)}`);
}
{
  const r = resolveAction('hello world', 'diag');
  t('diag + "hello world" (avec espace) → NOEMA', r.intention === 'noema' && r.label === 'Proposer à NOEMA');
}
// Garde-fou : malformé sans espace → diag-invalid
{
  const r = resolveAction('foobar', 'diag');
  t('diag + "foobar" (sans espace, sans slash) → diag-invalid', r.intention === 'diag-invalid' && r.label === 'Lancer le diagnostic' && r.destination === null, `reçu ${JSON.stringify(r)}`);
  t('diag-invalid → message Format attendu', r.aperçu?.error?.includes('Format attendu'));
}
{
  const r = resolveAction('foo/', 'diag');
  t('diag + "foo/" → diag-invalid (ne fabrique pas owner/repo)', r.intention === 'diag-invalid');
}
{
  const r = resolveAction('foo', 'diag');
  t('diag + "foo" → diag-invalid', r.intention === 'diag-invalid');
}

// Contre-cas 2 : lien GitHub en mode Médiathèque → diagnostic (détection non masquée)
{
  const r = resolveAction('mattmezstitchlab/AIME-COMPOSER', 'media');
  t('media + owner/repo → diag-github (détection non masquée)', r.intention === 'diag-github');
}
{
  const r = resolveAction('https://github.com/foo/bar', 'media');
  t('media + github URL → diag-github', r.intention === 'diag-github');
}

// Mode NOEMA — défaut
check('', 'noema', { intention: 'noema-empty', label: 'Proposer à NOEMA', destination: 'loop/' });
check('', null, { intention: 'noema-empty', label: 'Proposer à NOEMA', destination: 'loop/' });
check('Camille Vasseur est saxophoniste', 'noema', { intention: 'noema', label: 'Proposer à NOEMA', destination: 'noema:intent' });
check('Camille Vasseur est saxophoniste', null, { intention: 'noema', label: 'Proposer à NOEMA', destination: 'noema:intent' });
check('il faut la capacité de la salle', 'noema', { intention: 'noema', label: 'Proposer à NOEMA', destination: 'noema:intent' });
check('envoyer l’annonce pour le 24 septembre', 'noema', { intention: 'noema', label: 'Proposer à NOEMA', destination: 'noema:intent' });
check('un texte libre sans mode', null, { intention: 'noema', label: 'Proposer à NOEMA', destination: 'noema:intent' });

// Vérifie que le label est toujours l'un des 4
const labels = new Set(['Ouvrir la Direction artistique', 'Ouvrir la Médiathèque', 'Lancer le diagnostic', 'Proposer à NOEMA']);
for (const mode of ['da', 'media', 'diag', 'noema', null]) {
  for (const raw of ['', 'test', 'owner/repo', 'https://example.com', 'phrase avec espace']) {
    const r = resolveAction(raw, mode);
    t(`label valide pour mode=${mode} raw=${JSON.stringify(raw)}`, labels.has(r.label), `label=${r.label}`);
  }
}

console.log(`\n${fail === 0 ? '✓' : '✗'} RÉSOLVEUR : ${pass}/${pass + fail}`);
process.exit(fail ? 1 : 0);
