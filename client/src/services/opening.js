/**
 * opening.js — client calls for "The Opening" launch event (/api/opening).
 */
import API from './api';

export const getOpeningStatus = () => API.get('/opening/status').then((r) => r.data);

export const placeStone = (name, message) =>
  API.post('/opening/open', { name, message }).then((r) => r.data);

export const getWall = (cursor, limit = 60) =>
  API.get('/opening/wall', { params: { cursor, limit } }).then((r) => r.data);
