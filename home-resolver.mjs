/**
 * AIME-COMPOSER — résolveur pur de la porte universelle.
 *
 * Fonction pure : (raw, activeMode) -> { intention, label, destination, aperçu }
 * Aucun effet de bord, aucun accès au DOM.
 *
 * Contrat :
 *  - intention : type métier ('da'|'media'|'diag-github'|'diag-site'|'diag-empty'|'diag-invalid'|'noema'|'noema-empty')
 *  - label : libellé contextuel du bouton Lancer
 *  - destination : URL de navigation ou marqueur 'noema:intent' / 'diagnostic:github:owner/repo' / null
 *  - aperçu : { title, body, command?, url?, error? } à afficher sans naviguer
 *
 * Priorités (documentées et testées) :
 *  1. Détection de contenu (GitHub, URL site) OUTRANQUE le mode — un lien GitHub
 *     collé en mode Médiathèque ou Direction artistique reste un diagnostic.
 *     Choix documenté : le contenu est moins ambigu que la pill.
 *  2. Sinon, le mode actif tranche (DA > Médiathèque > Diagnostic > NOEMA défaut).
 *  3. En mode Diagnostic avec saisie non-GitHub non-URL :
 *     - si la saisie contient un espace → phrase naturelle → fallback NOEMA (jamais de commande fabriquée)
 *     - sinon (ex: "foo" sans slash, "owner/") → diag-invalid avec message d'erreur
 *
 * Garde-fou diag : Diagnostic GitHub ne se fabrique que si parseGitHub réussit
 * (https://github.com/owner/repo ou owner/repo strict).
 */

export function parseGitHub(s) {
  const trimmed = (s || '').trim();
  const m1 = trimmed.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)(?:\/.*)?$/i);
  if (m1) return { owner: m1[1], repo: m1[2].replace(/\.git$/, '') };
  const m2 = trimmed.match(/^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/);
  if (m2 && !trimmed.includes('://') && !trimmed.includes(' ')) return { owner: m2[1], repo: m2[2].replace(/\.git$/, '') };
  return null;
}

export function parseHttpUrl(s) {
  const trimmed = (s || '').trim();
  if (!trimmed.includes('.') || trimmed.includes(' ')) return null;
  try {
    const u = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`);
    if (u.hostname && u.hostname.includes('.') && !u.hostname.toLowerCase().includes('github.com')) {
      return u.href;
    }
  } catch { /* URL invalide */ }
  return null;
}

const LABELS = {
  da: 'Ouvrir la Direction artistique',
  media: 'Ouvrir la Médiathèque',
  diag: 'Lancer le diagnostic',
  noema: 'Proposer à NOEMA',
};

export function resolveAction(raw, activeMode) {
  const trimmed = String(raw ?? '').trim();
  const mode = activeMode || 'noema';

  const gh = parseGitHub(trimmed);
  const httpUrl = parseHttpUrl(trimmed);

  // 1) Contenu GitHub — prioritaire sur tout mode
  if (gh) {
    return {
      intention: 'diag-github',
      label: LABELS.diag,
      destination: `diagnostic:github:${gh.owner}/${gh.repo}`,
      owner: gh.owner,
      repo: gh.repo,
      command: `node diagnostic/diagnose.mjs --owner ${gh.owner} --repo ${gh.repo}`,
      raw: trimmed,
      mode,
      aperçu: {
        title: `Diagnostic GitHub — ${gh.owner}/${gh.repo}`,
        body: `Le moteur de diagnostic mesure le projet sans y écrire. Commande vérifiable :`,
        command: `node diagnostic/diagnose.mjs --owner ${gh.owner} --repo ${gh.repo}`,
        destination: `diagnostic:github:${gh.owner}/${gh.repo}`,
      },
    };
  }

  // 2) URL de site (hors GitHub) — prioritaire sur les modes
  if (httpUrl) {
    return {
      intention: 'diag-site',
      label: LABELS.diag,
      destination: httpUrl,
      url: httpUrl,
      raw: trimmed,
      mode,
      aperçu: {
        title: `Diagnostic de site en ligne — en préparation`,
        body: `URL détectée : ${httpUrl}. Le diagnostic de site en ligne (moteur EAA / WCAG 2.1 AA) est en préparation. Le diagnostic actuel analyse les arbres de sources via le terminal.`,
        url: httpUrl,
        destination: httpUrl,
      },
    };
  }

  // 3) Modes explicites (sans contenu détecté)
  if (mode === 'da') {
    return {
      intention: 'da',
      label: LABELS.da,
      destination: 'design-system/index.html#direction',
      raw: trimmed,
      mode,
      aperçu: {
        title: 'Direction artistique — l’atelier',
        body: `Ouvrira l’atelier DA : thème, accent, densité, rayons. Export du brief agent ou du tokens.custom.css.`,
        destination: 'design-system/index.html#direction',
      },
    };
  }

  if (mode === 'media') {
    return {
      intention: 'media',
      label: LABELS.media,
      destination: 'point-zero/#pz-bureau',
      raw: trimmed,
      mode,
      aperçu: {
        title: 'Médiathèque — le Bureau de Point Zero',
        body: `Ouvrira le Bureau de la coquille : catalogue universel (arbres git des dépôts) et mode Dossier local — référencement sans copie, rien n’est envoyé.`,
        destination: 'point-zero/#pz-bureau',
      },
    };
  }

  if (mode === 'diag') {
    if (!trimmed) {
      return {
        intention: 'diag-empty',
        label: LABELS.diag,
        destination: 'diagnostic/README.md',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Diagnostic — choisir une cible',
          body: `Collez un lien GitHub (https://github.com/owner/repo ou owner/repo) pour lancer la mesure sans jamais écrire dans le projet.`,
          destination: 'diagnostic/README.md',
        },
      };
    }
    // Saisie non vide, non-GitHub, non-URL, en mode diag
    // → si phrase naturelle (contient espace) → fallback NOEMA, jamais de commande fabriquée
    if (trimmed.includes(' ')) {
      return {
        intention: 'noema',
        label: LABELS.noema,
        destination: 'noema:intent',
        raw: trimmed,
        mode: 'diag', // garde trace du mode d’origine pour le debug
        fallback: true,
        aperçu: {
          title: 'Intention pour NOEMA',
          body: `Texte libre détecté en mode Diagnostic — sera proposé à NOEMA (aucune commande fabriquée) : « ${trimmed} »`,
          destination: 'noema:intent',
        },
      };
    }
    // Sinon : tentative de repo malformée (ex: "foo", "foo/", "/bar") → erreur
    return {
      intention: 'diag-invalid',
      label: LABELS.diag,
      destination: null,
      raw: trimmed,
      mode,
      error: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
      aperçu: {
        title: 'Diagnostic — format invalide',
        body: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
        error: 'Format attendu : owner/repo — ou écris ton intention pour NOEMA',
        destination: null,
      },
    };
  }

  // 4) NOEMA (défaut)
  if (mode === 'noema') {
    if (!trimmed) {
      return {
        intention: 'noema-empty',
        label: LABELS.noema,
        destination: 'point-zero/#pz-noema',
        raw: trimmed,
        mode,
        aperçu: {
          title: 'Boucle NOEMA — ouvrir Point Zero',
          body: `Aucune intention saisie. Ouvrira le rail NOEMA de Point Zero : NOEMA propose, vous validez.`,
          destination: 'point-zero/#pz-noema',
        },
      };
    }
    return {
      intention: 'noema',
      label: LABELS.noema,
      destination: 'noema:intent',
      raw: trimmed,
      mode,
      aperçu: {
        title: 'Intention pour NOEMA',
        body: `Sera proposé à NOEMA : « ${trimmed} » — rien n’est un fait tant qu’un humain n’a pas validé.`,
        destination: 'noema:intent',
      },
    };
  }

  // Fallback (mode inconnu)
  if (!trimmed) {
    return {
      intention: 'noema-empty',
      label: LABELS.noema,
      destination: 'point-zero/#pz-noema',
      raw: trimmed,
      mode,
      aperçu: {
        title: 'Boucle NOEMA — ouvrir Point Zero',
        body: `Aucune intention saisie. Ouvrira le rail NOEMA de Point Zero.`,
        destination: 'point-zero/#pz-noema',
      },
    };
  }
  return {
    intention: 'noema',
    label: LABELS.noema,
    destination: 'noema:intent',
    raw: trimmed,
    mode,
    aperçu: {
      title: 'Intention pour NOEMA',
      body: `Sera proposé à NOEMA : « ${trimmed} »`,
      destination: 'noema:intent',
    },
  };
}
