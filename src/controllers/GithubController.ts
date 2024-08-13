import { Router, Request, Response } from 'express';
import { gitHubService } from '../services/gitHubService';
import { IGithubCommit, IGithubRepository } from '../interface';

const router = Router();

/**
 * @openapi
 * /api/v1/github/commits:
 *   get:
 *     summary: Get commits from a repository
 *     parameters:
 *       - name: orgName
 *         in: query
 *         description: The organization name
 *         required: true
 *         schema:
 *           type: string
 *       - name: repoName
 *         in: query
 *         description: The repository name
 *         required: true
 *         schema:
 *           type: string
 *       - name: sinceDate
 *         in: query
 *         description: The date to filter commits since
 *         schema:
 *           type: string
 *           format: date
 *       - name: page
 *         in: query
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: perPage
 *         in: query
 *         description: Number of commits per page
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: Returns the list of commits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRecords:
 *                   type: integer
 *                 commits:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       commitMessage:
 *                         type: string
 *                       author:
 *                         type: string
 *                       commitDate:
 *                         type: string
 *                         format: date-time
 *                       commitUrl:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
router.get('/commits', async (req: Request, res: Response): Promise<void> => {
    const { orgName, repoName, sinceDate, page, perPage } = req.query as any;
    try {
        const { totalRecords, commits } = await gitHubService.getCommits(orgName, repoName, sinceDate, page, perPage);
        res.json({ totalRecords, commits });
    } catch (error: unknown) {
        res.status(400).json({ error: (error instanceof Error) ? error.message : 'An error occurred' });
    }
});

/**
 * @openapi
 * /api/v1/github/repository/{orgName}/{repoName}:
 *   get:
 *     summary: Get repository information
 *     parameters:
 *       - name: orgName
 *         in: path
 *         description: The organization name
 *         required: true
 *         schema:
 *           type: string
 *       - name: repoName
 *         in: path
 *         description: The repository name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the repository information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 url:
 *                   type: string
 *                 language:
 *                   type: string
 *                 forks_count:
 *                   type: integer
 *                 stars_count:
 *                   type: integer
 *                 open_issues_count:
 *                   type: integer
 *                 watchers_count:
 *                   type: integer
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Internal server error
 */
router.get('/repository/:orgName/:repoName', async (req: Request, res: Response): Promise<void> => {
    const { orgName, repoName } = req.params;
    try {
        const repoInfo: IGithubRepository = await gitHubService.getRepositoryInfo(orgName, repoName);
        res.json(repoInfo);
    } catch (error: unknown) {
        res.status(400).json({ error: (error instanceof Error) ? error.message : 'An error occurred' });
    }
});

/**
 * @openapi
 * /api/v1/github/top-authors:
 *   get:
 *     summary: Get top N commit authors by commit counts
 *     parameters:
 *       - name: limit
 *         in: query
 *         description: Number of top authors to retrieve
 *         required: true
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Returns the list of top commit authors
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   author:
 *                     type: string
 *                   count:
 *                     type: integer
 *       500:
 *         description: Internal server error
 */
router.get('/top-authors', async (req: Request, res: Response): Promise<void> => {
    const { limit } = req.query as any;
    try {
        const topAuthors = await gitHubService.getTopCommitAuthors(Number(limit));
        res.json(topAuthors);
    } catch (error: unknown) {
        res.status(400).json({ error: (error instanceof Error) ? error.message : 'An error occurred' });
    }
});

/**
 * @openapi
 * /api/v1/github/commits-by-repo/{orgName}/{repoName}:
 *   get:
 *     summary: Retrieve commits of a repository by repository name
 *     parameters:
 *       - name: orgName
 *         in: path
 *         description: The organization name
 *         required: true
 *         schema:
 *           type: string
 *       - name: repoName
 *         in: path
 *         description: The repository name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the list of commits
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   commitMessage:
 *                     type: string
 *                   author:
 *                     type: string
 *                   commitDate:
 *                     type: string
 *                     format: date-time
 *                   commitUrl:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
router.get('/commits-by-repo/:orgName/:repoName', async (req: Request, res: Response): Promise<void> => {
    const { orgName, repoName } = req.params;
    try {
        const commits: IGithubCommit[] = await gitHubService.getCommitsByRepositoryName(orgName, repoName);
        res.json(commits);
    } catch (error: unknown) {
        res.status(400).json({ error: (error instanceof Error) ? error.message : 'An error occurred' });
    }
});

/**
 * @openapi
 * /api/v1/github/add-repository:
 *   post:
 *     summary: Add or update a GitHub repository and trigger commit indexing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orgName:
 *                 type: string
 *                 description: Organization name on GitHub
 *                 example: chromium
 *               repoName:
 *                 type: string
 *                 description: Repository name on GitHub
 *                 example: chromium
 *     responses:
 *       200:
 *         description: Message indicating that indexing has been triggered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.post('/add-repository', async (req: Request, res: Response): Promise<void> => {
    const { orgName, repoName } = req.body as { orgName: string; repoName: string };

    try {
        const result = await gitHubService.addRepository({ orgName, repoName });
        res.json(result);
    } catch (error: unknown) {
        res.status(400).json({ error: (error instanceof Error) ? error.message : 'An error occurred' });
    }
});

export { router as githubController };
