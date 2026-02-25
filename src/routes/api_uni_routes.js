import { Router } from "express";
import { requireToken } from "../middlewares/require_token.js";

// Importamos los controladores desde el archivo uni_conttoller.js
import { getAvailableSeries, getLastUnidigitalDocument, getBatchDetailsController } from '../controllers/uni_controller.js';

const router = Router();

/*
 *--------------------------------------------------------------------------
 * Rutas para la API de Unidigital
 *--------------------------------------------------------------------------
 *
 * Todas las rutas definidas aquí estarán prefijadas por lo que definas
 * en tu archivo principal de la aplicación (ej: /api/unidigital)
 *
 */

// Ruta para obtener las series disponibles (desde caché)
// Método: GET
// Endpoint: /api/unidigital/series
router.get('/series', requireToken, getAvailableSeries);



// Ruta para consultar el último documento de una serie
// Método: POST
// Endpoint: /api/unidigital/documents/last
router.post('/documents/last', requireToken, getLastUnidigitalDocument);


// Ruta para consultar detalles de un batch en Unidigital
// Método: GET
// Endpoint: /api/unidigital/batch/:id
router.get('/batch/:id', requireToken, getBatchDetailsController);

// Exportamos el router para que pueda ser usado por la aplicación principal
export default router;