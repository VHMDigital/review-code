/**
 * Interface para serviço de logging
 */
export interface ILogger {
    /**
     * Registra mensagem de informação
     */
    info(message: string, ...args: any[]): void;

    /**
     * Registra mensagem de debug
     */
    debug(message: string, ...args: any[]): void;

    /**
     * Registra mensagem de warning
     */
    warning(message: string, ...args: any[]): void;

    /**
     * Registra mensagem de erro
     */
    error(message: string, error?: any): void;

    /**
     * Define o resultado da tarefa
     */
    setResult(result: 'succeeded' | 'failed' | 'skipped', message: string): void;

    /**
     * Define o progresso da tarefa
     */
    setProgress(percent: number, message: string): void;
}
