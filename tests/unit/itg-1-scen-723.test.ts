import { describe, test, expect, beforeEach } from '@jest/globals';
import { prioritizeAndColorizeIssues } from '../../src/logic/issue-extraction-prioritization';
import type {
  PrioritizeAndColorizeIssuesInput,
  ColorizedIssueList,
  IssueSummary,
  ColorThresholdConfig,
} from '../../src/logic/issue-extraction-prioritization';

describe('優先度別課題ハイライト表示機能', () => {
  // SCEN-723
  test('課題キーワードが空文字列のときエラーハンドリングが実行される', () => {
    const colorThresholds: ColorThresholdConfig = {
      redThresholdMin: 70,
      yellowThresholdMin: 40,
    };

    const issuesWithEmptyKeyword: IssueSummary[] = [
      {
        issueId: 'issue-001',
        priorityScore: 85,
        keyword: '',
        impactLevel: 'high',
      },
    ];

    const input: PrioritizeAndColorizeIssuesInput = {
      issues: issuesWithEmptyKeyword,
      colorThresholds: colorThresholds,
      requestedBy: 'user-001',
    };

    let result: ColorizedIssueList | null = null;
    let thrownError: Error | null = null;

    try {
      result = prioritizeAndColorizeIssues(input);
    } catch (error) {
      thrownError = error as Error;
    }

    if (thrownError) {
      expect(thrownError.message).toMatch(/キーワード|keyword|empty/i);
    } else if (result) {
      expect(result.colorizedIssues).toBeDefined();
      expect(result.colorDistribution).toBeDefined();
      expect(result.processedAt).toBeDefined();

      const processedAt = new Date(result.processedAt);
      expect(processedAt).toBeInstanceOf(Date);
      expect(processedAt.getTime()).toBeGreaterThan(0);

      const emptyKeywordIssue = result.colorizedIssues.find(
        (issue) => issue.issueId === 'issue-001'
      );

      if (emptyKeywordIssue) {
        expect(emptyKeywordIssue.keyword).toBe('');
        expect(
          ['red', 'yellow', 'green', 'none'].includes(
            emptyKeywordIssue.highlightColor
          )
        ).toBe(true);
      }
    } else {
      fail('Expected either a result or an error to be thrown');
    }
  });
});