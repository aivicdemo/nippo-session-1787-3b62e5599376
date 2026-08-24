import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Issue Keywords', () => {
  // SCEN-1373
  test('should throw validation error when child issues list is empty array', () => {
    const analysisStartDate = '2024-01-01T00:00:00Z';
    const analysisEndDate = '2024-01-07T23:59:59Z';

    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          reportId: 'report-001',
          userId: 'user-001',
          teamId: 'team-001',
          reportDate: '2024-01-05T09:00:00Z',
          yesterday: 'Completed API integration',
          today: 'Testing API endpoints',
          issues: 'Database connection timeout during peak hours',
          submittedAt: '2024-01-05T08:30:00Z',
          isOnTime: true,
        },
        {
          reportId: 'report-002',
          userId: 'user-002',
          teamId: 'team-001',
          reportDate: '2024-01-05T09:00:00Z',
          yesterday: 'Code review completed',
          today: 'Implementing database optimization',
          issues: 'Database connection timeout issues affecting queries',
          submittedAt: '2024-01-05T08:45:00Z',
          isOnTime: true,
        },
      ],
      analysisStartDate: analysisStartDate,
      analysisEndDate: analysisEndDate,
      minFrequencyThreshold: 1,
    };

    expect(() => extractAndRankIssueKeywords(input)).toThrow(/子課題|空|child/i);
  });
});