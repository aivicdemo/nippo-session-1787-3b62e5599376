import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Issue Keywords', () => {
  // SCEN-1368: [error] 重複課題統合・優先度再計算機能 - 統合対象の課題リストが null のとき処理が中断される
  test('should throw ValidationError when issues list parameter is null', () => {
    const input = {
      reportDataList: [
        {
          id: 'report-001',
          teamId: 'team-001',
          reporterId: 'user-001',
          submittedAt: '2024-01-15T09:00:00Z',
          yesterday: 'Completed API integration testing',
          today: 'Deploy to staging environment',
          issues: 'Database connection timeout during load testing',
        },
      ],
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    expect(() => extractAndRankIssueKeywords(input, null as any)).toThrow(
      /null|Invalid|parameter|issues/i,
    );
  });
});