import { Router } from 'express';
import { listBatchLogs } from '../controllers/log_controller.js';
import { requireToken } from '../middlewares/require_token.js';

const router = Router();

// GET /api/v1/logs/batches?page=1&limit=50
router.get('/batches', requireToken, listBatchLogs);

export default router;