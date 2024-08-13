import { Repository, DataSource } from 'typeorm';
import { RepositoryEntity } from '../entities/RepositoryEntity';
import { IRepository } from './interface';

export class RepositoryRepository implements IRepository<RepositoryEntity> {
    private repository: Repository<RepositoryEntity>;

    constructor(dataSource: DataSource) {
        this.repository = dataSource.getRepository(RepositoryEntity);
    }

    async findOne(criteria: object): Promise<RepositoryEntity | null> {
        return this.repository.findOneBy(criteria);
    }

    create(data: Partial<RepositoryEntity>): RepositoryEntity {
        return this.repository.create(data);
    }

    async save(entity: RepositoryEntity): Promise<RepositoryEntity> {
        return this.repository.save(entity);
    }

    merge(target: RepositoryEntity, partialEntity: Partial<RepositoryEntity>): RepositoryEntity {
        return this.repository.merge(target, partialEntity);
    }
}
