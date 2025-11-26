import { IAzureDevOpsClient } from '../../domain/interfaces/IAzureDevOpsClient';
import { AppConfig } from '../../config/AppConfig';
import { ILogger } from '../../domain/interfaces/ILogger';
import fetch from 'node-fetch';
import { Agent } from 'https';

/**
 * Cliente HTTP para Azure DevOps API
 */
export class AzureDevOpsHttpClient implements IAzureDevOpsClient {
    private readonly _httpsAgent: Agent;
    private readonly _config: AppConfig;
    private readonly _logger: ILogger;

    constructor(config: AppConfig, logger: ILogger) {
        this._config = config;
        this._logger = logger;
        this._httpsAgent = new Agent({
            rejectUnauthorized: false,
        });
    }

    async get<T = any>(endpoint: string): Promise<T> {
        const response = await this.fetch({ endpoint });
        const result = (await response.json()) as T;
        this._logger.debug(`GET result: ${JSON.stringify(result)}`);
        return result;
    }

    async post(endpoint: string, body: object): Promise<fetch.Response> {
        return await this.fetch({
            endpoint,
            method: 'POST',
            body,
        });
    }

    async patch(endpoint: string, body: object): Promise<fetch.Response> {
        return await this.fetch({
            endpoint,
            method: 'PATCH',
            body,
            overrides: {
                headers: {
                    Authorization: `Bearer ${this._config.azureDevOps.accessToken}`,
                    'Content-Type': 'application/json-patch+json',
                },
            },
        });
    }

    async delete(endpoint: string): Promise<fetch.Response> {
        return await this.fetch({
            endpoint,
            method: 'DELETE',
        });
    }

    private async fetch({
        endpoint,
        method = 'GET',
        body,
        overrides,
    }: {
        endpoint: string;
        method?: string;
        body?: any;
        overrides?: fetch.RequestInit;
    }): Promise<fetch.Response> {
        this._logger.debug(`ADO Fetching: ${method} ${endpoint} ${JSON.stringify(body ?? '')}`);
        
        const payload = {
            ...{
                headers: {
                    Authorization: `Bearer ${this._config.azureDevOps.accessToken}`,
                    'Content-Type': 'application/json',
                },
                agent: this._httpsAgent,
                method,
                body: body ? JSON.stringify(body) : undefined,
            },
            ...overrides,
        };
        
        const response = await fetch(endpoint, payload);

        if (!response.ok) {
            this._logger.warning(`ADO Failed to fetch: ${method} ${endpoint}. Response: ${response.statusText}`);
        } else {
            this._logger.debug('ADO Fetch success.');
        }

        return response;
    }
}
