import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CommitEntity } from './CommitEntity'; 

@Entity()
export class RepositoryEntity {
    @PrimaryGeneratedColumn()
    id?: number;

    @Column({ nullable: true })
    orgName: string;

    @Column()
    repoName: string;

    @Column()
    secret: string;

    @Column({ nullable: true })
    description: string;

    @Column()
    url: string;

    @Column({ nullable: true })
    lastCommitUrl: string;

    @Column({ nullable: true })
    language: string;

    @Column()
    forksCount: number;

    @Column()
    starsCount: number;

    @Column()
    openIssuesCount: number;

    @Column()
    watchersCount: number;

    @Column()
    indexingComplete: boolean;

    @CreateDateColumn()
    createdAt?: Date;

    @UpdateDateColumn()
    updatedAt?: Date;

    @OneToMany(() => CommitEntity, commit => commit.repository)
    commits?: CommitEntity[];

    constructor() {
        this.orgName = '';
        this.repoName = '';
        this.secret = '';
        this.description = '';
        this.url = '';
        this.lastCommitUrl = '';
        this.language = '';
        this.forksCount = 0;
        this.starsCount = 0;
        this.openIssuesCount = 0;
        this.watchersCount = 0;
        this.indexingComplete = false;
    }
}
