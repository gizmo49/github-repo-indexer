import { jest } from '@jest/globals';

// Mocking external modules
jest.mock('axios', () => ({
    get: jest.fn(),
}));

// Setup global mocks or configurations here

// Example mock for Redis cache (you might need to adjust this depending on your actual usage)
const mockCache = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
};

// Replace actual cache with the mock
jest.mock('../services/cacheService', () => ({
    cache: mockCache,
}));

// Example mock for GitHubService
const mockGitHubService = {
    getCommits: jest.fn(),
    getRepositoryInfo: jest.fn(),
    getTopCommitAuthors: jest.fn(),
    getCommitsByRepositoryName: jest.fn(),
    addRepository: jest.fn(),
};

// Replace actual GitHubService with the mock
jest.mock('../services/GitHubService', () => ({
    gitHubService: mockGitHubService,
}));

// Set up any global test configuration if needed
beforeEach(() => {
    // Reset all mocks before each test to ensure clean state
    jest.clearAllMocks();
});

afterEach(() => {
    // Any global cleanup after each test
});
