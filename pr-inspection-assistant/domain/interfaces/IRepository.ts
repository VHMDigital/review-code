/**
 * Interface para operações com repositório Git
 */
export interface IRepository {
    /**
     * Inicializa o repositório
     */
    init(): Promise<IRepository>;

    /**
     * Configura o branch atual (útil para modo dev)
     */
    setupCurrentBranch(): Promise<void>;

    /**
     * Obtém o diff de um arquivo específico
     * @param fileName Nome do arquivo
     * @returns Diff em formato string
     */
    getDiff(fileName: string): Promise<string>;

    /**
     * Obtém o branch de destino do PR
     */
    getTargetBranch(): string;
}
