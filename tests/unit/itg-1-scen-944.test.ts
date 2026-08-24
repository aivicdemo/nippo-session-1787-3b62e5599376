import { calculateIssuePriorityScore, type IssuePriorityScoringInput, type IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア計算', () => {
  // SCEN-944
  test('優先度スコアが負数のとき色分けロジックがエラーを返す', () => {
    const mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn().mockResolvedValue(-5),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout during peak hours',
      occurrenceFrequency: 8,
      impactScore: -5,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2.5,
      reportingDate: '2024-01-15',
      teamId: 'team-eng-01',
    };

    expect(() => {
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter);
    }).toThrow(/priority.*score/i);
  });
});