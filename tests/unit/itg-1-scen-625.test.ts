import { calculateIssuePriorityScore } from '../../src/logic/issue-extraction-prioritization';
import type { IssuePriorityScoringInput } from '../../src/logic/issue-extraction-prioritization';

describe('Issue Priority Score Calculation - Impact Score Validation', () => {
  test('SCEN-625: should throw exception when impact score exceeds 100', () => {
    const mockTextAnalysisServiceAdapter = {
      extractKeywords: jest.fn(),
      assessImpactScore: jest.fn().mockReturnValue(101),
      classifyIssueSeverity: jest.fn(),
    };

    const input: IssuePriorityScoringInput = {
      issueId: 'ISSUE-001',
      issueContent: 'Database connection timeout occurring intermittently',
      occurrenceFrequency: 5,
      impactScore: 101,
      affectedTeamCount: 3,
      resolutionDaysAverage: 2,
      reportingDate: '2024-01-15',
      teamId: 'TEAM-001',
    };

    expect(() =>
      calculateIssuePriorityScore(input, mockTextAnalysisServiceAdapter)
    ).toThrow(/影響度スコアが有効範囲/);
  });
});