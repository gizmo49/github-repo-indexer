import axios, { AxiosInstance } from 'axios';
import { AppDataSource } from '../ormconfig';
import { parentPort } from 'worker_threads';
import { CommitEntity } from '../db/entities/CommitEntity';
import { CommitRepository } from '../db/repositories/CommitRepository';
import { RepositoryRepository } from '../db/repositories/RepositoryRepository';
import { IGithubCommit, IGithubRepository } from '../interface';

export class GitHubService {
    private baseUrl: string;
    private axiosInstance: AxiosInstance;
    private commitRepository: CommitRepository;
    private repositoryRepository: RepositoryRepository;

    constructor(
        baseUrl: string = 'https://api.github.com',
        axiosInstance: AxiosInstance = axios,
        commitRepository: CommitRepository = new CommitRepository(AppDataSource),
        repositoryRepository: RepositoryRepository = new RepositoryRepository(AppDataSource)
    ) {
        this.baseUrl = baseUrl;
        this.axiosInstance = axiosInstance;
        this.commitRepository = commitRepository;
        this.repositoryRepository = repositoryRepository;
    }

    async getCommits(orgName: string, repoName: string, sinceDate?: string, page = 1, perPage = 100): Promise<{ totalRecords: number, commits: IGithubCommit[] }> {
        const commits: IGithubCommit[] = [];
        let hasNextPage = true;

        while (hasNextPage) {
            const params: any = { page, per_page: perPage };
            if (sinceDate) params.since = sinceDate;

            const response = await this.axiosInstance.get(`${this.baseUrl}/repos/${orgName}/${repoName}/commits`, { params });
            if (response.data.length === 0) {
                hasNextPage = false;
            } else {
                commits.push(...response.data.map((commit: any) => ({
                    commitMessage: commit.commit.message || '',
                    author: commit.commit.author.name || '',
                    commitDate: commit.commit.author.date || '',
                    commitUrl: commit.html_url || '',
                })));
                page++;
            }
        }

        const totalRecords = commits.length;
        return { totalRecords, commits };
    }

    async getRepositoryInfo(orgName: string, repoName: string): Promise<IGithubRepository | null> {
        const response = await this.axiosInstance.get(`${this.baseUrl}/repos/${orgName}/${repoName}`);
        const data = response.data;

        return data ? {
            name: data.name || '',
            description: data.description || '',
            url: data.html_url || '',
            language: data.language || '',
            forks_count: data.forks_count || 0,
            stars_count: data.stargazers_count || 0,
            open_issues_count: data.open_issues_count || 0,
            watchers_count: data.watchers_count || 0,
            created_at: data.created_at || '',
            updated_at: data.updated_at || '',
        } : null;
    }

    async getTopCommitAuthors(limit: number): Promise<{ author: string, count: number }[]> {
        const authors = await this.commitRepository.createQueryBuilder('commit')
            .select('commit.author', 'author')
            .addSelect('COUNT(commit.id)', 'count')
            .groupBy('commit.author')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        return authors.map((author: any) => ({
            author: author.author || '',
            count: parseInt(author.count, 10) || 0,
        }));
    }

    async getCommitsByRepositoryName(orgName: string, repoName: string): Promise<IGithubCommit[]> {
        const commits: CommitEntity[] = await this.commitRepository.find({
            where: { repository: { orgName, repoName } },
            relations: ['repository'],
        });

        return commits.map(commit => ({
            commitMessage: commit.commitMessage || '',
            author: commit.author || '',
            commitDate: commit.commitDate || '',
            commitUrl: commit.commitUrl || '',
        }));
    }

    async addRepository({ orgName, repoName }: { orgName: string; repoName: string }): Promise<{ message: string }> {
        const response = await this.axiosInstance.get(`${this.baseUrl}/repos/${orgName}/${repoName}`);
        const repoData: IGithubRepository = {
            name: response.data.name || '',
            description: response.data.description || '',
            url: response.data.html_url || '',
            language: response.data.language || '',
            forks_count: response.data.forks_count || 0,
            stars_count: response.data.stargazers_count || 0,
            open_issues_count: response.data.open_issues_count || 0,
            watchers_count: response.data.watchers_count || 0,
            created_at: response.data.created_at || '',
            updated_at: response.data.updated_at || '',
        };

        let repository = await this.repositoryRepository.findOne({
            where: { orgName, repoName }
        });

        if (repository) {
            repository = this.repositoryRepository.merge(repository, {
                ...repoData,
                updatedAt: new Date(),
            });
        } else {
            repository = this.repositoryRepository.create({
                orgName,
                repoName,
                ...repoData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        await this.repositoryRepository.save(repository);
        parentPort?.postMessage({ event: 'start_commit_indexing', orgName, repoName });

        return { message: `Indexing for repository ${orgName}/${repoName} has been triggered.` };
    }
}

// Export an instance of the GitHubService class
export const gitHubService = new GitHubService();
