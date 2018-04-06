const request = require('superagent');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getPlayer = (player) => {
  console.log(`[API_CALL:GET]getPlayer player:${player.name}`);

  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/players/${player.id}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return console.error(`[API_CALL:REJECT]getPlayer player:${player.name} error:${err}`);
        }

        console.log(`[API_CALL:RESOLVE]getPlayer player:${player.name}`);

        const room = res.body.data.ongoing_rooms;
        const roomIds = Object.keys(room);

        if (roomIds.length === 0) {
          return resolve(null);
        }

        const matchId = Object.keys(room)[0];
        console.log(`[FOUND_MATCH]getPlayer match:${matchId}`);

        resolve(matchId);
      });
  });
};

module.exports = getPlayer;
