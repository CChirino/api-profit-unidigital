// Importamos la función que nos da una instancia de API ya autenticada
import { createUnidigitalApiInstance } from '../helpers/unidigital_auth.js';
import logger from '../helpers/logger.js';



/**
 * Consulta el último documento de un tipo específico para una serie dada.
 * @param {string} serieStrongId - El StrongId de la serie a consultar.
 * @param {string} documentType - El tipo de documento (ej. "FA" para factura).
 * @returns {Promise<object>} La respuesta de la API con los datos del último documento.
 * @throws {Error} Si la llamada a la API falla.
 */
export const getLastDocument = async (serieStrongId, documentType) => {
    logger.info(`Consultando último documento tipo '${documentType}' para la serie: ${serieStrongId}`);
    try {
        // 1. Obtiene la instancia de la API ya autenticada.
        const api = await createUnidigitalApiInstance();

        // 2. Realiza la llamada POST al endpoint específico.
        const response = await api.post('/documents/last', {
            Serie: serieStrongId,
            Type: documentType
        });

        logger.info('Último documento consultado exitosamente.', response.data);
        
        // 3. Devuelve los datos del documento.
        return response.data;

    } catch (error) {
        // Captura y registra cualquier error.
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Error al consultar el último documento: ${errorMessage}`);
        
        // Re-lanza el error.
        throw new Error(`Fallo al consultar el último documento: ${errorMessage}`);
    }
};

/**
 * Crea un nuevo ciclo de facturación (batch) en la API de Unidigital.
 * @param {string} serieStrongId - El StrongId de la serie para la cual se abrirá el ciclo.
 * @returns {Promise<object>} La respuesta de la API con los datos del batch creado.
 * @throws {Error} Si la llamada a la API falla.
 */
export const createBatch = async (serieStrongId) => {
    logger.info(`Iniciando creación de batch para la serie: ${serieStrongId}`);
    try {
        // 1. Obtiene la instancia de la API ya autenticada.
        // Esto maneja el login, la expiración del token, etc., de forma transparente.
        const api = await createUnidigitalApiInstance();

        // 2. Realiza la llamada POST al endpoint específico para abrir el batch.
        const response = await api.post('/batch/open', {
            SerieStrongId: serieStrongId
        });

        logger.info(`Batch ${response.data.result} creado exitosamente en Unidigital.`, response.data.result);
        
        // 3. Devuelve los datos del batch creado (incluyendo su ID, estado, etc.).
        return {strongId : response.data.result};

    } catch (error) {
        // Captura y registra cualquier error que ocurra durante el proceso.
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Error al crear el batch en Unidigital: ${errorMessage}`);
        
        // Re-lanza el error para que el código que llama a esta función sepa que algo salió mal.
        throw new Error(`Fallo al crear el batch: ${errorMessage}`);
    }
};


/**
 * Envía un lote de documentos completos (con detalles) a la API de Unidigital.
 * @param {Array<object>} documents - Un array de objetos de documento, cada uno con sus detalles.
 * @param {string} batchStrongId - El StrongId del lote en el que se incluirán.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const createDocuments = async (documents, batchStrongId) => {
    logger.info(`Enviando ${documents.length} documentos al lote ${batchStrongId}`);
    try {
        const api = await createUnidigitalApiInstance();

        const payload = {
            BatchStrongId: batchStrongId,
            Docs: documents // El array de documentos ya formateados
        };
        logger.debug('Payload enviado a Unidigital: ' + JSON.stringify(payload, null, 2));
        // Usamos el endpoint correcto que mencionaste
        const response = await api.post('/documents/create', payload); 
        
        logger.info(`Lote de documentos enviado. Respuesta de Unidigital recibida.`);
        return response.data;

    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
        logger.error(`Error al enviar el lote de documentos: ${errorMessage}`);
        throw new Error(`Fallo al enviar lote de documentos: ${errorMessage}`);
    }
};


/**
 * Cierra un lote en la API de Unidigital.
 * @param {string} batchId - El StrongId del lote a cerrar.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const closeBatch = async (batchId) => {
    try {
        logger.info(`Cerrando lote ${batchId} en Unidigital.`);
        const api = await createUnidigitalApiInstance();
        const response = await api.post('/batch/close', { Id: batchId });
        logger.info(`Lote ${batchId} cerrado exitosamente en Unidigital.`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Error al cerrar el lote ${batchId} en Unidigital: ${errorMessage}`);
        // No relanzamos el error, es una acción final. El log es suficiente.
        throw new Error(`Fallo al cerrar el lote en Unidigital: ${errorMessage}`);
    }
};

/**
 * Cancela un lote en la API de Unidigital.
 * @param {string} batchId - El StrongId del lote a cancelar.
 * @param {string} reason - La razón o mensaje de error para la cancelación.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const cancelBatch = async (batchId, reason) => {
    try {
        logger.warn(`Cancelando lote ${batchId} en Unidigital por: ${reason}`);
        const api = await createUnidigitalApiInstance();
        const response = await api.post('/batch/cancel', { Id: batchId });
        logger.info(`Lote ${batchId} cancelado exitosamente en Unidigital.`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Error al intentar cancelar el lote ${batchId} en Unidigital: ${errorMessage}`);
        // PROPAGAR ERROR para que el caller pueda reaccionar
        throw new Error(`Fallo al cancelar el lote en Unidigital: ${errorMessage}`);
    }
};

/**
 * Aprueba un lote en la API de Unidigital.
 * @param {string} batchId - El StrongId del lote a aprobar.
 * @returns {Promise<object>} La respuesta de la API.
 */
export const approveBatch = async (batchId) => {
    logger.info(`Aprobando lote ${batchId} en Unidigital.`);
    const api = await createUnidigitalApiInstance();
    const response = await api.post('/batch/approve', { Id: batchId });
    logger.info(`Lote ${batchId} aprobado exitosamente en Unidigital.`);
    return response.data;
};

/**
 * Obtiene los detalles y el estado de un lote específico desde Unidigital.
 * Incluye manejo de errores para lotes no encontrados (404).
 * @param {string} batchId - El StrongId del lote a consultar.
 * @returns {Promise<object>} La respuesta de la API con los detalles del lote.
 */
export const getBatchDetails = async (batchId) => {
    logger.info(`Consultando detalles del lote ${batchId} en Unidigital.`);
    try {
        const api = await createUnidigitalApiInstance();
        // Usamos el endpoint GET /batch/{id} que ya estaba definido
        const response = await api.get(`/batch/${batchId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Error al obtener detalles del lote ${batchId} de Unidigital: ${errorMessage}`);

        // ¡Esta es la parte clave! Si el error es un 404 (No Encontrado),
        // no lanzamos una excepción. En su lugar, devolvemos un objeto que simula
        // un lote "cerrado" para que nuestra lógica de reintento pueda manejarlo.
        if (error.response && error.response.status === 404) {
            logger.warn(`El lote ${batchId} no fue encontrado en Unidigital. Será tratado como un lote cerrado.`);
            return { result: { currentStatus: -1 } }; // Retornamos un estado inválido a propósito.
        }

        // Para cualquier otro error, sí lanzamos la excepción.
        throw error;
    }
};

/**
 * Descarga una página de documentos con sus controles fiscales de un lote.
 * @param {string} batchId - El StrongId del lote.
 * @param {number} pageNumber - El número de página a descargar.
 * @param {number} pageSize - El tamaño de la página.
 * @returns {Promise<object>} La respuesta de la API con la lista de documentos.
 */
export const getBatchDocuments = async (batchId, pageNumber, pageSize) => {
    logger.info(`Descargando página ${pageNumber} de documentos para el lote ${batchId}.`);
    const api = await createUnidigitalApiInstance();
    const response = await api.get(`/batch/${batchId}/documents`, {
        params: {
            Number: pageNumber,
            Size: pageSize
        }
    });
    return response.data;
};

export async function closeAndCancelBatch(batchId, options = {}) {
    // options: { reason, retries, retryDelayMs }
    const reason = options.reason || 'closeAndCancelBatch invoked';
    const retries = Number.isInteger(options.retries) ? options.retries : 3;
    const retryDelayMs = options.retryDelayMs || 1000;

    logger.info(`Inicio closeAndCancelBatch for ${batchId} (reason: ${reason})`);

    // 1) Obtener estado actual
    let details;
    try {
        details = await getBatchDetails(batchId);
    } catch (err) {
        logger.warn(`No se pudieron obtener detalles previos del batch ${batchId}: ${err.message}`);
        details = null;
    }
    const currentStatus = details?.result?.currentStatus;
    logger.info(`Estado actual Unidigital(${batchId}) = ${currentStatus ?? 'N/D'}`);

    // Si ya está cancelado (5), no hay nada que hacer en Unidigital
    if (currentStatus === 5) {
        logger.info(`Batch ${batchId} ya está cancelado en Unidigital (status 5). No se requiere acción.`);
        return { batchId, finalStatus: 5, cancelled: true, alreadyCancelled: true };
    }

    // 2) Si está Abierto (1) intentar CLOSE
    if (currentStatus === 1) {
        try {
            console.log(`****** Intentando CLOSE en Unidigital para ${batchId} ******`);
            logger.info(`Intentando CLOSE en Unidigital para ${batchId}`);
            await closeBatch(batchId);
            logger.info(`CLOSE exitoso en Unidigital para ${batchId}`);
        } catch (closeErr) {
            logger.warn(`Fallo al CLOSE en Unidigital para ${batchId}: ${closeErr.message}`);
            // continuar para intentar CANCEL aunque el close haya fallado
        }
    } else {
        logger.info(`No se requiere CLOSE para ${batchId} (estado ${currentStatus}).`);
    }

    // 3) Reconsultar estado después de CLOSE
    try {
        details = await getBatchDetails(batchId);
    } catch (err) {
        logger.warn(`No se pudo reconsultar detalles tras CLOSE para ${batchId}: ${err.message}`);
        details = null;
    }
    const statusAfterClose = details?.result?.currentStatus;
    logger.info(`Estado tras intento CLOSE Unidigital(${batchId}) = ${statusAfterClose ?? 'N/D'}`);

    // 4) Si no está en estado 'Closed' (2) o sigue impidiendo operaciones, intentar CANCEL con reintentos
    let lastCancelError = null;
    if (statusAfterClose !== 2) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                logger.info(`Intento ${attempt}/${retries} de CANCEL en Unidigital para ${batchId}`);
                await cancelBatch(batchId, reason);
                logger.info(`CANCEL exitoso en Unidigital para ${batchId} (intento ${attempt})`);
                lastCancelError = null;
                break;
            } catch (cancelErr) {
                lastCancelError = cancelErr;
                logger.warn(`Fallo CANCEL attempt ${attempt} para ${batchId}: ${cancelErr.message}`);
                if (attempt < retries) {
                    await new Promise(r => setTimeout(r, retryDelayMs));
                }
            }
        }
        if (lastCancelError) {
            logger.error(`No se pudo cancelar el batch ${batchId} en Unidigital después de ${retries} intentos: ${lastCancelError.message}`);
            throw lastCancelError;
        }
    } else {
        // Si ya está cerrado (2), aún intentamos cancelar una vez para liberar recursos en Unidigital
        try {
            logger.info(`Batch ${batchId} está cerrado en Unidigital; intentando CANCEL forzado para liberar recursos.`);
            await cancelBatch(batchId, reason);
            logger.info(`CANCEL forzado exitoso en Unidigital para ${batchId}`);
        } catch (cancelErr2) {
            logger.warn(`Fallo al cancelar batch cerrado ${batchId}: ${cancelErr2.message}`);
            // no forzamos fallo total; pero lo devolvemos como warning
            lastCancelError = cancelErr2;
        }
    }

    // 5) Validar estado final
    try {
        details = await getBatchDetails(batchId);
    } catch (err) {
        logger.warn(`No se pudieron obtener detalles finales del batch ${batchId}: ${err.message}`);
        details = null;
    }
    const finalStatus = details?.result?.currentStatus;
    logger.info(`Estado final Unidigital(${batchId}) = ${finalStatus ?? 'N/D'}`);

    // Considerar como éxito si finalStatus indica no-abierto o cancelado (no 1)
    if (finalStatus === 1) {
        throw new Error(`Después de CLOSE/CANCEL el batch ${batchId} sigue en estado Abierto en Unidigital.`);
    }

    logger.info(`closeAndCancelBatch completado para ${batchId}. Estado final: ${finalStatus ?? 'N/D'}`);
    return { batchId, finalStatus, cancelled: finalStatus !== 2 && finalStatus !== 1 };
}

