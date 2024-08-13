export interface IGithubRepository {
    name: string;
    description: string;
    url: string;
    language: string;
    forks_count: number;
    stars_count: number;
    open_issues_count: number;
    watchers_count: number;
    created_at: string;
    updated_at: string;
}

export interface IGithubCommit {
    commitMessage: string;  
    author: string;        
    commitDate: string;     
    commitUrl: string;      
}
