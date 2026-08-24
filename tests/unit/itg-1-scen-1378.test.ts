import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  // SCEN-1378
  test('should reject merged issue data when mergedFlag is not a boolean value', () => {
    const invalidMergedFlags = [
      'true',
      'false',
      1,
      0,
      null,
      undefined,
      {},
      [],
      NaN,
    ];

    invalidMergedFlags.forEach((invalidFlag) => {
      const input: ExtractIssueKeywordsInput = {
        reportDataList: [
          {
            id: 'report-001',
            teamId: 'team-001',
            userId: 'user-001',
            submittedAt: '2024-01-15T08:30:00Z',
            yesterdayAccomplishment: 'Completed API integration',
            todayPlan: 'Testing and deployment',
            issueSummary: 'Database connection timeout',
            createdAt: '2024-01-15T08:00:00Z',
            updatedAt: '2024-01-15T08:30:00Z',
            mergedChildIssueIds: [],
            isMerged: invalidFlag as any,
          } as any,
        ],
        analysisStartDate: '2024-01-08T00:00:00Z',
        analysisEndDate: '2024-01-15T23:59:59Z',
        minFrequencyThreshold: 1,
      };

      expect(() =>
        extractAndRankIssueKeywords(input)
      ).toThrow(/mergedFlag|boolean|merged/i);
    });
  });
});