export class Logger {
    private static flushLogs(): void {
        try {
            process.stdout?.write('');
            process.stderr?.write('');
        } catch {
            // Ignore flush errors
        }
    }

    public static info(message: string, ...args: any[]): void {
        console.log(message, ...args);
        this.flushLogs();
    }

    public static error(message: string, ...args: any[]): void {
        console.log(`##vso[task.logissue type=error]${message}`, ...args);
        this.flushLogs();
    }

    public static warn(message: string, ...args: any[]): void {
        console.log(`##vso[task.logissue type=warning]${message}`, ...args);
        this.flushLogs();
    }

    public static debug(message: string, ...args: any[]): void {
        if (process.env['SYSTEM_DEBUG'] === 'true' || process.env['system.debug'] === 'true') {
            console.log(`##vso[task.debug]${message}`, ...args);
            this.flushLogs();
        }
    }

    public static log(message: string, ...args: any[]): void {
        console.log(message, ...args);
        this.flushLogs();
    }
}
