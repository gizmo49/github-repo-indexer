export interface IRepository<T> {
    findOne(criteria: object): Promise<T | null>;
    create(data: Partial<T>): T;
    save(entity: T): Promise<T>;
    // Add other methods as needed
}
