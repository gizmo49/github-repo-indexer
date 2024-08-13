import { parentPort, workerData } from 'worker_threads';
import { cache } from '../services/cacheService';
import { AppDataSource } from '../ormconfig';
import { CommitEntity } from '../db/entities/CommitEntity';
import { RepositoryEntity } from '../db/entities/RepositoryEntity';

const { commits, orgName, repoName } = workerData;

const commitRepository = AppDataSource.getRepository(CommitEntity);
const repositoryRepository = AppDataSource.getRepository(RepositoryEntity);

async function processCommits() {
    // Find or create the repository entity
    let repository = await repositoryRepository.findOne({
        where: { orgName, repoName }
    });

    if (!repository) {
        console.error(`Repository ${orgName}/${repoName} not found`);
        parentPort?.postMessage({ event: 'error', message: `Repository ${orgName}/${repoName} not found` });
        return;
    }

    // Retrieve the last indexed commit URL from the cache
    const lastIndexedCommitUrl = await cache.get(`lastIndexedCommit_${orgName}_${repoName}`);
    let newCommits = commits;

    if (lastIndexedCommitUrl) {
        newCommits = commits.filter(commit => commit.commitUrl > lastIndexedCommitUrl);
    }

    for (const commit of newCommits) {
        const existingCommit = await commitRepository.findOne({
            where: { commitUrl: commit.commitUrl },
            relations: ['repository']
        });

        if (!existingCommit) {
            const commitEntity = commitRepository.create({
                commitMessage: commit.commitMessage,
                author: commit.author,
                commitDate: commit.commitDate,
                commitUrl: commit.commitUrl,
                repository
            });

            await commitRepository.save(commitEntity);
            await cache.set(`lastIndexedCommit_${orgName}_${repoName}`, commit.commitUrl);
        }
    }

    parentPort?.postMessage({ event: 'success', message: 'Commits processed' });
}

processCommits().catch(error => {
    parentPort?.postMessage({ event: 'error', message: error.message });
});
