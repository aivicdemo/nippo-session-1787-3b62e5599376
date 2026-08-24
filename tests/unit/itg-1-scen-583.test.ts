import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput, IssuePriorityScoringOutput } from '../../src/logic/issue-extraction-prioritization';

describe('課題の影響度判定と優先度スコア付け機能', () => {
  // SCEN-583
  test('チームIDがundefinedのとき優先度判定エラーが発生する', () => {
    const mockTextAnalysisServiceAdapter = {
      assessImpactScore: jest.fn().mockResolvedValue(75),
      extractKeywords: jest.fn(),
      classifyIssueSeverity: jest.fn(),
    };

    const invalidInput: IssuePriorityScoringInput = {
      issueId: 'issue-001',
      issueContent: 'Database connection timeout',
      occurrenceFrequency: 5,
      impactScore: 75,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15T09:00:00Z',
      teamId: undefined as any,
    };

    expect(() =>
      calculateIssuePriorityScore(invalidInput, mockTextAnalysisServiceAdapter)
    ).toThrow(/チームID|undefined/);
  });
});