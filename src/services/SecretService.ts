import { AppDataSource } from '../data-source';
import { RepositoryEntitySchema } from '../db/schema/RepositoryEntitySchema';

export const getRepositorySecret = async (repoName: string, orgName: string): Promise<string | null> => {
    const repositoryRepo = AppDataSource.getRepository(RepositoryEntitySchema); // Use schema

    try {
        const repository = await repositoryRepo.findOne({
            where: { repoName, orgName}
        });

        return repository ? repository.secret : null;
    } catch (error) {
        console.error('Error fetching repository secret:', error.message);
        return null;
    }
};
