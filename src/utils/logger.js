```javascript
/**
 * @file src/utils/logger.js
 * @description Implements a centralized logging mechanism for the meta-application.
 * This logger supports different log levels, context-specific logging,
 * and formats messages with timestamps.
 */

/**
 * Enumeration for log levels.
 * Higher number means higher severity.
 * @readonly
 * @enum {number}
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
  NONE: 5, // Disables all logging
};

/**
 * The current minimum log level that will be output.
 * Messages with a lower severity level than `currentLogLevel` will be ignored.
 * @type {number}
 */
let currentLogLevel = LOG_LEVELS.INFO; // Default log level

/**
 * Generates an ISO 8601 formatted timestamp.
 * @returns {string} The current timestamp in ISO 8601 format (e.g., "YYYY-MM-DDTHH:mm:ss.sssZ").
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Formats a log message with level, timestamp, context, and additional arguments.
 * Ensures all log data (including objects) are stringified for consistent output.
 * @param {number} level - The log level of the message.
 * @param {string|null} context - The context or source of the log message (e.g., 'API', 'UI:Component').
 * @param {*} message - The primary message or object to log.
 * @param {...*} args - Additional arguments to log.
 * @returns {string} The formatted log string.
 */
function formatMessage(level, context, message, ...args) {
  const levelName = Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level) || 'UNKNOWN';
  const timestamp = getTimestamp();
  const contextString = context ? `[${context}] ` : '';

  let primaryMessage = message;
  let additionalArgs = args;

  // If primary message is an object or non-string, stringify it
  if (typeof primaryMessage === 'object' && primaryMessage !== null) {
    try {
      primaryMessage = JSON.stringify(primaryMessage);
    } catch (e) {
      primaryMessage = `<Unstringifiable Object (Primary)>`;
    }
  } else if (primaryMessage === undefined) {
    primaryMessage = 'undefined';
  } else if (primaryMessage === null) {
    primaryMessage = 'null';
  } else {
    primaryMessage = String(primaryMessage);
  }

  // Stringify all additional arguments
  const formattedArgs = additionalArgs.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return `<Unstringifiable Object>`;
      }
    }
    return String(arg);
  }).join(' ');

  const finalMessage = `${primaryMessage}${formattedArgs ? ' ' + formattedArgs : ''}`;

  return `[${timestamp}] [${levelName.toUpperCase()}] ${contextString}${finalMessage}`;
}

const logger = {
  LOG_LEVELS, // Expose levels for external configuration/reference

  /**
   * Configures the logger settings.
   * @param {object} options - Configuration options.
   * @param {string|number} [options.level='INFO'] - The minimum log level to output.
   *   Can be a string (e.g., 'DEBUG', 'INFO') or a number (0-5).
   */
  configure: (options = {}) => {
    if (options.level !== undefined) {
      let newLevel;
      if (typeof options.level === 'string') {
        newLevel = LOG_LEVELS[options.level.toUpperCase()];
      } else if (typeof options.level === 'number') {
        newLevel = options.level;
      }

      if (newLevel !== undefined && Object.values(LOG_LEVELS).includes(newLevel)) {
        currentLogLevel = newLevel;
        // Use console.log directly to ensure this configuration message is always visible
        console.log(`[Logger] Log level set to ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === newLevel) || newLevel}.`);
      } else {
        console.warn(`[Logger] Invalid log level configuration: '${options.level}'. Keeping current level.`);
      }
    }
  },

  /**
   * Internal logging function. Handles level checking and output.
   * @private
   * @param {number} level - The log level of the message.
   * @param {string|null} context - The context/source of the log message.
   * @param {*} message - The primary message or object to log.
   * @param {...*} args - Additional arguments to log.
   */
  _log: (level, context, message, ...args) => {
    if (level >= currentLogLevel) {
      const formattedOutput = formatMessage(level, context, message, ...args);
      // Use appropriate console method for better developer experience (e.g., color coding in dev tools)
      switch (level) {
        case LOG_LEVELS.DEBUG:
          console.debug(formattedOutput);
          break;
        case LOG_LEVELS.INFO:
          console.info(formattedOutput);
          break;
        case LOG_LEVELS.WARN:
          console.warn(formattedOutput);
          break;
        case LOG_LEVELS.ERROR:
        case LOG_LEVELS.CRITICAL:
          console.error(formattedOutput);
          break;
        default:
          console.log(formattedOutput);
      }
    }
  },

  /**
   * Helper function to parse arguments for log methods, allowing flexible `context` usage.
   * If the first argument is a string, it's treated as `context`. Otherwise, `context` is null.
   * @private
   * @param {Array<*>} args - The arguments passed to a public log method.
   * @returns {{context: string|null, message: *, remainingArgs: Array<*>}} Parsed arguments.
   */
  _parseLogArgs: (args) => {
    let context = null;
    let message;
    let remainingArgs = [];

    if (args.length > 0) {
      // If the first argument is a string, treat it as the context
      if (typeof args[0] === 'string') {
        context = args[0];
        message = args[1];
        remainingArgs = args.slice(2);
      } else {
        // Otherwise, no explicit context, first arg is the message
        message = args[0];
        remainingArgs = args.slice(1);
      }
    }
    return { context, message, remainingArgs };
  },

  /**
   * Logs a message with DEBUG level.
   * Usage: `logger.debug('MyContext', 'Debug message', { data: 'test' })`
   * Or:    `logger.debug('Debug message without context', { data: 'test' })`
   * @param {string} [context] - The source/context of the log (optional).
   * @param {*} message - The message or object to log.
   * @param {...*} args - Additional data to log.
   */
  debug: (...args) => {
    const { context, message, remainingArgs } = logger._parseLogArgs(args);
    logger._log(LOG_LEVELS.DEBUG, context, message, ...remainingArgs);
  },

  /**
   * Logs a message with INFO level.
   * Usage: `logger.info('MyContext', 'User logged in', { userId: 123 })`
   * Or:    `logger.info('Application started successfully')`
   * @param {string} [context] - The source/context of the log (optional).
   * @param {*} message - The message or object to log.
   * @param {...*} args - Additional data to log.
   */
  info: (...args) => {
    const { context, message, remainingArgs } = logger._parseLogArgs(args);
    logger._log(LOG_LEVELS.INFO, context, message, ...remainingArgs);
  },

  /**
   * Logs a message with WARN level.
   * Usage: `logger.warn('AuthService', 'Deprecated API called', { endpoint: '/old/api' })`
   * Or:    `logger.warn('Configuration file not found, using defaults')`
   * @param {string} [context] - The source/context of the log (optional).
   * @param {*} message - The message or object to log.
   * @param {...*} args - Additional data to log.
   */
  warn: (...args) => {
    const { context, message, remainingArgs } = logger._parseLogArgs(args);
    logger._log(LOG_LEVELS.WARN, context, message, ...remainingArgs);
  },

  /**
   * Logs a message with ERROR level.
   * Usage: `logger.error('Database', 'Failed to connect to DB', errorObject)`
   * Or:    `logger.error('Unexpected error occurred during data processing')`
   * @param {string} [context] - The source/context of the log (optional).
   * @param {*} message - The message or object to log.
   * @param {...*} args - Additional data to log.
   */
  error: (...args) => {
    const { context, message, remainingArgs } = logger._parseLogArgs(args);
    logger._log(LOG_LEVELS.ERROR, context, message, ...remainingArgs);
  },

  /**
   * Logs a message with CRITICAL level.
   * Intended for severe errors that halt application functionality or require immediate attention.
   * Usage: `logger.critical('AppInit', 'Failed to load essential modules, application cannot start', fatalError)`
   * @param {string} [context] - The source/context of the log (optional).
   * @param {*} message - The message or object to log.
   * @param {...*} args - Additional data to log.
   */
  critical: (...args) => {
    const { context, message, remainingArgs } = logger._parseLogArgs(args);
    logger._log(LOG_LEVELS.CRITICAL, context, message, ...remainingArgs);
  },

  /**
   * Creates a new logger instance bound to a specific context.
   * This is useful for component-specific logging without repeating the context string.
   * @example
   * const apiLogger = logger.withContext('API');
   * apiLogger.info('Request received', { method: 'GET', path: '/users' });
   *
   * @param {string} contextName - The predefined context string for this logger.
   * @returns {object} An object with debug, info, warn, error, critical methods
   *   that automatically apply the given contextName.
   */
  withContext: (contextName) => {
    if (typeof contextName !== 'string' || contextName.trim() === '') {
      console.warn('[Logger] `withContext` requires a non-empty string for `contextName`. Using "UNKNOWN_CONTEXT".');
      contextName = 'UNKNOWN_CONTEXT';
    }
    return {
      debug: (message, ...args) => logger._log(LOG_LEVELS.DEBUG, contextName, message, ...args),
      info: (message, ...args) => logger._log(LOG_LEVELS.INFO, contextName, message, ...args),
      warn: (message, ...args) => logger._log(LOG_LEVELS.WARN, contextName, message, ...args),
      error: (message, ...args) => logger._log(LOG_LEVELS.ERROR, contextName, message, ...args),
      critical: (message, ...args) => logger._log(LOG_LEVELS.CRITICAL, contextName, message, ...args),
    };
  },
};

// Initial logger configuration based on environment, if available.
// This allows setting different default log levels for development vs. production.
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
  logger.configure({
    level: process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG
  });
}

export default logger;
```