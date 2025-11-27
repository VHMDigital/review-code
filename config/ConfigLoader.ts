import tl from '../utils/taskWrapper';
import { AppConfig, IAppConfig } from './AppConfig';

export class ConfigLoader {
    static load(): AppConfig {
        const config: IAppConfig = {
            openai: {
                apiKey: tl.getInput('api_key', true) || '',
                model: tl.getInput('ai_model', false) || 'gpt-4o',
                azureEndpoint: tl.getInput('api_endpoint', false) || undefined,
                azureApiVersion: tl.getInput('api_version', false) || undefined,
            },

            azureDevOps: {
                collectionUri: tl.getVariable('System.TeamFoundationCollectionUri') || '',
                teamProjectId: tl.getVariable('System.TeamProjectId') || '',
                repositoryName: tl.getVariable('Build.Repository.Name') || '',
                pullRequestId: tl.getVariable('System.PullRequest.PullRequestId') || '',
                accessToken: tl.getVariable('System.AccessToken') || '',
                defaultWorkingDirectory: tl.getVariable('System.DefaultWorkingDirectory') || '',
                sourceBranch: tl.getVariable('System.PullRequest.SourceBranch'),
                targetBranch: tl.getVariable('System.PullRequest.TargetBranchName') || 
                              tl.getVariable('System.PullRequest.TargetBranch')?.replace('refs/heads/', ''),
            },

            reviewOptions: {
                checkBugs: tl.getBoolInput('bugs', false),
                checkPerformance: tl.getBoolInput('performance', false),
                checkBestPractices: tl.getBoolInput('best_practices', false),
                cleanCode: tl.getBoolInput('clean_code', false),
                decoupling: tl.getBoolInput('decoupling', false),
                improvementSuggestions: tl.getBoolInput('improvement_suggestions', false),
                modifiedLinesOnly: tl.getBoolInput('modified_lines_only', false),
                enableCommentLineCorrection: tl.getBoolInput('comment_line_correction', false),
                allowRequeue: tl.getBoolInput('allow_requeue', false),
                verboseLogging: tl.getBoolInput('verbose_logging', false),
            },

            fileFilters: {
                extensions: this.parseArray(tl.getInput('file_extensions', false)),
                extensionExcludes: this.parseArray(tl.getInput('file_extension_excludes', false)),
                includes: this.parseArray(tl.getInput('file_includes', false)),
                excludes: this.parseArray(tl.getInput('file_excludes', false)),
            },

            advanced: {
                additionalPrompts: this.parseArray(tl.getInput('additional_prompts', false)),
                confidenceMode: tl.getBoolInput('confidence_mode', false),
                confidenceMinimum: parseInt(tl.getInput('confidence_minimum', false) || '9', 10),
                dedupeAcrossFiles: tl.getBoolInput('dedupe_across_files', false),
                dedupeAcrossFilesThreshold: parseInt(
                    tl.getInput('dedupe_across_files_threshold', false) || '10',
                    10
                ),
            },

            development: {
                isDev: tl.isDev(),
                autoSetupPRBranch: tl.getVariable('Auto_Setup_PR_Branch') === 'true',
            },
        };

        return new AppConfig(config);
    }

    private static parseArray(input?: string): string[] | undefined {
        if (!input) return undefined;
        return input
            .split(',')
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
    }

    static logConfig(config: AppConfig): void {
        console.info('=== Application Configuration ===');
        console.info('OpenAI:');
        console.info(`  API Key: ${'*'.repeat(10)}`);
        console.info(`  Model: ${config.openai.model}`);
        console.info(`  Azure Endpoint: ${config.openai.azureEndpoint || 'N/A'}`);
        console.info(`  Azure API Version: ${config.openai.azureApiVersion || 'N/A'}`);
        
        console.info('Azure DevOps:');
        console.info(`  Collection URI: ${config.azureDevOps.collectionUri}`);
        console.info(`  Team Project ID: ${config.azureDevOps.teamProjectId}`);
        console.info(`  Repository: ${config.azureDevOps.repositoryName}`);
        console.info(`  Pull Request ID: ${config.azureDevOps.pullRequestId}`);
        console.info(`  Access Token: ${'*'.repeat(10)}`);
        
        console.info('Review Options:');
        console.info(`  Check Bugs: ${config.reviewOptions.checkBugs}`);
        console.info(`  Check Performance: ${config.reviewOptions.checkPerformance}`);
        console.info(`  Check Best Practices: ${config.reviewOptions.checkBestPractices}`);
        console.info(`  Clean Code: ${config.reviewOptions.cleanCode}`);
        console.info(`  Decoupling: ${config.reviewOptions.decoupling}`);
        console.info(`  Improvement Suggestions: ${config.reviewOptions.improvementSuggestions}`);
        console.info(`  Modified Lines Only: ${config.reviewOptions.modifiedLinesOnly}`);
        console.info(`  Comment Line Correction: ${config.reviewOptions.enableCommentLineCorrection}`);
        
        console.info('Advanced:');
        console.info(`  Confidence Mode: ${config.advanced.confidenceMode}`);
        console.info(`  Confidence Minimum: ${config.advanced.confidenceMinimum}`);
        console.info(`  Dedupe Across Files: ${config.advanced.dedupeAcrossFiles}`);
        
        console.info('Development:');
        console.info(`  Is Dev Mode: ${config.development.isDev}`);
        console.info('=================================');
    }
}
