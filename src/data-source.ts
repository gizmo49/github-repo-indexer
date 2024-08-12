import { DataSource } from 'typeorm';
import { CommitEntitySchema } from './db/schema/CommitEntitySchema';
import { RepositoryEntitySchema } from './db/schema/RepositoryEntitySchema';

const dotenv = require('dotenv');
dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: true,
    synchronize: true,
    logging: false,
    entities: [CommitEntitySchema, RepositoryEntitySchema], // Use schemas
});
