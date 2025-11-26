import { AppConfig } from '../config/AppConfig';
import { ILogger } from '../domain/interfaces';
import { IAIClient } from '../domain/interfaces';
import { IRepository } from '../domain/interfaces';
import { IPullRequestService } from '../domain/interfaces';
import { IAzureDevOpsClient } from '../domain/interfaces';

import { TaskLogger } from '../infrastructure/adapters/TaskLogger';
import { GitRepository } from '../infrastructure/adapters/GitRepository';
import { AzureDevOpsHttpClient } from '../infrastructure/adapters/AzureDevOpsHttpClient';
import { OpenAIClient } from '../infrastructure/clients/OpenAIClient';
import { PullRequestService } from '../application/services/PullRequestService';

export interface IServiceContainer {
    logger: ILogger;
    config: AppConfig;
    aiClient: IAIClient;
    repository: IRepository;
    pullRequestService: IPullRequestService;
    adoClient: IAzureDevOpsClient;
}

export class ServiceContainer {
    private static _instance: IServiceContainer | null = null;

    static async create(config: AppConfig): Promise<IServiceContainer> {
        const logger = new TaskLogger();
        const adoClient = new AzureDevOpsHttpClient(config, logger);
        const aiClient = new OpenAIClient(config, logger);
        const repository = new GitRepository(config, logger);
        const pullRequestService = new PullRequestService(adoClient, config, logger);

        await repository.init();

        const container: IServiceContainer = {
            logger,
            config,
            aiClient,
            repository,
            pullRequestService,
            adoClient,
        };

        ServiceContainer._instance = container;
        return container;
    }

    static getInstance(): IServiceContainer {
        if (!ServiceContainer._instance) {
            throw new Error('Service container not initialized. Call ServiceContainer.create() first.');
        }
        return ServiceContainer._instance;
    }

    static clear(): void {
        ServiceContainer._instance = null;
    }
}
