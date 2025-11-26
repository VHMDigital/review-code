export interface IAppConfig {
    openai: {
        apiKey: string;
        model: string;
        azureEndpoint?: string;
        azureApiVersion?: string;
    };

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

    reviewOptions: {
        checkBugs: boolean;
        checkPerformance: boolean;
        checkBestPractices: boolean;
        modifiedLinesOnly: boolean;
        enableCommentLineCorrection: boolean;
        allowRequeue: boolean;
        verboseLogging: boolean;
    };

    fileFilters: {
        extensions?: string[];
        extensionExcludes?: string[];
        includes?: string[];
        excludes?: string[];
    };

    advanced: {
        additionalPrompts?: string[];
        confidenceMode: boolean;
        confidenceMinimum: number;
        dedupeAcrossFiles: boolean;
        dedupeAcrossFilesThreshold: number;
    };

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

    isAzureOpenAI(): boolean {
        return !!this.openai.azureEndpoint;
    }

    getModelName(): string {
        return this.openai.model || 'gpt-4o';
    }

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
