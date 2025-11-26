import { IRepository } from '../../domain/interfaces/IRepository';
import { SimpleGit, SimpleGitOptions, simpleGit } from 'simple-git';
import { AppConfig } from '../../config/AppConfig';
import { ILogger } from '../../domain/interfaces/ILogger';

/**
 * Implementação do repositório Git usando simple-git
 */
export class GitRepository implements IRepository {
    private readonly _repository: SimpleGit;
    private readonly _config: AppConfig;
    private readonly _logger: ILogger;

    constructor(config: AppConfig, logger: ILogger) {
        this._config = config;
        this._logger = logger;

        const gitOptions: Partial<SimpleGitOptions> = {
            baseDir: config.azureDevOps.defaultWorkingDirectory,
            binary: 'git',
        };

        this._repository = simpleGit(gitOptions);
        this._repository.addConfig('core.pager', 'cat');
        this._repository.addConfig('core.quotepath', 'false');
    }

    async init(): Promise<IRepository> {
        this._logger.debug('Initializing git repository...');
        await this._repository.fetch();
        this._logger.debug('Git repository initialized successfully');
        return this;
    }

    async setupCurrentBranch(): Promise<void> {
        // Necessário apenas para modo dev
        if (this._config.development.isDev && this._config.development.autoSetupPRBranch) {
            const pullRequestBranch = `pull/${this._config.azureDevOps.pullRequestId}/merge`;
            this._logger.info(`Setting up PR branch: ${pullRequestBranch}`);

            await this._repository.fetch('origin', '+refs/pull/*/merge:refs/remotes/pull/*/merge');
            await this._repository.checkout(pullRequestBranch);

            const currentBranch = (await this._repository.branch()).current;
            this._logger.info(`Current branch set to: ${currentBranch}`);
        }
    }

    async getDiff(fileName: string): Promise<string> {
        const targetBranch = this.getTargetBranch();
        const args = [targetBranch, '--', fileName.replace(/^\//, '')];
        
        this._logger.debug(`Getting diff for file: ${fileName}`);
        this._logger.debug(`Git diff args: ${args.join(' ')}`);
        
        const diff = await this._repository.diff(args);
        return diff;
    }

    getTargetBranch(): string {
        const target = this._config.azureDevOps.targetBranch;

        if (!target) {
            throw new Error('Could not find target branch in configuration');
        }

        return `origin/${target}`;
    }
}
