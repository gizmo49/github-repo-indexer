import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import commitQueue from '../queues/commitQueue';
import { getRepositorySecret } from '../services/secretService';
import { gitHubService } from '../services/gitHubService';


const router = Router();

/**
 * @swagger
 * /api/v1/webhooks/github:
 *   post:
 *     summary: Handle GitHub webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ref:
 *                 type: string
 *                 description: The Git reference (branch or tag) that triggered the event.
 *               before:
 *                 type: string
 *                 description: The commit SHA before the push.
 *               after:
 *                 type: string
 *                 description: The commit SHA after the push.
 *               repository:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The unique identifier of the repository.
 *                   node_id:
 *                     type: string
 *                     description: The node ID of the repository.
 *                   name:
 *                     type: string
 *                     description: The name of the repository.
 *                   full_name:
 *                     type: string
 *                     description: The full name of the repository in the format "owner/repo".
 *                   private:
 *                     type: boolean
 *                     description: Indicates whether the repository is private.
 *                   owner:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The name of the repository owner.
 *                       email:
 *                         type: string
 *                         description: The email of the repository owner.
 *                       login:
 *                         type: string
 *                         description: The GitHub login of the repository owner.
 *                       id:
 *                         type: integer
 *                         description: The unique identifier of the repository owner.
 *                       node_id:
 *                         type: string
 *                         description: The node ID of the repository owner.
 *                       avatar_url:
 *                         type: string
 *                         description: The avatar URL of the repository owner.
 *                       url:
 *                         type: string
 *                         description: The URL of the repository owner’s GitHub profile.
 *                       html_url:
 *                         type: string
 *                         description: The HTML URL of the repository owner’s GitHub profile.
 *               commits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: The commit SHA.
 *                     message:
 *                       type: string
 *                       description: The commit message.
 *                     author:
 *                       type: string
 *                       description: The name of the commit author.
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: The commit timestamp.
 *                     url:
 *                       type: string
 *                       description: The URL of the commit.
 *               pusher:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: The name of the person who pushed the commit.
 *                   email:
 *                     type: string
 *                     description: The email of the person who pushed the commit.
 *             example:
 *               ref: refs/heads/main
 *               before: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
 *               after: b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t1
 *               repository:
 *                 id: 12345678
 *                 node_id: MDEwOlJlcG9zaXRvcnkxMjM0NTY3OA==
 *                 name: chromium
 *                 full_name: chromium/chromium
 *                 private: false
 *                 owner:
 *                   name: chromium
 *                   email: chromium@example.com
 *                   login: chromium
 *                   id: 12345678
 *                   node_id: MDQ6VXNlcjEyMzQ1Njc4
 *                   avatar_url: https://avatars.githubusercontent.com/u/12345678?v=4
 *                   url: https://api.github.com/users/chromium
 *                   html_url: https://github.com/chromium
 *               commits:
 *                 - id: b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t1
 *                   message: Update README
 *                   author: John Doe
 *                   timestamp: 2024-08-12T12:34:56Z
 *                   url: https://github.com/chromium/chromium/commit/b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t1
 *               pusher:
 *                 name: Jane Smith
 *                 email: jane.smith@example.com
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/webhooks/github', async (req: Request, res: Response) => {
    const signature = req.headers['x-hub-signature-256'] as string;
    const payload = JSON.stringify(req.body);
    const repoName = req.body.repository.full_name;
    const orgName = req.body.repository.owner.login; // Extracting orgName from the webhook payload

    try {
        // Fetch the secret for the repository
        const secret = await getRepositorySecret(orgName, repoName);

        if (!secret) {
            return res.status(401).send('No secret found for the repository');
        }

        // Validate the signature
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        const digest = `sha256=${hmac.digest('hex')}`;

        if (signature !== digest) {
            return res.status(400).send('Invalid signature');
        }
 
        const event = req.headers['x-github-event'];
        if (event === 'push') {
            const commits = await gitHubService.getCommits(orgName, repoName);
            await commitQueue.add({ commits, repoName });
        }
        res.status(200).send('Webhook received');
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(400).json({ error: 'An error occurred' });
        }
    }
});

export { router as webhookController };
