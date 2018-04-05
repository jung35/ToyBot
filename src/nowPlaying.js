const getPlayer = require('./faceit/getPlayer');
const getMatch = require('./faceit/getMatch');
const Discord = require('discord.js');
const _ = require('lodash');

const nowPlaying = (client, state) => {
  let queue = 0;

  if (state.get('nowPlayingChannel') === null && state.get('players').length === 0) {
    return;
  }

  const channel = client.channels.find('id', state.get('nowPlayingChannelId'));

  if (channel === null) {
    return;
  }

  const handleMatch = (matchId) => {
    queue--;
    if (matchId === null) {
      return;
    }

    if (matchId === undefined) {
      return;
    }

    state.updateMatch({ id: matchId });

    if (queue > 0) {
      return;
    }

    const oldMatch = state.get('matches')[matchId];

    if (oldMatch !== undefined && oldMatch.lastUpdate && (+new Date()) - oldMatch.lastUpdate < 1000 * 30) {
      return;
    }

    getMatch(players, matchId).then(handleTeams);
  };

  const handleTeams = ({ matchId, teams }) => {
    const match = state.get('matches')[matchId] || { id: matchId, message: null };

    const options = {
      color: !teams[0].win && !teams[0].lose ? 0xFFFFFF : (teams[0].win ? 0x4CAF50 : 0xF44336),
      title: `${teams[0].title} vs ${teams[1].title}`,
      description: '------------------------------------------------------------',
      fields: [
        {
          name: teams[0].title,
          value: _.values(_.mapValues(teams[0].players, 'name')).join('\n').replace('*', '\\*').replace('_', '\\_'),
          inline: true
        }, {
          name: teams[1].title,
          value: _.values(_.mapValues(teams[1].players, 'name')).join('\n').replace('*', '\\*').replace('_', '\\_'),
          inline: true
        }
      ]
    };

    if (match.message === undefined) {
      match.message = 'pending';

      channel.send('', new Discord.RichEmbed(options)).then((message) => {
        match.isFinished = !teams[0].win && !teams[0].lose ? false : true;
        match.message = message;
        match.lastUpdate = +new Date();
        state.updateMatch(match);
      });
    } else {
      if (match.message === 'pending') {
        return;
      }

      match.message.edit('', new Discord.RichEmbed(options));
    }

    match.isFinished = !teams[0].win && !teams[0].lose ? false : true;
    match.lastUpdate = +new Date();
    state.updateMatch(match);
  };

  const players = state.get('players');

  if (+new Date() - state.get('lastUpdate') > 1000 * 30) {
    players.map((player) => {
      queue++;
      getPlayer(player).then(handleMatch);
    });

    state.set('lastUpdate', +new Date());
  }

  const matches = state.get('matches');
  _.map(matches, (match) => {
    if (match !== undefined && match.lastUpdate && (+new Date()) - match.lastUpdate < 1000 * 30) {
      return;
    }

    if (match.isFinished) {
      return;
    }

    getMatch(players, match.id).then(handleTeams);
  });
};

module.exports = nowPlaying;
