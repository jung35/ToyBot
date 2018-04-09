require('dotenv').config();
const Discord = require('discord.js');
// const MongoClient = require('mongodb').MongoClient;
const DB_URL = process.env.DB_URL || null;
const DB_NAME = process.env.DB_NAME || null;

const Logger = require('./Logger');
const state = require('./state');

const getTeam = require('./faceit/getTeam');
const nowPlaying = require('./nowPlaying');

const BOT_TOKEN = process.env.BOT_TOKEN || null;
const FACEIT_KEY = process.env.FACEIT_KEY || null;
const FACEIT_URL = process.env.FACEIT_URL || null;

const CHANNEL_ID = process.env.CHANNEL_ID || null;

// const COMMAND_PREFIX = process.env.COMMAND_PREFIX || '.';

const client = new Discord.Client();

const login = () => {
  return new Promise((resolve, reject) => {
    const required_var = [DB_URL, DB_NAME, BOT_TOKEN, FACEIT_KEY, FACEIT_URL, CHANNEL_ID];
    const required_var_string = ['DB_URL', 'DB_NAME', 'BOT_TOKEN', 'FACEIT_KEY', 'FACEIT_URL', 'CHANNEL_ID'];

    if (required_var.indexOf(null) !== -1) {
      Logger.error('ENV', 'MISSING', `${required_var_string[required_var.indexOf(null)]} = null`);

      return reject(null);
    }

    return client.login(BOT_TOKEN).then((token) => {
      if (BOT_TOKEN !== token) {
        Logger.error('DISCORD', 'FAIL', 'BOT_TOKEN does not match!');

        reject(null);
      }

      Logger.log('DISCORD', 'SUCCESS', 'BOT_TOKEN accepted.');

      resolve(null);
    }).catch((err) => {
      Logger.error('DISCORD', 'FAIL', 'BOT_TOKEN rejected', `err: ${err}`);

      return reject(null);
    });

    // Should've made this under different branch...
    /*return MongoClient.connect(DB_URL, function (err, mongo) {
      if (err) {
        Logger.error('DB_CONNECT', 'ERROR', `err: ${err}`);

        return reject(null);
      }

      Logger.log('DB_CONNECT', 'SUCCESS', 'Connected successfully to server');

      // const db = client.db(DB_NAME);

      client.login(BOT_TOKEN).then((token) => {
        if (BOT_TOKEN !== token) {
          Logger.error('DISCORD', 'FAIL', 'BOT_TOKEN does not match!');

          reject(null);
        }

        Logger.log('DISCORD', 'SUCCESS', 'BOT_TOKEN accepted.');

        resolve(null);
      }).catch((err) => {
        Logger.error('DISCORD', 'FAIL', 'BOT_TOKEN rejected', `err: ${err}`);

        return reject(null);
      });

      mongo.close();
    }); */

  });
};

client.on('ready', () => {
  Logger.log('DISCORD', 'READY', `Logged in as ${client.user.tag}!`);
});

login().then(() => {
  Logger.log('LOGIN', 'SUCCESS', 'Everything passed!');
  getTeam(state).then((players) => {
    state.set('players', players);
  });

  nowPlaying(client, state);
}).catch(() => {
  Logger.error('LOGIN', 'FAIL', 'exiting...');

  process.exit(-1);
});

