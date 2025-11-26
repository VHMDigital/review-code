/**
 * Service Container - Dependency Injection Container
 * Responsável por criar e gerenciar todas as dependências da aplicação
 */

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

/**
 * Container de serviços com todas as dependências configuradas
 */
export interface IServiceContainer {
    logger: ILogger;
    config: AppConfig;
    aiClient: IAIClient;
    repository: IRepository;
    pullRequestService: IPullRequestService;
    adoClient: IAzureDevOpsClient;
}

/**
 * Factory para criar o container de serviços
 */
export class ServiceContainer {
    private static _instance: IServiceContainer | null = null;

    /**
     * Cria e configura todas as dependências da aplicação
     * @param config Configuração da aplicação
     * @returns Container com todas as dependências configuradas
     */
    static async create(config: AppConfig): Promise<IServiceContainer> {
        // Logger é a primeira dependência (sem dependências)
        const logger = new TaskLogger();

        // Clientes HTTP (dependem de config e logger)
        const adoClient = new AzureDevOpsHttpClient(config, logger);

        // Clientes de serviços (dependem de config, logger e outros clientes)
        const aiClient = new OpenAIClient(config, logger);
        const repository = new GitRepository(config, logger);
        const pullRequestService = new PullRequestService(adoClient, config, logger);

        // Inicializa repositório
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

    /**
     * Obtém a instância do container (se já foi criada)
     */
    static getInstance(): IServiceContainer {
        if (!ServiceContainer._instance) {
            throw new Error('Service container not initialized. Call ServiceContainer.create() first.');
        }
        return ServiceContainer._instance;
    }

    /**
     * Limpa a instância do container (útil para testes)
     */
    static clear(): void {
        ServiceContainer._instance = null;
    }
}
