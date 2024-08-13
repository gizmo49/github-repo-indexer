import Bull from 'bull';
import { Worker } from 'worker_threads';
import { IGithubCommit } from '../interface';

const dotenv = require('dotenv');
dotenv.config();

const commitQueue = new Bull('commitQueue', {
    redis: process.env.REDIS_URL, // Use the full Redis URL
});

commitQueue.process(async (job) => {
    const { commits, orgName, repoName }: { commits: IGithubCommit[], orgName: string, repoName: string } = job.data;

    // Offload the processing to a worker thread
    const worker = new Worker('./src/workers/commitWorker.ts', {
        workerData: { commits, orgName, repoName },
        execArgv: ['--require', 'ts-node/register'] // Ensure TypeScript support
    });

    worker.on('message', (message) => {
        if (message.event === 'success') {
            console.log(`Commits processed for ${orgName}/${repoName}`);
        } else if (message.event === 'error') {
            console.error(`Error processing commits: ${message.message}`);
        }
    });

    worker.on('error', (error) => {
        console.error('Worker encountered an error:', error);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        }
    });
});

export default commitQueue;
