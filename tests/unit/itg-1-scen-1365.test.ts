import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import { type ExtractIssueKeywordsInput, type RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords with Duplicate Detection', () => {
  // SCEN-1365
  test('should return identical ranking results when extracting keywords from duplicate issue reports idempotently', () => {
    const analysisStartDate = '2024-01-08T00:00:00Z';
    const analysisEndDate = '2024-01-14T23:59:59Z';

    const dailyReportList = [
      {
        reportId: 'report-user-a-1',
        userId: 'user-a',
        reportedAt: '2024-01-12T08:30:00Z',
        yesterdayAccomplishment: 'APIバグ修正',
        todayPlans: 'テスト実施',
        currentChallenges: '本番環境のメモリ不足',
        teamId: 'team-1',
        encryptedContent: null,
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList: dailyReportList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const firstExecution: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(firstExecution).toBeDefined();
    expect(Array.isArray(firstExecution.keywords)).toBe(true);
    expect(firstExecution.keywords.length).toBeGreaterThan(0);
    expect(firstExecution.totalIssueCount).toBe(1);
    expect(typeof firstExecution.analysisExecutedAt).toBe('string');
    expect(firstExecution.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(firstExecution.dataQualityScore).toBeLessThanOrEqual(100);

    const firstKeywordId = firstExecution.keywords[0].keyword;
    const firstFrequency = firstExecution.keywords[0].frequency;
    const firstPriorityScore = firstExecution.keywords[0].priorityScore;
    const firstPriorityColor = firstExecution.keywords[0].priorityColor;

    const secondExecution: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(secondExecution).toBeDefined();
    expect(secondExecution.keywords.length).toBe(firstExecution.keywords.length);
    expect(secondExecution.totalIssueCount).toBe(firstExecution.totalIssueCount);

    expect(secondExecution.keywords[0].keyword).toBe(firstKeywordId);
    expect(secondExecution.keywords[0].frequency).toBe(firstFrequency);
    expect(secondExecution.keywords[0].priorityScore).toBe(firstPriorityScore);
    expect(secondExecution.keywords[0].priorityColor).toBe(firstPriorityColor);

    for (let i = 0; i < firstExecution.keywords.length; i++) {
      expect(secondExecution.keywords[i].keyword).toBe(firstExecution.keywords[i].keyword);
      expect(secondExecution.keywords[i].frequency).toBe(firstExecution.keywords[i].frequency);
      expect(secondExecution.keywords[i].priorityScore).toBe(firstExecution.keywords[i].priorityScore);
      expect(secondExecution.keywords[i].priorityColor).toBe(firstExecution.keywords[i].priorityColor);
    }
  });
});