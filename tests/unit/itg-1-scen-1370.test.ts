import { extractAndRankIssueKeywords, type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - extractAndRankIssueKeywords', () => {
  // SCEN-1370
  test('should throw validation error when parent issue ID is null during consolidation', () => {
    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: 'report-001',
          teamId: 'team-001',
          userId: 'user-001',
          reportDate: '2024-01-15',
          content: 'データベース接続エラーが発生しました',
          createdAt: '2024-01-15T09:00:00Z',
          updatedAt: '2024-01-15T09:00:00Z',
        },
        {
          id: 'report-002',
          teamId: 'team-001',
          userId: 'user-002',
          reportDate: '2024-01-15',
          content: 'データベース接続タイムアウト問題が継続',
          createdAt: '2024-01-15T09:15:00Z',
          updatedAt: '2024-01-15T09:15:00Z',
        },
        {
          id: 'report-003',
          teamId: 'team-001',
          userId: 'user-003',
          reportDate: '2024-01-15',
          content: 'DB エラーでシステム停止',
          createdAt: '2024-01-15T09:30:00Z',
          updatedAt: '2024-01-15T09:30:00Z',
        },
      ],
      analysisStartDate: '2024-01-15',
      analysisEndDate: '2024-01-15',
      minFrequencyThreshold: 1,
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/親課題ID|parentIssueId|null/i);
  });
});