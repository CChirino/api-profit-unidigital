import { Router } from 'express';
// Importamos el controlador que creamos
import { getProfitDocuments } from '../controllers/profit_controller.js';
// Importamos el middleware de autenticación para proteger la ruta
import { requireToken } from '../middlewares/require_token.js';

const router = Router();

/*
 *--------------------------------------------------------------------------
 * Rutas para la API de Profit Administrativo
 *--------------------------------------------------------------------------
 */

// Endpoint para obtener documentos de venta.
// Método: POST
// URL: /api/v1/profit/documents
// Requiere un token de autenticación.
router.post('/documents', requireToken, getProfitDocuments);


// Exportamos el router para que pueda ser usado por app.js
export default router;