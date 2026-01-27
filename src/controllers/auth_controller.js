import { genToken } from "../helpers/token_manager.js";
import logger from "../helpers/logger.js";
import crypto from 'crypto'; // Importamos el módulo crypto

export const index = async (req, res) => {
    // ...existing code...
    res.status(200).json({"ok" : "200"})
    console.log("ok");
};

export const login = (req, res) => {   
    try {
        const { user, pass } = req.body;

        if (!user || !pass) {
            throw new Error('Usuario y contraseña son requeridos.');
        }

        const apiUser = process.env.API_USER;
        const storedSalt = process.env.API_PASSWORD_SALT;
        const storedHash = process.env.API_PASSWORD_HASH;

        // 1. Verificar el usuario
        if (user !== apiUser) {
            logger.warn(`Intento de login fallido para el usuario: ${user}`);
            throw new Error('Credenciales inválidas.');
        }

        // 2. Calcular el hash de la contraseña recibida usando la sal almacenada
        const incomingHash = crypto.createHmac('sha512', storedSalt).update(pass).digest('hex');

        // 3. Comparar los hashes de forma segura (previene ataques de tiempo)
        const hashesMatch = crypto.timingSafeEqual(Buffer.from(incomingHash), Buffer.from(storedHash));

        if (!hashesMatch) {
            logger.warn(`Intento de login con contraseña incorrecta para el usuario: ${user}`);
            throw new Error('Credenciales inválidas.');
        }
        
        logger.info(`Login exitoso para el usuario: ${user}`);
        const token = genToken(user);

        res.status(200).json({
            "validate": true,
            "usuario": { "user": user },
            "auth": token
        });
        
    } catch (err) {
        logger.error(`Error en el login: ${err.message}`);
        res.status(401).json({
            "validate": false,
            "msg": err.message
        });
    }
};