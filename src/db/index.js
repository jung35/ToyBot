const MongoClient = require('mongodb').MongoClient;
const Logger = require('./Logger');
const DB_URL = process.env.DB_URL || null;

MongoClient.connect(DB_URL, function (err) {
  if (err) {
    return Logger.error('DB_CONNECT', 'ERROR', `err: ${err}`);
  }

  Logger.log('DB_CONNECT', 'SUCCESS', 'Connected successfully to server');
});

module.exports = MongoClient;
