import logger from '../helpers/logger.js';
import { 
    markDocumentsWithBatchId, 
    getDocumentsByBatch, 
    updateDocumentStatus,
    getDocumentRenglones,
    createBatchLogEntry,
    updateBatchLogStatus,
    getOpenBatchBySerie,
    countFailedDocumentsInBatch,
    getAllDocumentsForRetry
} from '../modules/profit9_mod.js';
import { round2 } from '../utils/round.js';
import { createBatch, createDocuments, closeAndCancelBatch, closeBatch, getBatchDetails } from '../modules/uni_mod.js';
import NumeroALetras from '../helpers/numeroaletras.js';

const BATCH_SIZE = parseInt(process.env.PROCESSING_BATCH_SIZE, 10) || 100;

// Función para mapear tipo de documento de Profit a Unidigital
function mapProfitDocTypeToUnidigital(docType) {
    const tipo = (docType || '').trim().toUpperCase().substring(0, 2);
    switch (tipo) {
        case 'FA': return 'FA';
        case 'NC': return 'NC';
        case 'ND': return 'ND';
        default: return tipo || 'FA';
    }
}

// La función mapToUnidigitalDoc se mantiene exactamente igual.
async function mapToUnidigitalDoc(profitDoc, renglones) {
    // ... (código de mapeo existente sin cambios) ...
    // 1. Mapeo de Tipo de Documento -> Unidigital exige 2 caracteres (ej. "FA","NC","ND")
    const profitDocType = (profitDoc.co_tipo_doc || '').trim().toUpperCase();
    let unidigitalDocType;
    switch (profitDocType) {
        case 'FA':
        case 'FACT':
        case 'FACTURA':
            unidigitalDocType = 'FA';
            break;
        case 'NC':
        case 'N/CR':
            unidigitalDocType = 'NC';
            break;
        case 'ND':
        case 'N/DB':
            unidigitalDocType = 'ND';
            break;
        default:
            unidigitalDocType = (profitDocType.substring(0, 2) || 'FA').toUpperCase();
    }

    // 2. Mapeo de Moneda -> Normalizar códigos a los aceptados por Unidigital
    const profitCurrency = (profitDoc.co_mone || '').trim().toUpperCase();
    let unidigitalCurrency;
    switch (profitCurrency) {
        case 'VES':
        case 'BS':
        case 'BSF':
        case 'BSD':
            unidigitalCurrency = 'VES';
            break;
        case 'USD':
        case 'US$':
            unidigitalCurrency = 'USD';
            break;
        case 'EUR':
            unidigitalCurrency = 'EUR';
            break;
        default:
            unidigitalCurrency = 'VES';
    }

    // 3. Tipo de pago
    const paymentType = (profitDoc.saldo > 0) ? 2 : 1; // 1: Contado, 2: Crédito

    // 4. RIF con validación de letra inicial
    const rifInput = (profitDoc.rif || '').trim();
    const rifCompleto = rifInput ? rifInput.replace(/[^a-zA-Z0-9]/g, '') : 'V000000000';

    let fiscalRegistryCode = rifCompleto.charAt(0).toUpperCase();
    let fiscalRegistry = rifCompleto.substring(1);

    const allowedLetters = ['V', 'E', 'J', 'G', 'P', 'C'];

    // Si el primer carácter no es una de las letras permitidas, se asigna 'V' por defecto.
    // Esto cubre casos donde el RIF empieza con un número o una letra incorrecta.
    if (!allowedLetters.includes(fiscalRegistryCode)) {
        fiscalRegistryCode = 'V';
        // Si el RIF original no tenía letra (ej. "12345678"), usamos el string completo como número.
        fiscalRegistry = rifCompleto.replace(/[^0-9]/g, '');
    }

    const isForeignCurrency = unidigitalCurrency !== 'VES';
    const exchangeRate = parseFloat(profitDoc.tasa) || 1;
    
    // VALIDACIÓN: Si es moneda extranjera y la tasa es 1 (por defecto), hay un problema
    if (isForeignCurrency && exchangeRate <= 1) {
        logger.warn(`Documento ${profitDoc.nro_doc}: Moneda ${unidigitalCurrency} pero tasa=${profitDoc.tasa}. Verificar en Profit.`);
    }

    // --- CÁLCULOS: mantener valores en MONEDA_DOC y en VES para cumplir reglas ---
    let detailsPayload = [];
    let exemptAmountDoc = 0;
    let exemptAmountVES = 0;
    let taxableItemsSumDoc = 0;
    let taxableItemsSumVES = 0;
    let taxAmountSumDoc = 0;
    let taxAmountSumVES = 0;

    if (renglones && renglones.length > 0) {
        for (const r of renglones) {
            const test = r.Amount;
            const amountDoc = round2(r.Amount || 0);
            const amountVES = isForeignCurrency ? round2((r.Amount || 0) * exchangeRate) : amountDoc;
            const taxDoc = round2(r.TaxAmount || 0);
            const taxVES = isForeignCurrency ? round2((r.TaxAmount || 0) * exchangeRate) : taxDoc;
            const taxPercent = r.TaxAmount > 0 ? (r.TaxPercent || 16) : 0;

            if (r.TaxAmount === 0) {
                exemptAmountDoc += amountDoc;
                exemptAmountVES += amountVES;
            } else {
                taxableItemsSumDoc += amountDoc;
                taxableItemsSumVES += amountVES;
                taxAmountSumDoc += taxDoc;
                taxAmountSumVES += taxVES;
            }

            detailsPayload.push({
                Description: r.des_art || 'Sin descripción',
                Quantity: r.Quantity || 1,
                UnitPrice: round2(r.UnitPrice || 0),
                Amount: amountDoc,
                TaxAmount: taxDoc,
                TaxPercent: round2(taxPercent) || 0,
                IsExempt: r.TaxAmount === 0,
                TaxCode: r.TaxAmount > 0 ? "G" : "E",
                AmountPlusDiscount: amountDoc,
                OperationCode: r.co_art || "N/A",
                TotalAmount: round2(amountDoc + taxDoc),
                ProductType: 2
            });
        }
    }

    const DiscountDoc = round2(profitDoc.descuento || 0);
    const PreviousBalanceDoc = round2(profitDoc.previousBalance || 0);
    const DiscountVES = isForeignCurrency ? round2(DiscountDoc * exchangeRate) : DiscountDoc;
    const PreviousBalanceVES = isForeignCurrency ? round2(PreviousBalanceDoc * exchangeRate) : PreviousBalanceDoc;

    // Totales en moneda del documento
    const subtotalDoc = round2(taxableItemsSumDoc + exemptAmountDoc);
    const taxBaseDoc = round2(taxableItemsSumDoc);
    const taxAmountDoc = round2(taxAmountSumDoc);
    const totalDoc = round2(subtotalDoc - DiscountDoc + taxAmountDoc + PreviousBalanceDoc);

    // Totales en VES
    const subtotalVES = round2(taxableItemsSumVES + exemptAmountVES);
    const taxBaseVES = round2(taxableItemsSumVES);
    const taxAmountVES = round2(taxAmountSumVES);
    const totalVES = round2(subtotalVES - DiscountVES + taxAmountVES + PreviousBalanceVES);

    // IGTF y propina (si aplica)
    const tipDoc = round2(profitDoc.propina || profitDoc.tip || 0);
    const tipVES = isForeignCurrency ? round2(tipDoc * exchangeRate) : tipDoc;
    
    // igtf 3% sobre el total del documento (incluye propina si aplica)
     const IGTFPercentage = 3;
     const igtfBaseAmountDoc = 0;
     const igtfBaseAmountVES = 0;
     const igtfAmountDoc = 0;
     const igtfAmountVES = 0;
   
    const grandTotalDoc = round2(totalDoc +  tipDoc);
    const grandTotalVES = round2(totalVES +  tipVES);

    const amountInLetters = await NumeroALetras(round2(grandTotalVES), {
        plural: 'BOLÍVARES',
        singular: 'BOLÍVAR',
        centPlural: 'CÉNTIMOS',
        centSingular: 'CÉNTIMO'
    });
    // Campos adicionales que se deseen incluir
    const extraPayload = {
        DueDate: profitDoc.fec_venc || new Date().toISOString().split('T')[0],
        ContractNumber: profitDoc.co_cli || '',
    };
    // Construir payload con campos en MONEDA_DOC y en VES; ConversionCurrency siempre VES para cumplir regla
    return {
        DocumentType: unidigitalDocType,
        Number: parseInt((profitDoc.nro_doc || '0').toString().trim(), 10),
        EmissionDateAndTime: new Date(profitDoc.fec_emis).toISOString(),
        currency: unidigitalCurrency,
        ConversionCurrency: 'VES', // asegurar al menos una VES según regla de Unidigital
        PaymentType: paymentType,

        Name: profitDoc.cli_des || process.env.DEFAULT_CLIENT_NAME,
        FiscalRegistryCode: fiscalRegistryCode,
        FiscalRegistry: fiscalRegistry,
        Address: profitDoc.direc1 || process.env.DEFAULT_CLIENT_ADDRESS,
        Phone: profitDoc.telefonos || process.env.DEFAULT_CLIENT_PHONE,
        EmailTo: profitDoc.email || process.env.DEFAULT_CLIENT_EMAIL,
        // Totales en moneda del documento
        ExemptAmount: round2(exemptAmountDoc) || 0,
        TaxBase: round2(taxBaseDoc) || 0,
        Subtotal: round2(subtotalDoc) || 0,
        SubtotalPlusDiscount: round2(subtotalDoc - DiscountDoc + PreviousBalanceDoc) || 0,
        Discount: round2(DiscountDoc) || 0,
        PreviousBalance: round2(PreviousBalanceDoc) || 0,
        TaxAmount: round2(taxAmountDoc) || 0,
        Taxes: round2(taxAmountDoc) || 0,
        TaxPercent: 16,
        Total: round2(totalDoc) || 0,
        IGTFBaseAmount: round2(igtfBaseAmountDoc) || 0,
        IGTFAmount: round2(igtfAmountDoc) || 0,
        Tip: round2(tipDoc) || 0,
        GrandTotal: round2(grandTotalDoc) || 0,
        // Totales en VES (para validación/visual) - CAMPOS REQUERIDOS POR UNIDIGITAL
        ExemptAmountVES: round2(exemptAmountVES) || 0,
        TaxBaseVES: round2(taxBaseVES) || 0,
        SubtotalVES: round2(subtotalVES) || 0,
        SubtotalPlusDiscountVES: round2(subtotalVES - DiscountVES + PreviousBalanceVES) || 0,
        TaxAmountVES: round2(taxAmountVES) || 0,
        TotalVES: round2(totalVES) || 0,
        IGTFBaseAmountVES: round2(igtfBaseAmountVES) ||  0,
        IGTFAmountVES: round2(igtfAmountVES) ||  0,
        TipVES: round2(tipVES) || 0,
        GrandTotalVES: round2(grandTotalVES) || 0,
        AmountLettersVES: amountInLetters || '',

        TaxPercentReduced: 8,
        TaxPercentSumptuary: 31,
        IGTFPercentage: IGTFPercentage,
        IGTFPercentageVES: IGTFPercentage,
        ExchangeRate: exchangeRate > 0 ? exchangeRate : 1,

        AffectedDocumentNumber: profitDoc.co_tipo_doc !== 'FACT' ? profitDoc.nro_orig : '',
        nroDocRelacionado: profitDoc.co_tipo_doc !== 'FACT' ? profitDoc.nro_orig : '',
        tipoDocRelacionado: profitDoc.co_tipo_doc !== 'FACT' ? mapProfitDocTypeToUnidigital(profitDoc.doc_orig) : '',
        FechaDocRelacionado: profitDoc.co_tipo_doc !== 'FACT' ? profitDoc.fec_emis : '',
        Anulado: profitDoc.anulado === true || profitDoc.anulado === 1 || profitDoc.anulado === '1',
        Details: detailsPayload,
        ExchangeRate: exchangeRate || 1,
        SystemReference: `PROFIT-${unidigitalDocType}-${(profitDoc.nro_doc || '').toString().trim().padStart(6, '0')}`,
        Note1: profitDoc.observa || '',
        Extra: extraPayload
    }
}

/**
 * [MOTOR INTERNO] Función principal de procesamiento. Orquesta el envío de documentos a Unidigital.
 * Se comporta de tres maneras según los parámetros:
 * 1. MODO NUEVO (unidigitalBatchId proporcionado): Usa el batch ya creado, marca documentos y los procesa.
 * 2. MODO REINTENTO (existingBatchId tiene valor, sin unidigitalBatchId): Usa el lote existente.
 * 3. MODO NUEVO (sin unidigitalBatchId): Crea el lote, marca documentos y los procesa.
 */
async function processBatchFlow(serieStrongId, userEmail, fechaHastaDate, existingBatchId = null, unidigitalBatchId = null) {
    logger.info(`== INICIANDO FLUJO DE PROCESO. MODO: ${existingBatchId ? 'REINTENTO' : 'NUEVO'} ==`);
    let documentsToProcess = [];
    let totalDocsInBatch = 0;

    try {
        // --- PASO 1: OBTENER/CREAR LOTE Y SELECCIONAR DOCUMENTOS ---
        if (existingBatchId) {
            // MODO REINTENTO: Usar el batch existente
            unidigitalBatchId = existingBatchId;
            
            // MODO REINTENTO: Obtenemos TODOS los documentos y filtramos en memoria.
            logger.info(`[REINTENTO] Obteniendo todos los documentos para el lote: ${unidigitalBatchId}`);
            const allDocsInBatch = await getAllDocumentsForRetry(unidigitalBatchId);
            
            if (!allDocsInBatch || allDocsInBatch.length === 0) {
                logger.warn(`[REINTENTO] No se encontraron documentos para el lote ${unidigitalBatchId}. El lote puede estar vacío o el ID es incorrecto.`);
                // Considerar cerrar el lote si está vacío y no hay nada que hacer.
                await closeBatch(unidigitalBatchId);
                await updateBatchLogStatus(unidigitalBatchId, 2, { message: "Cerrado por no tener documentos pendientes en reintento." });
                return;
            }
            
                // campo7 almacena el StrongId o estado (FALLIDO-*), campo8 es el BatchId
                documentsToProcess = allDocsInBatch.filter(doc => !doc.campo7 || doc.campo7.length < 30 || doc.campo7.startsWith('FALLIDO'));
            logger.info(`[REINTENTO] Documentos totales en lote: ${allDocsInBatch.length}. Documentos a re-procesar: ${documentsToProcess.length}`);
            
        } else if (unidigitalBatchId) {
            // MODO NUEVO: El batch ya fue creado en el endpoint, solo procesamos
            logger.info(`[NUEVO] Usando batch ya creado: ${unidigitalBatchId}`);
            
            const markedCount = await markDocumentsWithBatchId(unidigitalBatchId, fechaHastaDate);
            totalDocsInBatch = markedCount;
            if (markedCount === 0) {
                logger.info("No se encontraron documentos nuevos para procesar.");
                logger.warn(`El nuevo lote ${unidigitalBatchId} está vacío. Cancelando...`);
                try { await closeAndCancelBatch(unidigitalBatchId); } catch (cancelErr) { logger.error(`Error cancelando lote vacío ${unidigitalBatchId}: ${cancelErr.message}`); }
                return;
            }
            documentsToProcess = await getDocumentsByBatch(unidigitalBatchId, markedCount);
            
            if (documentsToProcess && documentsToProcess.length > 0) {
                let firstDoc = documentsToProcess[0];
                let lastDoc = documentsToProcess[documentsToProcess.length - 1];
                await createBatchLogEntry({
                    batchId: unidigitalBatchId,
                    serieId: serieStrongId,
                    createdBy: userEmail,
                    dateFrom: firstDoc.fec_emis,
                    dateTo: lastDoc.fec_emis,
                    docType: 'VARIOS',
                    firstDoc: firstDoc.nro_doc,
                    lastDoc: lastDoc.nro_doc,
                    totalDocs: totalDocsInBatch
                });
            }
        } else {
            // MODO NUEVO: Crear batch desde cero (respaldo)
            logger.info('Creando nuevo lote en Unidigital...');
            
            let batchResponse;
            try {
                batchResponse = await createBatch(serieStrongId);
            } catch (batchError) {
                if (batchError.message === 'BATCH_EXISTS') {
                    logger.warn(`Ya existe un batch en Unidigital para la serie ${serieStrongId}`);
                    return {
                        success: false,
                        error: 'BATCH_EXISTS',
                        message: 'Ya existe un lote en proceso para esta serie. No se puede crear uno nuevo.',
                        existingBatch: {
                            strongId: batchError.strongId,
                            date: batchError.date,
                            serieStrongId: batchError.serieStrongId
                        }
                    };
                }
                throw batchError;
            }
            
            unidigitalBatchId = batchResponse.strongId || batchResponse.StrongId;
            if (!unidigitalBatchId) throw new Error("La respuesta de Unidigital al crear el lote no contiene un strongId.");
            logger.info(`Lote creado en Unidigital: ${unidigitalBatchId}`);
            
            const markedCount = await markDocumentsWithBatchId(unidigitalBatchId, fechaHastaDate);
            totalDocsInBatch = markedCount;
            if (markedCount === 0) {
                logger.info("No se encontraron documentos nuevos para procesar.");
                logger.warn(`El nuevo lote ${unidigitalBatchId} está vacío. Cancelando...`);
                try { await closeAndCancelBatch(unidigitalBatchId); } catch (cancelErr) { logger.error(`Error cancelando lote vacío ${unidigitalBatchId}: ${cancelErr.message}`); }
                return;
            }
            documentsToProcess = await getDocumentsByBatch(unidigitalBatchId, markedCount);
            
            if (documentsToProcess && documentsToProcess.length > 0) {
                let firstDoc = documentsToProcess[0];
                let lastDoc = documentsToProcess[documentsToProcess.length - 1];
                await createBatchLogEntry({
                    batchId: unidigitalBatchId,
                    serieId: serieStrongId,
                    createdBy: userEmail,
                    dateFrom: firstDoc.fec_emis,
                    dateTo: lastDoc.fec_emis,
                    docType: 'VARIOS',
                    firstDoc: firstDoc.nro_doc,
                    lastDoc: lastDoc.nro_doc,
                    totalDocs: totalDocsInBatch
                });
            }
        }

        if (!documentsToProcess || documentsToProcess.length === 0) {
            logger.info("No hay documentos pendientes de envío en este lote. Verificando si se debe cerrar.");
            if (totalDocsInBatch > 0) {
                 // Si no hay nada que procesar pero el lote tiene documentos, significa que ya todo está OK.
                 // La lógica del final se encargará de cerrarlo.
            } else {
                return; // Lote vacío, no hay nada que hacer.
            }
        }

        // --- PASO 2: PROCESAMIENTO POR SUB-LOTES (iterando sobre la lista en memoria) ---
        let documentsProcessedInRun = 0;
        let documentsFailedInRun = 0;
        let currentIndex = 0;

        while (currentIndex < documentsToProcess.length) {
            const subBatch = documentsToProcess.slice(currentIndex, currentIndex + BATCH_SIZE);
            currentIndex += BATCH_SIZE;

            const docsToSend = [];
            const processedHeaders = [];

            for (const header of subBatch) {
                try {
                    const renglones = await getDocumentRenglones(header.nro_doc, header.co_tipo_doc);
                    const fullDoc = await mapToUnidigitalDoc(header, renglones);
                    docsToSend.push(fullDoc);
                    processedHeaders.push(header);
                } catch (enrichError) {
                    logger.error(`Error enriqueciendo doc ${header.nro_doc}. Se marcará como fallido. Error: ${enrichError.message}`);
                    await updateDocumentStatus(header.nro_doc, header.co_tipo_doc, 'FALLIDO-ENRIQUECIMIENTO', unidigitalBatchId);
                    documentsFailedInRun++;
                }
            }

            if (docsToSend.length > 0) {
                try {
                    const unidigitalResponse = await createDocuments(docsToSend, unidigitalBatchId);
                    const returnedDocs = unidigitalResponse?.Docs || unidigitalResponse?.result || unidigitalResponse?.result?.result || [];

                    for (let i = 0; i < docsToSend.length; i++) {
                        const sentDoc = docsToSend[i];
                        const header = processedHeaders[i];
                        const normalizeNum = (n) => String(parseInt(String(n), 10));
                        const docResult = returnedDocs.find(d => normalizeNum(d.Number || d.number) === normalizeNum(sentDoc.Number) || d.SystemReference === sentDoc.SystemReference);
                        const fallbackByIndex = !docResult && returnedDocs.length === docsToSend.length ? returnedDocs[i] : null;
                        const documentId = (docResult?.StrongId || docResult?.strongId) || (fallbackByIndex?.StrongId || fallbackByIndex?.strongId) || 'ENVIADO-SIN-ID';
                        
                        await updateDocumentStatus(header.nro_doc, header.co_tipo_doc, documentId, unidigitalBatchId);
                    }
                    documentsProcessedInRun += docsToSend.length;
                } catch (sendError) {
                    // --- INICIO DE LA LÓGICA MODIFICADA ---
                    
                    // 1. Extraer el mensaje de error detallado de la API de Unidigital.
                    const apiErrorMessage = sendError.response?.data?.message || sendError.response?.data?.errors?.[0]?.message || sendError.message;
                    logger.error(`¡FALLO CRÍTICO DE ENVÍO! Lote ${unidigitalBatchId} detenido. Razón: ${apiErrorMessage}`);

                    // 2. Marcar los documentos de este sub-lote como fallidos.
                    documentsFailedInRun += processedHeaders.length;
                    for (const header of processedHeaders) {
                        await updateDocumentStatus(header.nro_doc, header.co_tipo_doc, 'FALLIDO-ENVIO', unidigitalBatchId);
                    }

                    // 3. Lanzar un nuevo error para detener completamente el bucle y la función processBatchFlow.
                    //    Este error será capturado por el bloque catch principal.
                    throw new Error(`Proceso detenido por fallo en Unidigital: ${apiErrorMessage}`);
                    
                    // --- FIN DE LA LÓGICA MODIFICADA ---
                }
            }
            logger.info(`Progreso en esta ejecución: ${documentsProcessedInRun} procesados, ${documentsFailedInRun} fallidos / ${documentsToProcess.length} por procesar.`);
        }

        // --- PASO 3: CIERRE O REPORTE DE FALLOS ---
        logger.info(`== PROCESO COMPLETADO PARA LOTE: ${unidigitalBatchId} ==`);

        const finalFailedCount = await countFailedDocumentsInBatch(unidigitalBatchId);
        const finalProcessedCount = totalDocsInBatch - finalFailedCount;

        if (finalFailedCount > 0) {
            logger.warn(`El lote ${unidigitalBatchId} finalizó con ${finalFailedCount} documentos fallidos. El lote permanecerá Abierto para corrección.`);
            await updateBatchLogStatus(unidigitalBatchId, 1, { processedCount: finalProcessedCount, failedCount: finalFailedCount });
        } else {
            logger.info(`Todos los documentos del lote ${unidigitalBatchId} se procesaron exitosamente. Cerrando lote...`);
            await closeBatch(unidigitalBatchId);
            await updateBatchLogStatus(unidigitalBatchId, 2, { processedCount: finalProcessedCount, failedCount: finalFailedCount });
            logger.info(`El lote ${unidigitalBatchId} ha sido cerrado localmente y en Unidigital.`);
        }

    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || String(error);
        logger.error(`Error fatal durante el proceso para el lote ${unidigitalBatchId || 'N/A'}: ${errorMessage}`);
       if (unidigitalBatchId) {
            // Escenario 1: El error ocurrió DESPUÉS de crear el lote.
            // Tenemos un ID, así que actualizamos el log existente.
            await updateBatchLogStatus(unidigitalBatchId, 5, { errorMessage }); // 5 = Error Fatal
        } else if (serieStrongId) {
            // Escenario 2: El error ocurrió ANTES de crear el lote (ej. fallo en createBatch).
            // No tenemos ID de lote, pero sí de serie. Creamos una entrada de log de error "huérfana".
            const pseudoBatchId = `FAIL-${serieStrongId.substring(0, 8)}-${Date.now()}`;
            logger.warn(`Creando entrada de log de error huérfano con ID: ${pseudoBatchId}`);
            await createBatchLogEntry({
                batchId: pseudoBatchId,
                serieId: serieStrongId,
                createdBy: userEmail || 'system-fail',
                dateFrom: fechaHastaDate || new Date(),
                dateTo: fechaHastaDate || new Date(),
                docType: 'ERROR',
                firstDoc: 'N/A',
                lastDoc: 'N/A',
                totalDocs: 0,
                status: 5, // Marcar directamente como Error Fatal
                errorMessage: `Fallo al iniciar el lote: ${errorMessage}`
            });
        }
        // Ya no se cancela ni desmarca automáticamente. Se deja abierto para revisión manual.
    }
};

/**
 * [ENDPOINT] Inicia un NUEVO procesamiento de documentos.
 * Valida que no haya lotes abiertos para la serie antes de comenzar.
 * CORREGIDO: Ahora crea el batch primero y devuelve el batchId inmediatamente.
 */
export const startDocumentProcessing = async (req, res) => {
    const { serieStrongId, fechaHasta } = req.body;
    if (!serieStrongId) {
        return res.status(400).json({ message: "El parámetro 'serieStrongId' es requerido." });
    }

    try {
        const openBatch = await getOpenBatchBySerie(serieStrongId);
        if (openBatch) {
            logger.warn(`Intento de iniciar un nuevo lote para la serie ${serieStrongId}, pero ya existe el lote abierto: ${openBatch.BatchStrongId}.`);
            return res.status(409).json({
                message: `Ya existe un lote abierto (${openBatch.BatchStrongId}) para esta serie. Debe reintentarlo o cancelarlo antes de crear uno nuevo.`,
                conflictingBatchId: openBatch.BatchStrongId
            });
        }

        // Crear el batch en Unidigital PRIMERO
        let batchResponse;
        try {
            batchResponse = await createBatch(serieStrongId);
        } catch (batchError) {
            if (batchError.message === 'BATCH_EXISTS') {
                logger.warn(`Ya existe un batch en Unidigital para la serie ${serieStrongId}`);
                return res.status(409).json({
                    message: 'Ya existe un lote en proceso en Unidigital para esta serie. No se puede crear uno nuevo.',
                    error: 'BATCH_EXISTS',
                    existingBatch: {
                        strongId: batchError.strongId,
                        date: batchError.date,
                        serieStrongId: batchError.serieStrongId
                    }
                });
            }
            throw batchError;
        }

        const unidigitalBatchId = batchResponse.strongId || batchResponse.StrongId;
        if (!unidigitalBatchId) throw new Error("La respuesta de Unidigital al crear el lote no contiene un strongId.");

        const fechaHastaDate = fechaHasta ? new Date(fechaHasta) : new Date();
        const userEmail = req.user ? req.user.email : 'system';

        // Iniciar procesamiento en segundo plano, pasando el batchId ya creado
        processBatchFlow(serieStrongId, userEmail, fechaHastaDate, null, unidigitalBatchId);

        // Devolver el batchId inmediatamente para que el frontend lo pueda usar
        return res.status(202).json({ 
            batchId: unidigitalBatchId,
            message: "Proceso de creación y envío de nuevo lote iniciado." 
        });

    } catch (error) {
        logger.error(`Error al iniciar el procesamiento de documentos: ${error.message}`);
        return res.status(500).json({ message: "Error interno del servidor al iniciar el proceso." });
    }
};

/**
 * [ENDPOINT] Reintenta el procesamiento de un lote existente que quedó abierto por fallos.
 */
export const retryBatchProcessing = async (req, res) => {
    const { id } = req.params; // ID del lote a reintentar
    if (!id) {
        return res.status(400).json({ message: "El ID del lote es requerido en la URL." });
    }

    try {
        // 1. Verificar que el lote realmente existe y está abierto en Unidigital.
        const batchDetails = await getBatchDetails(id);
        const isBatchOpen = batchDetails?.result?.currentStatus === 1;

        if (!isBatchOpen) {
            const status = batchDetails?.result?.currentStatus;
            logger.warn(`Intento de reintentar el lote ${id}, pero no está abierto en Unidigital (Estado: ${status || 'No encontrado'}).`);
            return res.status(409).json({ message: `El lote ${id} no se puede reintentar porque no está en estado 'Abierto' (su estado actual es ${status}).` });
        }
        
        // La serie y fecha no son necesarias para el reintento, ya que solo trabajamos con documentos ya marcados.
        const userEmail = req.user ? req.user.email : 'system-retry';

        // 2. Iniciar el flujo de reintento en segundo plano, pasando el ID del lote.
        processBatchFlow(null, userEmail, null, id);

        return res.status(202).json({ message: `Proceso de reintento para el lote ${id} iniciado.` });

    } catch (error) {
        logger.error(`Error al iniciar el reintento para el lote ${id}: ${error.message}`);
        return res.status(500).json({ message: "Error interno del servidor al reintentar el lote." });
    }
};