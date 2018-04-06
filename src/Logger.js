class Logger {
  static time() {
    const dateOptions = {
      timeZone: 'America/Chicago',
      hour12: true,
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric'
    };

    return '[' + new Date().toLocaleDateString('en-US', dateOptions) + ']';
  }

  static log(...message) {
    console.log(Logger.time(), ...message);
  }

  static error(...message) {
    console.error(Logger.time(), ...message);
  }
}

module.exports = Logger;
