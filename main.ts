import { ConfigLoader, ServiceContainer } from './config';
import { ReviewPullRequestUseCase } from './application/usecases/ReviewPullRequestUseCase';

export class Main {
    public static async main(): Promise<void> {
        try {
            console.info('Loading configuration...');
            const config = ConfigLoader.load();
            ConfigLoader.logConfig(config);

            console.info('Initializing services...');
            const container = await ServiceContainer.create(config);

            console.info('Starting Pull Request review...');
            const reviewUseCase = new ReviewPullRequestUseCase(container);
            await reviewUseCase.execute();

        } catch (error) {
            console.error('Fatal error during application execution:', error);
            process.exit(1);
        }
    }
}

Main.main();
