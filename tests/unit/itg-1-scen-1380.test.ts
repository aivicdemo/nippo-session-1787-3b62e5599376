import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  // SCEN-1380: [error] 重複課題統合・優先度再計算機能 - 統合後の課題数がゼロのとき一意課題リストの構築が失敗する
  it('should throw EmptyUniqueIssueListError when all issues are deduplicated and result in empty unique list', async () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const reportDataList = [
      {
        reportId: 'report_001',
        reportDate: '2024-01-08T09:00:00Z',
        teamId: 'team_alpha',
        reporterUserId: 'user_001',
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Work on feature B',
        challenges: 'Issue X - recurring problem',
        submittedAt: '2024-01-08T08:30:00Z',
      },
      {
        reportId: 'report_002',
        reportDate: '2024-01-08T09:15:00Z',
        teamId: 'team_alpha',
        reporterUserId: 'user_002',
        yesterdayAccomplishment: 'Completed feature A',
        todayPlan: 'Work on feature B',
        challenges: 'Issue X - recurring problem',
        submittedAt: '2024-01-08T08:45:00Z',
      },
      {
        reportId: 'report_003',
        reportDate: '2024-01-09T09:00:00Z',
        teamId: 'team_alpha',
        reporterUserId: 'user_003',
        yesterdayAccomplishment: 'Continued feature B',
        todayPlan: 'Testing feature C',
        challenges: 'Issue X - same recurring problem',
        submittedAt: '2024-01-09T08:30:00Z',
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    await expect(async () => {
      await extractAndRankIssueKeywords(input);
    }).rejects.toThrow(/一意課題リストが空/);
  });
});