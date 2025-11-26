/**
 * Configuração centralizada da aplicação
 * Responsável por carregar e validar todas as configurações necessárias
 */
export interface IAppConfig {
    // OpenAI Configuration
    openai: {
        apiKey: string;
        model: string;
        azureEndpoint?: string;
        azureApiVersion?: string;
    };

    // Azure DevOps Configuration
    azureDevOps: {
        collectionUri: string;
        teamProjectId: string;
        repositoryName: string;
        pullRequestId: string;
        accessToken: string;
        defaultWorkingDirectory: string;
        sourceBranch?: string;
        targetBranch?: string;
    };

    // Review Options
    reviewOptions: {
        checkBugs: boolean;
        checkPerformance: boolean;
        checkBestPractices: boolean;
        modifiedLinesOnly: boolean;
        enableCommentLineCorrection: boolean;
        allowRequeue: boolean;
        verboseLogging: boolean;
    };

    // File Filters
    fileFilters: {
        extensions?: string[];
        extensionExcludes?: string[];
        includes?: string[];
        excludes?: string[];
    };

    // Advanced Options
    advanced: {
        additionalPrompts?: string[];
        confidenceMode: boolean;
        confidenceMinimum: number;
        dedupeAcrossFiles: boolean;
        dedupeAcrossFilesThreshold: number;
    };

    // Development Options
    development: {
        isDev: boolean;
        autoSetupPRBranch: boolean;
    };
}

export class AppConfig implements IAppConfig {
    openai: IAppConfig['openai'];
    azureDevOps: IAppConfig['azureDevOps'];
    reviewOptions: IAppConfig['reviewOptions'];
    fileFilters: IAppConfig['fileFilters'];
    advanced: IAppConfig['advanced'];
    development: IAppConfig['development'];

    constructor(config: IAppConfig) {
        this.openai = config.openai;
        this.azureDevOps = config.azureDevOps;
        this.reviewOptions = config.reviewOptions;
        this.fileFilters = config.fileFilters;
        this.advanced = config.advanced;
        this.development = config.development;
        this.validate();
    }

    private validate(): void {
        if (!this.openai.apiKey) {
            throw new Error('OpenAI API Key is required');
        }

        if (!this.azureDevOps.accessToken && !this.development.isDev) {
            throw new Error('Azure DevOps Access Token is required');
        }

        if (this.advanced.confidenceMinimum < 1 || this.advanced.confidenceMinimum > 10) {
            throw new Error('Confidence minimum must be between 1 and 10');
        }
    }

    /**
     * Verifica se está usando Azure OpenAI
     */
    isAzureOpenAI(): boolean {
        return !!this.openai.azureEndpoint;
    }

    /**
     * Retorna o modelo ou deployment name
     */
    getModelName(): string {
        return this.openai.model || 'gpt-4o';
    }

    /**
     * Converte AppConfig para InputValues (formato legado)
     * Usado para manter compatibilidade com código existente
     */
    toInputValues(): import('../domain/entities/inputValues').InputValues {
        return {
            apiKey: this.openai.apiKey,
            azureApiEndpoint: this.openai.azureEndpoint,
            azureApiVersion: this.openai.azureApiVersion,
            azureModelDeployment: this.openai.model,
            fileExtensions: this.fileFilters.extensions?.join(','),
            fileExtensionExcludes: this.fileFilters.extensionExcludes?.join(','),
            filesToInclude: this.fileFilters.includes?.join(','),
            filesToExclude: this.fileFilters.excludes?.join(','),
            additionalPrompts: this.advanced.additionalPrompts,
            bugs: this.reviewOptions.checkBugs,
            performance: this.reviewOptions.checkPerformance,
            bestPractices: this.reviewOptions.checkBestPractices,
            modifiedLinesOnly: this.reviewOptions.modifiedLinesOnly,
            enableCommentLineCorrection: this.reviewOptions.enableCommentLineCorrection,
            allowRequeue: this.reviewOptions.allowRequeue,
            confidenceMode: this.advanced.confidenceMode,
            confidenceMinimum: this.advanced.confidenceMinimum,
            dedupeAcrossFiles: this.advanced.dedupeAcrossFiles,
            dedupeAcrossFilesThreshold: this.advanced.dedupeAcrossFilesThreshold
        };
    }
}
