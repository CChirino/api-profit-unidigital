import sql from "mssql";

import logger from "../helpers/logger.js";

import { executeStoredProcedure } from "../helpers/db_executor.js";

//import { getPool } from "../db/db.js";



/**

 * (PREVISUALIZACIÓN) Obtiene documentos de venta pendientes que no están en ningún lote.

 * Llama a sp_GetDocumentosVentaParaProcesar.

 */

export const getDocumentosVenta = async (fechaHasta, options = {}) => {

    const { tiposDoc = 'FACT,N/CR,N/DB', pageNumber = 1, pageSize = null, firstDocFact = process.env.FIRST_DOC_NUMBER_FACT,

        firstDocNcr = process.env.FIRST_DOC_NUMBER_NCR, firstDocNdb = process.env.FIRST_DOC_NUMBER_NDB } = options;

    try {

        const params = [

            { name: 'fechaHasta', type: sql.DateTime, value: fechaHasta },

            { name: 'tiposDoc', type: sql.VarChar(100), value: tiposDoc },

            { name: 'PageNumber', type: sql.Int, value: pageNumber },

            { name: 'PageSize', type: sql.Int, value: pageSize },

            { name: 'FirstDocNumber_FACT', type: sql.VarChar(20), value: firstDocFact },

            { name: 'FirstDocNumber_NCR', type: sql.VarChar(20), value: firstDocNcr },

            { name: 'FirstDocNumber_NDB', type: sql.VarChar(20), value: firstDocNdb },

        ];

        const documentos = await executeStoredProcedure('sp_GetDocumentosVentaParaProcesar', params);

        return documentos || [];

    } catch (err) {

        logger.error(`Error en getDocumentosVenta: ${err.message}`);

        throw err;

    }

};



/**

 * (PROCESAMIENTO) Marca un conjunto de documentos pendientes con un ID de lote específico.

 * Llama a sp_MarkDocumentsForProcessing.

 */



export const markDocumentsWithBatchId = async (

    batchId,

    fechaHasta = new Date(),

    // tiposDoc = 'FACT,N/CR,N/DB',

    //TODO: Cambiar de nuevo a FACT,N/CR,N/DB

    tiposDoc = 'FACT,N/CR,N/DB',

    firstDocFact = process.env.FIRST_DOC_NUMBER_FACT,

    firstDocNcr = process.env.FIRST_DOC_NUMBER_NCR,

    firstDocNdb = process.env.FIRST_DOC_NUMBER_NDB

) => {

    try {

        const params = [

            { name: 'BatchId', type: sql.VarChar(50), value: batchId },

            { name: 'fechaHasta', type: sql.DateTime, value: fechaHasta },

            { name: 'tiposDoc', type: sql.VarChar(100), value: tiposDoc },

            { name: 'FirstDocNumber_FACT', type: sql.VarChar(20), value: firstDocFact },

            { name: 'FirstDocNumber_NCR', type: sql.VarChar(20), value: firstDocNcr },

            { name: 'FirstDocNumber_NDB', type: sql.VarChar(20), value: firstDocNdb },

            { name: 'MarkedCount', type: sql.Int, value: 0, output: true }

        ];

        const result = await executeStoredProcedure('sp_MarkDocumentsForProcessing', params);

        const markedCount = result.output?.MarkedCount || 0;

        logger.info(`${markedCount} documentos han sido marcados con el BatchID: ${batchId}`);

        return markedCount;

    } catch (err) {

        logger.error(`Error al marcar documentos con BatchID ${batchId}: ${err.message}`);

        throw err;

    }

};



/**

 * (PROCESAMIENTO) Obtiene un sub-lote de documentos que pertenecen a un lote específico.

 * Llama a sp_GetDocumentsByBatch.

 */

export const getDocumentsByBatch = async (batchId, pageSize) => {

    try {

        const params = [

            { name: 'BatchId', type: sql.VarChar(50), value: batchId },

            { name: 'PageSize', type: sql.Int, value: pageSize }

        ];

        const documentos = await executeStoredProcedure('sp_GetDocumentsByBatch', params);

        logger.debug(`Documentos obtenidos para BatchID ${batchId}: ${JSON.stringify(documentos)}`);

        return documentos.recordset || [];

    } catch (err) {

        logger.error(`Error al obtener documentos para el BatchID ${batchId}: ${err.message}`);

        throw err;

    }

};



/**

 * (PROCESAMIENTO) Actualiza los campos de estado de un documento en Profit.

 * Llama a sp_UpdateDocumentStatus.

 */

export const updateDocumentStatus = async (docNum, docType, documentId, batchId) => {

    try {

        const params = [

            { name: 'nro_doc', type: sql.VarChar(20), value: docNum },

            { name: 'co_tipo_doc', type: sql.VarChar(10), value: docType },

            { name: 'documentId', type: sql.VarChar(50), value: documentId },

            { name: 'batchId', type: sql.VarChar(50), value: batchId }

        ];

        await executeStoredProcedure('sp_UpdateDocumentStatus', params);

        logger.debug(`Documento ${docType}-${docNum} actualizado: DocID=${documentId}, BatchID=${batchId}`);

    } catch (err) {

        logger.error(`Error al actualizar el estado del documento ${docType}-${docNum}: ${err.message}`);

        throw err;

    }

};



/**

 * (PROCESAMIENTO) Obtiene los renglones (detalles) de un documento específico.

 * Llama a sp_GetDocumentRenglones.

 * @param {string} docNum - El número del documento.

 * @param {string} docType - El tipo del documento.

 * @returns {Promise<Array<any>>} Un array con los renglones del documento.

 */

export const getDocumentRenglones = async (docNum, docType) => {

    try {

        const params = [

            { name: 'nro_doc', type: sql.VarChar(20), value: docNum },

            { name: 'co_tipo_doc', type: sql.VarChar(10), value: docType }

        ];

        const renglones = await executeStoredProcedure('sp_GetDocumentRenglones', params);

        return renglones?.recordset || [];

    } catch (err) {

        logger.error(`Error al obtener renglones para ${docType}-${docNum}: ${err.message}`);

        throw err;

    }

};



/**

 * (LOGGING) Crea una nueva entrada en la tabla de registro de lotes.

 * Llama a sp_CreateBatchLogEntry.

 * @param {object} logData - Objeto con los datos del lote a registrar.

 */

export const createBatchLogEntry = async (logData) => {

    try {

        const params = [

            { name: 'BatchStrongId', type: sql.VarChar(50), value: logData.batchId },

            { name: 'SerieStrongId', type: sql.VarChar(50), value: logData.serieId },

            { name: 'CreatedBy', type: sql.VarChar(100), value: logData.createdBy },

            { name: 'DateFrom', type: sql.DateTime, value: logData.dateFrom },

            { name: 'DateTo', type: sql.DateTime, value: logData.dateTo },

            { name: 'DocType', type: sql.VarChar(10), value: logData.docType },

            { name: 'FirstDocNumber', type: sql.VarChar(20), value: logData.firstDoc },

            { name: 'LastDocNumber', type: sql.VarChar(20), value: logData.lastDoc },

            { name: 'TotalDocuments', type: sql.Int, value: logData.totalDocs }

        ];

        await executeStoredProcedure('sp_CreateBatchLogEntry', params);

        logger.info(`Registro de lote creado en UnidigitalBatchLog para BatchID: ${logData.batchId}`);

    } catch (err) {

        logger.error(`Error al crear el registro de lote para BatchID ${logData.batchId}: ${err.message}`);

        // No relanzamos el error para no detener el flujo principal si solo falla el log.

    }

};



/**

 * (LOGGING) Actualiza el estado de un registro de lote existente.

 * Llama a sp_UpdateBatchLogStatus.

 * @param {string} batchId - El StrongId del lote a actualizar.

 * @param {number} newStatus - El nuevo código de estado.

 * @param {object} options - Opciones adicionales como contadores y mensajes de error.

 */

export const updateBatchLogStatus = async (batchId, newStatus, options = {}) => {

    try {

        const { processedCount = null, failedCount = null, errorMessage = null } = options;

        const params = [

            { name: 'BatchStrongId', type: sql.VarChar(50), value: batchId },

            { name: 'NewStatus', type: sql.Int, value: newStatus },

            { name: 'ProcessedCount', type: sql.Int, value: processedCount },

            { name: 'FailedCount', type: sql.Int, value: failedCount },

            { name: 'ErrorMessage', type: sql.NVarChar(sql.MAX), value: errorMessage }

        ];

        await executeStoredProcedure('sp_UpdateBatchLogStatus', params);

        logger.info(`Registro de lote actualizado en UnidigitalBatchLog para BatchID: ${batchId}. Nuevo estado: ${newStatus}`);

    } catch (err) {

        logger.error(`Error al actualizar el registro de lote para BatchID ${batchId}: ${err.message}`);

        // No relanzamos el error.

    }

};



/**

 * (LOGGING) Obtiene una lista paginada de los registros de lotes.

 * Llama a sp_GetBatchLogs.

 * @param {number} pageNumber - El número de página a obtener.

 * @param {number} pageSize - El tamaño de la página.

 * @returns {Promise<Array<any>>} Un array con los registros del log.

 */

export const getBatchLogs = async (pageNumber = 1, pageSize = 25) => {

    try {

        const params = [

            { name: 'PageNumber', type: sql.Int, value: pageNumber },

            { name: 'PageSize', type: sql.Int, value: pageSize }

        ];

        const logs = await executeStoredProcedure('sp_GetBatchLogs', params);

        return logs || [];

    } catch (err) {

        logger.error(`Error al obtener los logs de lotes: ${err.message}`);

        throw err; // Relanzamos el error para que el controlador lo maneje.

    }

};



/**

 * (LOGGING) Aprueba un lote en la tabla de registro local.

 * Llama a sp_ApproveBatchLog.

 * @param {string} batchId - El StrongId del lote a aprobar.

 * @returns {Promise<number>} El número de filas afectadas (1 si tuvo éxito, 0 si no).

 */

export const approveBatchInDb = async (batchId) => {

    try {

        const params = [{ name: 'BatchStrongId', type: sql.VarChar(50), value: batchId }];

        const result = await executeStoredProcedure('sp_ApproveBatchLog', params);

        return result[0]?.ApprovedCount || 0;

    } catch (err) {

        logger.error(`Error al aprobar el lote ${batchId} en la BD local: ${err.message}`);

        throw err;

    }

};



/**

 * (LOGGING) Cancela un lote en la tabla de registro local.

 * Llama a sp_CancelBatchLog.

 * @param {string} batchId - El StrongId del lote a cancelar.

 * @param {string} reason - El motivo de la cancelación.

 * @returns {Promise<number>} El número de filas afectadas (1 si tuvo éxito, 0 si no).

 */

export const cancelBatchInDb = async (batchId, reason) => {

    try {

        const params = [

            { name: 'BatchStrongId', type: sql.VarChar(50), value: batchId },

            { name: 'Reason', type: sql.NVarChar(sql.MAX), value: reason }

        ];

        const result = await executeStoredProcedure('sp_CancelBatchLog', params);

        return result[0]?.CanceledCount || 0;

    } catch (err) {

        logger.error(`Error al cancelar el lote ${batchId} en la BD local: ${err.message}`);

        throw err;

    }

};



/**

 * (LOGGING) Marca un lote como "Asignado" (4) en la tabla de registro local.

 * Llama a sp_AssignBatchLog.

 * @param {string} batchId - El StrongId del lote.

 */

export const assignBatchInDb = async (batchId) => {

    try {

        const params = [{ name: 'BatchStrongId', type: sql.VarChar(50), value: batchId }];

        await executeStoredProcedure('sp_AssignBatchLog', params);

    } catch (err) {

        logger.error(`Error al marcar el lote ${batchId} como asignado en la BD: ${err.message}`);

        throw err;

    }

};



/**

 * Actualiza el número de control de un documento en las tablas de Profit.

 * Llama a sp_UpdateDocumentControlNumber.

 * @param {string} docNum - El número del documento.

 * @param {string} controlNum - El nuevo número de control fiscal.

 * @param {string} docType - El tipo de documento (ej. 'FA').

 */

export const updateControlNumberInDb = async (docNum, controlNum, docType) => {

    try {

        const params = [

            { name: 'DocumentNumber', type: sql.VarChar(20), value: docNum },

            { name: 'ControlNumber', type: sql.VarChar(20), value: controlNum },

            { name: 'DocumentType', type: sql.VarChar(10), value: docType }

        ];

        await executeStoredProcedure('sp_UpdateDocumentControlNumber', params);

    } catch (err) {

        logger.error(`Error al actualizar n_control para doc ${docNum}: ${err.message}`);

        // No relanzamos el error para permitir que el bucle continúe si un solo doc falla.

    }

};



/**

 * Obtiene una lista de los documentos que pertenecen a un lote específico.

 * Llama a sp_GetDocumentsByBatchId.

 * @param {string} batchId - El StrongId del lote a consultar.

 * @returns {Promise<Array<any>>} Un array con los detalles de los documentos del lote.

 */

export const getDocumentsByBatchId = async (batchId) => {

    try {

        const params = [{ name: 'BatchId', type: sql.VarChar(50), value: batchId }];

        const documents = await executeStoredProcedure('sp_GetDocumentsByBatchId', params);

        return documents || [];

    } catch (err) {

        logger.error(`Error al obtener los documentos para el lote ${batchId}: ${err.message}`);

        throw err; // Relanzamos para que el controlador lo maneje.

    }

};





/**

 * (PROCESAMIENTO) Desmarca los documentos asociados a un BatchId.

 * Llama a sp_UnmarkDocumentsByBatchId.

 * @param {string} batchId - El BatchId del lote a desmarcar.

 */

export const unmarkDocumentsByBatchId = async (batchId) => {

    try {

        const params = [

            { name: 'BatchId', type: sql.VarChar(50), value: batchId }

        ];

        await executeStoredProcedure('sp_UnmarkDocumentsByBatchId', params);

        logger.info(`Documentos desmarcados para el BatchID: ${batchId}`);

    } catch (err) {

        logger.error(`Error al desmarcar documentos para el BatchID ${batchId}: ${err.message}`);

        throw err;

    }

};



/**

 * (LOGGING) Obtiene el lote abierto (CurrentStatus = 1) para una serie.

 * Llama a sp_GetOpenBatchBySerie.

 * @param {string} serieStrongId - El StrongId de la serie.

 * @returns {Promise<object|null>} El lote abierto o null si no existe.

 */

export const getOpenBatchBySerie = async (serieStrongId) => {

    try {

        const params = [

            { name: 'SerieStrongId', type: sql.VarChar(50), value: serieStrongId }

        ];

        const result = await executeStoredProcedure('sp_GetOpenBatchBySerie', params);

        // El SP retorna un solo registro (el más reciente) o ninguno

        return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;

    } catch (err) {

        logger.error(`Error al obtener lote abierto para la serie ${serieStrongId}: ${err.message}`);

        throw err;

    }

};



/**

 * (PROCESAMIENTO) Busca el ID del primer lote que contenga al menos un documento marcado como 'FALLIDO-ENVIO'.

 * Llama a sp_GetFirstFailedBatch.

 * @returns {Promise<string|null>} El ID del lote si se encuentra, de lo contrario null.

 */

export const getFirstFailedBatchId = async () => {

    try {

        // No se necesitan parámetros para este SP

        const result = await executeStoredProcedure('sp_GetFirstFailedBatch');



        // El SP devuelve el primer BatchId que encuentra o un conjunto de resultados vacío.

        // Verificamos si el recordset existe y tiene al menos una fila.

        if (result.recordset && result.recordset.length > 0) {

            // Devolvemos el BatchId de la primera (y única) fila.

            return result.recordset[0].BatchId;

        }



        // Si no se encuentra ningún lote fallido, devolvemos null.

        return null;

    } catch (err) {

        logger.error(`Error al obtener el primer lote fallido: ${err.message}`);

        throw err; // Relanzamos el error para que el controlador lo maneje.

    }

};



/**

 * Cuenta la cantidad de documentos en un lote que se consideran fallidos.

 * Un documento se considera fallido si su campo7 es nulo o no parece un StrongId (longitud < 30).

 * @param {string} batchId - El ID del lote (almacenado en campo8) a verificar.

 * @returns {Promise<number>} El número de documentos fallidos.

 */

export const countFailedDocumentsInBatch = async (batchId) => {

    try {

        const params = [

            { name: 'BatchId', type: sql.NVarChar(50), value: batchId }

        ];

        const result = await executeStoredProcedure('sp_CountFailedDocumentsInBatch', params);



        // El resultado será un array con un objeto, ej: [{ FailedCount: 5 }]

        if (result && result.length > 0) {

            return result[0].FailedCount;

        }

        return 0; // Si no hay resultados, no hay fallos.

    } catch (error) {

        logger.error(`Error en countFailedDocumentsInBatch para el lote ${batchId}: ${error.message}`);

        throw error; // Propagar el error para que el flujo principal lo maneje.

    }

};



/**

 * (PROCESAMIENTO-REINTENTO) Obtiene TODOS los documentos de un lote, sin paginación.

 * Usado exclusivamente por el flujo de reintento para poder filtrar en memoria.

 * Llama a sp_GetAllDocumentsForRetry.

 * @param {string} batchId - El ID del lote a obtener.

 * @returns {Promise<Array<Object>>} Un array con todos los documentos del lote.

 */

export const getAllDocumentsForRetry = async (batchId) => {

    try {

        const params = [{ name: 'BatchId', type: sql.VarChar(50), value: batchId }];

        const result = await executeStoredProcedure('sp_GetAllDocumentsForRetry', params);

        // --- INICIO DE LA CORRECCIÓN ---

        // Devolvemos el array de documentos (recordset) o un array vacío si no hay nada.

        return result?.recordset || [];

        // --- FIN DE LA CORRECCIÓN ---

    } catch (error) {

        logger.error(`Error en getAllDocumentsForRetry para el lote ${batchId}: ${error.message}`);

        throw error;

    }

};

/**
 * (LOGGING) Elimina un lote huérfano (prefijo FAIL-) de la tabla de registro local.
 * Solo permite eliminar lotes que empiecen con 'FAIL-'.
 * @param {string} batchId - El StrongId del lote a eliminar.
 * @returns {Promise<number>} El número de filas afectadas (1 si tuvo éxito, 0 si no).
 */
export const deleteOrphanBatchFromDb = async (batchId) => {
    try {
        // Validar que solo se eliminen lotes huérfanos
        if (!batchId.startsWith('FAIL-')) {
            throw new Error('Solo se pueden eliminar lotes con prefijo FAIL-');
        }

        const params = [
            { name: 'BatchStrongId', type: sql.VarChar(50), value: batchId }
        ];
        const result = await executeStoredProcedure('sp_DeleteOrphanBatchLog', params);
        return result.recordset?.[0]?.DeletedCount || result[0]?.DeletedCount || 0;
    } catch (err) {
        logger.error(`Error al eliminar el lote huérfano ${batchId} de la BD local: ${err.message}`);
        throw err;
    }
};

/**
 * (MANTENIMIENTO) Limpia los campos campo7 y campo8 de documentos en un rango de números.
 * Esto permite que los documentos puedan ser reprocesados.
 * @param {string} docType - Tipo de documento ('FACT', 'N/CR', 'N/DB').
 * @param {string} fromDoc - Número de documento inicial (inclusive).
 * @param {string} toDoc - Número de documento final (inclusive).
 * @returns {Promise<number>} Cantidad de documentos limpiados.
 */
export const clearDocumentsByRange = async (docType, fromDoc, toDoc) => {
    try {
        const params = [
            { name: 'DocType', type: sql.VarChar(10), value: docType },
            { name: 'FromDoc', type: sql.VarChar(20), value: fromDoc },
            { name: 'ToDoc', type: sql.VarChar(20), value: toDoc },
            { name: 'ClearedCount', type: sql.Int, value: 0, output: true }
        ];
        const result = await executeStoredProcedure('sp_ClearDocumentsByRange', params);
        const clearedCount = result.output?.ClearedCount || 0;
        logger.info(`${clearedCount} documentos limpiados (tipo: ${docType}, rango: ${fromDoc} - ${toDoc})`);
        return clearedCount;
    } catch (err) {
        logger.error(`Error al limpiar documentos (tipo: ${docType}, rango: ${fromDoc} - ${toDoc}): ${err.message}`);
        throw err;
    }
};