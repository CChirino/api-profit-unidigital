// filepath: c:\Users\frank\OneDrive\Dev\ProfitUnidigital\src/routes/api_batch_routes.js
import { Router } from 'express';
import { approveBatchController, cancelBatchController, syncControlsController, listBatchDocumentsController, deleteOrphanBatchController, clearDocumentsController } from '../controllers/batch_controller.js';
import { requireToken } from '../middlewares/require_token.js';

const router = Router();

// POST /api/v1/batches/clear-documents - Limpiar documentos por rango para reprocesamiento
router.post('/clear-documents', requireToken, clearDocumentsController);

// POST /api/v1/batches/{id}/approve
router.post('/:id/approve', requireToken, approveBatchController);

// POST /api/v1/batches/{id}/cancel
router.post('/:id/cancel', requireToken, cancelBatchController);

// POST /api/v1/batches/{id}/sync-controls
router.post('/:id/sync-controls', requireToken, syncControlsController);

// GET /api/v1/batches/{id}/documents
router.get('/:id/documents', requireToken, listBatchDocumentsController); 

// DELETE /api/v1/batches/{id} - Solo para lotes huérfanos (FAIL-)
router.delete('/:id', requireToken, deleteOrphanBatchController);

export default router;