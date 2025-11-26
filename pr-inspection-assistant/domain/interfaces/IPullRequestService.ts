import { Thread } from '../entities/thread';
import { Comment } from '../entities/comment';
import { IterationRange } from '../entities/iterationRange';

/**
 * Interface para operações com Pull Requests no Azure DevOps
 */
export interface IPullRequestService {
    /**
     * Obtém o ID da última iteração do PR
     */
    getLatestIterationId(): Promise<number>;

    /**
     * Obtém a lista de arquivos modificados em uma iteração
     * @param range Range de iterações
     */
    getIterationFiles(range: IterationRange): Promise<string[]>;

    /**
     * Obtém a última iteração revisada
     */
    getLastReviewedIteration(): Promise<IterationRange>;

    /**
     * Salva a última iteração revisada
     * @param range Range de iterações
     */
    saveLastReviewedIteration(range: IterationRange): Promise<boolean>;

    /**
     * Obtém comentários existentes para um arquivo específico
     * @param fileName Nome do arquivo
     */
    getCommentsForFile(fileName: string): Promise<Comment[]>;

    /**
     * Adiciona uma thread de comentários ao PR
     * @param thread Thread a ser adicionada
     */
    addThread(thread: Thread): Promise<void>;
}
