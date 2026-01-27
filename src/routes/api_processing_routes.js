import { Router } from 'express';
import { startDocumentProcessing, retryBatchProcessing } from '../controllers/processing_controller.js';
import { requireToken } from '../middlewares/require_token.js';

const router = Router();

// Ruta para iniciar un NUEVO lote de procesamiento.
// POST /api/v1/processing/start
router.post('/start', requireToken, startDocumentProcessing);

// NUEVA RUTA para REINTENTAR un lote existente que falló.
// POST /api/v1/processing/retry/:id
router.post('/retry/:id', requireToken, retryBatchProcessing);

export default router;