const _ = require('lodash');
let block = false;

const state = {
  nowPlayingChannelId: '431262422398009344',
  players: [],
  matches: {},
  lastUpdate: 0,
};

const get = (key) => {
  return state[key];
};

const set = (key, val) => {
  doBlock();

  block = true;
  state[key] = val;
  block = false;
};

const updateMatch = (match) => {
  doBlock();

  block = true;
  state['matches'][match.id] = _.merge(state['matches'][match.id], match);
  block = false;
};

const doBlock = () => {
  while (block) {
    if (!block) {
      break;
    }
  }
};

module.exports = { set, get, updateMatch };
