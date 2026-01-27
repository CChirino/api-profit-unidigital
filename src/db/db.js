import sql from "mssql";
import dotenv from 'dotenv';
import logger from "../helpers/logger.js";


dotenv.config();

let pool = null;

const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PWD,
    server: process.env.SERVER_NAME,
    database: process.env.DB_NAME,
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: false, // Cambiado a false para SQL Server 2014
      trustServerCertificate: true,
      // Aumentamos el timeout de conexión para darle más tiempo
      connectionTimeout: 30000 
    },
    requestTimeout: 120000 // 120 segundos (2 minutos)
};

/**
 * Inicia y mantiene el pool de conexiones a la base de datos con reintentos.
 * Esta función debe ser llamada UNA SOLA VEZ al iniciar la aplicación.
 */
export const connectDB = async () => {
    let retries = 5; // Número de intentos de reconexión
    while (retries) {
        try {
            if (pool && pool.connected) return; // Si ya está conectado, no hacer nada

            logger.info('Intentando conectar a SQL Server...');
            pool = await new sql.ConnectionPool(sqlConfig).connect();
            
            // Escuchar eventos de error en el pool para manejar desconexiones futuras
            pool.on('error', err => {
                logger.error(`Error inesperado en el pool de SQL Server: ${err.message}`);
                pool = null; // Marcar el pool como inválido para forzar la reconexión
            });

            logger.info('Pool de conexiones SQL Server creado exitosamente.');
            return; // Salimos del bucle si la conexión es exitosa

        } catch (error) {
            logger.error(`Error al crear el pool de conexiones SQL: ${error.message}`);
            retries--;
            if (retries > 0) {
                logger.warn(`Conexión fallida. Reintentando en 5 segundos... (${retries} intentos restantes)`);
                // Esperar 5 segundos antes del siguiente intento
                await new Promise(res => setTimeout(res, 5000));
            } else {
                logger.error("No se pudo establecer conexión con la base de datos después de varios intentos. La aplicación continuará ejecutándose, pero las operaciones de DB fallarán.");
                // No usamos process.exit(1) para que la app no haga crash
            }
        }
    }
};

/**
 * Devuelve la instancia del pool de conexiones ya establecida.
 * @returns {sql.ConnectionPool} La instancia del pool.
 */
export const getPool = () => {
    // Ahora esta función puede devolver null si la conexión nunca se estableció
    if (!pool || !pool.connected) {
        logger.error("Intento de usar la base de datos, pero el pool no está conectado.");
        throw new Error("El pool de conexiones no está disponible.");
    }
    return pool;
};