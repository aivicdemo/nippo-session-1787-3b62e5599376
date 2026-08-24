import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Analysis - Extract and Rank Keywords', () => {
  // SCEN-1392: [edge] 重複課題の自動判定と統合機能 - 複数課題が報告された日付が月初を含む場合、統合判定が日付に依存しない
  test('should merge duplicate issues with same keyword and impact score regardless of report dates including month start', () => {
    const analysisStartDate = '2024-02-01T00:00:00Z';
    const analysisEndDate = '2024-02-28T23:59:59Z';

    const reportDataList = [
      {
        id: 'report-001',
        userId: 'user-001',
        teamId: 'team-001',
        reportedAt: '2024-02-01T09:00:00Z',
        yesterdayAccomplishment: 'Investigated system outage',
        todayPlan: 'Continue investigation',
        challenges: 'システム障害が発生し、ユーザーアクセスができない状態が2時間続いた',
        submittedAt: '2024-02-01T08:30:00Z',
        isSubmittedOnTime: true,
      },
      {
        id: 'report-002',
        userId: 'user-002',
        teamId: 'team-001',
        reportedAt: '2024-02-15T09:00:00Z',
        yesterdayAccomplishment: 'Fixed initial issue',
        todayPlan: 'Monitor system',
        challenges: 'システム障害が再度発生した可能性がある',
        submittedAt: '2024-02-15T08:45:00Z',
        isSubmittedOnTime: true,
      },
    ];

    const input: ExtractIssueKeywordsInput = {
      reportDataList,
      analysisStartDate,
      analysisEndDate,
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    const mergedKeyword = result.keywords.find(
      (kw) => kw.keyword === 'システム障害'
    );

    expect(mergedKeyword).toBeDefined();
    expect(mergedKeyword?.frequency).toBe(2);
    expect(mergedKeyword?.priorityScore).toBeGreaterThanOrEqual(70);
    expect(mergedKeyword?.priorityScore).toBeLessThanOrEqual(80);
    expect(['red', 'yellow', 'green']).toContain(mergedKeyword?.priorityColor);

    expect(result.totalIssueCount).toBe(2);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const analysisExecutedAt = new Date(result.analysisExecutedAt);
    expect(analysisExecutedAt.getTime()).toBeGreaterThan(0);

    expect(result.keywords.length).toBeGreaterThanOrEqual(1);
  });
});