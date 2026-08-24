import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  // SCEN-1371: [error] 重複課題統合・優先度再計算機能 - 親課題 ID が空文字列のとき統合処理が失敗する
  test('should throw error when parentIssueId is empty string during duplicate issue merge', () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-31T23:59:59Z';

    const mockReportDataList = [
      {
        reportId: 'REPORT-001',
        reportDate: '2024-01-15T09:00:00Z',
        teamId: 'TEAM-001',
        userId: 'USER-001',
        yesterdayContent: 'Completed feature A',
        todayContent: 'Working on feature B',
        issueContent: 'Database connection timeout issue',
        submittedAt: '2024-01-15T09:00:00Z',
        isLate: false,
      },
      {
        reportId: 'REPORT-002',
        reportDate: '2024-01-16T09:00:00Z',
        teamId: 'TEAM-001',
        userId: 'USER-002',
        yesterdayContent: 'Code review completed',
        todayContent: 'Testing module X',
        issueContent: 'Database connection timeout in production',
        submittedAt: '2024-01-16T09:00:00Z',
        isLate: false,
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: mockReportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/parentIssueId|親課題ID|required/i);
  });
});