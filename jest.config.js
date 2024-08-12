module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    setupFilesAfterEnv: ['./src/__tests__/setupTests.ts'], // If needed for global setup
};
