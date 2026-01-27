import { getBatchLogs } from '../modules/profit9_mod.js';
import logger from '../helpers/logger.js';

export const listBatchLogs = async (req, res) => {
    try {
        // Obtenemos los parámetros de paginación de la query string, con valores por defecto.
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;

        const logs = await getBatchLogs(page, limit);

        res.status(200).json({
            message: "Logs de lotes obtenidos exitosamente.",
            data: logs
        });
    } catch (error) {
        logger.error(`Error en el controlador listBatchLogs: ${error.message}`);
        res.status(500).json({ message: "Error interno del servidor al obtener los logs." });
    }
};