// MIRROR of client/src/backgrounds/registry.js keys. Adding a type updates BOTH.
const BACKGROUND_KEYS = ['dotgrid', 'mesh', 'galaxy', 'rain', 'holi', 'diwali', 'celebration'];
const isBackgroundKey = (k) => typeof k === 'string' && BACKGROUND_KEYS.includes(k);
module.exports = { BACKGROUND_KEYS, isBackgroundKey };
