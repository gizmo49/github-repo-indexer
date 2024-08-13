import { AppDataSource } from '../ormconfig';
import commitQueue from '../queues/commitQueue'; // Import the commit queue
import { RepositoryEntity } from '../db/entities/RepositoryEntity';
import { CommitEntity } from '../db/entities/CommitEntity';
import { gitHubService } from './gitHubService';


class MonitoringService {
    private repoRepository = AppDataSource.getRepository(RepositoryEntity);
    private commitRepository = AppDataSource.getRepository(CommitEntity);

    constructor() {
        this.seedChromiumRepository(); // Seed the Chromium repo on start-up
        this.startMonitoring(); // Start the regular monitoring process
    }

    private async ensureRepository(orgName: string, repoName: string) {
        const repoInfo = await gitHubService.getRepositoryInfo(orgName, repoName);
        if (!repoInfo) {
            throw new Error(`Repository ${orgName}/${repoName} does not exist`);
        }

        let repository = await this.repoRepository.findOne({
            where: { orgName, repoName }
        });

        if (!repository) {
            repository = this.repoRepository.create({
                orgName,
                repoName,
                lastCommitUrl: '',
                indexingComplete: false
            });
            await this.repoRepository.save(repository);
        } else {
            repository.indexingComplete = false;
            await this.repoRepository.save(repository);
        }

        // Enqueue the commit indexing job
        commitQueue.add('indexCommits', { orgName, repoName, sinceCommitUrl: repository.lastCommitUrl });
    }

    private async fetchCommits(orgName: string, repoName: string, sinceCommitUrl: string) {
        const { commits } = await gitHubService.getCommits(orgName, repoName, sinceCommitUrl);
        return commits;
    }

    private async indexCommits(orgName: string, repoName: string, sinceCommitUrl: string) {
        try {
            const commits = await this.fetchCommits(orgName, repoName, sinceCommitUrl);

            if (commits.length > 0) {
                // Add commits to the queue
                commitQueue.add('indexCommits', { commits, orgName, repoName });

                // Update repository with the latest commit URL
                const lastCommitUrl = commits[commits.length - 1].commitUrl;
                await this.repoRepository.update({ orgName, repoName }, { lastCommitUrl });
            }

            // Continue indexing if not complete
            if (!await this.isIndexingComplete(orgName, repoName)) {
                this.startMonitoring(); // Continue monitoring
            } else {
                await this.repoRepository.update({ orgName, repoName }, { indexingComplete: true });
            }
        } catch (error: any) {
            console.error(`Error indexing commits for ${orgName}/${repoName}:`, error.message);
        }
    }

    private async processRepositories() {
        const batchSize = 50;
        let offset = 0;
        let hasMore = true;

        while (hasMore) {
            const repositories = await this.repoRepository.find({
                skip: offset,
                take: batchSize
            });

            if (repositories.length === 0) {
                hasMore = false;
                break;
            }

            await Promise.all(repositories.map(async (repo) => {
                const { orgName, repoName, lastCommitUrl } = repo;
                await this.indexCommits(orgName, repoName, lastCommitUrl);
            }));

            offset += batchSize;
        }
    }

    private async isIndexingComplete(orgName: string, repoName: string): Promise<boolean> {
        const repository = await this.repoRepository.findOne({
            where: { orgName, repoName }
        });
        return repository ? repository.indexingComplete : false;
    }

    private async seedChromiumRepository() {
        const orgName = 'chromium';
        const repoName = 'chromium';
        
        try {
            await this.ensureRepository(orgName, repoName);
            console.log(`Chromium repository ${orgName}/${repoName} has been initialized.`);
        } catch (error: any) {
            console.error(`Error seeding Chromium repository:`, error.message);
        }
    }

    private startMonitoring() {
        setInterval(async () => {
            try {
                await this.processRepositories();
                console.log('Repository monitoring completed successfully.');
            } catch (error: any) {
                console.error('Error in repository monitoring:', error.message);
            }
        }, 60 * 60 * 1000); // Every hour
    }
}

// Initialize the monitoring service
export const monitoringService = new MonitoringService();
