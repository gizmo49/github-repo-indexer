import { AppDataSource } from '../ormconfig';
import commitQueue from '../queues/commitQueue';
import { RepositoryEntity } from '../db/entities/RepositoryEntity';
import { CommitEntity } from '../db/entities/CommitEntity';
import { gitHubService } from './gitHubService';
import { IGithubCommit } from '../interface';

class MonitoringService {
    private repoRepository = AppDataSource.getRepository(RepositoryEntity);
    private commitRepository = AppDataSource.getRepository(CommitEntity);

    async init() {
        await this.seedChromiumRepository(); // Seed Chromium repo
        this.startMonitoring(); // Start monitoring process
    }

    async ensureRepository(orgName: string, repoName: string) {
        const repoInfo = await gitHubService.getRepositoryInfo(orgName, repoName);
        if (!repoInfo || repoInfo === null) {
            throw new Error(`Repository ${orgName}/${repoName} does not exist`);
        }

        let repository = await this.repoRepository.findOne({ where: { orgName, repoName } });

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

        await commitQueue.add('indexCommits', { orgName, repoName, sinceCommitUrl: repository.lastCommitUrl });
    }

    async indexCommits(orgName: string, repoName: string, sinceCommitUrl: string) {
        try {
            const commits: IGithubCommit[] = await this.fetchCommits(orgName, repoName, sinceCommitUrl);

            if (commits.length > 0) {
                await commitQueue.add('indexCommits', { commits, orgName, repoName });

                const lastCommitUrl = commits[commits.length - 1].commitUrl;
                await this.repoRepository.update({ orgName, repoName }, { lastCommitUrl });
            }

            if (!await this.isIndexingComplete(orgName, repoName)) {
                this.startMonitoring();
            } else {
                await this.repoRepository.update({ orgName, repoName }, { indexingComplete: true });
            }
        } catch (error: unknown) {
            throw new Error(`Error indexing commits for ${orgName}/${repoName}`);
        }
    }

    private async fetchCommits(orgName: string, repoName: string, sinceCommitUrl: string): Promise<IGithubCommit[]> {
        const { commits } = await gitHubService.getCommits(orgName, repoName, sinceCommitUrl);
        return commits;
    }

    public async processRepositories() {
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
        const repository = await this.repoRepository.findOne({ where: { orgName, repoName } });
        return repository ? repository.indexingComplete : false;
    }

    public startMonitoring() {
        setInterval(async () => {
            try {
                await this.processRepositories();
                console.log('Repository monitoring completed successfully.');
            } catch (error: any) {
                console.error('Error in repository monitoring:', error.message);
            }
        }, 60 * 60 * 1000); // Every hour
    }

    public async seedChromiumRepository() {
        const orgName = 'chromium';
        const repoName = 'chromium';

        try {
            await this.ensureRepository(orgName, repoName);
            console.log(`Chromium repository ${orgName}/${repoName} has been initialized.`);
        } catch (error: any) {
            throw new Error(`Error seeding Chromium repository: ${error.message}`);
        }
    }
}

export const monitoringService = new MonitoringService();
