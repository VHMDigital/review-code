import { Response } from 'node-fetch';

/**
 * Interface para cliente HTTP do Azure DevOps
 */
export interface IAzureDevOpsClient {
    /**
     * Executa uma requisição GET
     * @param endpoint URL do endpoint
     */
    get<T = any>(endpoint: string): Promise<T>;

    /**
     * Executa uma requisição POST
     * @param endpoint URL do endpoint
     * @param body Corpo da requisição
     */
    post(endpoint: string, body: object): Promise<Response>;

    /**
     * Executa uma requisição PATCH
     * @param endpoint URL do endpoint
     * @param body Corpo da requisição
     */
    patch(endpoint: string, body: object): Promise<Response>;

    /**
     * Executa uma requisição DELETE
     * @param endpoint URL do endpoint
     */
    delete(endpoint: string): Promise<Response>;
}
