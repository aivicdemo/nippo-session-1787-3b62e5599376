import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア算出', () => {
  // SCEN-791
  test('[normal] 課題優先度スコア算出機能 - TextAnalysisServiceAdapter.assessImpactScoreが正常応答した場合、返されたスコアが優先度算出に適用される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue({
        impactScore: 75,
      }),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'データベース障害',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'TEAM-A',
    };

    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    ) as IssuePriorityScoringOutput;

    expect(result.issueId).toBe('ISSUE-001');
    expect(result.impactScore).toBe(75);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
    expect(result.priorityScore).toBeGreaterThanOrEqual(1);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
    expect(result.scoreBreakdown).toBeDefined();
    expect(result.scoreBreakdown.impactScore).toBeLessThanOrEqual(40);
  });
});