import { ILogger } from '../../domain/interfaces/ILogger';
import tl from '../../utils/taskWrapper';
export class TaskLogger implements ILogger {
    info(message: string, ...args: any[]): void {
        if (args.length > 0) {
            console.info(message, ...args);
        } else {
            console.info(message);
        }
    }

    debug(message: string, ...args: any[]): void {
        if (args.length > 0) {
            tl.debug(`${message} ${JSON.stringify(args)}`);
        } else {
            tl.debug(message);
        }
    }

    warning(message: string, ...args: any[]): void {
        if (args.length > 0) {
            tl.warning(`${message} ${JSON.stringify(args)}`);
        } else {
            tl.warning(message);
        }
    }

    error(message: string, error?: any): void {
        if (error) {
            tl.error(`${message}: ${JSON.stringify(error)}`);
        } else {
            tl.error(message);
        }
    }

    setResult(result: 'succeeded' | 'failed' | 'skipped', message: string): void {
        const taskResult =
            result === 'succeeded'
                ? tl.TaskResult.Succeeded
                : result === 'failed'
                ? tl.TaskResult.Failed
                : tl.TaskResult.Skipped;

        tl.setResult(taskResult, message);
    }

    setProgress(percent: number, message: string): void {
        tl.setProgress(percent, message);
    }
}
