import logger from '../helpers/logger.js';
// Importamos las funciones específicas del módulo de Unidigital
import { getLastDocument } from '../modules/uni_mod.js';
import { getUnidigitalSeries, getUnidigitalTemplates } from '../helpers/unidigital_auth.js';




/**
 * Controlador para obtener la lista de series de Unidigital desde la caché.
 */
export const getAvailableSeries = async (req, res) => {
    try {
        logger.info('Recibida solicitud para obtener series de Unidigital.');

        // Llama a la nueva función del módulo que obtiene los datos de la caché.
        const seriesList = await getUnidigitalSeries();
        const templatesList = await getUnidigitalTemplates();

        res.status(200).json({
            message: "Series obtenidas exitosamente desde la caché.",
            series: seriesList,
            templates: templatesList
        });

    } catch (error) {
        logger.error(`Error en getAvailableSeries: ${error.message}`);
        res.status(500).json({ 'message': error.message });
    }
};

/**
 * Controlador para consultar el último documento de Unidigital.
 * Espera { serieStrongId: "...", documentType: "..." } en el cuerpo de la solicitud.
 */
export const getLastUnidigitalDocument = async (req, res) => {
    try {
        const { serieStrongId, documentType } = req.body;

        // Validación de los parámetros de entrada
        if (!serieStrongId || !documentType) {
            throw new Error("Los parámetros 'serieStrongId' y 'documentType' son requeridos.");
        }

        logger.info(`Recibida solicitud para consultar último documento Unidigital: Serie ${serieStrongId}, Tipo ${documentType}`);

        // Llama a la función del módulo que contiene la lógica de la API
        const lastDocument = await getLastDocument(serieStrongId, documentType);

        // Envía la respuesta exitosa
        res.status(200).json({
            message: "Último documento consultado exitosamente.",
            document: lastDocument
        });

    } catch (error) {
        // Manejo de errores
        logger.error(`Error en getLastUnidigitalDocument: ${error.message}`);
        res.status(500).json({ 'message': error.message });
    }
};



