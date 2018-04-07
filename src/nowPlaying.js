const getPlayer = require('./faceit/getPlayer');
const getMatch = require('./faceit/getMatch');
const Discord = require('discord.js');
const _ = require('lodash');

const MATCH_WIN = 'win';
const MATCH_LOSE = 'lose';
const MATCH_FINISH = 'finish';
const MATCH_ONGOING = 'ongoing';

let block = false;

const nowPlaying = (client, state) => {
  setTimeout(() => {
    nowPlaying(client, state);
  }, 1000);

  if (block) {
    return;
  }


  if (state.get('nowPlayingChannel') === null) {
    return;
  }

  if (Object.keys(state.get('players')).length === 0) {
    return;
  }

  const channel = client.channels.find('id', state.get('nowPlayingChannelId'));

  if (channel === null) {
    return;
  }

  block = true;

  const playerIds = Object.keys(state.get('players'));
  const parsePlayer = () => {
    const playerId = playerIds.pop();
    if (playerId === undefined) {
      block = false;

      _.map(state.get('matches'), (match) => {
        if (!state.canUpdateMatch(match.id) || getMatchType(match) === 'finished') {
          return;
        }

        state.setMatchUpdate(match.id);
        getMatch(state.get('players'), match.id).then((props) => {
          if (props === null) {
            props = {};
          }

          props.dontParsePlayer = true;
          handleTeams(props);
        });
      });

      return false;
    }

    if (!state.canUpdatePlayer(playerId)) {
      return parsePlayer();
    }

    state.setPlayerUpdate(playerId);
    getPlayer(state.get('players')[playerId])
      .then(handleMatch)
      .catch(() => parsePlayer());
  };

  const handleMatch = (matchId) => {
    if (matchId === null || !state.canUpdateMatch(matchId)) {
      return parsePlayer();
    }

    state.setMatchUpdate(matchId);
    getMatch(state.get('players'), matchId)
      .then(handleTeams)
      .catch(() => parsePlayer());
  };

  const handleTeams = (props) => {
    if (props === null) {
      return parsePlayer();
    }

    const { teams, playing, matchData, dontParsePlayer = false } = props;
    const match = state.get('matches')[matchData.match_id] || { id: matchData.match_id };

    if (match.message === 'pending') {
      if (dontParsePlayer) {
        return;
      }

      return parsePlayer();
    }

    if (match.message === undefined) {
      if (dontParsePlayer) {
        return;
      }

      match.message = 'pending';
      state.updateMatch(match);
    }

    match.finshedAt = matchData.finished_at;
    match.isFinished = matchData.state !== 'ongoing' && matchData.state !== 'ready';
    match.isWinner = matchData.winner === teams[0].faction;
    match.isLoser = matchData.loser === teams[0].faction;

    const matchColors = {
      [MATCH_WIN]: 0x4CAF50,
      [MATCH_LOSE]: 0xF44336,
      [MATCH_FINISH]: 0x000000,
      [MATCH_ONGOING]: 0xFFFFFF
    };

    const parseDate = (time) => {
      const dateOptions = {
        timeZone: 'America/Chicago',
        hour12: true,
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
      };

      return (new Date(time)).toLocaleDateString('en-US', dateOptions);
    };

    const parsePlayerList = (players) => {
      return _.values(_.mapValues(players, 'name'))
        .join('\n')
        .replace('*', '\\*')
        .replace('_', '\\_')
        .replace('`', '\\`');
    };

    const options = {
      color: matchColors[getMatchType(match)],
      title: `${teams[0].title} vs ${teams[1].title}`,
      description: '-------------------------------------------------------------------------------------------------',
      url: `https://www.faceit.com/en/csgo/room/${matchData.match_id}`,
      fields: [
        {
          name: teams[0].title,
          value: parsePlayerList(teams[0].players),
          inline: true
        }, {
          name: teams[1].title,
          value: parsePlayerList(teams[1].players),
          inline: true
        }, {
          name: 'Map',
          value: matchData.voted_entities[0].map.name,
          inline: true
        }, {
          name: '\u200b',
          value: '-------------------------------------------------------------------------------------------------',
        }, {
          name: 'Start Time',
          value: parseDate(matchData.started_at),
          inline: true
        }
      ]
    };

    if (getMatchType(match) === MATCH_FINISH && match.finishedAt !== null) {
      options.fields.push({
        name: 'End Time',
        value: parseDate(match.finishedAt),
        inline: true
      });

      options.fields.push({
        name: '\u200b',
        value: '\u200b',
        inline: true
      });
    }

    options.fields.push({
      name: '\u200b',
      value: '\u200b',
    });

    const playingList = _.filter(teams[0].players, (o) => {
      return playing.indexOf(o.id) !== -1;
    });

    // Lets not call API too much
    _.map(playingList, (playingPlayer) => {
      state.setPlayerUpdate(playingPlayer.id);
    });

    const matchMessage = {
      [MATCH_WIN]: ' has won their match!',
      [MATCH_LOSE]: ' has lost their match :(',
      [MATCH_FINISH]: ' has ended their match..?',
      [MATCH_ONGOING]: ' is currently playing a match!'
    };

    const playingJoinedList = '**' + _.values(_.mapValues(playingList, 'name')).join('**, **') + '**';
    const messageText = playingJoinedList + matchMessage[getMatchType(match)];

    if (match.message === 'pending') {
      channel.send(messageText, new Discord.RichEmbed(options)).then((message) => {
        match.message = message;
        state.updateMatch(match);

        if (dontParsePlayer) {
          return;
        }

        parsePlayer();
      });
    } else {
      match.message.edit(messageText, new Discord.RichEmbed(options));

      if (dontParsePlayer) {
        return;
      }

      parsePlayer();
    }
  };

  const getMatchType = (match) => {
    if (match.isWinner) {
      return MATCH_WIN;
    }

    if (match.isLoser) {
      return MATCH_LOSE;
    }

    if (match.isFinished && match.finishedAt !== null) {
      return MATCH_FINISH;
    }

    return MATCH_ONGOING;
  };

  parsePlayer();
};

module.exports = nowPlaying;
