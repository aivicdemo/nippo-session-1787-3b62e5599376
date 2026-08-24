import { describe, test, expect } from '@jest/globals';
import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('calculateIssuePriorityScore', () => {
  // SCEN-1090: [edge] 課題影響度判定機能 - チーム波及度スコアがちょうど0で判定される
  test('should return priorityScore with impactScore of 0 and classify as lowest priority', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(0),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'サーバー接続エラーが散発的に発生',
      occurrenceFrequency: 3,
      impactScore: 0,
      affectedTeamCount: 0,
      resolutionDaysAverage: 1,
      reportingDate: '2024-01-15',
      teamId: 'team-001',
    };

    const result: IssuePriorityScoringOutput = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    );

    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledWith(
      input.issueContent
    );
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalledTimes(1);

    expect(result.issueId).toBe('issue-001');
    expect(result.priorityScore).toBe(3);
    expect(result.priorityRank).toBe('低');
    expect(result.colorCode).toBe('#00FF00');

    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.frequencyScore).toBe(2);
    expect(result.scoreBreakdown.impactScore).toBe(0);
    expect(result.scoreBreakdown.resolutionDifficultyScore).toBe(1);

    expect(result.calculatedAt).toBeDefined();
    const calculatedAtDate = new Date(result.calculatedAt);
    expect(calculatedAtDate).toBeInstanceOf(Date);
    expect(calculatedAtDate.toISOString()).toBeDefined();
  });
});