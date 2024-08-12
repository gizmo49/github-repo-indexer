import axios from 'axios';
import { CommitDTO } from '../dtos/CommitDTO';
import { RepositoryDTO } from '../dtos/RepositoryDTO';
import { AppDataSource } from '../data-source';
import { CommitEntitySchema } from '../db/schema/CommitEntitySchema';
import { RepositoryEntitySchema } from '../db/schema/RepositoryEntitySchema';
import { parentPort } from 'worker_threads';

// Define the GitHubService class
export class GitHubService {
    private baseUrl = 'https://api.github.com';

    /**
     * Fetch commits from a repository.
     * @param repoName - The name of the repository.
     * @param sinceDate - Optional date to filter commits since.
     * @param page - Page number for pagination.
     * @param perPage - Number of commits per page.
     * @returns An object containing totalRecords and an array of commits.
     */
    async getCommits(orgName: string, repoName: string, sinceDate?: string, page = 1, perPage = 100): Promise<{ totalRecords: number, commits: CommitDTO[] }> {
        const commits: CommitDTO[] = [];
        let hasNextPage = true;

        while (hasNextPage) {
            const params: any = { page, per_page: perPage };
            if (sinceDate) params.since = sinceDate;

            const response = await axios.get(`${this.baseUrl}/repos/${orgName}/${repoName}/commits`, { params });
            if (response.data.length === 0) {
                hasNextPage = false;
            } else {
                commits.push(...response.data.map((commit: any) => ({
                    commitMessage: commit.commit.message,
                    author: commit.commit.author.name,
                    commitDate: commit.commit.author.date,
                    commitUrl: commit.html_url,
                })));
                page++;
            }
        }

        const totalRecords = commits.length; // For simplicity; GitHub API doesn't provide total count directly
        return { totalRecords, commits };
    }

    /**
     * Fetch information about a repository.
     * @param orgName - The name of the organization.
     * @param repoName - The name of the repository.
     * @returns An object containing repository information.
     */
    async getRepositoryInfo(orgName: string, repoName: string): Promise<RepositoryDTO> {
        const response = await axios.get(`${this.baseUrl}/repos/${orgName}/${repoName}`);
        const data = response.data;
        return {
            name: data.name,
            description: data.description,
            url: data.html_url,
            language: data.language,
            forks_count: data.forks_count,
            stars_count: data.stargazers_count,
            open_issues_count: data.open_issues_count,
            watchers_count: data.watchers_count,
            created_at: data.created_at,
            updated_at: data.updated_at,
        };
    }

    /**
     * Fetch top N commit authors by commit counts from the database.
     * @param limit - Number of top authors to retrieve.
     * @returns An array of top commit authors with their commit counts.
     */
    async getTopCommitAuthors(limit: number): Promise<{ author: string, count: number }[]> {
        const commitRepository = AppDataSource.getRepository(CommitEntitySchema);
        const authors = await commitRepository
            .createQueryBuilder('commit')
            .select('commit.author', 'author')
            .addSelect('COUNT(commit.id)', 'count')
            .groupBy('commit.author')
            .orderBy('count', 'DESC')
            .limit(limit)
            .getRawMany();

        return authors.map(author => ({
            author: author.author,
            count: parseInt(author.count, 10),
        }));
    }

    /**
     * Retrieve commits of a repository by repository name from the database.
     * @param orgName - The name of the organization.
     * @param repoName - The name of the repository.
     * @returns An array of commits.
     */
    async getCommitsByRepositoryName(orgName: string, repoName: string): Promise<CommitDTO[]> {
        const commitRepository = AppDataSource.getRepository(CommitEntitySchema);
        const commits = await commitRepository.find({
            where: { repository: { orgName, repoName } },
            relations: ['repository'],
        });

        return commits.map(commit => ({
            commitMessage: commit.commitMessage,
            author: commit.author,
            commitDate: commit.commitDate,
            commitUrl: commit.commitUrl,
        }));
    }

    /**
     * Add a new repository to the database or update it if it already exists.
     * @param orgName - The name of the organization.
     * @param repoName - The name of the repository.
     * @returns An object with a message indicating the status of the operation.
     */
    async addRepository({ orgName, repoName }: { orgName: string; repoName: string }): Promise<{ message: string }> {
        const repositoryRepository = AppDataSource.getRepository(RepositoryEntitySchema);

        // Fetch repository information from GitHub API
        const response = await axios.get(`${this.baseUrl}/repos/${orgName}/${repoName}`);
        const repoData: RepositoryDTO = {
            name: response.data.name,
            description: response.data.description,
            url: response.data.html_url,
            language: response.data.language,
            forks_count: response.data.forks_count,
            stars_count: response.data.stargazers_count,
            open_issues_count: response.data.open_issues_count,
            watchers_count: response.data.watchers_count,
            created_at: response.data.created_at,
            updated_at: response.data.updated_at,
        };

        // Check if the repository already exists
        let repository = await repositoryRepository.findOne({
            where: { orgName, repoName }
        });

        if (repository) {
            // Update the existing repository
            repository = repositoryRepository.merge(repository, {
                ...repoData,
                updatedAt: new Date(),
            });
        } else {
            // Create a new repository entity
            repository = repositoryRepository.create({
                orgName,
                repoName,
                ...repoData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        }

        // Save the repository entity to the database
        await repositoryRepository.save(repository);

        // Trigger commit indexing
        const commitRepository = AppDataSource.getRepository(CommitEntitySchema);
        parentPort?.postMessage({ event: 'start_commit_indexing', orgName, repoName });

        // Return a response indicating that indexing has been triggered
        return { message: `Indexing for repository ${orgName}/${repoName} has been triggered.` };
    }
}

// Export an instance of the GitHubService class
export const gitHubService = new GitHubService();
