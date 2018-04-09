const request = require('superagent');
const Logger = require('../Logger');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getPlayer = (player) => {
  Logger.log('GET_PLAYER', 'GET', `player: ${player.name}`);

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/players/${player.id}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return Logger.error('GET_PLAYER', 'REJECT', `player: ${player.name} error: ${err}`);
        }

        if (res.status !== 200) {
          reject(err);

          return Logger.error('GET_PLAYER', 'REJECT', `status: ${res.status} error: ${res.body}`);
        }

        Logger.log('GET_PLAYER', 'RESOLVE', `player: ${player.name}`);

        const room = res.body.data.ongoing_rooms;
        const roomIds = Object.keys(room);

        if (roomIds.length === 0) {
          return resolve(null);
        }

        const matchId = Object.keys(room)[0];
        Logger.log('GET_PLAYER', 'FOUND_MATCH', `match: ${matchId}`);

        resolve(matchId);
      });
  });
};

module.exports = getPlayer;
