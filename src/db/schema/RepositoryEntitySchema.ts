import { EntitySchema } from 'typeorm';
import { RepositoryEntity } from '../entities/RepositoryEntity';

export const RepositoryEntitySchema = new EntitySchema<RepositoryEntity>({
    name: 'RepositoryEntity',
    tableName: 'repository',
    target: RepositoryEntity,
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true,
        },
        repoName: {
            type: 'varchar',
            unique: true,
        },
        secret: {
            type: 'varchar',
        },
        description: {
            type: 'varchar',
        },
        url: {
            type: 'varchar',
        },
        language: {
            type: 'varchar',
        },
        forksCount: {
            type: 'int',
        },
        starsCount: {
            type: 'int',
        },
        openIssuesCount: {
            type: 'int',
        },
        watchersCount: {
            type: 'int',
        },
        indexingComplete: {
            type: 'boolean',
            default: false,
        },
        createdAt: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP',
        },
        updatedAt: {
            type: 'timestamp',
            default: () => 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
        },
    },
    relations: {
        commits: {
            type: 'one-to-many',
            target: 'CommitEntity',  // Use the string name of the target entity
            inverseSide: 'repository',
        },
    },
});
