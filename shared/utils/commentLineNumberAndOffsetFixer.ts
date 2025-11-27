import parseGitDiff, { AddedLine, AnyChunk, AnyLineChange, DeletedLine, GitDiff, UnchangedLine } from 'parse-git-diff';
import { Review } from '../../domain/entities/review';

export class CommentLineNumberAndOffsetFixer {
    public static fix(review: Review, diff: string): void {
        if (!review.threads.length) {
            console.info('No threads found in the review. No line numbers to fix.');
            return;
        }

        console.info(`Fixing comment line numbers for review with ${review.threads.length} threads.`);
        const parsedDiff = parseGitDiff(diff);

        for (const thread of review.threads) {
            if (thread.threadContext) {
                console.info(`Thread before: ${JSON.stringify(thread, null, 4)}`);
                CommentLineNumberAndOffsetFixer.fixThreadContextLineNumberAndOffsets(thread.threadContext, parsedDiff, true);
                CommentLineNumberAndOffsetFixer.fixThreadContextLineNumberAndOffsets(thread.threadContext, parsedDiff, false);
                console.info(`Thread after:`, JSON.stringify(thread, null, 4));
            }
        }
    }

    private static fixThreadContextLineNumberAndOffsets(threadContext: any, parsedDiff: GitDiff, isRightSide: boolean): void {
        const fileStart = isRightSide ? threadContext.rightFileStart : threadContext.leftFileStart;
        const fileEnd = isRightSide ? threadContext.rightFileEnd : threadContext.leftFileEnd;
    
        if (fileStart?.snippet?.length) {
            CommentLineNumberAndOffsetFixer.updateFileStartAndEnd(fileStart, fileEnd, parsedDiff, isRightSide);
        }
    }

    private static updateFileStartAndEnd(fileStart: any, fileEnd: any, parsedDiff: GitDiff, isRightSide: boolean): void {
        const snippets = fileStart.snippet.split(/[\r\n]+/);
        const isMultilineSnippet = snippets.length > 1;
        console.info('isMultilineSnippet', isMultilineSnippet);
        const snippetFirst = snippets[0];
        
        const { lineNumber, offset } = CommentLineNumberAndOffsetFixer.getLineNumberAndOffset(parsedDiff, snippetFirst, fileStart.line, isRightSide);
        if (lineNumber === undefined || offset === undefined) {
            console.warn('No line number or offset found for snippet:', snippetFirst, 'line:');
            return;
        }

        fileStart.line = lineNumber;
        fileStart.offset = offset;
        fileEnd.line = lineNumber;
        fileEnd.offset = offset + snippetFirst.length;

        if (isMultilineSnippet) {
            CommentLineNumberAndOffsetFixer.updateFileEndForMultilineSnippet(fileEnd, snippets, parsedDiff, isRightSide);
        }
    }

    private static updateFileEndForMultilineSnippet(fileEnd: any, snippets: string[], parsedDiff: GitDiff, isRightSide: boolean): void {
        const snippetLast = snippets[snippets.length - 1];
        const { lineNumber: lastLineNumber, offset: lastLineOffset } = CommentLineNumberAndOffsetFixer.getLineNumberAndOffset(parsedDiff, snippetLast, fileEnd.line, isRightSide);
        if (lastLineNumber === undefined || lastLineOffset === undefined) {
            console.warn('No line number or offset found for last line of snippet:', snippetLast);
            return;
        }
        fileEnd.line = lastLineNumber;
        fileEnd.offset = lastLineOffset + snippetLast.length;
    }

    private static getLineNumberAndOffset(parsedDiff: GitDiff, searchText: string, originalLineNumber: number, shouldSearchRightSide: boolean = true): { lineNumber: number | undefined, offset: number | undefined } {
        const line = CommentLineNumberAndOffsetFixer.getGitDiffLine(parsedDiff, searchText, originalLineNumber, shouldSearchRightSide);
        if (!line) {
            return { lineNumber: undefined, offset: undefined };
        }
        const lineNumber = CommentLineNumberAndOffsetFixer.getLineNumber(line, shouldSearchRightSide);
        const offset = line.content.indexOf(searchText) + 1;
        return { lineNumber, offset };
    }

    private static getLineNumber(diffLineMeta: AnyLineChange, isRightSide: boolean): number | undefined {
        return isRightSide 
            ? (diffLineMeta as AddedLine | UnchangedLine)?.lineAfter 
            : (diffLineMeta as DeletedLine | UnchangedLine)?.lineBefore;
    }

    private static getGitDiffLine(diff: GitDiff, searchText: string, originalLineNumber: number, shouldSearchRightSide: boolean = true) {
        const changes = CommentLineNumberAndOffsetFixer.getChangesFromDiff(diff);
        const lines = CommentLineNumberAndOffsetFixer.filterChanges(changes, searchText, shouldSearchRightSide);
        const line = CommentLineNumberAndOffsetFixer.findClosestLine(lines, originalLineNumber, shouldSearchRightSide);

        if (!line) {
            CommentLineNumberAndOffsetFixer.logWarnings(searchText, originalLineNumber, shouldSearchRightSide, changes, lines, diff);
        }

        console.info('getGitDiffLine:', line);

        return line;
    }

    private static getChangesFromDiff(diff: GitDiff): AnyLineChange[] {
        if (!diff.files.length) {
            console.warn('No files found in the diff.');
            return [];
        }
        return diff.files[0].chunks.flatMap((chunk) => 'changes' in chunk ? chunk.changes : []);
    }

    private static filterChanges(changes: AnyLineChange[], searchText: string, shouldSearchRightSide: boolean): AnyLineChange[] {
        return changes.filter((change: AnyLineChange) => 
            change.content.includes(searchText) && 
            (change.type === 'UnchangedLine' || change.type === (shouldSearchRightSide ? 'AddedLine' : 'DeletedLine'))
        );
    }

    private static findClosestLine(lines: AnyLineChange[], originalLineNumber: number, shouldSearchRightSide: boolean): AnyLineChange | undefined {
        return lines.reduce((previous: AnyLineChange, current: AnyLineChange) => {
            if (shouldSearchRightSide) {
                const currentLine = current as AddedLine | UnchangedLine;
                const previousLine = previous as AddedLine | UnchangedLine;
                return Math.abs(currentLine.lineAfter - originalLineNumber) < Math.abs(previousLine.lineAfter - originalLineNumber) ? currentLine : previousLine;
            } else {
                const currentLine = current as DeletedLine | UnchangedLine;
                const previousLine = previous as DeletedLine | UnchangedLine;
                return Math.abs(currentLine.lineBefore - originalLineNumber) < Math.abs(previousLine.lineBefore - originalLineNumber) ? currentLine : previousLine;
            }
        }, lines[0]);
    }

    private static logWarnings(searchText: string, originalLineNumber: number, shouldSearchRightSide: boolean, changes: AnyLineChange[], lines: AnyLineChange[], diff: GitDiff): void {
        console.warn('getGitDiffLine: No line found for searchText:', searchText, 'originalLineNumber:', originalLineNumber, 'shouldSearchRightSide:', shouldSearchRightSide);
        console.warn('changes', JSON.stringify(changes, null, 4));
        console.warn('lines', JSON.stringify(lines, null, 4));
        console.warn('diff', JSON.stringify(diff, null, 4));
    }
}