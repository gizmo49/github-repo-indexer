import { AppDataSource } from '../ormconfig'; // Ensure AppDataSource is imported
import { RepositoryEntity } from '../db/entities/RepositoryEntity';
import { CommitEntity } from '../db/entities/CommitEntity';
import { gitHubService } from '../services/gitHubService';
import commitQueue from '../queues/commitQueue';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { monitoringService } from '../services/monitoringService';
import { IRepository } from '../db/repositories/interface';

// Define mock repositories
let repoRepositoryMock: DeepMockProxy<IRepository<RepositoryEntity>>;
let commitRepositoryMock: DeepMockProxy<IRepository<CommitEntity>>;

// Mock gitHubService methods
jest.mock('../services/gitHubService', () => ({
    gitHubService: {
        getRepositoryInfo: jest.fn().mockResolvedValue({ orgName: 'chromium', repoName: 'chromium' }),
        getCommits: jest.fn().mockResolvedValue({ commits: [
            {
                sha: 'commit-sha-1',
                message: 'Initial commit',
                author: { name: 'Author 1', email: 'author1@example.com' },
                url: 'https://github.com/chromium/chromium/commit/commit-sha-1'
            },
            {
                sha: 'commit-sha-2',
                message: 'Second commit',
                author: { name: 'Author 2', email: 'author2@example.com' },
                url: 'https://github.com/chromium/chromium/commit/commit-sha-2'
            }
        ] })
    }
}));

// Mock commitQueue methods
jest.mock('../queues/commitQueue', () => ({
    add: jest.fn().mockResolvedValue({})
}));

describe('MonitoringService', () => {
    beforeEach(() => {
        jest.useFakeTimers(); // Use fake timers for setInterval
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers(); // Restore real timers after each test
    });

    describe('seedChromiumRepository', () => {
        beforeEach(async () => {
            // Increase timeout to handle initialization
            jest.setTimeout(10000); // Increase timeout for this block if necessary

            // Initialize AppDataSource only for this test suite
            await AppDataSource.initialize();

            repoRepositoryMock = mockDeep<IRepository<RepositoryEntity>>();
            commitRepositoryMock = mockDeep<IRepository<CommitEntity>>();

            // Mock getRepository to return the mocks
            (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
                if (entity === RepositoryEntity) {
                    return repoRepositoryMock;
                }
                if (entity === CommitEntity) {
                    return commitRepositoryMock;
                }
                throw new Error('Unknown entity type');
            });
        });

        afterEach(async () => {
            // Clean up the AppDataSource after this test suite
            try {
                await AppDataSource.destroy();
            } catch (error) {
                console.error('Error during AppDataSource cleanup:', error);
            }
        });

        test('should initialize Chromium repository', async () => {
            repoRepositoryMock.findOne.mockResolvedValue(null); // Simulate repository not found

            const spyEnsureRepository = jest.spyOn(monitoringService, 'ensureRepository');
            await monitoringService.seedChromiumRepository();

            expect(spyEnsureRepository).toHaveBeenCalledWith('chromium', 'chromium');
        });

        test('should handle repository errors during seeding', async () => {
            (gitHubService.getRepositoryInfo as jest.Mock).mockResolvedValueOnce(null);

            await expect(monitoringService.seedChromiumRepository())
                .rejects
                .toThrow('Error seeding Chromium repository: Repository chromium/chromium does not exist');
        });
    });

    test('should process repositories and handle errors', async () => {
        const spyProcessRepositories = jest.spyOn(monitoringService, 'processRepositories');
        monitoringService.startMonitoring();

        jest.advanceTimersByTime(60 * 60 * 1000); // Fast-forward time to trigger the interval

        expect(spyProcessRepositories).toHaveBeenCalled();
    });

    test('should handle errors in indexing commits', async () => {
        (gitHubService.getCommits as jest.Mock).mockRejectedValueOnce(new Error('Fetch commits error'));

        await expect(monitoringService.indexCommits('chromium', 'chromium', 'url'))
            .rejects
            .toThrow('Error indexing commits for chromium/chromium');
    });
});
