import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('extractAndRankIssueKeywords', () => {
  // SCEN-1381: [error] 重複課題統合・優先度再計算機能 - 課題の優先度値が文字列型のとき優先度ソートが失敗する
  test('should throw error when issue priority score is string type instead of number', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    const startDate = '2024-01-08T00:00:00Z';
    const endDate = '2024-01-15T23:59:59Z';

    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          reportId: 'report-001',
          userId: 'user-001',
          reportDate: '2024-01-15',
          yesterday: 'Completed API integration',
          today: 'Deploy to staging',
          issues: [
            {
              description: 'Database connection timeout',
              priorityScore: '85' as any,
              frequency: 3,
              impactScore: 90,
            },
            {
              description: 'Memory leak in service',
              priorityScore: 72,
              frequency: 2,
              impactScore: 85,
            },
          ],
          submittedAt: now.toISOString(),
        },
      ],
      analysisStartDate: startDate,
      analysisEndDate: endDate,
      minFrequencyThreshold: 1,
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/優先度/);
  });
});