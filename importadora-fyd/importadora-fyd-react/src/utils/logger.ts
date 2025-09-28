type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enableConsole: boolean;
  enableFirestore: boolean;
  level: LogLevel;
}

class Logger {
  private config: LogConfig;

  constructor() {
    this.config = {
      enableConsole: process.env.NODE_ENV === 'development',
      enableFirestore: process.env.NODE_ENV === 'production',
      level: (process.env.NODE_ENV === 'development' ? 'debug' : 'error') as LogLevel
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.config.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return data ? `${prefix} ${message} ${JSON.stringify(data)}` : `${prefix} ${message}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug') && this.config.enableConsole) {
      console.log(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info') && this.config.enableConsole) {
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      if (this.config.enableConsole) {
        console.warn(this.formatMessage('warn', message, data));
      }
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      const formattedMessage = this.formatMessage('error', message, error);

      if (this.config.enableConsole) {
        console.error(formattedMessage);
      }

      // En producción, podrías enviar a un servicio de logging
      if (this.config.enableFirestore && typeof window !== 'undefined') {
        // Solo log críticos en producción
        this.logToService(formattedMessage);
      }
    }
  }

  private async logToService(message: string): Promise<void> {
    try {
      // Implementación futura para logging service
      // Por ahora solo almacena localmente
      if (typeof window !== 'undefined' && window.localStorage) {
        const logs = JSON.parse(localStorage.getItem('app_errors') || '[]');
        logs.push({ message, timestamp: Date.now() });
        // Mantener solo los últimos 10 errores
        if (logs.length > 10) logs.shift();
        localStorage.setItem('app_errors', JSON.stringify(logs));
      }
    } catch (e) {
      // Silently fail - no logging of logging errors
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Convenience functions for backward compatibility
export const logError = (message: string, error?: unknown) => logger.error(message, error);
export const logWarn = (message: string, data?: unknown) => logger.warn(message, data);
export const logInfo = (message: string, data?: unknown) => logger.info(message, data);
export const logDebug = (message: string, data?: unknown) => logger.debug(message, data);