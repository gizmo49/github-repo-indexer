import { CommitEntity } from "./CommitEntity";

export class RepositoryEntity {
    id: number;
    orgName: string; 
    repoName: string;
    secret: string;
    description: string;
    url: string;
    lastCommitUrl: string;
    language: string;
    forksCount: number;
    starsCount: number;
    openIssuesCount: number;
    watchersCount: number;
    indexingComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
    commits: CommitEntity[];
}
