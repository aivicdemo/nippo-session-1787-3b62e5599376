import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Same Day Aggregation Period', () => {
  test('SCEN-781: When aggregation period spans same day, only keywords from that day are scored', () => {
    // Arrange: Set up the aggregation period for a single day
    const aggregationStartDate = new Date('2026-08-20T00:00:00Z');
    const aggregationEndDate = new Date('2026-08-20T23:59:59Z');

    // Keywords from the target date (2026-08-20) - 3 keywords
    const targetDateKeywords = [
      {
        keywordId: 'kw-001',
        keyword: 'database-performance',
        reportingDate: '2026-08-20',
        frequency: 3,
      },
      {
        keywordId: 'kw-002',
        keyword: 'memory-leak',
        reportingDate: '2026-08-20',
        frequency: 2,
      },
      {
        keywordId: 'kw-003',
        keyword: 'api-timeout',
        reportingDate: '2026-08-20',
        frequency: 1,
      },
    ];

    // Keywords from the day before (2026-08-19) - 2 keywords (should be excluded)
    const beforeDateKeywords = [
      {
        keywordId: 'kw-004',
        keyword: 'network-latency',
        reportingDate: '2026-08-19',
        frequency: 4,
      },
      {
        keywordId: 'kw-005',
        keyword: 'cache-invalidation',
        reportingDate: '2026-08-19',
        frequency: 3,
      },
    ];

    // Keywords from the day after (2026-08-21) - 2 keywords (should be excluded)
    const afterDateKeywords = [
      {
        keywordId: 'kw-006',
        keyword: 'deployment-failure',
        reportingDate: '2026-08-21',
        frequency: 2,
      },
      {
        keywordId: 'kw-007',
        keyword: 'logging-issue',
        reportingDate: '2026-08-21',
        frequency: 1,
      },
    ];

    // Combine all keywords
    const allKeywords = [
      ...targetDateKeywords,
      ...beforeDateKeywords,
      ...afterDateKeywords,
    ];

    // Mock TextAnalysisServiceAdapter
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(async () => ({
        keywords: allKeywords,
        confidence: 0.85,
      })),
      assessImpactScore: jest.fn(async () => 65),
      classifyIssueSeverity: jest.fn(async () => 'medium'),
    };

    // Act: Call the priority score calculation function with the same-day period
    const result = calculateIssuePriorityScore(
      {
        issueId: 'issue-20260820-001',
        issueContent: 'Daily report issues for 2026-08-20',
        occurrenceFrequency: 6,
        impactScore: 65,
        affectedTeamCount: 2,
        resolutionDaysAverage: 2.5,
        reportingDate: '2026-08-20',
        teamId: 'team-engineering',
      },
      mockTextAnalysisServiceAdapter,
      aggregationStartDate,
      aggregationEndDate
    );

    // Assert: Verify that only keywords from the target date (2026-08-20) are included
    expect(result.scoredKeywords).toBeDefined();
    expect(result.scoredKeywords.length).toBe(3);

    // Verify that all scored keywords belong to the target date
    const scoredKeywordIds = result.scoredKeywords.map(
      (item: { keywordId: string }) => item.keywordId
    );
    expect(scoredKeywordIds).toEqual(
      expect.arrayContaining(['kw-001', 'kw-002', 'kw-003'])
    );
    expect(scoredKeywordIds).not.toContain('kw-004');
    expect(scoredKeywordIds).not.toContain('kw-005');
    expect(scoredKeywordIds).not.toContain('kw-006');
    expect(scoredKeywordIds).not.toContain('kw-007');

    // Verify that each scored keyword has a valid priority score (1-100)
    result.scoredKeywords.forEach((item: { priorityScore: number }) => {
      expect(item.priorityScore).toBeGreaterThanOrEqual(1);
      expect(item.priorityScore).toBeLessThanOrEqual(100);
    });

    // Verify that the result includes metadata about the aggregation period
    expect(result.aggregationPeriodStartDate).toEqual(aggregationStartDate);
    expect(result.aggregationPeriodEndDate).toEqual(aggregationEndDate);
  });
});