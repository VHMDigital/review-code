import { IServiceContainer } from '../../config/ServiceContainer';
import { filterFilesForReview } from '../../shared/utils/fileUtils';
import { CommentUtils } from '../../shared/utils/commentUtils';
import { Comment } from '../../domain/entities';
import { Thread } from '../../domain/entities';
import { Review } from '../../domain/entities';
import { ReviewResult } from '../../domain/entities';

/**
 * Use Case: Realizar revisão completa de um Pull Request
 * 
 * Este é o caso de uso principal que orquestra todo o processo de revisão:
 * 1. Valida se é um trigger válido (PR)
 * 2. Obtém o range de iterações a revisar
 * 3. Filtra arquivos para revisão
 * 4. Executa revisão com IA
 * 5. Processa e adiciona comentários
 * 6. Salva estado da revisão
 */
export class ReviewPullRequestUseCase {
    private readonly container: IServiceContainer;

    constructor(container: IServiceContainer) {
        this.container = container;
    }

    /**
     * Executa a revisão completa do Pull Request
     */
    async execute(): Promise<void> {
        const { logger, config, repository, pullRequestService, aiClient } = this.container;

        try {
            // Validação inicial
            if (!this.isValidTrigger()) {
                return;
            }

            logger.info('Starting Pull Request review process...');

            // Configuração do repositório
            await repository.setupCurrentBranch();

            // Determina o range de revisão
            const { reviewRange, isRequeued } = await this.getReviewRange();
            
            if (isRequeued && !config.reviewOptions.allowRequeue) {
                logger.info('No new changes detected since last review and requeue is disabled. Skipping pull request review.');
                return;
            }

            // Obtém arquivos modificados
            const iterationFiles = await pullRequestService.getIterationFiles(reviewRange);
            logger.info(`Found ${iterationFiles.length} changed files in this run:`);

            // Filtra arquivos para revisão
            const filesToReview = this.filterFiles(iterationFiles);
            logger.info(`After filtering, ${filesToReview.length} files will be reviewed:`, filesToReview);

            if (filesToReview.length === 0) {
                logger.info('No files to review after filtering.');
                logger.setResult('succeeded', 'No files to review.');
                return;
            }

            // Executa revisão dos arquivos
            const reviewResults = await this.reviewFiles(filesToReview);

            // Processa e adiciona comentários
            await this.processReviewResults(reviewResults);

            // Salva estado da última revisão
            await pullRequestService.saveLastReviewedIteration(reviewRange);

            logger.setResult('succeeded', 'Pull Request reviewed.');
            logger.info('Pull Request review completed successfully.');
        } catch (error) {
            logger.error('Error during pull request review', error);
            logger.setResult('failed', `Pull Request review failed: ${error}`);
            throw error;
        }
    }

    /**
     * Valida se o trigger é válido (deve ser PR)
     */
    private isValidTrigger(): boolean {
        const { logger } = this.container;
        const buildReason = this.container.config.azureDevOps.collectionUri ? 'PullRequest' : 'Manual';

        if (buildReason !== 'PullRequest' && !this.container.config.development.isDev) {
            logger.setResult('skipped', 'This task must only be used when triggered by a Pull Request.');
            return false;
        }

        if (!this.container.config.azureDevOps.accessToken && !this.container.config.development.isDev) {
            logger.setResult(
                'failed',
                "'Allow Scripts to Access OAuth Token' must be enabled. See https://learn.microsoft.com/en-us/azure/devops/pipelines/build/options?view=azure-devops#allow-scripts-to-access-the-oauth-token for more information"
            );
            return false;
        }

        return true;
    }

    /**
     * Determina o range de iterações a revisar
     */
    private async getReviewRange() {
        const { logger, pullRequestService } = this.container;

        const lastReviewedIteration = await pullRequestService.getLastReviewedIteration();
        const latestIterationId = await pullRequestService.getLatestIterationId();

        let reviewRange = { start: lastReviewedIteration.end, end: latestIterationId };
        const isRequeued = lastReviewedIteration.end === latestIterationId;

        logger.info(`Is requeued: ${isRequeued}`);

        if (isRequeued) {
            reviewRange = { ...lastReviewedIteration };
        }

        return { reviewRange, isRequeued };
    }

    /**
     * Filtra arquivos baseado nas configurações
     */
    private filterFiles(iterationFiles: string[]): string[] {
        const { fileFilters } = this.container.config;

        return filterFilesForReview({
            fileExtensions: fileFilters.extensions?.join(','),
            fileExtensionExcludes: fileFilters.extensionExcludes?.join(','),
            filesToInclude: fileFilters.includes?.join(','),
            filesToExclude: fileFilters.excludes?.join(','),
            files: iterationFiles,
        });
    }

    /**
     * Executa a revisão de todos os arquivos
     */
    private async reviewFiles(filesToReview: string[]): Promise<ReviewResult[]> {
        const { logger, config, repository, pullRequestService, aiClient } = this.container;

        logger.setProgress(0, 'Step 1: Performing Code Review');
        logger.info('Starting code review process...');

        const reviewResults: ReviewResult[] = [];
        let currentRunComments: Comment[] = [];
        let deduplicationCriteriaMet = false;

        for (const [index, fileName] of filesToReview.entries()) {
            logger.info(`Reviewing file ${index + 1}/${filesToReview.length}: ${fileName}`);

            // Obtém comentários existentes
            const existingFileComments = await pullRequestService.getCommentsForFile(fileName);
            const [commentsForExclusion, newDedupeMet] = CommentUtils.getCommentContentForExclusion(
                existingFileComments,
                currentRunComments,
                config.toInputValues(),
                deduplicationCriteriaMet
            );
            deduplicationCriteriaMet = newDedupeMet;

            logger.info('Existing file comments: ' + existingFileComments.length);
            logger.info('Current run comments: ' + currentRunComments.length);
            logger.info('Comments for exclusion: ' + commentsForExclusion.length, commentsForExclusion);

            // Obtém diff e executa revisão
            const diff = await repository.getDiff(fileName);
            const codeReview = await aiClient.performCodeReview(diff, fileName, commentsForExclusion);

            // Coleta novos comentários
            const newComments = codeReview.threads.flatMap((thread) => thread.comments);
            currentRunComments.push(...newComments);

            reviewResults.push({ fileName, codeReview });

            // Atualiza progresso
            const progressPercent = ((index + 1) / filesToReview.length) * 50;
            logger.setProgress(progressPercent, `Step 1: Performing Code Review (${index + 1}/${filesToReview.length})`);
            logger.info(`Completed review of file ${fileName}`);
        }

        return reviewResults;
    }

    /**
     * Processa os resultados da revisão e adiciona threads
     */
    private async processReviewResults(reviewResults: ReviewResult[]): Promise<void> {
        const { logger, config, pullRequestService } = this.container;

        const filteredReviewResults = JSON.parse(JSON.stringify(reviewResults));

        logger.setProgress(50, 'Step 2: Adding Review Threads');
        logger.info('Starting to process review results and add threads...');

        for (let index = 0; index < filteredReviewResults.length; index++) {
            const { codeReview, fileName } = filteredReviewResults[index];
            logger.info(`Processing threads for file ${index + 1}/${filteredReviewResults.length}: ${fileName}`);

            if (codeReview && codeReview.threads) {
                for (const thread of codeReview.threads) {
                    this.processThread(thread);
                    await pullRequestService.addThread(thread);
                }
            }

            const progressPercent = 50 + ((index + 1) / filteredReviewResults.length) * 50;
            logger.setProgress(
                progressPercent,
                `Step 2: Adding Review Threads (${index + 1}/${filteredReviewResults.length})`
            );
        }

        // Resumo da revisão
        const summary = this.summarizeReviewResults(reviewResults, filteredReviewResults);
        this.logReviewSummary(summary);
    }

    /**
     * Processa uma thread individual (filtra por confiança se necessário)
     */
    private processThread(thread: Thread): void {
        const { logger, config } = this.container;

        logger.info(`Processing thread: ${thread.threadContext.filePath}`);
        
        if (config.advanced.confidenceMode) {
            const totalComments = thread.comments.length;
            const { filteredOut, remaining } = CommentUtils.filterCommentsByConfidence(
                thread.comments,
                config.advanced.confidenceMinimum
            );
            thread.comments = remaining;

            logger.info(`Total comments: ${totalComments}`);
            logger.info(`Filtered out comments (${filteredOut.length}):`);
            filteredOut.forEach((comment) => logger.info(`- [${comment.confidenceScore ?? 'N/A'}] ${comment.content}`));
            logger.info(`Remaining comments (${remaining.length}):`);
            remaining.forEach((comment) => logger.info(`- [${comment.confidenceScore ?? 'N/A'}] ${comment.content}`));
        }
    }

    /**
     * Gera resumo dos resultados da revisão
     */
    private summarizeReviewResults(
        reviewResults: ReviewResult[],
        filteredReviewResults: ReviewResult[]
    ): { totalComments: number; remainingComments: number; filteredOutComments: number } {
        const summary = { totalComments: 0, remainingComments: 0, filteredOutComments: 0 };

        for (let index = 0; index < reviewResults.length; index++) {
            const reviewResult = reviewResults[index];
            const filteredReviewResult = filteredReviewResults[index];

            if (reviewResult.codeReview?.threads) {
                for (let i = 0; i < reviewResult.codeReview.threads.length; i++) {
                    const thread = reviewResult.codeReview.threads[i];
                    const filteredThread = filteredReviewResult.codeReview.threads[i];

                    summary.totalComments += thread.comments.length;
                    summary.remainingComments += filteredThread.comments.length;
                    summary.filteredOutComments += thread.comments.length - filteredThread.comments.length;
                }
            }
        }
        return summary;
    }

    /**
     * Loga o resumo da revisão
     */
    private logReviewSummary(summary: {
        totalComments: number;
        remainingComments: number;
        filteredOutComments: number;
    }): void {
        const { logger, config } = this.container;

        logger.info(`\n${'*'.repeat(50)}`);
        logger.info('Review Summary:');
        logger.info(`Confidence mode: ${config.advanced.confidenceMode}`);
        logger.info(`Confidence minimum: ${config.advanced.confidenceMinimum}`);
        logger.info(`Total comments: ${summary.totalComments}`);
        logger.info(
            `Removed comments: ${summary.filteredOutComments} (${(
                summary.totalComments === 0 ? 0 : (summary.filteredOutComments / summary.totalComments) * 100
            ).toFixed(1)}%)`
        );
        logger.info(`Remaining comments: ${summary.remainingComments}`);
        logger.info('*'.repeat(50));
    }
}
