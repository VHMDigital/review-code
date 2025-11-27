import { InputValues } from '../../domain/entities/inputValues';
import { Comment } from '../../domain/entities/comment';
import { Logger } from './logger';

export class CommentUtils {
    static filterCommentsByInputs(comments: Comment[], inputs: InputValues) {
        if (inputs.confidenceMode) {
            const { filteredOut, remaining } = this.filterCommentsByConfidence(comments, inputs.confidenceMinimum);
            return { filteredOut, remaining };
        }
        return { filteredOut: [], remaining: comments };
    }

    static filterCommentsByConfidence(comments: Comment[], confidenceMinimum: number) {
        const filteredOut: Comment[] = [];
        const remaining: Comment[] = [];
        comments.forEach((comment) => {
            if (comment.confidenceScore !== undefined && comment.confidenceScore < confidenceMinimum) {
                filteredOut.push(comment);
            } else {
                remaining.push(comment);
            }
        });
        return { filteredOut, remaining };
    }

    static getCommentContentForExclusion(
        fileComments: Comment[],
        runComments: Comment[],
        inputs: InputValues,
        deduplicationCriteriaMet: boolean
    ): [string[], boolean] {
        let commentsForExclusion = [...fileComments];
        let dedupeMet = deduplicationCriteriaMet;
        if (inputs.dedupeAcrossFiles) {
            if (!dedupeMet) {
                const currentRunCommentCount = this.filterCommentsByInputs(runComments, inputs).remaining.length;
                Logger.info(`Current run comment count: ${currentRunCommentCount}`);

                if (currentRunCommentCount > inputs.dedupeAcrossFilesThreshold) {
                    dedupeMet = true;
                    Logger.info('Deduplicate comments across files criteria met.');
                } else {
                    Logger.info('Deduplicate comments across files criteria has NOT been met.');
                }
            }
            if (dedupeMet) {
                commentsForExclusion = [...fileComments, ...runComments];
            }
        }
        return [commentsForExclusion.map((comment) => comment.content), dedupeMet];
    }
}
