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

  static log(type, result, ...message) {
    console.log(
      ...print_log('\x1b[32m', type, result, ...message)
    );
  }

  static error(type, result, ...message) {
    console.error (
      ...print_log('\x1b[35m', type, result, ...message)
    );
  }
}

const print_log = (color, type, result, ...message) => {
  const length = 20;

  return [
    '\x1b[35m' + Logger.time() + color,
    (Array(length).join(' ') + `[${type}:${result}]`).slice(-length) + '\x1b[37m\x1b[2m',
    ...message,
    '\x1b[0m'
  ];
};

module.exports = Logger;
