const request = require('superagent');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const TEAM_ID = process.env.TEAM_ID || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getTeam = () => {
  console.log('[API_CALL:GET]getTeam');

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/teams/${TEAM_ID}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return console.error(`[API_CALL:REJECT]getTeam error:${err}`);
        }

        const team = res.body.data;

        console.log(`[API_CALL:RESOLVE]getTeam team:${team.nickname}`);

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

        console.log('[PLAYERS]', Object.keys(players));

        resolve(players);
      });
  });
};

module.exports = getTeam;
