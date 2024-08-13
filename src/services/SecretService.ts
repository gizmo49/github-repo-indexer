import { AppDataSource } from '../ormconfig';
import { RepositoryEntity } from '../db/entities/RepositoryEntity';

export const getRepositorySecret = async (repoName: string, orgName: string): Promise<string | null> => {
    const repositoryRepo = AppDataSource.getRepository(RepositoryEntity); // Use schema

    try {
        const repository = await repositoryRepo.findOne({
            where: { repoName, orgName}
        });

        return repository ? repository.secret : null;
    } catch (error: any) {
        console.error('Error fetching repository secret:', error.message);
        return null;
    }
};
