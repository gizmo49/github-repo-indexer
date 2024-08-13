import { DataSource } from 'typeorm';
import { CommitEntity } from './db/entities/CommitEntity';
import { RepositoryEntity } from './db/entities/RepositoryEntity';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
    synchronize: false, // Should be false in production
    logging: false,
    entities: [CommitEntity, RepositoryEntity],
    migrations: ['src/db/migrations/*.ts'], // Path to your migrations
    subscribers: [],
});

