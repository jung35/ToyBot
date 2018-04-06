require('dotenv').config();
const Discord = require('discord.js');
const state = require('./state');

const getTeam = require('./faceit/getTeam');
const nowPlaying = require('./nowPlaying');

const BOT_TOKEN = process.env.BOT_TOKEN || null;
const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL || null;
// const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '.';

const client = new Discord.Client();

const login = () => {
  if (BOT_TOKEN === null || FACEIT_KEY === null || FACEIT_URL === null) {
    console.error('BOT_TOKEN or/and FACEIT_KEY missing. exiting.');

    return false;
  }
  client.login(BOT_TOKEN);

  return true;
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

if (login()) {
  getTeam(state).then((players) => {
    state.set('players', players);
  });

  nowPlaying(client, state);
}
