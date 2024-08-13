import { Repository, DataSource, FindManyOptions } from 'typeorm';
import { CommitEntity } from '../entities/CommitEntity';
import { IRepository } from './interface';

export class CommitRepository implements IRepository<CommitEntity> {
    private repository: Repository<CommitEntity>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(CommitEntity);
    }

    async findOne(criteria: object): Promise<CommitEntity | null> {
        return this.repository.findOneBy(criteria);
    }

    create(data: Partial<CommitEntity>): CommitEntity {
        return this.repository.create(data);
    }

    async save(entity: CommitEntity): Promise<CommitEntity> {
        return this.repository.save(entity);
    }

    createQueryBuilder(alias: string) {
        return this.repository.createQueryBuilder(alias);
    }

    async find(options?: FindManyOptions<CommitEntity>): Promise<CommitEntity[]> {
        return this.repository.find(options);
    }

}
