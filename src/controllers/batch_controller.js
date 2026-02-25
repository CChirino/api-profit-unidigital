import { approveBatchInDb, cancelBatchInDb, assignBatchInDb, updateControlNumberInDb, getDocumentsByBatchId, deleteOrphanBatchFromDb, clearDocumentsByRange  } from '../modules/profit9_mod.js';
import { approveBatch, closeAndCancelBatch, getBatchDetails, getBatchDocuments} from '../modules/uni_mod.js';
import logger from '../helpers/logger.js';

export const approveBatchController = async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Llamamos a la API de Unidigital PRIMERO.
        // Si esto falla, la excepción se captura y el proceso se detiene.
        await approveBatch(id);

        // 2. Si la llamada a la API fue exitosa, actualizamos nuestro log local.
        await approveBatchInDb(id);

        res.status(200).json({ message: `Lote ${id} aprobado exitosamente.` });

    } catch (error) {
        // Este bloque ahora captura errores tanto de la API de Unidigital como de nuestra BD.
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Fallo en el proceso de aprobación para el lote ${id}: ${errorMessage}`);
        
        // Si la API de Unidigital falla, el usuario recibe el mensaje de error de la API.
        // Si nuestra BD falla después de una API exitosa, el log lo registrará y el usuario verá un error genérico.
        res.status(error.response?.status || 500).json({ 
            message: "Error al aprobar el lote.", 
            error: errorMessage 
        });
    }
};

export const cancelBatchController = async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
        return res.status(400).json({ message: "El campo 'reason' es requerido en el cuerpo de la solicitud." });
    }

    try {
        // Detectar lotes huérfanos (prefijo FAIL-) que nunca existieron en Unidigital.
        // Estos solo necesitan cancelarse en la BD local.
        const isOrphanBatch = id.startsWith('FAIL-');
        logger.info(`[cancelBatch] id=${id}, isOrphanBatch=${isOrphanBatch}`);
        
        if (!isOrphanBatch) {
            // Lote normal: intentamos cerrar/cancelar en Unidigital primero.
            await closeAndCancelBatch(id, reason);
        } else {
            logger.info(`Lote huérfano detectado (${id}). Solo se cancelará en la BD local, sin llamar a Unidigital.`);
        }
        
        // Actualizamos nuestro log local.
        const canceledCount = await cancelBatchInDb(id, reason);
        
        if (canceledCount === 0) {
            return res.status(409).json({ 
                message: "No se pudo cancelar el lote. Verifique que existe y está en un estado cancelable (Cerrado o Error Fatal)." 
            });
        }
        
        res.status(200).json({ message: `Lote ${id} cancelado exitosamente.` });

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Fallo en el proceso de cancelación para el lote ${id}: ${errorMessage}`);
        
        res.status(error.response?.status || 500).json({ 
            message: "Error al cancelar el lote.", 
            error: errorMessage 
        });
    }
};

export const syncControlsController = async (req, res) => {
    const { id } = req.params; // ID del lote a sincronizar

    try {
        // 1. Verificar el estado del lote en Unidigital.
        logger.info(`Iniciando sincronización de controles para el lote ${id}.`);
        const batchDetails = await getBatchDetails(id);

        if (batchDetails?.result?.currentStatus !== 4) {
            logger.warn(`Intento de sincronizar el lote ${id}, pero su estado no es 4 (Assigned). Estado actual: ${batchDetails?.result?.currentStatus || 'desconocido'}.`);
            return res.status(409).json({ message: "El lote no está listo para sincronizar. El estado en Unidigital debe ser 'Assigned' (4)." });
        }

        // 2. Bucle de paginación para descargar todos los documentos.
        let currentPage = 1;
        let totalPages = 1;
        let documentsSynced = 0;
        const pageSize = 100; // Descargar en lotes de 100 para ser eficientes

        do {
            const pageData = await getBatchDocuments(id, currentPage, pageSize);
            const documents = pageData?.result?.documents?.result;
            totalPages = pageData?.result?.documents?.totalPages || 1;

            if (!documents || documents.length === 0) {
                logger.info(`No se encontraron más documentos en la página ${currentPage} para el lote ${id}.`);
                break;
            }

            // 3. Actualizar cada documento en la base de datos de Profit.
            for (const doc of documents) {
                if (doc.number && doc.control) {
                    // Formatear el número de documento con ceros a la izquierda
                    let formattedNumber;
                    let ProfitdocumentType
                    let ProfitControlnumber = doc.control.toString();

                    // Mapear el tipo de documento y asignar la longitud correspondiente
                    if (doc.documentType === 'FA') {
                        formattedNumber = doc.number.toString().padStart(9, '0'); // 9 dígitos para FACT
                        ProfitdocumentType = 'FACT';
                    } else if (doc.documentType === 'NC') {
                        formattedNumber = doc.number.toString().padStart(8, '0'); // 8 dígitos para N/CR
                        ProfitdocumentType = 'N/CR';
                    } else if (doc.documentType === 'ND') {
                        formattedNumber = doc.number.toString().padStart(10, '0'); // 10 dígitos para N/DB
                        ProfitdocumentType = 'N/DB';
                    } else {
                        logger.warn(`Tipo de documento desconocido: ${doc.documentType}. No se procesará el documento ${doc.number}.`);
                        continue; // Saltar este documento
                    }
                    

                    await updateControlNumberInDb(formattedNumber, ProfitControlnumber, ProfitdocumentType);
                    documentsSynced++;
                } else {
                    logger.warn(`Documento en lote ${id} sin número o control. Data: ${JSON.stringify(doc)}`);
                }
            }
            currentPage++;
        } while (currentPage <= totalPages);

        // 4. Si todo fue bien, actualizamos el estado de nuestro log local a "Asignado".
        await assignBatchInDb(id);

        logger.info(`Sincronización completada para el lote ${id}. Total de documentos actualizados: ${documentsSynced}.`);
        res.status(200).json({ 
            message: "Sincronización de números de control completada exitosamente.",
            documentsSynced: documentsSynced
        });

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message;
        logger.error(`Fallo en el proceso de sincronización para el lote ${id}: ${errorMessage}`);
        res.status(error.response?.status || 500).json({ 
            message: "Error al sincronizar los números de control.", 
            error: errorMessage 
        });
    }
};

export const listBatchDocumentsController = async (req, res) => {
    const { id } = req.params; // ID del lote

    try {
        const documents = await getDocumentsByBatchId(id);

        if (documents.length === 0) {
            logger.warn(`Se solicitaron documentos para el lote ${id}, pero no se encontraron.`);
            // Devolvemos 200 con un array vacío, ya que no es un error, el lote podría existir pero estar vacío.
        }

        res.status(200).json({
            message: `Documentos del lote ${id} obtenidos exitosamente.`,
            data: documents
        });

    } catch (error) {
        logger.error(`Fallo al obtener los documentos del lote ${id}: ${error.message}`);
        res.status(500).json({ 
            message: "Error al obtener los documentos del lote.", 
            error: error.message 
        });
    }
};

export const deleteOrphanBatchController = async (req, res) => {
    const { id } = req.params;

    // Validar que el ID tenga el prefijo FAIL-
    if (!id.startsWith('FAIL-')) {
        return res.status(400).json({ 
            message: "Solo se pueden eliminar lotes con prefijo FAIL- (lotes huérfanos)." 
        });
    }

    try {
        logger.info(`[deleteOrphanBatch] Eliminando lote huérfano: ${id}`);
        
        const deletedCount = await deleteOrphanBatchFromDb(id);
        
        if (deletedCount === 0) {
            return res.status(404).json({ 
                message: `No se encontró el lote huérfano ${id} o no pudo ser eliminado.` 
            });
        }
        
        logger.info(`Lote huérfano ${id} eliminado exitosamente.`);
        res.status(200).json({ 
            message: `Lote huérfano ${id} eliminado exitosamente.`,
            deletedCount: deletedCount
        });

    } catch (error) {
        const errorMessage = error.message || String(error);
        logger.error(`Fallo al eliminar el lote huérfano ${id}: ${errorMessage}`);
        
        res.status(500).json({ 
            message: "Error al eliminar el lote huérfano.", 
            error: errorMessage 
        });
    }
};

export const clearDocumentsController = async (req, res) => {
    const { docType, fromDoc, toDoc } = req.body;

    // Validaciones
    if (!docType || !fromDoc || !toDoc) {
        return res.status(400).json({ 
            message: "Los campos 'docType', 'fromDoc' y 'toDoc' son requeridos." 
        });
    }

    const validDocTypes = ['FACT', 'N/CR', 'N/DB'];
    if (!validDocTypes.includes(docType)) {
        return res.status(400).json({ 
            message: `Tipo de documento inválido. Valores permitidos: ${validDocTypes.join(', ')}` 
        });
    }

    try {
        logger.info(`[clearDocuments] Limpiando documentos tipo ${docType} del ${fromDoc} al ${toDoc}`);
        
        const clearedCount = await clearDocumentsByRange(docType, fromDoc, toDoc);
        
        res.status(200).json({ 
            message: `${clearedCount} documentos limpiados exitosamente.`,
            docType,
            fromDoc,
            toDoc,
            clearedCount
        });

    } catch (error) {
        const errorMessage = error.message || String(error);
        logger.error(`Fallo al limpiar documentos: ${errorMessage}`);
        
        res.status(500).json({ 
            message: "Error al limpiar documentos.", 
            error: errorMessage 
        });
    }
};
