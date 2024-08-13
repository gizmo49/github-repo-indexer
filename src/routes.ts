import { Router } from 'express';
import { webhookController } from './controllers/webhookController';
import { githubController } from './controllers/githubController';

const router = Router();

// Define your routes here
router.use('/webhooks', webhookController);
router.use('/github', githubController);

export default router;
