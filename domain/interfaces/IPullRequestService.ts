import { Thread } from '../entities/thread';
import { Comment } from '../entities/comment';
import { IterationRange } from '../entities/iterationRange';
export interface IPullRequestService {
    getLatestIterationId(): Promise<number>;
    getIterationFiles(range: IterationRange): Promise<string[]>;
    getLastReviewedIteration(): Promise<IterationRange>;
    saveLastReviewedIteration(range: IterationRange): Promise<boolean>;
    getCommentsForFile(fileName: string): Promise<Comment[]>;
    addThread(thread: Thread): Promise<void>;
}
