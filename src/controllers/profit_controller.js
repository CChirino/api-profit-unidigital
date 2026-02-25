import logger from '../helpers/logger.js';
// Importamos la función específica desde nuestro módulo de lógica de negocio
import { getDocumentosVenta } from '../modules/profit9_mod.js';

/**
 * Controlador para obtener documentos de venta de Profit.
 * Espera una fecha en el cuerpo de la solicitud.
 */
// Mapa para convertir el tipo de documento del request al código interno de Profit
const DOCUMENT_TYPE_MAP = {
    'FA': 'FACT',
    'FACT': 'FACT',
    'NC': 'N/CR',
    'N/CR': 'N/CR',
    'ND': 'N/DB',
    'N/DB': 'N/DB',
};

export const getProfitDocuments = async (req, res) => {
    try {
        // 1. Extraer y validar los parámetros del cuerpo de la solicitud
        const { fechaHasta, documentType } = req.body;

        if (!fechaHasta) {
            return res.status(400).json({ message: "El parámetro 'fechaHasta' es requerido." });
        }

        // Convertir la cadena de fecha a un objeto Date.
        // new Date() es bastante flexible y puede parsear formatos como 'YYYY-MM-DD'.
        const fechaHastaDate = new Date(fechaHasta);
        if (isNaN(fechaHastaDate.getTime())) {
            return res.status(400).json({ message: "El formato de 'fechaHasta' no es válido." });
        }

        // Resolver el tipo de documento (opcional). Si no se envía, se usan todos.
        let tiposDoc = 'FACT,N/CR,N/DB';
        if (documentType) {
            const tipoResuelto = DOCUMENT_TYPE_MAP[documentType.toUpperCase()];
            if (!tipoResuelto) {
                return res.status(400).json({
                    message: `Tipo de documento '${documentType}' no válido. Use: FA, NC, ND (o FACT, N/CR, N/DB).`
                });
            }
            tiposDoc = tipoResuelto;
        }

        logger.info(`Controlador: Solicitud para obtener documentos de Profit hasta ${fechaHasta}, tiposDoc: ${tiposDoc}`);

        // 2. Llamar a la función del módulo de lógica
        const documentos = await getDocumentosVenta(fechaHastaDate, { tiposDoc });

        // 3. Enviar la respuesta
        res.status(200).json({
            message: `Se encontraron ${documentos.length} documentos.`,
            data: documentos
        });

    } catch (error) {
        // Si algo falla en la capa inferior, el error se propaga hasta aquí.
        logger.error(`Error en el controlador getProfitDocuments: ${error.message}`);
        res.status(500).json({ message: 'Error interno del servidor al procesar la solicitud.' });
    }
};