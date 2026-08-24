import { describe, test, expect } from '@jest/globals';
import { extractAndRankIssueKeywords } from '../../src/logic/issue-analysis';
import type { ExtractIssueKeywordsInput, RankedIssueKeywordList } from '../../src/logic/issue-analysis';

describe('Issue Keyword Extraction and Ranking', () => {
  test('SCEN-1389: Large-scale duplicate issue detection and merging - 1000 issues processed accurately', () => {
    const largeReportDataList = Array.from({ length: 100 }, (_, reportIdx) => ({
      reportId: `report-${reportIdx}`,
      reportedAt: '2024-01-15T09:00:00Z',
      reporterName: `Engineer-${reportIdx % 10}`,
      yesterdayAccomplishment: `Completed task ${reportIdx}`,
      todayPlan: `Plan for task ${reportIdx}`,
      issues: Array.from({ length: 10 }, (_, issueIdx) => {
        const baseKeywords = [
          'API integration error',
          'Database connection timeout',
          'Memory leak in service',
          'Authentication failure',
          'Performance degradation',
          'Network latency issue',
          'Cache invalidation bug',
          'Concurrency race condition',
          'File permission denied',
          'Dependency version conflict',
        ];
        return baseKeywords[issueIdx];
      }),
    }));

    const input: ExtractIssueKeywordsInput = {
      reportDataList: largeReportDataList,
      analysisStartDate: '2024-01-08T00:00:00Z',
      analysisEndDate: '2024-01-15T23:59:59Z',
      minFrequencyThreshold: 1,
    };

    const result: RankedIssueKeywordList = extractAndRankIssueKeywords(input);

    expect(result).toBeDefined();
    expect(result.keywords).toBeDefined();
    expect(Array.isArray(result.keywords)).toBe(true);

    expect(result.totalIssueCount).toBe(1000);

    expect(result.keywords.length).toBeGreaterThan(0);
    expect(result.keywords.length).toBeLessThanOrEqual(10);

    const firstKeyword = result.keywords[0];
    expect(firstKeyword).toHaveProperty('keyword');
    expect(firstKeyword).toHaveProperty('frequency');
    expect(firstKeyword).toHaveProperty('priorityScore');
    expect(firstKeyword).toHaveProperty('priorityColor');

    expect(typeof firstKeyword.keyword).toBe('string');
    expect(typeof firstKeyword.frequency).toBe('number');
    expect(typeof firstKeyword.priorityScore).toBe('number');
    expect(typeof firstKeyword.priorityColor).toBe('string');

    expect(firstKeyword.frequency).toBe(100);
    expect(firstKeyword.priorityScore).toBeGreaterThanOrEqual(0);
    expect(firstKeyword.priorityScore).toBeLessThanOrEqual(100);

    const validColors = ['red', 'yellow', 'green'];
    expect(validColors).toContain(firstKeyword.priorityColor);

    for (let i = 1; i < result.keywords.length; i++) {
      expect(result.keywords[i].frequency).toBeLessThanOrEqual(
        result.keywords[i - 1].frequency,
      );
    }

    expect(result.analysisExecutedAt).toBeDefined();
    const executedDate = new Date(result.analysisExecutedAt);
    expect(executedDate.getTime()).toBeGreaterThan(0);

    expect(result.dataQualityScore).toBeGreaterThanOrEqual(0);
    expect(result.dataQualityScore).toBeLessThanOrEqual(100);

    const highPriorityKeywords = result.keywords.filter(
      (kw) => kw.priorityColor === 'red',
    );
    const mediumPriorityKeywords = result.keywords.filter(
      (kw) => kw.priorityColor === 'yellow',
    );
    const lowPriorityKeywords = result.keywords.filter(
      (kw) => kw.priorityColor === 'green',
    );

    if (highPriorityKeywords.length > 0 && mediumPriorityKeywords.length > 0) {
      expect(highPriorityKeywords[0].priorityScore).toBeGreaterThanOrEqual(
        mediumPriorityKeywords[0].priorityScore,
      );
    }

    if (mediumPriorityKeywords.length > 0 && lowPriorityKeywords.length > 0) {
      expect(mediumPriorityKeywords[0].priorityScore).toBeGreaterThanOrEqual(
        lowPriorityKeywords[0].priorityScore,
      );
    }
  });
});