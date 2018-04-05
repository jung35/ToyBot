const request = require('superagent');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getPlayer = (player) => {
  console.log(`getPlayer[${player.name}] FETCHING...`);

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/players/${player.id}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return console.error(`getPlayer[${player.name}] ERROR: ${err}`);
        }

        console.log(`getPlayer[${player.name}] FOUND`);

        const room = res.body.data.ongoing_rooms;

        if (room === undefined) {
          return resolve(null);
        }

        const matchId = Object.keys(room)[0];

        resolve(matchId);
      });
  });
};

module.exports = getPlayer;
