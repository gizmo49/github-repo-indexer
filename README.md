# GitHub Monitor Service

A Node.js service that monitors GitHub repositories for commits and processes them asynchronously. The service uses TypeScript, TypeORM, and Bull for job management.

## Features

- Monitors GitHub repositories for new commits
- Processes commits using a background job queue (Bull)
- Caches commit data to avoid reprocessing
- Stores commit and repository data in PostgreSQL
- Validates GitHub webhook signatures
- Handles multiple repositories with individual secrets

## Getting Started

### Prerequisites

- Node.js (>=14.x)
- PostgreSQL
- Redis

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/github-monitor-service.git
   cd github-monitor-service
