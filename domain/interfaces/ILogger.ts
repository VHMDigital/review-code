export interface ILogger {
    info(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    warning(message: string, ...args: any[]): void;
    error(message: string, error?: any): void;
    setResult(result: 'succeeded' | 'failed' | 'skipped', message: string): void;
    setProgress(percent: number, message: string): void;
}
