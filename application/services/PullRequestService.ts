import { IPullRequestService } from '../../domain/interfaces/IPullRequestService';
import { IAzureDevOpsClient } from '../../domain/interfaces/IAzureDevOpsClient';
import { Thread } from '../../domain/entities/thread';
import { Comment } from '../../domain/entities/comment';
import { IterationRange } from '../../domain/entities/iterationRange';
import { GitPullRequest } from '../../domain/entities/azureDevOps/gitPullRequest';
import { PropertiesCollection } from '../../domain/entities/azureDevOps/propertiesCollection';
import { GitPullRequestIterationChanges } from '../../domain/entities/azureDevOps/gitPullRequestIterationChanges';
import { AppConfig } from '../../config/AppConfig';
import { ILogger } from '../../domain/interfaces/ILogger';

export class PullRequestService implements IPullRequestService {
    private static readonly PRIA_LAST_REVIEWED_KEY = 'Pria.LastReviewedIteration';
    
    private readonly _adoClient: IAzureDevOpsClient;
    private readonly _config: AppConfig;
    private readonly _logger: ILogger;
    private _pullRequest?: GitPullRequest;

    private readonly _collectionUri: string;
    private readonly _teamProjectId: string;
    private readonly _repositoryName: string;
    private readonly _pullRequestId: string;

    constructor(adoClient: IAzureDevOpsClient, config: AppConfig, logger: ILogger) {
        this._adoClient = adoClient;
        this._config = config;
        this._logger = logger;

        this._collectionUri = config.azureDevOps.collectionUri;
        this._teamProjectId = config.azureDevOps.teamProjectId;
        this._repositoryName = config.azureDevOps.repositoryName;
        this._pullRequestId = config.azureDevOps.pullRequestId;
    }

    private getBaseUri(): string {
        return `${this._collectionUri}${this._teamProjectId}/_apis/git/repositories/${this._repositoryName}`;
    }

    private getPullRequestBaseUri(): string {
        return `${this.getBaseUri()}/pullRequests/${this._pullRequestId}`;
    }

    async getPullRequest(): Promise<GitPullRequest> {
        if (this._pullRequest) return this._pullRequest;

        this._logger.debug(`Getting pull request ${this._pullRequestId}`);
        const endpoint = `${this.getPullRequestBaseUri()}/?api-version=7.0`;
        this._pullRequest = await this._adoClient.get<GitPullRequest>(endpoint);
        return this._pullRequest;
    }

    async getLatestIterationId(): Promise<number> {
        const endpoint = `${this.getPullRequestBaseUri()}/iterations?api-version=7.0`;
        this._logger.debug(`Fetching iterations for pull request ${this._pullRequestId}`);

        const iterations = await this._adoClient.get<{ value: { id: number }[] }>(endpoint);
        if (!iterations.value || iterations.value.length === 0) {
            throw new Error(`No iterations found for pull request ${this._pullRequestId}`);
        }

        const latestIteration = Math.max(...iterations.value.map((iteration) => iteration.id));
        this._logger.info(`Latest iteration ID: ${latestIteration}`);

        return latestIteration;
    }

    async getIterationFiles({ start, end }: IterationRange): Promise<string[]> {
        this._logger.debug(`Getting files for iteration ${start}-${end}`);

        const endpoint = `${this.getPullRequestBaseUri()}/iterations/${end}/changes?api-version=7.0&$compareTo=${start}`;
        const result = await this._adoClient.get<GitPullRequestIterationChanges>(endpoint);

        const files = result.changeEntries
            .map(({ item }) => item.path)
            .filter((file) => !!file);
        
        this._logger.debug(`Files in iteration ${start}-${end}: ${JSON.stringify(files)}`);
        return files;
    }

    async getLastReviewedIteration(): Promise<IterationRange> {
        const endpoint = `${this.getPullRequestBaseUri()}/properties?api-version=7.0`;
        const properties = await this._adoClient.get<PropertiesCollection>(endpoint);
        const value = properties.value[PullRequestService.PRIA_LAST_REVIEWED_KEY]?.$value;
        
        if (!value) {
            this._logger.info('No last reviewed iteration found, returning default range.');
            return { start: 0, end: 0 };
        }
        
        const lastReviewedIteration = JSON.parse(value) as IterationRange;
        this._logger.info(`Last reviewed iteration ${value}`);
        return lastReviewedIteration;
    }

    async saveLastReviewedIteration({ start, end }: IterationRange): Promise<boolean> {
        this._logger.debug(`Saving last reviewed iteration ${start}-${end}`);
        const endpoint = `${this.getPullRequestBaseUri()}/properties?api-version=7.0`;
        const body = [
            {
                op: 'replace',
                path: `/${PullRequestService.PRIA_LAST_REVIEWED_KEY}`,
                value: JSON.stringify({ start, end } as IterationRange),
            },
        ];

        const response = await this._adoClient.patch(endpoint, body);
        return response.ok;
    }

    async getCommentsForFile(fileName: string): Promise<Comment[]> {
        const endpoint = `${this.getPullRequestBaseUri()}/threads?api-version=7.0`;
        const threads = await this._adoClient.get<{ value: Thread[] }>(endpoint);

        const comments: Comment[] = [];
        for (const thread of threads.value) {
            if (thread.threadContext?.filePath === fileName) {
                comments.push(...thread.comments);
            }
        }

        return comments;
    }

    async addThread(thread: Thread): Promise<void> {
        const endpoint = `${this.getPullRequestBaseUri()}/threads?api-version=7.0`;
        this._logger.debug(`Adding thread to file: ${thread.threadContext.filePath}`);
        
        const response = await this._adoClient.post(endpoint, thread);
        
        if (!response.ok) {
            this._logger.warning(`Failed to add thread: ${response.statusText}`);
        }
    }
}
