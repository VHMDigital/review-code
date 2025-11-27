import { Response } from 'node-fetch';
export interface IAzureDevOpsClient {
    get<T = any>(endpoint: string): Promise<T>;
    post(endpoint: string, body: object): Promise<Response>;
    patch(endpoint: string, body: object): Promise<Response>;
    delete(endpoint: string): Promise<Response>;
}
