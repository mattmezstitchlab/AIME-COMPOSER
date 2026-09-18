// FIXTURE — le pont officiel : un preset généré depuis tokens.json.
// La chaîne "design-system/bridge/tailwind.preset" est ce que le profil reconnaît.
module.exports = { presets: [require('aime-design-system/bridge/tailwind.preset.cjs')], content: ['./src/**/*.{jsx,tsx}'] };
