import axios from 'axios';
import { GitHubService } from '../services/gitHubService';
import { AppDataSource } from '../ormconfig';
import { CommitEntity } from '../db/entities/CommitEntity';

// Mocking axios and AppDataSource
jest.mock('axios');
jest.mock('../data-source', () => ({
    AppDataSource: {
        getRepository: jest.fn()
    }
    
}));

const mockAxios = axios as jest.Mocked<typeof axios>;

describe('GitHubService', () => {
    let gitHubService: GitHubService;
    let mockCommitRepository: any;
    let mockRepositoryRepository: any;

    beforeEach(() => {
        // Setting up mock repositories
        mockCommitRepository = {
            createQueryBuilder: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            addSelect: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            getRawMany: jest.fn()
        };

        mockRepositoryRepository = {
            findOne: jest.fn(),
            merge: jest.fn(),
            create: jest.fn(),
            save: jest.fn()
        };

        // Mocking getRepository to return our mocks
        jest.spyOn(AppDataSource, 'getRepository')
            .mockImplementation((schema: any) => {
                return schema === CommitEntity ? mockCommitRepository : mockRepositoryRepository;
            });

        gitHubService = new GitHubService();
    });

    test('should fetch commits', async () => {
        const mockResponse = {
            data: [{
                commit: {
                    message: 'Initial commit',
                    author: {
                        name: 'John Doe',
                        date: '2021-08-01T00:00:00Z'
                    }
                },
                html_url: 'http://github.com/commit1'
            }]
        };
        mockAxios.get.mockResolvedValue(mockResponse);

        const result = await gitHubService.getCommits('org', 'repo');
        expect(result.totalRecords).toBe(1);
        expect(result.commits[0].commitMessage).toBe('Initial commit');
    });

    test('should fetch repository info', async () => {
        const mockResponse = {
            data: {
                name: 'repo',
                description: 'A test repository',
                html_url: 'http://github.com/repo',
                language: 'JavaScript',
                forks_count: 5,
                stargazers_count: 10,
                open_issues_count: 2,
                watchers_count: 1,
                created_at: '2021-08-01T00:00:00Z',
                updated_at: '2021-08-02T00:00:00Z'
            }
        };
        mockAxios.get.mockResolvedValue(mockResponse);

        const result = await gitHubService.getRepositoryInfo('org', 'repo');
        expect(result.name).toBe('repo');
        expect(result.description).toBe('A test repository');
    });

    test('should get top commit authors', async () => {
        mockCommitRepository.getRawMany.mockResolvedValue([
            { author: 'John Doe', count: '5' },
            { author: 'Jane Smith', count: '3' }
        ]);

        const result = await gitHubService.getTopCommitAuthors(2);
        expect(result.length).toBe(2);
        expect(result[0].author).toBe('John Doe');
        expect(result[1].count).toBe(3);
    });

    test('should get commits by repository name', async () => {
        mockCommitRepository.find.mockResolvedValue([
            {
                commitMessage: 'Initial commit',
                author: 'John Doe',
                commitDate: '2021-08-01T00:00:00Z',
                commitUrl: 'http://github.com/commit1'
            }
        ]);

        const result = await gitHubService.getCommitsByRepositoryName('org', 'repo');
        expect(result.length).toBe(1);
        expect(result[0].commitMessage).toBe('Initial commit');
    });

    test('should add a repository and trigger indexing', async () => {
        const mockResponse = {
            data: {
                name: 'repo',
                description: 'A test repository',
                html_url: 'http://github.com/repo',
                language: 'JavaScript',
                forks_count: 5,
                stargazers_count: 10,
                open_issues_count: 2,
                watchers_count: 1,
                created_at: '2021-08-01T00:00:00Z',
                updated_at: '2021-08-02T00:00:00Z'
            }
        };
        mockAxios.get.mockResolvedValue(mockResponse);
        mockRepositoryRepository.findOne.mockResolvedValue(null);
        mockRepositoryRepository.create.mockReturnValue({ ...mockResponse.data, createdAt: new Date(), updatedAt: new Date() });
        mockRepositoryRepository.save.mockResolvedValue({ message: 'Indexing for repository org/repo has been triggered.' });

        const result = await gitHubService.addRepository({ orgName: 'org', repoName: 'repo' });
        expect(result.message).toBe('Indexing for repository org/repo has been triggered.');
    });
});
