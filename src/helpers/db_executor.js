import { getPool } from '../db/db.js';
import logger from './logger.js';

/**
 * Ejecuta un Stored Procedure de forma segura y parametrizada.
 * @param {string} spName - El nombre del Stored Procedure a ejecutar.
 * @param {Array<{name: string, type: any, value: any, output?: boolean}>} params - Un array de objetos de parámetros.
 * @returns {Promise<{recordset: Array<any>, output: Object}>} El recordset y los parámetros de salida.
 */
export const executeStoredProcedure = async (spName, params = []) => {
    try {
        const pool = getPool();
        const request = pool.request();

        // Añadir parámetros a la solicitud de forma segura
        params.forEach(param => {
            if (param.output) {
                request.output(param.name, param.type, param.value); // Manejo de parámetros de salida
            } else {
                request.input(param.name, param.type, param.value); // Manejo de parámetros de entrada
            }
        });

        logger.debug(`Ejecutando SP: ${spName} con parámetros: ${JSON.stringify(params)}`);
        const result = await request.execute(spName);

        return {
            recordset: result.recordset,
            output: result.output // Devuelve los parámetros de salida
        };

    } catch (error) {
        logger.error(`Error al ejecutar el Stored Procedure '${spName}': ${error.message}`);
        throw new Error(`Error en la base de datos al ejecutar ${spName}.`);
    }
};