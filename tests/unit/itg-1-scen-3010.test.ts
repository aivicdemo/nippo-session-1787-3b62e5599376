import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Scoring - Edge Case: Threshold Boundary (Impact Score 50)', () => {
  // SCEN-3010
  test('should calculate priority score without rounding when impact score equals threshold boundary of 50', () => {
    const mockTextAnalysisAdapter = {
      extractKeywords: jest.fn().mockResolvedValue({
        keywords: ['システム障害'],
        confidence: 0.95,
      }),
      assessImpactScore: jest.fn().mockResolvedValue({
        impactScore: 50,
        severity: 'medium',
      }),
      classifyIssueSeverity: jest.fn().mockResolvedValue({
        classification: 'medium',
        confidence: 0.92,
      }),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-boundary-001',
      issueContent: 'システム障害が発生しています。全チームに影響があります。',
      occurrenceFrequency: 3,
      impactScore: 50,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-alpha-001',
    };

    const result = calculateIssuePriorityScore(input, mockTextAnalysisAdapter);

    expect(result).toBeDefined();
    expect(result.issueId).toBe('issue-boundary-001');
    expect(result.priorityScore).toBe(50);
    expect(result.priorityRank).toBe('中');
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.frequencyScore).toBeLessThanOrEqual(40);
    expect(result.scoreBreakdown.impactScore).toBe(40);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeGreaterThanOrEqual(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBeLessThanOrEqual(20);
    expect(result.colorCode).toBe('#FFFF00');
    expect(result.calculatedAt).toBeDefined();
    const calculatedDate = new Date(result.calculatedAt);
    expect(calculatedDate.getTime()).toBeGreaterThan(0);
  });
});