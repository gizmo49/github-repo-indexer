import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { RepositoryEntity } from './RepositoryEntity';

@Entity()
export class CommitEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column()
    commitMessage?: string;

    @Column()
    author?: string;

    @Column()
    commitDate?: string;

    @Column()
    commitUrl?: string;

    @ManyToOne(() => RepositoryEntity, repository => repository.commits)
    repository?: RepositoryEntity;
}
