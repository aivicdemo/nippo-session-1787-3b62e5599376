import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  // SCEN-1383: [error] 重複課題統合・優先度再計算機能 - 複数の子課題のうち一つでも課題 ID が null のとき統合が中止される
  test('should fail with null issue ID in child issues during merge operation', () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const reportDataList = [
      {
        reportId: 'report_001',
        teamId: 'team_A',
        reportedAt: '2024-01-10T09:00:00Z',
        issues: [
          {
            issueId: 'issue_parent_001',
            keyword: 'デプロイメント失敗',
            description: 'デプロイ時に環境変数が正しく設定されていない',
            occurrenceCount: 3,
            impactScore: 75,
            resolutionDifficulty: 45,
          },
          {
            issueId: null as any,
            keyword: 'デプロイメント失敗',
            description: '同じキーワードの別レコード',
            occurrenceCount: 2,
            impactScore: 65,
            resolutionDifficulty: 40,
          },
        ],
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/課題ID/);
  });
});