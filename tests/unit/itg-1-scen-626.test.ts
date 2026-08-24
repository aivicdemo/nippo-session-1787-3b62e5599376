import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation with Cache Fallback', () => {
  let mockCache: Map<string, { keywords: Array<{ word: string; frequency: number }>; timestamp: number }>;
  let mockTextAnalysisAdapter: {
    extractKeywords: jest.Mock;
    assessImpactScore: jest.Mock;
    classifyIssueSeverity: jest.Mock;
  };
  let consoleLogSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    mockCache = new Map();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const cacheTimestamp = new Date('2024-01-14T10:00:00Z').getTime();
    mockCache.set('report_keywords_user123', {
      keywords: [
        { word: '遅延', frequency: 3 },
        { word: 'DB接続', frequency: 2 },
      ],
      timestamp: cacheTimestamp,
    });

    mockTextAnalysisAdapter = {
      extractKeywords: jest.fn()
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockRejectedValueOnce(new Error('API timeout'))
        .mockRejectedValueOnce(new Error('API timeout')),
      assessImpactScore: jest.fn().mockResolvedValue(75),
      classifyIssueSeverity: jest.fn().mockResolvedValue('high'),
    };
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  // SCEN-626
  test('should return cached keywords when TextAnalysisServiceAdapter extractKeywords fails after retries', async () => {
    const input: IssuePriorityScoringInput = {
      issueId: 'issue_001',
      issueContent: '昨日はDB接続の遅延対応をした。今日も遅延が発生する可能性がある',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team_dev_001',
    };

    const result = await calculateIssuePriorityScore(
      input,
      mockTextAnalysisAdapter,
      mockCache
    );

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue_001');
    expect(result.priorityScore).toBeDefined();
    expect(typeof result.priorityScore).toBe('number');
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.priorityRank).toMatch(/^(高|中|低)$/);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toMatch(/^#[0-9A-F]{6}$/i);
    expect(result.calculatedAt).toBeDefined();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/extractKeywords failed.*3回再試行後にキャッシュから復帰/)
    );

    expect(mockTextAnalysisAdapter.extractKeywords).toHaveBeenCalledTimes(3);
  });
});