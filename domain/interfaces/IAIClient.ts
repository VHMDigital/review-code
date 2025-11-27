import { Review } from '../entities/review';

/**
 * Interface para clientes de IA (OpenAI, Azure OpenAI, etc)
 * Permite trocar a implementação sem afetar o código que usa
 */
export interface IAIClient {
    /**
     * Realiza a revisão de código usando IA
     * @param diff Diferenças do código em formato git diff
     * @param fileName Nome do arquivo sendo revisado
     * @param existingComments Comentários já existentes para evitar duplicação
     * @returns Objeto Review com threads e comentários
     */
    performCodeReview(diff: string, fileName: string, existingComments: string[]): Promise<Review>;

    /**
     * Verifica se a mensagem excede o limite de tokens
     * @param message Mensagem a ser verificada
     * @returns true se exceder o limite
     */
    exceedsTokenLimit(message: string): boolean;
}
