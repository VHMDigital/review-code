/**
 * Entry point da aplicação
 * Configuração e inicialização usando arquitetura limpa com injeção de dependências
 */

import { ConfigLoader, ServiceContainer } from './config';
import { ReviewPullRequestUseCase } from './application/usecases/ReviewPullRequestUseCase';

/**
 * Classe principal da aplicação
 * Responsável por inicializar o container e executar o use case principal
 */
export class Main {
    public static async main(): Promise<void> {
        try {
            // 1. Carrega configurações
            console.info('Loading configuration...');
            const config = ConfigLoader.load();
            ConfigLoader.logConfig(config);

            // 2. Cria container com todas as dependências
            console.info('Initializing services...');
            const container = await ServiceContainer.create(config);

            // 3. Executa o use case principal
            console.info('Starting Pull Request review...');
            const reviewUseCase = new ReviewPullRequestUseCase(container);
            await reviewUseCase.execute();

        } catch (error) {
            console.error('Fatal error during application execution:', error);
            process.exit(1);
        }
    }
}

// Executa a aplicação
Main.main();
