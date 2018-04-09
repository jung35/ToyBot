const request = require('superagent');
const Logger = require('../Logger');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const TEAM_ID = process.env.TEAM_ID || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getTeam = () => {
  Logger.log('GET_TEAM', 'GET', `id: ${TEAM_ID}`);

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/teams/${TEAM_ID}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return Logger.error('GET_TEAM', 'REJECT', `error: ${err}`);
        }

        if (res.status !== 200) {
          reject(err);

          return Logger.error('GET_TEAM', 'REJECT', `status: ${res.status} error: ${res.body}`);
        }

        const team = res.body.data;

        Logger.log('GET_TEAM', 'RESOLVE', `team: ${team.nickname}`);

        const players = {};

        team.players.map((player) => {
          players[player.guid] = {
            id: player.guid,
            name: player.nickname,
            avatar: player.avatar,
            status: player.status,
            updateAt: 0,
          };
        });

        Logger.log('GET_TEAM', 'PLAYERS', 'players: [' + Object.keys(players).join(', ') + ']');

        resolve(players);
      });
  });
};

module.exports = getTeam;
