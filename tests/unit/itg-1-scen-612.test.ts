import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題優先度スコア計算機能', () => {
  // SCEN-612
  test('[normal] TextAnalysisServiceAdapterが正常応答した場合、課題の影響度スコアが正しく計算される', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockResolvedValue({
        keyword: 'データベース障害',
        impactScore: 75
      }),
      classifyIssueSeverity: jest.fn()
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'データベース障害が発生している',
      occurrenceFrequency: 3,
      impactScore: 75,
      affectedTeamCount: 2,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: 'team-001'
    };

    const result = calculateIssuePriorityScore(
      input,
      mockTextAnalysisServiceAdapter
    ) as IssuePriorityScoringOutput;

    expect(result.issueId).toBe('issue-001');
    expect(result.impactScore).toBe(75);
    expect(result.scoreBreakdown.impactScore).toBe(75);
    expect(mockTextAnalysisServiceAdapter.assessImpactScore).toHaveBeenCalled();
  });
});