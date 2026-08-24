import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Impact Score Validation', () => {
  // SCEN-1377: [error] Impact score exceeding 100 causes priority score calculation failure
  test('should throw error when impact score exceeds 100 during keyword ranking', async () => {
    const input: ExtractIssueKeywordsInput = {
      reportDataList: [
        {
          id: 'report-001',
          teamId: 'team-001',
          userId: 'user-001',
          submittedAt: '2024-01-15T09:00:00Z',
          yesterdayAccomplishments: 'Completed API integration',
          todayPlans: 'Review pull requests',
          currentIssues: 'Database connection timeout during peak hours',
        },
        {
          id: 'report-002',
          teamId: 'team-001',
          userId: 'user-002',
          submittedAt: '2024-01-15T09:05:00Z',
          yesterdayAccomplishments: 'Fixed UI bugs',
          todayPlans: 'Deploy to staging',
          currentIssues: 'Database connection timeout causing service degradation',
        },
      ],
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    expect(() => {
      extractAndRankIssueKeywords(input);
    }).toThrow(/影響度スコア/);
  });
});