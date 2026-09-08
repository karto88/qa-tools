/**
 * Logger Utility
 * Provides colored console logging for QA agents
 */

class Logger {
  constructor(agentName) {
    this.agentName = agentName;
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      red: '\x1b[31m',
      cyan: '\x1b[36m',
      magenta: '\x1b[35m'
    };
  }

  _timestamp() {
    return new Date().toISOString();
  }

  _format(level, color, message) {
    const prefix = `${this.colors.bright}[${this._timestamp()}]${this.colors.reset}`;
    const agent = `${this.colors.cyan}[${this.agentName}]${this.colors.reset}`;
    const levelTag = `${color}[${level}]${this.colors.reset}`;
    return `${prefix} ${agent} ${levelTag} ${message}`;
  }

  info(message) {
    console.log(this._format('INFO', this.colors.blue, message));
  }

  success(message) {
    console.log(this._format('SUCCESS', this.colors.green, message));
  }

  warn(message) {
    console.log(this._format('WARN', this.colors.yellow, message));
  }

  error(message) {
    console.error(this._format('ERROR', this.colors.red, message));
  }

  debug(message) {
    console.log(this._format('DEBUG', this.colors.magenta, message));
  }

  step(stepNumber, message) {
    const step = `${this.colors.bright}${this.colors.cyan}[Step ${stepNumber}]${this.colors.reset}`;
    console.log(`${step} ${message}`);
  }
}

module.exports = Logger;
