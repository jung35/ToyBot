const request = require('superagent');
const Logger = require('../Logger');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const TEAM_ID = process.env.TEAM_ID || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getTeam = () => {
  Logger.log('[API_CALL:GET]getTeam');

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/teams/${TEAM_ID}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return Logger.error(`[API_CALL:REJECT]getTeam error:${err}`);
        }

        const team = res.body.data;

        Logger.log(`[API_CALL:RESOLVE]getTeam team:${team.nickname}`);

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

        Logger.log('[PLAYERS]', Object.keys(players));

        resolve(players);
      });
  });
};

module.exports = getTeam;
