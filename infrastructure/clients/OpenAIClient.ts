import { IAIClient } from '../../domain/interfaces/IAIClient';
import { Review } from '../../domain/entities/review';
import { AppConfig } from '../../config/AppConfig';
import { ILogger } from '../../domain/interfaces/ILogger';
import { OpenAI, AzureOpenAI } from 'openai';
import { encode } from 'gpt-tokenizer';
import { CommentLineNumberAndOffsetFixer } from '../../shared/utils';

type Client = OpenAI | AzureOpenAI;

export class OpenAIClient implements IAIClient {
    private readonly _client: Client;
    private readonly _config: AppConfig;
    private readonly _logger: ILogger;
    private readonly _systemMessage: string;
    private readonly _maxTokens: number = 128000;

    constructor(config: AppConfig, logger: ILogger) {
        this._config = config;
        this._logger = logger;
        this._client = this.createClient();
        this._systemMessage = this.buildSystemMessage();
        this._logger.info(`System prompt:\n${this._systemMessage}`);
    }

    private createClient(): Client {
        if (this._config.isAzureOpenAI()) {
            this._logger.info('Using Azure OpenAI');
            return new AzureOpenAI({
                apiKey: this._config.openai.apiKey,
                endpoint: this._config.openai.azureEndpoint,
                apiVersion: this._config.openai.azureApiVersion,
                deployment: this._config.getModelName(),
            });
        } else {
            this._logger.info('Using OpenAI');
            return new OpenAI({ apiKey: this._config.openai.apiKey });
        }
    }

    private buildSystemMessage(): string {
        const opts = this._config.reviewOptions;
        const advanced = this._config.advanced;

        let message = `Você é um revisor de código especializado analisando Pull Requests no Azure DevOps. Todas as suas respostas devem ser em português brasileiro.

        INSTRUÇÕES:
        - Você receberá as alterações de código (diff) em formato Unified Diff
        - Você receberá o caminho do arquivo (fileName)
        - Você receberá um array de comentários existentes (existingComments). Adicione apenas novos comentários para problemas que NÃO estejam em existingComments
        - Para cada problema distinto, deixe um único comentário instruindo o autor a aplicá-lo em todas as áreas afetadas do pull request
        - NÃO destaque problemas menores ou detalhes insignificantes
        ${advanced.confidenceMode
                ? '- Para cada comentário gerado, inclua um campo (confidenceScore) que avalie sua confiança na probabilidade do comentário identificar um problema acionável. Use escala de 1 a 10, onde 1 = muito improvável e 10 = muito provável'
                : ''}
        ${opts.modifiedLinesOnly ? '- Comente APENAS nas linhas modificadas' : ''}
        ${opts.checkBugs ? '- Se houver bugs, destaque-os claramente' : ''}
        ${opts.checkPerformance ? '- Se houver problemas graves de performance, destaque-os' : ''}
        ${
            opts.checkBestPractices
                ? '- Forneça detalhes sobre boas práticas não aplicadas'
                : '- NÃO comente sobre boas práticas'
        }
        ${advanced.additionalPrompts && advanced.additionalPrompts.length > 0 
            ? advanced.additionalPrompts.map((str) => `- ${str}`).join('\n') 
            : ''}

        IMPORTANTE: Todos os comentários devem ser escritos em português brasileiro claro e profissional.`;

        message += `\n\nA resposta deve ser um único objeto JSON (sem blocos de código markdown) e deve usar este formato:
        {
            "threads": [
                {
                    "comments": [
                        {
                            "content": "<Comentário em formato markdown sem blocos de código>",
                            "commentType": 2,
                            ${advanced.confidenceMode ? '"confidenceScore": <inteiro>,' : ''}
                            ${advanced.confidenceMode ? '"confidenceScoreJustification": "<string: justificativa em português>",' : ''}
                            "fixSuggestion": "<string: Se houver código que possa substituir o código original e corrigir o problema comentado, forneça APENAS o código de substituição (sem explicações, sem comentários e sem blocos de código)>",
                            "issueType": "<string: Ex: performance, segurança, boas-práticas, estilo, code-smell, etc.>"
                        }
                    ],
                    "status": 1,
                    "threadContext": {
                        "filePath": "<string: caminho do arquivo. use o filePath fornecido>",
                        "leftFileStart": {
                            "line": <inteiro>,
                            "offset": <inteiro>,
                            "snippet": "<trecho de código>"
                        },
                        "leftFileEnd": {
                            "line": <inteiro>,
                            "offset": <inteiro>
                        },
                        "rightFileStart": {
                            "line": <inteiro>,
                            "offset": <inteiro>,
                            "snippet": "<trecho de código>"
                        },
                        "rightFileEnd": {
                            "line": <inteiro>,
                            "offset": <inteiro>
                        }
                    }
                }
            ]
        }`;

        return message;
    }

    async performCodeReview(diff: string, fileName: string, existingComments: string[]): Promise<Review> {
        const review = await this.sendRequest(diff, fileName, existingComments);

        if (this._config.reviewOptions.enableCommentLineCorrection) {
            CommentLineNumberAndOffsetFixer.fix(review, diff);
        }

        return review;
    }

    private async sendRequest(diff: string, fileName: string, existingComments: string[]): Promise<Review> {
        const emptyReview: Review = { threads: [] };

        if (!fileName.startsWith('/')) {
            fileName = `/${fileName}`;
        }

        const model = this._config.getModelName() as
            | (string & {})
            | 'o4-mini'
            | 'o3-mini'
            | 'o1-mini'
            | 'o1-preview'
            | 'o1'
            | 'gpt-4o'
            | 'gpt-4'
            | 'gpt-3.5-turbo';

        const userPrompt = {
            fileName,
            diff,
            existingComments,
        };

        const prompt = JSON.stringify(userPrompt, null, 4);
        this._logger.info(`Diff:\n${diff}`);

        if (!this.exceedsTokenLimit(this._systemMessage + prompt)) {
            const openAi = await this._client.chat.completions.create({
                messages: [
                    {
                        role:
                            model.includes('o3') || model.includes('o4')
                                ? 'developer'
                                : model === 'o1-preview' || model === 'o1-mini'
                                ? 'assistant'
                                : 'system',
                        content: this._systemMessage,
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                model: model,
            });

            const response = openAi.choices;

            if (response.length > 0) {
                const content = response[0].message.content!;
                this._logger.info(`Comments:\n${content}`);
                try {
                    return JSON.parse(content);
                } catch (error) {
                    this._logger.error(`Failed to parse review response for file ${fileName}. Returning empty review`, error);
                    return emptyReview;
                }
            }
        }

        this._logger.warning(`Unable to process diff for file ${fileName} as it exceeds token limits.`);
        return emptyReview;
    }

    exceedsTokenLimit(message: string): boolean {
        const tokens = encode(message);
        this._logger.info(`Token count: ${tokens.length}`);
        return tokens.length > this._maxTokens;
    }
}
