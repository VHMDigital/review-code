import { Review } from '../entities/review';
export interface IAIClient {
    performCodeReview(diff: string, fileName: string, existingComments: string[]): Promise<Review>;
    exceedsTokenLimit(message: string): boolean;
}
