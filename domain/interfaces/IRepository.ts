export interface IRepository {
    init(): Promise<IRepository>;
    setupCurrentBranch(): Promise<void>;
    getDiff(fileName: string): Promise<string>;
    getTargetBranch(): string;
}
