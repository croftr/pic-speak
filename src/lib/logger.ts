export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const LOG_PRIORITIES: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Determine the minimum log level from environment variables.
// Default to 'info' in production/test, 'debug' in development.
const ENV_LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
const MIN_PRIORITY = LOG_PRIORITIES[ENV_LOG_LEVEL] ?? LOG_PRIORITIES.info;

export class Logger {
  private context: LogContext;

  constructor(context: LogContext = {}) {
    this.context = context;
  }

  /**
   * Creates a new logger instance with the current context merged with the provided context.
   */
  withContext(context: LogContext): Logger {
    return new Logger({ ...this.context, ...context });
  }

  private output(level: LogLevel, message: string, data?: LogContext) {
    // Check if the log level is sufficient to be logged
    if (LOG_PRIORITIES[level] < MIN_PRIORITY) {
      return;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...data,
    };

    // In development, pretty print for readability
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { timestamp, level: lvl, message: msg, ...rest } = entry;
      const color = lvl === 'error' ? '\x1b[31m' : lvl === 'warn' ? '\x1b[33m' : '\x1b[34m'; // Red, Yellow, Blue
      const reset = '\x1b[0m';

      // Use console.error for errors to keep stack traces separate if needed, but console.log is usually fine for dev
      const logFn = lvl === 'error' ? console.error : console.log;

      if (Object.keys(rest).length > 0) {
        logFn(`${color}[${lvl.toUpperCase()}]${reset} ${msg}`, rest);
      } else {
        logFn(`${color}[${lvl.toUpperCase()}]${reset} ${msg}`);
      }
      return;
    }

    // In production (or other envs), log structured JSON
    const json = JSON.stringify(entry);

    if (level === 'error') {
      console.error(json);
    } else {
      console.log(json);
    }
  }

  debug(message: string, data?: LogContext) {
    this.output('debug', message, data);
  }

  info(message: string, data?: LogContext) {
    this.output('info', message, data);
  }

  warn(message: string, data?: LogContext) {
    this.output('warn', message, data);
  }

  error(message: string, error?: unknown, data?: LogContext) {
    let errorData: LogContext = {};

    if (error instanceof Error) {
      errorData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(error as any), // Capture any custom properties
        }
      };
    } else if (error !== undefined) {
      errorData = { error: String(error) };
    }

    this.output('error', message, { ...errorData, ...data });
  }

  /**
   * Times the execution of a function and logs the duration.
   */
  async time<T>(name: string, fn: () => Promise<T> | T): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.info(`${name} completed`, { duration_ms: duration });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.error(`${name} failed`, error, { duration_ms: duration });
      throw error;
    }
  }
}

export const logger = new Logger();
