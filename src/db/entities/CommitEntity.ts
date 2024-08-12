import { RepositoryEntity } from "./RepositoryEntity";

export class CommitEntity {
    id: number;
    commitMessage: string;
    author: string;
    commitDate: string;
    commitUrl: string;
    repository: RepositoryEntity;
}
