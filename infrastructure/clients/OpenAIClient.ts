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

        let message = `Your task is to act as a code reviewer of a pull request within Azure DevOps.
        - You are provided with the code changes (diff) in a Unified Diff format.
        - You are provided with a file path (fileName).
        - You are provided with a string array of existing comments (existingComments). Only add new comments for issues not already in existingComments. For each distinct issue, leave a single comment and instruct the author to apply it to all affected areas in the pull request.
        - Do not highlight minor issues and nitpicks.
        ${advanced.confidenceMode
                ? '- For each code review comment you generate, include a (confidenceScore) field that rates your confidence in the likelihood that the comment identifies an actionable issue. Use a scale from 1 to 10, where 1 means very unlikely and 10 means very likely.'
                : ''}
        ${opts.modifiedLinesOnly ? '- Only comment on modified lines.' : ''}
        ${opts.checkBugs ? '- If there are any bugs, highlight them.' : ''}
        ${opts.checkPerformance ? '- If there are major performance problems, highlight them.' : ''}
        ${
            opts.checkBestPractices
                ? '- Provide details on missed use of best-practices.'
                : '- Do not provide comments on best practices.'
        }
        ${advanced.additionalPrompts && advanced.additionalPrompts.length > 0 
            ? advanced.additionalPrompts.map((str) => `- ${str}`).join('\n') 
            : ''}`;

        message += `\n\nThe response should be a single JSON object (without fenced codeblock) and it must use this sample JSON format:
        {
            "threads": [
                {
                    "comments": [
                        {
                            "content": "<Comment in markdown format without markdown fenced codeblock>",
                            "commentType": 2,
                            ${advanced.confidenceMode ? '"confidenceScore": <integer>,' : ''}
                            ${advanced.confidenceMode ? '"confidenceScoreJustification": "<string>",' : ''}
                            "fixSuggestion": "<string: If there is code that can replace the original code and fix the commented issue, provide only the replacement code (no explanations, no comments, and no code fences)>",
                            "issueType": "<string: E.g. performance, security, best-practice, style, code smell, etc.>"
                        }
                    ],
                    "status": 1,
                    "threadContext": {
                        "filePath": "<string: path to file. use filePath that was provided.>",
                        "leftFileStart": {
                            "line": <integer>,
                            "offset": <integer>,
                            "snippet": "<code snippet>"
                        },
                        "leftFileEnd": {
                            "line": <integer>,
                            "offset": <integer>
                        },
                        "rightFileStart": {
                            "line": <integer>,
                            "offset": <integer>,
                            "snippet": "<code snippet>"
                        },
                        "rightFileEnd": {
                            "line": <integer>,
                            "offset": <integer>
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
