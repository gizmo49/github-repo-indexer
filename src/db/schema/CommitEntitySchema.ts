import { EntitySchema } from 'typeorm';
import { CommitEntity } from '../entities/CommitEntity';


export const CommitEntitySchema = new EntitySchema<CommitEntity>({
    name: 'CommitEntity',
    tableName: 'commit',
    target: CommitEntity,
    columns: {
        id: {
            type: 'int',
            primary: true,
            generated: true,
        },
        commitMessage: {
            type: 'varchar',
            name: 'commit_message',
        },
        author: {
            type: 'varchar',
        },
        commitDate: {
            type: 'varchar',
            name: 'commit_date',
        },
        commitUrl: {
            type: 'varchar',
            name: 'commit_url',
        },
    },
    relations: {
        repository: {
            type: 'many-to-one',
            target: 'RepositoryEntity',  // Use the string name of the target entity
            joinColumn: true,
            inverseSide: 'commits',
        },
    },
});
