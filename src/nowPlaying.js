const getPlayer = require('./faceit/getPlayer');
const getMatch = require('./faceit/getMatch');
const Discord = require('discord.js');
const _ = require('lodash');
const Logger = require('./Logger');

const CHANNEL_ID = process.env.CHANNEL_ID;
const ERROR_LOG_CHANNEL_ID = process.env.ERROR_LOG_CHANNEL_ID;

const MATCH_WIN = 'win';
const MATCH_LOSE = 'lose';
const MATCH_FINISH = 'finish';
const MATCH_ONGOING = 'ongoing';
const MATCH_CANCEL = 'cancel';

const MATCH_CONSIDERED_ONGOING = ['voting', 'configuring', 'ready', 'ongoing'];
const MATCH_CONSIDERED_END = [MATCH_WIN, MATCH_LOSE, MATCH_FINISH, MATCH_CANCEL];

let block = false;

const nowPlaying = (client, state) => {
  setTimeout(() => {
    nowPlaying(client, state);
  }, 100);

  if (block) {
    return;
  }

  if (state.get('nowPlayingChannel') === null) {
    return;
  }

  if (Object.keys(state.get('players')).length === 0) {
    return;
  }

  const channels = client.channels;
  const channel = client.channels.find('id', CHANNEL_ID);

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
        if (!state.canUpdateMatch(match.id) ||
          [MATCH_FINISH, MATCH_WIN, MATCH_LOSE].indexOf(getMatchType(match)) !== -1
        ) {
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
      .catch((err) => {
        Logger.error('GET_PLAYER', 'CATCH', `err: ${err}`);
        LogErrorChannel(channels, err);
        parsePlayer();
      });
  };

  const handleMatch = (matchId) => {
    if (matchId === null || !state.canUpdateMatch(matchId)) {
      return parsePlayer();
    }

    state.setMatchUpdate(matchId);
    getMatch(state.get('players'), matchId)
      .then(handleTeams)
      .catch((err) => {
        Logger.error('GET_MATCH', 'CATCH', `err: ${err}`);
        LogErrorChannel(channels, err);

        const match = state.get('matches')[matchId];

        if (match.message === 'pending' || match.message === undefined) {
          Logger.error('GET_MATCH', 'CATCH', 'Match message found to be pending. Attempt to refetch message.');
          state.updateMatch({ id: matchId });
        }

        parsePlayer();
      });
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

    match.isCancelled = matchData.state === 'cancelled';
    match.isFinished = MATCH_CONSIDERED_ONGOING.indexOf(matchData.state) === -1;
    match.isWinner = matchData.winner === teams[0].faction;
    match.isLoser = matchData.loser === teams[0].faction;

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
          value: matchData.voted_entities === null ? 'voting...' : matchData.voted_entities[0].map.name,
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

    if (MATCH_CONSIDERED_END.indexOf(getMatchType(match)) !== -1) {
      options.fields.push({
        name: 'End Time',
        value: parseDate(matchData.finished_at),
        inline: true
      }, {
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

  parsePlayer();
};

const getMatchType = (match) => {
  if (match.isCancelled) {
    return MATCH_CANCEL;
  }

  if (match.isWinner) {
    return MATCH_WIN;
  }

  if (match.isLoser) {
    return MATCH_LOSE;
  }

  if (match.isFinished) {
    return MATCH_FINISH;
  }

  return MATCH_ONGOING;
};

const matchMessage = {
  [MATCH_CANCEL]: ' had their match cancelled.',
  [MATCH_WIN]: ' won their match!',
  [MATCH_LOSE]: ' lost their match :(',
  [MATCH_FINISH]: ' ended their match..?',
  [MATCH_ONGOING]: ' is currently playing a match!',
};

const matchColors = {
  [MATCH_CANCEL]: 0xFF9800,
  [MATCH_WIN]: 0x4CAF50,
  [MATCH_LOSE]: 0xF44336,
  [MATCH_FINISH]: 0x000000,
  [MATCH_ONGOING]: 0xFFFFFF
};

const parsePlayerList = (players) => {
  return _.values(_.mapValues(players, 'name'))
    .join('\n')
    .replace('*', '\\*')
    .replace('_', '\\_')
    .replace('`', '\\`');
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

const LogErrorChannel = (channels, message) => {
  const channel = channels.find('id', ERROR_LOG_CHANNEL_ID);

  if (channel === null) {
    return;
  }

  let out = 'ERROR:';

  out += '```' + JSON.stringify(message, null, 2) + '```';

  channel.send(out);
};

module.exports = nowPlaying;
