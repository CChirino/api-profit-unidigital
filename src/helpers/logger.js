import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer el nivel de log desde la variable de entorno
const logLevel = process.env.LOG_LEVEL || 'info';

const logger = createLogger({
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }), // Para capturar stack traces de errores
        format.printf(({ timestamp, level, message, stack }) => {
            return `${timestamp} ${level}: ${message} ${stack || ''}`;
        })
    ),
    transports: [
        new transports.File({
            maxsize: 5120000,
            maxFiles: 5,
            filename: `${__dirname}/../logs/log-info.log`,
            level: logLevel
        }),
        new transports.File({
            maxsize: 5120000,
            maxFiles: 5,
            filename: `${__dirname}/../logs/log-error.log`,
            level: 'error'
        }),
        new transports.Console({
            level: 'debug',
            format: format.combine(
                format.colorize(),
                format.simple()
            )
        })
    ]
});

export default logger;