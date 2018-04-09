const _ = require('lodash');

// minimum require interval before calling api again in seconds
const delay = 60;

const state = {
  players: {},
  matches: {},
  lastUpdate: 0,
};

const get = (key) => {
  return state[key];
};

const set = (key, val) => {
  state[key] = val;
};

const updateMatch = (match) => {
  state.matches[match.id] = _.merge(state['matches'][match.id], match);
};

const setMatchUpdate = (matchId) => {
  if (state.matches[matchId] === undefined) {
    state.matches[matchId] = { id: matchId };
  }
  state.matches[matchId].lastUpdate = +new Date();
};

const canUpdateMatch = (matchId) => {
  if (state.matches[matchId] === undefined ||
    state.matches[matchId].lastUpdate === undefined
  ) {
    state.matches[matchId] = { id: matchId, lastUpdate: 0 };

    return true;
  }

  if (+new Date() - state.matches[matchId].lastUpdate < 1000 * delay) {
    return false;
  }

  return true;
};

const setPlayerUpdate = (playerId) => {
  state.players[playerId].lastUpdate = +new Date();
};

const canUpdatePlayer = (playerId) => {
  if (state.players[playerId] === undefined ||
    state.players[playerId].lastUpdate === undefined
  ) {
    return true;
  }

  if (+new Date() - state.players[playerId].lastUpdate < 1000 * delay) {
    return false;
  }

  return true;
};

module.exports = {
  set, get,
  updateMatch, canUpdateMatch, setMatchUpdate,
  setPlayerUpdate, canUpdatePlayer
};
