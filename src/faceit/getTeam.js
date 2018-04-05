const request = require('superagent');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const TEAM_ID = process.env.TEAM_ID || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getTeam = () => {
  console.log('getTeam FETCHING...');

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/teams/${TEAM_ID}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return console.error(`getTeam ERROR: ${err}`);
        }

        const team = res.body.data;

        console.log(`getTeam FOUND: ${team.nickname}`);

        const players = team.players.map((player) => {
          return {
            id: player.guid,
            name: player.nickname,
            avatar: player.avatar,
            status: player.status,
          };
        });

        resolve(players);
      });
  });
};

module.exports = getTeam;
