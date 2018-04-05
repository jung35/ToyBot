const request = require('superagent');
const _ = require('lodash');

const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL;

const getMatch = (players, matchId) => {
  return new Promise((resolve, reject) => {
    request
      .get(`${FACEIT_URL}/matches/${matchId}`)
      .set('Authorization', FACEIT_KEY)
      .end((err, res) => {
        if (err) {
          reject(err);

          return console.error(`getMatch[${matchId}] ERROR: ${err}`);
        }

        const match = res.body.data;

        if (match.game_type !== 'QuickMatch') {
          return resolve(null);
        }

        const getFaction = (num) => {
          return match[`faction${num}`].map((player) => {
            return {
              id: player.guid,
              name: player.nickname,
              steam_id: player.csgo_id,
              steam_name: player.csgo_name,
              join_type: player.quick_match.join_type,
              group: player.quick_match.selected_members_ids,
            };
          });
        };

        const faction1 = getFaction(1);
        const faction2 = getFaction(2);
        const playerIds = _.values(_.mapValues(players, 'id'));

        let faction1Count = 0;
        _.values(_.mapValues(faction1, 'id')).map((id) => {
          if (playerIds.indexOf(id) !== -1) {
            faction1Count++;
          }
        });

        let faction2Count = 0;
        _.values(_.mapValues(faction2, 'id')).map((id) => {
          if (playerIds.indexOf(id) !== -1) {
            faction2Count++;
          }
        });

        const faction1Data = {
          title: match.faction1_nickname,
          players: faction1,
          win: match.winner === 'faction1',
          lose: match.winner === 'faction2',
        };

        const faction2Data = {
          title: match.faction2_nickname,
          players: faction2,
          win: match.winner === 'faction2',
          lose: match.winner === 'faction1',
        };

        let teams = [faction1Data, faction2Data];

        if (faction1Count < faction2Count) {
          teams = [faction2Data, faction1Data];
        }

        resolve({ matchId, teams });
      });
  });
};

module.exports = getMatch;
